import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { SymbolScope, SymbolTable, _Symbol } from './symbolTable';

describe('Test define', () => {
  const expected = new Map<string, _Symbol>([
    ['a', { name: 'a', scope: SymbolScope.Global, index: 0 }],
    ['b', { name: 'b', scope: SymbolScope.Global, index: 1 }],
  ]);

  it('should define a and b', () => {
    const symbolTable = new SymbolTable();

    const a = symbolTable.define('a');
    const b = symbolTable.define('b');

    deepStrictEqual(a, expected.get('a'));
    deepStrictEqual(b, expected.get('b'));
  });
});

describe('Test resolve', () => {
  const symbolTable = new SymbolTable();
  symbolTable.define('a');
  symbolTable.define('b');

  it('should resolve a and b', () => {
    const a = symbolTable.resolve('a');
    const b = symbolTable.resolve('b');

    deepStrictEqual(a, { name: 'a', scope: SymbolScope.Global, index: 0 });
    deepStrictEqual(b, { name: 'b', scope: SymbolScope.Global, index: 1 });
  });

  it('should return false for c', () => {
    const c = symbolTable.resolve('c');
    strictEqual(c, false);
  });
});

