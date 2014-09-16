TODO
====

 - Syntax:
	- replace braces with significant whitespace.
	- List and object property access syntax, eg. `items[2] and user{name}`.
	- Object extension syntax, eg. `user{name: "Dave", age: 22}`.
	- For-in loops.

 - Sonata AST walker:
 	- Run after parsing and before conversion to a JS AST.
 	- Check for invalid identifiers.
 	- Check for variables used before they are initialised.
 	- Run macros.

 - Pattern matching, see:
	- Clojure core.match: https://github.com/clojure/core.match/wiki/Understanding-the-algorithm
	- Maranget's algorithm: http://www.cs.tufts.edu/~nr/cs257/archive/luc-maranget/jun08.pdf

 - Type system:
 	- full classes (but not inheritance).
 	- traits.

 - Extras:
	- Wrap calls to built-in functions which return arrays to return texo vectors.
	- Curried operator lambdas eg. `(+ 4)` as a shorthand for `fn (a) a + 4`.
	- Lexically scoped methods.