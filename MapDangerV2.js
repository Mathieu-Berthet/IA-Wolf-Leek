include("getCellToUse"); // normalement, j'ai mis toutes les fonctions sauf celles qui sont dans ce ficher
include("Ordonnanceur"); // pour "Knapsack"
//include("map_de_danger"); // pour le "debugArrayMap"

global CD = 4;
//global PT = 3;
global MAX_AOE = 2;
global RANGE = 1;
global NAME = 0;
global DEGAT = 0, VOL = 1; //, DAMAGE_RETURN = 2;
// voir pour fusionner items avec mon tableau ?
global ITEMS = (function() {
	var tab = [];
	for (var i = 1; i < NUMBER_OF_INGAME_ITEMS; i++) {
		tab[i] = [];
		tab[i][NAME] = ALL_INGAME_TOOLS[i][TOOL_NAME] ;

		tab[i][RANGE] = [];
		tab[i][RANGE][MIN] = ALL_INGAME_TOOLS[i][TOOL_MIN_RANGE] ;
		tab[i][RANGE][MAX] = ALL_INGAME_TOOLS[i][TOOL_MAX_RANGE] ;

		var area = ALL_INGAME_TOOLS[i][TOOL_AOE_TYPE] ;
		if(area==AREA_POINT || area==AREA_LASER_LINE) tab[i][MAX_AOE]=0;
		if(area==AREA_CIRCLE_1) tab[i][MAX_AOE]=1;
		if(area==AREA_CIRCLE_2) tab[i][MAX_AOE]=2;
		if(area==AREA_CIRCLE_3) tab[i][MAX_AOE]=3;
		// ajout des nouvelle area, pour le moment les aires ne sont pas pris en compte mais c'est pour éviter des divisions par 0
		if (area==AREA_PLUS_1) tab[i][MAX_AOE]=1;
		if (area==AREA_PLUS_2) tab[i][MAX_AOE]=2;
		if (area==AREA_PLUS_3) tab[i][MAX_AOE]=3;
		if(area==AREA_X_1) tab[i][MAX_AOE]=1;
		if(area==AREA_X_2) tab[i][MAX_AOE]=2;
		if(area==AREA_X_3) tab[i][MAX_AOE]=3;
		tab[i][PT] = ALL_INGAME_TOOLS[i][TOOL_PT_COST] ;
		tab[i][CD] = ALL_INGAME_TOOLS[i][TOOL_COOLDOWN_TIME] ;

	}
	return @tab;
})();


/**
 * @auteur : Caneton
 * Calcule le danger d'une case en fonction des actions possible des adversaires
 * @danger : tableau de la forme : Tab[cell : [leek_ennemis_1 : [WEAPON_1 : VALUE_1]]]
 * @return : tableau de la forme : Tab[cell : entier_danger]
 */
function dangerCombo(@danger) {
	var Total_degat = [];
	for(var cell : var dangerLeeks in danger) {
		Total_degat[cell]=0;
		for (var leek : var dangerArmes in dangerLeeks) {
			var TP = getTP(leek);
			var weapon = getWeapon(leek);
			var cout = [null];
			var nb_action = 1;
			var degat = [null];
			for(var arme : var value in dangerArmes) {
				var n;
				var change_weapon = 0;
				if (ALL_INGAME_TOOLS[arme][TOOL_IS_WEAPON] && arme != weapon) {
					change_weapon = 1;
				}
				var coutPT = ALL_INGAME_TOOLS[arme][TOOL_PT_COST] ;
				if (ALL_INGAME_TOOLS[arme][TOOL_COOLDOWN_TIME]) {
					n = 1;
				} else {
					n = floor(TP / coutPT);
				}
				//ajouter le bon nombre de fois dans les actions
				for (var o = 1; o <= n; o++) {
					cout[nb_action] = o * coutPT + change_weapon;
					degat[nb_action] = o * value;
					nb_action++;
				}
			}
			var result = knapsack(degat, cout, TP);
			var tmp = Total_degat[cell];
			for(var num : var boolean in result) if(boolean) tmp += degat[num];
			Total_degat[cell] = tmp;
		}
	}
	return @Total_degat;
}

/**
 * Reccupere les tools de type EFFECT_DAMAGE, EFFECT_POISON
 */
