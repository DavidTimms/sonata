var escodegen = require("escodegen");
var snippets = require("./snippet-parser.js");

snippets.createSnippetBuilder(function (buildSnippet) {

	function testSnippet(name, data) {
		console.log("\n=== " + name.toUpperCase() + " ===");
		console.log(escodegen.generate({
			type: "Program",
			body: buildSnippet(name, data)
		}));
	}

	testSnippet("restParam", {
		fromIndex: literal(1),
		paramName: identifier("rest")
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