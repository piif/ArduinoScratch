declareModule(
		"websockGateway", {
			"socketio": "/socket.io/socket.io.js"
		}, function(moduleName) {

	Gateway = function(extensionName) {
		var that = this;
		var socket;

		this.name = extensionName;
	
		this.onSocketNotification = function(data) {
			if (that._dataCallback) {
				console.log("<<< " + data);
				that._dataCallback(data);
			}
		};
	
		this.initialize = function (readyCallback) {
			var result;
			socket = io.connect(ROOT_URL);
			socket.on('from_arduino', this.onSocketNotification);
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
			console.log(">>> " + data);
			socket.emit('to_arduino', data);
		};
	
		this.registerReceive = function (dataCallback) {
			this._dataCallback = dataCallback;
		};
	
		this._dataCallback = null;
		this._ready = false;
	}
	moduleExport(Gateway, "Gateway");
});