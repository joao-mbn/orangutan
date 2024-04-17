import {
  AstNode,
  BooleanLiteral,
  ExpressionStatement,
  InfixExpression,
  IntegerLiteral,
  PrefixExpression,
  Program,
  Statement
} from '../ast/ast';
import { BooleanObject, IntegerObject, InternalObject, NullObject, ObjectType } from '../object/object';

const TRUE_OBJECT = new BooleanObject(true);
const FALSE_OBJECT = new BooleanObject(false);
const NULL = new NullObject();

export function evaluator(node: AstNode): InternalObject {
  if (node instanceof Program) {
    return evaluateStatements(node.statements);
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

  return NULL;
}

function evaluateStatements(statements: Statement[]): InternalObject {
  let result: InternalObject = NULL;

  for (const statement of statements) {
    result = evaluator(statement);
  }

  return result;
}

function nativeBooleanToBooleanObject(value: boolean): BooleanObject {
  return value ? TRUE_OBJECT : FALSE_OBJECT;
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
  if (right === TRUE_OBJECT) {
    return FALSE_OBJECT;
  }

  if (right === FALSE_OBJECT) {
    return TRUE_OBJECT;
  }

  if (right === NULL) {
    return TRUE_OBJECT;
  }

  return FALSE_OBJECT;
}

function evaluateMinusPrefixOperatorExpression(right: InternalObject): InternalObject {
  if (right.objectType() !== ObjectType.INTEGER) {
    return NULL;
  }

  const value = (right as IntegerObject).value;

  return new IntegerObject(-value);
}

function evaluateInfixExpression(operator: string, left: InternalObject, right: InternalObject): InternalObject {
  if (left.objectType() === ObjectType.INTEGER || right.objectType() === ObjectType.INTEGER) {
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
