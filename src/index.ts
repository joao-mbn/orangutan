import os from 'os';
import { start } from './repl/repl';

function main() {
  // gets the current user
  const user = os.userInfo().username;

  // welcomes current user
  console.log(`Hello ${user}! This is the Monkey programming language!`);
  console.log('Feel free to type in commands');

  // starts the REPL
  start();
}

main();
