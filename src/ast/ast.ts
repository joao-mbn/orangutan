import { Token, TokenType, getKeywordLiteral } from '../token/token';

// Node is a special interface in the NodeJS runtime, so ours has to be called something else to avoid conflicts
interface AstNode {
  tokenLiteral(): string;
}

interface Statement extends AstNode {
  statementNode(): void;
}

interface Expression extends AstNode {
  expressionNode(): void;
}

export class Program implements AstNode {
  statements: Statement[];

  constructor(statements: Statement[]) {
    this.statements = statements;
  }

  tokenLiteral(): string {
    if (this.statements.length > 0) {
      return this.statements[0].tokenLiteral();
    } else {
      return '';
    }
  }
}

class LetStatement implements Statement {
  token: Token = { type: TokenType.LET, literal: getKeywordLiteral(TokenType.LET) };
  name: Identifier;
  value: Expression;

  constructor(name: Identifier, value: Expression) {
    this.name = name;
    this.value = value;
  }

  statementNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }
}

class Identifier implements Expression {
  token: Token = { type: TokenType.IDENT, literal: '' };
  value: string;

  constructor(value: string) {
    this.value = value;
    this.token.literal = value;
  }

  expressionNode(): void {}

  tokenLiteral(): string {
    return this.token.literal;
  }
}