function getTools(leek){
	var tab_damage =[];
	var c = 0;
	for (var i in getWeapons(leek)) {
		if (i != WEAPON_J_LASER && i != WEAPON_MYSTERIOUS_ELECTRISOR && i != WEAPON_B_LASER) {
			tab_damage[c] = i;
			c++;
		}
	}
	for (var i in getChips(leek)) {
		var effet = ALL_INGAME_TOOLS[i][TOOL_ATTACK_EFFECTS] ;
		if (inArray([EFFECT_DAMAGE, EFFECT_POISON], effet[0][TOOL_EFFECT_TYPE]) && getCooldown(i, leek)<=1) {
			tab_damage[c] = i;
			c++;
		}
	}
	return @tab_damage;
}

/**
 * récupère les armes des adversaires et calcule le nombre de dégat que ça va faire sur le leek_id : ME
 * @ennemis : tableau des adversaires
 * @return : tableau de la forme : Tab[tool : [Distance_AOE : [Ennemis : degat_value]]]
 */
function getValueWeapons(ennemis) {
	var ValueWeapons= [];
	for (var ennemi in ennemis) {
		var tools = getTools(ennemi);
		for(var tool in tools) {
			if(ValueWeapons[tool]===null) ValueWeapons[tool] = [];
			var tailleAOE = ITEMS[tool][MAX_AOE];
			for(var dist=0; dist<=tailleAOE; dist++) {
				if(ValueWeapons[tool][dist]===null) ValueWeapons[tool][dist] = [];
				ValueWeapons[tool][dist][ennemi]=(getValue(tool, INFO_LEEKS[ennemi], INFO_LEEKS[ME], dist))[MOYEN];
			}
		}
	}
	return @ValueWeapons;
}


/**
 * Recupere les cases accessible des adversaires
 * @ennemis : tableau des adversaires
 * @return : tableau de la forme : Tab[cell : [Leek_1, Leek_2, ...]]
 */
function getAccessibleCasesLeeks(ennemis) {
	var accessibleCasesLeeks = [];
	for(var ennemi in ennemis) {
		var casesAccessible = getAccessibleCells(getCell(ennemi),getMP(ennemi));
		for(var cell:var d in casesAccessible) {
			if(accessibleCasesLeeks[cell]===null) accessibleCasesLeeks[cell] = [];
			push(accessibleCasesLeeks[cell], ennemi);
		}
	}
	return @accessibleCasesLeeks;
}


/**
 * @auteur : Caneton
 * Calcule le danger des armes des ennemis sur mes cases accessibles d'un leek
 * @ennemis : tableau des ennemis
 * @leek : id_leek ; limite le calcule sur les cases accessible
 * return : Tab[cell : [leek_ennemis1 : [WEAPON_1 : VALUE_1]]]
 *
 * /!\ NOTE : Les AOE n'ont pas été prise en compte
 */
function getDanger(ennemis,leek) {
	var danger = [];
	var mesCells = getAccessibleCells(getCell(leek),getMP(leek));
	var casesEnnemis = getAccessibleCasesLeeks(ennemis);
	var valueWeapons = getValueWeapons(ennemis);
	for (var cell: var d in mesCells) {
		if (danger[cell]===null)  danger[cell] = [];
		for(var weapon :var distAOE in valueWeapons) {
			//for(var dist in distAOE) {
			var dist = 0;
			var cellsToUse = [];
			CellsToUseTool(weapon,cell,cellsToUse);
			for (var case in cellsToUse) {
				for (var ennemi in casesEnnemis[case]) {
					if (valueWeapons[weapon][dist][ennemi]!==null) {
						if (danger[cell][ennemi]===null) danger[cell][ennemi]= [];
						if (danger[cell][ennemi][weapon]===null) {
							danger[cell][ennemi][weapon] = valueWeapons[weapon][dist][ennemi];
						}
					}
				}
			}
		}
	}
	return @danger;
}


/**
 * Calcule le nombre de pv retirer si le tireur tire sur la cible avec l'arme tool
 * @tireur et @cible sont des tableau ; sous-tableau de INFO_LEEKS cf fichier "globals"
 * @dist : permet de faire le calcule en prenant en compte la réduction de l'AOE
 * @return : Tab[MOYEN : degat_moyen, MIN : degat_min]
 */
