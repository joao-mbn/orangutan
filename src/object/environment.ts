export class Environment {
  store: Map<string, any> = new Map();

  constructor(public outer?: Environment) {}

  get(name: string): any {
    const storeHas = this.store.has(name);

    if (storeHas) {
      return this.store.get(name);
    }

    return this.outer?.get(name);
  }

  set(name: string, value: any): void {
    this.store.set(name, value);
  }
}
