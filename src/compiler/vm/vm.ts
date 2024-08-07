import { isTruthy, nativeBooleanToBooleanObject } from '../../interpreter/evaluator/evaluator';
import { builtinRecord } from '../../interpreter/object/builtins';
import { FALSE_OBJECT, NULL, TRUE_OBJECT } from '../../interpreter/object/defaultObjects';
import {
  ArrayObject,
  BuiltinFunctionObject,
  ErrorObject,
  HashObject,
  Hashable,
  IntegerObject,
  InternalObject,
  StringObject,
} from '../../interpreter/object/object';
import { ClosureObject, CompiledFunctionObject, Instructions, Opcode, readUint16 } from '../code/code';
import { Bytecode } from '../compiler/compiler';
import { Frame } from './frame';

const STACK_SIZE = 2048;
const GLOBALS_SIZE = 0xffff; /* OpGetGlobal/OpSetGlobal operand is 16-bits wide */
const CONSTANTS_SIZE = 0xffff; /* OpConstant operand is 16-bits wide */
const MAX_FRAMES = 1024;

export class VM {
  constants: InternalObject[];
  globals: InternalObject[];

  stack: InternalObject[];
  stackPointer: number; // points to the next empty slot

  frames: Frame[];
  framesIndex: number; // points to the next empty slot

  constructor(bytecode: Bytecode, globals: InternalObject[] = new Array(GLOBALS_SIZE).fill(null)) {
    this.constants = [...bytecode.constants, ...new Array(CONSTANTS_SIZE - bytecode.constants.length).fill(null)];
    Object.seal(this.constants);

    this.globals = globals;
    Object.seal(this.globals);

    this.stack = new Array(STACK_SIZE).fill(null);
    Object.seal(this.stack);

    this.stackPointer = 0;

    const mainFunction = new CompiledFunctionObject(
      bytecode.instructions,
      0 /* bogus value, mainFunction represents global scope */,
      0,
    );
    const mainClosure = new ClosureObject(mainFunction, []);
    const mainFrame = new Frame(mainClosure, 0);

    this.frames = new Array(MAX_FRAMES).fill(null);
    this.frames[0] = mainFrame;
    Object.seal(this.frames);

    this.framesIndex = 1;
  }

  stackTop() {
    if (this.stackPointer === 0) {
      return null;
    }

    return this.stack[this.stackPointer - 1];
  }

