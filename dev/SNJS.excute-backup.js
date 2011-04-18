var SNJS = {};
var vm = require('vm');

SNJS.excute = function(connector) {
	var CONNECTOR = connector;
	var SOURCE  = CONNECTOR.SOURCE;
	var CODEBOX = CONNECTOR.CODEBOX;
	var	SCRIPTS = CONNECTOR.SCRIPTS;
	var O = CONNECTOR.OPTIONS;
	var PARSED  = "";
	
	// define local variables;

	var VFILE   = "SNJS.VM";
	var COUNTER = 0;
	var STATE   = "init";
	var TYPE; // 'snjs', 'share', 'script'

	var excute = function(code) {
		vm.runInNewContext(code, CODEBOX, VFILE);
		return vm;
	};

	CODEBOX._PARSED = {};

	// BUILT ENVIRONMENT FROM OPTIONS
	if (O['ALLOW_REQUIRE']) CODEBOX.require = require;
	if (O['ALLOW_CONSOLE']) CODEBOX.console = console;

	// ATTACH GLOBAL OBJECT
	excute("var self=window=this;");

	// ATTACH BUILT-IN UTILS

	CODEBOX.document = {};	
	CODEBOX.print = function(txt) {
		if (STATE == "loading" && (TYPE!="share")) {
			CODEBOX._PARSED[COUNTER] = CODEBOX._PARSED[COUNTER] || [];
			CODEBOX._PARSED[COUNTER].push(txt);
		}
	};

	if (CODEBOX.document) {
		CODEBOX.document.write = CODEBOX.print;	
	};
	
	if (O['ALLOW_NODEEVAL']) {
		CODEBOX.nodeEval = function(code) {
			return eval.call(null, code);
		};
	};

	CODEBOX.echo = function(txt) {
		CODEBOX.print(txt);
	};

	CODEBOX.include = function(file) {
		//check file
		++CONNECTOR.INCLUDE.FILES.push(file);
	};
	
	CODEBOX.include_once = function(file) {
		var file = file
		//get the absolute path of the file
		if (CONNECTOR.INCLUDE.FILES.indexOf(file) > -1) {
			return false;
		}
		return CODEBOX.include(file);
	};
	
	CODEBOX.require = function(file) {
		//check file
		++CONNECTOR.INCLUDE.FILES.push(file);
	};
	
	CODEBOX.require_once = function(file) {
		var file = file
		//get the absolute path of the file
		if (CONNECTOR.INCLUDE.FILES.indexOf(file) > -1) {
			return false;
		}
		return CODEBOX.include(file);
	};
	
	
	STATE = "loading";

	// LET"S GOGOGOGO EXCUTING

	for (COUNTER = 0 ; COUNTER < SCRIPTS.length ; COUNTER++) {
		var script = SCRIPTS[COUNTER];
		TYPE = script._type || undefined;
		try	{
			if (TYPE=="share" && O['ALLOW_SHARE']) {
				excute(script.text);
			} else if (TYPE=="snjs" || TYPE=="script") {
				vm.runInNewContext(script.text, CODEBOX, VFILE);
				excute(script.text);
			};			
		}
		catch (err)	{
			CONNECTOR.ERROR.NORMAL.push("[excute:" + script._type + COUNTER +"] "+ err); 
			return CONNECTOR;
		};
	};

	STATE = "loaded";

	STATE = "complete";

	// LET"S GOGOGOGO PARSING
	
	var CARROT = 0;
	var PARSED = SOURCE;
	for (var i in CODEBOX._PARSED) {

		if (script._type=="share") continue;
		
		var script = SCRIPTS[i];
		var range  = script._range;
		var data   = CODEBOX._PARSED[i].join("");
		var header  = PARSED.slice(0, range[0] + CARROT);
		var footer  = PARSED.slice(range[1] + CARROT);
		PARSED = header + data + footer;
		CARROT = CARROT - ((range[1] - range[0]) - data.length) ;
	};
	CONNECTOR.PARSED = PARSED;
	return CONNECTOR;
}

module.exports = SNJS.excute;