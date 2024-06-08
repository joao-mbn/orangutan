import {
  AstNode,
  BlockStatement,
  BooleanLiteral,
  ExpressionStatement,
  IfExpression,
  InfixExpression,
  IntegerLiteral,
  PrefixExpression,
  Program,
} from '../../interpreter/ast/ast';
import { IntegerObject, InternalObject } from '../../interpreter/object/object';
import { Instructions, Opcode, concatInstructions, make } from '../code/code';

export class Compiler {
  instructions: Instructions;
  constants: InternalObject[];
  lastInstruction: EmittedInstruction;
  previousInstruction: EmittedInstruction;

  constructor() {
    this.instructions = new Instructions(0);
    this.constants = [];

    /* bogus values */
    this.lastInstruction = { opcode: Opcode.OpConstant, position: -1 };
    this.previousInstruction = { opcode: Opcode.OpConstant, position: -1 };
  }

  compile(node: AstNode): Error | null {
    let error: Error | null = null;
    switch (true) {
      case node instanceof Program:
      case node instanceof BlockStatement:
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
      case node instanceof IfExpression:
        error = this.compile(node.condition);
        if (error) {
          return error;
        }

        // Create jump to with bogus value to be corrected once we compile the consequence and know its length. Bogus value inserted for clarity, not really needed.
        const opJumpNotTruthyPosition = this.emit(Opcode.OpJumpNotTruthy, 9999);

        error = this.compile(node.consequence);
        if (error) {
          return error;
        }

        if (this.lastInstructionIsPop()) {
          this.removeLastPop();
        }

        /* The jump instruction goes right after the last instruction in the consequence block, if there's an alternative. */
        const opJumpPosition = this.emit(Opcode.OpJump, 9999);

        /* The jump-not-truthy position is the one just after the last instruction after the consequence */
        this.changeOperand(opJumpNotTruthyPosition, this.instructions.length);

        if (node.alternative) {
          error = this.compile(node.alternative);
          if (error) {
            return error;
          }

          if (this.lastInstructionIsPop()) {
            this.removeLastPop();
          }
        } else {
          this.emit(Opcode.OpNull);
        }

        /* The jump position is the one just after the last instruction after the alternative */
        this.changeOperand(opJumpPosition, this.instructions.length);

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

    this.setLastInstruction(op, position);
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

  setLastInstruction(opcode: Opcode, position: number) {
    this.previousInstruction = this.lastInstruction;
    this.lastInstruction = { opcode, position };
  }

  lastInstructionIsPop() {
    return this.lastInstruction.opcode === Opcode.OpPop;
  }

  removeLastPop() {
    this.instructions = this.instructions.slice(0, this.instructions.length - 1);
    this.lastInstruction = this.previousInstruction;
  }

  changeOperand(opPosition: number, operand: number) {
    const opcode = this.instructions[opPosition] as Opcode;

    const newInstruction = make(opcode, operand);
    this.replaceInstruction(opPosition, newInstruction);
  }

  replaceInstruction(position: number, newInstruction: Instructions) {
    for (let i = 0; i < newInstruction.length; i++) {
      this.instructions[position + i] = newInstruction[i];
    }
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

type EmittedInstruction = {
  opcode: Opcode;
  position: number;
};

