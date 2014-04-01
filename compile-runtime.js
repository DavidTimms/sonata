var esprima = require("esprima");
var fs = require("fs");

var source = fs.readFileSync("runtime.js", "utf8");

var ast = esprima.parse(source);

module.exports = {
	runtimeImport: function (variable) {
		var node = findNode({type: "VariableDeclarator", id: {name: variable}}, ast);
		if (!node) {
			throw Error("Unable to find runtime import: " + variable);
		}
		return node;
	}
}

function findNode (pattern, ast) {
	if (nodeMatch(pattern, ast)) {
		return ast;
	}

	var node;
	for (var key in ast) {
		if (typeof(ast[key]) === "object") {
			node = findNode(pattern, ast[key]);
			if (node) {
				return node;
			}
		}
	}
	return null;
}

function nodeMatch (pattern, node) {
	if (typeof(pattern) !== "object" || pattern === null) {
		return (pattern === node);
	}
	if (typeof(node) !== "object" || node === null) {
		return false;
	}
	for (var key in pattern) {
		if (!nodeMatch(pattern[key], node[key])) {
			return false;
		}
	}
	return true;
}