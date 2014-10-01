
// Position constructor representing a line and column 
// in the source input
function Position(line, column) {
	var self = new Position.create();
	self.line = line;
	self.column = column;
	return self;
}

Position.create = function Position() {};

Position.prototype = Position.create.prototype = {
	moveColumn: function (distance) {
		return Position(this.line, this.column + distance);
	},
	newLine: function (newColumn) {
		return Position(this.line + 1, newColumn || 0);
	},
	error: function (message) {
		throw new SyntaxError(message + 
			"\nat line " + this.line + ", column " + this.column);
	},
};

module.exports = Position;