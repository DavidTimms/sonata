var tokenize = require("../main-tokenizer.js");
var parse = require("../tdop-parser.js");

runTests({
	"-2":  "(-2)",

	"45.2":  "(45.2)",

	"a + b":  "((+ a b))",

	"a * b - 2":  "((- (* a b) 2))",

	"a + \n23":  "((+ a 23))",

	"a + b\n23":  "((+ a b))",

	"23 * (2 - 3)":  "((* 23 (- 2 3)))",

	"(23 * 2) - 3":  "((- (* 23 2) 3))",

	"func()":  "((func))",

	"func( arg\n)":  "((func arg))",

	"func(arg1, arg2 + something)":  "((func arg1 (+ arg2 something)))",

	"variable\n(another + expression)":  "(variable)",

	"func(arg) % 4 == 2":  "((== (% (func arg) 4) 2))",

	"[a b c d]":  "((list a b c d))",

	"[a, [b + 3, c], d]":  "((list a (list (+ b 3) c) d))",

	"not x <= 89":  "((not (<= x 89)))",

	"func()(10)":  "(((func) 10))",

	"x == 2.7 / 3.3 / 2":  "((== x (/ 2.7 (/ 3.3 2))))",

	"person.name == 'Dave'":  "((== (. person name) 'Dave'))",

	"getCar().maker.country":  "((. (. (getCar) maker) country))",

	"(5 + 4).toString()":  "(((. (+ 5 4) toString)))",

	"[1 2] ++ [3 4 5]":  "((++ (list 1 2) (list 3 4 5)))",

	"fn () 45 - 2": "((fn () ((- 45 2))))",

	"xs.reduce(fn (x y) x & y)": "(((. xs reduce) (fn (x y) ((& x y)))))",

	"fn (name = 'Dave') name & '!'": "((fn ((= name 'Dave')) ((& name '!'))))",

});


function test(input, output) {
	var parsed = lispString(parse(tokenize(input)));
	if (parsed !== output) {
		console.log("Test failed: ");
		console.log("	Expected " + output + ", but received " + parsed);
		return false;
	}
	return true;
}

function lispString(ast) {
	return (ast instanceof Array) ? 
		"(" + ast.map(lispString).join(" ") + ")" 
			: (typeof(ast.value) === "string") ? 
				"'" + ast.value + "'" 
			: ast.value || ast.name;
}

function runTests(tests) {
	var failedCount = 0;
	for (input in tests) {
		if (!test(input, tests[input])) {
			failedCount += 1;
		}
	}
	if (failedCount === 0) {
		console.log("All tests passed");
	}
}