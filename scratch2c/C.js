// generation of C code from ast

function isInt(n) {
	return parseInt(n) === n;
}

function normalize(s) {
	if (!s) {
		return "";
	}
	return s.replace(/\W/g, '_');
}

function findTypeOf(x) {
	var r;
	if (typeof x === "object") {
		return { type: "List", subType: findTypeOf(x[0]).type };
	}
	if (typeof x === "string") {
		r = parseInt(x);
		if (r.toString() === x) {
			return { type: "int", value: r };
		}
		r = parseFloat(x);
		if (r.toString() === x) {
			return { type: "float", value: r };
		}
		return {
			type: "string",
			value: '"' + x
				.replace('"', '\\"')
				.replace('\\', '\\\\') + '"'
		};
	}
	if (typeof x === "number") {
		if (parseInt(x) === x) {
			return { type: "int", value: x };
		} else {
			return { type: "float", value: x };
		}
	}
	return { type: "???", value: x };
}

// return NULL terminated "," separated list
function nt(list, terminator) {
	return list.concat(terminator ? terminator : "NULL").join(", ");
}
function declareStatic(name, value, type) {
	return [
		type + " _my_" + name + "[] = { " + value + " };",
		name + " =  _my_" + name + ";"
	];
}

function dumpHats(ast, env, isScene) {
	var output = [];
	var k, e, kList, tList, cbList;

	cbList = [];
	for (k = 0; k < env.hats.whenGreenFlag.length; k++) {
		var entry = env.hats.whenGreenFlag[k];
		cbList.push(entry + "(env);");
	}
	output.push(
		"virtual void whenGreenFlag() {",
			cbList,
		"}"
	);

	cbList = [];
	for (k = 0; k < env.hats.whenClicked.length; k++) {
		var entry = env.hats.whenClicked[k];
		cbList.push(entry + "(env);");
	}
	output.push(
		"virtual void whenClicked() {",
			cbList,
		"}"
	);

	kList = [];
	for (k in env.hats.whenSceneStarts) {
		if (!env.hats.whenSceneStarts.hasOwnProperty(k)) {
			continue;
		}
		var entry = env.hats.whenSceneStarts[k];
		cbList = [];
		for (e = 0; e < entry.length; e++) {
			cbList.push(entry[e] + "(env);");
		}
		kList.push("case " + k + ":", cbList.concat("break;") );
	}
	output.push(
		"virtual void whenSceneStarts(int background) {",
			[].concat("switch(background) {", cbList, "}"),
		"}"
	);

	kList = [];
	for (k in env.hats.whenIReceive) {
		if (!env.hats.whenIReceive.hasOwnProperty(k)) {
			continue;
		}
		var entry = env.hats.whenIReceive[k];
		cbList = [];
		for (e = 0; e < entry.length; e++) {
			cbList.push(entry[e].callback + "(env);");
		}
		kList.push("case " + k + ": // " + entry[0].message, cbList.concat("break;") );
	}
	output.push(
		"virtual void whenIReceive(int message) {",
			[].concat("switch(message) {", kList, "}"),
		"}"
	);

	kList = [];
	for (k in env.hats.whenKeyPressed) {
		if (!env.hats.whenKeyPressed.hasOwnProperty(k)) {
			continue;
		}
		var entry = env.hats.whenKeyPressed[k];
		cbList = [];
		for (e = 0; e < entry.length; e++) {
			cbList.push(entry[e] + "(env);");
		}
		var key;
		switch(k) {
		case '"space"':
			key = "' '";
			break;
		default:
			key = "'" + entry.key[1] + "'";
			break;
		}
		kList.push("case " + key + ":", cbList.concat("break;") );
	}
	output.push(
		"virtual void whenKeyPressed(char key) {",
			[].concat("switch(key) {", kList, "}"),
		"}"
	);

	kList = [];
	for (k in env.hats.whenSensorGreaterThan) {
		if (!env.hats.whenSensorGreaterThan.hasOwnProperty(k)) {
			continue;
		}
		var entry = env.hats.whenSensorGreaterThan[k];
		cbList = [];
		for (e = 0; e < entry.length; e++) {
			cbList.push("if (threshold > " + entry[e].threshold + ") {",
				[ entry[e].callback + "(env, threshold);" ],
			"}");
		}
		kList.push("case " + k + ":", cbList.concat("break;") );
	}
	output.push(
		"virtual void whenSensorGreaterThan(Sensor_t sensor, int threshold) {",
			[].concat("switch(sensor) {", kList, "}"),
		"}"
	);

	if (!isScene) {
		cbList = [];
		for (k = 0; k < env.hats.whenCloned.length; k++) {
			var entry = env.hats.whenCloned[k];
			cbList.push(entry + "(env);");
		}
		output.push(
			"virtual void whenCloned() {",
				cbList,
			"}"
		);
	}

	return output;
}

