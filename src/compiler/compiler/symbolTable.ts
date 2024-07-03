export enum SymbolScope {
  Global = 'GLOBAL',
  Local = 'LOCAL',
}

export interface _Symbol {
  name: string;
  scope: SymbolScope;
  index: number;
}

export class SymbolTable {
  constructor(
    public outer?: SymbolTable,
    public store: Map<string, _Symbol> = new Map<string, _Symbol>(),
  ) {}

  define(name: string) {
    const symbol = {
      name,
      scope: this.outer ? SymbolScope.Local : SymbolScope.Global,
      index: this.store.size,
    };
    this.store.set(name, symbol);
    return symbol;
  }

  resolve(name: string): false | _Symbol {
    if (!this.store.has(name)) {
      return this.outer?.resolve(name) ?? false;
    }
    return this.store.get(name) as _Symbol;
  }
}

