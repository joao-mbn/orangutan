import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ExpressionStatement,
  Identifier,
  InfixExpression,
  IntegerLiteral,
  LetStatement,
  PrefixExpression
} from '../ast/ast';
import { Lexer } from '../lexer/lexer';
import { Parser } from './parser';

describe('Parser', () => {
  function getProgramAndParser(input: string) {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);

    const program = parser.parseProgram();

    if (program == null) {
      throw new Error('ParseProgram() returned null');
    }

    return { program, parser };
  }

  function hasNoErrors(parser: Parser) {
    parser.errors.forEach((error) => {
      console.error(`parser error: ${error}`);
    });

    assert.strictEqual(parser.errors.length, 0);
  }

  describe('parse let statements', () => {
    const input = `
let x = 5;
let y = 10;
let foobar = 838383;
  `;

    const { program, parser } = getProgramAndParser(input);

    it('has no errors', () => hasNoErrors(parser));

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
  });

  describe('parse return statements', () => {
    const input = `
return 5;
return 10;
return 993322;
  `;

    const { program, parser } = getProgramAndParser(input);

    it('has no errors', () => hasNoErrors(parser));

    it('has 3 statements', () => {
      assert.strictEqual(program.statements.length, 3);
    });
  });

  describe('parse identifier expressions', () => {
    const input = 'foobar;';

    const { program, parser } = getProgramAndParser(input);

    it('has no errors', () => hasNoErrors(parser));

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

  function testIntegerLiteral(expression: IntegerLiteral, value: number) {
    it('expression is integer literal', () => {
      assert.ok(expression instanceof IntegerLiteral);
    });

    it('expression value is correct', () => {
      assert.strictEqual(expression.value, value);
      assert.strictEqual(expression.tokenLiteral(), value.toString());
    });
  }

  describe('parse integer literal expressions', () => {
    const input = '5;';

    const { program, parser } = getProgramAndParser(input);

    it('has no errors', () => hasNoErrors(parser));

    it('has 1 statement', () => {
      assert.strictEqual(program.statements.length, 1);
    });

    it('first statement is instance of ExpressionStatement', () => {
      assert.ok(program.statements[0] instanceof ExpressionStatement);
    });

    testIntegerLiteral((program.statements[0] as ExpressionStatement).expression as IntegerLiteral, 5);
  });

  describe('parse prefix expressions', () => {
    const prefixTests = [
      { input: '!5;', operator: '!', value: 5 },
      { input: '-15;', operator: '-', value: 15 }
    ];

    prefixTests.forEach(({ input, operator, value }) => {
      const { program, parser } = getProgramAndParser(input);

      it('has no errors', () => hasNoErrors(parser));

      it('has 1 statement', () => {
        assert.strictEqual(program.statements.length, 1);
      });

      it('first statement is instance of ExpressionStatement', () => {
        assert.ok(program.statements[0] instanceof ExpressionStatement);
      });

      const prefixExpression = (program.statements[0] as ExpressionStatement).expression as PrefixExpression;

      it(`first statement's expression has the correct operator`, () => {
        assert.strictEqual(prefixExpression.operator, operator);
      });

      testIntegerLiteral(prefixExpression.right as IntegerLiteral, value);
    });
  });

  describe('parse infix expressions', () => {
    const infixTests = [
      { input: '5 + 5;', leftValue: 5, operator: '+', rightValue: 5 },
      { input: '5 - 5;', leftValue: 5, operator: '-', rightValue: 5 },
      { input: '5 * 5;', leftValue: 5, operator: '*', rightValue: 5 },
      { input: '5 / 5;', leftValue: 5, operator: '/', rightValue: 5 },
      { input: '5 > 5;', leftValue: 5, operator: '>', rightValue: 5 },
      { input: '5 < 5;', leftValue: 5, operator: '<', rightValue: 5 },
      { input: '5 == 5;', leftValue: 5, operator: '==', rightValue: 5 },
      { input: '5 != 5;', leftValue: 5, operator: '!=', rightValue: 5 }
    ];

    infixTests.forEach(({ input, leftValue, operator, rightValue }) => {
      const { program, parser } = getProgramAndParser(input);

      it('has no errors', () => hasNoErrors(parser));

      it('has 1 statement', () => {
        assert.strictEqual(program.statements.length, 1);
      });

      it('first statement is instance of ExpressionStatement', () => {
        assert.ok(program.statements[0] instanceof ExpressionStatement);
      });

      const infixExpression = (program.statements[0] as ExpressionStatement).expression as InfixExpression;

      testIntegerLiteral(infixExpression.left as IntegerLiteral, leftValue);

      it(`first statement's expression has the correct operator`, () => {
        assert.strictEqual(infixExpression.operator, operator);
      });

      testIntegerLiteral(infixExpression.right as IntegerLiteral, rightValue);
    });
  });

  describe('operator precedence parsing', () => {
    const tests = [
      { input: '-a * b;', expected: '((-a) * b)' },
      { input: '!-a;', expected: '(!(-a))' },
      { input: 'a + b + c;', expected: '((a + b) + c)' },
      { input: 'a + b - c;', expected: '((a + b) - c)' },
      { input: 'a * b * c;', expected: '((a * b) * c)' },
      { input: 'a * b / c;', expected: '((a * b) / c)' },
      { input: 'a + b / c;', expected: '(a + (b / c))' },
      { input: 'a + b * c + d / e - f;', expected: '(((a + (b * c)) + (d / e)) - f)' },
      { input: '3 + 4; -5 * 5;', expected: '(3 + 4)\n((-5) * 5)' },
      { input: '5 > 4 == 3 < 4;', expected: '((5 > 4) == (3 < 4))' },
      { input: '5 < 4 != 3 > 4;', expected: '((5 < 4) != (3 > 4))' },
      { input: '3 + 4 * 5 == 3 * 1 + 4 * 5;', expected: '((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))' }
    ];

    tests.forEach(({ input, expected }) => {
      const { program, parser } = getProgramAndParser(input);

      it('has no errors', () => hasNoErrors(parser));

      it('program parses expressions in order of precedence', () => {
        assert.strictEqual(program.asString(), expected);
      });
    });
  });
});

