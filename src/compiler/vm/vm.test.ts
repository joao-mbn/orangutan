import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NULL } from '../../interpreter/object/defaultObjects';
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
    { input: 'let fivePlusTen = fn() { 5 + 10; }; fivePlusTen();', expected: 15 },
    { input: 'let one = fn() { 1; }; let two = fn() { 2; }; one() + two();', expected: 3 },
    { input: 'let a = fn() { 1; }; let b = fn() { a() + 1 }; let c = fn() { b() + 1 }; c();', expected: 3 },
    { input: 'let earlyExit = fn() { return 99; 100; }; earlyExit();', expected: 99 },
    { input: 'let earlyExit = fn() { return 99; return 100; }; earlyExit();', expected: 99 },
    { input: 'let noReturn = fn() { }; noReturn();', expected: NULL },
    {
      input: 'let noReturn = fn() { }; let noReturnTwo = fn() { noReturn(); }; noReturn(); noReturnTwo();',
      expected: NULL,
    },
    {
      input: 'let returnsOne = fn() { 1; }; let returnsOneReturner = fn() { returnsOne; }; returnsOneReturner()(); ',
      expected: 1,
    },
    {
      input: `
      let one = fn() { let one = 1; one };
      one();
      `,
      expected: 1,
    },
    {
      input: `
      let oneAndTwo = fn() { let one = 1; let two = 2; one + two; };
      oneAndTwo();
      `,
      expected: 3,
    },
    {
      input: `
      let oneAndTwo = fn() { let one = 1; let two = 2; one + two; };
      let threeAndFour = fn() { let three = 3; let four = 4; three + four; };
      oneAndTwo() + threeAndFour();
      `,
      expected: 10,
    },
    {
      input: `
      let firstFoobar = fn() { let foobar = 50; foobar; };
      let secondFoobar = fn() { let foobar = 100; foobar; };
      firstFoobar() + secondFoobar();
      `,
      expected: 150,
    },
    {
      input: `
      let globalSeed = 50;
      let minusOne = fn() {
        let num = 1;
        globalSeed - num;
      }
      let minusTwo = fn() {
        let num = 2;
        globalSeed - num;
      }
      minusOne() + minusTwo();
      `,
      expected: 97,
    },
    {
      input: `
      let returnsOneReturner = fn() {
        let returnsOne = fn() { 1; };
        returnsOne;
      };
      returnsOneReturner()();
      `,
      expected: 1,
    },
    {
      input: `
      let two = fn() { 2; };
      let returnsThreeReturner = fn() {
        let returnsThree = fn() { 1 + two(); };
        returnsThree;
      };
      returnsThreeReturner()();
      `,
      expected: 3,
    },
    {
      input: `
      let identity = fn(a) { a; };
      identity(4);
      `,
      expected: 4,
    },
    {
      input: `
      let sum = fn(a, b) { a + b; };
      sum(1, 2);
      `,
      expected: 3,
    },
    {
      input: `
      let sum = fn(a, b) {
        let c = a + b;
        c;
      };
      sum(1, 2);
      `,
      expected: 3,
    },
    {
      input: `
      let sum = fn(a, b) {
        let c = a + b;
        c;
      };
      sum(1, 2) + sum(3, 4);`,
      expected: 10,
    },
    {
      input: `
      let sum = fn(a, b) {
        let c = a + b;
        c;
      };
      let outer = fn() {
        sum(1, 2) + sum(3, 4);
      };
      outer();
      `,
      expected: 10,
    },
    {
      input: `
      let globalNum = 10;
      let sum = fn(a, b) {
        let c = a + b;
        c + globalNum;
      };
      let outer = fn() {
        sum(1, 2) + sum(3, 4) + globalNum;
      };
      outer() + globalNum;
      `,
      expected: 50,
    },
    { input: 'len("")', expected: 0 },
    { input: 'len("four")', expected: 4 },
    { input: 'len("hello world")', expected: 11 },
    { input: 'len([1, 2, 3])', expected: 3 },
    { input: 'len([])', expected: 0 },
    { input: 'puts("hello", "world")', expected: NULL },
    { input: 'first([1, 2, 3])', expected: 1 },
    { input: 'first([])', expected: NULL },
    { input: 'last([1, 2, 3])', expected: 3 },
    { input: 'last([])', expected: NULL },
    { input: 'rest([1, 2, 3])', expected: [2, 3] },
    { input: 'rest([])', expected: NULL },
    { input: 'push([], 1)', expected: [1] },
    { input: 'push([1], 2)', expected: [1, 2] },
    {
      input: `
      let newClosure = fn(a) {
        fn() { a; };
      };
      let closure = newClosure(99);
      closure();
      `,
      expected: 99,
    },
    {
      input: `
      let newAdder = fn(a, b) {
        fn(c) { a + b + c };
      };
      let adder = newAdder(1, 2);
      adder(8);
      `,
      expected: 11,
    },
    {
      input: `
      let newAdder = fn(a, b) {
        let c = a + b;
        fn(d) { c + d };
      };
      let adder = newAdder(1, 2);
      adder(8);
      `,
      expected: 11,
    },
    {
      input: `
      let newAdderOuter = fn(a, b) {
        let c = a + b;
        fn(d) {
          let e = d + c;
          fn(f) { e + f; };
        };
      };
      let newAdderInner = newAdderOuter(1, 2);
      let adder = newAdderInner(3);
      adder(8);
      `,
      expected: 14,
    },
    {
      input: `
      let a = 1;
      let newAdderOuter = fn(b) {
        fn(c) {
          fn(d) { a + b + c + d };
        };
      };
      let newAdderInner = newAdderOuter(2);
      let adder = newAdderInner(3);
      adder(8);
      `,
      expected: 14,
    },
    {
      input: `
      let newClosure = fn(a, b) {
        let one = fn() { a; };
        let two = fn() { b; };
        fn() { one() + two(); };
      };
      let closure = newClosure(9, 90);
      closure();
      `,
      expected: 99,
    },
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

describe('Test VM with error', () => {
  const tests: { input: string; expected: string }[] = [
    {
      input: `fn() { 1; }(1);`,
      expected: `wrong number of arguments: want=0, got=1`,
    },
    {
      input: `fn(a) { a; }();`,
      expected: `wrong number of arguments: want=1, got=0`,
    },
    {
      input: `fn(a, b) { a + b; }(1);`,
      expected: `wrong number of arguments: want=2, got=1`,
    },
    {
      input: `len(1);`,
      expected: `argument to 'len' not supported, got INTEGER`,
    },
    {
      input: `len("one", "two");`,
      expected: `wrong number of arguments. got=2, want=1`,
    },
    {
      input: `first(1);`,
      expected: `argument to 'first' must be ARRAY, got INTEGER`,
    },
    {
      input: `last(1);`,
      expected: `argument to 'last' must be ARRAY, got INTEGER`,
    },
    {
      input: `rest(1);`,
      expected: `argument to 'rest' must be ARRAY, got INTEGER`,
    },
    {
      input: `push(1, 1);`,
      expected: `argument to 'push' must be ARRAY, got INTEGER`,
    },
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

    it('should throw an error', () => {
      assert.throws(() => vm.run(), { message: expected });
    });
  });
});
