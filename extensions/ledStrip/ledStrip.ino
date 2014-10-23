#ifdef PIF_TOOL_CHAIN
	#include <Arduino.h>
	// other includes with full pathes
	#include "ledStrip/strip.h"
#else
	// other includes with short pathes
	// example : #include "led7.h"
	#include "strip.h"
#endif

#ifndef DEFAULT_BAUDRATE
	#define DEFAULT_BAUDRATE 115200
#endif

#define STRIP_PIN 8

void setup(void) {
	Serial.begin(DEFAULT_BAUDRATE);

	Serial.println("ready");
}

bool initialized = false;
byte stripLen;
byte light = 128;
// buffer for command reads
byte data[60];

bool readBytes(byte *buffer, int len, bool ascii) {
	if (ascii) {
		int i = 0, v = 0;
		while(i < len) {
			int c = Serial.read();
			if (c == -1 || c == '\r') {
				continue;
			} else if (c == ',' || c == ';' || c == '\n') {
				buffer[i] = v;
				v = 0;
				i++;
			} else if (c >= '0' && c <= '9') {
				v = v * 10 + c - '0';
			} else {
				return false;
			}
		}
	} else {
		int c;
		for (int i = 0; i < len; i++) {
			while((c = Serial.read()) == -1);
			buffer[i] = c;
		}
	}
	return true;
}

void rainbow() {
	for (byte c = 1; c <= 255 - stripLen; c++) {
		for (byte p = 0; p < stripLen; p++) {
			stripSetH(p, c + p);
		}
		stripUpdate();
		delay(10);
	}
}

void loop() {
	if (Serial.available()) {
		int b = Serial.read();
		switch(b) {
		case '!': // rainbow
			if (initialized) {
				rainbow();
			}
			break;
		case '?': // return status
			if (initialized) {
				Serial.println(stripLen);
			} else {
				Serial.println(0);
			}
			break;
		case 'i': // set strip len
		case 'I':
			if (readBytes(data, 1, b >= 'a' && b <= 'z')) {
				stripLen = data[0];
				stripInit(stripLen, STRIP_PIN);
				stripUpdate(); // Initialize all pixels to 'off'
				initialized = true;
			}
			break;
		case 'z': // switch off
		case 'Z': // switch off
			if (initialized) {
				stripOff();
			}
			break;
		case 'l': // set light intensity
		case 'L':
			if (readBytes(data, 1, b >= 'a' && b <= 'z')) {
				light = data[0];
			}
			break;
		case 'a': // all of same color
		case 'A':
			if (readBytes(data, 1, b >= 'a' && b <= 'z')) {
				Color c;
				HLtoRGB(data[0], light, &c);
				Serial.print(c.r); Serial.print(", ");
				Serial.print(c.g); Serial.print(", ");
				Serial.println(c.b);
				if (initialized) {
					stripAll(c);
				}
			}
			break;
		case 'c': // list of colors
		case 'C':
			if (readBytes(data, stripLen, b >= 'a' && b <= 'z')) {
				if (initialized) {
					for(int i = 0; i < stripLen; i++) {
						stripSetHL(i, data[i], light);
					}
					stripUpdate();
				}
			}
			break;
		}
	}
}
