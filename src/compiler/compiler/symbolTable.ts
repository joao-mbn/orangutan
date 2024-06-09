export enum SymbolScope {
  Global = 'GLOBAL',
}

export interface _Symbol {
  name: string;
  scope: SymbolScope;
  index: number;
}

export class SymbolTable {
  store: Map<string, _Symbol>;

  constructor(store: Map<string, _Symbol> = new Map<string, _Symbol>()) {
    this.store = store;
  }

  define(name: string) {
    const symbol = { name, scope: SymbolScope.Global, index: this.store.size };
    this.store.set(name, symbol);
    return symbol;
  }

  resolve(name: string) {
    if (!this.store.has(name)) {
      return false;
    }
    return this.store.get(name);
  }
}

