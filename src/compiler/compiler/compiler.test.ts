import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { InternalObject } from '../../interpreter/object/object';
import { parse, testIntegerObject } from '../../testTools';
import { Instructions, Opcode, concatInstructions, make } from '../code/code';
import { Compiler } from './compiler';

type TestCases = { input: string; expectedConstants: unknown[]; expectedInstructions: Instructions[] }[];

describe('Test Compiler', () => {
  function testInstructions(expected: Instructions[], actual: Instructions) {
    const expectedInstructions = concatInstructions(expected);

    it('should have correct length', () => {
      assert.strictEqual(
        actual.length,
        expectedInstructions.length,
        `wrong instruction length!\n expected: ${expectedInstructions.asString()}\n got: ${actual.asString()}`,
      );
    });

    expectedInstructions.forEach((expectedByte, i) => {
      it('should have correct bytes', () => {
        assert.strictEqual(
          actual[i],
          expectedByte,
          `wrong byte at position ${i}: expected ${expectedByte.toString(16)}, but got ${actual[i].toString(16)}`,
        );
      });
    });
  }

  function testConstants(expected: unknown[], actual: InternalObject[]) {
    it('should have correct length', () => {
      assert.strictEqual(
        actual.length,
        expected.length,
        `wrong constant length: expected ${expected.length}, but got ${actual.length}`,
      );
    });

    expected.forEach((expectedConstant, i) => {
      switch (true) {
        case typeof expectedConstant === 'number':
          testIntegerObject(actual[i], expectedConstant);
          break;
        default:
          break;
      }
    });
  }

  function testCompiler(tests: TestCases) {
    tests.forEach((tt) => {
      const program = parse(tt.input);
      const compiler = new Compiler();

      const error = compiler.compile(program);
      it('should not throw an error', () => {
        assert.deepEqual(error, null);
      });

      const bytecode = compiler.bytecode();

      testInstructions(tt.expectedInstructions, bytecode.instructions);
      testConstants(tt.expectedConstants, bytecode.constants);
    });
  }

  describe('Test integer arithmetic', () => {
    const tests: { input: string; expectedConstants: unknown[]; expectedInstructions: Instructions[] }[] = [
      {
        input: '1 + 2',
        expectedConstants: [1, 2],
        expectedInstructions: [
          make(Opcode.OpConstant, 0),
          make(Opcode.OpConstant, 1),
          make(Opcode.OpAdd),
          make(Opcode.OpPop),
        ],
      },
      {
        input: '1; 2',
        expectedConstants: [1, 2],
        expectedInstructions: [
          make(Opcode.OpConstant, 0),
          make(Opcode.OpPop),
          make(Opcode.OpConstant, 1),
          make(Opcode.OpPop),
        ],
      },
      {
        input: '1 - 2',
        expectedConstants: [1, 2],
        expectedInstructions: [
          make(Opcode.OpConstant, 0),
          make(Opcode.OpConstant, 1),
          make(Opcode.OpSub),
          make(Opcode.OpPop),
        ],
      },
      {
        input: '1 * 2',
        expectedConstants: [1, 2],
        expectedInstructions: [
          make(Opcode.OpConstant, 0),
          make(Opcode.OpConstant, 1),
          make(Opcode.OpMul),
          make(Opcode.OpPop),
        ],
      },
      {
        input: '2 / 1',
        expectedConstants: [2, 1],
        expectedInstructions: [
          make(Opcode.OpConstant, 0),
          make(Opcode.OpConstant, 1),
          make(Opcode.OpDiv),
          make(Opcode.OpPop),
        ],
      },
      {
        input: '-1',
        expectedConstants: [1],
        expectedInstructions: [make(Opcode.OpConstant, 0), make(Opcode.OpMinus), make(Opcode.OpPop)],
      },
    ];

    testCompiler(tests);
  });

  describe('Test boolean expressions', () => {
    const tests = [
      {
        input: 'true',
        expectedConstants: [],
        expectedInstructions: [make(Opcode.OpTrue), make(Opcode.OpPop)],
      },
      {
        input: 'false',
        expectedConstants: [],
        expectedInstructions: [make(Opcode.OpFalse), make(Opcode.OpPop)],
      },
    ];

    testCompiler(tests);
  });

  describe('Test comparisons', () => {
    const tests = [
      {
        input: '1 > 2',
        expectedConstants: [1, 2],
        expectedInstructions: [
          make(Opcode.OpConstant, 0),
          make(Opcode.OpConstant, 1),
          make(Opcode.OpGreaterThan),
          make(Opcode.OpPop),
        ],
      },
      {
        input: '1 < 2',
        expectedConstants: [2, 1],
        expectedInstructions: [
          make(Opcode.OpConstant, 0),
          make(Opcode.OpConstant, 1),
          make(Opcode.OpGreaterThan),
          make(Opcode.OpPop),
        ],
      },
      {
        input: '1 == 2',
        expectedConstants: [1, 2],
        expectedInstructions: [
          make(Opcode.OpConstant, 0),
          make(Opcode.OpConstant, 1),
          make(Opcode.OpEqual),
          make(Opcode.OpPop),
        ],
      },
      {
        input: '1 != 2',
        expectedConstants: [1, 2],
        expectedInstructions: [
          make(Opcode.OpConstant, 0),
          make(Opcode.OpConstant, 1),
          make(Opcode.OpNotEqual),
          make(Opcode.OpPop),
        ],
      },
      {
        input: 'true == false',
        expectedConstants: [],
        expectedInstructions: [make(Opcode.OpTrue), make(Opcode.OpFalse), make(Opcode.OpEqual), make(Opcode.OpPop)],
      },
      {
        input: 'true != false',
        expectedConstants: [],
        expectedInstructions: [make(Opcode.OpTrue), make(Opcode.OpFalse), make(Opcode.OpNotEqual), make(Opcode.OpPop)],
      },

      {
        input: '!true',
        expectedConstants: [],
        expectedInstructions: [make(Opcode.OpTrue), make(Opcode.OpBang), make(Opcode.OpPop)],
      },
    ];

    testCompiler(tests);
  });

  describe('Test conditionals', () => {
    const tests: TestCases = [
      {
        input: 'if (true) { 10 }; 3333;',
        expectedConstants: [10, 3333],
        expectedInstructions: [
          make(Opcode.OpTrue), // 0000
          make(Opcode.OpJumpNotTruthy, 10), // 0001
          make(Opcode.OpConstant, 0), // 0004
          make(Opcode.OpJump, 11), // 0007
          make(Opcode.OpNull), // 0010
          make(Opcode.OpPop), // 0011
          make(Opcode.OpConstant, 1), // 0012
          make(Opcode.OpPop), // 0015
        ],
      },
      {
        input: 'if (true) { 10 } else { 20 }; 3333;',
        expectedConstants: [10, 20, 3333],
        expectedInstructions: [
          make(Opcode.OpTrue), // 0000
          make(Opcode.OpJumpNotTruthy, 10), // 0001
          make(Opcode.OpConstant, 0), // 0004
          make(Opcode.OpJump, 13), // 0007
          make(Opcode.OpConstant, 1), // 0010
          make(Opcode.OpPop), // 0013
          make(Opcode.OpConstant, 2), // 0014
          make(Opcode.OpPop), // 0017
        ],
      },
    ];

    testCompiler(tests);
  });
});

