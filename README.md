# Orangutan - Monkey Language Implementation

A TypeScript implementation of the Monkey programming language, featuring both a interpreter and a compiler with virtual machine, following along with Thorsten Ball's excellent books.

When the author proposes the implementation of a compiler, one of the main selling points of using one is that execution tends to be a lot faster than an interpreted language. Curiously enough, my implementation using Typescript happen to show the opposite result when benchmarking: where the author's benchmark found a compiler about 3 times faster, my implementation yielded a compiler about 2 times slower.

## About Monkey

Monkey is a programming language that is implemented over the course of two books: [Writing An Interpreter In Go](https://interpreterbook.com/) and [Writing A Compiler In Go](https://compilerbook.com/). It doesn't have an official spec, and it's up to the reader to make it its own.

Learn more about Monkey at the [official website](https://monkeylang.org/).

## Extensions

This interpreter's implementation extends the original Monkey language with:

- **While Loops**: `while (condition) { ... }` syntax for iterative control flow
- **Logical Operators**: `&&` (and) and `||` (or) operators for boolean logic

## Project Structure

```
src/
├── interpreter/         # Tree-walking interpreter implementation
│   ├── lexer/           # Tokenization
│   ├── parser/          # AST construction
│   ├── evaluator/       # Expression evaluation
│   ├── object/          # Object system and built-ins
│   └── repl/            # Interactive REPL
├── compiler/            # Bytecode compiler and VM
│   ├── code/            # Bytecode generation
│   ├── compiler/        # Compilation logic
│   ├── vm/              # Virtual machine
│   └── repl/            # Interactive REPL
└── benchmark.ts         # Performance benchmarks
```

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd orangutan
```

2. Install dependencies:

```bash
npm install
```

## Usage

See the syntax and examples on the [official website](https://monkeylang.org/).

### Running the Interpreter

Start the interpreter REPL:

```bash
npm run start-interpreter
```

### Running the Compiler

Start the compiler and virtual machine REPL:

```bash
npm run start-compiler
```

## Testing

Run all tests:

```bash
npm test
```

Run interpreter tests only:

```bash
npm run test-interpreter
```

Run compiler tests only:

```bash
npm run test-compiler
```

## Performance

Run benchmarks to compare interpreter vs compiler performance:

```bash
npm run benchmark
```

## Books

This implementation follows along with these excellent books:

- **[Writing An Interpreter In Go](https://interpreterbook.com/)** - Learn how to build a tree-walking interpreter
- **[Writing A Compiler In Go](https://compilerbook.com/)** - Learn how to build a bytecode compiler and virtual machine

Both books are highly recommended for anyone interested in a hands-on approach to learning more about how programming languages work under the hood.

