// Fonction pour économiser des opétations à utiliser à la place de getCellToUseChip/Weapon
// Dernière mise à jour: 26/01/2018 par Caneton
// TODO: definir les range min et max pour chaque armes et chips => empêcher de s'empoisonner pour certaines armes/chips

include("GLOBALS");

							/*						Fonction Publique							*/

/**
* @auteur: Caneton
* renvoit la cell la plus proche pour utiliser tool parmis les cellsAccessibles
* Si non pas de cells accessible pour utiliser tool=> valeur du return : -2
* 	/!\ cellsAccecible est un tableau, avec Tab[i] = longueur du chemin pour aller sur la cell i ! 
**/

function getCellToUseToolsOnCell(tool, cellVisee, cellsAccessible) {
	var cells = [];
	CellsToUseTool (tool, cellVisee, cells);
	var me = getLeek();
	var cellMin = -2;
	var min = 100;
	for (var cell in cells) {
		var distance = cellsAccessible[cell];
		if (distance !== null && distance < min) {
			if (lineOfSight(cell, cellVisee, me)) {
				cellMin = cell;
				min = distance;
			}
		}
	}
	//debug(cells);
	return cellMin;
}

/**
 * @auteur: Caneton
 * Procédure permettant d'obtenir toutes les cells d'où l'on peux utiliser tool sur cellVisee  => Fait la même chose que getCellsToUseChip/Weapon
 * allCells est le tableau de retour
 **/
function CellsToUseTool (tool, cellVisee, @allCells) {
	var mini = MIN_RANGE[tool];
	var maxi;
	var inLine;
	if (isChip(tool)) {
		//mini = getChipMinRange(tool);
		maxi = getChipMaxRange(tool);
		inLine = isInlineChip(tool);
	} else {
		//mini = getWeaponMinRange(tool);
		maxi = getWeaponMaxRange(tool);
		inLine = isInlineWeapon(tool);
	}
	if (!inLine) {
		for (var i = mini; i <= maxi ; i++) {
			allCells = allCells + _initCellToUse[cellVisee][i];
		}
	}
	if (inLine) {
		for (var i = mini; i <= maxi ; i++) {
			allCells = allCells + _initInLineCell[cellVisee][i];
		}
	}
}


/**
 * @auteur : Caneton
 * getCellsToCheckForLaser => selectionne des cases où il y a des ennemis qui se trouve sur la même ligne
 * associe également une direction sur la case
 *
 */
function getCellsToCheckForLaser(@pathLengh, leeks) {
	var ope = getOperations();
	/*-----------*/
	var from = 0;
	var withOrientation = 1;
	//var onCell = 2;
	/*-----------*/

	//todo : filtrer les cells
	var n = 0;
	var cells = [];

	for (var leek in leeks) {
		push(cells, getCell(leek));
		n++;
	}
	var all = getAliveAllies() + getAliveEnemies();

	var array = [];
	var taille = 0;
	for (var i = 0; i < 613; i++) { //toutes les cells de la maps
		if (pathLengh[i] !== null) { //si accessible
			var j = 0;
			while (j < n) { //sur toutes les cells où il y a un ennemis 
				if (isOnSameLine(i, cells[j]) && lineOfSight(i, cells[j], all)) {
					//todo : determiner l'orientation
					array[taille] = [];
					array[taille][from] = i;
					if (i % 18 == cells[j] % 18) {
						if (i > cells[j]) { //NO
							array[taille][withOrientation] = NO_laser;
						} else { //SE
							array[taille][withOrientation] = SE_laser;
						}
					} else {
						if (i < cells[j]) { //SO
							array[taille][withOrientation] = SO_laser;
						} else { //NE
							array[taille][withOrientation] = NE_laser;
						}
					}
					//array[taille][onCell] = cells[j];
					taille++;
				}
				j++;
			}
		}
	}
	//debug("cellsToCheckForLaser => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
	return @array;
}

/*							Fonction Privée							*/

global obstacle = [];
global _initCellToUse = [];
global _initInLineCell = [];


