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

* /node : la partie nodejs
  * /client : une page de test de la partie serveur (plus maintenue)
  * /server.js : le programme node à lancer pour faire le pont entre Scratch et Arduino

* /extensions : chaque extension est placée ici, dans un répertoire
  * lib : un dossier contenant des fichiers inclus par les autres.
    Notamment la couche "communication" se cache là dedans
  * basic : le code arduino et js de l'exemple ci-dessus
  * ledStrip : pilotage d'une bande de LED adressables depuis Scratch

* /data : des fichiers de test et de données

* /scratch2c : en chantier ...
  L'idée est de convertir un bout de programme Scratch en code Arduino, pour pouvoir
  l'embarquer sur l'arduino
  Mais ça, c'est pas encore au point ...

Code des extensions :
===================
Une extension est chargée dans Scratch via le serveur node, qui y injecte en
passant un fichier (extensions/lib/autoPrepend.js)
Ce fichier contient quelques méthodes pour charger des dépendances (version simplifiée
de require.js) et défini des variables MY_URL et ROOT_URL qui permettent aux extensions de
savoir de où elles ont été chargées.

Pour le détail du fonctionnement d'une extension, voir le code de basic.js, qui est commenté

TODO :
----

* Other extensions !
  stepper motors ? potentiometers ? captors (light, movement, ...)
* Find a way to compile & upload into the Arduino the code associated with an extension when
  it's loaded

Part II : Convert Scratch 2 to Arduino
======================================
