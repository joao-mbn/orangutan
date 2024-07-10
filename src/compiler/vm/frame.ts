import { ClosureObject } from '../code/code';

export class Frame {
  instructionPointer: number;

  constructor(
    public closure: ClosureObject,
    public basePointer: number,
  ) {
    this.instructionPointer = -1;
  }

  instructions() {
    return this.closure.fn.instructions;
  }
}

