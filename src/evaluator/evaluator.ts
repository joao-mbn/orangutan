import {
  AstNode,
  BlockStatement,
  BooleanLiteral,
  ExpressionStatement,
  IfExpression,
  InfixExpression,
  IntegerLiteral,
  PrefixExpression,
  Program,
  ReturnStatement
} from '../ast/ast';
import {
  BooleanObject,
  IntegerObject,
  InternalObject,
  NullObject,
  ObjectType,
  ReturnValueObject
} from '../object/object';

export const TRUE_OBJECT = new BooleanObject(true);
export const FALSE_OBJECT = new BooleanObject(false);
export const NULL = new NullObject();

export function evaluator(node: AstNode): InternalObject {
  if (node instanceof Program) {
    return evaluateProgram(node);
  }

  if (node instanceof ExpressionStatement) {
    return evaluator(node.expression);
  }

  if (node instanceof IntegerLiteral) {
    return new IntegerObject(node.value);
  }

  if (node instanceof BooleanLiteral) {
    return nativeBooleanToBooleanObject(node.value);
  }

  if (node instanceof PrefixExpression) {
    const right = evaluator(node.right);

    if (right === NULL) {
      return NULL;
    }

    return evaluatePrefixExpression(node.operator, right);
  }

  if (node instanceof InfixExpression) {
    const left = evaluator(node.left);
    const right = evaluator(node.right);

    if (left === NULL || right === NULL) {
      return NULL;
    }

    return evaluateInfixExpression(node.operator, left, right);
  }

  if (node instanceof BlockStatement) {
    return evaluateBlockStatement(node);
  }

  if (node instanceof IfExpression) {
    return evaluateIfExpression(node);
  }

  if (node instanceof ReturnStatement) {
    const value = evaluator(node.returnValue);
    return new ReturnValueObject(value);
  }

  return NULL;
}

function evaluateProgram(program: Program): InternalObject {
  let result: InternalObject = NULL;

  for (const statement of program.statements) {
    result = evaluator(statement);

    if (result instanceof ReturnValueObject) {
      return result.value;
    }
  }

  return result;
}

function evaluateBlockStatement(node: BlockStatement): InternalObject {
  let result: InternalObject = NULL;

  for (const statement of node.statements) {
    result = evaluator(statement);

    if (result instanceof ReturnValueObject) {
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
      return NULL;
  }
}

function evaluateBangOperatorExpression(right: InternalObject): BooleanObject {
  return isTruthy(right) ? FALSE_OBJECT : TRUE_OBJECT;
}

function evaluateMinusPrefixOperatorExpression(right: InternalObject): InternalObject {
  if (right.objectType() !== ObjectType.INTEGER) {
    return NULL;
  }

  const value = (right as IntegerObject).value;

  return new IntegerObject(-value);
}

function evaluateInfixExpression(operator: string, left: InternalObject, right: InternalObject): InternalObject {
  if (left.objectType() === ObjectType.INTEGER && right.objectType() === ObjectType.INTEGER) {
    return evaluateIntegerInfixExpression(operator, left, right);
  }

  if (operator === '==') {
    return nativeBooleanToBooleanObject(left === right);
  }

  if (operator === '!=') {
    return nativeBooleanToBooleanObject(left !== right);
  }

  return NULL;
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
      return NULL;
  }
}

function evaluateIfExpression(node: IfExpression): InternalObject {
  const condition = evaluator(node.condition);

  if (isTruthy(condition)) {
    return evaluator(node.consequence);
  } else if (node.alternative !== null) {
    return evaluator(node.alternative);
  }

  return NULL;
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
