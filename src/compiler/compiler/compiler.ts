import {
  AstNode,
  BooleanLiteral,
  ExpressionStatement,
  InfixExpression,
  IntegerLiteral,
  PrefixExpression,
  Program
} from '../../interpreter/ast/ast';
import { IntegerObject, InternalObject } from '../../interpreter/object/object';
import { Instructions, Opcode, concatInstructions, make } from '../code/code';

export class Compiler {
  instructions: Instructions;
  constants: InternalObject[];

  constructor() {
    this.instructions = new Instructions(0);
    this.constants = [];
  }

  compile(node: AstNode): Error | null {
    let error: Error | null = null;
    switch (true) {
      case node instanceof Program:
        for (const statement of node.statements) {
          error = this.compile(statement);
          if (error) {
            return error;
          }
        }
        break;
      case node instanceof ExpressionStatement:
        error = this.compile(node.expression);
        if (error) {
          return error;
        }
        this.emit(Opcode.OpPop);
        break;
      case node instanceof InfixExpression:
        const shouldInvert = node.operator === '<';

        error = this.compile(shouldInvert ? node.right : node.left);
        if (error) {
          return error;
        }

        error = this.compile(shouldInvert ? node.left : node.right);
        if (error) {
          return error;
        }

        switch (node.operator) {
          case '+':
            this.emit(Opcode.OpAdd);
            break;
          case '-':
            this.emit(Opcode.OpSub);
            break;
          case '*':
            this.emit(Opcode.OpMul);
            break;
          case '/':
            this.emit(Opcode.OpDiv);
            break;
          case '==':
            this.emit(Opcode.OpEqual);
            break;
          case '!=':
            this.emit(Opcode.OpNotEqual);
            break;
          case '<':
          case '>':
            this.emit(Opcode.OpGreaterThan);
            break;
          default:
            return new Error(`Unknown operator ${node.operator}`);
        }
        break;
      case node instanceof PrefixExpression:
        error = this.compile(node.right);
        if (error) {
          return error;
        }

        switch (node.operator) {
          case '!':
            this.emit(Opcode.OpBang);
            break;
          case '-':
            this.emit(Opcode.OpMinus);
            break;
          default:
            return new Error(`Unknown operator ${node.operator}`);
        }
        break;
      case node instanceof IntegerLiteral:
        const integer = new IntegerObject(node.value);
        this.emit(Opcode.OpConstant, this.addConstant(integer));
        break;
      case node instanceof BooleanLiteral:
        if (node.value) {
          this.emit(Opcode.OpTrue);
        } else {
          this.emit(Opcode.OpFalse);
        }
        break;
      default:
        throw new Error('Not implemented');
    }
    return null;
  }

  bytecode() {
    return new Bytecode(this.instructions, this.constants);
  }

  emit(op: Opcode, ...operands: number[]) {
    const instruction = make(op, ...operands);
    const position = this.addInstruction(instruction);
    return position;
  }

  addInstruction(instruction: Instructions) {
    const positionNewInstruction = this.instructions.length;
    this.instructions = concatInstructions([this.instructions, instruction]);

    return positionNewInstruction;
  }

  addConstant(object: InternalObject) {
    this.constants.push(object);
    return this.constants.length - 1;
  }
}

export class Bytecode {
  instructions: Instructions;
  constants: InternalObject[];

  constructor(instructions: Instructions, constants: InternalObject[]) {
    this.instructions = instructions;
    this.constants = constants;
  }
}

