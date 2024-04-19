import { BlockStatement, Identifier } from '../ast/ast';
import { Environment } from './environment';

export enum ObjectType {
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  NULL = 'NULL',
  RETURN_VALUE = 'RETURN_VALUE',
  ERROR_OBJECT = 'ERROR_OBJECT',
  FUNCTION_OBJECT = 'FUNCTION_OBJECT'
}

export interface InternalObject {
  objectType(): ObjectType;
  inspect(): string;
}

export class IntegerObject implements InternalObject {
  constructor(public value: number) {}

  objectType() {
    return ObjectType.INTEGER;
  }

  inspect() {
    return this.value.toString();
  }
}

export class BooleanObject implements InternalObject {
  constructor(public value: boolean) {}

  objectType() {
    return ObjectType.BOOLEAN;
  }

  inspect() {
    return this.value.toString();
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
    public environment: Environment
  ) {}

  objectType() {
    return ObjectType.FUNCTION_OBJECT;
  }

  inspect() {
    return `fn(${this.parameters.map((i) => i.asString()).join(', ')}) ${this.body.asString()}`;
  }
}
