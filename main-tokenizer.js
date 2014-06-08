
// these characters are treated as separate tokens 
// even if not surrounded by whitespace
var punctuationChars = "(){}[].,;:|";

function tokenize (source) {
	var input = source.split("");

	function reduceInput (tokens, chr) {
		var last = tokens.last();

		// inside string literals
		if (isLiteralDelimiter(last.at(0)) && 
			!(last.at(0) === "/" && chr.match(/\s/))) {
			last.string += chr;
			// end string literal
			if (last.at(0) === chr && 
				last.at(-2) !== "\\") {
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

	return input
		.reduce(reduceInput, emptyTokenArray())
		.map(Token)
		.filter(function (token) {
			return token.type !== "Empty";
		}).concat([
			new Token("End of File"), 
			new Token("End of File"), 
			new Token("End of File"), 
			new Token("End of File")
		]);
}

function emptyTokenArray () {
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

function isLiteralDelimiter (chr) {
	return chr !== "" && ("[\"'/]").indexOf(chr) >= 0;
}

function isPunctuation (chr) {
	return punctuationChars.indexOf(chr) >= 0;
}

function charAt(str, index) {
	if (index < 0) index += str.length;
	return str.charAt(index);
}

// Token Constructor
function Token (tokenString, position) {
	if (tokenString instanceof Token) {
		return Token.call(tokenString, tokenString.string);
	}

	this.position = position || this.position || {line: NaN, column: NaN};

	this.string = tokenString;
	if (tokenString === "") {
		this.type = "Empty";
	}
	else if (tokenString === "End of File") {
		this.type = "End of File";
	}
	else if (tokenString.match(/^\n.*/)) {
		this.type = "Indent";
		this.width = tokenString.length - 1;
	}
	else if (Number(tokenString).toString() !== "NaN") {

		this.type = "Number";
		this.value = Number(tokenString);
	}
	else if (tokenString.length > 1 &&
			 isLiteralDelimiter(charAt(tokenString, 0)) &&
			 isLiteralDelimiter(charAt(tokenString, -1))) {
		this.type = (charAt(tokenString, 0) === "/" ? "Regex" : "String");
		this.value = evalMultiline(tokenString);
	}
	else if (tokenString === "true" || tokenString === "false") {
		this.type = "Boolean";
		this.value = evalMultiline(tokenString);
	}
	else if (isPunctuation(tokenString)) {
		this.type = "Punctuation";
	}
	else {
		this.type = "Identifier";
	}
	return this;
}
function TokenToString () {
	// show width for indents
	return this.type + "(" + ("width" in this ? this.width : this.string) + ")"
		+ " at line " + this.position.line + ", column " + this.position.column
}
Token.prototype = Object.create(Object, {
	toString: {value: TokenToString},
	inspect: {value: TokenToString},
	at: {value: function (index) {
		return charAt(this.string, index);
	}}
});

function evalMultiline (str) {
	return eval(str.replace(/\r\n|\r|\n/g, "\\n"));
}

module.exports = tokenize;