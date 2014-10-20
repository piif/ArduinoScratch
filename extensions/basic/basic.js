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

declareModule("basic", deps, function(moduleName) {

	//make accessible from outside, for debug
	basicExtension = new (function() {
		var ext = this;
	
		var gateway = new Gateway("basic");
		var status = {
			led: "off",
			buttonPressed: false
		};
		// make accessible from outside, for debug
		ext._myData = {
			status : status,
			gateway : gateway
		};
	
		gateway.initialize(function () {
			console.info("gateway init");
			gateway.registerReceive(handleData);
		});
	
		ext.getLed = function() {
			if (gateway.ready()) {
				return status.led;
			} else {
				return "???";
			}
		};
	
		ext.setLed = function(what) {
			if (!gateway.ready()) {
				return;
			}
			status.led = what;
			gateway.send(what === "on" ? 1 : 0);
		};
	
		ext.toggleLed = function() {
			ext.setLed(status.led === "on" ? "off" : "on");
		};
	
		ext.onButton = function() {
			if (!gateway.ready()) {
				return false;;
			}
		
			if (status.buttonPressed === true) {
				status.buttonPressed = false;
				return true;
			} else {
				return false;
			}
		};
	
		// serial dialog methods
		function handleData(rawData) {
			for(i = 0; i < rawData.length; i++) {
				switch (rawData[i]) {
				case '\n':
				case '\r':
					break;
				case '.': 
					// ping => ok
					clearWatchDog();
					break;
				case '!':
					status.buttonPressed = true;
					break;
				case '0':
					status.led = "off";
					break;
				case '1':
					status.led = "on";
					break;
				default:
					console.log("bad char '" + rawData[i] + "' ?");
				}
			}
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
				['', 'set led %m.led', 'setLed', 'on'],
				['', 'toggle led state', 'toggleLed'],
				['r', 'led state', 'getLed'],
				['h', 'when button is pressed', 'onButton'],
			],
			menus: {
				led: ['on', 'off']
			}
		};
	
		// Register the extension
		ScratchExtensions.unregister('My first arduino extension');
		ScratchExtensions.register('My first arduino extension', descriptor, ext);
	})();
	moduleExport(basicExtension, "basicExtension");
});