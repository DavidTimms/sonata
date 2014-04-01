function removeEmptyToken (tokens) {
	if (tokens[tokens.length - 1] === "") {
		tokens.pop();
	}
	return tokens;
}

function tokenize (source) {
	var input = source.split("");

	function reduceInput (tokens, chr) {
		var lastToken = tokens[tokens.length - 1];
		// inside string literals
		if (lastToken && lastToken.match(/^["']/)) {
			tokens[tokens.length - 1] += chr;
			if (lastToken.charAt(0) === chr && 
				lastToken.charAt(lastToken.length - 1) !== "\\") {
				tokens.push("");
			}
		}
		// brackets
		else if (chr.match(/[(){}\[\].]/)) {
			removeEmptyToken(tokens).push(chr, "");
		}
		// whitespace (including commas)
		else if (chr.match(/\s/) || chr === ",") {
			removeEmptyToken(tokens).push("");
		}
		// string literal start
		else if (chr.match(/["']/)) {
			removeEmptyToken(tokens).push(chr);
		}
		// anything else
		else {
			tokens[tokens.length - 1] += chr;
		}
		return tokens;
	}

	return input.reduce(reduceInput, []);;
}

module.exports = tokenize;