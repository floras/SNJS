
// LOAD MODULES

var fs = require('fs');
var vm = require('vm');
var path = require('path');
var extToCTYPE = require("./SNJS.ext.js");

var SNJS = function(target, connector, callback) {

	// CONNECTOR -> WINDOW -> EXCUTE CODE -> CHANGE TEXT -> CONNECTOR	

	// O. INIT (TRIM CONNECTOR OBJECT & ARGUMENTS);

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
  //CONNECTOR.PARSED   = ""; // Set By SNJS.excute()
	CONNECTOR.ENV	   = {};					   // Set By CODEBOX
	CONNECTOR.VARS	   = CONNECTOR.VARS     || {}; // Pass the variables to the Codebox.
	CONNECTOR.OPTIONS  = rebuildOptions(CONNECTOR);
	CONNECTOR.ERROR    = undefined;
	CONNECTOR.isCONN   = true;	

	// 1. CHECK TYPE AND GET SOURCE   
	
	if (CONNECTOR.TYPE == "FILE") {
		CONNECTOR.FILE = target;
		CONNECTOR.ENV['file'] = target;
		CONNECTOR.FILEINFO = getFileInfo(CONNECTOR);
		try	{CONNECTOR.SOURCE = fs.readFileSync(target, CONNECTOR.CHARSET);}
		catch (err) {CONNECTOR.ERROR = "SNJS CAN'T ACCESS SOURCE : " + FILE}
	} else if (!CONNECTOR.SOURCE)  CONNECTOR.SOURCE = target;
	if (CONNECTOR.ERROR) { return excuteError(CONNECTOR)};

	// 2. GET SCRIPTS FROM SOURCE

	CONNECTOR.SCRIPTS = SNJS.collect(CONNECTOR.SOURCE);
	if (CONNECTOR.ERROR) { return excuteError(CONNECTOR)};
	
	// 3. CREATE CODEBOX  

	if (CONNECTOR.SCRIPTS) CONNECTOR.CODEBOX = SNJS.codebox.create(CONNECTOR);
	if (CONNECTOR.ERROR) { return excuteError(CONNECTOR)};

	// 4. EXCUTE SCRIPT 
	if (CONNECTOR.SCRIPTS) {SNJS.excute(CONNECTOR)};
	if (CONNECTOR.ERROR) { return excuteError(CONNECTOR)};

	// 5. RENDER CODEBOX -> RESULT
	if (CONNECTOR.SCRIPTS) {SNJS.codebox.render(CONNECTOR)};
	if (CONNECTOR.ERROR) { return excuteError(CONNECTOR)};

	// 6. FINISH SNJS

	if (CONNECTOR.ASYNC&&CONNECTOR.CALLBACK) return CONNECTOR.CALLBACK(CONNECTOR);
	else return CONNECTOR;
};

SNJS.VERSION = "v0.0.1pa";
SNJS.VER = function() {console.log(SNJS.VERSION);};

// SNJS BUILT-IN UTILS
// ROUTINE : collect -> codebox.create -> excute -> codebox.render 

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
	var result = src.substring(src.indexOf("{")+1, src.lastIndexOf("}"))
	return result;
};

// FILE UTILS

var checkFileUrl = function(target) {
	var target = (typeof target == "object") ? target.FILE : target;
	if (typeof target != "string") return false;
	var check = target.charAt(0);
	var hasLine = (target.indexOf("\n") > -1);
	var result = ((check == "." || check == "/")&& !hasLine) ? true : false ;
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
			CONNECTOR.ERROR = "SNJS can't read fileinfo : " + file;
		}
	};	
	return result;
};

// SOURCE & SCRIPT UTILS

var getSource = function(target, econde) {
	var encode = encode || 'utf-8';
	try {result = fs.readFileSync(target,'utf-8');}
	catch (err) { return SNJSError("SNJS can't read filedata : " + target, 'FILE')};
	return result;	
};

var getScript = function(targetSource) {
	return SNJS.collect(targetSource);
};

var flagScript = function(source) {

};

var rebuildOptions = function(CONNECTOR) {
	var OPTIONS = CONNECTOR.OPTIONS;
	var RESULT = {};
	for (var i in SNJS.OPTIONS) RESULT[i] = SNJS.OPTIONS[i];
	for (var i in OPTIONS) RESULT[i] = OPTIONS[i];
	return RESULT;
};

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

var excuteError = function(connector) {
	var CONNECTOR = connector;
	CONNECTOR.PARSED = CONNECTOR.ERROR;
	if (CONNECTOR.ASYNC&&CONNECOTR.CALLBACK) {
		return CONNECTOR.CALLBACK(CONNECTOR);
	}
	return CONNECTOR;
};

