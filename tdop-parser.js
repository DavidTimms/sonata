var type = require("./utils/type.js");
var printObj = require('./utils/print-object.js');

module.exports = function (tokens) {
	var parsed = parseBraceBlock(tokens);

	//console.log(lispString(parsed.exp), parsed.exp.length);
	//console.log(lispString(parsed.exp));
	return parsed.exp;
};

var assignmentOp = ":";

function parseBraceBlock (tokens, pointer) {
	var parseExpResult, expressions = [];
	pointer = advancePointer(tokens, pointer || 0);

	while (tokens[pointer].type !== "End of File" && 
		tokens[pointer].string !== "}") {

		parseExpResult = parseExpression(tokens, pointer);
		expressions.push(parseExpResult.exp);
		pointer = advanceToNextExpression(tokens, parseExpResult.pointer);
	}

	return {exp: expressions, pointer: pointer};
}

function parseExpression (tokens, pointer, precedence) {
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

function parseIdentifier (tokens, pointer) {
	return {exp: makeIdentifier(tokens[pointer].string), pointer: pointer + 1};
}

function parsePunctuation (tokens, pointer) {
	throw SyntaxError("Unknown punctuation token: " + tokens[pointer]);
}

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
	}
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

function parseMemberAccess (tokens, pointer, precedence, parent) {
	if (tokens[pointer + 1].type !== "Identifier") {
		errorAt(tokens[pointer], 
			"the property of an object must be an identifier");
	}
	var child = makeIdentifier(tokens[pointer + 1].string);
	return {exp: [makeIdentifier("."), parent, child], pointer: pointer + 2};
}

function parseLambda (tokens, pointer) {
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

function parseParams (tokens, pointer) {
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

function parseParam (tokens, pointer) {
	var param = parseExpression(tokens, pointer);
	if (isIdentifier(param.exp) ||
		// check for default parameter assignment
		(isCallTo(assignmentOp, param.exp) && isIdentifier(param.exp[1]))) {
		return param;
	}
	else errorAt(tokens[pointer], 
		"invalid parameter name in function");
}

function parseIf (tokens, pointer) {
	var test = parseExpression(tokens, pointer + 1);

	var ifBody = parseBody(tokens, test.pointer);
	var elseBody = parseElse(tokens, ifBody.pointer);
	//elseBody.exp will be an empty array if there is no else part
	return {
		exp: [makeIdentifier("if"), test.exp, ifBody.exp].concat(elseBody.exp), 
		pointer: elseBody.pointer
	};
}

function parseElse (tokens, pointer) {
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

function parseBody (tokens, pointer) {
	pointer = advancePointer(tokens, pointer);
	if (tokens[pointer].string === "{") {
		var blockResult = parseBraceBlock(tokens, pointer + 1);
		checkToken(tokens, blockResult.pointer, "}");
		return {exp: blockResult.exp, pointer: blockResult.pointer + 1};
	}
	else {
		var expResult = parseExpression(tokens, pointer);
		return {exp: [expResult.exp], pointer: expResult.pointer};
	}
}

function parseType (tokens, pointer) {
	var token = tokens[pointer + 1];
	if (!isIdentifier(token)) errorAt(token, 
			"Expected a type name, but found " + token.string);

	var typeName = parseIdentifier(tokens, pointer + 1).exp;
	var properties = parseParams(tokens, pointer + 2);

	return {
		exp: [makeIdentifier("type"), typeName].concat(properties.exp), 
		pointer: properties.pointer
	};
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
	"[": function (tokens, pointer, precedence) {
		return parseCall(tokens, pointer, precedence, makeIdentifier("list"));
	},
	"{": function (tokens, pointer, precedence) {
		return parseCall(tokens, pointer, precedence, makeIdentifier("object"));
	},
	"fn": parseLambda,
	"if": parseIf,
	"type": parseType
};

var infixOperators = {
	"++": binaryOp(55),
	"&": binaryOp(55),
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
	"==": binaryOp(25),
	"=": binaryOp(25),
	"!=": binaryOp(25),
	"and": binaryOp(20),
	"or": binaryOp(15),
	":": binaryOp(10),
	"(": withPrecedence(70, parseCall),
	".": withPrecedence(80, parseMemberAccess),
};

var tokenTypeParsers = {
	"Number": parseNumber,
	"String": parseLiteral,
	"Regex": parseLiteral,
	"Boolean": parseLiteral,
	"Indent": ignoreToken,
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

function isCallTo(identifier, node) {
	return node instanceof Array && node[0].name === identifier;
}

function advancePointer (tokens, pointer) {
	while (tokens[pointer].type === "Indent" || tokens[pointer].string === ",") {
		pointer += 1;
	}
	return pointer;
}

function advanceToNextExpression(tokens, pointer) {
	var foundDivider = false;
	while (tokens[pointer].type === "Indent" || tokens[pointer].string === ",") {
		pointer += 1;
		foundDivider = true;
	}

	// throw an error if two expressions are on the same line without a semicolon
	if (!foundDivider && 
		tokens[pointer].type !== "End of File" && 
		tokens[pointer].string !== "}") {

		errorAt(tokens[pointer], 
			"Unexpected start of expression");
	}
	return pointer;
}

function checkToken (tokens, pointer, expected) {
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
	console.log("Parse Error: " + message + 
		"\nat line " + token.position.line + ":" + token.position.column);
	process.exit(1);
}

function withPrecedence (precedence, func) {
	func.precedence = precedence;
	return func;
}