import assert from 'node:assert/strict';
import { it } from 'node:test';
import { Lexer } from './interpreter/lexer/lexer';
import { NULL } from './interpreter/object/defaultObjects';
import { ArrayObject, BooleanObject, IntegerObject, InternalObject, StringObject } from './interpreter/object/object';
import { Parser } from './interpreter/parser/parser';

export function getProgramAndParser(input: string) {
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);

  const program = parser.parseProgram();

  if (program == null) {
    throw new Error('ParseProgram() returned null');
  }

  return { program, parser };
}

export function parse(input: string) {
  return getProgramAndParser(input).program;
}

export function testIntegerObject(object: InternalObject, expected: number) {
  it('object is IntegerObject', () => {
    assert.ok(object instanceof IntegerObject);
  });

  it(`should evaluate to ${expected}`, () => {
    assert.strictEqual(object.inspect(), expected.toString());
  });
}

export function testBooleanObject(object: InternalObject, expected: boolean) {
  it('object is BooleanObject', () => {
    assert.ok(object instanceof BooleanObject);
  });

  it(`should evaluate to ${expected}`, () => {
    assert.strictEqual(object.inspect(), expected.toString());
  });
}

export function testNullObject(object: InternalObject) {
  it('object is NULL', () => {
    assert.strictEqual(object, NULL);
  });
}

export function testStringObject(object: InternalObject, expected: string) {
  it('object is StringObject', () => {
    assert.ok(object instanceof StringObject);
  });

  it(`should evaluate to ${expected}`, () => {
    assert.strictEqual(object.inspect(), expected);
  });
}

export function testArrayObject(object: InternalObject, expected: unknown[]) {
  it('object is ArrayObject', () => {
    assert.ok(object instanceof ArrayObject);
  });

  it(`should have the expected number of elements`, () => {
    assert.deepStrictEqual((object as ArrayObject).elements.length, expected.length);
  });
}

