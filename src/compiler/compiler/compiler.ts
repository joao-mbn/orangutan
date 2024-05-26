import { AstNode, ExpressionStatement, InfixExpression, IntegerLiteral, Program } from '../../interpreter/ast/ast';
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
    switch (true) {
      case node instanceof Program:
        for (const statement of node.statements) {
          const error = this.compile(statement);
          if (error) {
            return error;
          }
        }
        break;
      case node instanceof ExpressionStatement:
        const error = this.compile(node.expression);
        if (error) {
          return error;
        }
        break;
      case node instanceof InfixExpression:
        const leftError = this.compile(node.left);
        if (leftError) {
          return leftError;
        }

        const rightError = this.compile(node.right);
        if (rightError) {
          return rightError;
        }
        break;
      case node instanceof IntegerLiteral:
        const integer = new IntegerObject(node.value);
        this.emit(Opcode.OpConstant, this.addConstant(integer));
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

