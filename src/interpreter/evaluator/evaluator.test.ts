import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getProgramAndParser,
  testBooleanObject,
  testIntegerObject,
  testNullObject,
  testStringObject,
} from '../../testTools';
import { Environment } from '../object/environment';
import { ArrayObject, ErrorObject, FunctionObject, HashObject, IntegerObject, StringObject } from '../object/object';
import { FALSE_OBJECT, TRUE_OBJECT } from './defaultObjects';
import { evaluator } from './evaluator';

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
      { input: '(5 + 10 * 2 + 15 / 3) * 2 + -10', expected: 50 },
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
      { input: '(1 > 2) == false', expected: true },
      { input: 'true && true', expected: true },
      { input: 'false && true', expected: false },
      { input: 'false && false', expected: false },
      { input: 'false || true', expected: true },
      { input: 'true || true', expected: true },
      { input: 'false || false', expected: false },
      { input: '(true || false) && true', expected: true },
      { input: '(true && false) || true', expected: true },
      { input: '!true && true', expected: false },
      { input: '!(false && false)', expected: true },
      { input: '5 && "hello"', expected: true },
      { input: '5 || "hello"', expected: true },
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
      { input: '!!5', expected: true },
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
      { input: 'if (1 < 2) { 10 } else { 20 }', expected: 10 },
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
      { input: 'if (10 > 1) { if (10 > 1) { return 10; } return 1; }', expected: 10 },
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
        expected: 'unknown operator: BOOLEAN + BOOLEAN',
      },
      { input: 'foobar', expected: 'identifier not found: foobar' },
      { input: '"Hello" - "World"', expected: 'unknown operator: STRING - STRING' },
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
      { input: 'let a = 5; let b = a; let c = a + b + 5; c;', expected: 15 },
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
      { input: 'fn(x) { x; }(5)', expected: 5 },
    ];

    inputs.forEach(({ input, expected }) => {
      const evaluated = testEvaluator(input);

      testIntegerObject(evaluated, expected);
    });
  });

  describe('evaluate strings', () => {
    const input = '"Hello World!"';
    const evaluated = testEvaluator(input);

    testStringObject(evaluated, 'Hello World!');
  });

  describe('evaluate string concatenation', () => {
    const input = '"Hello" + " " + "World!"';
    const evaluated = testEvaluator(input);

    testStringObject(evaluated, 'Hello World!');
  });

  describe('evaluate builtin functions', () => {
    const inputs = [
      { input: 'len("")', expected: 0 },
      { input: 'len("four")', expected: 4 },
      { input: 'len("hello world")', expected: 11 },
      { input: 'len(1)', expected: "argument to 'len' not supported, got INTEGER" },
      { input: 'len("one", "two")', expected: 'wrong number of arguments. got=2, want=1' },
      { input: `len([1, 2, 3])`, expected: 3 },
      { input: `len([])`, expected: 0 },
      { input: `first([1, 2, 3])`, expected: 1 },
      { input: `first([])`, expected: null },
      { input: `first(1)`, expected: "argument to 'first' must be ARRAY, got INTEGER" },
      { input: `last([1, 2, 3])`, expected: 3 },
      { input: `last([])`, expected: null },
      { input: `last(1)`, expected: "argument to 'last' must be ARRAY, got INTEGER" },
      { input: `rest([1, 2, 3])`, expected: [2, 3] },
      { input: `rest([])`, expected: null },
      { input: `push([], 1)`, expected: [1] },
      { input: `push(1, 1)`, expected: "argument to 'push' must be ARRAY, got INTEGER" },
      { input: `puts(1)`, expected: null },
    ];

    inputs.forEach(({ input, expected }) => {
      const evaluated = testEvaluator(input);

      if (typeof expected === 'number') {
        testIntegerObject(evaluated, expected);
      } else if (expected === null) {
        testNullObject(evaluated);
      } else if (Array.isArray(expected)) {
        it('object is ArrayObject', () => {
          assert.ok(evaluated instanceof ArrayObject);
        });

        if (!(evaluated instanceof ArrayObject)) throw new Error();

        it('should have the expected number of elements', () => {
          assert.strictEqual(evaluated.elements.length, expected.length);
        });

        expected.forEach((element, index) => {
          testIntegerObject(evaluated.elements[index], element);
        });
      } else {
        it('object is ErrorObject', () => {
          assert.ok(evaluated instanceof ErrorObject);
        });

        it('should have the expected error message', () => {
          assert.strictEqual(evaluated.inspect(), expected);
        });
      }
    });
  });

  describe('evaluate array literals', () => {
    const input = '[1, 2 * 2, 3 + 3]';
    const evaluated = testEvaluator(input) as ArrayObject;

    it('object is ArrayObject', () => {
      assert.ok(evaluated instanceof ArrayObject);
    });

    it('should have the expected number of elements', () => {
      assert.strictEqual(evaluated.elements.length, 3);
    });

    testIntegerObject(evaluated.elements[0], 1);
    testIntegerObject(evaluated.elements[1], 4);
    testIntegerObject(evaluated.elements[2], 6);
  });

  describe('evaluate array index expressions', () => {
    const inputs = [
      { input: '[1, 2, 3][0]', expected: 1 },
      { input: '[1, 2, 3][1]', expected: 2 },
      { input: '[1, 2, 3][2]', expected: 3 },
      { input: 'let i = 0; [1][i];', expected: 1 },
      { input: '[1, 2, 3][1 + 1];', expected: 3 },
      { input: 'let myArray = [1, 2, 3]; myArray[2];', expected: 3 },
      { input: 'let myArray = [1, 2, 3]; myArray[0] + myArray[1] + myArray[2];', expected: 6 },
      { input: 'let myArray = [1, 2, 3]; let i = myArray[0]; myArray[i]', expected: 2 },
      { input: '[1, 2, 3][3]', expected: null },
      { input: '[1, 2, 3][-1]', expected: null },
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

  describe('evaluate hash index expressions', () => {
    const inputs = [
      { input: '{}["foo"]', expected: null },
      { input: '{ "foo": 5 }["foo"]', expected: 5 },
      { input: '{ "foo": 5 }["bar"]', expected: null },
      { input: 'let key = "foo"; { "foo": 5 }[key]', expected: 5 },
      { input: '{ 5: 5 }[5]', expected: 5 },
      { input: '{ true: 5 }[true]', expected: 5 },
      { input: '{ false: 5 }[false]', expected: 5 },
      { input: '{"name": "Monkey"}[fn(x) { x }];', expected: 'unusable as hash key: FUNCTION_OBJECT' },
    ];

    inputs.forEach(({ input, expected }) => {
      const evaluated = testEvaluator(input);

      if (expected === null) {
        testNullObject(evaluated);
      } else if (typeof expected === 'number') {
        testIntegerObject(evaluated, expected);
      } else {
        it('object is ErrorObject', () => {
          assert.ok(evaluated instanceof ErrorObject);
        });

        it('should have the expected error message', () => {
          assert.strictEqual(evaluated.inspect(), expected);
        });
      }
    });
  });

  describe('evaluate hash keys', () => {
    const hello1 = new StringObject('Hello World');
    const hello2 = new StringObject('Hello World');
    const diff1 = new StringObject('My name is johnny');
    const diff2 = new StringObject('My name is johnny');

    assert.strictEqual(hello1.hashKey(), hello2.hashKey());
    assert.strictEqual(hello1.hashKey(), hello2.hashKey());
    assert.strictEqual(diff1.hashKey(), diff2.hashKey());
    assert.notStrictEqual(hello1.hashKey(), diff1.hashKey());
  });

  describe('evaluate hash literals', () => {
    const input = `let two = "two";
    {
      "one": 10 - 9,
      two: 1 + 1,
      "thr" + "ee": 6 / 2,
      4: 4,
      true: 5,
      false: 6
    }`;

    const evaluated = testEvaluator(input) as HashObject;

    it('object is HashObject', () => {
      assert.ok(evaluated instanceof HashObject);
    });

    const expected = new Map([
      [new StringObject('one').hashKey(), 1],
      [new StringObject('two').hashKey(), 2],
      [new StringObject('three').hashKey(), 3],
      [new IntegerObject(4).hashKey(), 4],
      [TRUE_OBJECT.hashKey(), 5],
      [FALSE_OBJECT.hashKey(), 6],
    ]);

    it('should have the expected number of pairs', () => {
      assert.strictEqual(evaluated.pairs.size, expected.size);
    });

    expected.forEach((value, key) => {
      const pair = evaluated.pairs.get(key)!;

      it('should have the expected key', () => {
        assert.ok(pair);
      });

      testIntegerObject(pair.value, value);
    });
  });

  describe('evaluate reassign statements', () => {
    const inputs = [
      { input: 'let a = 5; a = 10; a;', expected: 10 },
      { input: 'let a = 5; a = 10; let b = a; b;', expected: 10 },
      { input: 'let a = 5; let b = a; a = 10; b;', expected: 5 },
      { input: 'let a = 5; let b = fn() { a = 10; return a; }; b();', expected: 10 },
      { input: 'a = 10', expected: 'variable a reassigned before being declared' },
      { input: 'let a = 10; a = "string"', expected: 'Reassignment mismatch: tried to assign STRING to INTEGER' },
    ];

    inputs.forEach(({ input, expected }) => {
      const evaluated = testEvaluator(input);

      if (typeof expected === 'number') {
        testIntegerObject(evaluated, expected);
      } else {
        it('object is ErrorObject', () => {
          assert.ok(evaluated instanceof ErrorObject);
        });

        it('should have the expected error message', () => {
          assert.strictEqual(evaluated.inspect(), expected);
        });
      }
    });
  });

  describe('evaluate while statements', () => {
    const inputs = [
      { input: 'let a = 0; while (a < 10) { a = a + 1; } a;', expected: 10 },
      { input: 'let a = 0; while (a < 10) { a = a + 1; if (a == 5) { return a; } }', expected: 5 },
      {
        input: 'let a = 0; while (a < 10) { a = a + 1; if (a == 5) { if (true) { return 2; } return a; } }',
        expected: 2,
      },
    ];

    inputs.forEach(({ input, expected }) => {
      const evaluated = testEvaluator(input);

      testIntegerObject(evaluated, expected);
    });
  });
});

