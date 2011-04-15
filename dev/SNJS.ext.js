var extToCTYPE = function (ext) { // TEMPRORY FUNCTION;
	var EXT = ext.toUpperCase()|| "NON" ;
	var CTYPE = { 
		// BINARY
		BIN  : "application/octet-stream",
		// TEXT
		TXT  : "text/plain",
		HTML : "text/html",		HTM : "text/html",
		CSS  : "text/css",
		// IMAGES
		JPEG : "image/jpeg",	JPG : "image/jpeg",		JPE: "image/jpeg",
		ICO	 : "image/x-icon",	SVG : "image/svg+xml",
		PNG  : "image/png",
		GIF  : "image/gif",
		BMP  : "image/bmp",
		// VIDEOS
		AVI  : "video/x-msvideo",
		MP4	 : "video/mp4",
		WEBM : "video/webm",
		// AUDIOS
		MP3  : "audio/mpeg",
		WAV  : "audio/x-wav",

		// APPLICATIONS
		JS	 : "application/x-javascript",
		ZIP  : "application/zip",
		SWF  : "application/x-shockwave-flash",

		// DEFAULT
		_NON  : "application/octet-stream"		
	};

	return CTYPE[EXT] || CTYPE[_NON];
};

module.exports = extToCTYPE;