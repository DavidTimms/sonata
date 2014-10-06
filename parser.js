var printObj = require('./utils/print-object');
var utils = require("./utils/utils");
var bareObject = utils.bareObject;
var generateVarName = utils.generateVarName;

module.exports = function (tokens) {
	var parsed = parseBlock(tokens[0], parseExpression);
	return parsed.exp;
};

function parseBlock(token, elementParser) {
	if (token.isIndent) {
		var parseResult = parseSequence({
			of: elementParser, 
			stopWhen: indentLessThan(token.width)
		})(token);

		return {
			exp: parseResult.exp, 
			token: parseResult.token.previous()
		};
	}
	else token.error("Block must start on a new line");
}

function indentLessThan(blockIndent) {
	return function (token) {
		// checks if next token is also an indent,
		// so empty lines can be skipped
		return token.is("End of File") || 
			(
				token.isIndent && 
				token.width < blockIndent && 
				!token.next().isIndent
			);
	};
}

// Parse repeatedly using some parse function
// until the isEnd predicate returns true
function parseSequence(options) {
	var parseNext = options.of;
	return function (token, altIsEnd) {
		var isEnd = altIsEnd || options.stopWhen;
		var parseResult;
		var expressions = [];
		token = advanceToken(token);

		while (!isEnd(token)) {
			parseResult = parseNext(token);
			expressions.push(parseResult.exp);
			token = advanceToNextExpression(parseResult.token, isEnd);
		}

		return {
			exp: expressions, 
			token: token.next()
		};
	};
}

function parseExpression(token, precedence) {
	precedence = precedence || 0;
	var parseResult;
	var exp = null;

	// Parse initial atom of the expression:

	// try to find specific parse function for token, else 
	// find generic parse function for the token type
	var parser = prefixOperators[token.string] || tokenTypeParsers[token.type];
	if (!parser) {
		throw SyntaxError("Unknown token type " + token);
	}

	// Parse expression fragments:
	do {
		parseResult = parser(token, precedence, exp);
		exp = parseResult.exp;

		// get the infix parse function for the next token
		token = advanceToken(parseResult.token);
		parser = infixOperators[token.string];

		// Check that the operator has a precedence
		if (parser && parser.precedence === undefined) {
			throw Error(
				"Undefined precedence for infix operator: " + token.string);
		}

		// break to stop function calls being split over line breaks
		if (isBracketAtStartOfLine(token)) break;

		// if the token is an operator with higher precedence than 
		// the current master operator, loop to add the partial expression
	} while (parser && parser.precedence > precedence);

	return parseResult;
}

function parseLiteral(token, precedence) {
	return {
		exp: {
			type: "Literal",
			value: token.value
		}, 
		token: token.next()
	};
}

function parseNumber(token, precedence) {
	// lookahead to detect decimals
	if (token.next().is(".") && token.move(2).isNumber) {

		var value = Number(token.value + "." + token.move(2).string);

		if (String(value) === "NaN") {
			token.error("Invalid number");
		}

		return {
			exp: {
				type: "Literal",
				value: value
			},
			token: token.move(3)
		};
	}
	else {
		return parseLiteral(token, precedence);
	}
}

function ignoreToken(token, precedence) {
	return parseExpression(token.next(), precedence);
}

function parseIdentifier(token) {
	return {exp: makeIdentifier(token), token: token.next()};
}

// Should never be reached by a valid program
function parsePunctuation(token) {
	throw token.error("Unexpected character: " + token.string);
}

function unaryOp(unaryOpPrecedence) {
	function parseUnary (token, precedence) {
		var operandResult = parseExpression(token.next(), unaryOpPrecedence);
		return {
			exp: [makeIdentifier(token), operandResult.exp], 
			token: operandResult.token
		};
	}
	return parseUnary;
}

