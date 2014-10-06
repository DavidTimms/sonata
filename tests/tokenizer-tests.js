var tokenize = require("../new-tokenizer");

function test() {
	var tests = {
		"hello": ["Identifier(hello)"],
		"x -> 34": ["Identifier(x)", "Identifier(->)", "Number(34)"],
		"foo()\n  bar": [
			"Identifier(foo)", 
			"Punctuation(()", 
			"Punctuation())", 
			"Indent(2)", 
			"Identifier(bar)"
		],
		"45+ 2.0": [
			"Number(45)", 
			"Identifier(+)", 
			"Number(2)", 
			"Punctuation(.)", 
			"Number(0)"
		],
		"'this' is a '\\'string'": [
			"String(this)",
			"Identifier(is)",
			"Identifier(a)",
			"String(\'string)"
		],
		"/Regex\\\\/.test": [
			"Regex(/Regex\\\\/)",
			"Punctuation(.)",
			"Identifier(test)"
		],
		"instance :: Type": [
			"Identifier(instance)",
			"Identifier(::)",
			"Identifier(Type)"
		],
	};

	if (Object.keys(tests).reduce(function (allPrevPassed, input) {
		var actual = tokenize(input).map(pluckTokenValue);
		//console.log(tokenize(input));
		if (equal(actual, tests[input])) {
			return allPrevPassed;
		}
		else {
			console.log("Test failed:");
			console.log("Expected:", tests[input]);
			console.log("Received:", actual);
			return false;
		}
	}, true)) {
		console.log("All tests passed");
	}

	function equal(xs, ys) {
		if (xs instanceof Array) {
			return ys instanceof Array && 
				xs.length === ys.length &&
				xs.every(function (x, i) {
					return equal(x, ys[i]);
				});
		}
		else return xs === ys;
	}

	function pluckTokenValue(token) {
		return token.type + 
			"(" + 
			(token.string || (token.isIndent ? token.width : token.value)) +
			")";
	}
}

test();