var tokenize = require("../main-tokenizer.js");
var parse = require("../tdop-parser.js");

var tests = {
	"-2":  "(-2)",

	"45.2":  "(45.2)",

	"a + b":  "((+ a b))",

	"a + b * c": "((+ a (* b c)))",

	"a - b - c": "((- (- a b) c))",

	"name = 'Maria'":  "((= name 'Maria'))",

	"x = y = 2": "((= x (= y 2)))",

	"a * b - 2":  "((- (* a b) 2))",

	"a + \n23":  "((+ a 23))",

	"a + b\n":  "((+ a b))",

	"23 * (2 - 3)":  "((* 23 (- 2 3)))",

	"(23 * 2) - 3":  "((- (* 23 2) 3))",

	"x + y # add x to y": "((+ x y))",

	"if true # always #: print('hi')": "((if true ((print 'hi'))))",

	"func()":  "((func))",

	"func( arg\n)":  "((func arg))",

	"func(arg1, arg2 + something)":  "((func arg1 (+ arg2 something)))",

	"func(arg) % 4 == 2":  "((== (% (func arg) 4) 2))",

	"[a, b, c, d]":  "((Vector a b c d))",

	"[a, [b + 3, c], d]":  "((Vector a (Vector (+ b 3) c) d))",

	"not x <= 89":  "((not (<= x 89)))",

	"func()(10)":  "(((func) 10))",

	"x == 2.7 / 3.3 / 2":  "((== x (/ (/ 2.7 3.3) 2)))",

	"person.name == 'Dave'":  "((== (. person name) 'Dave'))",

	"getCar().maker.country":  "((. (. (getCar) maker) country))",

	"(5 + 4).toString()":  "(((. (+ 5 4) toString)))",

	"[1, 2] ++ [3, 4, 5]":  "((++ (Vector 1 2) (Vector 3 4 5)))",

	"Map {a: 77, b: 99}": "((Map (:object (: a 77) (: b 99))))",

	"fn (): 45 - 2": "((fn () ((- 45 2))))",

	"fn sum(h | t): t.append(h)": "((fn sum (h (| t)) (((. t append) h))))",

	"fn add(a b): a + b": "((fn add (a b) ((+ a b))))",

	"xs.reduce(fn (x, y): x ++ y, '')": "(((. xs reduce) (fn (x y) ((++ x y))) ''))",

	"fn (name = 'Dave'): name ++ '!'": "((fn ((= name 'Dave')) ((++ name '!'))))",

	"fn self.method(): 2": "((fn self method () (2)))",

	"if x < 2: print(x)": "((if (< x 2) ((print x))))",

	"if true: 34 * 23 else: 93 - 2": "((if true ((* 34 23)) ((- 93 2))))",

	"if isTrue():\n 10 \nelse:\n 5": "((if (isTrue) (10) (5)))",

	"if y > z: y + 2": "((if (> y z) ((+ y 2))))",

	"exp1, exp2":  "(exp1 exp2)",

	"variable\n(another + expression)":  "(variable (+ another expression))",

	"list[0]": "(((. list get) 0))",

	"d()['user' ++ id()]['name']": "(((. ((. (d) get) (++ 'user' (id))) get) 'name'))",

	"[[2, 3], [4, 5]][1][0]": "(((. ((. (Vector (Vector 2 3) (Vector 4 5)) get) 1) get) 0))",

	"{name: 'Dave', age: 21}":  "((:object (: name 'Dave') (: age 21)))",

	"{fn self.method(a): a()}": "((:object (: method (fn self method (a) ((a))))))",

	"{fn method(a): a * a}": "((:object (: method (fn method (a) ((* a a))))))",

	"{}":  "((:object))",

	"{nested: {inner: value}}":  "((:object (: nested (:object (: inner value)))))",

	"type Point(x, y)": "((type Point (x y)))",

	"type Person(name, age)('Dave', 21)": "(((type Person (name age)) 'Dave' 21))",

	"type Maybe(value).call(34)": "(((. (type Maybe (value)) call) 34))",

	"do: print(x)": "((do ((print x))))",

	"with applied: 45": "((with applied (45)))",

	"x::Object": "((:: x Object))",

	"if x :: y.type: x": "((if (:: x (. y type)) (x)))",

	"x + 2 => square()": "((=> (+ x 2) (square)))",

	"a => b() => c()": "((=> (=> a (b)) (c)))",

	"@functor": "((@ functor))",

	"@people.map(getAge) + 1": "((+ (@ ((. people map) getAge)) 1))",
};

multilineTest([
	"if s.match(/\s/):",
	"	s2 = s ++ '?'",
	"	print(s)",
	"else:",
	"	print('no')"
], "((if ((. s match) /\s/) ((= s2 (++ s '?')) (print s)) ((print 'no'))))");

multilineTest([
	"xs.map(fn (x):",
	"	print(x)",
	"	x * x",
	").join(' ')"
], "(((. ((. xs map) (fn (x) ((print x) (* x x)))) join) ' '))");

multilineTest([
	"print({",
	"	x: 2,",
	"	'y': 5.5",
	"	2: 'hello' ++ ' world'",
	"})"
], "((print (:object (: x 2) (: 'y' 5.5) (: 2 (++ 'hello' ' world')))))");

multilineTest([
	"{",
	"	fn self.greet(name):",
	"		print('Hi' ++ name)",
	"}"
], "((:object (: greet (fn self greet (name) ((print (++ 'Hi' name)))))))");

multilineTest([
	"type Door(colour):",
	"	fn self.paint(newColour):",
	"",
	"		mix(self, {colour: newColour})"
], 	"((type Door (colour) ((: paint (fn self paint (newColour) " + 
		"((mix self (:object (: colour newColour)))))))))");

multilineTest([
	"type Man(name): ",
	"	gender: 'male'",
	"	fn self.sayHi():",
	"		print('Hi, I am', self.name)",
], 	"((type Man (name) ((: gender 'male') " + 
		"(: sayHi (fn self sayHi () ((print 'Hi, I am' (. self name))))))))");

multilineTest([
	"do:",
	"	x = 2",
	"	y = x + 3",
], "((do ((= x 2) (= y (+ x 3)))))");

multilineTest([
	"with async:",
	"	x = read('file.txt')",
	"	print(x)",
], "((with async ((= x (read 'file.txt')) (print x))))");


runTests(tests);

function test(input, output) {
	//console.log("testing: " + input);
	try {
		var parsed = lispString(parse(tokenize(input)));
	}
	catch (e) {
		throw e;
		var parsed = "Error: " + e.message;
	}
	if (parsed !== output) {
		console.log("Test failed: ");
		console.log("	Expected " + output + ", but received " + parsed);
		console.log(parse(tokenize(input)));
		return false;
	}
	return true;
}

function lispString(ast) {
	return ast instanceof Array ? 
		"(" + ast.map(lispString).join(" ") + ")" : 
		stringifyToken(ast);
}

function stringifyToken(token) {
	switch (typeof token.value) {
		// string tokens
		case "string": return "'" + token.value + "'";
		// identifiers
		case "undefined": return token.name;
		// numbers
		default: return token.value;
	}
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
	tests[lines.join("\n")] = expectedOutput;
}