import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ExpressionStatement, Identifier, LetStatement } from '../ast/ast';
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

  describe('parse identifier expressions', () => {
    const input = 'foobar;';

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    const program = parser.parseProgram();

    if (program == null) {
      throw new Error('ParseProgram() returned null');
    }

    it('has no errors', () => {
      parser.errors.forEach((error) => {
        console.error(`parser error: ${error}`);
      });

      assert.strictEqual(parser.errors.length, 0);
    });

    it('has 1 statement', () => {
      assert.strictEqual(program.statements.length, 1);
    });

    it('first statement is instance of ExpressionStatement', () => {
      assert.ok(program.statements[0] instanceof ExpressionStatement);
    });

    it("first statement's expression is identifier", () => {
      const expressionStatement = program.statements[0] as ExpressionStatement;
      assert.ok(expressionStatement.expression instanceof Identifier);
    });

    it('first statement literal is foobar', () => {
      const identifier = (program.statements[0] as ExpressionStatement).expression as Identifier;
      assert.strictEqual(identifier.value, 'foobar');
      assert.strictEqual(identifier.tokenLiteral(), 'foobar');
    });
  });
});

