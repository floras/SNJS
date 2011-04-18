
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
  //CONNECTOR.PARSED   = ""; // Set By SNJS.excute()
	CONNECTOR.ENV	   = {};					   // Set By CODEBOX
	CONNECTOR.VARS	   = CONNECTOR.VARS     || {}; // Pass the variables to the Codebox.
	CONNECTOR.OPTIONS  = rebuildOptions(CONNECTOR);
	CONNECTOR.ERROR    = {SOFT:[], NORMAL:[]};
	CONNECTOR.PROTOCOL = CONNECTOR.PROTOCOL || ""; // HTTP, HTTPS, SIP
	CONNECTOR.isCONN   = true;
	CONNECTOR.INCLUDE  = { FILES : [], DEPTH : 0, PARENTS : []};	

	restrict(CONNECTOR, 'OPTIONS');

	// 1. CHECK TYPE AND GET SOURCE   
	
	if (CONNECTOR.TYPE == "FILE") {
		CONNECTOR.FILE = target;
		CONNECTOR.ENV['file'] = target;
		CONNECTOR.FILEINFO = getFileInfo(CONNECTOR);
		try	{CONNECTOR.SOURCE = fs.readFileSync(target, CONNECTOR.CHARSET);}
		catch (err) {CONNECTOR.ERROR = "SNJS CAN'T ACCESS SOURCE : " + FILE}
	} else if (!CONNECTOR.SOURCE)  CONNECTOR.SOURCE = target;
	if (CONNECTOR.ERROR.NORMAL.length > 0) { return excuteError(CONNECTOR)};

	// 2. GET SCRIPTS FROM SOURCE

	SNJS.collect(CONNECTOR);
	if (CONNECTOR.ERROR.NORMAL.length > 0) { return excuteError(CONNECTOR)};
	
	// 3. CREATE CODEBOX  

	if (CONNECTOR.SCRIPTS) CONNECTOR.CODEBOX = SNJS.codebox.create(CONNECTOR);
	if (CONNECTOR.ERROR.NORMAL.length > 0) { return excuteError(CONNECTOR)};

	// 4. EXCUTE SCRIPT 
	if (CONNECTOR.SCRIPTS) {SNJS.excute(CONNECTOR)};
	if (CONNECTOR.ERROR.NORMAL.length > 0) { return excuteError(CONNECTOR)};

	// 5. REBUILD CONNECTOR from CODEBOX
	if (CONNECTOR.SCRIPTS) {SNJS.codebox.render(CONNECTOR)};
	if (CONNECTOR.ERROR.NORMAL.length > 0) { return excuteError(CONNECTOR)};

	// 6. FINISH SNJS

	if (CONNECTOR.ASYNC&&CONNECTOR.CALLBACK) return CONNECTOR.CALLBACK(CONNECTOR);
	else return CONNECTOR;
};

SNJS.VERSION = "v0.0.03pa";
SNJS.VER = function() {console.log(SNJS.VERSION);};

// SNJS BUILT-IN UTILS
// ROUTINE : collect -> codebox.create -> excute -> codebox.render 

SNJS.collect = require("./SNJS.collect.js"); 
SNJS.excute  = require("./SNJS.excute.js"); 
SNJS.codebox = require("./SNJS.codebox.js");

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

// FILE*PATH UTILS
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
			CONNECTOR.ERROR.NORMAL.push("[FILE]" + file);
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

var excuteError = function(connector) {
	var CONNECTOR = connector;
	if (CONNECTOR.ERROR.NORMAL){
		CONNECTOR.PARSED = CONNECTOR.ERROR.SOFT.join("\n") + CONNECTOR.ERROR.NORMAL.join("\n");
	};
	if (CONNECTOR.ASYNC&&CONNECOTR.CALLBACK) {
		return CONNECTOR.CALLBACK(CONNECTOR);
	}
	return CONNECTOR;
};

// SNJS OPTIONS
SNJS.OPTIONS = require("./SNJS.OPTION.js");

module.exports = SNJS;