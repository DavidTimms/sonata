// Token Constructor
function Token(type, position) {
	this.type = type;

	this["is" + type] = true;

	this.position = position || {line: "???", column: "???"};

	// These will be assigned later
	this.index = 0;
	this.tokenArray = [];
}

Token.identifier = function (str, position) {
	return new Token("Identifier", position)
		.set("string", str);
}

Token.eof = function () {
	return new Token("End of File", null)
		.set("string", "End of File");
}

Token.indent = function (str, position) {
	return new Token("Indent", position)
		.set("width", str.length);
}

Token.comment = function (str, position) {
	return new Token("Comment", position)
		.set("string", str);
}

Token.number = function (str, position) {
	return new Token("Number", position)
		.set("string", str)
		.set("value", Number(str));
}

Token.string = function (str, position) {
	return new Token("String", position)
		.set("value", evalMultiline(str));
}

Token.regex = function (str, position) {
	return new Token("Regex", position)
		.set("value", evalMultiline(str));
}

Token.boolean = function (str, position) {
	return new Token("Boolean", position)
		.set("string", str)
		.set("value", evalMultiline(str));
}

Token.punctuation = function (str, position) {
	return new Token("Punctuation", position)
		.set("string", str);
}

Token.prototype = {
	toString: TokenToString,
	inspect: TokenToString,
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
	next: function () {
		return this.move(1);
	},
	previous: function () {
		return this.move(-1);
	},
	set: function (property, value) {
		this[property] = value;
		return this;
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

module.exports = Token;