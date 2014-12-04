// parsing of code from scratch json to ast

function parseStatementList(list) {
	if (list == null) {
		return [];
	}
	var result = [];
	for(var i = 0; i < list.length; i++) {
		result.push(parseBlock(list[i], "stmt"));
	}
	return result;
}

// test if observed block type is expected one
function assertType(expected, observed) {
	if (typeof expected === "undefined" || typeof observed === "undefined") {
		// can't verify
		return undefined;
	}
	if (expected === "*" || observed === "*") {
		// can't verify
		return undefined;
	}
	if (expected === observed) {
		return true;
	}
	switch(expected) {
	case "sprite":
	case "costume":
	case "sound":
	case "key":
	case "message":
	case "var":
		// special values, received as strings
		if (observed === "s") {
			return true;
		}
	}
	if (expected === "s" && observed === "n") {
		// need cast
		return "(s)n";
	}
	throw new Error(expected + " expected, not a " + observed);
}

//list of parsed extensions
var extensions = {};

function parseExtensions(extensionSpecs, extensionsOutput) {
	for(var i = 0; i < extensionSpecs.length; i++) {
		var ext = extensionSpecs[i];
		var menus = {};
		for(var m in ext.menus) {
			if (!ext.menus.hasOwnProperty(m)) {
				continue;
			}
			menus[m] = ext.menus[m]; //.join('|');
		}
		var entries = {};
		for(var j = 0; j < ext.blockSpecs.length; j++) {
			// ext.blockSpecs[j] = ["", "proto", "public name", default params ...]
			var spec = ext.blockSpecs[j];
			entries[spec[2]] = { params: parsePrototype(spec[1], menus) };
		}
		extensions[ext.extensionName] =
			extensionsOutput[ext.extensionName] =
			{ menus: menus, entries: entries };
	}
}

function isHat(entry) {
	return statements.hasOwnProperty(entry) && statements[entry].hasOwnProperty("kind");
}

// parse any block type
function parseBlock(script, expectedType) {
	var result = {};
	if (typeof(script[0]) === "object") {
		// hat block => head is an array
		assertType(expectedType, "hat");
		result.kind = script[0][0];
	} else {
		// other => head is a string.
		result.kind = script[0];
	}
	if (statements.hasOwnProperty(result.kind)) {
		result.dict = statements[result.kind];
		assertType(expectedType === "hat" ? "stmt" : expectedType, "stmt");
	} else if (expressions.hasOwnProperty(result.kind)) {
		result.dict = expressions[result.kind];
		assertType(expectedType, result.dict.result);
	} else {
		var p = result.kind.indexOf('.');
		if (p !== -1 && extensions.hasOwnProperty(result.kind.substring(0, p))) {
			result.extension = result.kind.substring(0, p);
			result.method = result.kind.substring(p +1);
			result.kind = "extension call";
			result.dict = extensions[result.extension].entries[result.method];
		} else {
			throw new Error("Unknown block " + result.kind +  " in " + script[0]);
		}
	}

	if (result.dict.hasOwnProperty("kind")) {
		// hat => followed by blocks instead of 1 block list
		result.content = parseStatementList(script.slice(1));
		result.params = expandParams(result.dict.params, script[0].slice(1));
	} else {
		try {
			if (result.kind === "call") {
				result.params = [ script[1] ].concat(expandParams(parsePrototype(script[1]), script.slice(2)));
			} else {
				var params;
				if (result.dict.hasOwnProperty("params")) {
					params = result.dict.params;
				} else {
					params = [];
				}
				result.params = expandParams(params, script.slice(1));
			}
		} catch(e) {
			throw new Error("Parse error in block " + script + ": " + e);
		}
	}
	return result;
}

function parsePrototype(proto, menus) {
	var result = [];
	// split on '%' after first one => each item of returned array
	// begins with the letter following a '%'
	var argTypes = proto.substring(proto.indexOf('%')+1).split('%');
	for (var p = 0; p < argTypes.length; p++) {
		switch(argTypes[p][0]) {
		// %b	Boolean slot
		case "b":
			result.push("b");
			break;
		// %c	Color slot
		case "c":
			result.push("color");
			break;
		// %n	Numeric slot
		// %d.‹menu›	Numeric slot with menu
		case "n":
		case "d":
			result.push("n");
			break;
		// %s	String slot
		// %m.‹menu›	Readonly slot with menu
		case "s":
			result.push("s");
			break;
		case "m":
			if (menus) {
				var m = /m\.(\w+)/.exec(argTypes[p])[1];
				result.push(menus[m]);
			} else {
				result.push("s");
			}
			break;
		}
	}
	return result;
}

