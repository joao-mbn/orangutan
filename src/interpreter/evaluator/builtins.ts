import {
  ArrayObject,
  BuiltinFunctionObject,
  ErrorObject,
  IntegerObject,
  InternalObject,
  StringObject
} from '../object/object';
import { NULL } from './defaultObjects';

const LEN = new BuiltinFunctionObject((...args: InternalObject[]) => {
  if (args.length !== 1) {
    return new ErrorObject(`wrong number of arguments. got=${args.length}, want=1`);
  }

  const arg = args[0];

  if (arg instanceof StringObject) {
    return new IntegerObject(arg.value.length);
  }

  if (arg instanceof ArrayObject) {
    return new IntegerObject(arg.elements.length);
  }

  return new ErrorObject(`argument to 'len' not supported, got ${arg.objectType()}`);
});

const FIRST = new BuiltinFunctionObject((...args: InternalObject[]) => {
  if (args.length !== 1) {
    return new ErrorObject(`wrong number of arguments. got=${args.length}, want=1`);
  }

  const arg = args[0];

  if (!(arg instanceof ArrayObject)) {
    return new ErrorObject(`argument to 'first' must be ARRAY, got ${arg.objectType()}`);
  }

  if (arg.elements.length > 0) {
    return arg.elements[0];
  }

  return NULL;
});

const LAST = new BuiltinFunctionObject((...args: InternalObject[]) => {
  if (args.length !== 1) {
    return new ErrorObject(`wrong number of arguments. got=${args.length}, want=1`);
  }

  const arg = args[0];

  if (!(arg instanceof ArrayObject)) {
    return new ErrorObject(`argument to 'last' must be ARRAY, got ${arg.objectType()}`);
  }

  const length = arg.elements.length;

  if (length > 0) {
    return arg.elements[length - 1];
  }

  return NULL;
});

const REST = new BuiltinFunctionObject((...args: InternalObject[]) => {
  if (args.length !== 1) {
    return new ErrorObject(`wrong number of arguments. got=${args.length}, want=1`);
  }

  const arg = args[0];

  if (!(arg instanceof ArrayObject)) {
    return new ErrorObject(`argument to 'rest' must be ARRAY, got ${arg.objectType()}`);
  }

  const length = arg.elements.length;

  if (length > 0) {
    const newElements = arg.elements.slice(1);
    return new ArrayObject(newElements);
  }

  return NULL;
});

const PUSH = new BuiltinFunctionObject((...args: InternalObject[]) => {
  if (args.length !== 2) {
    return new ErrorObject(`wrong number of arguments. got=${args.length}, want=2`);
  }

  const arg = args[0];

  if (!(arg instanceof ArrayObject)) {
    return new ErrorObject(`argument to 'push' must be ARRAY, got ${arg.objectType()}`);
  }

  const newElements = [...arg.elements];
  newElements.push(args[1]);

  return new ArrayObject(newElements);
});

const PUTS = new BuiltinFunctionObject((...args: InternalObject[]) => {
  args.forEach((arg) => console.log(arg.inspect()));
  return NULL;
});

export const builtins = new Map<string, BuiltinFunctionObject>([
  ['len', LEN],
  ['first', FIRST],
  ['last', LAST],
  ['rest', REST],
  ['push', PUSH],
  ['puts', PUTS]
]);

