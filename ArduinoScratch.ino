#include <Arduino.h>
#ifndef DEFAULT_BAUDRATE
	#define DEFAULT_BAUDRATE 115200
#endif

#define LED 13
#define BUTTON 12

bool ledState = LOW;
bool buttonState = HIGH;
bool buttonLastChange = 0;

void setup(void) {
	pinMode(LED, OUTPUT);
	digitalWrite(LED, LOW);

	// TODO : bind raising interrupt on this digital input
	pinMode(BUTTON, INPUT_PULLUP);

	Serial.begin(DEFAULT_BAUDRATE);
}

void loop() {
	// test button
	bool b = digitalRead(BUTTON);
	if (b != buttonState && millis() - buttonLastChange > 100) {
		//Serial.println(millis() - buttonLastChange);
		buttonLastChange = millis();
		buttonState = b;
		if (buttonState == LOW) {
			Serial.println('!');
		}
	}

	// test input
	int input = Serial.read();
	if (input == '0') {
		ledState = LOW;
	} else if (input == '1') {
		ledState = HIGH;
	} else if (input == '?') {
		Serial.println(ledState ? "1" : "0");
	}

	// update LED
	digitalWrite(13, ledState);
}
