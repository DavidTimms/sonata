
// these characters are treated as separate tokens 
// even if not surrounded by whitespace
var punctuationChars = "(){}[].,;:|@";

function tokenize(source) {
	var input = source.split("");

	function inputReducer(tokens, chr) {
		var last = tokens.last();
		var lastFirstChar = last.at(0);

		// inside string literals
		if (isLiteralDelimiter(lastFirstChar) && 
			!(lastFirstChar === "/" && chr.match(/\s/))) {

			// end of comment line
			if (lastFirstChar === "#" && chr === "\n") {
				tokens.add("");
				return inputReducer(tokens, chr);
			}

			last.string += chr;
			// end string literal
			if (lastFirstChar === chr && last.at(-2) !== "\\") {
				tokens.add("");
			}
		}
		// punctuation symbols
		else if (isPunctuation(chr)) {
			// "of type" operator
			var lastNonEmpty = lastNonEmptyToken(tokens);
			if (lastNonEmpty && lastNonEmpty.string === ":" && chr === ":") {
				lastNonEmpty.string = "::";
			}
			else {
				tokens.add(chr);
			}
			tokens.colNumber += 1;
			// EARLY RETURN
			return tokens.add("");
		}
		// indents
		else if (chr === "\n") {
			tokens.lineNumber += 1;
			tokens.colNumber = 0;
			if (last.type === "Indent") {
				last.string = "\n";
			}
			else {
				tokens.add("\n");
			}
		}
		// ignore whitespace
		else if (chr.match(/\s/)) {
			if (last.type === "Indent") {
				last.string += chr;
			}
			else {
				tokens.add("");
			}
		}
		// string literal start
		else if (isLiteralDelimiter(chr)) {
			tokens.add(chr);
		}
		// identifier
		else {
			if (last.type === "Indent") {
				tokens.add(chr);
			}
			else {
				last.string += chr;
			}
		}

		tokens.colNumber += 1;
		return tokens;
	}

	var tokens = input
		.reduce(inputReducer, emptyTokenArray())
		// construct tokens from the fully formed token strings
		// to ensure the correct type has been given to each
		.map(function (token) {
			return new Token(token.string, token.position);
		})
		.filter(function (token) {
			return token.type !== "Empty";
		}).concat([
			// Add 4 end-of-file tokens because some parts of the 
			// parser may look ahead up to four tokens, and will
			// error if the token is null
			new Token("End of File"), 
			new Token("End of File"), 
			new Token("End of File"), 
			new Token("End of File")
		]);
	tokens.forEach(function (token, i) {
		token.index = i;
		token.tokenArray = tokens;
		return token;
	});
	return tokens;
}

function emptyTokenArray() {
	var tokens = [];

	tokens.add = function (tokenString) {
		if (this.length > 0 && this.last().string === "") {
			this.pop();
		}
		this.push(new Token(tokenString, {
			line: this.lineNumber, 
			column: this.colNumber
		}));
		return this;
	};
	tokens.last = function () {
		return this[this.length - 1];
	};
	tokens.lineNumber = 1;
	tokens.colNumber = 0;
	tokens.add("\n");
	return tokens;
}

function lastNonEmptyToken(tokens) {
	for (var i = tokens.length - 1; i >= 0; i--) {
		if (tokens[i].string !== "") return tokens[i];
	}
	return null;
}

function isLiteralDelimiter(chr) {
	return chr !== "" && ("[\"'/#]").indexOf(chr) >= 0;
}

function isPunctuation(chr) {
	return punctuationChars.indexOf(chr) >= 0;
}

function isValidNumber(tokenString) {
	return Number(tokenString).toString() !== "NaN";
}

function isStringOrRegex(tokenString) {
	return tokenString.length > 1 &&
		isLiteralDelimiter(charAt(tokenString, 0)) &&
		isLiteralDelimiter(charAt(tokenString, -1));
}

function alwaysTrue() {
	return true;
}

function charAt(str, index) {
	if (index < 0) index += str.length;
	return str.charAt(index);
}

// Token Constructor
function Token(tokenString, position, index) {

	this.position = position || {line: NaN, column: NaN};

	this.index = index || 0;

	this.tokenArray = [];

	this.string = tokenString;
	return extend(this, match(tokenString, [
		// Empty Tokens, to be filtered out later
		["", {type: "Empty"}],

		["End of File", {type: "End of File"}],

		// Indent tokens start with a new line
		[/^\n.*/, {type: "Indent", width: tokenString.length - 1}],

		// Comment tokens start with an octothorpe
		[/^#.*/, {type: "Comment"}],

		[isValidNumber, {type: "Number", value: Number(tokenString)}],

		[isStringOrRegex, function () {
			return {
				type: charAt(tokenString, 0) === "/" ? "Regex" : "String",
				value: evalMultiline(tokenString)
			};
		}],

		[/^(true|false)$/, function () {
			return {type: "Boolean", value: evalMultiline(tokenString)};
		}],

		[isPunctuation, {type: "Punctuation"}],

		// default case
		[alwaysTrue, {type: "Identifier"}]
	]));
}

Token.prototype = {
	toString: TokenToString,
	inspect: TokenToString,
	at: function (index) {
		return charAt(this.string, index);
	},
	is: function (candidate) {
		return this.string === candidate;
	},
	isNot: function (candidate) {
		return this.string !== candidate;
	},
	move: function (distance) {
		var newIndex = this.index + distance;
		// ensure new index is within the bounds of the token array
		newIndex = Math.min(newIndex, this.tokenArray.length - 1);
		newIndex = Math.max(newIndex, 0);

		return this.tokenArray[newIndex];
	},
};

function TokenToString() {
	// show width for indents
	return this.type + 
		"(" + 
		("width" in this ? this.width : this.string) + 
		")" + 
		" at line " + 
		this.position.line + 
		", column " + 
		this.position.column;
}

function evalMultiline(str) {
	return eval(str.replace(/\r\n|\r|\n/g, "\\n"));
}

function extend(obj, mixin) {
	Object.keys(mixin).forEach(function (key) {
		obj[key] = mixin[key];
	});
	return obj;
}

// pattern matching using a string, regex or predicate
function match(str, patternResultTuples) {
	var result = patternResultTuples.find(function (tuple) {
		var pattern = tuple[0];
		switch (pattern.constructor) {
			case RegExp:
				return pattern.test(str);
			case Function:
				return pattern(str);
			default:
				return str === pattern;
		}
	})[1];

	// execute the result if it is a thunk
	return typeof(result) === "function" ? result() : result;
}

// Array.prototype.find Polyfill from: 
// developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
if (!Array.prototype.find) {
	Array.prototype.find = function(predicate) {
		if (this == null) {
			throw new TypeError(
				"Array.prototype.find called on null or undefined");
		}
		if (typeof predicate !== "function") {
			throw new TypeError("predicate must be a function");
		}
		var list = Object(this);
		var length = list.length >>> 0;
		var thisArg = arguments[1];
		var value;

		for (var i = 0; i < length; i++) {
			value = list[i];
			if (predicate.call(thisArg, value, i, list)) {
				return value;
			}
		}
		return undefined;
	};
}

module.exports = tokenize;