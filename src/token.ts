export enum TokenType {
  ILLEGAL, // Unknown token
  EOF, // End of file

  // Identifiers + literals
  IDENT, // add, foobar, x, y, ...
  INT, // 123456

  // Operators
  ASSIGN,
  PLUS,

  // Delimiters
  COMMA,
  SEMICOLON,

  LPAREN,
  RPAREN,
  LBRACE,
  RBRACE,

  // Keywords
  FUNCTION,
  LET
}

export type Token = {
  type: TokenType;
  literal: string;
};
