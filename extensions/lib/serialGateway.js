// TODO !

// See http://llk.github.io/scratch-extension-docs/
// + install http://cdn.scratch.mit.edu/scratchr2/static/__172524edbffb65446b8d280ce8bcec1a__//ext/ScratchDevicePlugin.msi

var myExtension;

new (function() {
	var ext = this;
	// Currently connected serial device. Undefined if nothing connected. First connected is used.

	// current state of arduino when connected
	var status = {
		led: null,
		buttonPressed: null
	};

	myExtension = {
		status: status,
		device: null
	}

	ext.getLed = function() {
		if (myExtension.device !== null && status.led !== null) {
			return status.led;
		} else {
			return "???";
		}
	};

	ext.ifLed = function(what) {
		if (myExtension.device !== null && status.led !== null) {
			return what === status.led;
		} else {
			return false;
		}
	};

	var ON = new Uint8Array(1), OFF = new Uint8Array(1);
	ON[0] = '1';
	OFF[0] = '0';

	ext.setLed = function(what) {
		if (myExtension.device === null) {
			return;
		}
		myExtension.device.send(what === "on" ? ON : OFF);
	};

	ext.onButton = function() {
		if (myExtension.device === null) {
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
	function handleData(/*uint8=char ?*/ c) {
		if (c == '.') {
			// ping => ok
			clearWatchDog();
		} else if (c == '!') {
			status.buttonPressed = true;
		} else if (c == '0' || c == '1') {
			status.led = c;
		} else {
			console.Log("bad char '" + c + "' ?");
		}
	}

	// Extension API interactions
	// each time a device is connected, it's added to this list
	var potentialDevices = [];
	// callback on device connection
	ext._deviceConnected = function(dev) {
		// add it to list
		potentialDevices.push(dev);

		// and make it current one if none currently affected
		if (!myExtension.device) {
			tryNextDevice();
		}
	}

	var poller = null;
	var watchdog = null;

	function tryNextDevice() {
		// If potentialDevices is empty, device will be undefined.
		// That will get us back here next time a device is connected.
		myExtension.device = potentialDevices.shift();
		if (!myExtension.device) return;

		myExtension.device.open({ stopBits: 0, bitRate: 115200, ctsFlowControl: 0 });
		// register a callback for received data
		myExtension.device.set_receive_handler(function(data) {
			rawData = new Uint8Array(data);
			// for the moment, we handle received data byte per byte
			// later, will have to handle fixed len or length-data buffers
			for(i = 0; i < rawData.length; i++) {
				if (rawData[i] === '\n') {
					continue;
				}
				handleData(rawData[i]);
			}
			console.log('Received: ' + data.byteLength + " : " + data);
		});

		var pingCmd = new Uint8Array(1);
		pingCmd[0] = '?';
		poller = setInterval(function() {
			myExtension.device.send(pingCmd.buffer);
		}, 100);
		watchdog = setTimeout(function() {
			// This device didn't get good data in time, so give up on it. Clean up and then move on.
			// If we get good data then we'll terminate this watchdog.
			clearInterval(poller);
			poller = null;
			myExtension.device.set_receive_handler(null);
			myExtension.device.close();
			myExtension.device = null;
			tryNextDevice();
		}, 500);
	}

	// user may call this method when he verified that connected device is of good type
	function clearWatchDog() {
	    if (watchdog) {
            clearTimeout(watchdog);
            watchdog = null;
        }
	}

	// callback when a device is disconnected
	ext._deviceRemoved = function(dev) {
		if(myExtension.device != dev) return;
		if(poller) poller = clearInterval(poller);
		myExtension.device = null;
		// TODO : Should call ? tryNextDevice();
	};

	// Cleanup function when the extension is unloaded
	ext._shutdown = function() {
		if(myExtension.device) myExtension.device.close();
		if(poller) poller = clearInterval(poller);
		myExtension.device = null;
	};
	
	// Status reporting code
	// Use this to report missing hardware, plugin or unsupported browser
	// Value / status light Color / Meaning
	// 0 	red 	error
	// 1 	yellow 	not ready
	// 2 	green 	ready
	ext._getStatus = function() {
		if(!myExtension.device) return {status: 1, msg: 'Arduino disconnected'};
		if(watchdog) return {status: 1, msg: 'Probing for Arduino'};
		return {status: 2, msg: 'Arduino connected'};
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
			['r', 'led state', 'getLed'],
			['r', 'if led is %m.led', 'ifLed', 'on'],
			['h', 'when button is pressed', 'onButton'],
		],
		menus: {
			led: ['on', 'off']
		}
	};

	// Register the extension
	ScratchExtensions.register('My first extension', descriptor, ext, {type: 'serial'});
})();
