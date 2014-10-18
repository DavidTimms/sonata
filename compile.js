var escodegen = require("escodegen");
var tokenize = require("./tokenizer");
var parse = require("./parser");
var convertAST = require("./ast-converter").convertProgram;
var fs = require("fs");
var printObj = require('./utils/print-object');
var validateAST = require("ast-validator");

var inputFile = process.argv[2];
var outputFile = inputFile + ".js";

fs.readFile(inputFile, "utf8", function (err, source) {
	if (err) {
		console.log("Unable to open file:", inputFile);
		process.exit();
	}
	var start = Date.now();
	
	var tokenized = tokenize(source);
	var parsed = parse(tokenized);

	convertAST(parsed, function (jsAst) {
		validateAST(jsAst);

		var compiled = escodegen.generate(jsAst);

		var duration = Date.now() - start;
		console.log("successfully compiled in " + duration + "ms");
		fs.writeFile(outputFile, compiled);
	});
});