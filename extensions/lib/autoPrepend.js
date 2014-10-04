var MY_URL, ROOT_URL;

if (typeof MY_URL === "undefined") {
	MY_URL = (new Error()).fileName;
	ROOT_URL = /^(https?:\/\/[^\/]*).*$/.exec(MY_URL)[1] + "/";
}

(function(window) {

	if (typeof window._modules !== "undefined") {
		return;
	}

	var _modules = {};
	window._modules = _modules;

	var doLoadExternalCallback = function(name) {
		var details = _modules[name];
		if (!details) {
			console.error("unexpected moduleLoaded call " + name);
			return;
		}
		// if this name has no more pending child, call its callback
		if (_modules[name].children.length == 0) {
			moduleLoaded(name);
		}
		// else, do nothing, last dependent will do the job
	};

	var moduleLoaded = function(name) {
		console.log("moduleLoaded " + name);
		var details = _modules[name];
		if (!details) {
			console.error("unexpected moduleLoaded call " + name);
			return;
		}
		if (details.content) {
			details.content(name);
		}
		details.loaded = true;
		console.log("moduleLoaded ok");
		// and verify if it's not itself a dependent of another
		for (var m in _modules) {
			if (_modules.hasOwnProperty(m)) {
				var extEntry = _modules[m].children;
				var i = extEntry.indexOf(name);
				if (i != -1) {
					extEntry.splice(i);
					if (extEntry.length === 0) {
						console.log("=> moduleLoaded " + m);
						moduleLoaded(m);
					}
				}
			}
		}
	};
	
	window.moduleExport = function(obj, name) {
		window[name] = obj;
	};

	window.declareModule = function declareModule(name, dependents, content) {
		// url of called server

		console.log("declareModule " + name);
		if (!_modules.hasOwnProperty(name)) {
			_modules[name] = {
				loaded: false,
				children: []
			};
		}
		var deps = [];
		for (var n in dependents) {
			if (!dependents.hasOwnProperty(n)) {
				continue;
			}
			var url = dependents[n];
			if (url.charAt(0) === '/') {
				url = ROOT_URL + url.substring(1);
			} 
			if (!loadModule(n, url)) {
				deps.push(n);
			}
		}
		_modules[name].content = content;
		_modules[name].children = deps;
	}

	// simple function to load a js file
	var loadModule = function(name, url) {
		console.log("loadModule " + name);
		if (_modules.hasOwnProperty(name)) {
			return _modules[name].loaded;
		}
		_modules[name] = {
			loaded: false,
			children: []
		};

		var t = document.createElement("script");
		t.src = url;
		t.onload = function() {
			doLoadExternalCallback(name);
		}
		document.getElementsByTagName("head")[0].appendChild(t);
		return false;
	};

})(window);