function binaryOp(binaryOpPrecedence, rightAssociative) {
	function parseBinary(token, precedence, leftExp) {

		var rightResult = parseExpression(
			token.next(), 
			binaryOpPrecedence - (rightAssociative ? 0.01 : 0)
		);
		return {
			exp: [makeIdentifier(token), leftExp, rightResult.exp], 
			token: rightResult.token
		};
	}
	// set the precedence to a property of the function, so 
	// parseExpression() can see it to know whether to include the op
	parseBinary.precedence = binaryOpPrecedence;
	return parseBinary;
}

var matchToken = bareObject({
	"(": ")",
	"[": "]",
	"{": "}"
});

function parseCall(token, precedence, callee) {
	return withPrefix([callee], parseArguments(token.next()));
}

var parseArguments = parseSequence({
	of: parseExpression, 
	stopWhen: onToken(")")
});

function parseCallWithObject(token, precedence, callee) {
	var objResult = parseObjLiteral(token);
	return {
		exp: [callee, objResult.exp],
		token: objResult.token
	};
}

function parseMemberAccess(token, precedence, parent) {
	if (token.next().type !== "Identifier") {
		token.error("the property of an object must be an identifier");
	}
	var property = makeIdentifier(token.next());
	return {
		exp: [makeIdentifier("."), parent, property], 
		token: token.move(2)
	};
}

function parseDataStructureGetter(token, precedence, dataStruct) {
	var memberRes = parseExpression(token.next());
	checkToken(memberRes.token, "]");
	return {
		exp: [
			[makeIdentifier("."), dataStruct, makeIdentifier("get")], 
			memberRes.exp
		], 
		token: memberRes.token.next()
	};
}

function parseGrouped(token) {
	var grouped = parseArguments(token.next());
	if (grouped.exp.length === 1) return {
		exp: grouped.exp[0],
		token: grouped.token
	};
	else return withPrefix([":seq"], grouped);
}

function parseLambda(token, precedence, paramExp) {
	var params = isCallTo(":seq", paramExp) ?
		paramExp.slice(1) : 
		[paramExp];

	params.forEach(function (param, i) {
		if (!isValidParam(param)) {
			token.error("Parameter number " + i + 
				" is invalid in a lambda function");
		}
	});

	var body = parseBody(token.next(), "colon optional");
	return {
		exp: [makeIdentifier("fn"), params, body.exp], 
		token: body.token
	};
}

function parseFn(token) {
	return withPrefix(["fn"], (
						fnAnon(token.next()) || 
						fnNamed(token.next()) || 
						fnMethod(token.next()) ||
						token.error("Invalid method")
					));
}

function fnAnon(token) {
	if (token.isNot("(")) return false;

	var params = parseParams(token.next());
	var body = parseBody(params.token, "colon optional");
	return {
		exp: [params.exp, body.exp], 
		token: body.token
	};
}

function fnNamed(token) {
	if (!token.isIdentifier) 
		token.error("Expected function name, but found " + token.string);

	return withPrefix([makeIdentifier(token)], fnAnon(token.next()));
}

function fnMethod(token) {
	var methodNameToken = token.move(2);
	if (!token.isIdentifier &&
		!checkToken(token.next(), ".") &&
		!methodNameToken.isIdentifier)
			return false;

	var selfName = makeIdentifier(token);
	var methodName = makeIdentifier(methodNameToken);

	return withPrefix([selfName, methodName], fnAnon(methodNameToken.next()));
}

var parseParams = parseSequence({
	of: parseParam,
	stopWhen: onToken(")")
});

function parseParam(token) {
	var param = parseExpression(token);
	return isValidParam(param.exp) ? 
		param : token.error("invalid parameter name in function");
}

function isValidParam(exp) {
	return exp.isIdentifier || 
		// check for default parameter assignment
		(isCallTo("=", exp) && isValidParam(exp[1])) ||
		// check for rest parameters
		(isCallTo("...", exp) && exp[1].isIdentifier);
}

function parseIf(token) {
	var test = parseExpression(token.next());
	var ifBody = parseBody(test.token);
	var elseBody = parseElse(ifBody.token);
	//elseBody.exp will be an empty array if there is no else part
	return {
		exp: [makeIdentifier("if"), test.exp, ifBody.exp].concat(elseBody.exp),
		token: elseBody.token
	};
}

