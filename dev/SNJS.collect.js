/*
* SNJS.collect method 
*
* 2011-04-19
*/
var fs   = require('fs');
var path = require('path');
var SNJS = {};

// ################## START

// NEEEEEEDLE (TEMP)

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


// ################## END

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

module.exports = SNJS.collect;