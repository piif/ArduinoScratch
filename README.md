début de travail autour d'une extension Arduino pour Scratch

1 - on envoie 0 ou 1 sur le serila, => ça allume/éteint la diode 13
  et ça retourne "ON" ou "OFF"

TODO :

2 - faire une extension scratch qui s'en occupe
    + documenter comment la charger (appel d'un script manuel en attendant que
    le système d'extension soit ouvert)
3 - ajouter un flag et consulter ce flag par un "?"
    + faire son pendant scratch 
4 - ajouter un bouton, qui envoie un caractère "!" quand on l'appuie une fois
   (via interrupt sur "raising")
   + faire l'évènement associé coté scratch

voir ensuite quelles interactions seraient plus sympa à mettre en place ?
- moteurs pas à pas ? tortue ? jeu de lumière ? guirlande ?
