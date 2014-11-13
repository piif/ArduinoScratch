#include "Scratch.h"

#ifdef ARDUINO
	#define STRIP_PIN 8
	#include "ledStrip/strip.h"
#endif

namespace led_strip_extension {
	void initStrip(Environment *env, int len) {
		#ifdef ARDUINO
			stripInit(len, STRIP_PIN);
			stripUpdate(); // Initialize all pixels to 'off'
		#else
			printf("led_strip_extension::initStrip(%d)\n", len);
		#endif
	}
	void setStripOff(Environment *env) {
		#ifdef ARDUINO
		#else
			puts("led_strip_extension::setStripOff");
		#endif
	}
	void setStripAll(Environment *env, int color) {
		#ifdef ARDUINO
		#else
			printf("led_strip_extension::setStripAll(%d)\n", color);
		#endif
	}
	void setStripAll(Environment *env, float color) {
		setStripAll(env, (int)color);
	}
	void setStripColors(Environment *env, List<int> &colors) {
		#ifdef ARDUINO
		#else
			printf("led_strip_extension::setStripColors(%d, %d, ...)\n", colors[1], colors[2]);
		#endif
	}
	void setStripColors(Environment *env, List<float> &colors) {
		#ifdef ARDUINO
		#else
			printf("led_strip_extension::setStripColors(%f, %f, ...)\n", colors[1], colors[2]);
		#endif
	}
	void setStripLight(Environment *env, int light) {
		#ifdef ARDUINO
		#else
			printf("led_strip_extension::setStripLight(%d)\n", light);
		#endif
	}
	void setStripLight(Environment *env, float light) {
		setStripLight(env, (int)light);
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
		puts("led_strip_extension::init");
	}
};
