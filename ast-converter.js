var list = require("texo");
var jsonpretty = require('jsonpretty');
var snippets = require("./snippets/snippet-parser.js");
var tailCallElim = require("tail-call-eliminator");

var identifierUtils = require("./utils/identifier-utils");
var normalizeIdentifier = identifierUtils.normalizeIdentifier;
var isValidJSIdentifier = identifierUtils.isValidJSIdentifier;

var buildSnippet = function () {
	throw Error("Attempted to call snippet builder before it was initialised.");
};

var assignmentOp = ":";

function printObj(obj) {
	console.log(jsonpretty(obj));
	return obj;
}

function convertAST(ast, callback) {

	snippets.createSnippetBuilder(
		"./snippets/snippets.js", function (snippetBuilder) {

		// assign global snippet builder function
		buildSnippet = snippetBuilder;

		var context = {isFuncBody: true, noReturn: true};

		var body = buildSnippet("prelude")
			.concat(convertBody(ast, context))
			.concat(buildSnippet("startMain"));

		// Define the program with an immediately invoked function wrapper
		callback(tailCallElim({
			type: "Program",
			body: buildSnippet("functionWrapper", {
				statements: body,
				parameters: [],
				arguments: []
			})
		}));
	});
}

function convertBody(expressions, context) {
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

		statements.push({
			type: "ReturnStatement",
			argument: convertExp(expressions[expressions.length - 1])
		});
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

function convertStatements(expressions, context) {
	context = context || {};
	//var isFuncBody = context.isFuncBody;
	//var isFuncBody = false;
	context.isFuncBody = false;

	return expressions.map(function (exp) {
		return convertStatement(exp, context);
	}).reduce(concatArrays, []);
}

function convertStatement(exp, context) {
	var converter = exp instanceof Array && exp[0] ? 
		statementConverters[exp[0].name] : null;
	return converter ?
		converter(exp.slice(1), context) : makeExpStatement(convertExp(exp));
}

// For functions which need special behaviour when in statement position
var statementConverters = {
	"#": function () { return [] },
	"type": function (parts) {
		var properties = parts.slice(1);
		return buildSnippet("typeDeclaration", {
			typeName: parts[0],
			properties: properties,
			assignments: makeTypePropAssignments(properties)
		});
	}
};

function createDefaultAssignments(defaults) {
	return flatmap(defaults, function (defaultAssign, index) {

		if (isCallTo(assignmentOp, defaultAssign)) {
			return buildSnippet("defaultArgument", {
				argument: defaultAssign[1],
				expression: convertExp(defaultAssign)
			});
		}

		// rest parameters
		if (isCallTo("|", defaultAssign)) {
			return buildSnippet("restParam", {
				paramName: makeIdentifier(defaultAssign[1].name), 
				fromIndex: makeLiteral(index)
			});
		}

		return [];

	});

}

function createVarDeclarations(expressions) {
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

function convertParameters(params) {
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

function convertExp(node) {
	// Array represents a function application
	if (node instanceof Array) {
		var converter = converters[node[0].name];
		return converter ?
			converter(node.slice(1)) :
			makeFunctionCall(convertExp(node[0]), node.slice(1));
	}
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

function convertSequence(expressions) {
	var singleExpression = expressions;
	if (expressions instanceof Array) {
		if (expressions.length === 1) {
			singleExpression = expressions[0];
		}
		else return {
			type: "SequenceExpression",
			expressions: expressions.map(convertExp)
		};
	}
	return convertExp(singleExpression);
}

function convertObjectKey(node) {
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
		context.params = convertParameters(parts[0]);
		var bodyExpressions = parts[1];

		context.isFuncBody = true;
		var funcBody = convertBody(bodyExpressions, context);

		return {
			type: type,
			id: context.nameIdent ? makeIdentifier(context.nameIdent.name) : null,
			params: context.params.identifiers,
			body: makeBlock(funcBody),
			defaults: [],
			generator: false,
			expression: false
		};
	},
	"if": function (parts, context) {
		context = context || {};
		if (parts[1].length < 1) {
			throw Error("empty if statement body");
		}
		return snippetExp("ifExpression", {
			test: convertExp(parts[0]),
			consequent: convertSequence(parts[1]),
			alternate: parts[2] && parts[2].length > 0 ? 
				convertSequence(parts[2]) : 
				makeLiteral(false)
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
	"get": function getMember(members) {
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
	}),
	"type": function (parts) {
		var properties = parts.slice(1);
		return snippetExp("typeExpression", {
			typeName: parts[0],
			properties: properties,
			assignments: makeTypePropAssignments(properties)
		});
	},
	"set!": function (parts) {
		return snippetExp("assign", {
			left: convertExp(parts[0]), 
			right: convertExp(parts[1])
		});
	}
};

(["*", "/", "%"]).forEach(function (op) {
	converters[op] = binaryExpressionMaker("BinaryExpression", op);
});
(["<", ">", "<=", ">="]).forEach(function (op) {
	converters[op] = binaryExpressionMaker("BinaryExpression", op);
});
converters["=="] = binaryExpressionMaker("BinaryExpression", "===");
converters["!="] = binaryExpressionMaker("BinaryExpression", "!==");

converters["and"] = binaryExpressionMaker("LogicalExpression", "&&");
converters["or"] = binaryExpressionMaker("LogicalExpression", "||");

// proxies
converters["function"] = converters["fn"];


function macro(macroFunc) {
	return function (parts) {
		var fragment = macroFunc.apply(null, parts);
		return convertExp(wrapToken(fragment));
	}
}

function wrapToken(token) {
	if (token instanceof Array) {
		return token.map(wrapToken);
	}
	else {
		switch (typeof(token)) {
			case "number":
				return makeLiteral(token);
			case "string":
				return makeIdentifier(token, {escape: false});
			default:
				return token;
		}
	}
}

function makeTypePropAssignments(properties) {
	return properties.map(function (property) {
		return buildSnippet("typePropertyAssignment", {
			property: property
		});
	}).reduce(concatArrays);
}
function isStringNode(node) {
	return node && (isCallTo("&", node) ||
		(node.type === "Literal" && typeof(node.value) === "string"));
}

function snippetExp(name, data) {
	return buildSnippet(name, data)[0].expression;
}

function makeFunctionCall(func, args) {
	return {
		type: "CallExpression",
		callee: func,
		arguments: args? args.map(convertExp) : []
	};
}

function binaryExpressionMaker(type, op) {
	return function (args) {
		return {
			type: type,
			operator: op,
			left: convertExp(args[0]),
			right: convertExp(args[1])
		};
	};
}

function makeBinary(operator, left, right) {
	return {
		type: "BinaryExpression",
		operator: operator,
		left: left,
		right: right
	}
}

function makeUnary(operator, argument) {
	return {
		type: "UnaryExpression",
		operator: operator,
		argument: argument,
		prefix: true
	}
}

function makeIdentifier(name, options) {
	var escape = options ? options.escape : true;
	return {
		type: "Identifier",
		name: escape ? normalizeIdentifier(name) : name
	};
}

function makeLiteral(value) {
	return {
		type: "Literal",
		value: value
	};
}

function makeBlock(body) {
	return {
		type: "BlockStatement",
		body: body
	};
}

function makeAssignment(left, right) {
	return {
		type: "AssignmentExpression",
		operator: "=",
		left: left,
		right: right
	};
}

function makeExpStatement(expression) {
	return {
		type: "ExpressionStatement",
		expression: expression
	}
}

function makeDeclarator(variable, init) {
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

function walkNode(node, callback) {
	if (node instanceof Array) {
		callback(node);
		node.forEach(function (child) { walkNode(child, callback); });
	}
}

function isCallTo(identifier, node) {
	return node instanceof Array && node[0].name === identifier;
}

// create an object containing every identifier assigned to in the function
function findAssignments(exp) {
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

function isFuncApplication(exp) {
	return exp instanceof Array && 
		exp[0] &&
		exp[0].name !== "fn" && 
		exp[0].name !== "object";
}

function concatArrays(a, b) {
	return a.concat(b);
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

function flatmap(arr, func) {
	return arr.map(func).reduce(function (a, b) {
		return a.concat(b);
	}, []);
}

module.exports = convertAST;
