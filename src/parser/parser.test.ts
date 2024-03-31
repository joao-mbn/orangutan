import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LetStatement } from '../ast/ast';
import { Lexer } from '../lexer/lexer';
import { Parser } from './parser';

describe('Parser', () => {
  describe('parse let statements', () => {
    const input = `
let x = 5;
let y = 10;
let foobar = 838383;
  `;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    const program = parser.parseProgram();

    if (program == null) {
      throw new Error('ParseProgram() returned null');
    }

    it('has 3 statements', () => {
      assert.strictEqual(program.statements.length, 3);
    });

    const expectedIdentifiers = ['x', 'y', 'foobar'];

    program.statements.forEach((statement, index) => {
      it('has the correct statements', () => {
        assert.strictEqual(statement.tokenLiteral(), 'let');

        const letStatement = statement as LetStatement;
        assert.strictEqual(letStatement.name.value, expectedIdentifiers[index]);
        assert.strictEqual(letStatement.name.tokenLiteral(), expectedIdentifiers[index]);
      });
    });

    it('has no errors', () => {
      parser.errors.forEach((error) => {
        console.error(`parser error: ${error}`);
      });

      assert.strictEqual(parser.errors.length, 0);
    });
  });

  describe('parse return statements', () => {
    const input = `
return 5;
return 10;
return 993322;
  `;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    const program = parser.parseProgram();

    if (program == null) {
      throw new Error('ParseProgram() returned null');
    }

    it('has 3 statements', () => {
      assert.strictEqual(program.statements.length, 3);
    });

    it('has no errors', () => {
      parser.errors.forEach((error) => {
        console.error(`parser error: ${error}`);
      });

      assert.strictEqual(parser.errors.length, 0);
    });
  });
});

