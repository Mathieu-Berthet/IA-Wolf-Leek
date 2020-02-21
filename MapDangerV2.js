include("getCellToUse"); // normalement, j'ai mis toutes les fonctions sauf celles qui sont dans ce ficher
include("Ordonnanceur"); // pour "Knapsack"
//include("map_de_danger"); // pour le "debugArrayMap"

global CD = 4;
//global PT = 3;
global MAX_AOE = 2;
global RANGE = 1;
global NAME = 0;
global DEGAT = 0, VOL = 1; //, DAMAGE_RETURN = 2;

global ITEMS = (function() {
	var tab = [];
	for (var i = 1; i < 111; i++) {
		tab[i] = [];
		tab[i][NAME] = (isChip(i)) ? getChipName(i) : getWeaponName(i);
		
		tab[i][RANGE] = [];
		tab[i][RANGE][MIN] = (isChip(i)) ? getChipMinRange(i) : getWeaponMinRange(i);
		tab[i][RANGE][MAX] = (isChip(i)) ? getChipMaxRange(i) : getWeaponMaxRange(i);
		
		var area = (isChip(i) ? getChipArea : getWeaponArea)(i);
		if(area==AREA_POINT || area==AREA_LASER_LINE) tab[i][MAX_AOE]=0;
		if(area==AREA_CIRCLE_1) tab[i][MAX_AOE]=1;
		if(area==AREA_CIRCLE_2) tab[i][MAX_AOE]=2;
		if(area==AREA_CIRCLE_3) tab[i][MAX_AOE]=3;
		tab[i][PT] = (isChip(i) ? getChipCost : getWeaponCost)(i);
		tab[i][CD] = isChip(i) ? getChipCooldown(i) : 0;

	}
	return @tab;
})();

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
				if (isWeapon(arme) && arme != weapon) {
					change_weapon = 1;
				}
				var coutPT = ITEMS[arme][PT];
				if (isChip(arme) && ITEMS[arme][CD]) {
					n = 1;
				} else {
					n = floor(TP / coutPT);
				}
				//ajouter le bon nombre de fois dans les actions 
				for (var o = 1; o <= n; o++) {
					cout[nb_action] = o * ITEMS[arme][PT] + change_weapon;
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


function getTools(leek){
	var tab_damage =[]; 
	var c = 0;
	for (var i in getWeapons(leek)) {
		if (i != WEAPON_FLAME_THROWER && i != WEAPON_GAZOR && i != WEAPON_B_LASER) {
			tab_damage[c] = i;
			c++;
		}
	}
	for (var i in getChips(leek)) {// todo: vérifier les cooldowns
		var effet = getChipEffects(i);
		if (effet[0][0] == EFFECT_DAMAGE && getCooldown(i, leek)<=1) {
			tab_damage[c] = i;
			c++;
		}
	}
	return @tab_damage;
}


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



function getValue(tool, tireur, cible, dist) { //TODO faire le poison
	/*	Tireur et cible sont des tableaux de la forme :*/
	var Leek = 0;
	var AbsoluteShield = 1;
	var RelativeShield = 2;
	var Strenght = 3;
	var RenvoiDegat = 4;
	var Magie = 5; 
	/*								*/

	var degat = [0, 0];
	var degat_renvoyer = 0;
	var volDeVie = 0;


	var aoe = ITEMS[tool][MAX_AOE]==0 ? 1 : 1 - (dist / (2 * ITEMS[tool][MAX_AOE]));
	var effect = (isChip(tool)) ? getChipEffects(tool) : getWeaponEffects(tool);
	var area = (isChip(tool)) ? getChipArea(tool) : getWeaponArea(tool);
	var degatMoyen = 0;
	var degatMin = 0;

	for (var i in effect) {
		if (i[0] == EFFECT_DAMAGE) {
			degatMoyen = (i[1] + i[2]) / 2;
			degatMin = i[1];
			var degatBrutMoyen = aoe * degatMoyen * (1 + tireur[Strenght] / 100);
			var degatBrutMin = aoe * degatMin * (1 + tireur[Strenght] / 100);
			var degatTmp = [0, 0];
			degatTmp[MOYEN] = max(degatBrutMoyen * (1 - cible[RelativeShield] / 100) - cible[AbsoluteShield], 0);
			degatTmp[MIN] = max(degatBrutMin * (1 - cible[RelativeShield] / 100) - cible[AbsoluteShield], 0);

			degat[MOYEN] = degat[MOYEN] + degatTmp[MOYEN];
			degat[MIN] = degat[MIN] + degatTmp[MIN];
			//degat_renvoyer = degat_renvoyer + cible[RenvoiDegat] * degatTmp[MOYEN] / 100;
			//volDeVie = volDeVie + getWisdom(tireur[Leek]) * degatTmp[MOYEN] / 1000;
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