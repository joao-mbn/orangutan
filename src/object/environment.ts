import { InternalObject } from './object';

export class Environment {
  store: Map<string, InternalObject> = new Map();

  constructor(public outer?: Environment) {}

  get(name: string): InternalObject | undefined {
    const storeHas = this.store.has(name);

    if (storeHas) {
      return this.store.get(name);
    }

    return this.outer?.get(name);
  }

  setOnCurrent(name: string, value: InternalObject): void {
    this.store.set(name, value);
  }

  setOnClosest(name: string, value: InternalObject): void {
    const storeHas = this.store.has(name);

    if (storeHas) {
      this.setOnCurrent(name, value);
    }

    this.outer?.setOnClosest(name, value);
  }
}

