var SNJS = {};
var vm = require('vm');

SNJS.excute = function(connector) {
	var CONNECTOR = connector;
	var SOURCE  = CONNECTOR.SOURCE;
	var OPTIONS = CONNECTOR.OPTIONS;
	var CODEBOX = CONNECTOR.CODEBOX;
	var	SCRIPTS = CONNECTOR.SCRIPTS;
	var PARSED  = "";
	
	// define local variables;

	var VFILE   = "SNJS.VM";
	var COUNTER = 0;
	var STATE   = "init";
	var TYPE; // 'snjs', 'share', 'script'

	CODEBOX._PARSED = {};

	// BUILT ENVIRONMENT FROM OPTIONS
	if (OPTIONS['ALLOW_REQUIRE']) CODEBOX.require = require;
	if (OPTIONS['ALLOW_CONSOLE']) CODEBOX.console = console;

	// ATTACH GLOBAL OBJECT
	vm.runInNewContext("var self=window=this;", CODEBOX, VFILE);

	// ATTACH MAIN UTILS (document.write, echo);

	CODEBOX.document = {};	
	CODEBOX.print = function(txt) {
		if (STATE == "loading" && (TYPE!="share")) {
			CODEBOX._PARSED[COUNTER] = CODEBOX._PARSED[COUNTER] || [];
			CODEBOX._PARSED[COUNTER].push(txt);
		}
	};
	if (CODEBOX.document) CODEBOX.document.write = CODEBOX.print;	

	CODEBOX.echo = function(txt) {
		var text = txt;
		CODEBOX.print(text);
	};
	
	STATE = "loading";

	for (COUNTER = 0 ; COUNTER < SCRIPTS.length ; COUNTER++) {
		var script = SCRIPTS[COUNTER];
		TYPE = script._type || undefined;
		try	{			
			if (TYPE=="share" && (OPTIONS['ALLOW_SHARE'])) {
				vm.runInNewContext(script.text, CODEBOX, VFILE);
			} else if (TYPE=="snjs" || TYPE=="script") {
				vm.runInNewContext(script.text, CODEBOX, VFILE);
			};			
		}
		catch (err)	{
			CONNECTOR.ERROR = "SYNTAX ERROR " + err; 
			return CONNECTOR;
		}
	};

	STATE = "loaded";

	STATE = "complete";

	// REPLACE SOURCE;
	
	var CARROT = 0;
	var PARSED = SOURCE;
	for (var i in CODEBOX._PARSED) { // BE CAREFUL. 'FOR IN' USED ARRAY TYPE [TO-DO: NEXT, FIX FOR EXCEPTION] 
		var script = SCRIPTS[i];
		var type   = script._type;
		var range  = script._range;
		var data   = CODEBOX._PARSED[i].join("");
		if (type=="share") continue;
		if (data) {
			var header  = PARSED.slice(0, range[0] + CARROT);
			var footer  = PARSED.slice(range[1] + CARROT);
			PARSED = header + data + footer;
			CARROT = CARROT - ((range[1] - range[0]) - data.length) ;
		}
	};
	CONNECTOR.PARSED = PARSED;
	return CONNECTOR;
}

module.exports = SNJS.excute;