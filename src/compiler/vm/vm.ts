import { FALSE_OBJECT, NULL, TRUE_OBJECT } from '../../interpreter/evaluator/defaultObjects';
import { isTruthy, nativeBooleanToBooleanObject } from '../../interpreter/evaluator/evaluator';
import { IntegerObject, InternalObject } from '../../interpreter/object/object';
import { Instructions, Opcode, readUint16 } from '../code/code';
import { Bytecode } from '../compiler/compiler';

const STACK_SIZE = 2048;

export class VM {
  constants: InternalObject[];
  instructions: Instructions;
  stack: InternalObject[];
  stackPointer: number; // points to the next empty slot

  constructor(bytecode: Bytecode) {
    this.constants = bytecode.constants;
    this.instructions = bytecode.instructions;

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
      let error: Error | null = null;
      switch (opcode) {
        case Opcode.OpConstant:
          const constIndex = readUint16(this.instructions.slice(instructionPointer + 1));
          instructionPointer += 2;

          const constant = this.constants[constIndex];
          error = this.push(constant);
          if (error) {
            return error;
          }

          break;
        case Opcode.OpAdd:
        case Opcode.OpSub:
        case Opcode.OpMul:
        case Opcode.OpDiv:
          error = this.executeBinaryOperation(opcode);
          if (error instanceof Error) {
            return error;
          }

          break;
        case Opcode.OpPop:
          const opPopError = this.pop();
          if (opPopError instanceof Error) {
            return opPopError;
          }

          break;
        case Opcode.OpTrue:
          error = this.push(TRUE_OBJECT);
          if (error) {
            return error;
          }
          break;
        case Opcode.OpFalse:
          error = this.push(FALSE_OBJECT);
          if (error) {
            return error;
          }
          break;
        case Opcode.OpNull:
          error = this.push(NULL);
          if (error) {
            return error;
          }
          break;
        case Opcode.OpEqual:
        case Opcode.OpNotEqual:
        case Opcode.OpGreaterThan:
          error = this.executeComparison(opcode);
          if (error instanceof Error) {
            return error;
          }

          break;
        case Opcode.OpMinus:
          const top = this.pop();
          if (top instanceof Error) {
            return top;
          }

          if (!(top instanceof IntegerObject)) {
            return new Error(`unsupported type for negation: ${top.objectType()}`);
          }

          error = this.push(new IntegerObject(-top.value));
          if (error) {
            return error;
          }

          break;
        case Opcode.OpBang:
          const operand = this.pop();
          if (operand instanceof Error) {
            return operand;
          }

          const negated = isTruthy(operand) ? FALSE_OBJECT : TRUE_OBJECT;
          error = this.push(negated);

          if (error) {
            return error;
          }

          break;
        case Opcode.OpJumpNotTruthy:
          const condition = this.pop();
          if (condition instanceof Error) {
            return condition;
          }

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
        default:
          return new Error(`unknown opcode: ${opcode}`);
      }
    }

    return null;
  }

  push(object: InternalObject) {
    if (this.stackPointer >= STACK_SIZE) {
      return new Error('stack overflow');
    }

    this.stack[this.stackPointer] = object;
    this.stackPointer++;

    return null;
  }

  pop() {
    if (this.stackPointer === 0) {
      return new Error('stack underflow');
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
    if (right instanceof Error) {
      return right;
    }
    const left = this.pop();
    if (left instanceof Error) {
      return left;
    }

    if (left.objectType() !== right.objectType()) {
      return new Error(`type mismatch: ${left.objectType()} + ${right.objectType()}`);
    }

    if (left instanceof IntegerObject && right instanceof IntegerObject) {
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
          return new Error(`operation ${opcode} unsupported for integer literals`);
      }
    } else {
      return new Error(`operation unsupported for ${left.objectType()} and ${right.objectType()}`);
    }
  }

  executeComparison(opcode: Opcode) {
    const right = this.pop();
    if (right instanceof Error) {
      return right;
    }
    const left = this.pop();
    if (left instanceof Error) {
      return left;
    }

    if (left.objectType() !== right.objectType()) {
      return new Error(`type mismatch: ${left.objectType()} + ${right.objectType()}`);
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
        return new Error(`operation ${opcode} unsupported for ${left.objectType()} and ${right.objectType()}`);
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
        return new Error(`operation ${opcode} unsupported for integer literals`);
    }
  }
}

