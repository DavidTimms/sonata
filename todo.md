TODO
====

 - Syntax:
	X replace braces with significant whitespace.
	X make colon optional after else.
	X combine parse operations for functions and methods so they can both be used 
	  in object and expression contexts.
	X ES6 style lambdas.
	- 'type Point(x, y)' -> 'record Point {x, y}'?
	X Vector and Map property access syntax, eg. `items[2] and user["name"]`.
	- return.
	- For-in loops.
	- import and export.
	- Object extension syntax, eg. `user[name: "Dave", age: 22]`.

 - Sonata AST walker:
 	- Run after parsing and before conversion to a JS AST.
 	- Check for invalid identifiers.
 	- Check for variables used before they are initialised.
 	- Run macros.
 	- Type checking?

 - Pattern matching:
 	- write matchers for:
 		X literals
 		X vectors
 		- splats
 		- objects
 		- structs
 		- maps
 	- match keyword
 	- improve variable hoisting to work on matches
 	- function argument matching
 	- see:
		- Clojure core.match: https://github.com/clojure/core.match/wiki/Understanding-the-algorithm
		- Maranget's algorithm: http://www.cs.tufts.edu/~nr/cs257/archive/luc-maranget/jun08.pdf

 - Type system:
 	- full classes (but not inheritance).
 	- traits.

 - Extras:
	- Wrap calls to built-in functions which return arrays to return immutable vectors.
	- Curried operator lambdas eg. `(+ 4)` as a shorthand for `fn (a) a + 4`.
	- Lexically scoped methods.