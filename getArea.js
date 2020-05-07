// Fonction pour économiser des opérations à utiliser à la place de getChip/WeaponEffectiveArea
// Dernière mise à jour: 03/02/2020 par Caneton

include("GLOBALS");
include("Debug");

global tabAOE = [];
global tabPlus = [];
global tabCroix = [];

global OBSTACLE = [];
global AREA_LASER;
global AREA_M_LASER;
global AREA_LANCE_FLAMME;
global AREA_J_LASER;


						/*				Fonction publique					*/




function getAreaLine(tool, from, orientation) {
	if (tool == WEAPON_LASER) {
		return AREA_LASER[from][orientation];
	}
	if (tool == WEAPON_M_LASER) {
		return AREA_M_LASER[from][orientation];
	}
	if (tool == WEAPON_REVOKED_M_LASER) {
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
// /!\ Ne fonctionne que pour les AOE !!! Ne pas utiliser pour les armes en ligne !!!
function getEffectiveArea(arme, cell) {
	var typeArea = ALL_INGAME_TOOLS[arme][TOOL_AOE_TYPE] ;
	var tailleAOE;
	var tailleCroixAOE;
	var taillePlusAOE;
	if(typeArea == AREA_CIRCLE_1 || typeArea == AREA_CIRCLE_2 || typeArea == AREA_CIRCLE_3)
	{
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
	if(typeArea == AREA_PLUS_1 || typeArea == AREA_PLUS_2 || typeArea == AREA_PLUS_3)
	{
		if(typeArea == AREA_PLUS_1)
		{
			taillePlusAOE = 1;
		}
		if(typeArea == AREA_PLUS_2)
		{
			taillePlusAOE = 2;
		}
		if(typeArea == AREA_PLUS_3)
		{
			taillePlusAOE = 3;
		}
		return tabPlus[cell][taillePlusAOE];
	}
	if(typeArea == AREA_X_1 || typeArea == AREA_X_2 || typeArea == AREA_X_3)
	{
		if(typeArea == AREA_X_1)
		{
			tailleCroixAOE = 1;
		}
		if(typeArea == AREA_X_2)
		{
			tailleCroixAOE = 2;
		}
		if(typeArea == AREA_X_3)
		{
			tailleCroixAOE = 3;
		}
		return tabCroix[cell][tailleCroixAOE];
	}
}


/*					Fonctions privées				*/


if (getTurn() == 1) {
	initObstacle();
	initgetAOE();
	initgetAOECroix();
	initgetAOEPlus();
  	init_AreaLine();
	//debugP(getOperations() / OPERATIONS_LIMIT * 100 + " %");
}


function init_AreaLine() {
	var ope = getOperations();
	// Note : NE[0] correspond à l'offset de la case à une distance de 2 dans la direction Nord-Est
	// d'où les décalages de -2 !
	var NE = [-34, -51, -68, -85, -102, -119, -136, -153, -170, -187, -204]; // Nord-Est
	var SO = [34, 51, 68, 85, 102, 119, 136, 153, 170, 187, 204]; //Sud-Ouest
	var NO = [-36, -54, -72, -90, -108, -126, -144, -162, -180, -198, -216]; // Nord-Ouest
	var SE = [36, 54, 72, 90, 108, 126, 144, 162, 180, 198, 216]; //Sud-Est
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
	//debugP("init_AreaLine : "+((getOperations()-ope)/OPERATIONS_LIMIT *100)+ " %");
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

function initgetAOECroix() {
	for (var i = 0; i < 613; i++) {
		tabCroix[i] = [];
		if (!OBSTACLE[i]) {
			for (var j = 1; j < 4; j++) {
				tabCroix[i][j] = getAOECroix(j, i);
			}
		}
	}
}

function initgetAOEPlus() {
	for (var i = 0; i < 613; i++) {
		tabPlus[i] = [];
		if (!OBSTACLE[i]) {
			for (var j = 1; j < 4; j++) {
				tabPlus[i][j] = getAOEPlus(j, i);
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

function getAOECroix(taille, centre)
{
	var Voisin;
	var aoe = [centre];
	var t = 1;
	if(taille == 1) Voisin = [-1, -35, 1, 35];
	if(taille == 2) Voisin = [-1, -35, 1, 35, -2, -70, 2, 70];
	if(taille == 3) Voisin = [-1, -35, 1, 35, -2, -70, 2, 70, -3, -105, 3, 105];

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

function getAOEPlus(taille, centre)
{
	var Voisin;
	var aoe = [centre];
	var t = 1;
	if(taille == 1) Voisin = [-17, -18, 17, 18];
	if(taille == 2) Voisin = [-17, -18, 17, 18, -34, 34, -36, 36];
	if(taille == 3) Voisin = [-17, -18, 17, 18, -34, 34, -36, 36, 51, -51, 54, -54];

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