function dumpConstructor(ast, env, isScene) {
	if (isScene) {
		return [
			env.sceneName + "(Environment *env): Scene(env) {",
			"}"
		];
	}
	var cloneVars = [];
	for (var i = 0; i < ast.variables.length; i++) {
		var v = ast.variables[i];
		var name = normalize(v.name);
		var detail = findTypeOf(v.value);
		if (detail.type === "List") {
			cloneVars.push(name + " = from->" + name + ".clone();");
		} else {
			cloneVars.push(name + " = from->" + name + ";");
		}
	}
	return [
		"virtual " + env.spriteName + "* clone() {",
			[ "return new " + env.spriteName + "(this);" ],
		"}",
		env.spriteName + "(" + env.spriteName + "*from): Sprite(from) {",
			cloneVars,
		"}",
		env.spriteName + "(Environment *env): Sprite(env) {",
		"}"
	];
}

function dumpVariables(ast, env) {
	var output = [];
	for (var i = 0; i < ast.variables.length; i++) {
		var v = ast.variables[i];
		var name = normalize(v.name);
		var detail = findTypeOf(v.value);
		if (detail.type === "List") {
			// TODO : how to specify type of list ?
			output.push("List<" + detail.subType + "> " + name + ";");
		} else {
			output.push(detail.type + " " + normalize(v.name) + " = " + detail.value + ";");
		}
	}
	if (output.length) {
		output.unshift("// variables");
	}
	return output;
}

function dumpScripts(ast, env) {
	var output = [];
	env.funcCount = 0;
	env.varCount = 0;
	for (var i = 0; i < ast.scripts.length; i++) {
		var s = ast.scripts[i];
		output = output.concat(dumpScript(s, env));
	}
	if (output.length) {
		output.unshift("// scripts");
	}
	return output;
}

// dumps one hat script
function dumpScript(ast, env) {
	var funcName, event, params = [];
	switch(ast.kind) {
	case "whenGreenFlag":
	case "whenClicked":
	case "whenSceneStarts":
	case "whenCloned":
	case "whenKeyPressed":
	case "whenIReceive":
	case "whenSensorGreaterThan":
		env.funcCount++;
		funcName = ast.kind + "_" + env.funcCount;
		registerHat(ast.kind, ast.params, funcName, env);
		break;
	case "procDef":
		var proto = ast.params[0].replace(/"(.*)( t)?"/, '$1');
		funcName = "userFunc_" + normalize(proto);
		argTypes = proto.split(" ").slice(1);
		if (argTypes.length !== ast.params[1].length) {
			return "// " + funcName + " : incoherency in argument list";
		}
		for (var p = 0; p < argTypes.length; p++) {
			var type = argTypes[p][1];
			var name = ast.params[1][p];
			switch(type) {
			// %b	Boolean slot
			case "b":
				params.push("bool " + name);
				break;
			// %c	Color slot
			case "c":
				params.push("unsigned long " + name);
				break;
			// %n	Numeric slot
			// %d.‹menu›	Numeric slot with menu
			case "n":
			case "d":
				params.push(findTypeOf(ast.params[2][p]).type + " " + name);
				break;
			// %s	String slot
			// %m.‹menu›	Readonly slot with menu
			case "s":
			case "m":
				params.push("String " + name);
				break;
			}
		}
    	break;
	}
	return [
		"void " + funcName + " (" + ["Environment *env"].concat(params).join(',') + ") {",
			dumpStatements(ast.content, env),
		"}"
	];
}

