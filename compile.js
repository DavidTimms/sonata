var escodegen = require("escodegen");
var parse = require("./lisp-parser.js");
var convertAST = require("./ast-converter.js");
var fs = require("fs");
var jsonpretty = require('jsonpretty');

function printObj (obj) {
	console.log(jsonpretty(obj));
	return obj;
}

var inputFile = process.argv[2];
var outputFile = inputFile + ".js";

fs.readFile(inputFile, "utf8", function (err, source) {
	if (err) {
		throw err;
	}
	var start = Date.now();
	var parsed = parse(source);
	var JsAst = convertAST(parsed);
	var compiled = escodegen.generate(JsAst);
	var duration = Date.now() - start;
	console.log("successfully compiled in " + duration + "ms");
	fs.writeFile(outputFile, compiled);
});