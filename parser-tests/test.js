var tokenize = require("../main-tokenizer.js");
var parse = require("../tdop-parser.js");

var tests = {
	"-2":  "(-2)",

	"45.2":  "(45.2)",

	"a + b":  "((+ a b))",

	"name: 'Maria'":  "((: name 'Maria'))",

	"a * b - 2":  "((- (* a b) 2))",

	"a + \n23":  "((+ a 23))",

	"a + b\n":  "((+ a b))",

	"23 * (2 - 3)":  "((* 23 (- 2 3)))",

	"(23 * 2) - 3":  "((- (* 23 2) 3))",

	"func()":  "((func))",

	"func( arg\n)":  "((func arg))",

	"func(arg1, arg2 + something)":  "((func arg1 (+ arg2 something)))",

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

	"fn sum(h | t) t.append(h)": "((: sum (fn (h (| t)) (((. t append) h)))))",

	"fn add(a b) {a + b}": "((: add (fn (a b) ((+ a b)))))",

	"xs.reduce(fn (x y) x & y)": "(((. xs reduce) (fn (x y) ((& x y)))))",

	"fn (name: 'Dave') name & '!'": "((fn ((: name 'Dave')) ((& name '!'))))",

	"if (x < 2) print(x)": "((if (< x 2) ((print x))))",

	"if true 34 * 23 else 93 - 2": "((if true ((* 34 23)) ((- 93 2))))",

	"if isTrue() \n10 \nelse\n 5": "((if (isTrue) (10) (5)))",

	"if y > z {y + 2}": "((if (> y z) ((+ y 2))))",

	"exp1, exp2":  "(exp1 exp2)",

	"variable\n(another + expression)":  "(variable (+ another expression))",

	"{name: 'Dave' age: 21}":  "((object (: name 'Dave') (: age 21)))",

	"{}":  "((object))",

	"{nested: {inner: value}}":  "((object (: nested (object (: inner value)))))",

	"type Point(x y)": "((type Point x y))",

	"type Person(name age)('Dave' 21)": "(((type Person name age) 'Dave' 21))",

	"type Maybe(value).call(34)": "(((. (type Maybe value) call) 34))",
};

multilineTest([
	"if s.match(/\s/) {",
	"	s2: s & '?'",
	"	print(s)",
	"} else {",
	"	print('no')",
	"}"
], "((if ((. s match) /\s/) ((: s2 (& s '?')) (print s)) ((print 'no'))))");

multilineTest([
	"xs.map(fn (x) {",
	"	print(x)",
	"	x * x",
	"}).join(' ')"
], "(((. ((. xs map) (fn (x) ((print x) (* x x)))) join) ' '))");

multilineTest([
	"print({",
	"	x: 2,",
	"	y: 5.5",
	"})"
], "((print (object (: x 2) (: y 5.5))))");


runTests(tests);

function test(input, output) {
	var parsed = lispString(parse(tokenize(input)));
	if (parsed !== output) {
		console.log("Test failed: ");
		console.log("	Expected " + output + ", but received " + parsed);
		console.log(tokenize(input));
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

function multilineTest(lines, expectedOutput) {
	test[lines.join("\n")] = expectedOutput;
}