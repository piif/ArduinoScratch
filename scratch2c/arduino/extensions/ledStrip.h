#include "Scratch.h"

#ifdef ARDUINO
	#define STRIP_PIN 8
	#include "ledStrip/strip.h"
#endif

namespace led_strip_extension {
	int stripLen, light;

	void initStrip(Environment *env, int len) {
		#ifdef ARDUINO
			stripLen = len;
			stripInit(len, STRIP_PIN);
			stripUpdate(); // Initialize all pixels to 'off'
		#else
			printf("led_strip_extension::initStrip(%d)\n", len);
		#endif
	}
	void setStripOff(Environment *env) {
		#ifdef ARDUINO
			stripOff();
		#else
			puts("led_strip_extension::setStripOff");
		#endif
	}
	void setStripAll(Environment *env, int h) {
		#ifdef ARDUINO
			Color c;
			HLtoRGB(h, light, &c);
			stripAll(c);
		#else
			printf("led_strip_extension::setStripAll(%d)\n", color);
		#endif
	}
	void setStripAll(Environment *env, float color) {
		setStripAll(env, (int)color);
	}
	void setStripColors(Environment *env, List<int> &colors) {
		#ifdef ARDUINO
			for(int i = 1; i <= colors.length; i++) {
				stripSetHL(i - 1, colors[i], light);
			}
			stripUpdate();
		#else
			printf("led_strip_extension::setStripColors(%d, %d, ...)\n", colors[1], colors[2]);
		#endif
	}
	void setStripColors(Environment *env, List<float> &colors) {
		#ifdef ARDUINO
			for(int i = 1; i <= colors.length; i++) {
				stripSetHL(i - 1, (int)(colors[i]), light);
			}
			stripUpdate();
		#else
			printf("led_strip_extension::setStripColors(%f, %f, ...)\n", colors[1], colors[2]);
		#endif
	}
	void setStripLight(Environment *env, int l) {
		#ifdef ARDUINO
			light = l;
		#else
			printf("led_strip_extension::setStripLight(%d)\n", light);
		#endif
	}
	void setStripLight(Environment *env, float l) {
		light = (int)l;
	}
	void rainbow(Environment *env) {
		#ifdef ARDUINO
			for (byte c = 1; c <= 255 - stripLen; c++) {
				for (byte p = 0; p < stripLen; p++) {
					stripSetH(p, c + p);
				}
				stripUpdate();
				delay(10);
			}
		#else
			puts("led_strip_extension::rainbow");
		#endif
	}

	void init(Environment *env) {
		#ifdef ARDUINO
			Serial.println("led_strip_extension::init");
		#else
			puts("led_strip_extension::init");
		#endif
	}
};
