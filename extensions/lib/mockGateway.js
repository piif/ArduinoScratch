declareModule("mockGateway", {}, function(moduleName) {

	Gateway = function(extensionName) {
		var that = this;
		this.name = extensionName;
	
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
	};
	moduleExport(Gateway, "Gateway");
});