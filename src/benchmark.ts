import { Compiler } from './compiler/compiler/compiler';
import { VM } from './compiler/vm/vm';
import { evaluator } from './interpreter/evaluator/evaluator';
import { Environment } from './interpreter/object/environment';
import { getProgramAndParser } from './testTools';

function main() {
  const input = `
  let fibonacci = fn(x) {
    if (x == 0) {
    return 0;
    } else {
      if (x == 1) {
        return 1;
      } else {
        fibonacci(x - 1) + fibonacci(x - 2);
      }
    }
  };
  fibonacci(35);
`;

  const { program } = getProgramAndParser(input);

  const compiler = new Compiler();
  const error = compiler.compile(program);
  if (error) {
    console.error(error);
    return;
  }

  const vm = new VM(compiler.bytecode());
  const vmStart = Date.now();
  vm.run();
  const vmResult = vm.lastPoppedStackElement();
  console.log('VM:', vmResult.inspect(), Date.now() - vmStart, 'ms');

  const environment = new Environment();
  const interpreterStart = Date.now();
  const interpreterResult = evaluator(program, environment);
  console.log('Interpreter:', interpreterResult.inspect(), Date.now() - interpreterStart, 'ms');
}

main();
