import { Lexer } from '../lexer/lexer';
import { Parser } from '../parser/parser';

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
        parser.errors.forEach((error) => {
          console.error(`\t${error}\n`);
        });
        throw new Error('Parser error');
      } else {
        console.log(program.asString());
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
