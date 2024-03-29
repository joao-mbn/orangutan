import { Token, TokenType } from '../token/token';

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
    this.skipWhitespace();

    return this.isSymbolChar() ? this.getSymbolToken() : this.getNonSymbolToken();
  }

  skipWhitespace() {
    while (/\s/.test(this.char)) {
      this.readChar();
    }
  }

  isSymbolChar() {
    return !/\w/.test(this.char);
  }

  getSymbolToken(): Token {
    const currentChar = this.char;

    const singleSymbolTypes = {
      '=': TokenType.ASSIGN,
      '+': TokenType.PLUS,
      '-': TokenType.MINUS,
      '!': TokenType.BANG,
      '*': TokenType.ASTERISK,
      '/': TokenType.SLASH,
      '<': TokenType.LT,
      '>': TokenType.GT,
      ',': TokenType.COMMA,
      ';': TokenType.SEMICOLON,
      '(': TokenType.LPAREN,
      ')': TokenType.RPAREN,
      '{': TokenType.LBRACE,
      '}': TokenType.RBRACE,
      '': TokenType.EOF
    };

    const twoSymbolTypes = {
      '==': TokenType.EQ,
      '!=': TokenType.NOT_EQ
    };

    this.readChar();

    const twoSymbolTokenType = twoSymbolTypes[(currentChar + this.char) as keyof typeof twoSymbolTypes];
    const singleSymbolTokenType = singleSymbolTypes[currentChar as keyof typeof singleSymbolTypes];

    if (twoSymbolTokenType !== undefined) {
      this.readChar();
      return { type: twoSymbolTokenType, literal: currentChar + this.char };
    } else if (singleSymbolTokenType !== undefined) {
      return { type: singleSymbolTokenType, literal: currentChar };
    } else {
      return { type: TokenType.ILLEGAL, literal: currentChar };
    }
  }

  getNonSymbolToken(): Token {
    let literal = this.char;

    this.readChar();
    while (!this.isSymbolChar()) {
      literal += this.char;
      this.readChar();
    }

    const isNumber = /^\d+$/.test(literal);
    if (isNumber) {
      return { type: TokenType.INT, literal };
    }

    const keywords = {
      fn: TokenType.FUNCTION,
      let: TokenType.LET,
      true: TokenType.TRUE,
      false: TokenType.FALSE,
      if: TokenType.IF,
      else: TokenType.ELSE,
      return: TokenType.RETURN
    };

    const type = keywords[literal as keyof typeof keywords] || TokenType.IDENT;

    return { type, literal };
  }
}
