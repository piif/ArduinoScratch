Idée : convertir un extrait de code scratch en C compatible arduino

pour récupérer un projet :
	http://projects.scratch.mit.edu/internalapi/project/id/get/
	"id" étant l'id numérique qu'on voit dans l'url
	=> ça récupère le json du projet (oui, sans aucun controle ...)

	de même, dans le json, les champs baseLayerMD5 ou md5 sont des noms de fichiers
	récupérables à http://cdn.assets.scratch.mit.edu/internalapi/asset/LE_NOM/get/

le détail est là :
	http://wiki.scratch.mit.edu/wiki/Scratch_File_Format_%282.0%29#Format

structure d'un project scratch : un fichier s2b est un zip avec :
- des svg, png contenant les costumes
- des wav contenants les sons
- un project.json avec la structure suivante :
{
	objName : stage
	// les globales
	lists : [
		{
			listname:..,
			contents: [ ... ],
			// details pour l'afficher
		}, ...
	],
	variables : [ { name: .., value: .. } ],
	// sons et costumes du fond
	sounds: ...
	costumes: ...
	tempoBPM: x,
	children: [
		{
			objName: nomDUnSprite,
			// les locales
			variables: [{ .. }, ..]
			lists: [{ .. }, ..]
			scripts: [
				[ x, y, [ "commande", "param1", "param2" ... ] ], ..
			],
			"scriptComments": [[x, y, w, h, open, position, text], .. ],
			// position = numéro du bloc associén dans l'ordre d'apparition dans ce sprite ou -1
			"sounds": ..,
			"costumes": ..,
			"currentCostumeIndex": 0,
			"scratchX": 37,
			"scratchY": -9,
			"scale": 1,
			"direction": 90,
			"rotationStyle": "normal",
			"isDraggable": false,
			"indexInLibrary": 2,
			"visible": true,
			"spriteInfo": {	}
		},
		{
			"target": "un sprite",
			"cmd": "getVar:",
			"param": "une variable",
			"label": "sprite: variable", // ou "variable" si elle est publique
			// .. de quoi l'afficher dans la scène
			// avec les même détails que la déclaration en haut
		}, ..
		{
			"listName": "une liste", // pareil pour les listes ...
		}
	}],
	"info": {
		"savedExtensions": [{
			"javascriptURL": "...",
			"menus": {
				"led": ["on", "off"]
			},
			"extensionName": "...",
			"blockSpecs": [["", "set led %m.led", "setLed", "on"],
				["", "toggle led state", "toggleLed"],
				["r", "led state", "getLed"],
				["h", "when button is pressed", "onButton"]
			]
		}],
		...
		"projectID": "26016195",
	}
}

les blocs de scripts :
- commence toujours par un libellé de commande comme "setVar:to:" ou "doRepeat"
- suivis de paramètres, dont certains peuvent être des sous-blocs

pour convertir ça, l'idée est donc :
- de dumper les variables globale, avec un problème pour les listes, puisque dynamiques
  => facile en java ou js, mais en C ... => malloc/realloc ?
- pour chaque sprite, créer un .c différent ? une classe.
- dedans, dumper les variables locales et le code
- attacher les commentaires en passant (optionnel ...)
- générer une méthode setupScratch qui instancie les sprites
- génerer une méthode loopScratch qui appelle le scheduler ? ou c'est "broadcast" qui enchaine ?

en quoi ?
	nodejs ? => json en natif, accès aux wget (por récup du projet) et au file system
	=> node scratch2ino.js config_file [scratch_id|scratch_json]

difficultés :
- clone => classes => C++ ?
  et donc des variables qui deviennent des champs

- typage : int, float, string ? => à déterminer selon la valeur dans la déclaration ?

- certains blocs sont à ignorer ? (son, déplacements, ...)
  ou définir une lib qu'on pourra bouchonner/peupler selon les cas ?

- comment filtrer l'export pour permettre de définir des choses en dur et en ignorer d'autres ?
  exemple : pour la guirlande, on veux juste le sprite "animation", mais s'il y a des globales, il faut
    les choper, alors qu'on veut importer du code remplaçant le code du sprite "lampe"
  => déclarer une liste de ce qui est déjà défini par ailleurs => on ignore les choses de même type/nom dans scratch

- messages => fonctionnement évènementiel et pseudo-parallèle => scheduler
  en fait, les onMessage étant déclaratifs, il suffit que le code de "broadcast"
  contienne des appels en dur à chaque "onMessage" associé.
  => les messages peuvent même devenir des fonctions séparées : broadcast("toto")
  devient broadcastToto() dont le code est Sprite::onToto()
/!\ dans ce cas, broadcast devient "broadcast and wait", voir les effets de bord possibles,
  notamment sur le timing de la boucle principale de la guirlande par exemple
/!\ de façon générale, il peut y avoir des boucles infinies, donc le scheduling simple ne marche pas
 => obligé de faire un truc à la threads
 
pour les blocs dispo, il faudrait les lister par catégories, pour savoir
plus facilement lesquels ignorer
dans http://wiki.scratch.mit.edu/wiki/Scratch_File_Format_%282.0%29/Block_Selectors il
y a à peu près toutes les commandes, soit 172 ! (en fait, il y a des obsolètes en trop) :

Quelques joyeusetés sur les clones :
quand un lutin est cloné :
- ses variables le sont aussi => le constructeur doit initialiser les valeurs à celle du parent
- le volume, la direction, les effects, le "rotation style" sont locaux
- la distance à un lutin est relative à sa première instance
- le "get of" vers un sprite est également relative à sa première instance
- les "on click" sont relatif à une instance
- toutes les instances recoivent les "on key"
- create a clone of "sprite" se réfère à sa première instance
  alors que create a clone of myself se réfère au clone qui exécute
De plus :
- on ne peut pas détruire la première instance ("delete this clone" est ignoré)
- le tempo est global

Les cas où un block doit faire un yield (http://scratch.mit.edu/discuss/topic/30927/?page=1#post-555526) :
	    piif wrote:
	    does the “well-defined yield points” list is clearly defined ?
	    at end of each loop in infinite repeat I suppose, but are there other points ?
	
	When run-without-screen-refresh is disabled:
	
	    After evaluating one cycle of a loop (repeat, forever, etc.)
	    When waiting for the response to a blocking extension reporter or command.
	    During the execution of a timed block (glide, say…for, etc.) or a block that pauses the thread (ask…and wait, wait, wait until)
	    When waiting for a broadcast to finish in a broadcast…and wait block.
	    When waiting for a backdrop to finish in a switch backdrop to…and wait block.
	    Before a procedure call that is recursive (with up to four intermediate calls).
	
	When run-without-screen-refresh is enabled:
	
	    If execution time has exceeded 500 ms, at any of the yield points above or before calling a procedure.
    