function registerHat(event, params, callback, env) {
	if (event === "whenSceneStarts") {
		// TODO : find background index
		var bg = params[0];
		if (env.hats[event].hasOwnProperty(bg)) {
			env.hats[event][bg].push(callback);
		} else {
			env.hats[event][bg] = [ callback ];
		}
	} else if (event === "whenKeyPressed") {
		var k = params[0];
		if (env.hats[event].hasOwnProperty(k)) {
			env.hats[event][k].push(callback);
		} else {
			env.hats[event][k] = [ callback ];
		}
	} else if (event === "whenIReceive") {
		var midx = findMessage(params[0], env);
		if (env.hats[event].hasOwnProperty(midx)) {
			env.hats[event][midx].push({message: params[0], callback: callback});
		} else {
			env.hats[event][midx] = [ {message: params[0], callback: callback} ];
		}
	} else if (event === "whenSensorGreaterThan") {
		var s = params[0], t = params[1];
		if (env.hats[event].hasOwnProperty(s)) {
			env.hats[event][s].push({threshold: t, callback: callback});
		} else {
			env.hats[event][s] = [ {threshold: t, callback: callback} ];
		}
	} else {
		env.hats[event].push(callback);
	}
}

function findMessage(name, env) {
	if (env.messages.hasOwnProperty(name)) {
		return env.messages[name];
	} else {
		env.messages[name] = env.lastMessageId;
		return env.lastMessageId++;
	}
}

function dumpExpression(ast, env) {
	if (typeof ast !== "object") {
		return ast;
	}
	switch(ast.kind) {
	case "readVariable":
	case "getParam":
		return normalize(ast.params[0]);
	case "contentsOfList:":
		return normalize(ast.params[0]) + ".toString()";
	case "list:contains:":
		return normalize(ast.params[0]) + ".contains(" + dumpExpression(ast.params[1], env) + ")";
	case "getLine:ofList:":
		return normalize(ast.params[1]) + "[" + dumpExpression(ast.params[0], env) + "]";
	case "lineCountOfList:":
		return normalize(ast.params[0]) + ".length";

	case "xpos":
	case "ypos":
	case "heading":
	case "costumeIndex":
	case "costumeName":
	case "scale":
	case "volume":
		return "this." + ast.kind;
	case "tempo":
		return "this->env->runtime->_" + ast.kind;
	case "sceneName":
		return "this->env->runtime->scene->costumeName";
	case "getUserName":
	case "mouseX":
	case "mouseY":
	case "soundLevel":
		return "/* TODO" + ast.kind + " */ 0";
	case "timer":
		return "env->runtime->timer()";

	case "&":
	case "|":
	case "*":
	case "/":
	case "+":
	case "-":
	case "%":
	case "<":
	case ">":
		return "(" + dumpExpression(ast.params[0], env) + ")" + ast.kind + "(" + dumpExpression(ast.params[1], env) + ")";

	// TODO : how to compare strings ?
	case "=":
		return "(" + dumpExpression(ast.params[0], env) + ") == (" + dumpExpression(ast.params[1], env) + ")";

	case "not":
		return "!(" + dumpExpression(ast.params[0], env) + ")";

	case "randomFrom:to:":
	case "concatenate:with:":
	case "letter:of:":
	case "stringLength:":
	case "rounded":
	case "touching:":
	case "distanceTo:":
	case "touchingColor:":
	case "color:sees:":
	case "keyPressed:":
	case "mousePressed":
	case "senseVideoMotion":
	case "timeAndDate":
	case "timestamp":
		return "Scratch::" + normalize(ast.kind) + "(" + dumpParams(ast.params, env).join(",") + ")";

	case "computeFunction:of:":
		return "Scratch::" + normalize(ast.kind) + "(Scratch::f_" + ast.params[0] + ", " + dumpParams(ast.params.slice(1), env).join(",") + ")";

	case "getAttribute:of:":
		var obj, attr;
		if (ast.params[1] === "_stage_") {
			obj = "this->env->runtime->scene";
		} else {
			// TODO : static/instance values ! how to find an instance ?
			obj = "firstSprite_" + normalize(ast.params[1]);
		}
		switch(ast.params[0]) {
		case "x position":
			attr = "_xpos";
			break;
		case "y position":
			attr = "_ypos";
			break;
		case "direction":
			attr = "_heading";
			break;
		case "costume #":
			attr = "_costumeIndex";
			break;
		case "costume name":
			attr = "_costumeName";
			break;
		case "background":
			attr = "_sceneName";
			break;
		case "size":
			attr = "_scale";
			break;
		case "volume":
			attr = "_volume";
			break;
		default:
			attr = normalize(ast.params[0]); // variable
		}
		return obj  + "->" + attr;
	}
	return "// TODO " + ast.kind + " ???";
}

