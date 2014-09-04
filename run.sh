HERE=$(cd $(dirname $0) ; /bin/pwd)
$HERE/../arddude/etc/ad.sh $1 avrdude -patmega328p -carduino -P/dev/ttyACM0 -b115200 -D -Uflash:w:$HERE/target/Uno/ArduinoScratch.hex:i
