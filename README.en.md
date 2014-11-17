ArduinoScratch
==============

This project has 2 goals :
- send commands to an Arduino, from Scratch projects
- convert Scratch project in Arduino code

Part I : Connect Arduino to Scratch 2
=====================================
* On computer : a service, written in node.js, serves extensions to Scratch
* On Arduino : specific code establishes dialog between Arduino and this extension,
  thru the node.js service
* On Scratch : extension is loaded into a project; this adds blocks which dialog with Arduino

In fact, loaded extensions can discuss with Arduino in 3 different ways :
* a "mock" mode just simulates Arduino. In this case, user must use commands in browser js
  console to simulate Arduino answers
* a "serial" mode, where browser discuss directly with Arduino serial port, thru
  a special plugin downloadable at Scratch Website (not tested)
* a "Websocket" mode, Where node.js service make a bridge between Arduino serial port and
  extension code

Furthermore, this last mode allows to discuss with a remote computer : in a classroom,
a student may load the extension from your computer, on which Arduino is connected,
and launch it's project from its computer to see the result. 

Of course, only one client can discuss with Arduino simultaneously.

"basic" Example :
---------------

Arduino side
- - - - - -

* plug a push button between 12 pin and GND
* compile extensions/basic/basic.ino and upload it on Arduino
* Code has been written for Uno. For other variants, code may be adapted about interruptions

Computer side :
- - - - - - - -
from "node" directory
* before first run
  * launch : npm install socket.io serialport
  * adapt node/server.js code to match your serial port name
* launch command : node node/server.js

Scratch side :
- - - - - - -
* Get project "test extension" : http://scratch.mit.edu/projects/26016195/#editor
  remix it to have your own version, or simply load it if it's just for testing purpose
* extensions are no more loadable from "shift menu", thus you have to load it by command line.
  From a js console, type in :
    ScratchExtensions.loadExternalJS("http://localhost:8000/extensions/basic/basic.js")
  if you want to connect to a remote computer, replace "localhost" by remote computer
  name or IP.

  From this moment, some blocks which where named "undefined" become "set led",
  "when button is pressed" ...
  If you click "Green Flag", the built-in Arduino led (pin 13) should blink.
  If you push the button, the cat sprite should say the current LED status

How does it work ?
----------------

Directory tree :
- - - - - - -

* /node : nodejs code
  * /client : an obsolete test page
  * /server.js : the node program to launch as bridge between Scratch and Arduino

* /extensions : each extension has it's own directory here
  It should contain Arduino native code and js extension script.
  * lib : commun utility code (communication layer is there)
  * basic : simple extension as example
  * ledStrip : another extension to deal with an addressable LED strip

extensions :
- - - - -

 An extension is loaded in Scratch thru the node server, it injects a file content
(extensions/lib/autoPrepend.js) to declare some utility methods (dependencies injection "à la"
require.js) and defines variables MY_URL and ROOT_URL which are to be used by user code to
detect extension remote URL (needed to establish a websocket for example).

For the extension internal, see basic.js code, which is commented

TODO :
----

* Other extensions !
  stepper motors ? potentiometers ? captors (light, movement, ...)
* Find a way to compile & upload into the Arduino the code associated with an extension when
  it's loaded

Part II : Convert Scratch 2 to Arduino
======================================

This part is a second step in Scratch integration with Arduino. It's goal is to convert a
full Scratch project in Arduino code to make it runnable standalone.
Sprite costume, sounds and other stuff have no direct sense in Arduino thus some concept are
ignored or partially implemented.
Furthermore, for the moment, the "parallel" behavior of Scratch is not implemented
(if 2 "green flag" hats launch an infinite loop, only one of them will run)

The build chain is very basic for the moment.
First of all, you need to clone my Arduino toolchain, since I use it to compile the generated
 Arduino code and its dependencies
You need https://github.com/piif/ArduinoCore and https://github.com/piif/ArduinoTools

Then, here is an example :
 https://github.com/piif/ArduinoScratch/tree/master/scratch2c/examples

* The .sb2 file is a scratch project I can't share since it refers an extension
 (at the moment, Scratch forbid this).
* You can directly download this project main file here :
  http://projects.scratch.mit.edu/internalapi/project/32894984/get/
  the result is the same file as the "Guirlande_chenille_3.json" in the directory above
* You have to name this file with a "json" extension
* You must create a config file, with the same name, in the same directory, but with
  "config" extension.
  For this example, you can use "Guirlande_chenille_3.config" file.
  This file must declare "includes" to generate in the code (here, the ledStrip library) and
  sprites or variables which must not be generated (here, "lampe" sprite is just to simulate
  LEDs in Scratch, we remove them from Arduino code since we have actual ones)
* Then, you can launch conversion by calling the Makefile in scratch2c directory :
  make examples/Guirlande_chenille_3.cpp 
* Then you can compile it with the same Makefile, but a bit more complex command line :
  make MAIN_SOURCE=examples/Guirlande_chenille_3 MAIN_NAME=Guirlande_chenille_3 TARGET=Uno all
  
  On first run, this command will compile libScratch.a into arduino/Scratch/target/Uno
  It will compile the Guirlande_chenille_3.cpp file into an arduino binary in target/Uno/
  You can upload this code
 
  If you clone also my arddude project (https://github.com/piif/arddude) you can use "console"
instead of "all" to upload and launch serial console directly.


* /data : test and work files

* /scratch2c : en chantier ...
  L'idée est de convertir un bout de programme Scratch en code Arduino, pour pouvoir
  l'embarquer sur l'arduino
  Mais ça, c'est pas encore au point ...