function expandParams(paramDesc, paramValues) {
	if (typeof paramDesc === "undefined") {
		paramDesc = [];
	}
	var result = [];
	if (paramDesc !== "*" && paramDesc.length != paramValues.length) {
		throw new Error("Bad param count (" + paramValues.length + " instead of " + paramDesc.length + ")");
	}
	for (var i = 0; i < paramValues.length; i++) {
		var d = (paramDesc === "*") ? "*" : paramDesc[i], v = paramValues[i];
		switch(d) {
		case "*": // anything => let as is.
			if (typeof v === "object") {
				result.push(parseBlock(v, "*"));
			} else {
				result.push(v);
			}
			break;
		case "n": // parse number
			if (typeof v === "number") {
				result.push(v);
			} else if (typeof v === "string") {
				if (parseInt(v).toString() === v) {
					result.push(parseInt(v));
				} else if (parseFloat(v).toString() === v) {
					result.push(parseFloat(v));
				} else {
					throw new Error("Can't parse " + typeof(v) + " '" + v + "' as " + d);
				}
			} else if (typeof v === "object") {
				result.push(parseBlock(v, d));
			} else {
				throw new Error("Can't parse " + typeof(v) + " '" + v + "' as " + d);
			}
			break;
		case "s": // parse string
		case "costume":
		case "sound":
		case "key":
		case "effect":
		case "message":
			if (typeof v === "string") {
				result.push('"' + v + '"');
			} else if (typeof v === "object") {
				result.push(parseBlock(v, d));
			} else {
				throw new Error("Can't parse " + typeof(v) + " '" + v + "' as " + d);
			}
			break;
		case "sprite":
			result.push("sprite_" + v);
			break;
		case "var":
			result.push(v);
			break;
		case "b": // parse boolean
			if (typeof v === "boolean") {
				result.push(v);
			} else if (typeof v === "object") {
				result.push(parseBlock(v, d));
			} else {
				throw new Error("Can't parse " + typeof(v) + " '" + v + "' as " + d);
			}
			break;
		case "stmts": // parse statement list
			if (typeof v === "object") {
				result.push(parseStatementList(v));
			} else {
				throw new Error("Can't parse " + typeof(v) + " '" + v + "' as " + d);
			}
			break;
		case "L(s)":
		case "L(*)":
			if (typeof v === "object") {
				result.push(v);
			} else {
				throw new Error("Can't parse " + typeof(v) + " '" + v + "' as " + d);
			}
			break;
		default:
			if (typeof d === "object" && typeof v === "string" && d.indexOf(v) !== -1) {
				result.push(d.indexOf(v) + " /* " + v + " */");
			} else if (/\|/.test(d)) {
				var choices = d.split('|');
				var specialChoice = null;
				switch(choices[0]) {
				case "sprite":
				case "costume":
				case "sound":
				case "key":
				case "effect":
				case "message":
				case "var":
				case "n":
					specialChoice = choices.shift();
				}
				if (typeof v === "string" && choices.indexOf(v) !== -1) {
					result.push(v);
				} else if (specialChoice === "n") {
					if (typeof v === "number") {
						result.push(v);
					} else if (typeof v === "string") {
						if (parseInt(v).toString() === v) {
							result.push(parseInt(v));
						} else if (parseFloat(v).toString() === v) {
							result.push(parseFloat(v));
						} else {
							throw new Error("Can't parse " + typeof(v) + " '" + v + "' as " + d);
						}
					} else if (typeof v === "object") {
						result.push(parseBlock(v, "n"));
					}
				} else if (specialChoice !== null) {
					if (typeof v === "string") {
						result.push(v);
					}
				} else if (typeof v === "object") {
					result.push(parseBlock(v, "s"));
				} else {
					throw new Error("Can't parse " + typeof(v) + " '" + v + "' as " + d);
				}
			} else {
				throw new Error("Can't parse " + d + " ??");
			}
		}
	}
	return result;
}

