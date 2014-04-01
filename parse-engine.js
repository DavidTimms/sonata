var type = require("./utils/type.js");
var slice = Array.prototype.slice.call.bind(Array.prototype.slice);

function noGen (tokens) {
	return tokens;
}

var lastToken;
var indent = 0;
function idnt () {
	var str = "";
	for (var i = 0; i < indent; i++) {
		str += "  ";
	}
	return str;
}

function debug () {
	//console.log.apply(console, [idnt()].concat(slice(arguments)));
}


function parsePattern (pattern, generate, tokens, pos) {
	var parsedTokens = [];
	for (var i = 0; i < pattern.length; i++) {
		if (tokens[pos] !== lastToken) {
			lastToken = tokens[pos];
			debug("Token:", tokens[pos]);
		}
		if (tokens[pos] === undefined) {
			return false;
		}
		switch (type(pattern[i])) {
			case "string":
				debug("looking for", pattern[i]);
				if (tokens[pos] === pattern[i]) {
					parsedTokens.push(tokens[pos]);
					pos += 1;
				}
				else {
					return false;
				}
				break;
			case "function":
				debug("checking", pattern[i].name);
				if (pattern[i](tokens[pos])) {
					parsedTokens.push(tokens[pos]);
					pos += 1;
				}
				else {
					return false;
				}
				break;
			case "Rule":
				indent++;
				var parsed = parse[pattern[i].name](tokens, pos);
				indent--;

				if (parsed) {
					parsedTokens.push(parsed.result);
					pos = parsed.newPos;
				}
				else {
					return false;
				}
				break;
			case "Repeat":
				var parsed, matches = 0;
				do {
					indent++;
					debug("partial rule");
					parsed = parsePattern(pattern[i].pattern, noGen, tokens, pos);
					indent--;
					if (parsed) {
						matches += 1;
						parsedTokens = parsedTokens.concat(parsed.result);
						pos = parsed.newPos;
					}
				} while (parsed);
				if (matches < pattern[i].minRepeats) {
					return false;
				}
				break;
			default:
				throw Error("Invalid type in rule pattern: " + type(pattern[i]));
		}
		debug("Success! now token list = ", parsedTokens);
	}
	
	return {result: generate(parsedTokens), newPos: pos};
}

var rules = {};
var parse = {};

function Rule (name) {
	this.name = name;
}

function Repeat (pattern, minRepeats) {
	this.pattern = pattern;
	this.minRepeats = minRepeats;
}

module.exports = {
	rule: function (name, pattern, generate) {
		// if defining a rule
		if (type(pattern) === "Array") {
			generate = generate || 0;
			if (type(generate) === "number") {
				var n = generate;
				generate = function (tokens) {
					return tokens[n];
				};
			}
			(rules[name] = rules[name] || []).push({
				pattern: pattern, 
				generate: generate || noGen
			});

			parse[name] = parse[name] || function (tokens, pos) {
				pos = pos || 0;
				var result;
				for (var i = 0; i < rules[name].length && !result; i++) {
					debug(name, "rule", i);
					var rule = rules[name][i];
					result = parsePattern(rule.pattern, rule.generate, tokens, pos);
				}
				return result;
			};
		}
		else {
			// Rule identifier
			return new Rule(name);
		}
	},
	parse: parse,
	// functions for repeated rule fragments
	rep0: function () {
		return new Repeat(arguments, 0);
	},
	rep1: function () {
		return new Repeat(arguments, 1);
	}
};