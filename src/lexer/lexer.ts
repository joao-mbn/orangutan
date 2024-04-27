import { Token, TokenType, keywords } from '../token/token';

export class Lexer {
  input: string;
  position: number; // Current position in input (points to current char)
  readPosition: number; // Current reading position in input (after current char)
  char: string; // Representation of current char under examination

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

  peekChar() {
    if (this.readPosition >= this.input.length) {
      return '';
    } else {
      return this.input[this.readPosition];
    }
  }

  nextToken(): Token {
    this.skipWhitespace();

    let token: Token;

    switch (this.char) {
      case '=':
        if (this.peekChar() === '=') {
          const eq = this.char;
          this.readChar();
          token = { type: TokenType.EQ, literal: eq + this.char };
        } else {
          token = { type: TokenType.ASSIGN, literal: this.char };
        }
        break;
      case '+':
        token = { type: TokenType.PLUS, literal: this.char };
        break;
      case '-':
        token = { type: TokenType.MINUS, literal: this.char };
        break;
      case '!':
        if (this.peekChar() === '=') {
          const bang = this.char;
          this.readChar();
          token = { type: TokenType.NOT_EQ, literal: bang + this.char };
        } else {
          token = { type: TokenType.BANG, literal: this.char };
        }
        break;
      case '*':
        token = { type: TokenType.ASTERISK, literal: this.char };
        break;
      case '/':
        token = { type: TokenType.SLASH, literal: this.char };
        break;
      case '<':
        token = { type: TokenType.LT, literal: this.char };
        break;
      case '>':
        token = { type: TokenType.GT, literal: this.char };
        break;
      case ',':
        token = { type: TokenType.COMMA, literal: this.char };
        break;
      case ';':
        token = { type: TokenType.SEMICOLON, literal: this.char };
        break;
      case '(':
        token = { type: TokenType.LPAREN, literal: this.char };
        break;
      case ')':
        token = { type: TokenType.RPAREN, literal: this.char };
        break;
      case '{':
        token = { type: TokenType.LBRACE, literal: this.char };
        break;
      case '}':
        token = { type: TokenType.RBRACE, literal: this.char };
        break;
      case '[':
        token = { type: TokenType.LBRACKET, literal: this.char };
        break;
      case ']':
        token = { type: TokenType.RBRACKET, literal: this.char };
        break;
      case '"':
        token = this.readString();
        break;
      case '':
        token = { type: TokenType.EOF, literal: '' };
        break;
      default:
        if (this.isLetterOrUnderscore(this.char)) {
          token = this.readIdentifier();
        } else if (this.isDigit(this.char)) {
          token = this.readInteger();
        } else {
          token = { type: TokenType.ILLEGAL, literal: this.char };
        }
    }

    this.readChar();
    return token;
  }

  skipWhitespace() {
    while (/\s/.test(this.char)) {
      this.readChar();
    }
  }

  isLetterOrUnderscore(char: string) {
    return /[a-zA-Z_]/.test(char);
  }

  isDigit(char: string) {
    return /\d/.test(char);
  }

  readIdentifier(): Token {
    let literal = this.char;

    while (this.isLetterOrUnderscore(this.peekChar())) {
      this.readChar();
      literal += this.char;
    }

    const type = keywords.get(literal) || TokenType.IDENT;

    return { type, literal };
  }

  readInteger(): Token {
    let literal = this.char;

    while (this.isDigit(this.peekChar())) {
      this.readChar();
      literal += this.char;
    }

    return { type: TokenType.INT, literal };
  }

  readString(): Token {
    this.readChar(); // Skip opening quote

    let literal = '';

    while (this.char !== '"') {
      literal += this.char;
      this.readChar();
    }

    return { type: TokenType.STRING, literal };
  }
}