//  SNJS.codebox.js

SNJS.codebox = {};
SNJS.codebox.create = function(connector) {
	var CONNECTOR = connector;
	var CODEBOX = {
		_REQUEST  : CONNECTOR.REQUEST,
		_RESPONSE : CONNECTOR.RESPONSE || {},
		_ENV	  : CONNECTOR.ENV,
		_OPTIONS  : CONNECTOR.OPTIONS,
		_VAR	  : {} 
	};
	var ENV = CODEBOX._ENV;
	
	for (var i in CONNECTOR.VARS) CODEBOX[i] = CONNECTOR.VARS[i];

	// SET ENVIROMENTAL VARIABLES  
	if (CONNECTOR.URL)	      ENV['URL']         = CONNECTOR.URL;	
	if (CONNECTOR.METHOD)     ENV['method']      = CONNECTOR.METHOD;
	if (CONNECTOR.USERAGENT)  ENV['user_agent']  = CONNECTOR.USERAGENT;
	if (CONNECTOR.REMOTEADDR) ENV['remote_addr'] = CONNECTOR.REMOTEADDR;
	if (CONNECTOR.RFERRER)    ENV['referrer']    = CONNECTOR.RFERRER;	
	if (CONNECTOR.SESSIONID)  ENV['sessionid']   = CONNECTOR.SESSIONID;	
	if (CONNECTOR.CHARSET)    ENV['charset']     = CONNECTOR.CHARSET;	
	if (CONNECTOR.TYPE = "FILE") {
		CONNECTOR.ENV['modification']      = CONNECTOR.FILEINFO.mtime;
		CODEBOX._RESPONSE['last-modified'] = CONNECTOR.FILEINFO.mtime;
		if (CONNECTOR.FILEINFO['content-type']) 
		CODEBOX._RESPONSE['content-type']  = CONNECTOR.FILEINFO['content-type'];
	};
	return CODEBOX;	
};

SNJS.codebox.render = function(connector) {
	var CONNECTOR = connector;
	var CODEBOX   = CONNECTOR.CODEBOX; 
	CONNECTOR.RESPONSE = CODEBOX._RESPONSE;
	CONNECTOR.COOKIES  = CODEBOX.COOKIES;
	CONNECTOR.SESSION  = CODEBOX.SESSION;
	return CONNECTOR;
};

//  SNJS.excute.js 

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

	CODEBOX._PARSED = [];

	// BUILT ENVIRONMENT FROM OPTIONS
	if (OPTIONS['ALLOW_REQUIRE']) CODEBOX.require = require;

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

	
	// ATTACH COOKIES UTILS (document.write, echo);

	if (CONNECTOR.COOKIES) {
		for (var i in CONNECTOR.COOKIES) {

		}
	}

	
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
	for (var i in CODEBOX._PARSED) { // BE CAREFUL. FOR IN USES ARRAY TYPE [TO-DO: FIX FOR EXCEPTION] 
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

// SNJS.collect.js

var NEEDLE = {
	snjs     : "<(snjs)(\\s+(?:\"[^\"]*\"|'[^']*'|[^>])+)?>([\\S|\\s]*?)</\\1>",
	script   : "<(script)(\\s+(?:\"[^\"]*\"|'[^']*'|[^>])+)?>([\\S|\\s]*?)</\\1>",
};

SNJS.collect = function(source) { //script collection
	var result = [];
	var source = source;
	var _attr, _tag;
	for ( _tag in NEEDLE) {
		var Reg = RegExp(NEEDLE[_tag], "gi");
		var test;
		while ((test = Reg.exec(source)) != null) {
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
				_range      : [test.index, Reg.lastIndex]
			};
			if (script.attributes&&script.attributes.src) script.src = script.attributes.src;
			if (script.attributes&&script.attributes.id) script.id = script.attributes.id;
			if (script.attributes&&script.attributes.charset) script.charset = script.attributes.charset;
			if (script.tagName=="snjs") script._type = "snjs";
			else if (script.tagName=="script") {
				if(script.attributes.type.indexOf('javascript')>0) {
					if (script.attributes.share == "true") script._type = "share";
				} else if (script.attributes.type=="application/x-snjs") script._type = "script";
			};

			if (script._type) result.push(script);
		};
	};
	if (result.length == 0) return undefined;
	var sort = function(a,b){return a._range[0]-b._range[0]};
	var result = result.sort(sort);
	return result;
};


// SNJS OPTIONS

try {
	var OPTIONFILE = __dirname + "/SNJS.default.json";
	SNJS.OPTIONS = JSON.parse(fs.readFileSync(OPTIONFILE, 'utf-8'));
}
catch (err){
	SNJS.OPTIONS = {};
}

module.exports = SNJS;
