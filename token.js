var Position = require("./position");

// Token Constructor
function Token(type, position) {
	this.type = type;

	this["is" + type] = true;

	this.position = position || Position("???", "???");

	// These will be assigned later
	this.index = 0;
	this.tokenArray = [];
}

Token.eof = function () {
	return new Token("End of File", null)
		.set("string", "End of File");
}

Token.indent = function (str, position) {
	return new Token("Indent", position)
		.set("width", str.length);
}

Token.identifier = tokenCreator("Identifier");

Token.comment = tokenCreator("Comment");

Token.punctuation = tokenCreator("Punctuation");

Token.number =  valueTokenCreator("Number");

Token.string =  valueTokenCreator("String");

Token.regex =  valueTokenCreator("Regex");

Token.boolean = valueTokenCreator("Boolean");

function tokenCreator(type) {
	return function (str, position) {
		return new Token(type, position)
			.set("string", str);
	}
}

function valueTokenCreator(type) {
	return function (str, position) {
		return new Token(type, position)
			.set("string", str)
			.set("value", evalMultiline(str));
	}
}

Token.prototype = {
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
	error: function (message) {
		this.position.error(message);
	},
};

Token.prototype.toString = Token.prototype.inspect = function () {
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