  run() {
    let instructionPointer: number;
    let instructions: Instructions;
    let opcode: Opcode;

    while (this.currentFrame().instructionPointer < this.currentFrame().instructions().length - 1) {
      this.currentFrame().instructionPointer++;

      instructionPointer = this.currentFrame().instructionPointer;
      instructions = this.currentFrame().instructions();
      opcode = instructions[instructionPointer] as Opcode;

      switch (opcode) {
        case Opcode.OpConstant:
          const constIndex = readUint16(instructions.slice(instructionPointer + 1));
          this.currentFrame().instructionPointer += 2;

          const constant = this.constants[constIndex];
          this.push(constant);

          break;
        case Opcode.OpAdd:
        case Opcode.OpSub:
        case Opcode.OpMul:
        case Opcode.OpDiv:
          this.executeBinaryOperation(opcode);
          break;
        case Opcode.OpPop:
          this.pop();
          break;
        case Opcode.OpTrue:
          this.push(TRUE_OBJECT);
          break;
        case Opcode.OpFalse:
          this.push(FALSE_OBJECT);
          break;
        case Opcode.OpNull:
          this.push(NULL);
          break;
        case Opcode.OpEqual:
        case Opcode.OpNotEqual:
        case Opcode.OpGreaterThan:
          this.executeComparison(opcode);

          break;
        case Opcode.OpMinus:
          const top = this.pop();

          if (!(top instanceof IntegerObject)) {
            throw new Error(`unsupported type for negation: ${top.objectType()}`);
          }

          this.push(new IntegerObject(-top.value));

          break;
        case Opcode.OpBang:
          const operand = this.pop();

          const negated = isTruthy(operand) ? FALSE_OBJECT : TRUE_OBJECT;
          this.push(negated);

          break;
        case Opcode.OpJumpNotTruthy:
          const condition = this.pop();

          if (!isTruthy(condition)) {
            const jumpToIndex = readUint16(instructions.slice(instructionPointer + 1));
            this.currentFrame().instructionPointer = jumpToIndex - 1;
          } else {
            this.currentFrame().instructionPointer += 2;
          }

          break;
        case Opcode.OpJump:
          const jumpToIndex = readUint16(instructions.slice(instructionPointer + 1));
          this.currentFrame().instructionPointer = jumpToIndex - 1; /* it will increment 1 in the loop */

          break;
        case Opcode.OpSetGlobal:
          const globalSetIndex = readUint16(instructions.slice(instructionPointer + 1));
          this.currentFrame().instructionPointer += 2;

          this.globals[globalSetIndex] = this.pop();

          break;
        case Opcode.OpSetLocal:
          const localSetIndex = instructions[instructionPointer + 1];
          this.currentFrame().instructionPointer++;

          this.stack[this.currentFrame().basePointer + localSetIndex] = this.pop();

          break;
        case Opcode.OpGetGlobal:
          const globalGetIndex = readUint16(instructions.slice(instructionPointer + 1));
          this.currentFrame().instructionPointer += 2;

          const global = this.globals[globalGetIndex];

          this.push(global);

          break;
        case Opcode.OpGetLocal:
          const localGetIndex = instructions[instructionPointer + 1];
          this.currentFrame().instructionPointer++;

          const local = this.stack[this.currentFrame().basePointer + localGetIndex];

          this.push(local);

          break;
        case Opcode.OpGetBuiltin:
          const builtinIndex = instructions[instructionPointer + 1];
          this.currentFrame().instructionPointer++;

          const builtin = Object.values(builtinRecord)[builtinIndex];
          if (!builtin) {
            throw new Error(`builtin not found at index: ${builtinIndex}`);
          }

          this.push(builtin);

          break;
        case Opcode.OpGetFree:
          const freeIndex = instructions[instructionPointer + 1];
          this.currentFrame().instructionPointer++;

          const currentClosure = this.currentFrame().closure;
          this.push(currentClosure.free[freeIndex]);

          break;
        case Opcode.OpArray:
          const size = readUint16(instructions.slice(instructionPointer + 1));
          this.currentFrame().instructionPointer += 2;

          const array = new ArrayObject(this.stack.slice(this.stackPointer - size, this.stackPointer));
          this.stackPointer -= size;

          this.push(array);

          break;
        case Opcode.OpHash:
          const sizeHash = readUint16(instructions.slice(instructionPointer + 1));
          this.currentFrame().instructionPointer += 2;

          const elements = this.stack.slice(this.stackPointer - sizeHash, this.stackPointer);
          this.stackPointer -= sizeHash;

          const hash = new Map<number, { key: InternalObject; value: InternalObject }>();
          for (let i = 0; i < elements.length; i += 2) {
            const key = elements[i];
            if (!(key instanceof Hashable)) {
              throw new Error(`unusable as hash key: ${key.objectType()}`);
            }

            const hashKey = key.hashKey();

            const value = elements[i + 1];

            hash.set(hashKey, { key, value });
          }

          this.push(new HashObject(hash));

          break;
        case Opcode.OpIndex:
          const index = this.pop();
          const left = this.pop();

          if (left instanceof ArrayObject && index instanceof IntegerObject) {
            const i = index.value;
            const max = left.elements.length - 1;

            if (i < 0 || i > max) {
              this.push(NULL);
            } else {
              const result = left.elements[index.value];
              this.push(result);
            }
          } else if (left instanceof HashObject && index instanceof Hashable) {
            const pair = left.pairs.get(index.hashKey());
            if (!pair) {
              this.push(NULL);
            } else {
              this.push(pair.value);
            }
          } else {
            throw new Error(`index operator ${index.objectType()} not supported for: ${left.objectType()}`);
          }

          break;
        case Opcode.OpClosure:
          const constIndexClosure = readUint16(instructions.slice(instructionPointer + 1));
          const numberFreeVariables = instructions[instructionPointer + 3];
          this.currentFrame().instructionPointer += 3;

          this.pushClosure(constIndexClosure, numberFreeVariables);

          break;
        case Opcode.OpCurrentClosure:
          this.push(this.currentFrame().closure);

          break;
        case Opcode.OpCall:
          const numberOfArguments = instructions[instructionPointer + 1];
          this.currentFrame().instructionPointer++;

          this.executeCall(numberOfArguments);

          break;
        case Opcode.OpReturnValue:
          const returnValue = this.pop(); /* pops the ReturnValue off of the current frame stack */

          const opReturnValuePoppedFrame = this.popFrame();
          /* pops the CompiledFunction and local bindings off of the outer frame stack */
          this.stackPointer = opReturnValuePoppedFrame.basePointer - 1;

          this.push(returnValue); /* pushes the ReturnValue to the outer frame stack */
          break;
        case Opcode.OpReturn:
          const opReturnPoppedFrame = this.popFrame();
          /* pops the CompiledFunction and local bindings off of the outer frame stack */
          this.stackPointer = opReturnPoppedFrame.basePointer - 1;

          this.push(NULL); /* pushes NULL to the outer frame stack */
          break;
        default:
          throw new Error(`unknown opcode: ${opcode}`);
      }
    }

    return null;
  }

  push(object: InternalObject) {
    if (this.stackPointer >= STACK_SIZE) {
      throw new Error('stack overflow');
    }

    this.stack[this.stackPointer] = object;
    this.stackPointer++;

    return null;
  }

  pushClosure(constIndex: number, numberFreeVariables: number) {
    const constant = this.constants[constIndex];

    if (!(constant instanceof CompiledFunctionObject)) {
      throw new Error(`not a function: ${constant.objectType()}`);
    }

    const freeVariables: InternalObject[] = [];
    for (let i = 0; i < numberFreeVariables; i++) {
      freeVariables.push(this.stack[this.stackPointer - numberFreeVariables + i]);
    }
    this.stackPointer -= numberFreeVariables;

    const closure = new ClosureObject(constant, freeVariables);
    this.push(closure);
  }

