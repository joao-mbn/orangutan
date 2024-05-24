import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ArrayLiteral,
  BlockStatement,
  BooleanLiteral,
  CallExpression,
  Expression,
  ExpressionStatement,
  FunctionLiteral,
  HashLiteral,
  Identifier,
  IfExpression,
  IndexExpression,
  InfixExpression,
  IntegerLiteral,
  LetStatement,
  PrefixExpression,
  ReassignStatement,
  ReturnStatement,
  StringLiteral,
  WhileExpression
} from '../ast/ast';
import { Lexer } from '../lexer/lexer';
import { Parser } from './parser';

export function getProgramAndParser(input: string) {
  const lexer = new Lexer(input);
  const parser = new Parser(lexer);

  const program = parser.parseProgram();

  if (program == null) {
    throw new Error('ParseProgram() returned null');
  }

  return { program, parser };
}

describe('Parser', () => {
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

  function testInfixExpression(
    expression: InfixExpression,
    leftValue: string | number | boolean,
    operator: string,
    rightValue: string | number | boolean
  ) {
    it('expression is infix expression', () => {
      assert.ok(expression instanceof InfixExpression);
    });

    testLiteralExpression(expression.left, leftValue);

    it('expression has correct operator', () => {
      assert.strictEqual(expression.operator, operator);
    });

    testLiteralExpression(expression.right, rightValue);
  }

  function testReassignExpression(
    reassignStatement: ReassignStatement,
    expectedIdentifier: string,
    expectedValue: number | string | boolean
  ) {
    it('first statement is instance of ReassignStatement', () => {
      assert.ok(reassignStatement instanceof ReassignStatement);
    });

    testIdentifier(reassignStatement.name, expectedIdentifier);

    it('value has expected value', () => {
      assert.strictEqual(reassignStatement.value.asString(), expectedValue.toString());
    });
  }

  describe('parse let statements', () => {
    const inputs = [
      { input: 'let x = 5;', expectedIdentifier: 'x', expectedValue: 5 },
      { input: 'let y = true;', expectedIdentifier: 'y', expectedValue: true },
      { input: 'let foobar = y;', expectedIdentifier: 'foobar', expectedValue: 'y' }
    ];

    inputs.forEach(({ input, expectedIdentifier, expectedValue }) => {
      const { program, parser } = getProgramAndParser(input);

      it('has no errors', () => hasNoErrors(parser));

      it('has 1 statement', () => {
        assert.strictEqual(program.statements.length, 1);
      });

      const letStatement = program.statements[0] as LetStatement;
      it('first statement is instance of LetStatement', () => {
        assert.ok(letStatement instanceof LetStatement);
      });

      testIdentifier(letStatement.name, expectedIdentifier);
      testLiteralExpression(letStatement.value, expectedValue);
    });
  });

  describe('parse reassign statements', () => {
    describe('valid reassign statements', () => {
      const inputs = [
        { input: 'x = 5;', expectedIdentifier: 'x', expectedValue: 5 },
        { input: 'foobar = y;', expectedIdentifier: 'foobar', expectedValue: 'y' },
        { input: 'myFunction = fn(x) { x + 5 };', expectedIdentifier: 'myFunction', expectedValue: 'fn(x) { (x + 5) }' }
      ];

      inputs.forEach(({ input, expectedIdentifier, expectedValue }) => {
        const { program, parser } = getProgramAndParser(input);

        it('has no errors', () => hasNoErrors(parser));

        it('has 1 statement', () => {
          assert.strictEqual(program.statements.length, 1);
        });

        const reassignStatement = program.statements[0] as ReassignStatement;
        testReassignExpression(reassignStatement, expectedIdentifier, expectedValue);
      });
    });

    describe('invalid reassign statements', () => {
      const input = '5 = 5;';

      const { parser } = getProgramAndParser(input);

      it('has errors', () => {
        assert.ok(parser.errors.length > 0);
      });

      it('has expected error message', () => {
        assert.strictEqual(parser.errors[0], `Expected identifier on left side of assignment, got 5 instead`);
      });
    });
  });

  describe('parse return statements', () => {
    const inputs = [
      { input: 'return 5;', expectedValue: 5 },
      { input: 'return true;', expectedValue: true },
      { input: 'return foobar;', expectedValue: 'foobar' }
    ];

    inputs.forEach(({ input, expectedValue }) => {
      const { program, parser } = getProgramAndParser(input);

      it('has no errors', () => hasNoErrors(parser));

      it('has 1 statement', () => {
        assert.strictEqual(program.statements.length, 1);
      });

      const returnStatement = program.statements[0] as ReturnStatement;
      it('first statement is instance of ReturnStatement', () => {
        assert.ok(returnStatement instanceof ReturnStatement);
      });

      testLiteralExpression(returnStatement.returnValue, expectedValue);
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
      { input: 'false == false;', leftValue: false, operator: '==', rightValue: false },
      { input: 'true && true;', leftValue: true, operator: '&&', rightValue: true },
      { input: 'true || false;', leftValue: true, operator: '||', rightValue: false }
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

      testInfixExpression(
        (program.statements[0] as ExpressionStatement).expression as InfixExpression,
        leftValue,
        operator,
        rightValue
      );
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
      { input: '!(true == true);', expected: '(!(true == true))' },
      { input: 'a + add(b * c) + d;', expected: '((a + add((b * c))) + d)' },
      {
        input: 'add(a, b, 1, 2 * 3, 4 + 5, add(6, 7 * 8));',
        expected: 'add(a, b, 1, (2 * 3), (4 + 5), add(6, (7 * 8)))'
      },
      { input: 'add(a + b + c * d / f + g);', expected: 'add((((a + b) + ((c * d) / f)) + g))' },
      { input: 'a * [1, 2, 3, 4][b * c] * d;', expected: '((a * ([1, 2, 3, 4][(b * c)])) * d)' },
      { input: 'add(a * b[2], b[1], 2 * [1, 2][1]);', expected: 'add((a * (b[2])), (b[1]), (2 * ([1, 2][1])))' },
      { input: 'true || !false && true;', expected: '(true || ((!false) && true))' },
      { input: '(true || false) && true;', expected: '((true || false) && true)' },
      { input: '5 == add(2, 3) && true;', expected: '((5 == add(2, 3)) && true)' },
      { input: '5 && "hello";', expected: '(5 && hello)' }
    ];

    tests.forEach(({ input, expected }) => {
      const { program, parser } = getProgramAndParser(input);

      it('has no errors', () => hasNoErrors(parser));

      it('program parses expressions in order of precedence', () => {
        assert.strictEqual(program.asString(), expected);
      });
    });
  });

  describe('if-else expression parsing', () => {
    const inputs = ['if (x < y) { x }', 'if (x < y) { x } else { y }'];

    inputs.forEach((input, index) => {
      const { program, parser } = getProgramAndParser(input);

      it('has no errors', () => hasNoErrors(parser));

      it('has 1 statement', () => {
        assert.strictEqual(program.statements.length, 1);
      });

      const expressionStatement = program.statements[0];

      it('first statement is instance of ExpressionStatement', () => {
        assert.ok(expressionStatement instanceof ExpressionStatement);
      });

      const ifExpression = (expressionStatement as ExpressionStatement).expression as IfExpression;

      it('first statement expression is instance of IfExpression', () => {
        assert.ok(ifExpression instanceof IfExpression);
      });

      const condition = ifExpression.condition as InfixExpression;

      it('if expression is infix expression', () => {
        assert.ok(condition instanceof InfixExpression);
      });

      testInfixExpression(condition, 'x', '<', 'y');

      const consequence = ifExpression.consequence;

      it('consequence has 1 statement', () => {
        assert.strictEqual(consequence.statements.length, 1);
      });

      const consequenceStatement = consequence.statements[0] as ExpressionStatement;
      it('first consequence statement is instance of ExpressionStatement', () => {
        assert.ok(consequenceStatement instanceof ExpressionStatement);
      });

      testIdentifier(consequenceStatement.expression as Identifier, 'x');

      if (index === 0) {
        it('has no alternative', () => {
          assert.strictEqual(ifExpression.alternative, null);
        });
      } else {
        const alternative = ifExpression.alternative as BlockStatement;

        it('has alternative', () => {
          assert.ok(alternative instanceof BlockStatement);
        });

        it('alternative has 1 statement', () => {
          assert.strictEqual(alternative.statements.length, 1);
        });

        const alternativeStatement = alternative.statements[0] as ExpressionStatement;
        it('first alternative statement is instance of ExpressionStatement', () => {
          assert.ok(alternativeStatement instanceof ExpressionStatement);
        });

        testIdentifier(alternativeStatement.expression as Identifier, 'y');
      }
    });
  });

  describe('while expression parsing', () => {
    const input = 'while (x < y) { x = x + 1; }';

    const { program, parser } = getProgramAndParser(input);

    it('has no errors', () => hasNoErrors(parser));

    it('has 1 statement', () => {
      assert.strictEqual(program.statements.length, 1);
    });

    it('first statement is instance of ExpressionStatement', () => {
      assert.ok(program.statements[0] instanceof ExpressionStatement);
    });

    const whileExpression = (program.statements[0] as ExpressionStatement).expression as WhileExpression;

    it('first statement expression is instance of WhileExpression', () => {
      assert.ok(whileExpression instanceof WhileExpression);
    });

    const condition = whileExpression.condition as InfixExpression;

    it('while expression is infix expression', () => {
      assert.ok(condition instanceof InfixExpression);
    });

    testInfixExpression(condition, 'x', '<', 'y');

    const block = whileExpression.block;

    it('consequence has 1 statement', () => {
      assert.strictEqual(block.statements.length, 1);
    });

    const firstStatement = block.statements[0] as ReassignStatement;
    testReassignExpression(firstStatement, 'x', '(x + 1)');
  });

  describe('function literal parsing', () => {
    const input = 'fn(x, y) { x + y; }';

    const { program, parser } = getProgramAndParser(input);

    it('has no errors', () => hasNoErrors(parser));

    it('has 1 statement', () => {
      assert.strictEqual(program.statements.length, 1);
    });

    it('first statement is instance of ExpressionStatement', () => {
      assert.ok(program.statements[0] instanceof ExpressionStatement);
    });

    const functionLiteral = (program.statements[0] as ExpressionStatement).expression as FunctionLiteral;

    it('first statement expression is instance of FunctionLiteral', () => {
      assert.ok(functionLiteral instanceof FunctionLiteral);
    });

    it('function literal has 2 parameters', () => {
      assert.strictEqual(functionLiteral.parameters.length, 2);
    });

    const expectedParameters = ['x', 'y'];
    functionLiteral.parameters.forEach((parameter, index) => {
      testLiteralExpression(parameter, expectedParameters[index]);
    });

    const body = functionLiteral.body;

    it('function literal has 1 statement in body', () => {
      assert.strictEqual(body.statements.length, 1);
    });

    it('body statement is instance of ExpressionStatement', () => {
      assert.ok(body.statements[0] instanceof ExpressionStatement);
    });

    testInfixExpression((body.statements[0] as ExpressionStatement).expression as InfixExpression, 'x', '+', 'y');
  });

  describe('function parameter parsing', () => {
    const inputs = [
      { input: 'fn() {};', expected: [] },
      { input: 'fn(x) {};', expected: ['x'] },
      { input: 'fn(x, y, z) {};', expected: ['x', 'y', 'z'] }
    ];

    inputs.forEach(({ input, expected }) => {
      const { program, parser } = getProgramAndParser(input);

      it('has no errors', () => hasNoErrors(parser));

      it('has 1 statement', () => {
        assert.strictEqual(program.statements.length, 1);
      });

      const functionLiteral = (program.statements[0] as ExpressionStatement).expression as FunctionLiteral;

      it('function literal has correct number of parameters', () => {
        assert.strictEqual(functionLiteral.parameters.length, expected.length);
      });

      expected.forEach((expectedParameter, index) => {
        testLiteralExpression(functionLiteral.parameters[index], expectedParameter);
      });
    });
  });

  describe('call expression parsing', () => {
    const input = 'add(1, 2 * 3, 4 + 5);';

    const { program, parser } = getProgramAndParser(input);

    it('has no errors', () => hasNoErrors(parser));

    it('has 1 statement', () => {
      assert.strictEqual(program.statements.length, 1);
    });

    it('first statement is instance of ExpressionStatement', () => {
      assert.ok(program.statements[0] instanceof ExpressionStatement);
    });

    const callExpression = (program.statements[0] as ExpressionStatement).expression as CallExpression;
    it('first statement expression is instance of CallExpression', () => {
      assert.ok(callExpression instanceof CallExpression);
    });

    testIdentifier(callExpression.function as Identifier, 'add');

    it('call expression has 3 arguments', () => {
      assert.strictEqual(callExpression.arguments.length, 3);
    });

    testLiteralExpression(callExpression.arguments[0], 1);
    testInfixExpression(callExpression.arguments[1] as InfixExpression, 2, '*', 3);
    testInfixExpression(callExpression.arguments[2] as InfixExpression, 4, '+', 5);
  });

  describe('call expression parameter parsing', () => {
    const inputs = [
      { input: 'add();', expected: [] },
      { input: 'add(1);', expected: ['1'] },
      { input: 'add(1, 2 * 3, 4 + 5);', expected: ['1', '(2 * 3)', '(4 + 5)'] }
    ];

    inputs.forEach(({ input, expected }) => {
      const { program, parser } = getProgramAndParser(input);

      it('has no errors', () => hasNoErrors(parser));

      it('has 1 statement', () => {
        assert.strictEqual(program.statements.length, 1);
      });

      const callExpression = (program.statements[0] as ExpressionStatement).expression as CallExpression;

      it('call expression has correct number of arguments', () => {
        assert.strictEqual(callExpression.arguments.length, expected.length);
      });

      expected.forEach((expectedArgument, index) => {
        assert.strictEqual(callExpression.arguments[index].asString(), expectedArgument);
      });
    });
  });

  describe('string literal parsing', () => {
    const input = '"hello world";';

    const { program, parser } = getProgramAndParser(input);

    it('has no errors', () => hasNoErrors(parser));

    it('has 1 statement', () => {
      assert.strictEqual(program.statements.length, 1);
    });

    it('first statement is instance of ExpressionStatement', () => {
      assert.ok(program.statements[0] instanceof ExpressionStatement);
    });

    const expression = (program.statements[0] as ExpressionStatement).expression as StringLiteral;

    it('expression is instance of StringLiteral', () => {
      assert.ok(expression instanceof StringLiteral);
    });

    it('expression value is correct', () => {
      assert.strictEqual(expression.tokenLiteral(), 'hello world');
    });
  });

  describe('array literal parsing', () => {
    const input = '[1, 2 * 2, 3 + 3]';
    const { program, parser } = getProgramAndParser(input);

    it('has no errors', () => hasNoErrors(parser));

    it('first statement is instance of ExpressionStatement', () => {
      assert.ok(program.statements[0] instanceof ExpressionStatement);
    });

    const expression = (program.statements[0] as ExpressionStatement).expression as ArrayLiteral;

    it('expression is instance of ArrayLiteral', () => {
      assert.ok(expression instanceof ArrayLiteral);
    });

    it('expression has 3 elements', () => {
      assert.strictEqual(expression.elements.length, 3);
    });

    testLiteralExpression(expression.elements[0], 1);
    testInfixExpression(expression.elements[1] as InfixExpression, 2, '*', 2);
    testInfixExpression(expression.elements[2] as InfixExpression, 3, '+', 3);
  });

  describe('parsing index expressions', () => {
    const input = 'myArray[1 + 1]';
    const { program, parser } = getProgramAndParser(input);

    it('has no errors', () => hasNoErrors(parser));

    it('has 1 statement', () => {
      assert.strictEqual(program.statements.length, 1);
    });

    it('first statement is instance of ExpressionStatement', () => {
      assert.ok(program.statements[0] instanceof ExpressionStatement);
    });

    const expression = (program.statements[0] as ExpressionStatement).expression as IndexExpression;

    it('expression is instance of IndexExpression', () => {
      assert.ok(expression instanceof IndexExpression);
    });

    testIdentifier(expression.left as Identifier, 'myArray');
    testInfixExpression(expression.index as InfixExpression, 1, '+', 1);
  });

  describe('parsing hash literals', () => {
    describe('parsing a hash literal with keys', () => {
      const input = '{ "one": 1 }';
      const { program, parser } = getProgramAndParser(input);

      it('has no errors', () => hasNoErrors(parser));

      it('has 1 statement', () => {
        assert.strictEqual(program.statements.length, 1);
      });

      it('first statement is instance of ExpressionStatement', () => {
        assert.ok(program.statements[0] instanceof ExpressionStatement);
      });

      const expression = (program.statements[0] as ExpressionStatement).expression as HashLiteral;

      it('expression is instance of HashLiteral', () => {
        assert.ok(expression instanceof HashLiteral);
      });

      const expected = new Map([['one', 1]]);

      expression.pairs.forEach((value, key) => {
        it('expression is instance of StringLiteral', () => {
          assert.ok(key instanceof StringLiteral);
        });

        const expectedValue = expected.get(key.tokenLiteral())!;
        testIntegerLiteral(value as IntegerLiteral, expectedValue);
      });
    });

    describe('parse empty hash literal', () => {
      const input = '{}';
      const { program, parser } = getProgramAndParser(input);

      it('has no errors', () => hasNoErrors(parser));

      it('has 1 statement', () => {
        assert.strictEqual(program.statements.length, 1);
      });

      it('first statement is instance of ExpressionStatement', () => {
        assert.ok(program.statements[0] instanceof ExpressionStatement);
      });

      const expression = (program.statements[0] as ExpressionStatement).expression as HashLiteral;

      it('expression is instance of HashLiteral', () => {
        assert.ok(expression instanceof HashLiteral);
      });

      it('expression has no pairs', () => {
        assert.strictEqual(expression.pairs.size, 0);
      });
    });

    describe('parse boolean keys', () => {
      const input = '{ true: 1, false: 2 }';
      const { program, parser } = getProgramAndParser(input);

      it('has no errors', () => hasNoErrors(parser));

      it('has 1 statement', () => {
        assert.strictEqual(program.statements.length, 1);
      });

      it('first statement is instance of ExpressionStatement', () => {
        assert.ok(program.statements[0] instanceof ExpressionStatement);
      });

      const expression = (program.statements[0] as ExpressionStatement).expression as HashLiteral;

      it('expression is instance of HashLiteral', () => {
        assert.ok(expression instanceof HashLiteral);
      });

      const expected = new Map([
        ['true', 1],
        ['false', 2]
      ]);

      expression.pairs.forEach((value, key) => {
        it('expression is instance of BooleanLiteral', () => {
          assert.ok(key instanceof BooleanLiteral);
        });

        const expectedValue = expected.get(key.tokenLiteral())!;
        testIntegerLiteral(value as IntegerLiteral, expectedValue);
      });
    });

    describe('parse integer keys', () => {
      const input = '{ 1: 1, 2: 2 }';
      const { program, parser } = getProgramAndParser(input);

      it('has no errors', () => hasNoErrors(parser));

      it('has 1 statement', () => {
        assert.strictEqual(program.statements.length, 1);
      });

      it('first statement is instance of ExpressionStatement', () => {
        assert.ok(program.statements[0] instanceof ExpressionStatement);
      });

      const expression = (program.statements[0] as ExpressionStatement).expression as HashLiteral;

      it('expression is instance of HashLiteral', () => {
        assert.ok(expression instanceof HashLiteral);
      });

      const expected = new Map([
        ['1', 1],
        ['2', 2]
      ]);

      expression.pairs.forEach((value, key) => {
        it('expression is instance of IntegerLiteral', () => {
          assert.ok(key instanceof IntegerLiteral);
        });

        const expectedValue = expected.get(key.tokenLiteral())!;
        testIntegerLiteral(value as IntegerLiteral, expectedValue);
      });
    });

    describe('parse hash literals with expressions', () => {
      const input = '{ "one": 0 + 1, "two": 10 - 8, "three": 15 / 5 }';
      const { program, parser } = getProgramAndParser(input);

      it('has no errors', () => hasNoErrors(parser));

      it('has 1 statement', () => {
        assert.strictEqual(program.statements.length, 1);
      });

      it('first statement is instance of ExpressionStatement', () => {
        assert.ok(program.statements[0] instanceof ExpressionStatement);
      });

      const expression = (program.statements[0] as ExpressionStatement).expression as HashLiteral;

      it('expression is instance of HashLiteral', () => {
        assert.ok(expression instanceof HashLiteral);
      });

      const expected = new Map([
        ['one', (expression: InfixExpression) => testInfixExpression(expression, 0, '+', 1)],
        ['two', (expression: InfixExpression) => testInfixExpression(expression, 10, '-', 8)],
        ['three', (expression: InfixExpression) => testInfixExpression(expression, 15, '/', 5)]
      ]);

      expression.pairs.forEach((value, key) => {
        const testFunction = expected.get(key.tokenLiteral())!;
        testFunction(value as InfixExpression);
      });
    });
  });
});