function dumpParams(params, env) {
	var result = [];
	for (var p = 0; p < params.length; p++) {
		result.push(dumpExpression(params[p], env));
	}
	return result;
}

function dumpStatements(ast, env) {
	var result = [];
	for (var i = 0; i < ast.length; i++) {
		var s = ast[i];
		switch(s.kind) {
			// "this" methods
		case "forward:":
		case "turnRight:":
		case "turnLeft:":
		case "heading:":
		case "pointTowards:":
		case "gotoX:y:":
		case "gotoSpriteOrMouse:":
		case "glideSecs:toX:y:elapsed:from:":
		case "changeXposBy:":
		case "xpos:":
		case "changeYposBy:":
		case "ypos:":
		case "bounceOffEdge":
		case "setRotationStyle":

		case "say:duration:elapsed:from:":
		case "say:":
		case "think:duration:elapsed:from:":
		case "think:":
		case "doAsk":
		case "show":
		case "hide":
		case "lookLike:":
		case "nextCostume":
		case "filterReset":
		case "changeSizeBy:":
		case "setSizeTo:":
		case "comeToFront":
		case "goBackByLayers:":

		case "playSound:":
		case "doPlaySoundAndWait":
		case "noteOn:duration:elapsed:from:":
		case "rest:elapsed:from:":
		case "wait:elapsed:from:":

		case "instrument:":
		case "changeVolumeBy:":
		case "setVolumeTo:":
			result.push(normalize(s.kind) + "(" + dumpParams(s.params, env).join(",") + ");");
			break;

		case "changeGraphicEffect:by:":
		case "setGraphicEffect:to:":
			result.push(normalize(s.kind) + "(Effect_" + s.params[0] + ", " + dumpParams(s.params.slice(1), env).join(",") + ");");
			break;

		case "createCloneOf":
			var obj;
			if (s.params[0] === "_myself_") {
				obj = "this";
			} else {
				obj = "firstSprite_" + normalize(s.params[0]);
			}
			result.push(obj + "->createCloneOf();");
			break;

		case "deleteClone":
			result.push(normalize(s.kind) + "(" + dumpParams(s.params, env).join(",") + ");");
			break;

			// global methods with "this" argument
		case "stampCostume":
			// TODO : call Scratch::... with local argument
	    	result.push("// " + s.kind);
			break;

			// scene methods
		case "startScene":
			result.push("env->runtime->scene->" + normalize(s.kind) + "(" + dumpParams(s.params, env).join(",") + ");");
			break;

			// global methods
		case "stopAllSounds":
		case "playDrum":
		case "changeTempoBy:":
		case "setTempoTo:":

		case "clearPenTrails":
		case "putPenDown":
		case "putPenUp":
		case "penColor:":
		case "changePenHueBy:":
		case "setPenHueTo:":
		case "changePenShadeBy:":
		case "setPenShadeTo:":
		case "changePenSizeBy:":
		case "penSize:":

		case "timerReset":
			result.push("env->runtime->" + normalize(s.kind) + "(" + dumpParams(s.params, env).join(",") + ");");
			break;

			// this method, but impact message list
		case "broadcast:":
		case "doBroadcastAndWait":
			var  m = findMessage(s.params[0], env);
			result.push("env->runtime->" + normalize(s.kind) + "(" + m + ");");
			break;

		// control structures
		case "doRepeat":
			env.varCount++;
			var v = "__l" + env.varCount;
			result.push(
				"for(int "+v+" = 0; "+v+" < (" + dumpExpression(s.params[0], env) + "); "+v+"++) {",
				dumpStatements(s.params[1], env).concat("yield();"),
				"}");
			break;

		case "doIf":
			result.push(
				"if(" + dumpExpression(s.params[0], env) + ") {",
				dumpStatements(s.params[1], env),
				"}");
			break;
		case "doIfElse":
			result.push(
				"if(" + dumpExpression(s.params[0], env) + ") {",
				dumpStatements(s.params[1], env),
				"} else {",
				dumpStatements(s.params[0], env),
				"}");
			break;
		case "doWaitUntil":
	    	// TODO
	    	result.push("// " + s.kind);
	    	break;
		case "doUntil":
			// TODO : verify in scratch : while or do/while ?
			result.push(
				"while(!(" + dumpExpression(s.params[0], env) + ")) {",
				dumpStatements(s.params[1], env).concat("yield();"),
				"}");
	    	break;
		case "doForever":
			result.push(
				"for(;;) {",
				dumpStatements(s.params[0], env).concat("yield();"),
				"}");
	    	break;
		case "stopScripts":
	    	// TODO
	    	result.push("// " + s.kind);
	    	break;

		case "call":
			var funcName = "userFunc_" + normalize(s.params[0]);
			var params = [ "env" ].concat(dumpParams(s.params.slice(1), env)).join(",");
	    	result.push(funcName + "(" + params + ");");
	    	break;

		// variable changes
	    case "setVar:to:":
	    	result.push(normalize(s.params[0]) + " = " + dumpExpression(s.params[1], env) + ";");
	    	break;
	    case "changeVar:by:":
	    	result.push(normalize(s.params[0]) + " += " + dumpExpression(s.params[1], env) + ";");
	    	break;

		case "append:toList:":
	    	result.push(normalize(s.params[1]) + ".append(" + dumpExpression(s.params[0], env) + ");");
	    	break;
	    case "deleteLine:ofList:":
	    	if (s.params[0] === "last") {
	    		result.push(normalize(s.params[1]) + ".remove(" + normalize(s.params[1]) + ".length);");
	    	} else if (s.params[0] === "all") {
	    		result.push(normalize(s.params[1]) + ".empty();");
	    	} else {
	    		result.push(normalize(s.params[1]) + ".remove(" + dumpExpression(s.params[0], env) + ");");
	    	}
	    	break;
	    case "insert:at:ofList:":
	    	if (s.params[0] === "last") {
	    		result.push(normalize(s.params[2]) + ".insertAt(" + normalize(s.params[2]) + ".length, " + dumpExpression(s.params[1], env) + ");");
	    	} else if (s.params[0] === "random") {
	    		result.push(normalize(s.params[2]) + ".insertAt(Scratch::random(1," + normalize(s.params[2]) + ".length), " + dumpExpression(s.params[1], env) + ");");
	    	} else {
	    		result.push(normalize(s.params[2]) + ".insertAt(" + dumpExpression(s.params[0], env) + "," + dumpExpression(s.params[1], env) + ");");
	    	}
	    	break;
	    case "setLine:ofList:to:":
	    	if (s.params[0] === "last") {
	    		result.push(normalize(s.params[1]) + ".setAt(" + normalize(s.params[1]) + ".length, " + dumpExpression(s.params[2], env) + ");");
	    	} else {
	    		result.push(normalize(s.params[1]) + ".setAt(" + dumpExpression(s.params[0], env) + "," + dumpExpression(s.params[2], env) + ");");
	    	}
	    	break;

	    // Silently ignored
		case "setVideoState":
		case "setVideoTransparency":

	    case "showVariable:":
	    case "hideVariable:":
	    case "showList:":
	    case "hideList:":
	    	result.push("// " + s.kind);
	    	break;
		}
	}
	return result;
}

