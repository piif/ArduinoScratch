// color model tests, see http://scratch.mit.edu/projects/24578928/#editor
// load in browser with :
// ScratchExtensions.loadExternalJS("http://localhost/scratch/extension/hsv2rgb.js")

new (function() {
	var ext = this;

	ext.HSVtoRGB = function(H, S, V) {
		H /= 200.0;
		S /= 100.0;
		V /= 100.0;
		var R, G, B;
		if ( S == 0 ) {
			R = G = B = V;
		} else {
			var h = H * 6;
			if ( h == 6 ) {
				h = 0;      //H must be < 1
			}
			var i = Number.toInteger( h );             //Or ... var_i = floor( var_h )
			var v1 = V * ( 1 - S );
			var v2 = V * ( 1 - S * ( h - i ) );
			var v3 = V * ( 1 - S * ( 1 - ( h - i ) ) );

			switch(i) {
			case 0:
				R = V ; G = v3; B = v1;
				break;
			case 1:
				R = v2; G = V ; B = v1;
				break;
			case 2:
				R = v1; G = V ; B = v3;
			break;
			case 3:
				R = v1; G = v2; B = V ;
				break;
			case 4:
				R = v3; G = v1; B = V;
				break;
			case 5:
				R = V ; G = v1; B = v2;
				break;
			}
		}
//		console.log(R, G, B, (Number.toInteger(R * 255) << 16) + (Number.toInteger(G * 255) << 8) + Number.toInteger(B * 255));
		return (Number.toInteger(R * 255) << 16) + (Number.toInteger(G * 255) << 8) + Number.toInteger(B * 255);
	};
	
	var Hue_2_RGB = function (v1, v2, vH) {
		if (vH < 0) {
			vH += 1;
		}
		if (vH > 1) {
			vH -= 1;
		}
		if ((6 * vH) < 1) {
			return (v1 + (v2 - v1) * 6 * vH);
		}
		if ((2 * vH) < 1) {
			return v2;
		}
		if ((3 * vH) < 2) {
			return v1 + (v2 - v1) * ((2 / 3) - vH) * 6;
		}
		return v1;
	};

	ext.HSLtoRGB = function(H, S, L) {
		H /= 200.0;
		S /= 100.0;
		L /= 100.0;
		var R, G, B;
		if (S == 0) {
			R = G = B = L;
		} else {
			var v2;
			if (L < 0.5) {
				v2 = L * (1 + S);
			} else {
				v2 = (L + S) - (S * L);
			}
			var v1 = 2 * L - v2;

			R = Hue_2_RGB(v1, v2, H + (1 / 3));
			G = Hue_2_RGB(v1, v2, H);
			B = Hue_2_RGB(v1, v2, H - (1 / 3));
			return (Number.toInteger(R * 255) << 16) + (Number.toInteger(G * 255) << 8) + Number.toInteger(B * 255);
		}
	};

	ext._getStatus = function() {
		return {status: 2, msg: 'Ready'};
	}

	var descriptor = {
		blocks: [
			['r', 'convert H %n, S %n, V %n to RGB', 'HSVtoRGB', 0, 0, 0],
			['r', 'convert H %n, S %n, L %n to RGB', 'HSLtoRGB', 0, 0, 0],
		]
	};

	// Register the extension
	ScratchExtensions.unregister("hsv2rgb");
	ScratchExtensions.register('hsv2rgb', descriptor, ext);
})();
