export enum TokenType {
  ILLEGAL = 'ILLEGAL', // Unknown token
  EOF = 'EOF', // End of file

  // Identifiers + literals
  IDENT = 'IDENT', // add, foobar, x, y, ...
  INT = 'INT', // 123456
  STRING = 'STRING',

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

  OR = '||',
  AND = '&&',

  // Delimiters
  COMMA = ',',
  SEMICOLON = ';',
  COLON = ':',

  LPAREN = '(',
  RPAREN = ')',
  LBRACE = '{',
  RBRACE = '}',
  LBRACKET = '[',
  RBRACKET = ']',

  // Keywords
  FUNCTION = 'FUNCTION',
  LET = 'LET',
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  IF = 'IF',
  ELSE = 'ELSE',
  RETURN = 'RETURN',
  WHILE = 'WHILE'
}

export type Token = {
  type: TokenType;
  literal: string;
};

export const keywords: Map<string, TokenType> = new Map([
  ['fn', TokenType.FUNCTION],
  ['let', TokenType.LET],
  ['true', TokenType.TRUE],
  ['false', TokenType.FALSE],
  ['if', TokenType.IF],
  ['else', TokenType.ELSE],
  ['return', TokenType.RETURN],
  ['while', TokenType.WHILE]
]);

export function getKeywordLiteral(tokenType: TokenType) {
  let literal = '';

  keywords.forEach((value, key) => {
    if (value === tokenType) {
      literal = key;
    }
  });

  return literal;
}

