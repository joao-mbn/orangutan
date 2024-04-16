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
      { input: '10', expected: 10 }
    ];

    inputs.forEach(({ input, expected }) => {
      const evaluated = testEvaluator(input);

      testIntegerObject(evaluated, expected);
    });
  });

  describe('evaluate boolean expression', () => {
    const inputs = [
      { input: 'true', expected: true },
      { input: 'false', expected: false }
    ];

    inputs.forEach(({ input, expected }) => {
      const evaluated = testEvaluator(input);

      testBooleanObject(evaluated, expected);
    });
  });
});
