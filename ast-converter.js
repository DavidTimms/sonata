var snippets = require("./snippets/snippet-parser");
var tailCallElim = require("tail-call-eliminator");

var matchPattern = require("./pattern-matching/pattern-matching.son.js");

var identifierUtils = require("./utils/identifier-utils");
var normalizeIdentifier = identifierUtils.normalizeIdentifier;
var isValidJSIdentifier = identifierUtils.isValidJSIdentifier;

var utils = require("./utils/utils");
var bareObject = utils.bareObject;
var combineObjects = utils.combineObjects;
var flatMap = utils.flatMap;
var negate = utils.negate;
var last = utils.last;
var printObject = utils.printObject;
var wrapStringTokens = utils.wrapStringTokens;
var generateVarName = utils.generateVarName;
var isCallTo = utils.isCallTo;

// This throws an error if it is used before it is redefined later
var buildSnippet = function () {
	throw Error("Attempted to call snippet builder before it was initialised.");
};

var assignmentOp = "=";

function convertAST(ast, callback) {

	snippets.createSnippetBuilder(
		"./snippets/snippets.js", function (snippetBuilder) {

		// assign global snippet builder function
		buildSnippet = snippetBuilder;

		var context = {isFuncBody: true, noReturn: true};

		var program = tailCallElim({
			type: "Program",
			body: buildSnippet("functionWrapper", {
				statements: convertBody(ast, context),
				parameters: [],
				arguments: []
			})
		});

		var funcWrapper = program.body[0].expression.callee.body;

		funcWrapper.body = 
			buildSnippet("prelude")
			.concat(funcWrapper.body)
			.concat(buildSnippet("startMain"));

		callback(program);
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

	if (context.selfName) {
		statements = statements.concat(
			buildSnippet("selfNameAssignment", {
				selfName: context.selfName
			}));
		context.selfName = null;
	}

	if ((!expressions) || expressions.length === 0) {
		return statements;
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

	return flatMap(expressions, function (exp) {
			return convertStatement(exp, context);
		});
}

function convertStatement(exp, context) {
	var converter = exp instanceof Array && exp[0] ? 
		statementConverters[exp[0].name] : null;
	return converter ?
		converter(exp.slice(1), context) : makeExpStatement(convertExp(exp));
}

// For functions which need special behaviour when in statement position
var statementConverters = bareObject({
	"#": function () { return [] },
	"type": function (parts) {
		var data = typeSnippetData(parts);
		return buildSnippet("typeDeclaration", {
			typeName: data.typeName,
			typeExpression: snippetExp("typeExpression", data)
		});
	},
	"fn": function (parts, context) {
		context.isFunctionDeclaration = true;
		return converters.fn(parts, context);
	},
	"match": function (parts) {
		return buildSnippet("patternAssign", 
			patternMatchSnippetData(parts[0], parts[1]));
	},
	"throw": function (parts) {
		return buildSnippet("throwStatement", {
			error: parts[0]
		});
	},
});

function patternMatchSnippetData(pattern, expression) {
	var tempVar = makeIdentifier(generateVarName(), {escape: false});
	var matchExpressions = matchPattern(pattern, tempVar);

	var condition = matchExpressions.conditions.length > 0 ?
		matchExpressions
			.conditions
			.map(convertExp)
			.reduce(function (left, right) {
				return {
					type: "LogicalExpression",
					operator: "&&",
					left: left,
					right: right,
				};
			}) :
		makeLiteral(true);

	var assignments = matchExpressions
		.assignments
		.map(convertExp)
		.map(makeExpStatement);

	return {
		input: convertExp(expression),
		tempVar: tempVar,
		condition: condition,
		assignments: assignments
	};
}

function typeSnippetData(parts) {
	var params = convertParameters(parts[1]);
	var defaultAssignments = createDefaultAssignments(params.defaults);
	var paramAssignments = makeTypeParamAssignments(params.identifiers);
	var props = parts[2] || [];
	var isStatic = isStaticMethod(parts[0].name);

	return {
		typeName: parts[0],
		params: params.identifiers,
		assignments: defaultAssignments.concat(paramAssignments),

		properties: props
			.filter(negate(isStatic))
			.map(convertObjProperty)
			.map(snippetProperty.bind(null, "typeProperty")),

		staticMethods: props
			.filter(isStatic)
			.map(convertObjProperty)
			.map(snippetProperty.bind(null, "typeProperty"))
	};
}

function makeTypeParamAssignments(params) {
	return flatMap(params, function (param) {
		return buildSnippet("typeParamAssignment", {param: param});
	});
}

function convertParameters(params) {
	return params.reduce(function (output, node, index) {
		if (isCallTo(assignmentOp, node) || isCallTo("...", node)) {
			output.identifiers.push(node[1]);
			output.defaults[index] = node;
		}
		else if (node.type === "Identifier") {
			output.identifiers.push(node);
		}
		return output;
	}, {identifiers: [], defaults: []});
}

function createDefaultAssignments(defaults) {
	return flatMap(defaults, function (defaultAssign, index) {

		if (isCallTo(assignmentOp, defaultAssign)) {
			return buildSnippet("defaultArgument", {
				argument: defaultAssign[1],
				expression: convertExp(defaultAssign)
			});
		}

		// rest parameters
		if (isCallTo("...", defaultAssign)) {
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

function convertWithBlock(convertedController, expressions, context) {
	var head, tail, parameters;
	var headExp = expressions[0];

	if (isCallTo("<-", headExp)) {
		var head = convertExp(headExp[2]);
		var parameters = [headExp[1]];
	}
	else {
		var head = convertExp(headExp);
		var parameters = [];
	}

	var tail = expressions.length > 2 ?
		convertWithBlock(convertedController, expressions.slice(1), context) :
		(expressions.length > 1 ?
			convertExp(expressions[1]) :
			makeIdentifier("undefined"));

	return snippetExp("withBlock", {
		controller: convertedController,
		expression: head,
		parameters: parameters,
		rest: tail
	});
}

function convertObjProperty(property) {
	if (isCallTo(":", property)) {
		return makeProperty(
			convertObjKey(property[1]), 
			convertExp(property[2]))
	}
	else if (isCallTo("fn", property)) {
		return convertMethod(property);
	}
	else throw "only property assignments allowed in an object literal";
}

function convertMethod(property) {
	// property format: [fn, self, methodName, params, body]
	var context = {
		selfName: convertExp(property[1])
	};

	return makeProperty(
		convertObjKey(property[2]), 
		converters.fn([property[3], property[4]], context));
}

function convertObjKey(node) {
	return node.type === "Identifier" ? makeLiteral(node.name) : node;
}

var converters = bareObject({
	"fn": function (parts, context) {
		context = context || {};
		var type;
		var name = null;
		var offset = 0;

		var functionIsNamed = parts.length > 2;
		if (functionIsNamed) {
			var hasSelfName = parts.length > 3;
			if (hasSelfName) {
				context.selfName = parts[0];
				name = parts[1];
				offset = 2;
			}
			else {
				name = parts[0];
				offset = 1;
			}
		}

		if (context.isFunctionDeclaration) {
			type = "FunctionDeclaration";
			context.isFunctionDeclaration = false;
			if (!name) {
				throw SyntaxError("Function Declaration must have a name");
			}
		}
		else {
			type = "FunctionExpression";
		}

		context.params = convertParameters(parts[offset]);
		var bodyExpressions = parts[offset + 1];

		context.isFuncBody = true;
		var funcBody = convertBody(bodyExpressions, context);

		return {
			type: type,
			id: name,
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
	"=": function (parts) {
		var identifier = convertExp(parts[0]);
		var value = parts[1];
		return makeAssignment(identifier, convertExp(value));
		//if (isCallTo("fn", value)) {
		//	return makeAssignment(identifier, 
		//		converters["fn"](value.slice(1), {nameIdent: identifier}));
		//}
		//else {
		//	return makeAssignment(identifier, convertExp(value));
		//}
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
	"set!": function (parts) {
		var left, right;
		if (parts.length === 2) {
			left = convertExp(parts[0]);
			right = convertExp(parts[1]);
		}
		else { // 3 parts for setting property
			left = snippetExp("dynamicProperty", {
				object: convertExp(parts[0]),
				property: convertExp(parts[1])
			});
			right = convertExp(parts[2]);
		}
		return snippetExp("assign", {left: left, right: right});
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
		var snippetName = isStringNode(parts[0]) ?
			"concatString" :
			"concat";

		return snippetExp(snippetName, {
			left: convertExp(parts[0]),
			right: convertExp(parts[1])
		})
	},
	"...": function () {
		throw SyntaxError("'...'' operator can only be used" + 
			" in a function call, array or parameter");
	},
	"^": macro(function (left, right) {
		return [[".", "Math", "pow"], left, right];
	}),
	"==": macro(function (left, right) {
		return ["eq", left, right];
	}),
	"!=": macro(function (left, right) {
		return ["not", ["eq", left, right]];
	}),
	"=>": macro(function (left, right) {
		return isNormalFunctionCall(right) ?
			[right[0], left].concat(right.slice(1)) :
			[right, left];
	}),
	":object": function (parts) {
		return {
			type: "ObjectExpression",
			properties: parts.map(convertObjProperty)
		};
	},
	":seq": convertSequence,
	"@": function () {
		throw Error("The @ operator is not yet implemented");
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
	"for": macro(function (key, inKeyword, collection, body) {
		return ["forIn", collection, ["fn", [key], body]];
	}),
	"type": function (parts) {
		return snippetExp("typeExpression", typeSnippetData(parts));
	},
	"::": function (parts) {
		return snippetExp("ofType", {
			left: convertExp(parts[0]),
			right: convertExp(parts[1])
		});
	},
	"do": function (parts, context) {
		context = context || {};
		context.isFuncBody = true;
		var funcBody = convertBody(parts[0], context);

		return snippetExp("functionWrapper", {
			statements: funcBody,
			parameters: [],
			arguments: []
		});
	},
	"with": function (parts, context) {
		var convertedController = convertExp(parts[0]);
		var expressions = parts[1];
		return convertWithBlock(convertedController, expressions, context);
	},
	"<-": function () {
		throw new SyntaxError(
			"The '<-' operator is only valid in a 'with' block");
	},
	"match": function (parts) {
		return snippetExp("patternAssignExpression", 
			patternMatchSnippetData(parts[0], parts[1]));
	},
	"throw": function (parts) {
		return snippetExp("throwExpression", {
			error: parts[0]
		});
	}
});

(["*", "/", "%"]).forEach(function (op) {
	converters[op] = binaryExpressionMaker("BinaryExpression", op);
});
(["<", ">", "<=", ">="]).forEach(function (op) {
	converters[op] = binaryExpressionMaker("BinaryExpression", op);
});
converters["==="] = binaryExpressionMaker("BinaryExpression", "===");
converters["!=="] = binaryExpressionMaker("BinaryExpression", "!==");

converters["&"] = binaryExpressionMaker("LogicalExpression", "&&");
converters["|"] = binaryExpressionMaker("LogicalExpression", "||");
converters["and"] = binaryExpressionMaker("LogicalExpression", "&&");
converters["or"] = binaryExpressionMaker("LogicalExpression", "||");

// proxies
converters["function"] = converters["fn"];


function macro(macroFunc) {
	return function (parts) {
		var fragment = macroFunc.apply(null, parts);
		return convertExp(wrapStringTokens(fragment));
	}
}

function isNormalFunctionCall(node) {
	return node instanceof Array && !(node[0].name in converters);
}

function isStringNode(node) {
	return node && (isCallTo("&", node) ||
		(node.type === "Literal" && typeof(node.value) === "string"));
}

function snippetExp(name, data) {
	return buildSnippet(name, data)[0].expression;
}

function snippetProperty(name, data) {
	return buildSnippet(name, data)[0].expression.properties[0];
}

function makeFunctionCall(func, args) {
	return args.some(isCallTo("...")) ?
		makeSpreadCall(func, args) :
		makeCallExpression(func, args);
}

// converts a call with '...' spread parameters used to 
// decompose a sequence into the arguments
function makeSpreadCall(func, args) {

	// build an array of the argument groups by putting 
	// normal arguments into arrays and wrapping spread
	// arguments in .toArray() calls
	var argGroups = [makeArrayExp()];
	args.forEach(function (arg) {
		if (isCallTo("...", arg)) {
			argGroups.push(
				snippetExp("toArray", {
					object: convertExp(arg[1])
				}), 
				makeArrayExp()
			);
		}
		else {
			last(argGroups).elements.push(arg);
		}
	});

	// remove empty argument groups
	argGroups = argGroups.filter(isNotEmptyArrayExpression);

	return snippetExp("apply", {
		func: func,
		// generate an expression which concatenates 
		// all the argument groups together
		argsArray: snippetExp("concatMany", {
			first: argGroups[0],
			rest: argGroups.slice(1),
		}),
	});
}

function makeCallExpression(func, args) {
	return {
		type: "CallExpression",
		callee: func,
		arguments: args? args.map(convertExp) : []
	};
}

function makeArrayExp(elements) {
	return {
		type: "ArrayExpression",
		elements: elements ? elements.map(convertExp) : [],
	};
}

function isNotEmptyArrayExpression(group) {
	return group.type !== "ArrayExpression" ||
		group.elements.length > 0;
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
		value: value,
	};
}

function makeBlock(body) {
	return {
		type: "BlockStatement",
		body: body,
	};
}

function makeAssignment(left, right) {
	return {
		type: "AssignmentExpression",
		operator: "=",
		left: left,
		right: right,
	};
}

function makeExpStatement(expression) {
	return {
		type: "ExpressionStatement",
		expression: expression,
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

function makeProperty(key, value) {
	return {
		type: "Property",
		key: key,
		value: value,
		kind: "init"
	};
}

function walkNode(node, callback) {
	if (node instanceof Array) {
		callback(node);
		node.forEach(function (child) { walkNode(child, callback); });
	}
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

function isStaticMethod(typeIdentifier) {
	return function (property) {
		return isCallTo(":", property) && 
			isCallTo("fn", property[2]) &&
			property[2][1].type === "Identifier" && 
			property[2][2].type === "Identifier" && 
			property[2][1].name === typeIdentifier;
	}
}

module.exports = {
	convertProgram: convertAST,
	convertPartial: function (ast, callback) {

		snippets.createSnippetBuilder(
			"./snippets/snippets.js", function (snippetBuilder) {

			// assign global snippet builder function
			buildSnippet = snippetBuilder;

			var context = {isFuncBody: true, noReturn: true};

			// !!! need to run tail call eliminator here !!!

			var converted = {
				type: "Program",
				body: convertBody(ast, context)
			};
			
			callback(converted);
		});
	},
	prelude: function (callback) {

		snippets.createSnippetBuilder(
			"./snippets/snippets.js", function (snippetBuilder) {

			// assign global snippet builder function
			buildSnippet = snippetBuilder;

			var context = {isFuncBody: true, noReturn: true};

			// !!! need to run tail call eliminator here !!!

			var prelude = {
				type: "Program",
				body: buildSnippet("prelude")
			};

			callback(prelude);
		});
	}
};
