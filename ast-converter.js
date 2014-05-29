var list = require("texo");
var jsonpretty = require('jsonpretty');
var runtimeImport = require("./compile-runtime").runtimeImport;
var snippets = require("./snippets/snippet-parser.js");

var identifierUtils = require("./utils/identifier-utils");
var normalizeIdentifier = identifierUtils.normalizeIdentifier;
var isValidJSIdentifier = identifierUtils.isValidJSIdentifier;

var buildSnippet = null;

var assignmentOp = ":";

function printObj (obj) {
	console.log(jsonpretty(obj));
	return obj;
}

function convertAST (ast, callback) {

	snippets.createSnippetBuilder(
		"./snippets/snippets.js", function (snippetBuilder) {

		// assign global snippet builder function
		buildSnippet = snippetBuilder;

		var context = {isFuncBody: true, noReturn: true};

		var body = buildSnippet("prelude")
			.concat(convertBody(ast, context))
			.concat(buildSnippet("startMain"));

		// Define the program with an immediately invoked function wrapper
		callback({
			type: "Program",
			body: buildSnippet("functionWrapper", {
				statements: body,
				parameters: [],
				arguments: []
			})
		});
	});
}

function convertBody (expressions, context) {
	context = context || {};
	var statements = [];
	var noReturn = context.noReturn;
	var isFuncBody = context.isFuncBody;
	context.noReturn = false;

	// set default parameters
	if (isFuncBody && context.params && context.params.defaults) {
		statements = createDefaultAssignments(context.params.defaults);
		context.params.defaults = false;
	}

	if (noReturn) {
		statements = statements.concat(convertStatements(expressions, context));
	}
	else {
		statements = statements.concat(
			convertStatements(expressions.slice(0, -1), context));

		context.isFuncBody = false;
		var tailStatements = convertTail(expressions[expressions.length - 1], context);
		statements = statements.concat(tailStatements);
	}

	if (isFuncBody) {
		// hoist variables to the top of the function scope
		var varDeclarations = createVarDeclarations(expressions);
		if (varDeclarations.declarations.length > 0) {
			statements.unshift(varDeclarations);
		}
	}
	return statements;
}

function convertStatements (expressions, context) {
	context = context || {};
	var statements = [];
	var isFuncBody = context.isFuncBody;
	context.isFuncBody = false;
	expressions.forEach(function (exp) {
		// ignore comments
		if (!isCallTo("#", exp)) {
			if (isFuncBody &&
				(isCallTo(assignmentOp, exp)) && 
				isCallTo("fn", exp[2])) {
				context.nameIdent = exp[1];
				context.isDeclaration = true;
				statements.push(converters["fn"](exp[2].slice(1), context));
			}
			else {
				statements.push(makeExpStatement(convertExp(exp)));
			}
		}
	});
	return statements;
}

function convertTail (tail, context) {
	if (isCallTo("if", tail)) {
		return [{
			type: "IfStatement",
			test: convertExp(tail[1]),
			consequent: makeBlock(convertBody(tail[2], context)),
			alternate: makeBlock(tail[3] ? convertBody(tail[3], context) : [{
				type: "ReturnStatement",
				argument: makeLiteral(false)
			}])
		}];
	}
	else if (isCallTo("$sonata_tailCall", tail)) {
		var params = context.params.identifiers.slice();
		var lastParam = params.pop();
		var lastArg = tail[tail.length - 1];
		var tempDeclarations = params.map(function (param, i) {
			return {
				type: "VariableDeclarator",
				id: makeIdentifier("$temp_" + param.name),
				init: (tail[i + 1] ? convertExp(tail[i + 1]) : makeIdentifier("undefined"))
			}
		});
		var lastAssignment = makeExpStatement(makeAssignment(lastParam, 
				(lastArg ? convertExp(lastArg) : makeIdentifier("undefined"))));
		var tempAssignments = {
			type: "VariableDeclaration",
			declarations: tempDeclarations,
			kind: "var"
		};
		var reassignments = params.map(function (param) {
			return makeExpStatement(makeAssignment(param, 
				makeIdentifier("$temp_" + param.name)));
		});
		if (tempDeclarations.length < 1) {
			return [lastAssignment].concat(reassignments);
		}
		else return [tempAssignments, lastAssignment].concat(reassignments);
	}
	else {
		return [{
			type: "ReturnStatement",
			argument: convertExp(tail)
		}];
	}
}

