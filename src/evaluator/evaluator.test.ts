import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BooleanObject, IntegerObject, InternalObject } from '../object/object';
import { getProgramAndParser } from '../parser/parser.test';
import { evaluator } from './evaluator';

describe('Evaluator', () => {
  function testEvaluator(input: string) {
    const { program } = getProgramAndParser(input);
    const evaluated = evaluator(program);

    if (evaluated === null) {
      throw new Error('evaluated is null');
    }

    return evaluated;
  }

  function testIntegerObject(object: InternalObject, expected: number) {
    it('object is IntegerObject', () => {
      assert.ok(object instanceof IntegerObject);
    });

    it(`should evaluate to ${expected}`, () => {
      assert.strictEqual(object.inspect(), expected.toString());
    });
  }

  function testBooleanObject(object: InternalObject, expected: boolean) {
    it('object is IntegerObject', () => {
      assert.ok(object instanceof BooleanObject);
    });

    it(`should evaluate to ${expected}`, () => {
      assert.strictEqual(object.inspect(), expected.toString());
    });
  }

  describe('evaluate integer expression', () => {
    const inputs = [
      { input: '5', expected: 5 },
      { input: '10', expected: 10 },
      { input: '-5', expected: -5 },
      { input: '-10', expected: -10 },
      { input: '5 + 5 + 5 + 5 - 10', expected: 10 },
      { input: '2 * 2 * 2 * 2 * 2', expected: 32 },
      { input: '-50 + 100 + -50', expected: 0 },
      { input: '5 * 2 + 10', expected: 20 },
      { input: '5 + 2 * 10', expected: 25 },
      { input: '20 + 2 * -10', expected: 0 },
      { input: '50 / 2 * 2 + 10', expected: 60 },
      { input: '2 * (5 + 10)', expected: 30 },
      { input: '3 * 3 * 3 + 10', expected: 37 },
      { input: '3 * (3 * 3) + 10', expected: 37 },
      { input: '(5 + 10 * 2 + 15 / 3) * 2 + -10', expected: 50 }
    ];

    inputs.forEach(({ input, expected }) => {
      const evaluated = testEvaluator(input);

      testIntegerObject(evaluated, expected);
    });
  });

  describe('evaluate boolean expression', () => {
    const inputs = [
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
      { input: 'false == false', expected: true },
      { input: 'true == false', expected: false },
      { input: 'true != false', expected: true },
      { input: 'false != true', expected: true },
      { input: '(1 < 2) == true', expected: true },
      { input: '(1 < 2) == false', expected: false },
      { input: '(1 > 2) == true', expected: false },
      { input: '(1 > 2) == false', expected: true }
    ];

    inputs.forEach(({ input, expected }) => {
      const evaluated = testEvaluator(input);

      testBooleanObject(evaluated, expected);
    });
  });

  describe('evaluate bang operator', () => {
    const inputs = [
      { input: '!true', expected: false },
      { input: '!false', expected: true },
      { input: '!5', expected: false },
      { input: '!!true', expected: true },
      { input: '!!false', expected: false },
      { input: '!!5', expected: true }
    ];

    inputs.forEach(({ input, expected }) => {
      if (input === '!5') debugger;

      const evaluated = testEvaluator(input);

      testBooleanObject(evaluated, expected);
    });
  });
});
