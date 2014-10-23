#include <Arduino.h>
#ifndef DEFAULT_BAUDRATE
	#define DEFAULT_BAUDRATE 115200
#endif

#define LED 13
// PCMSK0:4 + Int PCI0
#define BUTTON 12

bool ledState = LOW;

void setup(void) {
	pinMode(LED, OUTPUT);
	digitalWrite(LED, LOW);

	// TODO : some ifdef to handle other arduino variants
	// enable interrupt for PCINT4 = D12
	PCMSK0 |= 1 << 4;
	// enable interrupt for PCI0 (pcint0-7)
	PCICR |= 1;

	pinMode(BUTTON, INPUT_PULLUP);

	Serial.begin(DEFAULT_BAUDRATE);
}

volatile bool mustSendButton = false;
volatile bool buttonState = HIGH;
#define BOUND_DELAY 100
volatile int buttonLastChange = 0;

ISR(PCINT0_vect) {
	bool b = digitalRead(BUTTON);
	if (b != buttonState && millis() - buttonLastChange > BOUND_DELAY) {
		buttonLastChange = millis();
		buttonState = b;
		if (buttonState == LOW) {
			mustSendButton = true;
		}
	}
}

void loop() {
	// test button
	if (mustSendButton) {
		Serial.println('!');
		mustSendButton = false;
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
