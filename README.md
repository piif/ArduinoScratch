ArduinoScratch
==============

L'idée de ce projet est de disposer d'un moyen simple d'utiliser des extension scratch 2.0
couplée à un arduino :
* coté ordinateur : un service, écrit en nodejs, permet de charger des extensions scratch
* coté arduino : un code spécifique à l'extension permet de dialoguer avec du matériel
* coté scratch : on charge une extension et on dialogue alors avec l'arduino via des briques
  supplémentaires

Pour ça, le nodejs sert un fichier js qui peut dialoguer avec l'arduino de 3 façon différentes :
* un mode "mock" pour faire de la simulation, sans arduino. L'utilisateur doit alors simuler le
  dialogue via des commandes dans la console javascript du browser
* un mode "serial", ou le browser dialogue directement avec le port série (uniquement sous mac et
  windows, avec le plugin dédié)
* un mode websocket, ou le nodejs fait le pont entre l'extension scratch et le port série

Ce dernier mode permet en plus de discuter avec un ordinateur distant (celui où a été chargé
l'extension). Par exemple dans une salle de classe, chaque poste peut tester son programme
en dialogant avec un unique arduino branché sur un poste à part, et faisant tourner le
code nodejs.

Exemple "basic" :
===============

coté Arduino :
------------
* cabler un bouton poussoir entre les pattes 12 et GND
* compiler le code extensions/basic/basic.ino et l'uploader
* le code a été écrit pour Arduino Uno, pour un autre modèle, il faut peut être adapter
  la gestion d'interruption pour le bouton.

coté ordinateur :
---------------
  lancer :
    node node/server.js

coté Scratch :
------------
  charger ou remixer le projet "test extension" : http://scratch.mit.edu/projects/26016195/#editor
  comme les extensions ne sont plus "chargeables" depuis les menus de Scratch, il faut appeler
  une commande javascript spécifique pour les charger :
    ScratchExtensions.loadExternalJS("http://localhost:8000/extensions/basic/basic.js")
  si vous lancez Scratch sur un autre ordinateur que celui où tourne le serveur node, il
  faut préciser le nom ou l'IP de ce serveur, au lieu de "localhost"

  A ce moment, des blocs qui étaient marqué "undefined" dans le programme deviennent "set led",
  "when button is pressed" ...
  Si vous lancer le programme (drapeau vert), la led de l'arduino (sur la broche 13) doit
  clignoter et si vous appuyez sur le bouton poussoir, le chat doit annoncer l'état de la
  LED à ce moment là

Organisation du code :
====================
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
====
* D'autres extensions !
  moteurs pas à pas ? potentiomètres ? capteurs (de lumière, de mouvement ...)
* Mettre en place un moyen d'uploader le code Arduino associé à une extension,
  le tout après appel de la compilation, si nécessaire, par la ligne de commande
  de l'IDE Arduino
