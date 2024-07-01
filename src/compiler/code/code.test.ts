import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFINITIONS, Instructions, Opcode, concatInstructions, make, readOperands } from './code';

describe('Instructions', () => {
  it('outputs correct string', () => {
    const instructions = [
      make(Opcode.OpAdd),
      make(Opcode.OpGetLocal, 1),
      make(Opcode.OpConstant, 2),
      make(Opcode.OpConstant, 65535),
    ];

    const concated = concatInstructions(instructions);

    const expected = `
0000 OpAdd
0001 OpGetLocal 1
0003 OpConstant 2
0006 OpConstant 65535`;

    assert.strictEqual(concated.asString(), expected);
  });
});

describe('make', () => {
  const tests: { op: Opcode; operands: number[]; expected: Uint8Array }[] = [
    { op: Opcode.OpConstant, operands: [65534], expected: new Uint8Array([0, 255, 254]) },
    { op: Opcode.OpAdd, operands: [], expected: new Uint8Array([1]) },
    { op: Opcode.OpGetLocal, operands: [255], expected: new Uint8Array([24, 255]) },
  ];

  tests.forEach((tt) => {
    const instructions = make(tt.op, ...tt.operands);

    it('should have correct length', () => {
      assert.strictEqual(instructions.length, tt.expected.length);
    });

    it('should have correct bytes', () => {
      tt.expected.forEach((byte, i) => {
        assert.strictEqual(instructions[i], byte);
      });
    });
  });
});

describe('readOperands', () => {
  const tests: { op: Opcode; operands: number[]; bytesRead: number }[] = [
    { op: Opcode.OpConstant, operands: [65535], bytesRead: 2 },
    { op: Opcode.OpAdd, operands: [], bytesRead: 0 },
  ];

  tests.forEach((tt) => {
    const definition = DEFINITIONS[tt.op];
    it('the opCode should have a definition', () => {
      assert.ok(definition, `definition for ${tt.op} not found`);
    });

    const instruction = make(tt.op, ...tt.operands);

    const { operands: operandsRead, offset } = readOperands(definition, new Instructions(instruction.slice(1)));
    it('should read the correct number of bytes', () => {
      assert.strictEqual(offset, tt.bytesRead, `read ${offset} bytes, expected ${tt.bytesRead}`);
    });

    operandsRead.forEach((operand, i) => {
      it('should read operands correctly', () => {
        assert.strictEqual(operand, tt.operands[i], `operand ${i} should be ${tt.operands[i]}, but got ${operand}`);
      });
    });
  });
});
