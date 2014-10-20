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

function dumpVariables(ast) {
	var output = [];
	for (var i = 0; i < ast.variables.length; i++) {
		var v = ast.variables[i];
		var detail = findTypeOf(v.value);
		if (detail.type === "List") {
			// TODO : how to specify type of list ?
			output.push("List<" + detail.subType + "> " + normalize(v.name) + ";");
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
	var funcName, event, params = [], body;
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
		funcName = "userFunc_" + normalize(ast.params[0]);
		argTypes = ast.params[0].split(" ").slice(1);
		argTypes.pop(); // remove "t" at end
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
	body = dumpStatements(ast.content, env);
	return ["void " + funcName + " (" + params.join(',') + ") {", body, "}"];
}

function registerHat(event, params, callback, env) {
	// TODO
	// add a call to register() to a list to append to constructor
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
	case "scale":
	case "volume":
	case "tempo":
		return "this._" + ast.kind;
	case "sceneName":
		return "_stage_._backdrop";
	case "getUserName":
	case "mouseX":
	case "mouseY":
	case "soundLevel":
	case "timer":
		return "S_" + ast.kind;

	case "&":
	case "|":
	case "*":
	case "/":
	case "+":
	case "-":
	case "%":
	case "<":
	case "=":
	case ">":
		return "(" + dumpExpression(ast.params[0], env) + ")" + ast.kind + "(" + dumpExpression(ast.params[1], env) + ")";

	case "not":
		return "!(" + dumpExpression(ast.params[0], env) + ")";

	case "randomFrom:to:":
	case "concatenate:with:":
	case "letter:of:":
	case "stringLength:":
	case "rounded":
	case "computeFunction:of:":
	case "touching:":
	case "distanceTo:":
	case "touchingColor:":
	case "color:sees:":
	case "keyPressed:":
	case "mousePressed":
	case "senseVideoMotion":
	case "timeAndDate":
	case "timestamp":
		return "S_" + normalize(ast.kind) + "(" + dumpParams(ast.params, env) + ")";

	case "getAttribute:of:":
		var obj, attr;
		if (ast.params[1] === "_stage_") {
			obj = "";
		} else {
			obj = "sprite_" + normalize(ast.params[1]) + ".";
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
			attr = "_backdrop";
			break;
		case "size":
			attr = "_scale";
			break;
		case "volume":
			if (ast.params[1] === "_stage_") {
				obj = "_stage_.";
			}
			attr = "_volume";
			break;
		default:
			attr = normalize(ast.params[0]); // variable
		}
		return obj + attr;
	}
	return "???";
}

function dumpParams(params, env) {
	var result = [];
	for (var p = 0; p < params.length; p++) {
		result.push(dumpExpression(params[p], env));
	}
	return result.join(",");
}

function dumpStatements(ast, env) {
	var result = [];
	for (var i = 0; i < ast.length; i++) {
		var s = ast[i];
		switch(s.kind) {
		// function calls
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
		case "show":
		case "hide":
		case "lookLike:":
		case "nextCostume":
		case "startScene":
		case "changeGraphicEffect:by:":
		case "setGraphicEffect:to:":
		case "filterReset":
		case "changeSizeBy:":
		case "setSizeTo:":
		case "comeToFront":
		case "goBackByLayers:":

		case "playSound:":
		case "doPlaySoundAndWait":
		case "stopAllSounds":
		case "playDrum":
		case "rest:elapsed:from:":
		case "noteOn:duration:elapsed:from:":
		case "instrument:":
		case "changeVolumeBy:":
		case "setVolumeTo:":
		case "changeTempoBy:":
		case "setTempoTo:":
		
		case "clearPenTrails":
		case "stampCostume":
		case "putPenDown":
		case "putPenUp":
		case "penColor:":
		case "changePenHueBy:":
		case "setPenHueTo:":
		case "changePenShadeBy:":
		case "setPenShadeTo:":
		case "changePenSizeBy:":
		case "penSize:":
		
		case "broadcast:":
		case "doBroadcastAndWait":

		case "createCloneOf":
		case "deleteClone":
		case "timerReset":
	    	// TODO
	    	result.push(s.kind);
	    	break;

		// control structures
		case "wait:elapsed:from:":
	    	// TODO
	    	result.push(s.kind);
	    	break;
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
	    	result.push(s.kind);
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
	    	result.push(s.kind);
	    	break;

		case "call":
			var funcName = "userFunc_" + normalize(s.params[0]);
			var params = dumpParams(s.params.slice(1), env);
	    	result.push(funcName + "(" + params + ");");
	    	break;

		// variable changes
	    case "setVar:to:":
console.log("setVar:to:", s.params);
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
	    		result.push(normalize(s.params[1]) + ".remove(" + normalize(s.params[1]) + ".length));");
	    	} else {
	    		result.push(normalize(s.params[1]) + ".remove(" + dumpExpression(s.params[0], env) + ");");
	    	}
	    	break;
	    case "insert:at:ofList:":
	    	if (s.params[0] === "last") {
	    		result.push(normalize(s.params[2]) + ".insertAt(" + normalize(s.params[2]) + ".length), " + dumpExpression(s.params[1], env) + ");");
	    	} else if (s.params[0] === "random") {
	    		result.push(normalize(s.params[2]) + ".insertAt(S_random(1," + normalize(s.params[2]) + ".length), " + dumpExpression(s.params[1], env) + ");");
	    	} else {
	    		result.push(normalize(s.params[2]) + ".insertAt(" + dumpExpression(s.params[0], env) + "," + dumpExpression(s.params[1], env) + ");");
	    	}
	    	break;
	    case "setLine:ofList:to:":
	    	if (s.params[0] === "last") {
	    		result.push(normalize(s.params[1]) + ".setAt(" + normalize(s.params[1]) + ".length), " + dumpExpression(s.params[2], env) + ");");
	    	} else {
	    		result.push(normalize(s.params[1]) + ".setAt(" + dumpExpression(s.params[0], env) + "," + dumpExpression(s.params[2], env) + ");");
	    	}
	    	break;

	    // Silently ignored
		case "doAsk":
		case "setVideoState":
		case "setVideoTransparency":

	    case "showVariable:":
	    case "hideVariable:":
	    case "showList:":
	    case "hideList:":
	    	break;
		}
	}
	return result;
}

function dumpSprites(ast) {
	var output = [ "// sprites" ];
	var env = {
		messageHandlers: {},
		starters: []
	};
	for (var i = 0; i < ast.sprites.length; i++) {
		var s = ast.sprites[i];
		output.push("class sprite_" + normalize(s.name) + " {");
		var result = [].concat(
			dumpVariables(s),
			dumpScripts(s, env)
		);
		output.push(result);
		output.push("}");
	}
	return output;
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

function dump(ast) {
	var output = [].concat(
		"// project " + ast.source,
		dumpVariables(ast),
		dumpSprites(ast)
	);
	return indent(output);
}

exports.dump = dump;
