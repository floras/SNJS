
// LOAD MODULES

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var extToCTYPE = require("./SNJS.ext.js");

var SNJS = function(target, connector, callback) {

	// O. INIT 

	var CONNECTOR = connector || {} ;

	CONNECTOR.ASYNC    = (callback) ? true : false ;
	CONNECTOR.TYPE	   = (checkFileUrl(target)) ? "FILE" : "SOURCE"; 
	CONNECTOR.URL	   = CONNECTOR.URL || "";
	CONNECTOR.USERAGENT= CONNECTOR.USERAGENT|| "";
	CONNECTOR.REFERRER = CONNECTOR.REFERRER || "";
	CONNECTOR.REQUEST  = CONNECTOR.REQUEST  || {};
	CONNECTOR.RESPONSE = CONNECTOR.RESPONSE || {}; // Set By CODEBOX
	CONNECTOR.POST     = CONNECTOR.POST     || {};
  //CONNECTOR.GET      = CONNECTOR.GET      || {}; // Set By CODEBOX
	CONNECTOR.COOKIES  = CONNECTOR.COOKIES  || {}; // Set By CODEBOX
	CONNECTOR._COOKIES = {}; // REAL OBJECT Set By CODEBOX name : {value:, expires:, path: }, _destroy
	CONNECTOR.SESSION  = CONNECTOR.SESSION  || {}; // Set By CODEBOX
  //CONNECTOR.SESSIONID= CONNECTOR.SESSIONID  
	CONNECTOR._SESSION = {}; // REAL OBJECT Set By CODEBOX name : {value:, expires:, path: }, _destroy
	CONNECTOR.CHARSET  = CONNECTOR.CHARSET  || "utf-8";
	CONNECTOR.CALLBACK = (typeof callback == "function") ? callback : undefined;	
	CONNECTOR.SOURCE   = CONNECTOR.SOURCE   || "";
  //CONNECTOR.PARSED   = ""; // Set By SNJS.execute()
  //CONNECTOR.ENV	   = {};					   // Set By CODEBOX
	CONNECTOR.VARS	   = CONNECTOR.VARS     || {}; // Pass the variables to the Codebox.
	CONNECTOR.ERROR    = {SOFT:[], NORMAL:""};
	CONNECTOR.PROTOCOL = CONNECTOR.PROTOCOL || ""; // HTTP, HTTPS, SIP
	CONNECTOR.isCONN   = true;
	CONNECTOR.INCLUDE  = { FILES : [], DEPTH : 0, PARENTS : []};
	CONNECTOR.OPTIONS  = rebuildOptions(CONNECTOR);

	restrict(CONNECTOR, 'OPTIONS');

	// 1. CHECK TYPE AND GET SOURCE 

	if (typeof target != "string") {  // EXCEPTION invalid target option
		CONNECOTR.ERROR.NORMAL = "[SNJS] " + "invaild file or source";
		return executeError(CONNECTOR);
	}
	
	if (CONNECTOR.TYPE == "FILE") {
		CONNECTOR.FILE = trimFile(target, CONNECTOR);
		if (!CONNECTOR.FILE) {
			CONNECTOR.ERROR.NORMAL = "[SNJS 0]" + " check directory option or/and file";
			return executeError(CONNECTOR);
		}
		CONNECTOR.FILEINFO = getFileInfo(CONNECTOR);
		
		try	{
			CONNECTOR.SOURCE = fs.readFileSync(target, CONNECTOR.CHARSET);
		} catch (err) {
			CONNECTOR.ERROR.NORMAL = "[SNJS.js] check source file : " + FILE ;
		}

	} else if (!CONNECTOR.SOURCE)  CONNECTOR.SOURCE = target;
	if (CONNECTOR.ERROR.NORMAL) { return executeError(CONNECTOR)};

	// 2. GET SCRIPTS FROM SOURCE

	SNJS.collect(CONNECTOR);
	if (CONNECTOR.ERROR.NORMAL) { return executeError(CONNECTOR)};
	
	// 3. CREATE CODEBOX  

	if (CONNECTOR.SCRIPTS) CONNECTOR.CODEBOX = SNJS.codebox.create(CONNECTOR);
	if (CONNECTOR.ERROR.NORMAL) { return executeError(CONNECTOR)};

	// 4. executE SCRIPT 
	if (CONNECTOR.SCRIPTS) {SNJS.execute(CONNECTOR)};
	if (CONNECTOR.ERROR.NORMAL) { return executeError(CONNECTOR)};

	// 5. REBUILD CONNECTOR from CODEBOX
	if (CONNECTOR.SCRIPTS) {SNJS.codebox.render(CONNECTOR)};
	if (CONNECTOR.ERROR.NORMAL) { return executeError(CONNECTOR)};

	// 6. FINISH SNJS

	if (CONNECTOR.ASYNC&&CONNECTOR.CALLBACK) return CONNECTOR.CALLBACK(CONNECTOR);
	else return CONNECTOR;
};

