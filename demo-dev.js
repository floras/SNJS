var SNJS = require("./dev/SNJS.js");
SNJS.VER();
var result = SNJS(__dirname + "/demo/demo.snjs.html");
console.log(result.PARSED);