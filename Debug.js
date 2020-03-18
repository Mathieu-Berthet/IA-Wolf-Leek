// Petites fonctions de debug que l'on peut désactiver en passant logDebug à false
// Pour les utiliser, ajouter un "P" à la fin d'une fonction de l'API

global logDebug = true;


function debugP(object) {
	// Enregistre un message object dans le log personnel,
	// disponible dans le rapport à la fin du combat.
	if (logDebug) { debug(object); }
}


function debugCP(object, color) {
	// Enregistre un message object dans le log personnel,
	// disponible dans le rapport à la fin du combat, de la couleur color.
	if (logDebug) { debugC(object, color); }
}


function debugEP(object) {
	// Enregistre un message d'erreur object dans le log personnel,
	// disponible dans le rapport à la fin du combat.
	// Les messages d'erreur apparaissent en rouge dans le rapport de combat.
	if (logDebug) { debugE(object); }
}


function debugWP(object) {
	// Enregistre un message d'avertissement object dans le log personnel,
	// disponible dans le rapport à la fin du combat.
	// Les messages d'avertissement apparaissent en orange dans le rapport
	// de combat.
	if (logDebug) { debugW(object); }
}
