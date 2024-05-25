import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Opcode, make } from './code';

describe('Test Make', () => {
  const tests: { op: Opcode; operands: number[]; expected: Uint8Array }[] = [
    { op: Opcode.OpConstant, operands: [65534], expected: new Uint8Array([0, 255, 254]) }
  ];

  tests.forEach((tt) => {
    const instruction = make(tt.op, ...tt.operands);

    it('should have correct length', () => {
      assert.strictEqual(instruction.length, tt.expected.length);
    });

    it('should have correct bytes', () => {
      tt.expected.forEach((byte, i) => {
        assert.strictEqual(instruction[i], byte);
      });
    });
  });
});

