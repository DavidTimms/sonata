var type = require("./utils/type.js");
var printObj = require('./utils/print-object.js');

module.exports = function (tokens) {
	var parsed = parseBraceBlock(tokens);
	return parsed.exp;
};

var assignmentOp = "=";

var parseBraceBlock = parseSequence({
	of: parseExpression, 
	stopWhen: onToken("}")
});

function parseWSBlock(tokens, pointer) {
	if (tokens[pointer].type === "Indent") {
		var parseResult = parseSequence({
			of: parseExpression, 
			stopWhen: indentLessThan(tokens[pointer].width)
		})(tokens, pointer);

		return {exp: parseResult.exp, pointer: parseResult.pointer - 1};
	}
	else errorAt(tokens[pointer],
		"Block must start on a new line");
}

function indentLessThan(blockIndent) {
	return function (tokens, pointer) {
		var token =  tokens[pointer];
		var nextToken = tokens[pointer + 1];

		if (token.type === "End of File") return true;

		return token.type === "Indent" && 
			token.width < blockIndent && 
			nextToken.type !== "Indent";
	}
}

var scopeCount = 0;

// Parse repeatedly using some parse function
// until the isEnd predicate returns true
function parseSequence(options) {
	var parseNext = options.of;
	return function (tokens, pointer, altIsEnd) {
		var sc = scopeCount++;
		var isEnd = altIsEnd || options.stopWhen;
		var parseResult;
		var expressions = [];
		pointer = advancePointer(tokens, pointer || 0);

		//console.log(sc, "checking:", tokens[pointer]);
		while (!isEnd(tokens, pointer)) {
			parseResult = parseNext(tokens, pointer);
			expressions.push(parseResult.exp);
			//console.log(sc, "now looking at:", tokens[parseResult.pointer]);
			pointer = advanceToNextExpression(
				tokens, parseResult.pointer, isEnd);
			//console.log(sc, "advanced to:", tokens[pointer]);
		}

		return {exp: expressions, pointer: pointer + 1};
	}
}

function parseExpression(tokens, pointer, precedence) {
	pointer = pointer || 0;
	precedence = precedence || 0;
	var parseResult;
	var exp = null;
	var token = tokens[pointer];

	// Parse initial atom of the expression:

	// try to find specific parse function for token, else 
	// find generic parse function for the token type
	var parseFunction = prefixOperators[token.string] || tokenTypeParsers[token.type];
	if (!parseFunction) {
		throw SyntaxError("Unknown token type " + token);
	}

	// Parse expression fragments:

	do {
		parseResult = parseFunction(tokens, pointer, precedence, exp);
		pointer = parseResult.pointer;
		exp = parseResult.exp;

		// get the infix parse function for the next token
		pointer = advancePointer(tokens, pointer);
		token = tokens[pointer];
		parseFunction = infixOperators[token.string];

		// Check that the operator has a precedence
		if (parseFunction && parseFunction.precedence === undefined) {
			throw Error("Undefined precedence for infix operator " + token);
		}

		// break to stop function calls being split over line breaks
		if (isBracketAtStartOfLine(tokens, pointer)) break;

		// if the token is an operator with higher precedence than 
		// the current master operator, loop to add the partial expression
	} while (parseFunction && parseFunction.precedence >= precedence);

	return parseResult;
}

function parseLiteral(tokens, pointer, precedence) {
	return {
		exp: {
			type: "Literal",
			value: tokens[pointer].value
		}, 
		pointer: pointer + 1
	};
}

function parseNumber(tokens, pointer, precedence) {
	// lookahead to detect decimals
	if (tokens[pointer + 1].string === "." && 
		tokens[pointer + 2].type === "Number") {

		var value = Number(tokens[pointer].value + 
			"." + tokens[pointer + 2].string);

		if ("" + value === "NaN") {
			errorAt(tokens[pointer], "Invalid number");
		}

		return {
			exp: {
				type: "Literal",
				value: value
			},
			pointer: pointer + 3
		};
	}
	else {
		return parseLiteral(tokens, pointer, precedence);
	}
}

function ignoreToken(tokens, pointer, precedence) {
	return parseExpression(tokens, pointer + 1, precedence);
}

function parseIdentifier(tokens, pointer) {
	return {exp: makeIdentifier(tokens[pointer].string), pointer: pointer + 1};
}

