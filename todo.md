TODO
====

 - Syntax:
	X replace braces with significant whitespace.
	- combine parse operations for functions and methods so they can both be used 
	  in object and expression contexts.
	- ES6 style lambdas.
	- List and object property access syntax, eg. `items[2] and user["name"]`.
	- For-in loops.
	- import and export.
	- Object extension syntax, eg. `user{name: "Dave", age: 22}`.

 - Sonata AST walker:
 	- Run after parsing and before conversion to a JS AST.
 	- Check for invalid identifiers.
 	- Check for variables used before they are initialised.
 	- Run macros.
 	- Type checking?

 - Pattern matching, see:
	- Clojure core.match: https://github.com/clojure/core.match/wiki/Understanding-the-algorithm
	- Maranget's algorithm: http://www.cs.tufts.edu/~nr/cs257/archive/luc-maranget/jun08.pdf

 - Type system:
 	- full classes (but not inheritance).
 	- traits.

 - Extras:
	- Wrap calls to built-in functions which return arrays to return immutable vectors.
	- Curried operator lambdas eg. `(+ 4)` as a shorthand for `fn (a) a + 4`.
	- Lexically scoped methods.