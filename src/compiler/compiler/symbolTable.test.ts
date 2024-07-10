import assert, { deepStrictEqual, strictEqual } from 'node:assert';
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

describe('Test define and resolve builtin', () => {
  const global = new SymbolTable();
  const firstLocal = new SymbolTable(global);
  const secondLocal = new SymbolTable(firstLocal);

  const expected = [
    { name: 'a', scope: SymbolScope.BuiltIn, index: 0 },
    { name: 'b', scope: SymbolScope.BuiltIn, index: 1 },
    { name: 'e', scope: SymbolScope.BuiltIn, index: 2 },
    { name: 'f', scope: SymbolScope.BuiltIn, index: 3 },
  ];

  expected.forEach((symbol, index) => {
    global.defineBuiltIn(index, symbol.name);
  });

  for (const scope of [global, firstLocal, secondLocal]) {
    for (const symbol of expected) {
      it('should define builtins', () => {
        const result = scope.resolve(symbol.name);
        assert.ok(result);

        deepStrictEqual(result, symbol);
      });
    }
  }
});

describe('Test define and resolve free variable', () => {
  const global = new SymbolTable();
  global.define('a');
  global.define('b');

  const firstLocal = new SymbolTable(global);
  firstLocal.define('c');
  firstLocal.define('d');

  const secondLocal = new SymbolTable(firstLocal);
  secondLocal.define('e');
  secondLocal.define('f');

  const tests = [
    {
      table: firstLocal,
      expectedSymbols: [
        { name: 'a', scope: SymbolScope.Global, index: 0 },
        { name: 'b', scope: SymbolScope.Global, index: 1 },
        { name: 'c', scope: SymbolScope.Local, index: 0 },
        { name: 'd', scope: SymbolScope.Local, index: 1 },
      ],
      expectedFreeSymbols: [],
    },
    {
      table: secondLocal,
      expectedSymbols: [
        { name: 'a', scope: SymbolScope.Global, index: 0 },
        { name: 'b', scope: SymbolScope.Global, index: 1 },
        { name: 'c', scope: SymbolScope.Free, index: 0 },
        { name: 'd', scope: SymbolScope.Free, index: 1 },
        { name: 'e', scope: SymbolScope.Local, index: 0 },
        { name: 'f', scope: SymbolScope.Local, index: 1 },
      ],
      expectedFreeSymbols: [
        { name: 'c', scope: SymbolScope.Local, index: 0 },
        { name: 'd', scope: SymbolScope.Local, index: 1 },
      ],
    },
  ];

  for (const { table, expectedSymbols, expectedFreeSymbols } of tests) {
    for (const symbol of expectedSymbols) {
      it('should resolve symbols', () => {
        const result = table.resolve(symbol.name);
        assert.ok(result, `Failed to resolve ${symbol.name}, expected ${symbol.name}, got ${result && result.name}`);

        deepStrictEqual(result, symbol);
      });
    }

    it('should have the correct number of free symbols', () => {
      strictEqual(
        table.freeSymbols.length,
        expectedFreeSymbols.length,
        `Incorrect number of free symbols, expected ${expectedFreeSymbols.length}, got ${table.freeSymbols.length}`,
      );
    });

    for (const symbol of expectedFreeSymbols) {
      it('should resolve free symbols', () => {
        const result = table.freeSymbols[symbol.index];
        assert.ok(result, `Failed to resolve ${symbol.name}, expected ${symbol.name}, got ${result && result.name}`);

        deepStrictEqual(result, symbol, `Failed to resolve ${symbol.name}`);
      });
    }
  }
});

describe('Test unresolved free variable', () => {
  const global = new SymbolTable();
  global.define('a');

  const firstLocal = new SymbolTable(global);
  firstLocal.define('c');

  const secondLocal = new SymbolTable(firstLocal);
  secondLocal.define('e');
  secondLocal.define('f');

  const expected = [
    { name: 'a', scope: SymbolScope.Global, index: 0 },
    { name: 'c', scope: SymbolScope.Free, index: 0 },
    { name: 'e', scope: SymbolScope.Local, index: 0 },
    { name: 'f', scope: SymbolScope.Local, index: 1 },
  ];

  for (const symbol of expected) {
    it('should resolve symbols', () => {
      const result = secondLocal.resolve(symbol.name);
      assert.ok(result, `Failed to resolve ${symbol.name}, expected ${symbol.name}, got ${result && result.name}`);

      deepStrictEqual(result, symbol);
    });
  }

  const expectedUnresolvable = ['b', 'd'];

  for (const name of expectedUnresolvable) {
    it('should not resolve symbols', () => {
      const result = secondLocal.resolve(name);
      strictEqual(result, false, `Resolved ${name} when it should not have`);
    });
  }
});
