var esprima = require("esprima");
var fs = require("fs");

var builderCache = Object.create(null);

exports.createSnippetBuilder = function (snippetsFile, callback) {
	if (!callback) {
		callback = snippetsFile;
		snippetsFile = "./snippets.js";
	}

	if (builderCache[snippetsFile]) {
		callback(builderCache[snippetsFile]);
		return;
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

		builderCache[snippetsFile] = function buildSnippet(name, data) {
			if (!snippets[name]) 
				throw Error("unable to find source snippet: " + name);

			return renderSnippet(snippets[name], data);
		};

		callback(builderCache[snippetsFile]);
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
			return getDataParam(node.name.substring(1), context.data);
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

		// otherwise, map over each item in the array normally
		mapped = flatmap(node, function (item) {
			// if present, get the name of the data parameter
			// for an each command
			var eachParam = extractEachParam(item) || 
				(item && (
					extractEachParam(item.expression) || 
					extractEachParam(item.key)));

			// return the data parameter unmodified if an each
			// command is present in the array
			return eachParam ?
				getDataParam(eachParam, context.data) :
				mapTree(item, context);
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

function getDataParam(name, data) {
		if (!data || !(name in data)) {
			throw Error("no value given for snippet data: " + name);
		}
		return data[name];
}

function extractEachParam(node) {
	var prefix =  "$each_";
	return node && 
		node.name && 
		node.name.substring(0, prefix.length) === prefix &&
		node.name.substring(prefix.length);
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

function flatmap(arr, func) {
	return arr.map(func).reduce(function (a, b) {
		return a.concat(b);
	}, []);
}