
function type (x) {
	var type = typeof(x);
	if (type === "object") {
		if (x === null) {
			return "null";
		}
		return x.constructor.name;
	}
	return type;
}

(function test () {
	var assert = require("assert");
	function Person () {};

	var tests = {
		"string": "test",
		"number": 45.5,
		"function": function () {},
		"RegExp": /./,
		"Object": {},
		"Array": [],
		"null": null,
		"undefined": undefined,
		"Person": new Person()
	};

	for (result in tests) {
		assert.strictEqual(type(tests[result]), result);
	}
})();

module.exports = type;