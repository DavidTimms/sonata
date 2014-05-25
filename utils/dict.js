
function Dict() {
	if (!(this instanceof Dict)) {
		console.log("Warning: Dict() called without 'new'");
	}
	this._keys = keys = [];
	this._values = values = [];
	for (var i = 0; i < arguments.length; i += 2) {
		keys.push(arguments[i]);
		values.push(arguments[i + 1]);
	}
	this.length = keys.length;
	this._extended = false;
	return this;
}
Dict.prototype = {
	toString: function () {
		var keys = this._keys, values = this._values;
		var s;
		for (var i = 0; i < this.length; i++) {
			s = (s ? s + ", " : "{") + keys[i] + ": " + values[i];
		}
		return s + "}";
	},
	get: function (key) {
		var keys = this._keys;
		var length = this.length;
		var res;
		for (var i = 0; i < length; i++) {
			if (keys[i] === key) {
				res = this._values[i];
				break;
			}
		}
		return undefined;
	},
	add: function (key, value) {
		var keys, values, oldLength = this.length;
		var dict = new Dict();
		var oldKeys = this._keys;
		var oldValues = this._values;
		var newIndex = oldLength;
		for (var i = 0; i < length; i++) {
			if (oldKeys[i] === key) {
				newIndex = i;
				break;
			}
		}
		// share the key and value arrays if possible
		if ((!this._extended) && newIndex === oldLength) {
			this._extended = true;
			keys = oldKeys;
			values = oldValues;
		}
		else {
			keys = oldKeys.slice(0, oldLength);
			values = oldValues.slice(0, oldLength);
		}
		keys[newIndex] = key;
		values[newIndex] = value;
		dict._keys = keys;
		dict._values = values;
		dict.length = keys.length;
		return dict;
	}
};
Dict.prototype.inspect = Dict.prototype.toString;