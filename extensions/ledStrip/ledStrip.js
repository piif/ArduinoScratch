// basic example, see http://scratch.mit.edu/projects/26016195/#editor
// and load this file in browser with :
// ScratchExtensions.loadExternalJS("http://localhost:8000/extensions/basic.websock.js")
// after having launched "node server.js"

var mode = /.*\?(\w*)$/.exec(MY_URL);
if (!mode || mode[1] == "") {
	mode = "websock";
} else {
	mode = mode[1];
}
var deps = {};
deps[mode + "Gateway"] = "/extensions/lib/" + mode + "Gateway.js";

declareModule("ledStrip", deps, function(moduleName) {

	// make accessible from outside, for debug
	ledStripExtension = new (function() {
		var ext = this;
	
		var gateway = new Gateway("ledStrip");
		ext.gateway = gateway;
		var stripLen = -1;

		gateway.initialize(function () {
			console.info("gateway init");
			gateway.registerReceive(handleData);
		});

		ext.initStrip = function(len) {
			if (!gateway.ready()) {
				return;
			}
			stripLen = len;
			gateway.send("i" + len + "\n");
		};

		// scratch doesn't handle lists as argument
		// but if we do it, it convert the list to a string by joining elements, separated by " "
		ext.setStripColors = function(str) {
			// => just split it to retrieve the list (at least if it contains numbers)
			var colors = str.split(" ");
			// force them to integer
			colors = colors.map(function(x) {
				var r = parseInt(x);
				return isNaN(x)?0:r;
			});
			// and truncate / pad with 0 to have the wanted size
			if (colors.length > stripLen) {
				colors = colors.slice(0, stripLen);
			} else {
				while(colors.length < stripLen) {
					colors.append(0);
				}
			}
			gateway.send("c" + colors.join(',') + "\n");
		};

		ext.setStripLight = function(light) {
			gateway.send("l" + light + "\n");
		};

		ext.setStripOff = function() {
			gateway.send("z\n");
		};

		ext.setStripAll = function(color) {
			gateway.send("a" + color + "\n");
		};

		// serial dialog methods
		function handleData(rawData) {
			// nothing to handle.
		}

		// Status reporting code
		// Use this to report missing hardware, plugin or unsupported browser
		// Value / status light Color / Meaning
		// 0 	red 	error
		// 1 	yellow 	not ready
		// 2 	green 	ready
		ext._getStatus = function() {
			if(gateway.ready()) {
				return {status: 2, msg: 'Ready'};
			} else {
				return {status: 1, msg: 'Not ready'};
			}
		}

		// Block and block menu descriptions
		var descriptor = {
			// each block begins by a Op Code :
			// 	' ' (space)	Synchronous command
			// 'w' 	Asynchronous command
			// 'r' 	Synchronous reporter
			// 'R' 	Asynchronous reporter
			// 'h' 	Hat block (synchronous, returns boolean, true = run stack)
			// then, a description with arguments marked by %... : %n for number, %s for string, and %m.menuName for menu
			blocks: [
				['', 'declare %n lights', 'initStrip', '10'],
				['', 'switch off', 'setStripOff'],
				['', 'set all to color %n', 'setStripAll', 80],
				['', 'set colors to %s', 'setStripColors', '0'],
				['', 'set light to %n', 'setStripLight', '100']
			]
		};
	
		// Register the extension
		ScratchExtensions.unregister('led strip extension');
		ScratchExtensions.register('led strip extension', descriptor, ext);
	})();
	moduleExport(ledStripExtension, "ledStripExtension");
});