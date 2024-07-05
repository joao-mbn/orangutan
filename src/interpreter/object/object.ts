import { BlockStatement, Identifier } from '../ast/ast';
import { Environment } from './environment';
import { hashString } from './hashString';

export enum ObjectType {
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  NULL = 'NULL',
  RETURN_VALUE = 'RETURN_VALUE',
  ERROR_OBJECT = 'ERROR_OBJECT',
  FUNCTION_OBJECT = 'FUNCTION_OBJECT',
  STRING = 'STRING',
  BUILTIN_OBJECT = 'BUILTIN_OBJECT',
  ARRAY_OBJECT = 'ARRAY_OBJECT',
  COMPILED_FUNCTION_OBJECT = 'COMPILED_FUNCTION_OBJECT',
}

export interface InternalObject {
  objectType(): ObjectType;
  inspect(): string;
}

// Using an abstract class instead of an interface allows to use instanceof.
export abstract class Hashable {
  abstract hashKey(): number; /* Javascript doesn't have something like comparable struct as Go does, thus the ObjectType must be on the hashKey value itself. */
}

export class IntegerObject extends Hashable implements InternalObject {
  constructor(public value: number) {
    super();
  }

  objectType() {
    return ObjectType.INTEGER;
  }

  inspect() {
    return this.value.toString();
  }

  hashKey() {
    return hashString(this.objectType()) + this.value;
  }
}

export class BooleanObject extends Hashable implements InternalObject {
  constructor(public value: boolean) {
    super();
  }

  objectType() {
    return ObjectType.BOOLEAN;
  }

  inspect() {
    return this.value.toString();
  }

  hashKey() {
    return hashString(this.objectType()) + (this.value ? 1 : 0);
  }
}

export class NullObject implements InternalObject {
  objectType() {
    return ObjectType.NULL;
  }

  inspect() {
    return 'null';
  }
}

export class StringObject extends Hashable implements InternalObject {
  constructor(public value: string) {
    super();
  }

  objectType() {
    return ObjectType.STRING;
  }

  inspect() {
    return this.value;
  }

  hashKey() {
    let hash = 0;
    for (let i = 0; i < this.value.length; i++) {
      hash = (hash << 5) - hash + this.value.charCodeAt(i);
      hash |= 0;
    }
    return hashString(this.objectType()) + hash;
  }
}

export class ReturnValueObject implements InternalObject {
  constructor(public value: InternalObject) {}

  objectType() {
    return ObjectType.RETURN_VALUE;
  }

  inspect() {
    return this.value.inspect();
  }
}

export class ErrorObject implements InternalObject {
  constructor(public message: string) {}

  objectType() {
    return ObjectType.ERROR_OBJECT;
  }

  inspect() {
    return this.message;
  }
}

export class FunctionObject implements InternalObject {
  constructor(
    public parameters: Identifier[],
    public body: BlockStatement,
    public environment: Environment,
  ) {}

  objectType() {
    return ObjectType.FUNCTION_OBJECT;
  }

  inspect() {
    return `fn(${this.parameters.map((i) => i.asString()).join(', ')}) ${this.body.asString()}`;
  }
}

export type BuiltinFunction = (...args: InternalObject[]) => InternalObject;

export class BuiltinFunctionObject implements InternalObject {
  constructor(public fn: BuiltinFunction) {}

  objectType() {
    return ObjectType.BUILTIN_OBJECT;
  }

  inspect() {
    return 'builtin function';
  }
}

export class ArrayObject implements InternalObject {
  constructor(public elements: InternalObject[]) {}

  objectType() {
    return ObjectType.ARRAY_OBJECT;
  }

  inspect() {
    return `[${this.elements.map((e) => e.inspect()).join(', ')}]`;
  }
}

export class HashObject implements InternalObject {
  constructor(public pairs: Map<number, { key: InternalObject; value: InternalObject }>) {}

  objectType() {
    return ObjectType.ARRAY_OBJECT;
  }

  inspect() {
    const pairs = Array.from(this.pairs.values()).map(({ key, value }) => `${key.inspect()}: ${value.inspect()}`);
    return `{${pairs.join(', ')}}`;
  }
}