SNJS.VERSION = "v0.0.03pa";
SNJS.VER = function() {console.log(SNJS.VERSION);};

// SNJS BUILT-IN UTILS
// ROUTINE : collect -> codebox.create -> execute -> codebox.render 

/* 
SNJS.remove = function() {};
SNJS.escape = function() {};
SNJS.unescape = function() {};
*/

// INSIDE UTILS;

var restrict = function(target, property) { // + [ECMA5] use strict?
	if (property) {
		Object.defineProperty(target, property, {
			writable: false, enumerable: true, configurable: false
		});		
	} else Object.preventExtensions(target);
	return target;
};

var restrictIn = function(target) {
	for (var i in target) restrict(target, i);
	return target;
};

var bodyFromFunction = function(func) { // function body -> string
	var src = func.toString();
	var result = src.substring(src.indexOf("{")+1, src.lastIndexOf("}"));
	return result;
};

// FILE*PATH UTILS

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


var checkType  = function(target) {
	if (typeof target != "string") return false;
	var check = target.charAt(0);
	var hasLine = (target.indexOf("\n") > -1);
	var result = ((check == "." || check == "/") && !hasLine) ? true : false ;
	return result;
};



var checkFileUrl = function(target) {
	if (typeof target != "string") return false;
	var check = target.charAt(0);
	var hasLine = (target.indexOf("\n") > -1);
	var result = ((check == "." || check == "/") && !hasLine) ? true : false ;
	return result;
};


var getFileInfo = function(connector) {
	var CONNECTOR = connector;
	var file = (typeof CONNECTOR == "object") ? CONNECTOR.FILE : connector; 
	var result = {
		file : undefined,
		filename : undefined,
		ext  : undefined, 
		path : undefined,
		size : undefined,
		'content-type' : undefined,
		mtime: undefined,
	};
	try {
		result.file = path.normalize(file);
		result.filename = path.basename(file);
		result.path = path.dirname(file);
		var stats = fs.statSync(result.file);
		result.mtime = stats.mtime;
		result.size = stats.size;
		result.ext = (path.extname(file)).replace(".", "");
		result['content-type'] = extToCTYPE(result.ext);
	}
	catch (err) {
		if (typeof CONNECOTR == "object") {
			CONNECTOR.ERROR.NORMAL = "[FILE]" + file;
		}
	};	
	return result;
};

// SOURCE&SCRIPT UTILS
var getSource = function(target, econde) {
	var encode = encode || 'utf-8';
	try {result = fs.readFileSync(target,'utf-8');}
	catch (err) { return SNJSError("SNJS can't read filedata : " + target, 'FILE')};
	return result;	
};

var rebuildOptions = function(CONNECTOR) {
	var O1 = CONNECTOR.OPTIONS,
		O2 = SNJS.OPTIONS,
		RESULT = {};
	for (var i in O1) RESULT[i] = O1[i];
	for (var i in O2) RESULT[i] = O2[i];
	
	restrictIn(RESULT);
	return RESULT;
};

// ERROR UTILS
var SNJSError = function(message, type) {
	var self = this;
	self.isError = true;
	self.type = type;
	self.message = message;
	self.toString = function() {
		var type = (self.type) ? " ["+self.type+"]" : "";
		return self.message + type;
	};
};

var executeError = function(connector) {
	var CONNECTOR = connector;
	if (CONNECTOR.ERROR.NORMAL){
		CONNECTOR.PARSED = CONNECTOR.ERROR.SOFT.join("\n") + CONNECTOR.ERROR.NORMAL;
	};
	if (CONNECTOR.ASYNC&&CONNECOTR.CALLBACK) {
		return CONNECTOR.CALLBACK(CONNECTOR);
	}
	return CONNECTOR;
};

