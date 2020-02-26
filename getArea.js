// Fonction pour économiser des opérations à utiliser à la place de getChip/WeaponEffectiveArea
// Dernière mise à jour: 03/02/2020 par Caneton

global tabAOE = [];
global OBSTACLE = [];
global AREA_LASER;
global AREA_M_LASER;
global AREA_LANCE_FLAMME;
global AREA_J_LASER;

//include('GLOBALS');

						/*				Fonction publique					*/




function getAreaLine(tool, from, orientation) {
	if (tool == WEAPON_LASER) {
		return AREA_LASER[from][orientation];
	}
	if (tool == WEAPON_M_LASER) {
		return AREA_M_LASER[from][orientation];
	}
	if (tool == WEAPON_FLAME_THROWER) {
		return AREA_LANCE_FLAMME[from][orientation];
	}
	if (tool == WEAPON_B_LASER) {
		return AREA_LANCE_FLAMME[from][orientation];
	}
	if (tool == WEAPON_J_LASER) {
		return AREA_J_LASER[from][orientation];
	}
}


// retourne les cellules qui seront affectée si l'arme est utilisée sur la cell
// /!\ Ne fonction que pour les AOE !!! Ne pas utiliser pour les armes en ligne !!!
function getEffectiveArea(arme, cell) {
	var typeArea;
	(isWeapon(arme)) ? typeArea = getWeaponArea(arme) : typeArea = getChipArea(arme);
	var tailleAOE;
	if (typeArea == AREA_CIRCLE_1) {
		tailleAOE = 1;
	}
	if (typeArea == AREA_CIRCLE_2) {
		tailleAOE = 2;
	}
	if (typeArea == AREA_CIRCLE_3) {
		tailleAOE = 3;
	}
	return tabAOE[cell][tailleAOE];
}

						/*					Fonctions privées				*/

if (getTurn() == 1) {
	initObstacle();
	initgetAOE();
	init_AreaLine();
	debug(getOperations() / OPERATIONS_LIMIT * 100 + " %");
}

function init_AreaLine() {
	var ope = getOperations(); 
	// Note : NE[0] correspond à l'offset de la case à une distance de 2 dans la direction Nord-Est
	// d'où les décalage de -2 !
	var NE = [-34, -51, -68, -85, -102, -119, -136, -153, -170, -187, -204]; // Nord-Est
	var SO = [34, 51, 68, 85, 102, 119, 136, 153, 170, 187, 204]; //Sud-Ouest
	var NO = [-36, -54, -72, -90, -108, -126, -144, -162, -180, -198, -216];
	var SE = [36, 54, 72, 90, 108, 126, 144, 162, 180, 198, 216];
	var tabLaser = [];
	var tabMLaser = [];
	var tabLanceFlamme = [];
	var tabJLaser = [];
	var leekToIgnore = getAllies() + getEnemies();
	var orientation = [NE, SO, NO, SE];
	for (var cell = 0; cell < 613; cell++) {
		for (var dir = 0; dir < 4; dir++) {
			var vise = -1;
			var continuM = true;
			var continuL = true;
			var continuF = true;
			var continuJ = true;
			while (continuL || continuM || continuF || continuJ) {
				vise++;
				var cell_vise = cell + orientation[dir][vise];
				if (cell_vise >= 0 && cell_vise < 613 && lineOfSight(cell, cell_vise, leekToIgnore) && getCellDistance(cell, cell_vise) <= MAX_RANGE[WEAPON_M_LASER]) {
					// LASER
					if (vise <= MAX_RANGE[WEAPON_LASER]-2) {
						if (tabLaser[cell] == null) tabLaser[cell] = [];
						if (tabLaser[cell][dir] == null) tabLaser[cell][dir] = [];
						push(tabLaser[cell][dir], cell_vise);
					} else continuL = false;
					// LANCE_FLAMME & B_LASER
					if (vise <= MAX_RANGE[WEAPON_FLAME_THROWER]-2) {
						if (tabLanceFlamme[cell] == null) tabLanceFlamme[cell] = [];
						if (tabLanceFlamme[cell][dir] == null) tabLanceFlamme[cell][dir] = [];
						push(tabLanceFlamme[cell][dir], cell_vise);
					} else continuF = false;
					// M_LASER
					if (vise >= MIN_RANGE[WEAPON_M_LASER]-2 && vise <= MAX_RANGE[WEAPON_M_LASER]-2) {
						if (tabMLaser[cell] == null) tabMLaser[cell] = [];
						if (tabMLaser[cell][dir] == null) tabMLaser[cell][dir] = [];
						push(tabMLaser[cell][dir], cell_vise);
					}
					if(vise == MAX_RANGE[WEAPON_M_LASER]-1) continuM = false;
					// J_LASER
					if (vise >= MIN_RANGE[WEAPON_J_LASER]-2 && vise <= MAX_RANGE[WEAPON_J_LASER]-2) {
						if (tabJLaser[cell] == null) tabJLaser[cell] = [];
						if (tabJLaser[cell][dir] == null) tabJLaser[cell][dir] = [];
						push(tabJLaser[cell][dir], cell_vise);
					}
					if(vise >= MAX_RANGE[WEAPON_J_LASER]-1) continuJ = false;
				} else {
					continuL = false;
					continuM = false;
					continuF = false;
					continuJ = false;
				}
			}
		}
	}
	AREA_LASER = tabLaser;
	AREA_M_LASER = tabMLaser;
	AREA_LANCE_FLAMME = tabLanceFlamme;
	AREA_J_LASER = tabJLaser;
	debug("init_AreaLine : "+((getOperations()-ope)/OPERATIONS_LIMIT *100+"%"));
}


function initObstacle() {
	var obs = getObstacles();
	OBSTACLE = [];
	for (var i = 0; i < 613; i++) {
		OBSTACLE[i] = false;
	}
	for (var i in obs) {
		OBSTACLE[i] = true;
	}
}

function initgetAOE() {
	for (var i = 0; i < 613; i++) {
		tabAOE[i] = [];
		if (!OBSTACLE[i]) {
			for (var j = 1; j < 4; j++) {
				tabAOE[i][j] = getAOE(j, i);
			}
		}
	}
}


function getAOE(taille, centre) {
	var Voisin;
	var aoe = [centre];
	var t = 1;
	if (taille == 1) Voisin = [-17, -18, 17, 18];
	if (taille == 2) Voisin = [-17, -18, 17, 18, 1, -1, 35, -35, -34, 34, -36, 36];
	if (taille == 3) Voisin = [-17, -18, 17, 18, 1, -1, 35, -35, -34, 34, -36, 36, 51, -51, 52, -52, 53, -53, 54, -54, 19, -19, 16, -16];

	for (var i in Voisin) {

		if (centre + i >= 0 && centre + i < 613 && !OBSTACLE[centre + i]) {
			if (getCellDistance(centre, centre + i) <= taille) {
				aoe[t] = centre + i;
				t++;
			}
		}
	}
	return aoe;
}



