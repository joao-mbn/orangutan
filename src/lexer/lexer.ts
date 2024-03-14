import { Token, TokenType } from '../token';

export class Lexer {
  input: string;
  position: number; // Current position in input (points to current char)
  readPosition: number; // Current reading position in input (after current char)
  char: string; // Byte representation of current char under examination

  constructor(input: string) {
    this.input = input;
    this.position = 0;
    this.readPosition = 0;
    this.char = '';

    this.readChar();
  }

  readChar() {
    if (this.readPosition >= this.input.length) {
      this.char = ''; // Nothing read or EOF.
    } else {
      this.char = this.input[this.readPosition];
    }

    this.position = this.readPosition;
    this.readPosition++;
  }

  nextToken(): Token {
    let tokenType: TokenType;
    const currentChar = this.char;

    switch (currentChar) {
      case '=':
        tokenType = TokenType.ASSIGN;
        break;
      case ';':
        tokenType = TokenType.SEMICOLON;
        break;
      case '(':
        tokenType = TokenType.LPAREN;
        break;
      case ')':
        tokenType = TokenType.RPAREN;
        break;
      case ',':
        tokenType = TokenType.COMMA;
        break;
      case '+':
        tokenType = TokenType.PLUS;
        break;
      case '{':
        tokenType = TokenType.LBRACE;
        break;
      case '}':
        tokenType = TokenType.RBRACE;
        break;
      case '':
        tokenType = TokenType.EOF;
        break;
      default:
        tokenType = TokenType.ILLEGAL;
    }

    this.readChar();
    return { type: tokenType, literal: currentChar };
  }
}