var effects = "color|fisheye|whirl|pixelate|mosaic|brightness|ghost";

var statements = {
	"forward:": { "params": [ "n" ] },
	"turnRight:": { "params": [ "n" ] },
	"turnLeft:": { "params": [ "n" ] },
	"heading:": { "params": [ "n" ] },
	"pointTowards:": { "params": [ "sprite|_mouse_" ] },
	"gotoX:y:": { "params": [ "n", "n" ] },
	"gotoSpriteOrMouse:": { "params": [ "sprite|_mouse_" ] },
	"glideSecs:toX:y:elapsed:from:": { "params": [ "n", "n", "n" ] },
	"changeXposBy:": { "params": [ "n" ] },
	"xpos:": { "params": [ "n" ] },
	"changeYposBy:": { "params": [ "n" ] },
	"ypos:": { "params": [ "n" ] },
	"bounceOffEdge": {},
	"setRotationStyle": { "params": [ "left-right|don't rotate|all around"] },

	"say:duration:elapsed:from:": { "params": [ "s", "n" ] },
	"say:": { "params": [ "s" ] },
	"think:duration:elapsed:from:": { "params": [ "s", "n" ] },
	"think:": { "params": [ "s" ] },
	"show": {},
	"hide": {},
	"lookLike:": { "params": [ "costume" ] },
	"nextCostume": {},
	"startScene": { "params": [ "costume" ] },
	"changeGraphicEffect:by:": { "params": [ effects, "n" ]},
	"setGraphicEffect:to:": { "params": [ effects, "n" ]},
	"filterReset": {},
	"changeSizeBy:": { "params": [ "n" ] },
	"setSizeTo:": { "params": [ "n" ] },
	"comeToFront": {},
	"goBackByLayers:": { "params": [ "n" ] },

	"playSound:": { "params": [ "sound" ] },
	"doPlaySoundAndWait": { "params": [ "sound" ] },
	"stopAllSounds": {},
	"playDrum": { "params": [ "n", "n" ] },
	"rest:elapsed:from:": { "params": [ "n" ] },
	"noteOn:duration:elapsed:from:": { "params": [ "n", "n" ] },
	"instrument:": { "params": [ "n" ] },
	"changeVolumeBy:": { "params": [ "n" ] },
	"setVolumeTo:": { "params": [ "n" ] },
	"changeTempoBy:": { "params": [ "n" ] },
	"setTempoTo:": { "params": [ "n" ] },
	
	"clearPenTrails": {},
	"stampCostume": {},
	"putPenDown": {},
	"putPenUp": {},
	"penColor:": { "params": [ "n" ] },
	"changePenHueBy:": { "params": [ "n" ] },
	"setPenHueTo:": { "params": [ "n" ] },
	"changePenShadeBy:": { "params": [ "n" ] },
	"setPenShadeTo:": { "params": [ "n" ] },
	"changePenSizeBy:": { "params": [ "n" ] },
	"penSize:": { "params": [ "n" ] },
				
	"whenGreenFlag": { "kind": "event" },
	"whenKeyPressed": { "kind": "event", "params": [ "key" ] },
	"whenClicked": { "kind": "event" },
	"whenSceneStarts": { "kind": "event", "params": [ "costume" ] },
	"whenSensorGreaterThan" : { "kind": "event", "params": [ "loudness|timer|videomotion", "n" ] },
	"whenIReceive": { "kind": "event", "params": [ "message" ] },
	"whenCloned": { "kind": "event" },

	"broadcast:": { "params": [ "message" ] },
	"doBroadcastAndWait": { "params": [ "message" ] },

	"wait:elapsed:from:": { "params": [ "n" ] },
	"doRepeat": { "params": [ "n", "stmts" ] },
	"doIf": { "params": [ "b", "stmts" ] },
	"doIfElse": { "params": [ "b", "stmts", "stmts" ] },
	"doWaitUntil": { "params": [ "b" ] },
	"doUntil": { "params": [ "b", "stmts" ] },
	"doForever": { "params": [ "stmts" ] },
	"stopScripts": { "params": [ "all|other scripts in sprite|this script" ] },

	"createCloneOf": { "params": [ "sprite|_myself_" ] },
	"deleteClone": {},

	"doAsk": {},
	"setVideoState": { "params": [ "on|off|on-flipped" ] },
	"setVideoTransparency": { "params": [ "n" ] },
	"timerReset": {},

	"procDef": { "kind": "procDef", "params": [ "s", "L(s)", "L(*)", "b" ] },
	"call": { "params": "*" },

    "setVar:to:": { "params": [ "var", "*" ] },
    "changeVar:by:": { "params": [ "var", "n" ] },
    "showVariable:": { "params": [ "var" ] },
    "hideVariable:": { "params": [ "var" ] },
	"append:toList:": { "params": [ "n", "var" ] },
    "deleteLine:ofList:": { "params": [ "n|last|all", "var" ] },
    "insert:at:ofList:": { "params": [ "n", "n|last|random", "var" ] },
    "setLine:ofList:to:": { "params": [ "n|last", "var", "n" ] },
    "showList:": { "params": [ "var" ] },
    "hideList:": { "params": [ "var" ] }
};

