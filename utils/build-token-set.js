
// returns an object with every word in 
// the input string mapped to true
function buildTokenSet (str, opts) {
	opts = opts || {};

	var tokens = str.split(" ");
	var dict = Object.create(null);
	for (var i = 0; i < tokens.length; i++) {
		var j = (opts.prefixs ? 1 : tokens[i].length);
		for (; j <= tokens[i].length; j++) {
			dict[tokens[i].substring(0, j)] = true;
		}
	}
	return dict;
}

module.exports = buildTokenSet;