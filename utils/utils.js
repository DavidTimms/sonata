var jsonpretty = require('jsonpretty');

function printObject(obj) {
	console.log(jsonpretty(obj));
	return obj;
}

function bareObject(properties) {
	var obj = Object.create(null);
	Object.keys(properties).forEach(function (key) {
		obj[key] = properties[key];
	});
	return obj;
}

function combineObjects(x, y) {
	var key;
	var combined = Object.create(null);
	for (key in x) {
		combined[key] = x[key];
	}
	for (key in y) {
		combined[key] = y[key];
	}
	return combined;
}

function flatMap(arr, func) {
	return arr.map(func).reduce(function (a, b) {
		return a.concat(b);
	}, []);
}

function negate(predicate) {
	return function () {
		return !predicate.apply(this, arguments);
	}
}

function last(arr) {
	return arr[arr.length - 1];
}

var varGen = 0;
function generateVarName() {
	return "$sonata_var" + varGen++;
}

function wrapStringTokens(token) {
	if (token instanceof Array) {
		return token.map(wrapStringTokens);
	}
	else {
		switch (typeof(token)) {
			case "number":
				return makeLiteral(token);
			case "string":
				return makeIdentifier(token, {escape: false});
			default:
				return token;
		}
	}
}

// these are duplicated in AST converter.
// what is the best way to share them?
function makeLiteral(value) {
	return {
		type: "Literal",
		value: value,
	};
}

function makeIdentifier(name, options) {
	var escape = options ? options.escape : true;
	return {
		type: "Identifier",
		name: escape ? normalizeIdentifier(name) : name
	};
}

module.exports = {
	bareObject: bareObject,
	combineObjects: combineObjects,
	flatMap: flatMap,
	negate: negate,
	last: last,
	printObject: printObject,
	generateVarName: generateVarName,
	wrapStringTokens: wrapStringTokens,
};