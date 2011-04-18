var SNJS = {};
var vm   = require('vm');
var path = require('path');
var fs   = require('fs');
SNJS.collect = require('./SNJS.collect.js');

/*********** START ************/

SNJS.execute = function(connector) {
	var CONNECTOR = connector;
	var SOURCE  = CONNECTOR.SOURCE;
	var CODEBOX = CONNECTOR.CODEBOX;
	var	SCRIPTS = CONNECTOR.SCRIPTS;
	var INCLUDE = CONNECTOR.INCLUDE;
	var O = CONNECTOR.OPTIONS;
	var PARSED  = "";
	
	// define local variables;

	var VFILE   = "SNJS.VM";
	var COUNTER = 0;
	var STATE   = "init";
	var TYPE; // 'snjs', 'share', 'script'

	var execute = function(code) {
		vm.runInNewContext(code, CODEBOX, VFILE);
		return vm;
	};

	CODEBOX._PARSED = {};

	// BUILT ENVIRONMENT FROM OPTIONS
	if (O['ALLOW_REQUIRE']) CODEBOX.require = require;
	if (O['ALLOW_CONSOLE']) CODEBOX.console = console;

	// ATTACH GLOBAL OBJECT
	execute("var self=window=this;");

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

	if (O['ALLOW_INCLUDE']) {
		CODEBOX.include = function(file, once) {
			var INCLUDE = CONNECTOR.INCLUDE; // FILES : [], DEPTH : 0, PARENTS
			var FILE = trimFile(file, CONNECTOR);

			// CHECK : FILE
			if (!FILE) return CONNECTOR.ERROR.NORMAL = "[INCLUDE] Check File : " + file;

			// CHECK : INCLUDE_ONCE & LOOP FILE
			if (once) if (INCLUDE.FILES.indexOf(FILE) > -1) return false;
			if (INCLUDE.PARENTS.indexOf(FILE) > -1) return false

			var SOURCE = fs.readFileSync(FILE, "utf-8");
			if (!SOURCE) return CONNECTOR.ERROR.NORMAL = "[INCLUDE] Check File : " + file;

			var result = SNJS.collect.get(SOURCE, CONNECTOR);
			CONNECTOR.ERROR.NORMAL = result.ERROR.NORMAL || "";

			INCLUDE.FILES.push(FILE);
			INCLUDE.PARENTS.push(FILE);

			for (var i=0; i < result.SCRIPTS.length; i++ ) {
				try	{execute(result.SCRIPTS[i].text);}
				catch (err) {
					CONNECTOR.ERROR.NORMAL = "[INCLUDE] " + FILE + " " + err;
					return false;
				}
			}
			return true;
			
		};	
		CODEBOX.include_once = function(file) {
			return CODEBOX.include(file, true);
		};
	}
		
	STATE = "loading";

	// LET"S GOGOGOGO NORMAL executING

	var DEFER = [];

	for (COUNTER = 0 ; COUNTER < SCRIPTS.length ; COUNTER++) {
		var script = SCRIPTS[COUNTER],
			TYPE = script._type || undefined
			INCLUDE.PARENTS = [CONNECTOR.FILE]; // TOP parent
			INCLUDE.DEPTH = 0;
		try	{
			if (TYPE=="share" && O['ALLOW_SHARE']) execute(script.text);
			else if (TYPE=="snjs" || TYPE=="script") execute(script.text);
		}
		catch (err)	{
			CONNECTOR.ERROR.NORMAL = "[execute:" + script._type + COUNTER +"] "+ err; 
			return CONNECTOR;
		};
		if (CONNECTOR.ERROR.NORMAL) return undefined;
	};

	STATE = "loaded";

	// HANDLE DEFER

	// NEXT TIME

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

/*********** END ************/


var trimFile = function(file, CONNECTOR) {
	// Always relative path -> absolute path
	var O = CONNECTOR.OPTIONS,
		FILE = file,
		TYPE = CONNECTOR.TYPE || "SOURCE",
		PATH = (CONNECTOR.FILEINFO) ? (CONNECTOR.FILEINFO['path']||"") : "",
		firstChar = file.charAt(0);
		RESULT = "";

	//TYPE == "SOURCE"
	if (TYPE == "SOURCE") {
		if (O['BASE_DIRECTORY']) RESULT = O['BASE_DIRECTORY'] + "/" + FILE;		
	}

	// TYPE == "FILE"
	else if (firstChar == "/") RESULT = O['BASE_DIRECTORY'] + "/" + FILE;
	else RESULT = path.normalize(PATH + "/" + FILE);	

	// CHECK LOCK

	if (O['LOCK_DIRECTORY']) {
		if (RESULT.indexOf(O['LOCK_DIRECTORY']) != 0) return false;
	}
	return path.normalize(RESULT);
};

module.exports = SNJS.execute;