function createDefaultAssignments (defaults) {
	return defaults.reduce(function (assignments, defaultAssign, index) {
		if (isCallTo(assignmentOp, defaultAssign)) {
			assignments.push({
				type: "IfStatement",
				test: {
					type: "BinaryExpression",
					operator: "===",
					left: defaultAssign[1],
					right: makeIdentifier("undefined")
				},
				consequent: makeExpStatement(convertExp(defaultAssign)),
				alternate: null
			});
		}
		// rest parameters
		else if (isCallTo("|", defaultAssign)) {
			return assignments.concat(buildSnippet("restParam", {
				paramName: makeIdentifier(defaultAssign[1].name), 
				fromIndex: makeLiteral(index)
			}));
		}
		return assignments;
	}, []);
}

function createVarDeclarations (expressions) {
	var variables = findAssignments(expressions);
	var declarations = [];
	for (var identifier in variables) {
		declarations.push({
			type: "VariableDeclarator",
			id: makeIdentifier(identifier),
			init: null
		});
	}
	return {
		type: "VariableDeclaration",
		declarations: declarations,
		kind: "var"
	};
}

function convertParameters (params) {
	return params.reduce(function (output, node, index) {
		if (isCallTo(assignmentOp, node)) {
			output.identifiers.push(node[1]);
			output.defaults[index] = node;
		}
		else if (isCallTo("|", node)) {
			output.defaults[index] = node;
		}
		else if (node.type === "Identifier") {
			output.identifiers.push(node);
		}
		return output;
	}, {identifiers: [], defaults: []});
}

function convertExp (node) {
	//console.log(node);
	//printObj(node);
	// Array represents a function application
	if (node instanceof Array) {
		var converter = converters[node[0].name];
		if (converter) {
			return converter(node.slice(1));
		}
		else {
			return makeFunctionCall(convertExp(node[0]), node.slice(1));
		}
	}
	// Should now never occur
//	else if (node.type === "Member") {
//		return convertMemberAccess(node.names.slice());
//	}
	else if (node.type === "Literal" && 
		typeof(node.value) === "number" && 
		node.value < 0) {
		return makeUnary("-", makeLiteral(Math.abs(node.value)));
	}
	else if (node.type === "Identifier") {
		return makeIdentifier(node.name);
	}
	else {
		return node;
	}
}

// shouldn't be needed any more now "." is just a normal function
//function convertMemberAccess (names) {
//	names = names.slice();
//	var identifier = makeIdentifier(names.pop());
//	if (names.length < 1) {
//		return identifier;
//	}
//	return {
//		type: "MemberExpression",
//		computed: false,
//		object: convertMemberAccess(names),
//		property: identifier
//	};
//}
//

function convertSequence (expressions) {
	if (expressions instanceof Array) {
		return {
			type: "SequenceExpression",
			expressions: expressions.map(convertExp)
		};	
	}
	else {
		return convertExp(expressions);
	}
}

function markTailRecursion (expressions, context) {
	var foundTCR = false;
	if (!(expressions instanceof Array)) {
		return false;
	}
	var tail = expressions[expressions.length - 1];
	if (isCallTo(context.nameIdent.name, tail)) {
		tail[0] = makeIdentifier("$sonata_tailCall");
		foundTCR = true;
	}
	else if (isCallTo("if", tail)) {
		var inIfBody = markTailRecursion(tail[2], context);
		var inElseBody = markTailRecursion(tail[3], context);
		foundTCR = foundTCR || inIfBody || inElseBody;
	}
	return foundTCR;
}

function convertObjectKey (node) {
	if (node && node.type === "Identifier") {
		return makeLiteral(node.name);
	}
	else if (node && node.type === "Literal" && typeof(node.value) === "string") {
		return node;
	}
	else throw "Invalid key in object literal: " + node;
}

