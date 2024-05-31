import {
  ArrayLiteral,
  AstNode,
  BlockStatement,
  BooleanLiteral,
  CallExpression,
  Expression,
  ExpressionStatement,
  FunctionLiteral,
  HashLiteral,
  Identifier,
  IfExpression,
  IndexExpression,
  InfixExpression,
  IntegerLiteral,
  LetStatement,
  PrefixExpression,
  Program,
  ReassignStatement,
  ReturnStatement,
  StringLiteral,
  WhileExpression
} from '../ast/ast';
import { Environment } from '../object/environment';
import {
  ArrayObject,
  BooleanObject,
  BuiltinFunctionObject,
  ErrorObject,
  FunctionObject,
  HashObject,
  Hashable,
  IntegerObject,
  InternalObject,
  ReturnValueObject,
  StringObject
} from '../object/object';
import { builtins } from './builtins';
import { FALSE_OBJECT, NULL, TRUE_OBJECT } from './defaultObjects';

export function evaluator(node: AstNode, environment: Environment): InternalObject {
  if (node instanceof Program) {
    return evaluateProgram(node, environment);
  }

  if (node instanceof ExpressionStatement) {
    return evaluator(node.expression, environment);
  }

  if (node instanceof IntegerLiteral) {
    return new IntegerObject(node.value);
  }

  if (node instanceof StringLiteral) {
    return new StringObject(node.tokenLiteral());
  }

  if (node instanceof BooleanLiteral) {
    return nativeBooleanToBooleanObject(node.value);
  }

  if (node instanceof PrefixExpression) {
    const right = evaluator(node.right, environment);

    if (right === NULL || isError(right)) {
      return right;
    }

    return evaluatePrefixExpression(node.operator, right);
  }

  if (node instanceof InfixExpression) {
    const left = evaluator(node.left, environment);

    if (left === NULL || isError(left)) {
      return left;
    }

    const right = evaluator(node.right, environment);

    if (right === NULL || isError(right)) {
      return right;
    }

    return evaluateInfixExpression(node.operator, left, right);
  }

  if (node instanceof BlockStatement) {
    return evaluateBlockStatement(node, environment);
  }

  if (node instanceof IfExpression) {
    return evaluateIfExpression(node, environment);
  }

  if (node instanceof WhileExpression) {
    return evaluateWhileExpression(node, environment);
  }

  if (node instanceof ReturnStatement) {
    const value = evaluator(node.returnValue, environment);
    return new ReturnValueObject(value);
  }

  if (node instanceof LetStatement) {
    const value = evaluator(node.value, environment);
    if (isError(value)) {
      return value;
    }
    environment.setOnCurrent(node.name.value, value);
  }

  if (node instanceof ReassignStatement) {
    const newValue = evaluator(node.value, environment);
    if (isError(newValue)) {
      return newValue;
    }

    const currentValue = environment.get(node.name.value);
    if (!currentValue) {
      return new ErrorObject(`variable ${node.name.value} reassigned before being declared`);
    }

    if (currentValue.objectType() !== newValue.objectType()) {
      return new ErrorObject(
        `Reassignment mismatch: tried to assign ${newValue.objectType()} to ${currentValue.objectType()}`
      );
    }

    environment.setOnClosest(node.name.value, newValue);
  }

  if (node instanceof Identifier) {
    return evaluateIdentifier(node, environment);
  }

  if (node instanceof FunctionLiteral) {
    return new FunctionObject(node.parameters, node.body, environment);
  }

  if (node instanceof CallExpression) {
    const fn = evaluator(node.function, environment);
    if (isError(fn)) {
      return fn;
    }

    const args = evaluateExpressions(node.arguments, environment);
    if (args.length === 1 && isError(args[0])) {
      return args[0];
    }

    return applyFunction(fn, args);
  }

  if (node instanceof ArrayLiteral) {
    const elements = evaluateExpressions(node.elements, environment);
    if (elements.length === 1 && isError(elements[0])) {
      return elements[0];
    }

    return new ArrayObject(elements);
  }

  if (node instanceof IndexExpression) {
    const left = evaluator(node.left, environment);
    if (isError(left)) {
      return left;
    }

    const index = evaluator(node.index, environment);
    if (isError(index)) {
      return index;
    }

    return evaluateIndexExpression(left, index);
  }

  if (node instanceof HashLiteral) {
    return evaluateHashLiteral(node, environment);
  }

  return NULL;
}

