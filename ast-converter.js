var list = require("texo");

function convertAST (ast) {
	//console.log(JSON.stringify(ast));

	var body = convertFuncBody(ast);
	body.unshift({
		type: "VariableDeclaration",
		declarations: [{
			type: "VariableDeclarator",
			id: makeIdentifier("list"),
			init: {
				type: "CallExpression",
				callee: makeIdentifier("require"),
				arguments: [makeLiteral("texo")]
			}
		}],
		kind: "var"
	});
	// Define the program with an immediately invoked function wrapper
	return {
		type: "Program",
		body: [makeExpStatement({
			type: "CallExpression",
			callee: {
				type: "FunctionExpression",
				id: null,
				params: [],
				body: makeBlock(strictMode(body)),
				generator: false,
				expression: false
			},
			arguments: []
		})]
	};
}

function convertFuncBody (expressions, context) {
	// set default parameters
	var statements = [];
	if (context && context.params.defaults) {
		statements = createDefaultAssignments(context.params.defaults);
		context.params.defaults = false;
	}

	expressions.slice(0, -1).forEach(function (exp) {
		statements.push(makeExpStatement(convertExp(exp)));
	});
	var tailStatements = convertTail(expressions[expressions.length - 1], context);
	statements = statements.concat(tailStatements);
	// hoist variables to the top of the function scope
	var varDeclarations = createVarDeclarations(expressions);
	if (varDeclarations.declarations.length > 0) {
		statements.unshift(varDeclarations);
	}
	return statements;
}

function convertTail (tail, context) {
	if (isCallTo("if", tail)) {
		return [{
			type: "IfStatement",
			test: convertExp(tail[1]),
			consequent: makeBlock(convertFuncBody(tail[2], context)),
			alternate: makeBlock(tail[3] ? convertFuncBody(tail[3], context) : [{
				type: "ReturnStatement",
				argument: makeLiteral(false)
			}])
		}];
	}
	else if (isCallTo("tail-call", tail)) {
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
		return [tempAssignments, lastAssignment].concat(reassignments);
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
		if (defaultAssign) {
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
		if (isCallTo("=", node)) {
			output.identifiers.push(node[1]);
			output.defaults[index] = node;
		}
		else if (node.type === "Identifier") {
			output.identifiers.push(node);
		}
		return output;
	}, {identifiers: [], defaults: []});
}

function convertExp (node) {
	// Array represents a function application
	if (node instanceof Array) {
		var converter = converters[node[0].name];
		if (converter) {
			return converter(node.slice(1));
		}
		else {
			return functionCall(convertExp(node[0]), node.slice(1));
		}
	}
	else if (node.type === "Member") {
		return convertMemberAccess(node.names.slice());
	}
	else {
		return node;
	}
}

function convertMemberAccess (names) {
	var identifier = makeIdentifier(names.pop());
	if (names.length < 1) {
		return identifier;
	}
	return {
		type: "MemberExpression",
		computed: false,
		object: convertMemberAccess(names),
		property: identifier
	};
}

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
		tail[0] = makeIdentifier("tail-call");
		foundTCR = true;
	}
	else if (isCallTo("if", tail)) {
		var inIfBody = markTailRecursion(tail[2], context);
		var inElseBody = markTailRecursion(tail[3], context);
		foundTCR = foundTCR || inIfBody || inElseBody;
	}
	return foundTCR;
}

