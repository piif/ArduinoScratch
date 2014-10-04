code "passe plat" entre une extension scratch et la liaison série d'un arduino

a terme :
- à l'appel de toto.js
	- on retourne un code js d'extension, avec les CORS et en remplaçant
	  l'url de la websocket par celle du service
	- on lance l'upload de toto.hex vers l'arduino
	- on établi la connexion
- l'extension établi la connexion websocket
  celle ci reste bloquée tant que la connexion à l'arduino n'est pas établie
- on fait suivre les données, as is.

/!\ un seul client à la fois du coup ...

TODO:
- tester en version "extension device" + plugin (=> windows)
