import {
  AstNode,
  BlockStatement,
  BooleanLiteral,
  CallExpression,
  Expression,
  ExpressionStatement,
  FunctionLiteral,
  Identifier,
  IfExpression,
  InfixExpression,
  IntegerLiteral,
  LetStatement,
  PrefixExpression,
  Program,
  ReturnStatement,
  StringLiteral
} from '../ast/ast';
import { Environment } from '../object/environment';
import {
  BooleanObject,
  ErrorObject,
  FunctionObject,
  IntegerObject,
  InternalObject,
  NullObject,
  ObjectType,
  ReturnValueObject,
  StringObject
} from '../object/object';

export const TRUE_OBJECT = new BooleanObject(true);
export const FALSE_OBJECT = new BooleanObject(false);
export const NULL = new NullObject();

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

  if (node instanceof ReturnStatement) {
    const value = evaluator(node.returnValue, environment);
    return new ReturnValueObject(value);
  }

  if (node instanceof LetStatement) {
    const value = evaluator(node.value, environment);
    if (isError(value)) {
      return value;
    }
    environment.set(node.name.value, value);
  }

  if (node instanceof Identifier) {
    return evaluateIdentifier(node, environment);
  }

  if (node instanceof FunctionLiteral) {
    return new FunctionObject(node.parameters, node.body, environment);
  }

  if (node instanceof CallExpression) {
    const func = evaluator(node.function, environment);
    if (isError(func)) {
      return func;
    }

    const args = evaluateExpressions(node.arguments, environment);
    if (args.length === 1 && isError(args[0])) {
      return args[0];
    }

    return applyFunction(func, args);
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
      return newError(`unknown operator: ${operator} ${right.objectType()}`);
  }
}

function evaluateBangOperatorExpression(right: InternalObject): BooleanObject {
  return isTruthy(right) ? FALSE_OBJECT : TRUE_OBJECT;
}

function evaluateMinusPrefixOperatorExpression(right: InternalObject): InternalObject {
  if (!(right instanceof IntegerObject)) {
    return newError(`unknown operator: -${right.objectType()}`);
  }

  const value = (right as IntegerObject).value;

  return new IntegerObject(-value);
}

function evaluateInfixExpression(operator: string, left: InternalObject, right: InternalObject): InternalObject {
  if (left.objectType() !== right.objectType()) {
    return newError(`type mismatch: ${left.objectType()} ${operator} ${right.objectType()}`);
  }

  if (left.objectType() === ObjectType.INTEGER && right.objectType() === ObjectType.INTEGER) {
    return evaluateIntegerInfixExpression(operator, left, right);
  }

  if (left.objectType() === ObjectType.STRING && right.objectType() === ObjectType.STRING) {
    return evaluateStringInfixExpression(operator, left, right);
  }

  if (operator === '==') {
    return nativeBooleanToBooleanObject(left === right);
  }

  if (operator === '!=') {
    return nativeBooleanToBooleanObject(left !== right);
  }

  return newError(`unknown operator: ${left.objectType()} ${operator} ${right.objectType()}`);
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
      return newError(`unknown operator: ${left.objectType()} ${operator} ${right.objectType()}`);
  }
}

function evaluateStringInfixExpression(operator: string, left: InternalObject, right: InternalObject): InternalObject {
  const leftValue = (left as StringObject).value;
  const rightValue = (right as StringObject).value;

  if (operator !== '+') {
    return newError(`unknown operator: ${left.objectType()} ${operator} ${right.objectType()}`);
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

function evaluateIdentifier(node: Identifier, environment: Environment): InternalObject {
  const value = environment.get(node.value);
  if (value === undefined) {
    return new ErrorObject(`identifier not found: ${node.value}`);
  }

  return value;
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

function applyFunction(func: InternalObject, args: InternalObject[]): InternalObject {
  if (!(func instanceof FunctionObject)) {
    return newError(`not a function: ${func.objectType()}`);
  }

  const extendedEnv = extendFunctionEnvironment(func, args);
  const evaluated = evaluator(func.body, extendedEnv);

  return unwrapReturnValue(evaluated);
}

function nativeBooleanToBooleanObject(value: boolean): BooleanObject {
  return value ? TRUE_OBJECT : FALSE_OBJECT;
}

function isTruthy(object: InternalObject): boolean {
  if (object === NULL) {
    return false;
  }

  if (object === TRUE_OBJECT) {
    return true;
  }

  if (object === FALSE_OBJECT) {
    return false;
  }

  return true;
}

function newError(message: string) {
  return new ErrorObject(message);
}

function isError(object: InternalObject): object is ErrorObject {
  return object instanceof ErrorObject;
}

function extendFunctionEnvironment(func: FunctionObject, args: InternalObject[]): Environment {
  const environment = newEnvironment(func.environment);

  func.parameters.forEach((parameter, index) => {
    environment.set(parameter.value, args[index]);
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

