var type = require("./utils/type.js");
var printObj = require('./utils/print-object.js');

var tokens;
var pointer = 0;

function parseExpression (tokens, pointer, precedence) {
	pointer = pointer || 0;
	precedence = precedence || 0;
	var parseResult, exp, parseFunction, token = tokens[pointer];

	// Parse initial atom of the expression:

	// try to find specific parse function for token, else 
	// find generic parse function for the token type
	parseFunction = prefixOperators[token.string] || tokenTypeParsers[token.type];
	if (!parseFunction) {
		throw SyntaxError("Could not parse \"" + token + "\".");
	}
	parseResult = parseFunction(tokens, pointer, precedence);
	pointer = parseResult.pointer;
	exp = parseResult.exp;

	// Parse additional parts joined by infix operators:

	while (true) {
		pointer = advancePointer(tokens, pointer);
		token = tokens[pointer];
		parseFunction = infixOperators[token.string];

		// Check that the operator has a precedence
		if (parseFunction && parseFunction.precedence === undefined) {
			throw Error("Undefined precedence for infix operator " + token);
		}

		// if the token is an operator with higher precedence than 
		// the current master operator, parse operator's partial expression
		if (parseFunction && parseFunction.precedence >= precedence) {

			// break to stop function calls being split over line breaks
			if (isBracketAtStartOfLine(tokens, pointer)) break;

			parseResult = parseFunction(tokens, pointer, precedence, exp);
			pointer = parseResult.pointer;
			exp = parseResult.exp;
		}
		else break;
	}

	return parseResult;
}

function parseLiteral (tokens, pointer, precedence) {
	return {
		exp: {
			type: "Literal",
			value: tokens[pointer].value
		}, 
		pointer: pointer + 1
	};
}

function parseNumber (tokens, pointer, precedence) {
	// lookahead to detect decimals
	if (tokens[pointer + 1].string === "." && 
		tokens[pointer + 2].type === "Number") {
		return {
			exp: {
				type: "Literal",
				value: Number(tokens[pointer].value + "." + tokens[pointer + 2].value)
			},
			pointer: pointer + 3
		};
	}
	else {
		return parseLiteral(tokens, pointer, precedence);
	}
}

function ignoreToken (tokens, pointer, precedence) {
	return parseExpression(tokens, pointer + 1, precedence);
}

function parseIdentifier (tokens, pointer, precedence) {
	return {exp: makeIdentifier(tokens[pointer].string), pointer: pointer + 1};
}

function parsePunctuation (tokens, pointer) {
	throw SyntaxError("Unknown punctuation token: " + tokens[pointer]);
}

/*
function parseUnary (tokens, pointer, precedence) {
	var operandResult = parseExpression(
		tokens, 
		pointer + 1, 
		unaryOpPrecedences[tokens[pointer].string]);
	return {
		exp: [makeIdentifier(tokens[pointer].string), operandResult.exp], 
		pointer: operandResult.pointer
	};
}
*/

function unaryOp (unaryOpPrecedence) {
	function parseUnary (tokens, pointer, precedence) {
		var operandResult = parseExpression(
			tokens, 
			pointer + 1, 
			unaryOpPrecedence);
		return {
			exp: [makeIdentifier(tokens[pointer].string), operandResult.exp], 
			pointer: operandResult.pointer
		};
	};
	return parseUnary;
}

function binaryOp (binaryOpPrecedence) {
	function parseBinary (tokens, pointer, precedence, left) {
		var rightResult = parseExpression(
			tokens, 
			pointer + 1, 
			binaryOpPrecedence);
		return {
			exp: [makeIdentifier(tokens[pointer].string), left, rightResult.exp], 
			pointer: rightResult.pointer
		};
	};
	// set the precedence to a property of the function, so 
	// parseExpression() can see it to know whether to include the op
	parseBinary.precedence = binaryOpPrecedence;
	return parseBinary;
}

var matchToken = {
	"(": ")",
	"[": "]",
	"{": "}"
};

function parseCall (tokens, pointer, precedence, callee) {
	var functionCall = [callee];
	var endToken = matchToken[tokens[pointer].string];
	// advance pointer to start of first argument
	pointer += 1;
	while (tokens[pointer].string !== endToken) {
		parseResult = parseExpression(tokens, pointer, 0);
		pointer = parseResult.pointer;
		functionCall.push(parseResult.exp);
		pointer = advancePointer(tokens, pointer);
	}
	return {exp: functionCall, pointer: pointer + 1};
}

function isBracketAtStartOfLine (tokens, pointer) {
	return tokens[pointer].string in matchToken && 
		tokens[pointer - 1] && 
		tokens[pointer - 1].type == "Indent";
}

function makeIdentifier (name) {
	return {
		type: "Identifier",
		name: name
	};
}

function advancePointer (tokens, pointer) {
	while (tokens[pointer].type === "Indent" || tokens[pointer].string === ",") {
		pointer += 1;
	}
	return pointer;
}

function checkToken (tokens, pointer, expected) {
	var token = tokens[pointer];
	if (token.string !== expected) {
		console.log("Expected \"" + expected + "\", but found \"" + 
			token.string + "\", at line " + token.position.line + 
			":" + token.position.column);
		system.exit(1);
	}
	return true;
}

function withPrecedence (precedence, func) {
	func.precedence = precedence;
	return func;
}

var unaryOpPrecedences = {
	"-": 60,
	"not": 30
};

var binaryOpPrecedences = {
	"*": 50,
	"/": 50,
	"%": 50,
	"+": 40,
	"-": 40,
	"<": 30,
	">": 30,
	"<=": 30,
	">=": 30,
	"==": 25,
	"!=": 25,
	"and": 20,
	"or": 15,
	"=": 10,
	"(": 80
};

var prefixOperators = {
	"-": unaryOp(60),
	"not": unaryOp(30),
	"(": function (tokens, pointer, precedence) {
		var inner = parseExpression(tokens, pointer + 1, 0);
		pointer = advancePointer(tokens, inner.pointer);
		checkToken(tokens, pointer, ")");
		return {exp: inner.exp, pointer: pointer + 1};
	},
	"[": function (tokens, pointer, precedence) {
		return parseCall(tokens, pointer, precedence, makeIdentifier("list"));
	}
};

var infixOperators = {
	"*": binaryOp(50),
	"/": binaryOp(50),
	"%": binaryOp(50),
	"+": binaryOp(40),
	"-": binaryOp(40),
	"<": binaryOp(30),
	">": binaryOp(30),
	"<=": binaryOp(30),
	">=": binaryOp(30),
	"==": binaryOp(25),
	"!=": binaryOp(25),
	"and": binaryOp(20),
	"or": binaryOp(15),
	"=": binaryOp(10),
	"(": withPrecedence(80, parseCall)
};

var tokenTypeParsers = {
	"Number": parseNumber,
	"String": parseLiteral,
	"Regex": parseLiteral,
	"Boolean": parseLiteral,
	"Indent": ignoreToken,
	"Identifier": parseIdentifier,
	"Punctuation": parsePunctuation
};

function lispString(ast) {
	return (ast instanceof Array) ? 
		"(" + ast.map(lispString).join(" ") + ")" 
		: ast.value || ast.name;
}

module.exports = function (tokens) {
	var parsed = parseExpression(tokens);
	//console.log(lispString(parsed.exp));
	return [parsed.exp];
};