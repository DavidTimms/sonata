var esprima = require("esprima");
var fs = require("fs");

exports.createSnippetBuilder = function (snippetsFile, callback) {
	if (!callback) {
		callback = snippetsFile;
		snippetsFile = "./snippets.js";
	}
	fs.readFile(snippetsFile, "utf8", function (err, source) {
		if (err || !source) {
			throw new Error("unable to read snippets file");
		}
		// parse the snippet file and build a dictionary of label -> AST
		var snippets = esprima.parse(source).body
			.filter(function (statement) {
				return statement.type === "LabeledStatement"&& 
					statement.body.type === "BlockStatement";
			})
			.reduce(function (snippets, statement) {
				snippets[statement.label.name] = statement.body.body;
				return snippets;
			}, {});
			callback(function buildSnippet(name, data) {
				if (!snippets[name]) 
					throw Error("unable to find source snippet: " + name);

				return renderSnippet(snippets[name], data);
			});
	});
};

function renderSnippet(template, data) {
	return mapTree(template, {data: data});
}


// functions for handling particular node types
var transforms = {
	Identifier: function (node, context) {
		var firstChar = node.name.charAt(0);
		var renderedName = node.name;

		if (firstChar === "$") {
			var paramName = node.name.substring(1);
			if (!(context.data) || !(paramName in context.data)) {
				throw Error("no value given for snippet data: " + paramName);
			}
			return context.data[paramName];
		}

		if (firstChar === "_") {
			renderedName = "$sonata" + node.name;
		}

		return mix(node, {name: renderedName})
	}
}

function mapTree(node, context) {
	if (node && typeof(node) === "object") {
		return (transforms[node.type] || mapChildren)(node, context);
	}
	return node;
}

function mapChildren(node, context) {
	var mapped;
	if (node instanceof Array) {
		mapped = node.map(function (item) {
			return mapTree(item, context);
		});
	}
	else {
		mapped = {};
		for (var key in node) {
			mapped[key] = mapTree(node[key], context);
		}
	}
	return mapped;
}

function mix(obj1, obj2) {
	var key;
	var combined = {};
	for (key in obj1) {
		combined[key] = obj1[key];
	}
	for (key in obj2) {
		combined[key] = obj2[key];
	}
	return combined;
}