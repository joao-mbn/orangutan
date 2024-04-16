import { AstNode, BooleanLiteral, ExpressionStatement, IntegerLiteral, Program, Statement } from '../ast/ast';
import { BooleanObject, IntegerObject, InternalObject, NullObject } from '../object/object';

export function evaluator(node: AstNode): InternalObject | null {
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
    return node.value ? TRUE_OBJECT : FALSE_OBJECT;
  }

  return null;
}

function evaluateStatements(statements: Statement[]): InternalObject | null {
  let result: InternalObject | null = null;

  for (const statement of statements) {
    result = evaluator(statement);
  }

  return result;
}

const TRUE_OBJECT = new BooleanObject(true);
const FALSE_OBJECT = new BooleanObject(false);
const NULL = new NullObject();
