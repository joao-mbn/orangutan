export type Instructions = Uint8Array;

export enum Opcode {
  OpConstant = 0b00000000
}

export interface Definition {
  name: string;
  operandWidths: number[]; // number of bytes that each operand takes
}

const definitions: Record<Opcode, Definition> = {
  [Opcode.OpConstant]: { name: 'OpConstant', operandWidths: [2] }
};

export function make(op: Opcode, ...operands: number[]): Uint8Array {
  const definition = definitions[op];
  if (!definition) {
    return new Uint8Array();
  }

  const opCodeLength = 1;
  const instructionLength = definition.operandWidths.reduce((a, b) => a + b, opCodeLength);

  const instruction = new Uint8Array(instructionLength);

  let offset = opCodeLength;
  operands.forEach((operand, i) => {
    const width = definition.operandWidths[i];

    switch (width) {
      case 2:
        // Break down the Uint16 value into two Uint8 values
        const highByte = (operand & 0xff00) >> 8;
        const lowByte = operand & 0x00ff;

        // Set the high byte and low byte in the Uint8Array, big-endian
        instruction[offset] = highByte;
        instruction[offset + 1] = lowByte;

        offset += width;
        break;
    }
  });

  return instruction;
}

