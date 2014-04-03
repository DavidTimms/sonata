

function tokenize (source) {
	var input = source.split("");

	function reduceInput (tokens, chr) {
		var last = tokens.last();

		// inside string literals
		if (isLiteralDelimiter(last.at(0))) {
			last.string += chr;
			// end string literal
			if (last.at(0) === chr && 
				last.at(-2) !== "\\") {
				tokens.add("");
			}
		}
		// punctuation symbols
		else if (isPunctuation(chr)) {
			tokens.add(chr).add("");
		}
		// indents TODO: GET INDENT TOKENS WORKING CORRECTLY
		else if (chr.match(/\r|\n/) && last.type !== "Indent") {
			tokens.add("\n");
		}
		// ignore whitespace
		else if (chr.match(/\s/) && last.type !== "Indent") {
			tokens.add("");
		}
		// string literal start
		else if (isLiteralDelimiter(chr)) {
			tokens.add(chr);
		}
		// anything else
		else {
			last.string += chr;
		}
		return tokens;
	}

	return input
		.reduce(reduceInput, emptyTokenArray())
		.map(Token)
		.filter(function (token) {
			return token.type !== "Empty";
		});
}

function emptyTokenArray () {
	var tokens = [];

	tokens.add = function (tokenString) {
		if (this.last().string === "") {
			this.pop();
		}
		this.push(new Token(tokenString));
		return this;
	};
	tokens.last = function () {
		return this[this.length - 1];
	};
	tokens.push(new Token(""));
	return tokens;
}

function isLiteralDelimiter (chr) {
	return chr !== "" && ("[\"'/]").indexOf(chr) >= 0;
}

function isPunctuation (chr) {
	return ("[(){}[].,]").indexOf(chr) >= 0;
}

function charAt(str, index) {
	if (index < 0) index += str.length;
	return str.charAt(index);
}

function Token (tokenString) {
	if (tokenString instanceof Token) {
		return Token.call(tokenString, tokenString.string);
	}

	this.string = tokenString;
	if (tokenString === "") {
		this.type = "Empty";
	}
	else if (tokenString.match(/^\n.*/)) {
		this.type = "Indent";
		this.width = tokenString.length - 2;
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
	return this.type + "(" + (this.width || this.string) + ")"
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