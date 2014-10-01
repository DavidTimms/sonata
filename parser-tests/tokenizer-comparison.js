var tokenizeOld = require("../main-tokenizer.js");
var tokenizeNew = require("../new-tokenizer.js");
var fs = require("fs");

var inputFile = process.argv[2];

fs.readFile(inputFile, "utf8", function (err, source) {
	if (err) {
		console.log("Unable to open file:", inputFile);
	}

	console.log("Same?", compareTokens(tokenizeOld(source), tokenizeNew(source)));
});

function compareTokens(oldTokens, newTokens) {
	console.log("Old:", oldTokens.length, "tokens");
	console.log("New:", newTokens.length, "tokens");
	//for (var i = 0; i < Math.min(oldTokens.length, newTokens.length); i++) {
	//	console.log(i, "----------------------------");
	//	console.log(oldTokens[i]);
	//	console.log(newTokens[i]);
	//	console.log();
	//}
	return oldTokens.length === newTokens.length && 
		oldTokens.every(function (oldToken, i) {
			return isSameToken(oldToken, newTokens[i]);
		});
}

function isSameToken(oldToken, newToken) {
	return ["type", "string", "value", "width"]
		.every(function (property) {
			return (property === "string" && newToken.isIndent) || 
				oldToken[property] === newToken[property];
		});
}