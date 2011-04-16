// MINI DOM PARSER
// (under construction)

DOM = function(input) {
	if (typeof input == "object") return DOM.RENDER(input);
	if (typeof input == "string") return DOM.PARSER(input);
	return undefined;
};

DOM.PARSER = function() {	
	var result = {
		UID  : { }, // quick refernce list by UID. All elements have a UID.
		ID   : { }, // quick refernce list by ID
		NAME : { }, // collection reference by name
		TAG  : { }, // collection reference by tagName
		TREE : { }
	};
};

// INTERFACE (attr change)

PARSER = {};
PARSER.DTD = function() {
};


module.exports = DOM;