import { CompiledFunction } from '../code/code';

export class Frame {
  instructionPointer: number;

  constructor(public fn: CompiledFunction) {
    this.fn = fn;
    this.instructionPointer = -1;
  }

  instructions() {
    return this.fn.instructions;
  }
}
