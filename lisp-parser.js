var engine = require("./parse-engine.js");
var tokenize = require("./lisp-tokenizer.js");
var buildTokenSet = require("./utils/build-token-set.js");
var type = require("./utils/type.js");
var printObj = require('./utils/print-object.js');

var rule = engine.rule;
var parse = engine.parse;
var rep0 = engine.rep0;
var rep1 = engine.rep1;

// number predicate returns true 
// if str is a valid number
function num (str) {
	return (Number(str).toString() !== "NaN");
}

function stringLiteral (str) {
	return !!str.match(/^"[\s\S]*"$|^'[\s\S]*'$|^\/[\s\S]*\/$/);
}

function nonbracket (str) {
	return !str.match(/[(){}\[\]]/);
}

rule("exp", ["(", rep0(rule("exp")), ")"], function (tokens) {
	return tokens.slice(1, -1);
});
rule("exp", ["[", rep0(rule("exp")), "]"], function (tokens) {
	return ([{type: "Identifier", name: "list"}]).concat(tokens.slice(1, -1));
});
rule("exp", ["{", rep0(rule("exp")), "}"], function (tokens) {
	return ([{type: "Identifier", name: "object"}]).concat(tokens.slice(1, -1));
});
rule("exp", ["true"], function () {
	return literal(true);
});
rule("exp", ["false"], function () {
	return literal(false);
});
rule("exp", [num], function (tokens) {
	return literal(Number(tokens[0]));
});
rule("exp", [stringLiteral], function (tokens) {
	return literal(eval(tokens[0].replace(/\r\n|\r|\n/g, "\\n")));
});
rule("exp", [nonbracket], function (tokens) {
	if (tokens[0].indexOf(".") > 0) {
		return {
			type: "Member",
			names: tokens[0].split(".")
		}
	}
	return {
		type: "Identifier",
		name: tokens[0]
	};
});

function literal (value) {
	return {
		type: "Literal",
		value: value
	};
}

module.exports = function (source) {
	var tokenized = tokenize(source);
	return parse.exp(tokenized).result;
};