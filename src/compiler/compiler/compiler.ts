import {
  ArrayLiteral,
  AstNode,
  BlockStatement,
  BooleanLiteral,
  Expression,
  ExpressionStatement,
  HashLiteral,
  Identifier,
  IfExpression,
  IndexExpression,
  InfixExpression,
  IntegerLiteral,
  LetStatement,
  PrefixExpression,
  Program,
  StringLiteral,
} from '../../interpreter/ast/ast';
import { IntegerObject, InternalObject, StringObject } from '../../interpreter/object/object';
import { Instructions, Opcode, concatInstructions, make } from '../code/code';
import { SymbolTable } from './symbolTable';

export class Compiler {
  instructions: Instructions;
  constants: InternalObject[];
  symbols: SymbolTable;
  lastInstruction: EmittedInstruction;
  previousInstruction: EmittedInstruction;

  constructor(symbols: SymbolTable = new SymbolTable(), constants: InternalObject[] = []) {
    this.instructions = new Instructions(0);
    this.constants = constants;
    this.symbols = symbols;

    /* bogus values */
    this.lastInstruction = { opcode: Opcode.OpConstant, position: -1 };
    this.previousInstruction = { opcode: Opcode.OpConstant, position: -1 };
  }

  compile(node: AstNode): Error | null {
    switch (true) {
      case node instanceof Program:
      case node instanceof BlockStatement:
        for (const statement of node.statements) {
          this.compile(statement);
        }
        break;
      case node instanceof ExpressionStatement:
        this.compile(node.expression);

        this.emit(Opcode.OpPop);
        break;
      case node instanceof InfixExpression:
        const shouldInvert = node.operator === '<';

        this.compile(shouldInvert ? node.right : node.left);

        this.compile(shouldInvert ? node.left : node.right);

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
            throw new Error(`Unknown operator ${node.operator}`);
        }
        break;
      case node instanceof PrefixExpression:
        this.compile(node.right);

        switch (node.operator) {
          case '!':
            this.emit(Opcode.OpBang);
            break;
          case '-':
            this.emit(Opcode.OpMinus);
            break;
          default:
            throw new Error(`Unknown operator ${node.operator}`);
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
      case node instanceof StringLiteral:
        const string = new StringObject(node.token.literal);
        this.emit(Opcode.OpConstant, this.addConstant(string));
        break;
      case node instanceof IfExpression:
        this.compile(node.condition);

        // Create jump to with bogus value to be corrected once we compile the consequence and know its length. Bogus value inserted for clarity, not really needed.
        const opJumpNotTruthyPosition = this.emit(Opcode.OpJumpNotTruthy, 9999);

        this.compile(node.consequence);

        if (this.lastInstructionIsPop()) {
          this.removeLastPop();
        }

        /* The jump instruction goes right after the last instruction in the consequence block, if there's an alternative. */
        const opJumpPosition = this.emit(Opcode.OpJump, 9999);

        /* The jump-not-truthy position is the one just after the last instruction after the consequence */
        this.changeOperand(opJumpNotTruthyPosition, this.instructions.length);

        if (node.alternative) {
          this.compile(node.alternative);

          if (this.lastInstructionIsPop()) {
            this.removeLastPop();
          }
        } else {
          this.emit(Opcode.OpNull);
        }

        /* The jump position is the one just after the last instruction after the alternative */
        this.changeOperand(opJumpPosition, this.instructions.length);

        break;
      case node instanceof Identifier:
        const symbol = this.symbols.resolve(node.value);
        if (!symbol) {
          throw new Error(`Identifier not found: ${node.value}`);
        }
        this.emit(Opcode.OpGetGlobal, symbol.index);
        break;
      case node instanceof LetStatement:
        this.compile(node.value);

        const identifierIndex = this.symbols.define(node.name.value).index;
        this.emit(Opcode.OpSetGlobal, identifierIndex);
        break;
      case node instanceof ArrayLiteral:
        for (const element of node.elements) {
          this.compile(element);
        }

        this.emit(Opcode.OpArray, node.elements.length);
        break;
      case node instanceof HashLiteral:
        const pairs: [Expression, Expression][] = [];
        const entries = node.pairs.entries();

        for (const [key, value] of entries) {
          pairs.push([key, value]);
        }

        /* The sorting is just needed for testing purposes */
        pairs.sort((a, b) => a[0].asString().localeCompare(b[0].asString()));

        for (const [key, value] of pairs) {
          this.compile(key);
          this.compile(value);
        }

        this.emit(Opcode.OpHash, node.pairs.size * 2);
        break;
      case node instanceof IndexExpression:
        this.compile(node.left);
        this.compile(node.index);

        this.emit(Opcode.OpIndex);
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