function dumpSprites(ast, env) {
	var output = [ "// sprites" ];
	for (var i = 0; i < ast.sprites.length; i++) {
		env.hats = {
			whenSceneStarts: {},
			whenGreenFlag: [],
			whenClicked: [],
			whenCloned: [],
			whenKeyPressed: {},
			whenIReceive: {},
			whenSensorGreaterThan: {}
		};
		var sprite = ast.sprites[i];
		env.spriteName = "Sprite_" + normalize(sprite.name);
		env.spriteNames.push(env.spriteName);
		output.push("class " + env.spriteName + ":public Sprite {", "public:");
		var v = dumpVariables(sprite, env);
		var s = dumpScripts(sprite, env);
		var h = dumpHats(sprite, env, false); // must be done after dumpScripts
		var c = dumpConstructor(sprite, env, false); // must be done after dumpScripts
		var result = [].concat(v, c, h, s, "virtual ~" + env.spriteName + "() {}");
		output.push(result);
		output.push("};");
	}
	return output;
}

function dumpScene(ast, env) {
	env.hats = {
		whenSceneStarts: {},
		whenGreenFlag: [],
		whenClicked: [],
		whenKeyPressed: {},
		whenIReceive: {},
		whenSensorGreaterThan: {}
	};
	env.sceneName = "Scene_" + normalize(ast.sourceName);
	var s = dumpScripts(ast, env);
	var h = dumpHats(ast, env, true); // must be done after dumpScripts
	var c = dumpConstructor(ast, env, true); // must be done after dumpScripts
	return [
		"// scene",
		"class " + env.sceneName + ":public Scene {", "public:",
			c, h, s,
			[ "virtual ~" + env.sceneName + "() {}" ],
		"};"
	];
}

