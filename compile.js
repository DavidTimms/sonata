var escodegen = require("escodegen");
var tokenize = require("./main-tokenizer.js");
var parse = require("./tdop-parser.js");
var convertAST = require("./ast-converter.js");
var fs = require("fs");
var printObj = require('./utils/print-object.js');

var inputFile = process.argv[2];
var outputFile = inputFile + ".js";

fs.readFile(inputFile, "utf8", function (err, source) {
	if (err) {
		console.log("Unable to open file:", inputFile);
	}
	var start = Date.now();

	var tokenized = tokenize(source);
	tokenized.forEach(function (token) {
		//console.log(token.toString());
	});
	var parsed = parse(tokenized);
	//printObj(parsed);
	var JsAst = convertAST(parsed);
	var compiled = escodegen.generate(JsAst);

	var duration = Date.now() - start;
	console.log("successfully compiled in " + duration + "ms");
	fs.writeFile(outputFile, compiled);
});