var expressions = {
	"readVariable": { "params": [ "var" ], result: "*" },
	"getParam": { "params": [ "var", "s" ], result: "*" },
	"contentsOfList:": { "params": [ "var" ], result: "*" },
	"list:contains:": { "params": [ "var", "n" ], "result": "b" },
	"getLine:ofList:": { "params": [ "n|last", "var" ], result: "*" },
	"lineCountOfList:": { "params": [ "var" ], "result": "n" },

	"xpos": { "result": "n" },
	"ypos": { "result": "n" },
	"heading": { "result": "n" },

	"costumeIndex": { "result": "n" },
	"sceneName": { "result": "s" },
	"scale": { "result": "n" },

	"volume": { "result": "n" },
	"tempo": { "result": "n" },

	"getUserName": { "result": "s" },

	"mouseX": { "result": "n" },
	"mouseY": { "result": "n" },
	"soundLevel": { "result": "n" },
	"timer": { "result": "n" },

	"&": { "params": [ "b", "b" ], "result": "b" },
	"|": { "params": [ "b", "b" ], "result": "b" },
	"not": { "params": [ "b" ], "result": "b" },

	"*": { "params": [ "n", "n" ], "result": "n" },
	"/": { "params": [ "n", "n" ], "result": "n" },
	"+": { "params": [ "n", "n" ], "result": "n" },
	"-": { "params": [ "n", "n" ], "result": "n" },
	"%": { "params": [ "n", "n" ], "result": "n" },

	"<": { "params": [ "n", "n" ], "result": "b" },
	"=": { "params": [ "n", "n" ], "result": "b" },
	">": { "params": [ "n", "n" ], "result": "b" },

	"randomFrom:to:": { "params": [ "n", "n" ], "result": "n" },

	"concatenate:with:": { "params": [ "s", "s" ], "result": "s" },
	"letter:of:": { "params": [ "n", "s" ], "result": "s" },
	"stringLength:": { "params": [ "s" ], "result": "n" },
	"rounded": { "params": [ "n" ], "result": "n" },
	"computeFunction:of:": { "params": [ "sqrt|abs|sin|cos|tan|asin|acos|atan|e^|10^|ln|log|floor|ceiling", "n"], "result": "n" },

	"touching:": { "params": [ "sprite|_mouse_" ], "result": "b" },
	"distanceTo:": { "params": [ "sprite|_mouse_" ], "result": "n" },
	"touchingColor:": { "params": [ "color" ], "result": "b" },
	"color:sees:": { "params": [ "color", "color" ], "result": "b" },
	"keyPressed:": { "params": [ "key" ], "result": "b" },
	"mousePressed": { "result": "b" },
	"senseVideoMotion": { "params": [ "motion|direction", "sprite" ] },
	"timeAndDate": { "params": [ "year|month|date|day of week|hour|minute|second" ], "result": "n" },
	"timestamp": { "result": "n"},
	"getAttribute:of:": {
		"params": [ "x position|y position|direction|costume|background|size|volume|variable", "sprite" ],
		"result": "n"
	}
};

exports.isHat = isHat;
exports.parseBlock = parseBlock;
exports.parseExtensions = parseExtensions;