function evaluateProgram(program: Program, environment: Environment): InternalObject {
  let result: InternalObject = NULL;

  for (const statement of program.statements) {
    result = evaluator(statement, environment);

    if (result instanceof ReturnValueObject) {
      return result.value;
    }

    if (result instanceof ErrorObject) {
      return result;
    }
  }

  return result;
}

function evaluateBlockStatement(node: BlockStatement, environment: Environment): InternalObject {
  let result: InternalObject = NULL;

  for (const statement of node.statements) {
    result = evaluator(statement, environment);

    if (result instanceof ReturnValueObject || result instanceof ErrorObject) {
      return result;
    }
  }

  return result;
}

function evaluatePrefixExpression(operator: string, right: InternalObject): InternalObject {
  switch (operator) {
    case '!':
      return evaluateBangOperatorExpression(right);
    case '-':
      return evaluateMinusPrefixOperatorExpression(right);
    default:
      return new ErrorObject(`unknown operator: ${operator} ${right.objectType()}`);
  }
}

function evaluateBangOperatorExpression(right: InternalObject): BooleanObject {
  return isTruthy(right) ? FALSE_OBJECT : TRUE_OBJECT;
}

function evaluateMinusPrefixOperatorExpression(right: InternalObject): InternalObject {
  if (!(right instanceof IntegerObject)) {
    return new ErrorObject(`unknown operator: -${right.objectType()}`);
  }

  const value = (right as IntegerObject).value;

  return new IntegerObject(-value);
}

function evaluateInfixExpression(operator: string, left: InternalObject, right: InternalObject): InternalObject {
  if (operator === '&&') {
    return nativeBooleanToBooleanObject(isTruthy(left) && isTruthy(right));
  }

  if (operator === '||') {
    return nativeBooleanToBooleanObject(isTruthy(left) || isTruthy(right));
  }

  if (left.objectType() !== right.objectType()) {
    return new ErrorObject(`type mismatch: ${left.objectType()} ${operator} ${right.objectType()}`);
  }

  if (left instanceof IntegerObject && right instanceof IntegerObject) {
    return evaluateIntegerInfixExpression(operator, left, right);
  }

  if (left instanceof StringObject && right instanceof StringObject) {
    return evaluateStringInfixExpression(operator, left, right);
  }

  if (operator === '==') {
    return nativeBooleanToBooleanObject(left === right);
  }

  if (operator === '!=') {
    return nativeBooleanToBooleanObject(left !== right);
  }

  return new ErrorObject(`unknown operator: ${left.objectType()} ${operator} ${right.objectType()}`);
}

function evaluateIntegerInfixExpression(operator: string, left: InternalObject, right: InternalObject): InternalObject {
  const leftValue = (left as IntegerObject).value;
  const rightValue = (right as IntegerObject).value;

  switch (operator) {
    case '+':
      return new IntegerObject(leftValue + rightValue);
    case '-':
      return new IntegerObject(leftValue - rightValue);
    case '*':
      return new IntegerObject(leftValue * rightValue);
    case '/':
      return new IntegerObject(leftValue / rightValue);
    case '<':
      return nativeBooleanToBooleanObject(leftValue < rightValue);
    case '>':
      return nativeBooleanToBooleanObject(leftValue > rightValue);
    case '==':
      return nativeBooleanToBooleanObject(leftValue === rightValue);
    case '!=':
      return nativeBooleanToBooleanObject(leftValue !== rightValue);
    default:
      return new ErrorObject(`unknown operator: ${left.objectType()} ${operator} ${right.objectType()}`);
  }
}

function evaluateStringInfixExpression(operator: string, left: InternalObject, right: InternalObject): InternalObject {
  const leftValue = (left as StringObject).value;
  const rightValue = (right as StringObject).value;

  if (operator !== '+') {
    return new ErrorObject(`unknown operator: ${left.objectType()} ${operator} ${right.objectType()}`);
  }

  return new StringObject(leftValue + rightValue);
}

function evaluateIfExpression(node: IfExpression, environment: Environment): InternalObject {
  const condition = evaluator(node.condition, environment);

  if (isError(condition)) {
    return condition;
  }

  if (isTruthy(condition)) {
    return evaluator(node.consequence, environment);
  } else if (node.alternative !== null) {
    return evaluator(node.alternative, environment);
  }

  return NULL;
}

