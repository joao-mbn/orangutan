import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { InternalObject } from '../../interpreter/object/object';
import { parse, testBooleanObject, testIntegerObject } from '../../testTools';
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
    { input: '(1 > 2) == false', expected: true }
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

