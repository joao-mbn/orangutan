import { Lexer } from '../../interpreter/lexer/lexer';
import { Parser } from '../../interpreter/parser/parser';
import { Compiler } from '../compiler/compiler';
import { VM } from '../vm/vm';

export function start() {
  // reads user input from the command line
  process.stdout.write('>> ');
  process.stdin.on('data', function (data) {
    // converts the user input to a string
    const input = data.toString();

    // Allow the user to exit the program
    if (input.toLowerCase().trim() === 'exit' || input.toLowerCase().trim() === 'quit') {
      process.exit();
    }

    try {
      const lexer = new Lexer(input);
      const parser = new Parser(lexer);
      const program = parser.parseProgram();

      if (parser.errors.length > 0) {
        parser.errors.forEach((error) => console.error(`\t${error}\n`));
        console.error('Parser error');
      } else {
        const compiler = new Compiler();
        const compileError = compiler.compile(program);
        if (compileError) {
          console.error('Compiler error');
        }

        const bytecode = compiler.bytecode();
        const vm = new VM(bytecode);

        const runtimeError = vm.run();
        if (runtimeError) {
          console.error('Runtime error');
        }

        const stackTop = vm.stackTop();
        if (stackTop) {
          console.log(stackTop.inspect());
        } else {
          console.error('nothing left in the stack');
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error processing input: ${error.message}`);
      } else {
        console.error('An unknown error occurred');
      }
    } finally {
      // Ensure the prompt is always printed, even if an error occurs
      process.stdout.write('>> ');
    }
  });
}