function parseElse(token) {
	advToken = advanceToken(token);
	if (advToken.is("else")) {
		var elseBody = parseBody(advToken.next(), "colon optional");
		return {
			exp: [elseBody.exp], 
			token: elseBody.token
		};
	}
	else return {exp: [], token: token};
}

function parseBody(token, colonOptional) {
	while (token.isComment) {
		token = token.next();
	}

	if (colonOptional) {
		if (token.is(":")) {
			token = token.next();
		}
	}
	else {
		checkToken(token, ":");
		token = token.next();
	}

	if (token.isIndent) {
		return parseBlock(token, parseExpression);
	}
	else {
		var expResult = parseExpression(token);
		return {exp: [expResult.exp], token: expResult.token};
	}
}

function parseType(token) {
	var behaviour;
	token = token.next();
	if (!token.isIdentifier) token.error(
			"Expected a type name, but found " + token.string);

	var typeName = parseIdentifier(token).exp;

	checkToken(token.next(), "(");
	var params = parseParams(token.move(2));

	// optional behaviour block
	token = params.token;
	if (token.is(":")) {
		behaviour = parseBlock(token.next(), parseObjProperty);
		token = behaviour.token;
	}

	return {
		exp: [makeIdentifier("type"), typeName, params.exp]
			.concat(behaviour ? [behaviour.exp] : []), 
		token: token
	};
}

function parseDoBlock(token) {
	var blockBody = parseBody(token.next());
	return {
		exp: [makeIdentifier("do"), blockBody.exp], 
		token: blockBody.token
	};
}

function parseWithBlock(token) {
	var controller = parseExpression(token.next());

	var blockBody = parseBody(controller.token);

	return {
		exp: [makeIdentifier("with"), controller.exp, blockBody.exp], 
		token: blockBody.token
	};
}

function parseSetExpression(token) {
	var precedence = 8;
	var assignResult = parseExpression(token.next(), precedence);
	if (isCallTo("=", assignResult.exp)) {
		assignResult.exp[0] = makeIdentifier(token);
		return assignResult;
	}
	else token.error("invalid variable reassignment");
}

function parseObjLiteral(token, precedence) {
	return withPrefix([":object"], parseObjLiteralBody(token.next()));
}

var parseObjLiteralBody = parseSequence({
	of: parseObjProperty, 
	stopWhen: onToken("}")
});

function parseObjProperty(token) {
	var key, value;

	if (token.is("fn")) {
		return parseMethod(token);
	}
	else if (token.isIdentifier) {
		key = parseIdentifier(token);
	}
	else if (token.isString || token.isNumber) {
		key = parseLiteral(token);
	}
	else token.error("Invalid object property key");

	checkToken(key.token, ":");
	value = parseExpression(key.token.next());

	return objProperty(key.exp, value);
}

function objProperty(keyExp, valueRes) {
	return {
		exp: [makeIdentifier(":"), keyExp, valueRes.exp],
		token: valueRes.token
	};
}

function parseMethod(token) {

	var method = fnNamed(token.next());

	if (method) {
		methodName = method.exp[0];
	}
	else {
		method = fnMethod(token.next());

		if (method) {
			methodName = method.exp[1];
			method.exp[1] = null;
		}
		else token.error("Invalid method declaration");
	}

	return objProperty(methodName, withPrefix(["fn"], method));
}

// Not yet working
function curriedOperator(operator) {
	return function (token) {
		var arg = makeIdentifier(generateVarName());
		var body = infixOperators[operator](token, 0, arg);
		return {
			exp: [makeIdentifier("fn"), [arg], [body.exp]],
			token: body.token,
		}
	}
}

var prefixOperators = bareObject({
	"...": unaryOp(5),
	"-": unaryOp(60),
	"not": unaryOp(23),
	"@": unaryOp(65),
	"(": parseGrouped,
	"[": function (token) {
		return withPrefix(["Vector"], 
			parseArguments(token.next(), onToken("]")));
	},
	"{": parseObjLiteral,
	"fn": parseFn,
	"if": parseIf,
	"type": parseType,
	"do": parseDoBlock,
	"with": parseWithBlock,
	"set!": parseSetExpression,
});

