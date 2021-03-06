var SNJS = {codebox:{}};

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


module.exports = SNJS.codebox;