function getValue(tool, tireur, cible, dist) {

	var degat = [MOYEN : 0, MIN : 0];
	var degat_renvoyer = 0;
	var volDeVie = 0;


	var aoe = ITEMS[tool][MAX_AOE]==0 ? 1 : 1 - (dist / (2 * ITEMS[tool][MAX_AOE])); // TODO: la formule a changé
	var effects = ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS] ;
	var area = ALL_INGAME_TOOLS[tool][TOOL_AOE_TYPE] ;
	var degatMoyen = 0;
	var degatMin = 0;

	for (var effect in effects) {
		if (effect[TOOL_EFFECT_TYPE] == EFFECT_DAMAGE) {
			degatMoyen = effect[TOOL_AVERAGE_POWER] ;
			degatMin = effect[TOOL_MIN_POWER] ;
			var degatBrutMoyen = aoe * degatMoyen * (1 + tireur[STRENGTH] / 100);
			var degatBrutMin = aoe * degatMin * (1 + tireur[STRENGTH] / 100);
			var degatTmp = [0, 0];
			degatTmp[MOYEN] = max(degatBrutMoyen * (1 - cible[RELATIVE_SHIELD] / 100) - cible[ABSOLUTE_SHIELD], 0);
			degatTmp[MIN] = max(degatBrutMin * (1 - cible[RELATIVE_SHIELD] / 100) - cible[ABSOLUTE_SHIELD], 0);

			degat[MOYEN] = degat[MOYEN] + degatTmp[MOYEN];
			degat[MIN] = degat[MIN] + degatTmp[MIN];
		}
		if (effect[TOOL_EFFECT_TYPE] == EFFECT_POISON) {
			degatMoyen = effect[TOOL_AVERAGE_POWER] ;
			degatMin = effect[TOOL_MIN_POWER] ;
			var degatBrutMoyen = aoe * degatMoyen * (1 + tireur[MAGIC] / 100);
			var degatBrutMin = aoe * degatMin * (1 + tireur[MAGIC] / 100);
			var degatTmp = [0, 0];
			degatTmp[MOYEN] = degatBrutMoyen;
			degatTmp[MIN] = degatBrutMin;

			degat[MOYEN] = degat[MOYEN] + degatTmp[MOYEN];
			degat[MIN] = degat[MIN] + degatTmp[MIN];
		}
	}
	return @degat;
}


//########################################################################################################
// 								les cases accessibles (algo de Nirahiel)   <= algo plus opti que celui déjà présent

global CELL_COUNT = 613;
global neighbors = [];
global TURN = 0;
TURN++;

global ALLCELL=(function (){
	var tab =[];
	for(var i=0; i<613;i++) {
		tab[i]=i;
	}
	return tab;
})();

function processTerrain() {
	var x, y, neighbor;
	var cell;
	for (var i = 0; i < CELL_COUNT; i++) {
		if (getCellContent(i) == CELL_OBSTACLE) continue;
		cell = [];
		x = getCellX(i);
		y = getCellY(i);
		neighbor = getCellFromXY(x + 1, y);
		if (neighbor != null && getCellContent(neighbor) != CELL_OBSTACLE) push(cell, neighbor);
		neighbor = getCellFromXY(x - 1, y);
		if (neighbor != null && getCellContent(neighbor) != CELL_OBSTACLE) push(cell, neighbor);
		neighbor = getCellFromXY(x, y + 1);
		if (neighbor != null && getCellContent(neighbor) != CELL_OBSTACLE) push(cell, neighbor);
		neighbor = getCellFromXY(x, y - 1);
		if (neighbor != null && getCellContent(neighbor) != CELL_OBSTACLE) push(cell, neighbor);
		neighbors[i] = cell;
	}
}
if (TURN == 1) {
	processTerrain();
}


function getAccessibleCells(center, mp) {
	var accessibleCells = [center: 0];
	var queuedCells = [center: true];
	for (var cost = 1; cost <= mp; cost++) {
		var processing = queuedCells;
		queuedCells = [];
		for (var cell: var i in processing) {
			for (var neighbor in neighbors[cell]) {
				if (getCellContent(neighbor) == CELL_EMPTY && accessibleCells[neighbor] === null) {
					queuedCells[neighbor] = true;
					accessibleCells[neighbor] = cost;
				}
			}
		}
	}
	return accessibleCells;
}
