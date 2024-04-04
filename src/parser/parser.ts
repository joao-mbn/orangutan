import {
  Expression,
  ExpressionStatement,
  Identifier,
  LetStatement,
  Program,
  ReturnStatement,
  Statement
} from '../ast/ast';
import { Lexer } from '../lexer/lexer';
import { Token, TokenType } from '../token/token';

enum Precedence {
  _,
  LOWEST,
  EQUALS, // ==
  LESSGREATER, // > or <
  SUM, // +
  PRODUCT, // *
  PREFIX, // -X or !X
  CALL // myFunction(X)
}

export class Parser {
  lexer: Lexer;
  currentToken: Token;
  peekToken: Token;
  errors: string[] = [];

  prefixParseFunctions = {
    [TokenType.IDENT]: this.parseIdentifier.bind(this),
    [TokenType.INT]: this.parseIntegerLiteral.bind(this),
    [TokenType.BANG]: this.parsePrefixExpression.bind(this),
    [TokenType.MINUS]: this.parsePrefixExpression.bind(this),
    [TokenType.TRUE]: this.parseBoolean.bind(this),
    [TokenType.FALSE]: this.parseBoolean.bind(this),
    [TokenType.LPAREN]: this.parseGroupedExpression.bind(this),
    [TokenType.IF]: this.parseIfExpression.bind(this),
    [TokenType.FUNCTION]: this.parseLiteral.bind(this)
  };

  infixParseFunctions = {
    [TokenType.PLUS]: this.parseInfixExpression.bind(this),
    [TokenType.MINUS]: this.parseInfixExpression.bind(this),
    [TokenType.SLASH]: this.parseInfixExpression.bind(this),
    [TokenType.ASTERISK]: this.parseInfixExpression.bind(this),
    [TokenType.EQ]: this.parseInfixExpression.bind(this),
    [TokenType.NOT_EQ]: this.parseInfixExpression.bind(this),
    [TokenType.LT]: this.parseInfixExpression.bind(this),
    [TokenType.GT]: this.parseInfixExpression.bind(this),
    [TokenType.LPAREN]: this.parseCallExpression.bind(this)
  };

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
        return this.parseExpressionStatement();
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

  parseExpressionStatement(): ExpressionStatement | null {
    const expression = this.parseExpression(Precedence.LOWEST);
    if (expression == null) {
      return null;
    }

    const statement = new ExpressionStatement(this.currentToken, expression);

    return statement;
  }

  parseExpression(precedence: Precedence): Expression | null {
    const prefix = this.prefixParseFunctions[this.currentToken.type as keyof typeof this.prefixParseFunctions];
    if (prefix == null) {
      return null;
    }

    let leftExpression = prefix();

    return leftExpression;
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

  parseIdentifier(): Expression {
    return new Identifier(this.currentToken.literal);
  }

  parseIntegerLiteral(): Expression {
    throw new Error(' not implemented.');
  }

  parsePrefixExpression(): Expression {
    throw new Error(' not implemented.');
  }

  parseBoolean(): Expression {
    throw new Error(' not implemented.');
  }

  parseGroupedExpression(): Expression {
    throw new Error(' not implemented.');
  }

  parseIfExpression(): Expression {
    throw new Error(' not implemented.');
  }

  parseLiteral(): Expression {
    throw new Error(' not implemented.');
  }

  parseInfixExpression(node: Expression): Expression {
    throw new Error(' not implemented.');
  }

  parseCallExpression(node: Expression): Expression {
    throw new Error(' not implemented.');
  }
}

