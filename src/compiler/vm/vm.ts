import { InternalObject } from '../../interpreter/object/object';
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
      switch (opcode) {
        case Opcode.OpConstant:
          const constIndex = readUint16(this.instructions.slice(instructionPointer + 1));
          instructionPointer += 2;

          const constant = this.constants[constIndex];
          const pushError = this.push(constant);
          if (pushError) {
            return pushError;
          }

          break;
        default:
          throw new Error(`unknown opcode: ${opcode}`);
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
}
