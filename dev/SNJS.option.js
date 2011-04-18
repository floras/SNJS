var fs = require('fs');
var SNJS = {};

try {
	var OPTIONFILE = __dirname + "/SNJS.default.json";
	SNJS.OPTIONS = JSON.parse(fs.readFileSync(OPTIONFILE, 'utf-8'));
}

catch (err) {
	SNJS.OPTIONS = {};
};

// BUG-FIX : Stop converting undefined type -> "undefined" string

SNJS.OPTIONS['BASE_DIRECTORY'] = SNJS.OPTIONS['BASE_DIRECTORY'] || "";
SNJS.OPTIONS['LOCK_DIRECTORY'] = SNJS.OPTIONS['LOCK_DIRECTORY'] || "";


module.exports = SNJS.OPTIONS;