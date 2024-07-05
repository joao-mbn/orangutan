export enum SymbolScope {
  Global = 'GLOBAL',
  Local = 'LOCAL',
  BuiltIn = 'BUILTIN',
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
      return this.outer?.resolve(name) ?? false;
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
}

