var escodegen = require("escodegen");
var snippets = require("./snippet-parser.js");
var validateAST = require("ast-validator");

snippets.createSnippetBuilder(function (buildSnippet) {

	function testSnippet(name, data) {
		console.log("\n=== " + name.toUpperCase() + " ===");
		var ast = {
			type: "Program",
			body: buildSnippet(name, data)
		};
		validateAST(ast);
		console.log(escodegen.generate(ast));
	}

	function snippetProperty(name, data) {
		return buildSnippet(name, data)[0].expression.properties[0];
	}

	testSnippet("restParam", {
		fromIndex: literal(1),
		paramName: identifier("rest")
	});

	testSnippet("functionWrapper", {
		statements: [expStatement(literal(45)), expStatement(literal(45))],
		parameters: [identifier("name"), identifier("age")],
		arguments: [literal("Dave"), literal(21)]
	});

	var params = [identifier("x"), identifier("y")];
	var paramAssignments = flatmap(params, function (param) {
		return buildSnippet("typeParamAssignment", {
			param: param
		});
	});
	testSnippet("typeDeclaration", {
		typeName: identifier("Point"),
		params: params,
		assignments: paramAssignments
	});

	var props = [
		kvPair(identifier("size"), literal(3)), 
		kvPair(identifier("shape"), literal("circle"))
	];

	testSnippet("fullTypeExpression", {
		typeName: identifier("Point"),
		params: params,
		assignments: paramAssignments,
		properties: props.map(snippetProperty.bind(null, "typeProperty"))
	});
});

function identifier(name) {
	return {
		type: "Identifier",
		name: name
	};
}

function literal(value) {
	return {
		type: "Literal",
		value: value
	};
}

function kvPair(key, value) {
	return {
		key: key,
		value: value
	};
}

function expStatement(exp) {
	return {
		type: "ExpressionStatement",
		expression: exp
	}
}

function flatmap(a, func) {
	return a.map(func).reduce(function (a, b) {
		return a.concat(b);
	}, []);
}