function evaluateWhileExpression(node: WhileExpression, environment: Environment): InternalObject {
  let result: InternalObject = NULL;

  while (true) {
    const condition = evaluator(node.condition, environment);
    if (isError(condition)) {
      return condition;
    }

    if (!isTruthy(condition)) {
      break;
    }

    result = evaluator(node.block, environment);
    if (result instanceof ReturnValueObject || result instanceof ErrorObject) {
      break;
    }
  }

  return result;
}

function evaluateIdentifier(node: Identifier, environment: Environment): InternalObject {
  const value = environment.get(node.value);
  if (value !== undefined) {
    return value;
  }

  const builtin = builtins.get(node.value);
  if (builtin !== undefined) {
    return builtin;
  }

  return new ErrorObject(`identifier not found: ${node.value}`);
}

function evaluateExpressions(expressions: Expression[], environment: Environment): InternalObject[] {
  let results: InternalObject[] = [];

  for (const expression of expressions) {
    const result = evaluator(expression, environment);

    if (isError(result)) {
      return [result];
    }

    results.push(result);
  }

  return results;
}

function evaluateIndexExpression(left: InternalObject, index: InternalObject): InternalObject {
  if (left instanceof ArrayObject && index instanceof IntegerObject) {
    return evaluateArrayIndexExpression(left as ArrayObject, index as IntegerObject);
  }

  if (left instanceof HashObject) {
    return evaluateHashIndexExpression(left, index);
  }

  return new ErrorObject(`index operator not supported: ${left.objectType()}`);
}

function evaluateArrayIndexExpression(array: ArrayObject, index: IntegerObject): InternalObject {
  const i = index.value;
  const max = array.elements.length - 1;

  if (i < 0 || i > max) {
    return NULL;
  }

  return array.elements[i];
}

function evaluateHashIndexExpression(hash: HashObject, index: InternalObject): InternalObject {
  if (!(index instanceof Hashable)) {
    return new ErrorObject(`unusable as hash key: ${index.objectType()}`);
  }

  const pair = hash.pairs.get(index.hashKey());

  if (!pair) {
    return NULL;
  }

  return pair.value;
}

function evaluateHashLiteral(node: HashLiteral, environment: Environment) {
  const pairs = new Map<number, { key: InternalObject; value: InternalObject }>();
  node.pairs.forEach((value, key) => {
    const evaluatedKey = evaluator(key, environment);

    if (!(evaluatedKey instanceof Hashable)) {
      return new ErrorObject(`unusable as hash key: ${evaluatedKey.objectType()}`);
    }

    const evaluatedValue = evaluator(value, environment);
    if (isError(evaluatedValue)) {
      return evaluatedValue;
    }

    const hash = evaluatedKey.hashKey();
    pairs.set(hash, { key: evaluatedKey, value: evaluatedValue });
  });

  return new HashObject(pairs);
}

function applyFunction(fn: InternalObject, args: InternalObject[]): InternalObject {
  if (fn instanceof FunctionObject) {
    const extendedEnv = extendFunctionEnvironment(fn, args);
    const evaluated = evaluator(fn.body, extendedEnv);

    return unwrapReturnValue(evaluated);
  }

  if (fn instanceof BuiltinFunctionObject) {
    return fn.fn(...args);
  }

  return new ErrorObject(`not a function: ${fn.objectType()}`);
}

export function nativeBooleanToBooleanObject(value: boolean): BooleanObject {
  return value ? TRUE_OBJECT : FALSE_OBJECT;
}

function isTruthy(object: InternalObject): boolean {
  if (object === NULL || object === FALSE_OBJECT) {
    return false;
  }

  return true;
}

function isError(object: InternalObject): object is ErrorObject {
  return object instanceof ErrorObject;
}

function extendFunctionEnvironment(fn: FunctionObject, args: InternalObject[]): Environment {
  const environment = newEnvironment(fn.environment);

  fn.parameters.forEach((parameter, index) => {
    environment.setOnCurrent(parameter.value, args[index]);
  });

  return environment;
}

function unwrapReturnValue(object: InternalObject): InternalObject {
  if (object instanceof ReturnValueObject) {
    return object.value;
  }

  return object;
}

function newEnvironment(outer?: Environment): Environment {
  return new Environment(outer);
}

