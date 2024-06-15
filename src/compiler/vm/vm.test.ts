import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NULL } from '../../interpreter/evaluator/defaultObjects';
import { ArrayObject, HashObject, IntegerObject, InternalObject } from '../../interpreter/object/object';
import { parse, testArrayObject, testBooleanObject, testIntegerObject, testStringObject } from '../../testTools';
import { Compiler } from '../compiler/compiler';
import { VM } from './vm';

describe('Test VM', () => {
  function testExpectedObject(expected: unknown, actual: InternalObject) {
    switch (true) {
      case typeof expected === 'number':
        testIntegerObject(actual, expected);
        break;
      case typeof expected === 'boolean':
        testBooleanObject(actual, expected);
        break;
      case typeof expected === 'string':
        testStringObject(actual, expected);
        break;
      case expected === NULL:
        assert.strictEqual(actual, NULL);
        break;
      case Array.isArray(expected):
        testArrayObject(actual, expected);
        expected.forEach((element, index) => {
          testExpectedObject(element, (actual as ArrayObject).elements[index]);
        });
        break;
      case typeof expected === 'object' && expected !== null:
        it('should be a HashObject', () => {
          assert.ok(actual instanceof HashObject);
        });

        it('should have the same number of pairs', () => {
          assert.strictEqual((actual as HashObject).pairs.size, Object.keys(expected).length);
        });

        Object.entries(expected).forEach(([hashKey, value]) => {
          const pair = (actual as HashObject).pairs.get(Number(hashKey));
          it(`should have a pair`, () => {
            assert.notStrictEqual(pair, undefined);
          });

          testExpectedObject(value, pair!.value);
        });
        break;

      default:
        break;
    }
  }

  const tests: { input: string; expected: unknown }[] = [
    { input: '1', expected: 1 },
    { input: '2', expected: 2 },
    { input: '1 + 2', expected: 3 },
    { input: '1 - 2', expected: -1 },
    { input: '1 * 2', expected: 2 },
    { input: '4 / 2', expected: 2 },
    { input: '50 / 2 * 2 + 10 - 5', expected: 55 },
    { input: '5 * (2 + 10)', expected: 60 },
    { input: '5 * 2 + 10', expected: 20 },
    { input: '5 + 2 * 10', expected: 25 },
    { input: '5 * (2 + 10)', expected: 60 },
    { input: 'true', expected: true },
    { input: 'false', expected: false },
    { input: '1 < 2', expected: true },
    { input: '1 > 2', expected: false },
    { input: '1 < 1', expected: false },
    { input: '1 > 1', expected: false },
    { input: '1 == 1', expected: true },
    { input: '1 != 1', expected: false },
    { input: '1 == 2', expected: false },
    { input: '1 != 2', expected: true },
    { input: 'true == true', expected: true },
    { input: 'true != true', expected: false },
    { input: 'true == false', expected: false },
    { input: 'true != false', expected: true },
    { input: 'false == false', expected: true },
    { input: 'false != false', expected: false },
    { input: 'false == true', expected: false },
    { input: 'false != true', expected: true },
    { input: '(1 < 2) == true', expected: true },
    { input: '(1 < 2) == false', expected: false },
    { input: '(1 > 2) == true', expected: false },
    { input: '(1 > 2) == false', expected: true },
    { input: '-5', expected: -5 },
    { input: '-10', expected: -10 },
    { input: '-50 + 100 + -50', expected: 0 },
    { input: '(5 + 10 * 2 + 15 / 3) * 2 + -10', expected: 50 },
    { input: '1 < 2', expected: true },
    { input: '1 > 2', expected: false },
    { input: '1 < 1', expected: false },
    { input: '1 > 1', expected: false },
    { input: '1 == 1', expected: true },
    { input: '1 != 1', expected: false },
    { input: '1 == 2', expected: false },
    { input: '1 != 2', expected: true },
    { input: 'true == true', expected: true },
    { input: '!(1 < 2)', expected: false },
    { input: '!(1 > 2)', expected: true },
    { input: '!(1 == 2)', expected: true },
    { input: '!(1 != 2)', expected: false },
    { input: '!true', expected: false },
    { input: '!false', expected: true },
    { input: '!5', expected: false },
    { input: '!!true', expected: true },
    { input: '!!false', expected: false },
    { input: '!!5', expected: true },
    { input: '!(true == true)', expected: false },
    { input: '!(true == false)', expected: true },
    { input: '!(true != false)', expected: false },
    { input: '!(false == false)', expected: false },
    { input: '!(false != false)', expected: true },
    { input: 'if (true) { 10 }', expected: 10 },
    { input: 'if (true) { 10 } else { 20 }', expected: 10 },
    { input: 'if (false) { 10 } else { 20 }', expected: 20 },
    { input: 'if (1) { 10 }', expected: 10 },
    { input: 'if (1 < 2) { 10 }', expected: 10 },
    { input: 'if (1 < 2) { 10 } else { 20 }', expected: 10 },
    { input: 'if (1 > 2) { 10 } else { 20 }', expected: 20 },
    { input: 'if (1 > 2) { 10 }', expected: NULL },
    { input: 'if (false) { 10 }', expected: NULL },
    { input: '!(if (false) { 5; })', expected: true },
    { input: 'if ((if (false) { 10 })) { 10 } else { 20 }', expected: 20 },
    { input: 'let one = 1; one', expected: 1 },
    { input: 'let one = 1; let two = 2; one + two', expected: 3 },
    { input: 'let one = 1; let two = one + one; one + two', expected: 3 },
    { input: '"monkey"', expected: 'monkey' },
    { input: '"mon" + "key"', expected: 'monkey' },
    { input: '[]', expected: [] },
    { input: '[1, 2, 3]', expected: [1, 2, 3] },
    { input: '[1 + 2, 2 * 3, 3 + 8]', expected: [3, 6, 11] },
    { input: '{}', expected: {} },
    { input: '{1: 2}', expected: { [new IntegerObject(1).hashKey()]: 2 } },
    { input: '{1: 2, 2: 3}', expected: { [new IntegerObject(1).hashKey()]: 2, [new IntegerObject(2).hashKey()]: 3 } },
    {
      input: '{1 + 1: 2 * 2, 3 + 3: 4 * 4}',
      expected: { [new IntegerObject(2).hashKey()]: 4, [new IntegerObject(6).hashKey()]: 16 },
    },
    { input: '[1, 2, 3][0]', expected: 1 },
    { input: '{1: 2, 3: 4, 5: 6}[5]', expected: 6 },
    { input: '[1, 2, 3][3]', expected: NULL },
    { input: '{1: 2}["test"]', expected: NULL },
    { input: '{1: 2}[-1]', expected: NULL },
    { input: '{"one": 1, "two": 2}["o" + "ne"]', expected: 1 },
    { input: '[[1, 1, 1]][0][0]', expected: 1 },
    { input: '[][0]', expected: NULL },
    { input: '{}[0]', expected: NULL },
  ];

  tests.forEach(({ input, expected }) => {
    const program = parse(input);
    const compiler = new Compiler();

    const compileError = compiler.compile(program);
    it('should not throw an error', () => {
      assert.deepEqual(compileError, null);
    });

    const bytecode = compiler.bytecode();
    const vm = new VM(bytecode);

    const runtimeError = vm.run();
    it('should not throw an error', () => {
      assert.deepEqual(runtimeError, null);
    });

    const lastPopped = vm.lastPoppedStackElement()!;
    it('should have a popped element', () => {
      assert.notStrictEqual(lastPopped, null);
    });

    testExpectedObject(expected, lastPopped);
  });
});

