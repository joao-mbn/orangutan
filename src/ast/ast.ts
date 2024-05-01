import { Token, TokenType, getKeywordLiteral } from '../token/token';

// Node is a special interface in the NodeJS runtime, so ours has to be called something else to avoid conflicts
export interface AstNode {
  tokenLiteral(): string;
  asString(): string;
}

export interface Statement extends AstNode {
  statementNode(): void;
}

export interface Expression extends AstNode {
  expressionNode(): void;
}

export class Program implements AstNode {
  statements: Statement[];

  constructor(statements: Statement[]) {
    this.statements = statements;
  }

  asString(): string {
    return this.statements.map((statement) => statement.asString()).join('\n');
  }

  tokenLiteral(): string {
    if (this.statements.length > 0) {
      return this.statements[0].tokenLiteral();
    } else {
      return '';
    }
  }
}

export class LetStatement implements Statement {
  token: Token = { type: TokenType.LET, literal: getKeywordLiteral(TokenType.LET) };
  name: Identifier;
  value: Expression;

  constructor(name: Identifier, value: Expression) {
    this.name = name;
    this.value = value;
  }

  asString(): string {
    return `${this.tokenLiteral()} ${this.name.asString()} = ${this.value.asString()};`;
  }

  statementNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }
}

export class ReturnStatement implements Statement {
  token: Token = { type: TokenType.RETURN, literal: getKeywordLiteral(TokenType.RETURN) };
  returnValue: Expression;

  constructor(returnValue: Expression) {
    this.returnValue = returnValue;
  }

  asString(): string {
    return `${this.tokenLiteral()} ${this.returnValue.asString()};`;
  }

  statementNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }
}

export class ExpressionStatement implements Statement {
  token: Token;
  expression: Expression;

  constructor(token: Token, expression: Expression) {
    this.token = token;
    this.expression = expression;
  }

  asString(): string {
    return this.expression.asString();
  }

  statementNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }
}

export class BlockStatement implements AstNode {
  statements: Statement[];

  constructor(
    statements: Statement[],
    public token: Token // {
  ) {
    this.statements = statements;
  }

  asString(): string {
    return `{ ${this.statements.map((statement) => statement.asString()).join('\n')} }`;
  }

  statementNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }
}

export class ArrayLiteral implements Expression {
  elements: Expression[];

  constructor(
    elements: Expression[],
    public token: Token // [
  ) {
    this.elements = elements;
  }

  asString(): string {
    return `[${this.elements.map((element) => element.asString()).join(', ')}]`;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }
}

export class Identifier implements Expression {
  token: Token = { type: TokenType.IDENT, literal: '' };
  value: string;

  constructor(value: string) {
    this.value = value;
    this.token.literal = value;
  }

  asString(): string {
    return this.value;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }
}

export class IntegerLiteral implements Expression {
  token: Token = { type: TokenType.INT, literal: '' };
  value: number;

  constructor(literal: string, value: number) {
    this.token.literal = literal;
    this.value = value;
  }

  asString(): string {
    return this.token.literal;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }
}

export class BooleanLiteral implements Expression {
  value: boolean;

  constructor(
    public token: Token,
    value: boolean
  ) {
    this.value = value;
  }

  asString(): string {
    return this.token.literal;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }
}

export class StringLiteral implements Expression {
  token: Token = { type: TokenType.STRING, literal: '' };

  constructor(value: string) {
    this.token.literal = value;
  }

  asString(): string {
    return this.token.literal;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }
}

export class PrefixExpression implements Expression {
  operator: string;
  right: Expression;

  constructor(
    public token: Token,
    operator: string,
    right: Expression
  ) {
    this.operator = operator;
    this.right = right;
  }

  asString(): string {
    return `(${this.operator}${this.right.asString()})`;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }
}

export class InfixExpression implements Expression {
  operator: string;
  left: Expression;
  right: Expression;

  constructor(
    public token: Token,
    operator: string,
    left: Expression,
    right: Expression
  ) {
    this.operator = operator;
    this.left = left;
    this.right = right;
  }

  asString(): string {
    return `(${this.left.asString()} ${this.operator} ${this.right.asString()})`;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }
}

export class IfExpression implements Expression {
  token: Token = { type: TokenType.IF, literal: getKeywordLiteral(TokenType.IF) };
  condition: Expression;
  consequence: BlockStatement;
  alternative: BlockStatement | null;

  constructor(condition: Expression, consequence: BlockStatement, alternative: BlockStatement | null) {
    this.condition = condition;
    this.consequence = consequence;
    this.alternative = alternative;
  }

  asString(): string {
    let result = `if ${this.condition.asString()} ${this.consequence.asString()}`;
    if (this.alternative) {
      result += ` else ${this.alternative.asString()}`;
    }
    return result;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }
}

export class FunctionLiteral implements Expression {
  token: Token = { type: TokenType.FUNCTION, literal: getKeywordLiteral(TokenType.FUNCTION) };
  parameters: Identifier[];
  body: BlockStatement;

  constructor(parameters: Identifier[], body: BlockStatement) {
    this.parameters = parameters;
    this.body = body;
  }

  asString(): string {
    return `${this.tokenLiteral()}(${this.parameters.map((param) => param.asString()).join(', ')}) ${this.body.asString()}`;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }
}

export class CallExpression implements Expression {
  function: Expression;
  arguments: Expression[];

  constructor(
    public token: Token, // (
    func: Expression,
    args: Expression[]
  ) {
    this.function = func;
    this.arguments = args;
  }

  asString(): string {
    return `${this.function.asString()}(${this.arguments.map((arg) => arg.asString()).join(', ')})`;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }
}

export class IndexExpression implements Expression {
  left: Expression;
  index: Expression;

  constructor(
    public token: Token, // [
    left: Expression,
    index: Expression
  ) {
    this.left = left;
    this.index = index;
  }

  asString(): string {
    return `(${this.left.asString()}[${this.index.asString()}])`;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }
}

export class HashLiteral implements Expression {
  constructor(
    public token: Token, // {
    public pairs: Map<Expression, Expression>
  ) {}

  asString(): string {
    const pairs: string[] = [];
    this.pairs.forEach((value, key) => {
      pairs.push(`${key.asString()}: ${value.asString()}`);
    });

    return `{ ${pairs.join(', ')} }`;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }
}

