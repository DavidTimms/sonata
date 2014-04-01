var baseObject = Object.create(null, {
	type: {
		value: "Object"
	},
	toString: {
		value: function () {
			return "{" + this.type + "}";
		}
	}
});

var mix = function (parent, child) {
	var key;
	var obj = {};
	for (key in parent) {
		obj[key] = parent[key];
	}
	for (key in child) {
		obj[key] = child[key];
	}
	return obj;
}

var type = function (val) {
	return (val === null ? "null" : typeof(val));
}

var print = console.log.bind(console);