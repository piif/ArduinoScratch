// basic example, see http://scratch.mit.edu/projects/26016195/#editor
// and load this file in browser with :
// ScratchExtensions.loadExternalJS("http://localhost:8000/extensions/basic/basic.js")
// after having launched "node server.js"

// Une extension doit donc commencer par se définir comme un module, qui dépend lui même
// d'autres modules. Il faut notamment dépendre d'un des trois modules
// mockGateway.js, serialGateway.js ou websockGateway.js pour établir la communication.
// Par convention, on choisi ce module en ajoutant ?mock, ?serial ou ?websock en fin d'url
// dans l'appel à ScratchExtensions.loadExternalJS

var mode = /.*\?(\w*)$/.exec(MY_URL);
if (!mode || mode[1] == "") {
	mode = "websock";
} else {
	mode = mode[1];
}
var deps = {};
deps[mode + "Gateway"] = "/extensions/lib/" + mode + "Gateway.js";

// on déclare donc le module avec un nom, des dépendances et un code : 
declareModule("basic", deps, function(moduleName) {

	// le code doit définir l'extension elle même, comme étant une instance d'un objet :
	basicExtension = new (function() {
		var ext = this;

		// "Gateway" est défini avec le même prototype dans les 3 version de *Gateway.js
		var gateway = new Gateway("basic");

		// des données propres à l'extension
		var status = {
			led: "off",
			buttonPressed: false
		};

		// rendre accessible au browser, pour debug
		ext._myData = {
			status : status,
			gateway : gateway
		};

		// on établi la connection via la gateway. Quand cele ci est établie, la
		// fonction passée en argument est appelée
		gateway.initialize(function () {
			console.info("gateway init");
			// on dit à la gateway d'appeler une fonction à réception de données
			gateway.registerReceive(handleData);
		});

		// une fonction qu'on va déclarer comme block "expression" coté scratch
		ext.getLed = function() {
			if (gateway.ready()) {
				return status.led;
			} else {
				return "???";
			}
		};
	
		// une fonction qu'on va déclarer comme block "action" coté scratch
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
	
		// une fonction qu'on va déclarer comme block "chapeau" coté scratch
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
	
		// traiter les données reçues de l'arduino
		function handleData(rawData) {
			for(i = 0; i < rawData.length; i++) {
				switch (rawData[i]) {
				case '\n':
				case '\r':
					break;
//				case '.': 
//					// ping => ok
//					clearWatchDog();
//					break;
				case '!':
					// on note dans un coin qu'on a reçu un "bouton appuyé"
					status.buttonPressed = true;
					// le prochain appel au chapeau le prendra en compte
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
	
		// on termine en enregistrant l'objet extension à Scratch :
		ScratchExtensions.unregister('My first arduino extension');
		ScratchExtensions.register('My first arduino extension', descriptor, ext);
	})();

	// et on expose l'objet au browser, pour pouvoir fouiner dedans en période de debug.
	moduleExport(basicExtension, "basicExtension");
});