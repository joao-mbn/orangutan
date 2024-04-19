export enum ObjectType {
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  NULL = 'NULL',
  RETURN_VALUE = 'RETURN_VALUE'
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
