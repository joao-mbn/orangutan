import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BooleanLiteral,
  Expression,
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

  function testIntegerLiteral(expression: IntegerLiteral, value: number) {
    it('expression is integer literal', () => {
      assert.ok(expression instanceof IntegerLiteral);
    });

    it('expression value is correct', () => {
      assert.strictEqual(expression.value, value);
      assert.strictEqual(expression.tokenLiteral(), value.toString());
    });
  }

  function testIdentifier(expression: Identifier, value: string) {
    it('expression is identifier', () => {
      assert.ok(expression instanceof Identifier);
    });

    it('expression value is correct', () => {
      assert.strictEqual(expression.value, value);
      assert.strictEqual(expression.tokenLiteral(), value);
    });
  }

  function testBooleanLiteral(expression: BooleanLiteral, value: boolean) {
    it('expression is boolean literal', () => {
      assert.ok(expression instanceof BooleanLiteral);
    });

    it('expression value is correct', () => {
      assert.strictEqual(expression.value, value);
      assert.strictEqual(expression.tokenLiteral(), value.toString());
    });
  }

  function testLiteralExpression(expression: Expression, value: number | string | boolean) {
    switch (typeof value) {
      case 'number':
        testIntegerLiteral(expression as IntegerLiteral, value);
        break;
      case 'string':
        testIdentifier(expression as Identifier, value);
        break;
      case 'boolean':
        testBooleanLiteral(expression as BooleanLiteral, value);
        break;
    }
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

    testIdentifier((program.statements[0] as ExpressionStatement).expression as Identifier, 'foobar');
  });

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

  describe('parse boolean literal expressions', () => {
    const booleanTests = [
      { input: 'true;', value: true },
      { input: 'false;', value: false }
    ];

    booleanTests.forEach(({ input, value }) => {
      const { program, parser } = getProgramAndParser(input);

      it('has no errors', () => hasNoErrors(parser));

      it('has 1 statement', () => {
        assert.strictEqual(program.statements.length, 1);
      });

      it('first statement is instance of ExpressionStatement', () => {
        assert.ok(program.statements[0] instanceof ExpressionStatement);
      });

      testBooleanLiteral((program.statements[0] as ExpressionStatement).expression as BooleanLiteral, value);
    });
  });

  describe('parse prefix expressions', () => {
    const prefixTests = [
      { input: '!5;', operator: '!', value: 5 },
      { input: '-15;', operator: '-', value: 15 },
      { input: '!true;', operator: '!', value: true },
      { input: '!false;', operator: '!', value: false }
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

      testLiteralExpression(prefixExpression.right, value);
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
      { input: '5 != 5;', leftValue: 5, operator: '!=', rightValue: 5 },
      { input: 'true == true;', leftValue: true, operator: '==', rightValue: true },
      { input: 'true != false;', leftValue: true, operator: '!=', rightValue: false },
      { input: 'false == false;', leftValue: false, operator: '==', rightValue: false }
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

      testLiteralExpression(infixExpression.left, leftValue);

      it(`first statement's expression has the correct operator`, () => {
        assert.strictEqual(infixExpression.operator, operator);
      });

      testLiteralExpression(infixExpression.right, rightValue);
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
      { input: '3 + 4 * 5 == 3 * 1 + 4 * 5;', expected: '((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))' },
      { input: 'true;', expected: 'true' },
      { input: 'false;', expected: 'false' },
      { input: '3 > 5 == false;', expected: '((3 > 5) == false)' },
      { input: '3 < 5 == true;', expected: '((3 < 5) == true)' },
      { input: '1 + (2 + 3) + 4;', expected: '((1 + (2 + 3)) + 4)' },
      { input: '(5 + 5) * 2;', expected: '((5 + 5) * 2)' },
      { input: '2 / (5 + 5);', expected: '(2 / (5 + 5))' },
      { input: '-(5 + 5);', expected: '(-(5 + 5))' },
      { input: '!(true == true);', expected: '(!(true == true))' }
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

