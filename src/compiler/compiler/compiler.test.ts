import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { InternalObject } from '../../interpreter/object/object';
import { parse, testIntegerObject, testStringObject } from '../../testTools';
import { CompiledFunction, Instructions, Opcode, concatInstructions, make } from '../code/code';
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
        case typeof expectedConstant === 'string':
          testStringObject(actual[i], expectedConstant);
          break;
        case Array.isArray(expectedConstant) &&
          expectedConstant.every((e): e is Instructions => e instanceof Instructions):
          it('should be a function object', () => {
            assert.ok(actual[i] instanceof CompiledFunction);
          });
          testInstructions(expectedConstant, (actual[i] as CompiledFunction).instructions);
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

  describe('Test string expressions', () => {
    const tests = [
      {
        input: '"monkey"',
        expectedConstants: ['monkey'],
        expectedInstructions: [make(Opcode.OpConstant, 0), make(Opcode.OpPop)],
      },
      {
        input: '"mon" + "key"',
        expectedConstants: ['mon', 'key'],
        expectedInstructions: [
          make(Opcode.OpConstant, 0),
          make(Opcode.OpConstant, 1),
          make(Opcode.OpAdd),
          make(Opcode.OpPop),
        ],
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

  describe('Test global let statements', () => {
    const tests: TestCases = [
      {
        input: 'let one = 1; let two = 2;',
        expectedConstants: [1, 2],
        expectedInstructions: [
          make(Opcode.OpConstant, 0), // 0000
          make(Opcode.OpSetGlobal, 0), // 0003
          make(Opcode.OpConstant, 1), // 0006
          make(Opcode.OpSetGlobal, 1), // 0009
        ],
      },
      {
        input: 'let one = 1; one;',
        expectedConstants: [1],
        expectedInstructions: [
          make(Opcode.OpConstant, 0), // 0000
          make(Opcode.OpSetGlobal, 0), // 0003
          make(Opcode.OpGetGlobal, 0), // 0006
          make(Opcode.OpPop), // 0009
        ],
      },
      {
        input: 'let one = 1; let two = one; two;',
        expectedConstants: [1],
        expectedInstructions: [
          make(Opcode.OpConstant, 0), // 0000
          make(Opcode.OpSetGlobal, 0), // 0003
          make(Opcode.OpGetGlobal, 0), // 0006
          make(Opcode.OpSetGlobal, 1), // 0009
          make(Opcode.OpGetGlobal, 1), // 0012
          make(Opcode.OpPop), // 0015
        ],
      },
      {
        input: 'let x = 33; let y = 66; let z = x + y;',
        expectedConstants: [33, 66],
        expectedInstructions: [
          make(Opcode.OpConstant, 0), // 0000
          make(Opcode.OpSetGlobal, 0), // 0003
          make(Opcode.OpConstant, 1), // 0006
          make(Opcode.OpSetGlobal, 1), // 0009
          make(Opcode.OpGetGlobal, 0), // 0012
          make(Opcode.OpGetGlobal, 1), // 0015
          make(Opcode.OpAdd), // 0018
          make(Opcode.OpSetGlobal, 2), // 0019
        ],
      },
    ];

    testCompiler(tests);
  });

  describe('Test arrays', () => {
    const tests: TestCases = [
      {
        input: '[]',
        expectedConstants: [],
        expectedInstructions: [make(Opcode.OpArray, 0), make(Opcode.OpPop)],
      },
      {
        input: '[1, 2, 3]',
        expectedConstants: [1, 2, 3],
        expectedInstructions: [
          make(Opcode.OpConstant, 0),
          make(Opcode.OpConstant, 1),
          make(Opcode.OpConstant, 2),
          make(Opcode.OpArray, 3),
          make(Opcode.OpPop),
        ],
      },
      {
        input: '[1 + 2, 3 - 4, 5 * 6]',
        expectedConstants: [1, 2, 3, 4, 5, 6],
        expectedInstructions: [
          make(Opcode.OpConstant, 0), // 0000
          make(Opcode.OpConstant, 1), // 0003
          make(Opcode.OpAdd), // 0006
          make(Opcode.OpConstant, 2), // 0007
          make(Opcode.OpConstant, 3), // 0010
          make(Opcode.OpSub), // 0013
          make(Opcode.OpConstant, 4), // 0014
          make(Opcode.OpConstant, 5), // 0017
          make(Opcode.OpMul), // 0020
          make(Opcode.OpArray, 3), // 0021
          make(Opcode.OpPop), // 0024
        ],
      },
    ];

    testCompiler(tests);
  });

  describe('Test hash literals', () => {
    const tests: TestCases = [
      {
        input: '{}',
        expectedConstants: [],
        expectedInstructions: [make(Opcode.OpHash, 0), make(Opcode.OpPop)],
      },
      {
        input: '{1: 2, 2: 3, 3: 4}',
        expectedConstants: [1, 2, 2, 3, 3, 4],
        expectedInstructions: [
          make(Opcode.OpConstant, 0), // 0000
          make(Opcode.OpConstant, 1), // 0003
          make(Opcode.OpConstant, 2), // 0006
          make(Opcode.OpConstant, 3), // 0009
          make(Opcode.OpConstant, 4), // 0012
          make(Opcode.OpConstant, 5), // 0015
          make(Opcode.OpHash, 6), // 0018
          make(Opcode.OpPop), // 0021
        ],
      },
      {
        input: '{1 + 10: 2 * 20, 3 + 30: 4 * 40}',
        expectedConstants: [1, 10, 2, 20, 3, 30, 4, 40],
        expectedInstructions: [
          make(Opcode.OpConstant, 0), // 0000
          make(Opcode.OpConstant, 1), // 0003
          make(Opcode.OpAdd), // 0006
          make(Opcode.OpConstant, 2), // 0007
          make(Opcode.OpConstant, 3), // 0010
          make(Opcode.OpMul), // 0013
          make(Opcode.OpConstant, 4), // 0014
          make(Opcode.OpConstant, 5), // 0017
          make(Opcode.OpAdd), // 0020
          make(Opcode.OpConstant, 6), // 0021
          make(Opcode.OpConstant, 7), // 0024
          make(Opcode.OpMul), // 0027
          make(Opcode.OpHash, 4), // 0028
          make(Opcode.OpPop), // 0031
        ],
      },
    ];

    testCompiler(tests);
  });

  describe('Test index expressions', () => {
    const tests: TestCases = [
      {
        input: '[1, 2, 3][1]',
        expectedConstants: [1, 2, 3, 1],
        expectedInstructions: [
          make(Opcode.OpConstant, 0), // 0000
          make(Opcode.OpConstant, 1), // 0003
          make(Opcode.OpConstant, 2), // 0006
          make(Opcode.OpArray, 3), // 0009
          make(Opcode.OpConstant, 3), // 0012
          make(Opcode.OpIndex), // 0015
          make(Opcode.OpPop), // 0016
        ],
      },
      {
        input: '[1, 2, 3][1 + 1]',
        expectedConstants: [1, 2, 3, 1, 1],
        expectedInstructions: [
          make(Opcode.OpConstant, 0), // 0000
          make(Opcode.OpConstant, 1), // 0003
          make(Opcode.OpConstant, 2), // 0006
          make(Opcode.OpArray, 3), // 0009
          make(Opcode.OpConstant, 3), // 0012
          make(Opcode.OpConstant, 4), // 0015
          make(Opcode.OpAdd), // 0018
          make(Opcode.OpIndex), // 0019
          make(Opcode.OpPop), // 0020
        ],
      },
      {
        input: '{1: 2}[1 - 1]',
        expectedConstants: [1, 2, 1, 1],
        expectedInstructions: [
          make(Opcode.OpConstant, 0), // 0000
          make(Opcode.OpConstant, 1), // 0003
          make(Opcode.OpHash, 2), // 0006
          make(Opcode.OpConstant, 2), // 0009
          make(Opcode.OpConstant, 3), // 0012
          make(Opcode.OpSub), // 0015
          make(Opcode.OpIndex), // 0016
          make(Opcode.OpPop), // 0017
        ],
      },
    ];

    testCompiler(tests);
  });

  describe('Test function literals', () => {
    const inputs: TestCases = [
      {
        input: 'fn () { return 5 + 10; };',
        expectedConstants: [
          5,
          10,
          [make(Opcode.OpConstant, 0), make(Opcode.OpConstant, 1), make(Opcode.OpAdd), make(Opcode.OpReturnValue)],
        ],
        expectedInstructions: [make(Opcode.OpConstant, 2), make(Opcode.OpPop)],
      },
      {
        input: 'fn () { 5 + 10; };',
        expectedConstants: [
          5,
          10,
          [make(Opcode.OpConstant, 0), make(Opcode.OpConstant, 1), make(Opcode.OpAdd), make(Opcode.OpReturnValue)],
        ],
        expectedInstructions: [make(Opcode.OpConstant, 2), make(Opcode.OpPop)],
      },
      {
        input: 'fn () { 1; 2 };',
        expectedConstants: [
          1,
          2,
          [make(Opcode.OpConstant, 0), make(Opcode.OpPop), make(Opcode.OpConstant, 1), make(Opcode.OpReturnValue)],
        ],
        expectedInstructions: [make(Opcode.OpConstant, 2), make(Opcode.OpPop)],
      },
      {
        input: 'fn () { };',
        expectedConstants: [[make(Opcode.OpReturn)]],
        expectedInstructions: [make(Opcode.OpConstant, 0), make(Opcode.OpPop)],
      },
    ];

    testCompiler(inputs);
  });

  describe('Test scopes', () => {
    it('should have correct scope index and instructions', () => {
      const compiler = new Compiler();

      assert.ok(compiler.scopeIndex === 0, `scope index wrong. got=${compiler.scopeIndex}, want=0`);

      compiler.emit(Opcode.OpMul);

      compiler.enterScope();

      assert.ok((compiler.scopeIndex as number) === 1, `scope index wrong. got=${compiler.scopeIndex}, want=1`);

      compiler.emit(Opcode.OpSub);

      assert.ok(compiler.scopes[compiler.scopeIndex].instructions.length === 1);

      const last = compiler.scopes[compiler.scopeIndex].lastInstruction;

      assert.ok(last.opcode === Opcode.OpSub, `last instruction wrong. got=${last.opcode}, want=${Opcode.OpSub}`);

      compiler.leaveScope();

      assert.ok(compiler.scopeIndex === 0, `scope index wrong. got=${compiler.scopeIndex}, want=0`);

      compiler.emit(Opcode.OpAdd);

      assert.ok(compiler.scopes[compiler.scopeIndex].instructions.length === 2);

      const lastOuter = compiler.scopes[compiler.scopeIndex].lastInstruction;

      assert.ok(
        lastOuter.opcode === Opcode.OpAdd,
        `last instruction wrong. got=${lastOuter.opcode}, want=${Opcode.OpAdd}`,
      );

      const previous = compiler.scopes[compiler.scopeIndex].previousInstruction;

      assert.ok(
        previous.opcode === Opcode.OpMul,
        `previous instruction wrong. got=${previous.opcode}, want=${Opcode.OpMul}`,
      );
    });
  });

  describe('Test function calls', () => {
    const tests: TestCases = [
      {
        input: 'fn() { 24 }();',
        expectedConstants: [24, [make(Opcode.OpConstant, 0), make(Opcode.OpReturnValue)]],
        expectedInstructions: [make(Opcode.OpConstant, 1), make(Opcode.OpCall, 0), make(Opcode.OpPop)],
      },
      {
        input: 'let noArg = fn() { 24 }; noArg();',
        expectedConstants: [24, [make(Opcode.OpConstant, 0), make(Opcode.OpReturnValue)]],
        expectedInstructions: [
          make(Opcode.OpConstant, 1),
          make(Opcode.OpSetGlobal, 0),
          make(Opcode.OpGetGlobal, 0),
          make(Opcode.OpCall, 0),
          make(Opcode.OpPop),
        ],
      },
    ];

    testCompiler(tests);
  });

  describe('Test let statements scopes', () => {
    const tests: TestCases = [
      {
        input: 'let num = 55; fn() { num }',
        expectedConstants: [55, [make(Opcode.OpGetGlobal, 0), make(Opcode.OpReturnValue)]],
        expectedInstructions: [
          make(Opcode.OpConstant, 0),
          make(Opcode.OpSetGlobal, 0),
          make(Opcode.OpConstant, 1),
          make(Opcode.OpPop),
        ],
      },
      {
        input: 'fn() { let num = 55; num }',
        expectedConstants: [
          55,
          [
            make(Opcode.OpConstant, 0),
            make(Opcode.OpSetLocal, 0),
            make(Opcode.OpGetLocal, 0),
            make(Opcode.OpReturnValue),
          ],
        ],
        expectedInstructions: [make(Opcode.OpConstant, 1), make(Opcode.OpPop)],
      },
      {
        input: 'fn() { let a = 55; let b = 77; a + b }',
        expectedConstants: [
          55,
          77,
          [
            make(Opcode.OpConstant, 0),
            make(Opcode.OpSetLocal, 0),
            make(Opcode.OpConstant, 1),
            make(Opcode.OpSetLocal, 1),
            make(Opcode.OpGetLocal, 0),
            make(Opcode.OpGetLocal, 1),
            make(Opcode.OpAdd),
            make(Opcode.OpReturnValue),
          ],
        ],
        expectedInstructions: [make(Opcode.OpConstant, 2), make(Opcode.OpPop)],
      },
    ];

    testCompiler(tests);
  });
});