function parsePunctuation(tokens, pointer) {
	throw SyntaxError("Unknown punctuation token: " + tokens[pointer]);
}

function unaryOp(unaryOpPrecedence) {
	function parseUnary (tokens, pointer, precedence) {
		var operandResult = parseExpression(
			tokens, 
			pointer + 1, 
			unaryOpPrecedence);
		return {
			exp: [makeIdentifier(tokens[pointer].string), operandResult.exp], 
			pointer: operandResult.pointer
		};
	}
	return parseUnary;
}

function binaryOp(binaryOpPrecedence) {
	function parseBinary (tokens, pointer, precedence, left) {
		var rightResult = parseExpression(
			tokens, 
			pointer + 1, 
			binaryOpPrecedence);
		return {
			exp: [makeIdentifier(tokens[pointer].string), left, rightResult.exp], 
			pointer: rightResult.pointer
		};
	}
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

function parseCall(tokens, pointer, precedence, callee) {
	var functionCall = [callee];
	var endToken = matchToken[tokens[pointer].string];
	// advance pointer to start of first argument
	pointer += 1;
	while (tokens[pointer].string !== endToken) {
		parseResult = parseExpression(tokens, pointer);
		pointer = parseResult.pointer;
		functionCall.push(parseResult.exp);
		pointer = advancePointer(tokens, pointer);
	}
	return {exp: functionCall, pointer: pointer + 1};
}

function parseCall(tokens, pointer, precedence, callee) {
	return prependCallee(callee, parseArguments(tokens, pointer + 1));
}

var parseArguments = parseSequence({
	of: parseExpression, 
	stopWhen: onToken(")")
});

function parseMemberAccess(tokens, pointer, precedence, parent) {
	if (tokens[pointer + 1].type !== "Identifier") {
		errorAt(tokens[pointer], 
			"the property of an object must be an identifier");
	}
	var property = makeIdentifier(tokens[pointer + 1].string);
	return {
		exp: [makeIdentifier("."), parent, property], 
		pointer: pointer + 2
	};
}

function parseLambda(tokens, pointer) {
	var name = null;
	pointer += 1;
	// for function declarations, parse the function name
	if (tokens[pointer].type === "Identifier") {
		name = makeIdentifier(tokens[pointer].string);
		pointer += 1;
	}
	var params = parseParams(tokens, pointer);
	var body = parseBody(tokens, params.pointer);

	var lambda = [makeIdentifier("fn"), params.exp, body.exp];
	return {
		// create assignment for function declarations
		exp: (name ? [makeIdentifier(assignmentOp), name, lambda] : lambda), 
		pointer: body.pointer
	};
}

function parseParams(tokens, pointer) {
	var param, params = [], endToken = ")";
	checkToken(tokens, pointer, "(");
	pointer += 1;
	while (tokens[pointer].string !== endToken) {
		// rest parameter
		if (tokens[pointer].string === "|") {
			param = parseParam(tokens, pointer + 1);
			params.push([makeIdentifier("|"), param.exp]);
			pointer = advancePointer(tokens, param.pointer);
			// check for closing parenthesis
			checkToken(tokens, pointer, endToken);
			break;
		}
		param = parseParam(tokens, pointer);
		params.push(param.exp);
		pointer = advancePointer(tokens, param.pointer);
	}
	return {exp: params, pointer: pointer + 1};
}

function parseParam(tokens, pointer) {
	var param = parseExpression(tokens, pointer);
	if (isIdentifier(param.exp) ||
		// check for default parameter assignment
		(isCallTo(assignmentOp, param.exp) && isIdentifier(param.exp[1]))) {
		return param;
	}
	else errorAt(tokens[pointer], 
		"invalid parameter name in function");
}

function parseIf(tokens, pointer) {
	var test = parseExpression(tokens, pointer + 1);

	var ifBody = parseBody(tokens, test.pointer);
	var elseBody = parseElse(tokens, ifBody.pointer);
	//elseBody.exp will be an empty array if there is no else part
	return {
		exp: [makeIdentifier("if"), test.exp, ifBody.exp].concat(elseBody.exp),
		pointer: elseBody.pointer
	};
}

function parseElse(tokens, pointer) {
	advPointer = advancePointer(tokens, pointer);
	if (tokens[advPointer].string === "else") {
		var elseBody = parseBody(tokens, advPointer + 1);
		return {
			exp: [elseBody.exp], 
			pointer: elseBody.pointer
		};
	}
	else return {exp: [], pointer: pointer};
}

function parseBraceBody(tokens, pointer) {
	pointer = advancePointer(tokens, pointer);

	if (tokens[pointer].string === "{") {
		return parseBraceBlock(tokens, pointer + 1);
	}
	else {
		var expResult = parseExpression(tokens, pointer);
		return {exp: [expResult.exp], pointer: expResult.pointer};
	}
}

function parseBody(tokens, pointer) {
	pointer = advancePointer(tokens, pointer);

	checkToken(tokens, pointer, ":");

	if (tokens[pointer + 1].type === "Indent") {
		return parseWSBlock(tokens, pointer + 1);
	}
	else {
		var expResult = parseExpression(tokens, pointer + 1);
		return {exp: [expResult.exp], pointer: expResult.pointer};
	}
}

function parseType(tokens, pointer) {
	var behaviour;
	var token = tokens[pointer + 1];
	if (!isIdentifier(token)) errorAt(token, 
			"Expected a type name, but found " + token.string);

	var typeName = parseIdentifier(tokens, pointer + 1).exp;
	var params = parseParams(tokens, pointer + 2);

	// optional behaviour block
	pointer = params.pointer;
	if (tokens[pointer].string === "{") {
		behaviour = parseObjLiteral(tokens, pointer + 1);
		pointer = behaviour.pointer;
	}

	return {
		exp: [makeIdentifier("type"), typeName, params.exp]
			.concat(behaviour ? [behaviour.exp] : []), 
		pointer: pointer
	};
}

function parseDoBlock(tokens, pointer) {
	var blockBody = parseBody(tokens, pointer + 1);
	return {
		exp: [makeIdentifier("do"), blockBody.exp], 
		pointer: blockBody.pointer
	};
}

function parseWithBlock(tokens, pointer) {
	var controller = parseExpression(tokens, pointer + 1);

	var blockBody = parseBody(tokens, controller.pointer);

	return {
		exp: [makeIdentifier("with"), controller.exp, blockBody.exp], 
		pointer: blockBody.pointer
	};
}

var parseObjLiteral = parseSequence({
	of: parseObjProperty, 
	stopWhen: onToken("}")
});

function parseObjProperty(tokens, pointer) {
	var key, value;
	var token = tokens[pointer];

	if (token.string === "fn") {
		return parseMethod(tokens, pointer);
	}
	else if (token.type === "Identifier") {
		key = parseIdentifier(tokens, pointer);
	}
	else if (token.type === "String" || token.type === "Number") {
		key = parseLiteral(tokens, pointer);
	}
	else errorAt(tokens[pointer], "Invalid object property key");

	checkToken(tokens, key.pointer, ":");
	value = parseExpression(tokens, key.pointer + 1);

	return {
		exp: [makeIdentifier(":"), key.exp, value.exp],
		pointer: value.pointer
	};
}

function parseMethod(tokens, pointer) {
	var errorToken;
	pointer += 1; // skip "fn"

	// method signature example:
	// fn self.methodName(params) { body }

	if (isIdentifier(tokens[pointer])) {
		var selfName = makeIdentifier(tokens[pointer].string);
		pointer += 1;
		checkToken(tokens, pointer, ".");
		if (isIdentifier(tokens[pointer + 1])) {
			var methodName = makeIdentifier(tokens[pointer + 1].string);
			var params = parseParams(tokens, pointer + 2);
			var body = parseBody(tokens, params.pointer);

			return {
				exp: [
					makeIdentifier(":fn"), 
					selfName,
					methodName, 
					params.exp, 
					body.exp
				],
				pointer: body.pointer
			};
		}
		else errorToken = tokens[pointer + 1];
	}
	else errorToken = tokens[pointer];

	errorAt(errorToken, "Invalid method signature");
}

var prefixOperators = {
	"-": unaryOp(60),
	"not": unaryOp(30),
	"(": function (tokens, pointer, precedence) {
		var inner = parseExpression(tokens, pointer + 1, 0);
		pointer = advancePointer(tokens, inner.pointer);
		checkToken(tokens, pointer, ")");
		return {exp: inner.exp, pointer: pointer + 1};
	},
	"[": function (tokens, pointer) {
		//return parseCall(tokens, pointer, precedence, );
		return prependCallee("Vector", 
			parseArguments(tokens, pointer + 1, onToken("]")));
	},
	"{": function (tokens, pointer, precedence) {
		return prependCallee(":object", parseObjLiteral(tokens, pointer + 1));
		//return parseCall(tokens, pointer, precedence, makeIdentifier("object"));
	},
	"fn": parseLambda,
	"if": parseIf,
	"type": parseType,
	"do": parseDoBlock,
	"with": parseWithBlock
};

var infixOperators = {
	"++": binaryOp(55),
	// String concatenation operator removed, as ++ can be used
	//"&": binaryOp(55), 
	"^": binaryOp(52),
	"*": binaryOp(50),
	"/": binaryOp(50),
	"%": binaryOp(50),
	"+": binaryOp(40),
	"-": binaryOp(40),
	"<": binaryOp(30),
	">": binaryOp(30),
	"<=": binaryOp(30),
	">=": binaryOp(30),
	"::": binaryOp(30),
	"===": binaryOp(25),
	"==": binaryOp(25),
	"!=": binaryOp(25),
	"and": binaryOp(20),
	"or": binaryOp(15),
	"=": binaryOp(10),
	"<-": binaryOp(10),
	"(": withPrecedence(70, parseCall),
	".": withPrecedence(80, parseMemberAccess)
};

var tokenTypeParsers = {
	"Number": parseNumber,
	"String": parseLiteral,
	"Regex": parseLiteral,
	"Boolean": parseLiteral,
	"Indent": ignoreToken,
	"Comment": ignoreToken,
	"Identifier": parseIdentifier,
	"Punctuation": parsePunctuation,
};

// --------------------HELPER FUNCTIONS-----------------------

function lispString(ast) {
	return (ast instanceof Array) ? 
		"(" + ast.map(lispString).join(" ") + ")" 
			: (typeof(ast.value) === "string") ? 
				"'" + ast.value + "'" 
			: ast.value || ast.name;
}

function isBracketAtStartOfLine(tokens, pointer) {
	return tokens[pointer].string in matchToken && 
		tokens[pointer - 1] && 
		tokens[pointer - 1].type == "Indent";
}

function makeIdentifier(name) {
	return {
		type: "Identifier",
		name: name
	};
}

function isCallTo(identifier, node) {
	return node instanceof Array && node[0].name === identifier;
}

function onToken(tokenString) {
	var f = function (tokens, pointer) {
		var token = tokens[pointer];
		return token.type === "End of File" || token.string === tokenString;
	}
	f.toString = function () {
		return "on token: " + tokenString;
	}
	return f;
}

function advancePointer(tokens, pointer) {
	while (isSkippable(tokens[pointer])) {
		pointer += 1;
	}
	return pointer;
}

function advanceToNextExpression(tokens, pointer, isEnd) {
	var foundDivider = false;
	while (isSkippable(tokens[pointer]) && !isEnd(tokens, pointer)) {
		pointer += 1;
		foundDivider = true;
	}

	// throw an error if two expressions are 
	// on the same line without a comma
	if (!(foundDivider || isEnd(tokens, pointer))) {
		errorAt(tokens[pointer], "Unexpected start of expression");
	}
	return pointer;
}

function isSkippable(token) {
	return token.type === "Indent" || 
		token.string === "," ||
		token.type === "Comment";
}

function checkToken(tokens, pointer, expected) {
	var token = tokens[pointer];
	if (token.string !== expected) {
		errorAt(token, "Expected \"" + expected + 
			"\", but found \"" + token.string + "\"");
	}
	return true;
}

function isIdentifier(node, name) {
	return typeof(node) === "object" && 
		node.type === "Identifier" && 
		(name ? node.name === name : true);
}

function errorAt(token, message) {
	throw new SyntaxError(message + "\nat line " + 
		token.position.line + ":" + token.position.column);
}

function withPrecedence(precedence, func) {
	func.precedence = precedence;
	return func;
}

function prependCallee(callee, parseResult) {
	if (typeof(callee) === "string") callee = makeIdentifier(callee);
	return {
		exp: [callee].concat(parseResult.exp),
		pointer: parseResult.pointer
	};
}