  pop() {
    if (this.stackPointer === 0) {
      throw new Error('stack underflow');
    }

    const popped = this.stack[this.stackPointer - 1];

    this.stackPointer--;

    return popped;
  }

  /* As per our convention, stackPointer always points to the next free slot in the stack. This is where a new element would be pushed. But since we only pop elements off the stack by decrementing the stackPointer (without explicitly setting them to null), this is also where we can find the elements that were previously on top of the stack. */
  lastPoppedStackElement() {
    return this.stack[this.stackPointer];
  }

  executeBinaryOperation(opcode: Opcode) {
    const right = this.pop();
    const left = this.pop();

    if (left.objectType() !== right.objectType()) {
      throw new Error(`type mismatch: ${left.objectType()} + ${right.objectType()}`);
    }

    if (left instanceof IntegerObject && right instanceof IntegerObject) {
      return this.executeBinaryIntegerOperation(opcode, left, right);
    } else if (left instanceof StringObject && right instanceof StringObject) {
      return this.executeBinaryStringOperation(opcode, left, right);
    } else {
      throw new Error(`operation unsupported for ${left.objectType()} and ${right.objectType()}`);
    }
  }

  executeBinaryIntegerOperation(opcode: Opcode, left: IntegerObject, right: IntegerObject) {
    switch (opcode) {
      case Opcode.OpAdd:
        return this.push(new IntegerObject(left.value + right.value));
      case Opcode.OpSub:
        return this.push(new IntegerObject(left.value - right.value));
      case Opcode.OpMul:
        return this.push(new IntegerObject(left.value * right.value));
      case Opcode.OpDiv:
        return this.push(new IntegerObject(left.value / right.value));
      default:
        throw new Error(`operation ${opcode} unsupported for integer literals`);
    }
  }

  executeBinaryStringOperation(opcode: Opcode, left: StringObject, right: StringObject) {
    if (opcode !== Opcode.OpAdd) {
      throw new Error(`operation ${opcode} unsupported for string literals`);
    }

    return this.push(new StringObject(left.value + right.value));
  }

  executeComparison(opcode: Opcode) {
    const right = this.pop();
    const left = this.pop();

    if (left.objectType() !== right.objectType()) {
      throw new Error(`type mismatch: ${left.objectType()} + ${right.objectType()}`);
    }

    if (left instanceof IntegerObject && right instanceof IntegerObject) {
      return this.executeIntegerComparison(opcode, left, right);
    }

    switch (opcode) {
      case Opcode.OpEqual:
        return this.push(nativeBooleanToBooleanObject(left === right));
      case Opcode.OpNotEqual:
        return this.push(nativeBooleanToBooleanObject(left !== right));
      case Opcode.OpGreaterThan:
        return this.push(nativeBooleanToBooleanObject(left > right));
      default:
        throw new Error(`operation ${opcode} unsupported for ${left.objectType()} and ${right.objectType()}`);
    }
  }

  executeIntegerComparison(opcode: Opcode, left: IntegerObject, right: IntegerObject) {
    switch (opcode) {
      case Opcode.OpEqual:
        return this.push(nativeBooleanToBooleanObject(left.value === right.value));
      case Opcode.OpNotEqual:
        return this.push(nativeBooleanToBooleanObject(left.value !== right.value));
      case Opcode.OpGreaterThan:
        return this.push(nativeBooleanToBooleanObject(left.value > right.value));
      default:
        throw new Error(`operation ${opcode} unsupported for integer literals`);
    }
  }

  currentFrame() {
    return this.frames[this.framesIndex - 1];
  }

  pushFrame(frame: Frame) {
    this.frames[this.framesIndex] = frame;
    this.framesIndex++;
  }

  popFrame() {
    this.framesIndex--;
    return this.frames[this.framesIndex];
  }

  executeCall(numberOfArguments: number) {
    const callee = this.stack[this.stackPointer - 1 - numberOfArguments];

    switch (true) {
      case callee instanceof ClosureObject:
        this.callClosure(callee, numberOfArguments);
        break;
      case callee instanceof BuiltinFunctionObject:
        this.callBuiltin(callee, numberOfArguments);
        break;
      default:
        throw new Error(`calling non-function and non-builtin`);
    }
  }

  callClosure(callee: ClosureObject, numberOfArguments: number) {
    if (callee.fn.numberParameters !== numberOfArguments) {
      throw new Error(`wrong number of arguments: want=${callee.fn.numberParameters}, got=${numberOfArguments}`);
    }

    const frame = new Frame(callee, this.stackPointer - numberOfArguments);
    this.pushFrame(frame);

    this.stackPointer = frame.basePointer + callee.fn.numberLocals;
  }

  callBuiltin(callee: BuiltinFunctionObject, numberOfArguments: number) {
    const args = this.stack.slice(this.stackPointer - numberOfArguments, this.stackPointer);
    const result = callee.fn(...args);

    this.stackPointer -= numberOfArguments - 1;

    if (result instanceof ErrorObject) {
      throw new Error(result.message);
    } else {
      this.push(result);
    }
  }
}
