/*
* SNJS.collect method 
*
* 2011-04-15
*/

var SNJS = {};

// NEEEEEEDLE (TEMP)

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

module.exports = SNJS.collect;