var unicode = require("unicode-categories");

module.exports = {
	normalizeIdentifier: normalizeIdentifier,
	isValidJSIdentifier: isValidJSIdentifier
};

function normalizeIdentifier(name) {
	if (isValidJSIdentifier(name)) {
		return name;
	}
	else return name.split("").map(function (chr, i) {
		if (unicode.ECMA.start.test(chr) || 
			(i > 0 && unicode.ECMA.part.test(chr))) {
			return chr;
		} else {
			return "_$U" + chr.charCodeAt(0) + "_";
		}
	}).join("");
}

function isValidJSIdentifier(name) {
	var matches = name.match(unicode.ECMA.identifier);
	return matches && matches[0].length === name.length;
}