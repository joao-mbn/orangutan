import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Token, TokenType } from '../token/token';
import { Lexer } from './lexer';

describe('Lexer', () => {
  const input = `
let five = 5;
let ten = 10;

let add = fn(x, y) {
  x + y;
};

let result = add(five, ten);

!-/*5;
5 < 10 > 5;

if (5 < 10) {
  return true;
} else {
  return false;
}`;

  const tests: Token[] = [
    { type: TokenType.LET, literal: 'let' },
    { type: TokenType.IDENT, literal: 'five' },
    { type: TokenType.ASSIGN, literal: '=' },
    { type: TokenType.INT, literal: '5' },
    { type: TokenType.SEMICOLON, literal: ';' },
    { type: TokenType.LET, literal: 'let' },
    { type: TokenType.IDENT, literal: 'ten' },
    { type: TokenType.ASSIGN, literal: '=' },
    { type: TokenType.INT, literal: '10' },
    { type: TokenType.SEMICOLON, literal: ';' },
    { type: TokenType.LET, literal: 'let' },
    { type: TokenType.IDENT, literal: 'add' },
    { type: TokenType.ASSIGN, literal: '=' },
    { type: TokenType.FUNCTION, literal: 'fn' },
    { type: TokenType.LPAREN, literal: '(' },
    { type: TokenType.IDENT, literal: 'x' },
    { type: TokenType.COMMA, literal: ',' },
    { type: TokenType.IDENT, literal: 'y' },
    { type: TokenType.RPAREN, literal: ')' },
    { type: TokenType.LBRACE, literal: '{' },
    { type: TokenType.IDENT, literal: 'x' },
    { type: TokenType.PLUS, literal: '+' },
    { type: TokenType.IDENT, literal: 'y' },
    { type: TokenType.SEMICOLON, literal: ';' },
    { type: TokenType.RBRACE, literal: '}' },
    { type: TokenType.SEMICOLON, literal: ';' },
    { type: TokenType.LET, literal: 'let' },
    { type: TokenType.IDENT, literal: 'result' },
    { type: TokenType.ASSIGN, literal: '=' },
    { type: TokenType.IDENT, literal: 'add' },
    { type: TokenType.LPAREN, literal: '(' },
    { type: TokenType.IDENT, literal: 'five' },
    { type: TokenType.COMMA, literal: ',' },
    { type: TokenType.IDENT, literal: 'ten' },
    { type: TokenType.RPAREN, literal: ')' },
    { type: TokenType.SEMICOLON, literal: ';' },
    { type: TokenType.BANG, literal: '!' },
    { type: TokenType.MINUS, literal: '-' },
    { type: TokenType.SLASH, literal: '/' },
    { type: TokenType.ASTERISK, literal: '*' },
    { type: TokenType.INT, literal: '5' },
    { type: TokenType.SEMICOLON, literal: ';' },
    { type: TokenType.INT, literal: '5' },
    { type: TokenType.LT, literal: '<' },
    { type: TokenType.INT, literal: '10' },
    { type: TokenType.GT, literal: '>' },
    { type: TokenType.INT, literal: '5' },
    { type: TokenType.SEMICOLON, literal: ';' },
    { type: TokenType.IF, literal: 'if' },
    { type: TokenType.LPAREN, literal: '(' },
    { type: TokenType.INT, literal: '5' },
    { type: TokenType.LT, literal: '<' },
    { type: TokenType.INT, literal: '10' },
    { type: TokenType.RPAREN, literal: ')' },
    { type: TokenType.LBRACE, literal: '{' },
    { type: TokenType.RETURN, literal: 'return' },
    { type: TokenType.TRUE, literal: 'true' },
    { type: TokenType.SEMICOLON, literal: ';' },
    { type: TokenType.RBRACE, literal: '}' },
    { type: TokenType.ELSE, literal: 'else' },
    { type: TokenType.LBRACE, literal: '{' },
    { type: TokenType.RETURN, literal: 'return' },
    { type: TokenType.FALSE, literal: 'false' },
    { type: TokenType.SEMICOLON, literal: ';' },
    { type: TokenType.RBRACE, literal: '}' },
    { type: TokenType.EOF, literal: '' }
  ];

  const lexer = new Lexer(input);

  for (const { literal, type } of tests) {
    it(`should return the correct token for "${literal}"`, () => {
      const token = lexer.nextToken();
      assert.strictEqual(token.literal, literal);
      assert.strictEqual(token.type, type);
    });
  }
});
