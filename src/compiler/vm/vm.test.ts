import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { InternalObject } from '../../interpreter/object/object';
import { parse, testIntegerObject } from '../../testTools';
import { Compiler } from '../compiler/compiler';
import { VM } from './vm';

describe('Test VM', () => {
  function testExpectedObject(expected: unknown, actual: InternalObject) {
    switch (true) {
      case typeof expected === 'number':
        testIntegerObject(actual, expected);
      default:
        break;
    }
  }

  const tests: { input: string; expected: unknown }[] = [
    { input: '1', expected: 1 },
    { input: '2', expected: 2 },
    { input: '1 + 2', expected: 3 }
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

    const stackTop = vm.stackTop()!;
    it('should have a stack top', () => {
      assert.notStrictEqual(stackTop, null);
    });

    testExpectedObject(expected, stackTop);
  });
});
