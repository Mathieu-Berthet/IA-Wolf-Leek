include("GLOBALS");

/**
 * L'idée de ces fonctions est de déterminer les cells qui sont en 'territoire' ennemis / allié   
 * si un seul allié est en plein milieu des ennemis il y a de forte chance qui ne passe pas le tour
 * 
 * en fonction de la concentration des poireaux, différentes actions pourrais être prises :
 * 
 * 		- Les fonctions getCellToUse retourne des cells en fonction des cells accessibles 
 * 		en faisant des différences entre les cells accessibles et les cells à risque (en fonction du nombre de MP restant) 
 * 		on pourrait limiter la recherche des actions pour ne pas se retrouver en plein milieu et sans MP après la phase d'attaque
 *
 * 		- En terme de tactique, si l'on joue les invertions on pourrait essayé de forcer qu'un ennemis se retrouve dans 
 * 		notre 'territoire' pour l'éliminer rapidement 
 *
 *		- Si l'équipe est un peu éparpillé sur la carte on risque d'avoir plusieurs petits territoires, ce qui n'est pas forcément 
 * 		très stratégique. Là encore, en éliminant des cases dans les cells accessibles on pourrait inciter les poireaux à se rapprocher 
 * 		sans pour autant les empêcher d'attaquer.
 *
 * Si vous voyez d'autres mesure qui pourrait être prise en fonction, n'hésitez pas à en rajouter ^^ (pas forcément les coder ^^ )
 *
 * Note: 	Certain truc peuvent être assez compliquer, comme détecter 2 territoires alliés disjoint. 
 * 		Si vous avez des talents en mathématique ça pourra être utile ^^' (pour l'instant je pense au 'gradiant', il y a surment 
 *		des truc plus adapté pour ça) 
 *
 * 		J'ai fait une petite fonction pour faire afficher les zones allié et ennemis --> Les artistes, faites vous plaisir 
 *		pour que ça soit plus beau :)      
 */



function getTerritoires(team1, team2) {
	var territoire = [];
	for(var cell=0; cell < 613; cell++) {
		var cellValue = 0;
		territoire[cell] = [];
		for (var leek in team1) {
			if (getCellDistance(cell, INFO_LEEKS[leek][CELL]) <= TERRITOIRE_PARAM[leek][MAX]) {
				cellValue += TERRITOIRE_PARAM[leek][LEEK_VALUE];
			} else if (getCellDistance(cell, INFO_LEEKS[leek][CELL]) <= TERRITOIRE_PARAM[leek][MIN]) {
				cellValue += 0.5 * TERRITOIRE_PARAM[leek][LEEK_VALUE];
			} 
		}
		territoire[cell][1] = cellValue;
		cellValue = 0;
		for (var leek in team2) {
			if (getCellDistance(cell, INFO_LEEKS[leek][CELL]) <= TERRITOIRE_PARAM[leek][MAX]) {
				cellValue += TERRITOIRE_PARAM[leek][LEEK_VALUE];
			} else if (getCellDistance(cell, INFO_LEEKS[leek][CELL]) <= TERRITOIRE_PARAM[leek][MIN]) {
				cellValue += 0.5 * TERRITOIRE_PARAM[leek][LEEK_VALUE];
			}
		}
		territoire[cell][2] = cellValue;
	}
	return @territoire;
} 


// ************************* aspect graphique ********************************

function debugTerritoires(territoires) {
	var max = getBigestValueOfTerritoires(territoires);
	if (!max) return null; 
	for(var cell : var team in territoires) {
		if(team[1] || team [2]) { 
			var red =  (155*team[2]/max) + 100; // je fais un décalage pour avoir des couleurs pas trop proche du noir
			var blue = (155*team[1]/max) + 100;
			mark(cell, getColor(red, 0, blue));
		}
	}
}

function getBigestValueOfTerritoires(territoires){
	var maxi = 0;
	for (var i = 0; i < 613; i++) {
		maxi = max(maxi, max(territoires[i][1], territoires[i][2]));
	}
	return maxi;
}


function clearMap() {
	var blue, red, green = 255;
	var map = getMapType();
	if (map == MAP_BEACH) {
		// Heu... Need help #Daltonien ^^
		
	}
	if (map == MAP_DESERT) {
		
	}
	if (map == MAP_FACTORY) {
		
	}
	if (map == MAP_FOREST) {
		
	}
	if (map == MAP_GLACIER) {
		
	}
	if (map == MAP_NEXUS) {
		
	}
	var cells = [];
	for (var i = 0; i < 613; i++) {
		push(cells, i);
	}
	mark(cells, getColor(red, green, blue));
} 

