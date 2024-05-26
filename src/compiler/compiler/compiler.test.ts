import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { testIntegerObject } from '../../interpreter/evaluator/evaluator.test';
import { InternalObject } from '../../interpreter/object/object';
import { getProgramAndParser } from '../../interpreter/parser/parser.test';
import { Instructions, Opcode, concatInstructions, make } from '../code/code';
import { Compiler } from './compiler';

describe('Test Compiler', () => {
  function parse(input: string) {
    return getProgramAndParser(input).program;
  }

  function testInstructions(expected: Instructions[], actual: Instructions) {
    const expectedInstructions = concatInstructions(expected);

    it('should have correct length', () => {
      assert.strictEqual(
        actual.length,
        expectedInstructions.length,
        `wrong instruction length: expected ${expectedInstructions.asString()}, but got ${actual.asString()}`
      );
    });

    expectedInstructions.forEach((expectedByte, i) => {
      it('should have correct bytes', () => {
        assert.strictEqual(
          actual[i],
          expectedByte,
          `wrong byte at position ${i}: expected ${expectedByte.toString(16)}, but got ${actual[i].toString(16)}`
        );
      });
    });
  }

  function testConstants(expected: unknown[], actual: InternalObject[]) {
    it('should have correct length', () => {
      assert.strictEqual(
        actual.length,
        expected.length,
        `wrong constant length: expected ${expected.length}, but got ${actual.length}`
      );
    });

    expected.forEach((expectedConstant, i) => {
      switch (true) {
        case typeof expectedConstant === 'number':
          testIntegerObject(actual[i], expectedConstant);
        default:
          break;
      }
    });
  }

  describe('Test integer arithmetic', () => {
    const tests: { input: string; expectedConstants: unknown[]; expectedInstructions: Instructions[] }[] = [
      {
        input: '1 + 2',
        expectedConstants: [1, 2],
        expectedInstructions: [make(Opcode.OpConstant, 0), make(Opcode.OpConstant, 1)]
      }
    ];

    tests.forEach((tt) => {
      const program = parse(tt.input);
      const compiler = new Compiler();

      const result = compiler.compile(program);
      it('should not throw an error', () => {
        assert.deepEqual(result, null);
      });

      const bytecode = compiler.bytecode();

      testInstructions(tt.expectedInstructions, bytecode.instructions);
      testConstants(tt.expectedConstants, bytecode.constants);
    });
  });
});

