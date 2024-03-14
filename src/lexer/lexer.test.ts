import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Token, TokenType } from '../token';
import { Lexer } from './lexer';

describe('Lexer', () => {
  const input = `=+(){},;`;

  const tests: Token[] = [
    { type: TokenType.ASSIGN, literal: '=' },
    { type: TokenType.PLUS, literal: '+' },
    { type: TokenType.LPAREN, literal: '(' },
    { type: TokenType.RPAREN, literal: ')' },
    { type: TokenType.LBRACE, literal: '{' },
    { type: TokenType.RBRACE, literal: '}' },
    { type: TokenType.COMMA, literal: ',' },
    { type: TokenType.SEMICOLON, literal: ';' },
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
