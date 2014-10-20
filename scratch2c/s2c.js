var path = require('path'),
	fs = require('fs'),
	Promise = require('promise'),
	url = require('url'),
	dictionnary = require("./blocks.js"),
	C = require("./C.js");

// config file & content
var configFileName, config;
// source reference & content
var sourceReference, source;
//parsed source
var ast = {
	"variables" : [],
	"sprites" : [],
};

// result
var output;

function help() {
	console.log("Usage : " + process.argv[0] + process.argv[1] + " configFileName [ projectIdOrFileName ]");
	console.log(" Tries to generate a C++ code for given scratch project, with config as reference");
	console.log(" Project source may be specified in command line or in config file");
	process.exit();
}

function parseArgs() {
	var argv = process.argv.slice(2);
	if (argv.length == 0 || argv.length > 2) {
		help();
	}
	configFileName = argv[0];
	if (argv.length == 2) {
		sourceReference = argv[1];
	}
}

function loadConfig(resolve, reject) {
	console.log("loadConfig " + configFileName);
	fs.readFile(configFileName, function(err, data) {
		if (err) {
			reject("config load failed : " + err);
		} else {
			config = JSON.parse(data);
			resolve(config);
		}
	});
}

function loadSource(resolve, reject) {
	if (typeof sourceReference === "undefined") {
		if (config.hasOwnProperty("project")) {
			sourceReference = config.project;
		} else {
			reject("project reference not specified");
		}
	}
	console.log("loadSource " + sourceReference);
	if (typeof sourceReference === "number") {
		http.get("http://projects.scratch.mit.edu/internalapi/project/" + sourceReference + "/get/", function(res) {
			source = JSON.parse(res.content);
			resolve(source);
		}).on('error', function(e) {
			reject("project load failed : " + e.message);
		});
	} else {
		fs.readFile(sourceReference, function(err, data) {
			if (err) {
				reject("project load failed : " + err);
			} else {
				source = JSON.parse(data);
				resolve(source);
			}
		});
	}
}

function parse(resolve, reject) {
	console.log("parse");

	ast.source = sourceReference;
	var i;
	// global items
	// variables
	if (source.hasOwnProperty("variables")) {
		for(i = 0; i < source.variables.length; i++) {
			var v = source.variables[i];
			if (!config.alreadyDefined.variables ||
					config.alreadyDefined.variables.indexOf(v.name) === -1) {
				console.log("V " + v.name);
				ast.variables.push(parseVariable(v.name, v.value, false));
			}
		}
	}
	// lists
	if (source.hasOwnProperty("lists")) {
		for(i = 0; i < source.lists.length; i++) {
			var l = source.lists[i];
			if (!config.alreadyDefined.variables ||
					config.alreadyDefined.variables.indexOf(l.listName) === -1) {
				console.log("L " + l.listName);
				ast.variables.push(parseVariable(l.listName, l.contents, true));
			}
		}
	}
	// sprites
	if (source.hasOwnProperty("children")) {
		for(i = 0; i < source.children.length; i++) {
			if (!source.children[i].hasOwnProperty("objName")) {
				continue;
			}
			var sprite = source.children[i];
			var alreadyDefined = {};
			if (config.alreadyDefined.hasOwnProperty(sprite.objName)) {
				if (config.alreadyDefined[sprite.objName] === true) {
					continue;
				} else {
					alreadyDefined = config.alreadyDefined[sprite.objName];
				}
			}
			console.log("S " + source.children[i].objName);
			var spriteAst = {
				"name": sprite.objName,
				"variables" : [],
				"scripts" : []
			};
			ast.sprites.push(spriteAst);
			// variables
			if (sprite.hasOwnProperty("variables")) {
				for(j = 0; j < sprite.variables.length; j++) {
					var v = sprite.variables[j];
					if (!alreadyDefined.variables || alreadyDefined.variables.indexOf(v.name) === -1) {
						console.log("  v " + v.name);
						spriteAst.variables.push(parseVariable(v.name, v.value, true));
					}
				}
			}
			// lists
			if (sprite.hasOwnProperty("lists")) {
				for(j = 0; j < sprite.lists.length; j++) {
					var l = sprite.lists[j];
					if (!alreadyDefined.variables || alreadyDefined.variables.indexOf(l.listName) === -1) {
						console.log("  l " + sprite.lists[j].listName);
						spriteAst.variables.push(parseVariable(l.listName, l.contents, true));
					}
				}
			}
			// top-level blocks
			if (sprite.hasOwnProperty("scripts")) {
				for(j = 0; j < sprite.scripts.length; j++) {
					var entryPoint = sprite.scripts[j][2][0];
					// only known ones and hats
					if (dictionnary.statements.hasOwnProperty(entryPoint[0])
							&& dictionnary.statements[entryPoint[0]].hasOwnProperty("kind")) {
						console.log("  b " + sprite.scripts[j][2][0][0] + "(" + sprite.scripts[j][2][0].slice(1) + ")");
						spriteAst.scripts.push(dictionnary.parseBlock(sprite.scripts[j][2], "hat"))
					}
				}
				// content
			}
		}
	}
	resolve(ast);
}

function dumpAsC(resolve, reject) {
	var output = C.dump(ast);
	resolve(output);
}

function parseVariable(name, value, isList) {
	return {
//		"kind": (isList ? "list" : typeof(value)),
		"name": name,
		"value": value
	};
}

//parser la ligne de commande
parseArgs();

result = new Promise(loadConfig)
.then(function () { return new Promise(loadSource); })
.then(function () { return new Promise(parse); })
.then(function () { return new Promise(dumpAsC); })
.then(
	function(ok) {
		console.log("ok");
		console.log(ok);
	},function(err) {
		console.log("err");
		if (typeof err === "string") {
			console.log(err);
		} else {
			console.log(err.stack);
		}
		
	}
);

// chargement du config_file
//   id en argument => wget du json
//   fichier => lecture
//   fichier spécifié dans la config, idem
// lire la config des blocks
// parcours du json
// isoler les elements à dumper
// moins ceux à ignorer
