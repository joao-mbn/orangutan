export enum SymbolScope {
  Global = 'GLOBAL',
  Local = 'LOCAL',
  BuiltIn = 'BUILTIN',
  Free = 'FREE',
}

export interface _Symbol {
  name: string;
  scope: SymbolScope;
  index: number;
}

export class SymbolTable {
  numberDefinitions: number;
  constructor(
    public outer?: SymbolTable,
    public store: Map<string, _Symbol> = new Map<string, _Symbol>(),
    public freeSymbols: _Symbol[] = [],
  ) {
    this.numberDefinitions = 0;
  }

  define(name: string) {
    const symbol = {
      name,
      scope: this.outer ? SymbolScope.Local : SymbolScope.Global,
      index: this.numberDefinitions,
    };
    this.store.set(name, symbol);

    this.numberDefinitions++;

    return symbol;
  }

  resolve(name: string): false | _Symbol {
    if (!this.store.has(name)) {
      const resolvedOuter = this.outer?.resolve(name);

      if (!resolvedOuter) return false;

      if (resolvedOuter.scope === SymbolScope.Global || resolvedOuter.scope === SymbolScope.BuiltIn) {
        return resolvedOuter;
      }

      const symbol = this.defineFree(resolvedOuter);
      return symbol;
    }

    return this.store.get(name) as _Symbol;
  }

  defineBuiltIn(index: number, name: string) {
    const symbol = {
      name,
      scope: SymbolScope.BuiltIn,
      index,
    };
    this.store.set(name, symbol);
    return symbol;
  }

  defineFree(original: _Symbol) {
    this.freeSymbols.push(original);

    const symbol = {
      name: original.name,
      scope: SymbolScope.Free,
      index: this.freeSymbols.length - 1,
    };

    this.store.set(original.name, symbol);

    return symbol;
  }
}
