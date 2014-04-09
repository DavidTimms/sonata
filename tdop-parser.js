var type = require("./utils/type.js");
var printObj = require('./utils/print-object.js');

var tokens;
var pointer = 0;

function parseExpression (tokens, pointer, precedence) {
	pointer = pointer || 0;
	precedence = precedence || 0;
	var parseResult, exp, parseFunction, token = tokens[pointer];

	// TODO: generalize to allow all prefix syntax rules
	if (token.string in unaryOpPrecedences) {
		parseResult = parseUnary(tokens, pointer, precedence);
		pointer = parseResult.pointer;
		exp = parseResult.exp;
	}
//	if (token.string in prefixOperators) {
//		parseResult = parseUnary(tokens, pointer, precedence);
//		pointer = parseResult.pointer;
//		exp = parseResult.exp;
//	}
	else {
		parseFunction = tokenTypeParsers[token.type];
		if (!parseFunction) {
			throw SyntaxError("Could not parse \"" + token + "\".");
		}
		parseResult = parseFunction(tokens, pointer, precedence);
		pointer = parseResult.pointer;
		exp = parseResult.exp;
	}

	while (true) {
		pointer = advancePointer(tokens, pointer);
		token = tokens[pointer];
		opPrec = binaryOpPrecedences[token.string];

		if (opPrec && opPrec >= precedence) {
			if (token.string in punctuationInfixParsers) {
				if (token.string in matchToken && 
					tokens[pointer - 1] && 
					tokens[pointer - 1].type == "Indent") {
					// break to stop function calls being split over line breaks
					break;
				}
				parseResult = punctuationInfixParsers[token.string](
					tokens, pointer, exp, precedence);
			}
			else {
				parseResult = parseBinary(tokens, pointer, exp, precedence);
			}
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

function parseBinary (tokens, pointer, left, precedence) {
	var tokenString = tokens[pointer].string;
	var rightResult = parseExpression(
		tokens, 
		pointer + 1, 
		binaryOpPrecedences[tokenString]);
	return {
		exp: [makeIdentifier(tokenString), left, rightResult.exp], 
		pointer: rightResult.pointer
	};
}

function parsePunctuation (tokens, pointer, precedence) {
	return punctuationPrefixParsers[tokens[pointer].string](tokens, pointer, precedence);
}

var matchToken = {
	"(": ")",
	"[": "]",
	"{": "}"
};

function parseCall (tokens, pointer, callee, precedence) {
		var functionCall = [callee];
		var endToken = matchToken[tokens[pointer].string];
		// advance pointer to start of first argument
		pointer += 1;
		while (tokens[pointer].string !== endToken) {
			parseResult = parseExpression(tokens, pointer, precedence);
			pointer = parseResult.pointer;
			functionCall.push(parseResult.exp);
			pointer = advancePointer(tokens, pointer);
		}
		return {exp: functionCall, pointer: pointer + 1};
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

var punctuationInfixParsers = {
	"(": parseCall
};

var punctuationPrefixParsers = {
	"(": function (tokens, pointer, precedence) {
		var inner = parseExpression(tokens, pointer + 1, 0);
		pointer = advancePointer(tokens, inner.pointer);
		checkToken(tokens, pointer, ")");
		return {exp: inner.exp, pointer: pointer + 1};
	},
	"[": function (tokens, pointer, precedence) {
		return parseCall(tokens, pointer, makeIdentifier("list"), precedence);
	}
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