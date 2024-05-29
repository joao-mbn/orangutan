export enum Opcode {
  OpConstant = 0,
  OpAdd = 1
}

export interface Definition {
  name: string;
  operandWidths: number[]; // number of bytes that each operand takes
}

export const DEFINITIONS: Record<Opcode, Definition> = {
  [Opcode.OpConstant]: { name: 'OpConstant', operandWidths: [2] },
  [Opcode.OpAdd]: { name: 'OpAdd', operandWidths: [] }
};

export class Instructions extends Uint8Array {
  constructor(length: number);
  constructor(array: Iterable<number>);
  constructor(buffer: ArrayBuffer, byteOffset?: number, length?: number);
  constructor(...args: [number] | [Iterable<number>] | [ArrayBuffer, number?, number?]) {
    switch (true) {
      case args.length === 1 && typeof args[0] === 'number':
        super(args[0]);
        break;
      case args.length === 1 && Symbol.iterator in Object(args[0]):
        super(args[0] as Iterable<number>);
        break;
      case args.length >= 1 && args.length <= 3 && args[0] instanceof ArrayBuffer:
        super(args[0] as ArrayBuffer, args[1] as number | undefined, args[2] as number | undefined);
        break;
      default:
        throw new Error('Invalid arguments');
    }
  }

  asString() {
    let string = '';
    let i = 0;

    while (i < this.length) {
      const opCode = this[i] as Opcode;
      const definition = DEFINITIONS[opCode];
      if (!definition) {
        string += `ERROR: opcode ${this[i]} is not defined\n`;
        continue;
      }

      const { operands, offset } = readOperands(definition, new Instructions(this.slice(i + 1)));
      const formatted = this.formatInstruction(definition, operands);

      string += `\n${i.toString().padStart(4, '0')} ${formatted}`;
      i += offset + 1;
    }

    return string;
  }

  formatInstruction(definition: Definition, operands: number[]): string {
    const operandCount = definition.operandWidths.length;
    if (operandCount !== operands.length) {
      return `ERROR: operand len ${operands.length} does not match definition ${operandCount}`;
    }

    switch (operandCount) {
      case 0:
        return definition.name;
      case 1:
        return `${definition.name} ${operands[0]}`;
      default:
        return `ERROR: unhandled operandCount of ${operandCount}`;
    }
  }

  slice(start?: number | undefined, end?: number | undefined) {
    const result = super.slice(start, end);

    return new Instructions(result);
  }
}

export function concatInstructions(instructions: Instructions[]) {
  const mergeLength = instructions.reduce((acc, cur) => acc + cur.length, 0);
  const merged = new Instructions(mergeLength);

  let offset = 0;
  instructions.forEach((instruction) => {
    merged.set(instruction, offset);
    offset += instruction.length;
  });

  return merged;
}

export function make(op: Opcode, ...operands: number[]): Instructions {
  const definition = DEFINITIONS[op];
  if (!definition) {
    return new Instructions(0);
  }

  const opCodeLength = 1;
  const instructionLength = definition.operandWidths.reduce((a, b) => a + b, opCodeLength);

  const instructions = new Instructions(instructionLength);
  instructions[0] = op;

  let offset = opCodeLength;
  operands.forEach((operand, i) => {
    const width = definition.operandWidths[i];

    switch (width) {
      case 2:
        // Break down the Uint16 value into two Uint8 values
        const highByte = operand >> 8;
        const lowByte = operand & 0x00ff;

        // Set the high byte and low byte in the Uint8Array, big-endian
        instructions[offset] = highByte;
        instructions[offset + 1] = lowByte;

        offset += width;
        break;
    }
  });

  return instructions;
}

export function readOperands(
  definition: Definition,
  instructions: Instructions
): { operands: number[]; offset: number } {
  const operands: number[] = [];

  let offset = 0;

  definition.operandWidths.forEach((width) => {
    const slice = instructions.slice(offset, offset + width);

    switch (width) {
      case 2:
        const operand = readUint16(slice);
        operands.push(operand);

        offset += width;
        break;
    }
  });

  return { operands, offset };
}

export function readUint16(slice: Instructions): number {
  return (slice[0] << 8) | slice[1];
}
