#include <Arduino.h>

void setup(void) {
	pinMode(13, OUTPUT);
	pinMode(12, INPUT);
	Serial.begin(115200);
}

void loop() {
	int input = Serial.read();
	if (input == '0') {
		digitalWrite(13, LOW);
		Serial.println("OFF");
	} else if (input == '1') {
		digitalWrite(13, HIGH);
		Serial.println("ON");
	}
}