global celltouse = [0: [0], 1 : [18, 17, -17, -18], 2 : [36, 35, 34, 1, -1, -34, -35, -36], 3 : [54, 53, 52, 51, 19, 16, -16, -19, -51, -52, -53, -54], 4 : [72, 71, 70, 69, 68, 37, 33, 2, -2, -33, -37, -68, -69, -70, -71, -72], 5 : [90, 89, 88, 87, 86, 85, 55, 50, 20, 15, -15, -20, -50, -55, -85, -86, -87, -88, -89, -90], 6 : [108, 107, 106, 105, 104, 103, 102, 73, 67, 38, 32, 3, -3, -32, -38, -67, -73, -102, -103, -104, -105, -106, -107, -108], 7 : [126, 125, 124, 123, 122, 121, 120, 119, 91, 84, 56, 49, 21, 14, -14, -21, -49, -56, -84, -91, -119, -120, -121, -122, -123, -124, -125, -126], 8 : [144, 143, 142, 141, 140, 139, 138, 137, 136, 109, 101, 74, 66, 39, 31, 4, -4, -31, -39, -66, -74, -101, -109, -136, -137, -138, -139, -140, -141, -142, -143, -144], 9 : [162, 161, 160, 159, 158, 157, 156, 155, 154, 153, 127, 118, 92, 83, 57, 48, 22, 13, -13, -22, -48, -57, -83, -92, -118, -127, -153, -154, -155, -156, -157, -158, -159, -160, -161, -162], 10 : [180, 179, 178, 177, 176, 175, 174, 173, 172, 171, 170, 145, 135, 110, 100, 75, 65, 40, 30, 5, -5, -30, -40, -65, -75, -100, -110, -135, -145, -170, -171, -172, -173, -174, -175, -176, -177, -178, -179, -180]] ;

init_obstacle();
initialisationCellToUse();
initialisationInLineCell();


function init_obstacle() {
	if (getTurn() == 1) {
		var obstacles = getObstacles();
		for (var i in obstacles) {
			obstacle[i] = true;
		}
	}
}
function initialisationInLineCell() {
	if(getTurn() == 1) {
		var ope = getOperations();
		var NE = -17;
		var SO = 17;
		var NO = -18;
		var SE = 18;
		var cell;
		for (var i = 0; i < 613; i++) {
			if(!obstacle[i]) {
				var LOSNE = true;
				var LOSSO = true;
				var LOSNO = true;
				var LOSSE = true;
				_initInLineCell[i] = [];
				var x = 1;
				if (i%35==0) {
					LOSSO = false;
					LOSNO = false;
				}
				if ((i - 17) % 35 == 0) {
					LOSNE = false;
					LOSSE = false;
				}
				while ((LOSNE || LOSSO || LOSNO || LOSSE) && x <= 12) {
					var card = 0;
					if (LOSNE) {
						cell=i+x*NE;
						if (cell<0 || cell > 612) {
							LOSNE = false;
						} else {
							if (obstacle[cell]) {
								LOSNE = false;
							} else {
								if(_initInLineCell[i][x] === null) _initInLineCell[i][x] = [];
								_initInLineCell[i][x][card]=cell;
								card++;
								if ((cell-17) % 35 == 0) {
									LOSNE = false;
								}
							}
						}
					}
					if (LOSSO) {
						cell=i+x*SO;
						if (cell<0 || cell > 612) {
							LOSSO = false;
						} else {
							if (obstacle[cell]) {
								LOSSO = false;
							} else {
								if(_initInLineCell[i][x] === null) _initInLineCell[i][x] = [];
								_initInLineCell[i][x][card]=cell;
								card++;
								if (cell % 35 == 0) {
									LOSSO = false;
								}
							}
						}
					}
					if (LOSNO) {
						cell=i+x*NO;
						if (cell<0 || cell > 612) {
							LOSNO = false;
						} else {
							if (obstacle[cell]) {
								LOSNO = false;
							} else {
								if(_initInLineCell[i][x] === null) _initInLineCell[i][x] = [];
								_initInLineCell[i][x][card]=cell;
								card++;
								if (cell % 35 == 0) {
									LOSNO = false;
								}
							}
						}
					}
					if (LOSSE) {
						cell=i+x*SE;
						if (cell<0 || cell > 612) {
							LOSSE = false;
						} else {
							if (obstacle[cell]) {
								LOSSE = false;
							} else {
								if(_initInLineCell[i][x] === null) _initInLineCell[i][x] = [];
								_initInLineCell[i][x][card]=cell;
								card++;
								if ((cell-17) % 35 == 0) {
									LOSSE = false;
								}
							}
						}
					}
					x++;
				}
			}
		}
		//debug("initialisationInLineCell :"+((getOperations()-ope)/OPERATIONS_LIMIT *100));
	}
}
function initialisationCellToUse(){
	if (getTurn()==1) {
		var av = getOperations();
		var all = getAliveAllies()+getAliveEnemies();

		for (var i = 0; i < 613; i++) {
			_initCellToUse[i] = [];
			for (var j = 0; j <=12; j++) {
				var sstab = [];
				for (var b in celltouse[j]) {
					var c = b+i;
					if (!obstacle[c] && getCellDistance(i, c)==j && lineOfSight(i, c, all)) {
						push(sstab, c);
					}
				}
				_initCellToUse[i][j] = sstab;
			}
		}
		//debug("initialisationCellToUse :"+((getOperations()-av)/OPERATIONS_LIMIT *100));
	}
}