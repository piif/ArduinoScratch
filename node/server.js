var path = require('path'),
	fs = require('fs'),
	url = require('url'),
	SerialPort = require('serialport').SerialPort;

var ROOT = path.dirname(__dirname);
console.log(ROOT);

var HTTP_PORT = 8000,
	HTTP_HOST = "localhost",
	HTTP_ROOT = "http://" + HTTP_HOST + ":" + HTTP_PORT + "/";

// initialize serialport
// remember to change this string if your arduino is using a different serial
// port
var sp = new SerialPort('/dev/ttyACM0', {
	baudRate : 115200
});

// this var will contain the message string dispatched by arduino
var arduinoMessage = '';
	
/**
 * helper function to load any app file required by client.html
 * 
 * @param {
 *            String } pathname: path of the file requested to the nodejs server
 * @param {
 *            Object } res:
 *            http://nodejs.org/api/http.html#http_class_http_serverresponse
 */
var readFile = function(pathname, res) {
	// an empty path returns client.html
	if (pathname.substring(0, 12) !== "/extensions/") {
		res.writeHead(404);
		return res.end('not found');
	}

	fs.readFile(ROOT + "/extensions/lib/autoPrepend.js", function(err, prepend) {
		if (err) {
			console.log(err);
			res.writeHead(500);
			return res.end('Error loading auto prepend file');
		}
		fs.readFile(ROOT + pathname, function(err, data) {
			if (err) {
				console.log(err);
				res.writeHead(500);
				return res.end('Error loading file');
			}
			res.writeHead(200);
			data = prepend.toString() + data.toString();
			//.replace(/<<<THISURL>>>/g, HTTP_ROOT);
			res.end(data);
		});
	});
};
	
/**
 * 
 * This function is used as proxy to print the arduino messages into the nodejs
 * console and on the page
 * 
 * @param {
 *            Buffer } buffer: buffer data sent via serialport
 * @param {
 *            Object } socket: it's the socket.io instance managing the
 *            connections with the client.html page
 * 
 */
var sendMessage = function(buffer, socket) {
	console.log("<<< " + buffer);
	// concatenating the string buffers sent via usb port
	arduinoMessage += buffer.toString();

	// detecting the end of the string
	if (arduinoMessage.indexOf('\r') >= 0) {
		// log the message into the terminal
		// console.log(arduinoMessage);
		// send the message to the client
		socket.volatile.emit('from_arduino', arduinoMessage);
		// reset the output string to an empty value
		arduinoMessage = '';
	}
};

//server handler
var app = require('http').createServer(
	function handler(req, res) {
		readFile(url.parse(req.url).pathname, res);
	});
var io = require('socket.io').listen(app);

// creating a new websocket
io.sockets.on('connection', function(socket) {
	// listen all the serial port messages sent from arduino and passing them to
	// the proxy function sendMessage
	sp.on('data', function(data) {
		sendMessage(data, socket);
	});
	// listen all the websocket "lightStatus" messages coming from the
	// client.html page
	socket.on('to_arduino', function(data) {
		console.log(">>> " + data);
		sp.write(data + '\r', function() {
			// log the light status into the terminal
		});
	});
});

// just some debug listeners
sp.on('close', function(err) {
	console.log('Port closed!');
});

sp.on('error', function(err) {
	console.error('error', err);
});

sp.on('open', function() {
	console.log('Port opened!');
});

// L3T'S R0CK!!!
// creating the server ( localhost:8000 )
app.listen(HTTP_PORT);