function indent(list, prefix) {
	if (!prefix) {
		prefix = "";
	}
	var result = [];
	for(var i = 0; i < list.length; i++) {
		if(typeof list[i] === "string") {
			result.push(prefix + list[i]);
		} else  {
			result.push(indent(list[i], prefix + "\t"));
		}
	}
	return result.join("\n");
}

function dumpProto(ast, env) {
	var output = [];
	
	output.push("Environment *env = new Environment();");
	output.push("// prototypes");
	output.push("class " + env.mainClass + ";");
	for (var i = 0; i < env.spriteNames.length; i++) {
		output.push("class " + env.spriteNames[i] + ";");
	}
	output.push("class " + env.sceneName + ";");
	output = output.concat(dumpVariables(ast, env));

	return output;
}

function dumpMain(ast, env) {
	var output = [];
	// main class and main function
	output.push("class " + env.mainClass + ":public ScratchRuntime {", "public:");
	var messages = Object.keys(env.messages);
	var initSprites = [];
	for (var i = 0; i < env.spriteNames.length; i++) {
		initSprites.push("first" + env.spriteNames[i] + " = new " + env.spriteNames[i] + "(env);")
		initSprites.push("sprites.append(first" + env.spriteNames[i] + ");");
	}
	for (var i = 0; i < env.spriteNames.length; i++) {
		output.push([ env.spriteNames[i] + " *first" + env.spriteNames[i] + ";" ]);
	}

	output.push([
		"const char *messages[" + messages.length + "] = { " + messages.join(", ") + " };",
		"int nbMessages = " + messages.length + ";",
		env.mainClass + "(Environment *env): ScratchRuntime(env) {",
			[ "scene = new " + env.sceneName + "(env);" ],
			initSprites,
		"};"
	]);
	output.push("};");
	output.push(env.mainClass + " runtime(env);");
	output.push("int main() {");
	output.push([
		"runtime.run();",
	]);
	output.push("}");
	return output;
}

function dump(ast) {
	var env = {
		mainClass: "Scratch_" + ast.sourceName,
		messages: {}, // list of message labels, value = index
		lastMessageId: 0,
		spriteNames: []
	};

	// must dump sprites first to populate spriteNames and message lists
	var sprites = dumpSprites(ast, env);
	var scene = dumpScene(ast, env);
	// then proto and main
	var proto = dumpProto(ast, env);
	var main = dumpMain(ast, env);

	// but proto must be sent first
	var output = [].concat(
		"// project " + ast.source,
		"#include \"Scratch.h\"",
		proto,
		sprites,
		scene,
		main
	);
	return indent(output);
}

exports.dump = dump;
