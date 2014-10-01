//var Immutable = require("immutable"),
//	Sequence = Immutable.Sequence,
//	Vector = Immutable.Vector,
//	Map = Immutable.Map,
//	Range = Immutable.Range,
//	Repeat = Immutable.Repeat,
//	Set = Immutable.Set,
//	eq = Immutable.is;
var Token = require("./token");

// these characters are treated as separate tokens 
// even if not surrounded by whitespace
var punctuationChars = "(){}[].,;:|@";

var specialOperators = ["::"];

function tokenize(inputString) {
	var tokens = [];
	var result = {
		rest: "\n" + inputString, 
		position: Position(0, 0),
	};

	do {
		// getNextToken returns an object 
		// with "token" and "rest" properties
		result = getNextToken(result.rest, result.position);

		if (result.token) {
			tokens.push(result.token);
		}

	} while (result.rest.length > 0);

	tokens.push(Token.eof(), Token.eof(), Token.eof(), Token.eof());

	return tokens;
}

function getNextToken(str, position) {
	return (
		whiteSpace(str, position) ||
		indent(str, position) ||
		specialOperator(str, position) ||
		punctuation(str, position) ||
		numeric(str, position) ||
		stringOrRegex(str, position) ||
		identifier(str, position)
	);
}

function whiteSpace(str, position) {
	if (isWhiteSpaceChar(str.charAt(0))) {
		var taken = takeStringWhile(str, isWhiteSpaceChar);
		return {
			token: null,
			rest: taken.rest,
			position: position.moveColumn(taken.head.length),
		};
	}
	else return false;
}

function indent(str, position) {
	var foundIndent = false;

	while (isNewLineChar(str.charAt(0))) {
		position = position.newLine();
		foundIndent = true;
		var taken = takeStringWhile(str.slice(1), isWhiteSpaceChar);
		str = taken.rest;
	}

	if (foundIndent) {
		return {
			token: Token.indent(taken.head, position),
			rest: str,
			position: position.moveColumn(taken.head.length),
		};
	}
	else return false;
}

function specialOperator(str, position) {
	return specialOperators.reduce(
		function (alreadyFound, operator) {
			if (alreadyFound) return alreadyFound;

			if (str.slice(0, operator.length) === operator) {
				return {
					token: Token.identifier(operator, position),
					rest: str.slice(operator.length),
					position: position.moveColumn(operator.length),
				};
			}
		}, false);
}

function punctuation(str, position) {
	if (isPunctuationChar(str.charAt(0))) {
		return {
			token: Token.punctuation(str.charAt(0), position),
			rest: str.slice(1),
			position: position.moveColumn(1),
		};
	}
	else return false;
}

function numeric(str, position) {
	if (isNumericChar(str.charAt(0))) {
		var taken = takeStringWhile(str, isNumericChar);
		return {
			token: Token.number(taken.head, position),
			rest: taken.rest,
			position: position.moveColumn(taken.head.length),
		};
	}
	else return false;
}

function stringOrRegex(str, position) {
	if (isStringOrRegexDelimeter(str.charAt(0))) {
		var taken = takeEscaped(str);
		return {
			token: taken.head.charAt(0) === "/" ?
				Token.regex(taken.head, position) : 
				Token.string(taken.head, position),
			rest: taken.rest,
			position: position.moveColumn(taken.head.length),
		};
	}
	else return false;
}

function identifier(str, position) {
	var token;
	var taken = takeStringWhile(str, isIdentifierChar);
	var name = taken.head;

	if (!isNaN(Number(name))) {
		token = Token.number(name, position);
	}
	else if (name === "true" || name === "false") {
		token = Token.boolean(name, position);
	}
	else {
		token = Token.identifier(name, position);
	}

	return {
		token: token,
		rest: taken.rest,
		position: position.moveColumn(taken.head.length),
	};
}

// matches whitespace characters other than new lines
function isWhiteSpaceChar(ch) {
	return (/\s/).test(ch) && !isNewLineChar(ch);
}

// matches whitespace characters other than new lines
function isNewLineChar(ch) {
	return ch === "\n";
}

// matches punctuation characters defined in the string at the top
function isPunctuationChar(ch) {
	return punctuationChars.indexOf(ch) >= 0;
}

function isNumericChar(ch) {
	return /[0-9]/.test(ch);
}

function isStringOrRegexDelimeter(ch) {
	return /["'\/]/.test(ch);
}

function isIdentifierChar(ch) {
	return  (!isNewLineChar(ch)) && 
			(!isPunctuationChar(ch)) && 
			(!isWhiteSpaceChar(ch)) &&
			(!isStringOrRegexDelimeter(ch));
}

function isEven(x) {
	return x % 2 === 0;
}

function takeStringWhile(str, predicate) {
	var i = 0;
	while (i < str.length && predicate(str.charAt(i), i, str)) {
		i += 1;
	}

	return {
		head: str.slice(0, i),
		rest: str.slice(i)
	};
}

function takeEscaped(str) {
	var endChar = str.charAt(0);
	var i = 1;
	var backslashCount = 0;
	while (i < str.length) {

		if (str.charAt(i) === endChar && isEven(backslashCount)) {
			break;
		}
		else if (str.charAt(i) === "\\") {
			backslashCount += 1;
		}
		else {
			backslashCount = 0;
		}

		i += 1;
	}

	return {
		head: str.slice(0, i + 1),
		rest: str.slice(i + 1)
	};
}

// Position constructor representing a line and column 
// in the source input
function Position(line, column) {
	var self = new Position.create();
	self.line = line;
	self.column = column;
	return self;
}

Position.create = function Position() {};

Position.prototype = Position.create.prototype = {
	moveColumn: function (distance) {
		return Position(this.line, this.column + distance);
	},
	newLine: function (newColumn) {
		return Position(this.line + 1, newColumn || 0);
	},
};

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
};

//test();

module.exports = tokenize;