/*** SNJS.codebox.js ***/
SNJS.codebox = {};
SNJS.codebox.create = function(connector) {
	var CONNECTOR = connector;
	var O = CONNECTOR.OPTIONS;
	var CODEBOX = {
		_REQUEST  : CONNECTOR.REQUEST,
		_RESPONSE : CONNECTOR.RESPONSE || {},
		_ENV	  : {},
		_OPTIONS  : CONNECTOR.OPTIONS,
		_VAR	  : {} 
	};
	var ENV = CODEBOX._ENV;
	
	for (var i in CONNECTOR.VARS) CODEBOX[i] = CODEBOX[i] || CONNECTOR.VARS[i];

	// SET ENVIROMENTAL VARIABLES  		
	if (CONNECTOR.PROTOCOL)   ENV['protocol']      = CONNECTOR.PROTOCOL; 
	if (CONNECTOR.URL)        ENV['URL']           = CONNECTOR.URL;	
	if (CONNECTOR.METHOD)     ENV['method']        = CONNECTOR.METHOD;
	if (CONNECTOR.USERAGENT)  ENV['user_agent']    = CONNECTOR.USERAGENT;
	if (CONNECTOR.REMOTEADDR) ENV['remote_addr']   = CONNECTOR.REMOTEADDR;
	if (CONNECTOR.RFERRER)    ENV['referrer']      = CONNECTOR.RFERRER;	
	if (CONNECTOR.SESSIONID)  ENV['sessionid']     = CONNECTOR.SESSIONID;
	if (CONNECTOR.CHARSET)    ENV['charset']       = CONNECTOR.CHARSET;
	if (O['BASE_DIRECTORY'])  ENV['base_directory']= CONNECTOR.O['BASE_DIRECTORY'];
	if (CONNECTOR.TYPE = "FILE") {
		ENV['last-modified'] = CONNECTOR.FILEINFO.mtime;
		ENV['content-type']  = CONNECTOR.FILEINFO['content-type'];
	};
	return CODEBOX;	
};

SNJS.codebox.render = function(connector) {
	var CONNECTOR = connector;
	var CODEBOX   = CONNECTOR.CODEBOX; 

	CONNECTOR.RESPONSE = CODEBOX._RESPONSE;
	CONNECTOR.COOKIES  = CODEBOX._COOKIES;
	CONNECTOR.SESSION  = CODEBOX.SESSION;

	return CONNECTOR;
};

/*** SNJS.execute.js ***/

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

/*** SNJS.collect.js  ***/

var NEEDLE = {
	snjs     : "<(snjs)(\\s+(?:\"[^\"]*\"|'[^']*'|[^>])+)?>([\\S|\\s]*?)</\\1>",
	script   : "<(script)(\\s+(?:\"[^\"]*\"|'[^']*'|[^>])+)?>([\\S|\\s]*?)</\\1>",
};


SNJS.collect = function(connector) { //script collection
	var result = [];
	var CONNECTOR = connector;
	var O = CONNECTOR.OPTIONS;
	var source = CONNECTOR.SOURCE;
	var _attr, _tag;
	for ( _tag in NEEDLE) {
		var Reg = RegExp(NEEDLE[_tag], "gi");
		var test;
		while ((test = Reg.exec(source)) != null) { try {

			if (test[2]) {
				_attr = test[2].trim();
				_attr = _attr.match(/(\w|^=)+=("[^"]*"|'[^']*')+/gi);
				var attr = {};
				_attr.map(function(item) {
					var array = item.split('=');
					if (!attr[array[0]]) {
						attr[array[0]] = array[1].substr(1,array[1].length - 2);
					};
					return result; 
				});
			};

			var script = { 
				tagName    : _tag,
				attributes : attr,
				text       : test[3],
				_type	   : undefined,
				_range     : [test.index, Reg.lastIndex]
			};

			if (script.attributes&&script.attributes.src) script.src = script.attributes.src;
			if (script.attributes&&script.attributes.id) script.id = script.attributes.id;
			if (script.attributes&&script.attributes.charset) script.charset = script.attributes.charset;
			
			// SET script._type
			if (script.tagName=="snjs") { 
				script._type = "snjs";
			} else if (script.tagName=="script") {
				if(script.attributes.type.indexOf('javascript')>0) {
					if (script.attributes.share == "true") script._type = "share";
				} else if (script.attributes.type=="application/x-snjs") script._type = "script";
			};

			if (script._type&&script.src&&O['ALLOW_SOURCE_LINK']) {
				var file = "";
				if (script.src.indexOf(":") > 0 ) continue; // skip remote resource (http://);
				else if (script.src.charAt(0) == "/") file = script.src;
				else file = CONNECTOR.FILEINFO.path + "/" + script.src;
				file = path.normalize(file);
				script.text = fs.readFileSync(file);
			};
			if (script._type) result.push(script);

		} catch(err) {CONNECTOR.ERROR.SOFT.push("[collect]" + err); return CONNECTOR} };
	};
	if (result.length == 0) return undefined;
	var sort = function(a,b){return a._range[0]-b._range[0]};
	CONNECTOR.SCRIPTS = result.sort(sort);
	return CONNECTOR;
};

SNJS.collect.get = function(source, connector) {
	var VConnector = {
		TYPE     : connector.TYPE,
		FILEINFO : connector.FILEINFO,
		SOURCE   : source,
		OPTIONS  : connector.option,
		ERROR    :  { SOFT : [], NORMAL : ""}
	};	
	return SNJS.collect(VConnector);	
};

/*** SNJS.option.js ***/
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


module.exports = SNJS;