var converters = {
	"fn": function (parts, context) {
		context = context || {};
		var type = (context.isDeclaration ? 
			"FunctionDeclaration" : "FunctionExpression");
		context.isDeclaration = false;
		var params = convertParameters(parts[0]);
		var bodyExpressions = parts[1];
		var isTailRecursive = context.nameIdent && 
			markTailRecursion(bodyExpressions, context);
		context.params = params;
		context.isFuncBody = true;
		var funcBody = convertBody(bodyExpressions, context);
		if (isTailRecursive) {
			funcBody = [{
				type: "WhileStatement",
				test: makeLiteral(true),
				body: makeBlock(funcBody)
			}];
		}
		return {
			type: type,
			id: context.nameIdent ? makeIdentifier(context.nameIdent.name) : null,
			params: params.identifiers,
			body: makeBlock(funcBody),
			generator: false,
			expression: false
		};
	},
	"if": function (parts, context) {
		context = context || {};
		return snippetExp("ifExpression", {
			test: convertExp(parts[0]),
			consequent: convertSequence(parts[1]),
			alternate: parts[2] ? convertSequence(parts[2]) : makeLiteral(false)
		});
	},
	":": function (parts) {
		var identifier = convertExp(parts[0]);
		var value = parts[1];
		if (isCallTo("fn", value)) {
			return makeAssignment(identifier, 
				converters["fn"](value.slice(1), {nameIdent: identifier}));
		}
		else {
			return makeAssignment(identifier, convertExp(value));
		}
	},
	".": function (parts) {
		return snippetExp("staticProperty", {
			object: convertExp(parts[0]),
			property: convertExp(parts[1])
		});
	},
	"get": function getMember (members) {
		var member = convertExp(members[members.length - 1]);
		if (members.length  < 2) {
			return member;
		}
		return snippetExp("dynamicProperty", {
			object: getMember(members.slice(0, -1)),
			property: member
		});
	},
	"+": function (parts) {
		return snippetExp("add", {
			left: convertExp(parts[0]),
			right: convertExp(parts[1])
		});
	},
	"-": function (parts) {
		if (parts[1]) {
			return makeBinary("-", convertExp(parts[0]), convertExp(parts[1]));	
		}
		// unary minus
		else {
			return makeUnary("-", convertExp(parts[0]));	
		}
	},
	"++": function (parts) {
		return snippetExp("concat", {
			left: convertExp(parts[0]),
			right: convertExp(parts[1])
		})
	},
	"&": function (parts) {
		var left =  convertExp(parts[0]);
		var right = convertExp(parts[1]);

		// add a concatenation to the empty string to
		// convert the value to a string
		if (!(isStringNode(parts[0]) || isStringNode(parts[1]))) {
			left = snippetExp("concatString", {
				left: makeLiteral(""), 
				right: left
			});
		}

		return snippetExp("concatString", {
			left: left, 
			right: right
		});
	},
	"^": macro(function (left, right) {
		return [[".", "Math", "pow"], left, right];
	}),
	"=": macro(function (left, right) {
		return ["eq", left, right];
	}),
	"object": function (parts) {
		return {
			type: "ObjectExpression",
			properties: parts.map(function (assignment) {
				if (isCallTo(assignmentOp, assignment)) {
					return {
						type: "Property",
						key: convertObjectKey(assignment[1]),
						value: convertExp(assignment[2]),
						kind: "init"
					};
				}
				else throw "only property assignments allowed in an object literal";
			})
		};
	},
	"not": function (parts) {
		return makeUnary("!", convertExp(parts[0]));
	},
	"new": function (parts) {
		return {
			type: "NewExpression",
			callee: convertExp(parts[0]),
			arguments: parts.slice(1).map(function (part) {
				return convertExp(part);
			})
		};
	},
	"continue": macro(function () {
		var args = ([]).slice.call(arguments);
		return ["new", "$sonata_Continuation"].concat(args);
	}),
	"for": macro(function (key, inKeyword, collection, body) {
		return ["forIn", collection, ["fn", [key], body]];
	})
};

