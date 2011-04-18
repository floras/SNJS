var SNJS = require("./dev");
SNJS.VER();
var result = SNJS(__dirname + "/demo/demo.snjs.html");
console.log(result.PARSED);