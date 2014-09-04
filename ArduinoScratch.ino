#include <Arduino.h>

bool ledState = LOW;
bool buttonState = LOW;

void setup(void) {
	pinMode(13, OUTPUT);
	digitalWrite(13, LOW);

	// TODO : bind raising interrupt on this digital input
	pinMode(12, INPUT);

	Serial.begin(115200);
}

void loop() {
	int input = Serial.read();
	if (input == '0') {
		ledState = LOW;
	} else if (input == '1') {
		ledState = HIGH;
	} else if (input == '?') {
		Serial.println(ledState ? "1" : "0");
	}
	digitalWrite(13, ledState);
}
