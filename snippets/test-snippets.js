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

	testSnippet("restParam", {
		fromIndex: literal(1),
		paramName: identifier("rest")
	});

	testSnippet("functionWrapper", {
		statements: [expStatement(literal(45)), expStatement(literal(45))],
		parameters: [identifier("name"), identifier("age")],
		arguments: [literal("Dave"), literal(21)]
	});

	var props = [identifier("x"), identifier("y")];
	testSnippet("typeDeclaration", {
		typeName: identifier("Point"),
		properties: props,
		assignments: flatmap(props, function (property) {
			return buildSnippet("typePropertyAssignment", {
				property: property
			});
		})
	});
});

function identifier(name) {
	return {
		type: "Identifier",
		name: name
	}
}

function literal(value) {
	return {
		type: "Literal",
		value: value
	}
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