var converters = {
	"function": function (parts, context) {
		context = context || {};
		var params = convertParameters(parts[0]);
		var bodyExpressions = parts[1];
		var isTailRecursive = context.nameIdent && 
			markTailRecursion(bodyExpressions, context);
		context.params = params;
		var funcBody = convertFuncBody(bodyExpressions, context);
		if (isTailRecursive) {
			funcBody = [{
				type: "WhileStatement",
				test: makeLiteral(true),
				body: makeBlock(funcBody)
			}];
		}
		return {
			type: "FunctionExpression",
			id: context.nameIdent || null,
			params: params.identifiers,
			body: makeBlock(funcBody),
			generator: false,
			expression: false
		};
	},
	"if": function (parts) {
		return {
			type: "ConditionalExpression",
			test: convertExp(parts[0]),
			consequent: convertSequence(parts[1]),
			alternate: parts[2] ? convertSequence(parts[2]) : makeLiteral(false)
		};
	},
	"=": function (parts) {
		var identifier = parts[0];
		var value = parts[1];
		if (isCallTo("function", value)) {
			return makeAssignment(identifier, 
				converters["function"](value.slice(1), {nameIdent: identifier}));
		}
		else {
			return makeAssignment(identifier, convertExp(value));
		}
	},
	"++": function (parts) {
		return {
			type: "CallExpression",
			callee: {
				type: "MemberExpression",
				computed: false,
				object: convertExp(parts[0]),
				property: makeIdentifier("concat")
			},
			arguments: [convertExp(parts[1])]
		};
	},
	"&": function (parts) {
		if ((parts[0].type === "Literal" && typeof(parts[0].value) === "string") ||
			(parts[1].type === "Literal" && typeof(parts[1].value) === "string")) {
			return {
				type: "BinaryExpression",
				operator: "+",
				left: convertExp(parts[0]),
				right: convertExp(parts[1])
			};
		}
		return {
			type: "BinaryExpression",
			operator: "+",
			left: {
				type: "BinaryExpression",
				operator: "+",
				left: makeLiteral(""),
				right: convertExp(parts[0])
			},
			right: convertExp(parts[1])
		};
	},
	"^": function (parts) {
		return convertExp([{type: "Member", names: ["Math", "pow"]}].concat(parts));
	},
	"obj": function (parts) {
		return {
			type: "ObjectExpression",
			properties: parts.map(function (pair) {
				return {
					type: "Property",
					key: convertExp(pair[0]),
					value: convertExp(pair[1]),
					kind: "init"
				};
			})
		};
	}
};

(["+", "-", "*", "/", "%"]).forEach(function (op) {
	converters[op] = binaryExpressionMaker("BinaryExpression", op);
});
(["<", ">", "<=", ">="]).forEach(function (op) {
	converters[op] = binaryExpressionMaker("BinaryExpression", op);
});
converters["=="] = binaryExpressionMaker("BinaryExpression", "===");
converters["!="] = binaryExpressionMaker("BinaryExpression", "!==");
(["&&", "||"]).forEach(function (op) {
	converters[op] = binaryExpressionMaker("LogicalExpression", op);
});
converters["and"] = binaryExpressionMaker("LogicalExpression", "&&");
converters["or"] = binaryExpressionMaker("LogicalExpression", "||");
converters["def"] = converters["="];

function functionCall (func, args) {
	return {
		type: "CallExpression",
		callee: func,
		arguments: args.map(convertExp)
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

function makeIdentifier (name) {
	return {
		type: "Identifier",
		name: name
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

function walkNode (node, callback) {
	if (node instanceof Array) {
		callback(node);
		node.forEach(function (child) { walkNode(child, callback); });
	}
}

function isCallTo(identifier, node) {
	return node instanceof Array && node[0].name === identifier;
}

function strictMode (statements) {
	statements.unshift(makeExpStatement(makeLiteral("use strict")));
	return statements;
}

function findAssignments (exp) {
	var variables = Object.create(null);
	function isFuncApplication (x) {
		return x instanceof Array && x[0].name !== "function";
	}
	if (isFuncApplication(exp)) {
		if (exp[0].name === "=" || exp[0].name === "def") {
			addVariable(variables, exp[1].name);
		}

		exp.filter(isFuncApplication).forEach(function (exp) {
			var innerAssignments = findAssignments(exp);
			for (var identifier in innerAssignments) {
				addVariable(variables, identifier);
			}
		});
	}
	return variables;
}

function addVariable (vars, identifier) {
	if (vars[identifier]) {
		throw "Variable already declared in scope: " + identifier;
	}
	else {
		vars[identifier] = true;
	}
}

module.exports = convertAST;
