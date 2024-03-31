import { Program } from '../ast/ast';
import { Lexer } from '../lexer/lexer';
import { Token, TokenType } from '../token/token';

class Parser {
  lexer: Lexer;
  currentToken: Token;
  peekToken: Token;

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

  parseProgram(): Program | null {
    return null;
  }
}
