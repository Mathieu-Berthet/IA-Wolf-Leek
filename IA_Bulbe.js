include("Ordonnanceur");
include("Attaque");
include("Heal");
include("MapDangerV1");  // map de danger v1
include("Ciblage");
include("Resistance");
include("Communication");
//include("Deplacements");
include("Booster");
	

	
function IA_Collective() {
	SetupAll();
	if (getName() == 'healer_bulb') {			// bulbe guerisseur
		var combo = [CHIP_DRIP, CHIP_VACCINE, CHIP_CURE, CHIP_BANDAGE];
		for (var action in combo) {
			var ally = getAllyToHeal();
			var accessibles_cells = getReachableCells(getCell(), getMP());
			if (inArray(accessibles_cells, getCellToUseChip(action, ally)) and getCooldown(action) == 0 and getTP() >= getChipCost(action)) {
				moveTowardCell(getCellToUseChip(action, ally));
				useChip(action, ally);
				useChip(action, ally);
			}
		}
	} else if (getName() == 'metallic_bulb') {	// bulbe metallique
		var combo = [CHIP_ARMOR, CHIP_SHIELD, CHIP_WALL, CHIP_SEVEN_LEAGUE_BOOTS];
		for (var action in combo) {
			var ally = getAllyToProtect();
			var accessibles_cells = getReachableCells(getCell(), getMP());
			if (inArray(accessibles_cells, getCellToUseChip(action, ally)) and getCooldown(action) == 0 and getTP() >= getChipCost(action)) {
				moveTowardCell(getCellToUseChip(action, ally));
				useChip(action, ally);
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
			if (getStrength() > 0) {
				getAttackAction(actions, cellsAccessible, toutEnnemis);
			}
			if (getScience() > 0) {
				getBoostAction(actions, cellsAccessible, toutAllies);
			}
			if (getResistance() > 0) {
				getResistanceAction(actions, cellsAccessible, toutAllies, getTP());
			}
			if(getWisdom() > 0) {
				getHealAction(actions, cellsAccessible, toutAllies);
			}
			var combo = getBestCombo(actions, getTP());
			if (combo != []) {
				var action = getActionFromCombo[ORDONNANCEMENT_SCIENCE](combo);
				doAction(action);
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
	var i = -1;
	fill(scores, 0, count(getAliveAllies()));
	for (ally in getAliveAllies()) {
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
	return getAliveAllies()[search(scores, arrayMax(scores))];
}


function getAllyToProtect() {
  var accessibles_cells = getReachableCells(getCell(), getMP());
	var scores = [];
	var ally;
	var i = -1;
	fill(scores, 0, count(getAliveAllies()));
	for (ally in getAliveAllies()) {
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
	return getAliveAllies()[search(scores, arrayMax(scores))];
}
