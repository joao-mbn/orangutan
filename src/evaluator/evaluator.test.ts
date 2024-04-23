import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Environment } from '../object/environment';
import {
  BooleanObject,
  ErrorObject,
  FunctionObject,
  IntegerObject,
  InternalObject,
  StringObject
} from '../object/object';
import { getProgramAndParser } from '../parser/parser.test';
import { NULL, evaluator } from './evaluator';

describe('Evaluator', () => {
  function testEvaluator(input: string) {
    const { program } = getProgramAndParser(input);
    const environment = new Environment();
    const evaluated = evaluator(program, environment);

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

  function testNullObject(object: InternalObject) {
    it('object is NULL', () => {
      assert.strictEqual(object, NULL);
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
      const evaluated = testEvaluator(input);

      testBooleanObject(evaluated, expected);
    });
  });

  describe('evaluate if expressions', () => {
    const inputs = [
      { input: 'if (true) { 10 }', expected: 10 },
      { input: 'if (false) { 10 }', expected: null },
      { input: 'if (1) { 10 }', expected: 10 },
      { input: 'if (1 < 2) { 10 }', expected: 10 },
      { input: 'if (1 > 2) { 10 }', expected: null },
      { input: 'if (1 > 2) { 10 } else { 20 }', expected: 20 },
      { input: 'if (1 < 2) { 10 } else { 20 }', expected: 10 }
    ];

    inputs.forEach(({ input, expected }) => {
      const evaluated = testEvaluator(input);

      if (expected === null) {
        testNullObject(evaluated);
      } else {
        testIntegerObject(evaluated, expected);
      }
    });
  });

  describe('evaluate return statement', () => {
    const inputs = [
      { input: 'return 10;', expected: 10 },
      { input: 'return 10; 9;', expected: 10 },
      { input: 'return 2 * 5; 9;', expected: 10 },
      { input: '9; return 2 * 5; 9;', expected: 10 },
      { input: 'if (10 > 1) { if (10 > 1) { return 10; } return 1; }', expected: 10 }
    ];

    inputs.forEach(({ input, expected }) => {
      const evaluated = testEvaluator(input);

      testIntegerObject(evaluated, expected);
    });
  });

  describe('evaluate error handling', () => {
    const inputs = [
      { input: '5 + true;', expected: 'type mismatch: INTEGER + BOOLEAN' },
      { input: '5 + true; 5;', expected: 'type mismatch: INTEGER + BOOLEAN' },
      { input: '-true', expected: 'unknown operator: -BOOLEAN' },
      { input: 'true + false;', expected: 'unknown operator: BOOLEAN + BOOLEAN' },
      { input: '5; true + false; 5', expected: 'unknown operator: BOOLEAN + BOOLEAN' },
      { input: 'if (10 > 1) { true + false; }', expected: 'unknown operator: BOOLEAN + BOOLEAN' },
      {
        input: 'if (10 > 1) { if (10 > 1) { return true + false; } return 1; }',
        expected: 'unknown operator: BOOLEAN + BOOLEAN'
      },
      { input: 'foobar', expected: 'identifier not found: foobar' },
      { input: '"Hello" - "World"', expected: 'unknown operator: STRING - STRING' }
    ];

    inputs.forEach(({ input, expected }) => {
      const evaluated = testEvaluator(input);

      it(`object is ErrorObject`, () => {
        assert.ok(evaluated instanceof ErrorObject);
      });

      it('should have the expected error message', () => {
        assert.strictEqual(evaluated.inspect(), expected);
      });
    });
  });

  describe('evaluate let statement', () => {
    const inputs = [
      { input: 'let a = 5; a;', expected: 5 },
      { input: 'let a = 5 * 5; a;', expected: 25 },
      { input: 'let a = 5; let b = a; b;', expected: 5 },
      { input: 'let a = 5; let b = a; let c = a + b + 5; c;', expected: 15 }
    ];

    inputs.forEach(({ input, expected }) => {
      const evaluated = testEvaluator(input);

      testIntegerObject(evaluated, expected);
    });
  });

  describe('evaluate functions', () => {
    const input = 'fn(x) { x + 2; };';
    const evaluated = testEvaluator(input);

    it('object is FunctionObject', () => {
      assert.ok(evaluated instanceof FunctionObject);
    });

    const evaluatedFunction = evaluated as FunctionObject;

    it('should have the expected number parameters', () => {
      assert.strictEqual(evaluatedFunction.parameters.length, 1);
    });

    it('should have the expected parameter name', () => {
      assert.strictEqual(evaluatedFunction.parameters[0].value, 'x');
    });

    it('should have the expected body', () => {
      assert.strictEqual(evaluatedFunction.body.asString(), '{ (x + 2) }');
    });
  });

  describe('evaluate function application', () => {
    const inputs = [
      { input: 'let identity = fn(x) { x; }; identity(5);', expected: 5 },
      { input: 'let identity = fn(x) { return x; }; identity(5);', expected: 5 },
      { input: 'let double = fn(x) { x * 2; }; double(5);', expected: 10 },
      { input: 'let add = fn(x, y) { x + y; }; add(5, 5);', expected: 10 },
      { input: 'let add = fn(x, y) { x + y; }; add(5 + 5, add(5, 5));', expected: 20 },
      { input: 'fn(x) { x; }(5)', expected: 5 }
    ];

    inputs.forEach(({ input, expected }) => {
      const evaluated = testEvaluator(input);

      testIntegerObject(evaluated, expected);
    });
  });

  describe('evaluate strings', () => {
    const input = '"Hello World!"';
    const evaluated = testEvaluator(input);

    it('object is StringObject', () => {
      assert.ok(evaluated instanceof StringObject);
    });

    it(`should evaluate to input`, () => {
      assert.strictEqual(evaluated.inspect(), 'Hello World!');
    });
  });

  describe('evaluate string concatenation', () => {
    const input = '"Hello" + " " + "World!"';
    const evaluated = testEvaluator(input);

    it('object is StringObject', () => {
      assert.ok(evaluated instanceof StringObject);
    });

    it(`should evaluate to input`, () => {
      assert.strictEqual(evaluated.inspect(), 'Hello World!');
    });
  });
});

