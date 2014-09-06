// basic example, see http://scratch.mit.edu/projects/26016195/#editor
// and load this file in browser with :
// ScratchExtensions.loadExternalJS("http://localhost/scratch/extension/hsv2rgb.js")


// TODO : put this code in a external lib
// => how to load it ?
function Gateway() {
	var that = this;
	this.initialize = function (readyCallback) {
		var result = true;
		if (readyCallback) {
			result = readyCallback(this);
		}
		this._ready = true;
		return result;
	};

	this.ready = function () {
		return this._ready;
	};

	this.send = function (data) {
		console.info(">>> " + data)
	};

	this.registerReceive = function (dataCallback) {
		this._dataCallback = dataCallback;
	};

	// simulate data receive
	this.recv = function (data) {
		if (that._dataCallback) {
			that._dataCallback(data);
		}
	};
	DoInput = this.recv;

	this._dataCallback = null;
	this._ready = false;
}

//make accessible from outside, for debug
myExtension = new (function() {
	var ext = this;

	var gateway = new Gateway();
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
				console.Log("bad char '" + rawData[i] + "' ?");
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
