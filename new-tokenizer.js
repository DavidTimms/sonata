var Token = require("./token");
var Position = require("./position");

// TODO Implement comments

// these characters are treated as separate tokens 
// even if not surrounded by whitespace
var punctuationChars = "(){}[].,;:|@";

var specialOperators = ["::"];

function tokenize(inputString) {
	var tokens = [];

	// Add a new line to the start of the input to 
	// ensure that the token array starts with an indent
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

	// Add 4 end-of-file tokens because some parts of the 
	// parser may look ahead up to four tokens, and will
	// error if the token is null
	tokens.push(Token.eof(), Token.eof(), Token.eof(), Token.eof());

	// store a link to the token array and each token's position in it
	// as a property, so they can navigate relatively between tokens
	tokens.forEach(function (token, i) {
		token.index = i;
		token.tokenArray = tokens;
		return token;
	});

	return tokens;
}

function getNextToken(str, position) {
	return (
		whiteSpace(str, position) ||
		indent(str, position) ||
		comment(str, position) ||
		specialOperator(str, position) ||
		punctuation(str, position) ||
		numberLiteral(str, position) ||
		regexLiteral(str, position) ||
		stringLiteral(str, position) ||
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
	var taken = false;

	while (isNewLineChar(str.charAt(0))) {
		position = position.newLine();
		taken = takeStringWhile(str.slice(1), isWhiteSpaceChar);
		str = taken.rest;
	}

	if (taken) {
		return {
			token: Token.indent(taken.head, position),
			rest: str,
			position: position.moveColumn(taken.head.length),
		};
	}
	else return false;
}

function comment(str, position) {
	if (str.charAt(0) === "#") {
		var taken = takeStringWhile(str.slice(1), isCommentChar);
		return {
			token: Token.comment("#" + taken.head, position),
			rest: taken.rest,
			position: position.moveColumn(taken.head.length + 1),
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

function numberLiteral(str, position) {
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

function stringLiteral(str, position, isRegex) {
	var delim = str.charAt(0);
	if (isRegex || isStringDelimiterChar(delim)) {

		var taken = takeStringWhile(
			str.slice(1), isNotDelimiter(delim), "escape");

		var wrappedString = delim + taken.head + delim;

		return {
			token: isRegex ?
				Token.regex(wrappedString, position) :
				Token.string(wrappedString, position),
			rest: taken.rest.slice(1),
			position: position.moveColumn(wrappedString.length),
		};
	}
	else return false;
}

function regexLiteral(str, position) {
	if (str.charAt(0) === "/") {
		// if the opening slash is followed by whitespace,
		// it is a division symbol, so fall through to make
		// it an identifier
		if (/\s/.test(str.charAt(1))) {
			return false;
		}
		// double slash is an invalid regex because it is a comment in JS
		else if (str.charAt(1) === "/") {
			position.error("Empty regular expression literal");
		}

		return stringLiteral(str, position, "regex");
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

function isCommentChar(ch) {
	return ch !== "\n" && ch !== "#";
}

// matches punctuation characters defined in the string at the top
function isPunctuationChar(ch) {
	return punctuationChars.indexOf(ch) >= 0;
}

function isNumericChar(ch) {
	return (/[0-9]/).test(ch);
}

function isStringDelimiterChar(ch) {
	return ch === "\"" || ch === "\'";
}

function isIdentifierChar(ch) {
	return  (!isNewLineChar(ch)) && 
			(!isPunctuationChar(ch)) && 
			(!isWhiteSpaceChar(ch)) &&
			(!isStringDelimiterChar(ch));
}

function isNotDelimiter(delimiter) {
	return function (ch, i, str) {
		if (ch === delimiter) {
			// count the number of backslashes preceding the delimiter
			var backslashCount = 0;
			while (str.charAt(i - backslashCount - 1) === "\\") {
				backslashCount += 1;
			}

			return isOdd(backslashCount);
		}
		else return true;
	};
}

function isEven(x) {
	return x % 2 === 0;
}

function isOdd(x) {
	return x % 2 === 1;
}

function not(predicate) {
	return function () {
		return !predicate.apply(this, arguments);
	};
}

function takeStringWhile(str, predicate, escape) {
	var i = 0;
	var backslashCount = 0;

	while (i < str.length && predicate(str.charAt(i), i, str)) {
		i += 1;
	}

	return {
		head: str.slice(0, i),
		rest: str.slice(i)
	};
}

module.exports = tokenize;