(["*", "/", "%"]).forEach(function (op) {
	converters[op] = binaryExpressionMaker("BinaryExpression", op);
});
(["<", ">", "<=", ">="]).forEach(function (op) {
	converters[op] = binaryExpressionMaker("BinaryExpression", op);
});
converters["=="] = binaryExpressionMaker("BinaryExpression", "===");
converters["!="] = binaryExpressionMaker("BinaryExpression", "!==");
//(["&&", "||"]).forEach(function (op) {
//	converters[op] = binaryExpressionMaker("LogicalExpression", op);
//});
converters["and"] = binaryExpressionMaker("LogicalExpression", "&&");
converters["or"] = binaryExpressionMaker("LogicalExpression", "||");

// proxies
converters["function"] = converters["fn"];


function macro (macroFunc) {
	return function (parts) {
		var fragment = macroFunc.apply(null, parts);
		return convertExp(wrapToken(fragment));
	}
}

function wrapToken (token) {
	if (token instanceof Array) {
		return token.map(wrapToken);
	}
	else {
		switch (typeof(token)) {
			case "number":
				return makeLiteral(token);
			case "string":
				return makeIdentifier(token);
			default:
				return token;
		}
	}
}


function isStringNode(node) {
	return node && (isCallTo("&", node) ||
		(node.type === "Literal" && typeof(node.value) === "string"));
}

function snippetExp(name, data) {
	return buildSnippet(name, data)[0].expression;
}

function makeFunctionCall (func, args) {
	return {
		type: "CallExpression",
		callee: func,
		arguments: args? args.map(convertExp) : []
	};
}

function binaryExpressionMaker (type, op) {
	return function (args) {
		return {
			type: type,
			operator: op,
			left: convertExp(args[0]),
			right: convertExp(args[1])
		};
	};
}

function makeBinary (operator, left, right) {
	return {
		type: "BinaryExpression",
		operator: operator,
		left: left,
		right: right
	}
}

function makeUnary (operator, argument) {
	return {
		type: "UnaryExpression",
		operator: operator,
		argument: argument,
		prefix: true
	}
}

function makeIdentifier (name) {
	return {
		type: "Identifier",
		name: normalizeIdentifier(name)
	};
}

function makeLiteral (value) {
	return {
		type: "Literal",
		value: value
	};
}

function makeBlock (body) {
	return {
		type: "BlockStatement",
		body: body
	};
}

function makeAssignment (left, right) {
	return {
		type: "AssignmentExpression",
		operator: "=",
		left: left,
		right: right
	};
}

function makeExpStatement (expression) {
	return {
		type: "ExpressionStatement",
		expression: expression
	}
}

function makeDeclarator (variable, init) {
	return {
		type: "VariableDeclarator",
		id: makeIdentifier(variable),
		init: init
	};
}


function makeDeclarations() {
	var args = [];
	for (var i = 0; i < arguments.length; i++) {
		args.push(arguments[i]);
	}
	return {
		type: "VariableDeclaration",
		declarations: args,
		kind: "var"
	};
}

function plusPlus(exp) {
	return {
		type: "UpdateExpression",
		operator: "++",
		argument: exp,
		prefix: false
	}
}

function makeRequire (variable, moduleName) {
	return {
		type: "VariableDeclarator",
		id: makeIdentifier(variable),
		init: {
			type: "CallExpression",
			callee: makeIdentifier("require"),
			arguments: [makeLiteral(moduleName)]
		}
	};
}

function walkNode (node, callback) {
	if (node instanceof Array) {
		callback(node);
		node.forEach(function (child) { walkNode(child, callback); });
	}
}

function isCallTo(identifier, node) {
	return node instanceof Array && node[0].name === identifier;
}

// create an object containing every identifier assigned to in the function
function findAssignments (exp) {
	var variables = Object.create(null);
	if (isFuncApplication(exp)) {
		if (isCallTo(assignmentOp, exp)) {
			variables[exp[1].name] = true;
		}

		variables = exp
			.filter(isFuncApplication)
			.reduce(function (variables, innerExp) {
				return combineObjects(variables, findAssignments(innerExp));
			}, variables);
	}
	return variables;
}

function isFuncApplication (exp) {
	return exp instanceof Array && 
		exp[0].name !== "fn" && 
		exp[0].name !== "object";
}

function combineObjects(x, y) {
	var key;
	var combined = Object.create(null);
	for (key in x) {
		combined[key] = x[key];
	}
	for (key in y) {
		combined[key] = y[key];
	}
	return combined;
}

module.exports = convertAST;
