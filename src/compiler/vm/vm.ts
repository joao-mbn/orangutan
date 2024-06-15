import { FALSE_OBJECT, NULL, TRUE_OBJECT } from '../../interpreter/evaluator/defaultObjects';
import { isTruthy, nativeBooleanToBooleanObject } from '../../interpreter/evaluator/evaluator';
import { IntegerObject, InternalObject, StringObject } from '../../interpreter/object/object';
import { Instructions, Opcode, readUint16 } from '../code/code';
import { Bytecode } from '../compiler/compiler';

const STACK_SIZE = 2048;
const GLOBALS_SIZE = 0xffff; /* OpGetGlobal/OpSetGlobal operand is 16-bits wide */
const CONSTANTS_SIZE = 0xffff; /* OpConstant operand is 16-bits wide */

export class VM {
  constants: InternalObject[];
  globals: InternalObject[];
  instructions: Instructions;
  stack: InternalObject[];
  stackPointer: number; // points to the next empty slot

  constructor(bytecode: Bytecode, globals: InternalObject[] = new Array(GLOBALS_SIZE).fill(null)) {
    this.instructions = bytecode.instructions;

    this.constants = [...bytecode.constants, ...new Array(CONSTANTS_SIZE - bytecode.constants.length).fill(null)];
    Object.seal(this.constants);

    this.globals = globals;
    Object.seal(this.globals);

    this.stack = new Array(STACK_SIZE).fill(null);
    Object.seal(this.stack);

    this.stackPointer = 0;
  }

  stackTop() {
    if (this.stackPointer === 0) {
      return null;
    }

    return this.stack[this.stackPointer - 1];
  }

  run() {
    for (let instructionPointer = 0; instructionPointer < this.instructions.length; instructionPointer++) {
      const opcode = this.instructions[instructionPointer];
      switch (opcode) {
        case Opcode.OpConstant:
          const constIndex = readUint16(this.instructions.slice(instructionPointer + 1));
          instructionPointer += 2;

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
            const jumpToIndex = readUint16(this.instructions.slice(instructionPointer + 1));
            instructionPointer = jumpToIndex - 1;
          } else {
            instructionPointer += 2;
          }

          break;
        case Opcode.OpJump:
          const jumpToIndex = readUint16(this.instructions.slice(instructionPointer + 1));
          instructionPointer = jumpToIndex - 1; /* it will increment 1 in the loop */

          break;
        case Opcode.OpSetGlobal:
          const globalSetIndex = readUint16(this.instructions.slice(instructionPointer + 1));
          instructionPointer += 2;

          this.globals[globalSetIndex] = this.pop();

          break;
        case Opcode.OpGetGlobal:
          const globalGetIndex = readUint16(this.instructions.slice(instructionPointer + 1));
          instructionPointer += 2;

          const global = this.globals[globalGetIndex];

          this.push(global);

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
}

