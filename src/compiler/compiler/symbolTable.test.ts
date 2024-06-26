import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { SymbolScope, SymbolTable, _Symbol } from './symbolTable';

describe('Test define', () => {
  const expected = new Map<string, _Symbol>([
    ['a', { name: 'a', scope: SymbolScope.Global, index: 0 }],
    ['b', { name: 'b', scope: SymbolScope.Global, index: 1 }],
    ['c', { name: 'c', scope: SymbolScope.Local, index: 0 }],
    ['d', { name: 'd', scope: SymbolScope.Local, index: 1 }],
    ['e', { name: 'e', scope: SymbolScope.Local, index: 0 }],
    ['f', { name: 'f', scope: SymbolScope.Local, index: 1 }],
  ]);

  it('should define with correct scope', () => {
    const global = new SymbolTable();
    const a = global.define('a');
    const b = global.define('b');

    deepStrictEqual(a, expected.get('a'));
    deepStrictEqual(b, expected.get('b'));

    const firstLocal = new SymbolTable(global);
    const c = firstLocal.define('c');
    const d = firstLocal.define('d');

    deepStrictEqual(c, expected.get('c'));
    deepStrictEqual(d, expected.get('d'));

    const secondLocal = new SymbolTable(firstLocal);
    const e = secondLocal.define('e');
    const f = secondLocal.define('f');

    deepStrictEqual(e, expected.get('e'));
    deepStrictEqual(f, expected.get('f'));
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

describe('Test resolve local', () => {
  const global = new SymbolTable();
  global.define('a');
  global.define('b');

  const local = new SymbolTable(global);
  local.define('c');
  local.define('d');

  it('should resolve a and b from global', () => {
    const a = local.resolve('a');
    const b = local.resolve('b');

    deepStrictEqual(a, { name: 'a', scope: SymbolScope.Global, index: 0 });
    deepStrictEqual(b, { name: 'b', scope: SymbolScope.Global, index: 1 });
  });

  it('should resolve c and d from local', () => {
    const c = local.resolve('c');
    const d = local.resolve('d');

    deepStrictEqual(c, { name: 'c', scope: SymbolScope.Local, index: 0 });
    deepStrictEqual(d, { name: 'd', scope: SymbolScope.Local, index: 1 });
  });
});

describe('Test resolve nested local', () => {
  const global = new SymbolTable();
  global.define('a');
  global.define('b');

  const firstLocal = new SymbolTable(global);
  firstLocal.define('c');
  firstLocal.define('d');

  const secondLocal = new SymbolTable(firstLocal);
  secondLocal.define('e');
  secondLocal.define('f');

  it('should resolve a and b from global; c and d from first local', () => {
    const a = firstLocal.resolve('a');
    const b = firstLocal.resolve('b');
    const c = firstLocal.resolve('c');
    const d = firstLocal.resolve('d');

    deepStrictEqual(a, { name: 'a', scope: SymbolScope.Global, index: 0 });
    deepStrictEqual(b, { name: 'b', scope: SymbolScope.Global, index: 1 });
    deepStrictEqual(c, { name: 'c', scope: SymbolScope.Local, index: 0 });
    deepStrictEqual(d, { name: 'd', scope: SymbolScope.Local, index: 1 });
  });

  it('should resolve e and f from inner', () => {
    const a = secondLocal.resolve('a');
    const b = secondLocal.resolve('b');
    const e = secondLocal.resolve('e');
    const f = secondLocal.resolve('f');

    deepStrictEqual(a, { name: 'a', scope: SymbolScope.Global, index: 0 });
    deepStrictEqual(b, { name: 'b', scope: SymbolScope.Global, index: 1 });
    deepStrictEqual(e, { name: 'e', scope: SymbolScope.Local, index: 0 });
    deepStrictEqual(f, { name: 'f', scope: SymbolScope.Local, index: 1 });
  });
});
