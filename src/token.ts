export enum TokenType {
  ILLEGAL = 'ILLEGAL', // Unknown token
  EOF = 'EOF', // End of file

  // Identifiers + literals
  IDENT = 'IDENT', // add, foobar, x, y, ...
  INT = 'INT', // 123456

  // Operators
  ASSIGN = '=',
  PLUS = '+',
  MINUS = '-',
  BANG = '!',
  ASTERISK = '*',
  SLASH = '/',

  LT = '<',
  GT = '>',

  EQ = '==',
  NOT_EQ = '!=',

  // Delimiters
  COMMA = ',',
  SEMICOLON = ';',

  LPAREN = '(',
  RPAREN = ')',
  LBRACE = '{',
  RBRACE = '}',

  // Keywords
  FUNCTION = 'FUNCTION',
  LET = 'LET',
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  IF = 'IF',
  ELSE = 'ELSE',
  RETURN = 'RETURN'
}

export type Token = {
  type: TokenType;
  literal: string;
};
