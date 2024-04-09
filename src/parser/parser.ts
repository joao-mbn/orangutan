import {
  BooleanLiteral,
  Expression,
  ExpressionStatement,
  Identifier,
  InfixExpression,
  IntegerLiteral,
  LetStatement,
  PrefixExpression,
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

const tokenPrecedences: Map<TokenType, Precedence> = new Map([
  [TokenType.EQ, Precedence.EQUALS],
  [TokenType.NOT_EQ, Precedence.EQUALS],
  [TokenType.LT, Precedence.LESSGREATER],
  [TokenType.GT, Precedence.LESSGREATER],
  [TokenType.PLUS, Precedence.SUM],
  [TokenType.MINUS, Precedence.SUM],
  [TokenType.SLASH, Precedence.PRODUCT],
  [TokenType.ASTERISK, Precedence.PRODUCT]
]);

// TODO: Remove Expression | null return types and null checks.
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
    [TokenType.FUNCTION, this.parseFunctionLiteral.bind(this)]
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

    if (lexer.input === '(5 + 5) * 2;') {
      debugger;
    }

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
    const expression: Expression = {
      expressionNode: () => {},
      tokenLiteral: () => '',
      asString: () => 'expression'
    };
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
    const returnValue: Expression = {
      expressionNode: () => {},
      tokenLiteral: () => '',
      asString: () => 'returnValue'
    };
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

  parseIfExpression(): Expression {
    throw new Error(' not implemented.');
  }

  parseFunctionLiteral(): Expression {
    throw new Error(' not implemented.');
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

  parseCallExpression(node: Expression): Expression {
    throw new Error(' not implemented.');
  }
}

