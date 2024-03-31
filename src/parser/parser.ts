import { Expression, Identifier, LetStatement, Program, ReturnStatement, Statement } from '../ast/ast';
import { Lexer } from '../lexer/lexer';
import { Token, TokenType } from '../token/token';

export class Parser {
  lexer: Lexer;
  currentToken: Token;
  peekToken: Token;
  errors: string[] = [];

  constructor(lexer: Lexer) {
    this.lexer = lexer;

    // making typescript happy
    this.currentToken = { type: TokenType.ILLEGAL, literal: '' };
    this.peekToken = { type: TokenType.ILLEGAL, literal: '' };

    // Read two tokens, so currentToken and peekToken are both set
    this.nextToken();
    this.nextToken();
  }

  nextToken() {
    this.currentToken = this.peekToken;
    this.peekToken = this.lexer.nextToken();
  }

  parseProgram(): Program {
    const program = new Program([]);

    while (!this.currentTokenIs(TokenType.EOF)) {
      const statement = this.parseStatement();

      if (statement != null) {
        program.statements.push(statement);
      }

      this.nextToken();
    }

    return program;
  }

  parseStatement(): Statement | null {
    switch (this.currentToken.type) {
      case TokenType.LET:
        return this.parseLetStatement();
      case TokenType.RETURN:
        return this.parseReturnStatement();
      default:
        return null;
    }
  }

  parseLetStatement(): LetStatement | null {
    // currentToken is already known to be LET

    if (!this.expectPeek(TokenType.IDENT)) {
      return null;
    }

    const name = new Identifier(this.currentToken.literal);

    if (!this.expectPeek(TokenType.ASSIGN)) {
      return null;
    }

    // TODO: We're skipping the expressions until we encounter a semicolon
    const expression: Expression = { expressionNode: () => {}, tokenLiteral: () => '', asString: () => 'expression' };
    while (!this.currentTokenIs(TokenType.SEMICOLON)) {
      this.nextToken();
    }

    const letStatement = new LetStatement(name, expression);
    return letStatement;
  }

  parseReturnStatement(): ReturnStatement | null {
    // currentToken is already known to be RETURN

    this.nextToken();

    // TODO: We're skipping the expressions until we encounter a semicolon
    const returnValue: Expression = { expressionNode: () => {}, tokenLiteral: () => '', asString: () => 'returnValue' };
    while (!this.currentTokenIs(TokenType.SEMICOLON)) {
      this.nextToken();
    }

    const returnStatement = new ReturnStatement(returnValue);
    return returnStatement;
  }

  currentTokenIs(type: TokenType): boolean {
    return this.currentToken.type === type;
  }

  peekTokenIs(type: TokenType): boolean {
    return this.peekToken.type === type;
  }

  expectPeek(type: TokenType): boolean {
    if (this.peekTokenIs(type)) {
      this.nextToken();
      return true;
    } else {
      this.peekError(type);
      return false;
    }
  }

  peekError(type: TokenType) {
    const message = `Expected next token to be ${type}, got ${this.peekToken.type} instead`;
    this.errors.push(message);
  }
}

