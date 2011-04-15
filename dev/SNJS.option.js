var fs = require('fs');
var SNJS = {};

try {
	var OPTIONFILE = __dirname + "/SNJS.default.json";
	SNJS.OPTIONS = JSON.parse(fs.readFileSync(OPTIONFILE, 'utf-8'));
}
catch (err) {
	SNJS.OPTIONS = {};
};
module.exports = SNJS.OPTIONS;