var infixOperators = bareObject({
	".": withPrecedence(80, parseMemberAccess),
	"[": withPrecedence(75, parseDataStructureGetter),
	"(": withPrecedence(70, parseCall),
	"{": withPrecedence(70, parseCallWithObject),
	"^": binaryOp(52),
	"*": binaryOp(50),
	"/": binaryOp(50),
	"%": binaryOp(50),
	"+": binaryOp(40),
	"-": binaryOp(40),
	"++": binaryOp(55),
	"<": binaryOp(30),
	">": binaryOp(30),
	"<=": binaryOp(30),
	">=": binaryOp(30),
	"::": binaryOp(30),
	"===": binaryOp(25),
	"==": binaryOp(25),
	"!=": binaryOp(25),
	"and": binaryOp(20),
	"&": binaryOp(20),
	"or": binaryOp(15),
	"|": binaryOp(15),
	"=>": binaryOp(12),
	"->": withPrecedence(11, parseLambda),
	"=": binaryOp(10, "right associative"),
	"<-": binaryOp(10, "right associative"),
});

var tokenTypeParsers = bareObject({
	"Number": parseNumber,
	"String": parseLiteral,
	"Regex": parseLiteral,
	"Boolean": parseLiteral,
	"Indent": ignoreToken,
	"Comment": ignoreToken,
	"Identifier": parseIdentifier,
	"Punctuation": parsePunctuation,
});

// --------------------HELPER FUNCTIONS-----------------------

function lispString(ast) {
	return (ast instanceof Array) ? 
		"(" + ast.map(lispString).join(" ") + ")" 
			: (typeof(ast.value) === "string") ? 
				"'" + ast.value + "'" 
			: ast.value || ast.name;
}

function isBracketAtStartOfLine(token) {
	return token.string in matchToken && isSkippable(token.previous());
}

function makeIdentifier(name) {
	return {
		type: "Identifier",
		name: (typeof(name) === "object") ? name.string : name,
		isIdentifier: true,
	};
}

function isCallTo(identifier, node) {
	return node instanceof Array && node[0].name === identifier;
}

function onToken(stopToken) {
	var f = function (token) {
		return token.is("End of File") || token.is(stopToken);
	};
	f.toString = function () {
		return "on token: " + stopToken;
	};
	return f;
}

function advanceToken(token) {
	while (isSkippable(token)) {
		token = token.next();
	}
	return token;
}

function advanceToNextExpression(token, isEnd) {
	var foundDivider = false;
	while (isSkippable(token) && !isEnd(token)) {
		token = token.next();
		foundDivider = true;
	}

	// throw an error if two expressions are 
	// on the same line without a comma
	if (!(foundDivider || isEnd(token))) {
		token.error("Unexpected start of expression");
	}
	return token;
}

function isSkippable(token) {
	return token.is(",") || 
		token.is(";") || 
		token.isIndent || 
		token.isComment;
}

function checkToken(token, expectedToken) {
	if (token.isNot(expectedToken)) {
		token.error("Expected \"" + expectedToken + 
			"\", but found \"" + token.string + "\"");
	}
	return true;
}

function withPrecedence(precedence, func) {
	func.precedence = precedence;
	return func;
}

function prependCallee(callee, parseResult) {
	if (typeof(callee) === "string") callee = makeIdentifier(callee);
	return {
		exp: [callee].concat(parseResult.exp),
		token: parseResult.token
	};
}

function withPrefix(prefix, parseResult) {
	// propagate failure
	if (!parseResult) return false;
	return {
		exp: prefix.map(wrapIdentifier).concat(parseResult.exp),
		token: parseResult.token
	};
}

function wrapIdentifier(identifier) {
	return typeof(identifier) === "string" ?
		makeIdentifier(identifier) : identifier;
}