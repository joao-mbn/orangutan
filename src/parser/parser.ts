import {
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
  Statement,
  StringLiteral
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

const tokenPrecedences: Map<TokenType, Precedence> = new Map([
  [TokenType.EQ, Precedence.EQUALS],
  [TokenType.NOT_EQ, Precedence.EQUALS],
  [TokenType.LT, Precedence.LESSGREATER],
  [TokenType.GT, Precedence.LESSGREATER],
  [TokenType.PLUS, Precedence.SUM],
  [TokenType.MINUS, Precedence.SUM],
  [TokenType.SLASH, Precedence.PRODUCT],
  [TokenType.ASTERISK, Precedence.PRODUCT],
  [TokenType.LPAREN, Precedence.CALL]
]);

export class Parser {
  lexer: Lexer;
  currentToken: Token;
  peekToken: Token;
  errors: string[] = [];

  prefixParseFunctions: Map<TokenType, () => Expression | null> = new Map([
    [TokenType.IDENT, this.parseIdentifier.bind(this)],
    [TokenType.INT, this.parseIntegerLiteral.bind(this)],
    [TokenType.BANG, this.parsePrefixExpression.bind(this)],
    [TokenType.MINUS, this.parsePrefixExpression.bind(this)],
    [TokenType.TRUE, this.parseBoolean.bind(this)],
    [TokenType.FALSE, this.parseBoolean.bind(this)],
    [TokenType.LPAREN, this.parseGroupedExpression.bind(this)],
    [TokenType.IF, this.parseIfExpression.bind(this)],
    [TokenType.FUNCTION, this.parseFunctionLiteral.bind(this)],
    [TokenType.STRING, this.parseStringLiteral.bind(this)]
  ]);

  infixParseFunctions: Map<TokenType, (node: Expression) => Expression | null> = new Map([
    [TokenType.PLUS, this.parseInfixExpression.bind(this)],
    [TokenType.MINUS, this.parseInfixExpression.bind(this)],
    [TokenType.SLASH, this.parseInfixExpression.bind(this)],
    [TokenType.ASTERISK, this.parseInfixExpression.bind(this)],
    [TokenType.EQ, this.parseInfixExpression.bind(this)],
    [TokenType.NOT_EQ, this.parseInfixExpression.bind(this)],
    [TokenType.LT, this.parseInfixExpression.bind(this)],
    [TokenType.GT, this.parseInfixExpression.bind(this)],
    [TokenType.LPAREN, this.parseCallExpression.bind(this)]
  ]);

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

    this.nextToken();

    const expression = this.parseExpression(Precedence.LOWEST);
    if (expression == null) {
      return null;
    }

    if (this.peekTokenIs(TokenType.SEMICOLON)) {
      this.nextToken();
    }

    return new LetStatement(name, expression);
  }

  parseReturnStatement(): ReturnStatement | null {
    // currentToken is already known to be RETURN

    this.nextToken();

    const returnValue = this.parseExpression(Precedence.LOWEST);
    if (returnValue == null) {
      return null;
    }

    if (this.peekTokenIs(TokenType.SEMICOLON)) {
      this.nextToken();
    }

    return new ReturnStatement(returnValue);
  }

  parseExpressionStatement(): ExpressionStatement | null {
    const expression = this.parseExpression(Precedence.LOWEST);
    if (expression == null) {
      return null;
    }

    const statement = new ExpressionStatement(this.currentToken, expression);

    if (this.peekTokenIs(TokenType.SEMICOLON)) {
      this.nextToken();
    }

    return statement;
  }

  parseExpression(precedence: Precedence): Expression | null {
    const prefix = this.prefixParseFunctions.get(this.currentToken.type);
    if (!prefix) {
      this.errors.push(`no prefix parse function for ${this.currentToken.type}`);
      return null;
    }

    let leftExpression = prefix();

    while (leftExpression !== null && !this.peekTokenIs(TokenType.SEMICOLON) && precedence < this.peekPrecedence()) {
      const infix = this.infixParseFunctions.get(this.peekToken.type);
      if (!infix) {
        return leftExpression;
      }

      this.nextToken();

      leftExpression = infix(leftExpression);
    }

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

  currentPrecendence(): Precedence {
    return tokenPrecedences.get(this.currentToken.type) ?? Precedence.LOWEST;
  }

  peekPrecedence(): Precedence {
    return tokenPrecedences.get(this.peekToken.type) ?? Precedence.LOWEST;
  }

  parseIdentifier(): Expression {
    return new Identifier(this.currentToken.literal);
  }

  parseIntegerLiteral(): Expression | null {
    const value = Number(this.currentToken.literal);
    if (isNaN(value)) {
      this.errors.push(`Could not parse ${this.currentToken.literal} as integer`);
      return null;
    }
    return new IntegerLiteral(this.currentToken.literal, value);
  }

  parsePrefixExpression(): Expression | null {
    const token = this.currentToken;
    const operator = this.currentToken.literal;

    this.nextToken();

    const right = this.parseExpression(Precedence.PREFIX);
    if (right == null) {
      return null;
    }

    return new PrefixExpression(token, operator, right);
  }

  parseBoolean(): Expression {
    return new BooleanLiteral(this.currentToken, this.currentTokenIs(TokenType.TRUE));
  }

  parseGroupedExpression(): Expression | null {
    this.nextToken();

    const expression = this.parseExpression(Precedence.LOWEST);

    if (!this.expectPeek(TokenType.RPAREN)) {
      return null;
    }

    return expression;
  }

  parseIfExpression(): Expression | null {
    if (!this.expectPeek(TokenType.LPAREN)) {
      return null;
    }

    this.nextToken();

    const condition = this.parseExpression(Precedence.LOWEST);

    if (!condition) {
      return null;
    }

    if (!this.expectPeek(TokenType.RPAREN)) {
      return null;
    }

    if (!this.expectPeek(TokenType.LBRACE)) {
      return null;
    }

    const consequence = this.parseBlockStatement();

    let alternative = null;

    if (this.peekTokenIs(TokenType.ELSE)) {
      this.nextToken();

      if (!this.expectPeek(TokenType.LBRACE)) {
        return null;
      }

      alternative = this.parseBlockStatement();
    }

    return new IfExpression(condition, consequence, alternative);
  }

  parseBlockStatement(): BlockStatement {
    const statements: Statement[] = [];

    this.nextToken();

    while (!this.currentTokenIs(TokenType.RBRACE) && !this.currentTokenIs(TokenType.EOF)) {
      const statement = this.parseStatement();
      if (statement != null) {
        statements.push(statement);
      }
      this.nextToken();
    }

    return new BlockStatement(statements);
  }

  parseFunctionLiteral(): Expression | null {
    if (!this.expectPeek(TokenType.LPAREN)) {
      return null;
    }

    const parameters = this.parseFunctionParameters();
    if (parameters == null) {
      return null;
    }

    if (!this.expectPeek(TokenType.LBRACE)) {
      return null;
    }

    const body = this.parseBlockStatement();

    return new FunctionLiteral(parameters, body);
  }

  parseFunctionParameters(): Identifier[] | null {
    const identifiers: Identifier[] = [];

    if (this.peekTokenIs(TokenType.RPAREN)) {
      this.nextToken();
      return identifiers;
    }

    this.nextToken();

    const value = this.currentToken.literal;
    identifiers.push(new Identifier(value));

    while (this.peekTokenIs(TokenType.COMMA)) {
      this.nextToken();
      this.nextToken();
      const value = this.currentToken.literal;
      identifiers.push(new Identifier(value));
    }

    if (!this.expectPeek(TokenType.RPAREN)) {
      return null;
    }

    return identifiers;
  }

  parseInfixExpression(left: Expression): Expression | null {
    const precedence = this.currentPrecendence();
    const token = this.currentToken;
    const operator = this.currentToken.literal;

    this.nextToken();

    const right = this.parseExpression(precedence);

    if (right == null) {
      return null;
    }

    return new InfixExpression(token, operator, left, right);
  }

  parseCallExpression(functionExpression: Expression): Expression | null {
    const args = this.parseCallArguments();
    if (args == null) {
      return null;
    }
    return new CallExpression(this.currentToken, functionExpression, args);
  }

  parseCallArguments(): Expression[] | null {
    const args: Expression[] = [];

    if (this.peekTokenIs(TokenType.RPAREN)) {
      this.nextToken();
      return args;
    }

    this.nextToken();

    const expression = this.parseExpression(Precedence.LOWEST);
    if (expression == null) {
      return null;
    }
    args.push(expression);

    while (this.peekTokenIs(TokenType.COMMA)) {
      this.nextToken();
      this.nextToken();

      const expression = this.parseExpression(Precedence.LOWEST);
      if (expression == null) {
        return null;
      }
      args.push(expression);
    }

    if (!this.expectPeek(TokenType.RPAREN)) {
      return null;
    }

    return args;
  }

  parseStringLiteral(): Expression | null {
    return new StringLiteral(this.currentToken.literal);
  }
}

