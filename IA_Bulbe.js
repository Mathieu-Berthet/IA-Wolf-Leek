include("Ordonnanceur");
include("Attaque");
include("Heal");
include("MapDangerV1");  // map de danger v1
include("Ciblage");
include("Resistance");
include("Communication");
//include("Deplacements");
include("Boost");
include("Debug");



function IA_Collective() {
	ME = getLeek();
	var bulb_attack_tools = [] ;
	var bulb_shield_tools = [] ;
	var bulb_heal_tools = [] ;
	var bulb_boost_tools = [] ;
	var bulb_tactics_tools = [] ;
	var bulb_summon_tools = [] ; // cette variable sert juste pour faire marcher la fonction setuptools, un bulbe ne pourra jamais invoquer un autre bulbe... sauf si pilow devient fou x)
	SetupTools( bulb_attack_tools , bulb_shield_tools , bulb_heal_tools , bulb_boost_tools , bulb_tactics_tools , bulb_summon_tools ) ;
	if (getName() == 'healer_bulb') {			// bulbe guerisseur
		var combo = [CHIP_DRIP, CHIP_VACCINE, CHIP_CURE, CHIP_BANDAGE];
		for (var action in combo) {
			var ally = getAllyToHeal();
			var accessibles_cells = getReachableCells(getCell(), getMP());
			if (inArray(accessibles_cells, getCellToUseChip(action, ally)) and getCooldown(action) == 0 and getTP() >= ALL_INGAME_TOOLS[action][TOOL_PT_COST]) {
				moveTowardCell(getCellToUseChip(action, ally));
				useChip(action, ally);
			}
		}
	} else if (getName() == 'metallic_bulb') {	// bulbe metallique
		var combo = [CHIP_ARMOR, CHIP_SHIELD, CHIP_WALL, CHIP_SEVEN_LEAGUE_BOOTS];
		for (var action in combo) {
			var ally = getAllyToProtect();
			var accessibles_cells = getReachableCells(getCell(), getMP());
			if (inArray(accessibles_cells, getCellToUseChip(action, ally)) and getCooldown(action) == 0 and getTP() >= ALL_INGAME_TOOLS[action][TOOL_PT_COST]) {
				moveTowardCell(getCellToUseChip(action, ally));
				useChip(action, ally);
			}
		}
	} else {	// tous les autres bulbes
		if (getScience() > 0) {
			setBoostCoeff();
		}
		var continu = true;
		while (continu) {
			var actions = [null];
			var cellsAccessible = accessible(getCell(), getMP());
			var toutEnnemis = getAliveEnemies();
			var toutAllies = getAliveAllies();
			if (getStrength() > 0 || getMagic() > 0) {
				getAttackAction(actions, cellsAccessible, toutEnnemis, getTP(), bulb_attack_tools);
			}
			if (getScience() > 0) {
				getBoostAction(actions, cellsAccessible, toutAllies, toutEnnemis, getTP(), bulb_boost_tools);
			}
			if (getResistance() > 0) {
				getResistanceAction(actions, cellsAccessible, toutAllies, getTP(), bulb_shield_tools);
			}
			if(getWisdom() > 0) {
				getHealAction(actions, cellsAccessible, toutAllies, toutEnnemis, getTP(), bulb_heal_tools);
			}
			var combo = getBestCombo(actions, getTP());
			if (combo != []) {
				var action = getActionFromCombo[ORDONNANCEMENT_PERSONNALISE[ORDONANCEMENT_START]]](combo);
				var isUseSucess = doAction(action);
				if(!isUseSucess) {
					debugEP('Action non effectué : ' + action + '\n Attention à la boucle infinie');
					// TODO : mettre en place un mécanisme pour ne pas refaire la même action
					ERROR_TOOLS[action[CHIP_WEAPON]] = true;
				}
			} else {
				continu = false;
			}
		}
	}
	if(getCellDistance(getCell(), getSummoner()) >= 7 and getCellDistance(getCell(), getSummoner()) < getCellDistance(getCell(), getNearestEnemy())){
		moveToward(getSummoner());
	} else {
		var accessibles_cells = getReachableCells(getCell(), getMP());		// Cellules accessibles, array non associatif.
		var cellule = getCell(getSummoner());		// La cell don on doit étre le plus proche
		var map_danger = getDangerMap(accessibles_cells);		// Map de danger v1 ( la v2 consomme trop d'op, pour juste un bulbe )
		moveTowardCell(getNearestCellToGoFromCell(cellule, map_danger));	// Fonction dans l'ia "Deplacements"
	}
  //Solution temporaire by Rayman :
  //moveTowardCell(getCenterOfGravity(getAliveAllies()));
	parler();
}




/// Fonctions necessaires pour le healer et le metallic \\\

function getAllyToHeal() {
	var scores = [];
	var ally;
	var alive_allies = getAliveAllies() ;
	var i = -1;
	fill(scores, 0, count(alive_allies));
	for (ally in alive_allies) {
		i = i + 1;
		if (getType(ally) == ENTITY_LEEK) {
			scores[i] = scores[i] + 1;
		}
		if (ally == getSummoner() and getLife(ally) < getTotalLife(ally)) {
			scores[i] = scores[i] + 7;
		}
		if (ally == getLeek()) {
			scores[i] = scores[i] - 1;
		}

		if (getCellDistance(getCell(), getCell(ally)) <= 3) {scores[i] = scores[i] + 2;}
		if (getCellDistance(getCell(), getCell(ally)) <= 6) {scores[i] = scores[i] + 1;}
		if (getCellDistance(getCell(), getCell(ally)) <= 9) {scores[i] = scores[i] + 1;}
		if (getCellDistance(getCell(), getCell(ally)) <= 12) {scores[i] = scores[i] + 1;}
		if (inArray(getEffects(ally), EFFECT_HEAL)) {scores[i] = scores[i] - 1;}
		if (getLife(ally) < getTotalLife(ally)) {
			scores[i] = scores[i] + 3;
		} else {
			scores[i] = scores[i] - 5;
		}
		scores[i] = scores[i] + 1 - (getLife(ally) / getTotalLife(ally)) * 5;
	}
	return alive_allies[search(scores, arrayMax(scores))];
}


function getAllyToProtect() {
  var accessibles_cells = getReachableCells(getCell(), getMP());
	var scores = [];
	var ally;
	var alive_allies = getAliveAllies() ;
	var i = -1;
	fill(scores, 0, count(alive_allies));
	for (ally in alive_allies) {
		i = i + 1;
		if (getType(ally) == ENTITY_LEEK) {
			scores[i] = scores[i] + 1;
		}
		if (ally == getSummoner()) {
			scores[i] = scores[i] + 2;
		}
		if (inArray(accessibles_cells, getCellToUseChip(CHIP_SHIELD, ally))) {scores[i] = scores[i] + 3;}
		if (inArray(accessibles_cells, getCellToUseChip(CHIP_WALL, ally))) {scores[i] = scores[i] + 2;}
		if (ally == getLeek()) {scores[i] = scores[i] - 1;}
		scores[i] = scores[i] - (getAbsoluteShield(ally) + getRelativeShield(ally)) / 70;
		scores[i] = scores[i] + 1 - (getLife(ally) / getTotalLife(ally)) * 6;
		scores[i] = scores[i] - (getDistance(getCell(ally), getCell(getNearestEnemy()))/3);
	}
	return alive_allies[search(scores, arrayMax(scores))];
}
