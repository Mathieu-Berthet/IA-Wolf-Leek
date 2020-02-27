include("Ordonnanceur");
include("Attaque");
include("Heal");
include("MapDangerV1");  // map de danger v1
include("Ciblage");
include("Resistance");
include("Communication");
//include("Deplacements");
include("Boost");



// [Caneton] : c'est ma vieille fonction pour le healer, à vérifier si je la commit
function bulbe_gerisseur() {
	var allie = getAliveAllies();
	var nb_allie = count(allie);
	//Pour le vaccin il faut vérifier que le poireau n'a pas déjà l'effet sur lui
	// Vaccin pour le summoner
	if (getTP() >= 6 && getCooldown(CHIP_VACCINE) == 0) {
		var effect = getEffects(getSummoner());
		var booster = false;
		for (var j = 0; j < count(effect); j++) {
			if (effect[j][5] == CHIP_VACCINE) {
				if (getCooldown(CHIP_VACCINE, effect[j][2]) > 1) {
					booster = true;
				}
			}
		}
		if (booster == false) {
			var cell = getCellToUseChip(CHIP_VACCINE, getSummoner());
			if (getPathLength(cell, getCell()) <= getMP()) {
				moveTowardCell(cell);
				useChip(CHIP_VACCINE, getSummoner());
			}
		}
	}
	// Vaccin pour les alliers
	if (getTP() >= 6 && getCooldown(CHIP_VACCINE) == 0) {
		for (var i = 0; i < nb_allie; i++) {
			var effect = getEffects(allie[i]);
			var booster = false;
			if (effect != null) {
				for (var j = 0; j < count(effect); j++) {
					if (effect[j][5] == CHIP_VACCINE) {
						booster = true;
					}
				}
			}
			if (booster == false && getLife(allie[i]) < 0.75 * getTotalLife(allie[i]) && getCooldown(CHIP_VACCINE) == 0) {
				var cell = getCellToUseChip(CHIP_VACCINE, allie[i]);
				if (getPathLength(getCell(), cell) <= getMP()) {
					moveTowardCell(cell);
					useChip(CHIP_VACCINE, allie[i]);
				}
			}
		}
	}



	var i = 0;
	while (getCooldown(CHIP_CURE) == 0 && i < count(allie) && getTP() >= 4) {
		var chip = getChips(allie[i]);
		if (getLife(allie[i]) < getTotalLife(allie[i]) - 70) {
			var cell = getCellToUseChip(CHIP_CURE, allie[i]);
			if (getPathLength(getCell(), cell) <= getMP()) {
				moveTowardCell(cell);
				useChip(CHIP_CURE, allie[i]);
			}
		}
		i++;
	}

	while (getCooldown(CHIP_DRIP) == 0 && i < count(allie) && getTP() >= 5) {
		if (getLife(allie[i]) < getTotalLife(allie[i]) - 70 && getLeek() != allie[i]) {
			var cell = getCellToUseChip(CHIP_DRIP, allie[i]);
			if (getPathLength(getCell(), cell) <= getMP()) {
				moveTowardCell(cell);
				useChip(CHIP_DRIP, allie[i]);
			}
		}
		i++;
	}

	i = 0;
	while (getCooldown(CHIP_BANDAGE) == 0 && i < count(allie) && getTP() >= 2) {
		var chip = getChips(allie[i]);
		if (getLife(allie[i]) != getTotalLife(allie[i])) {
			var cell = getCellToUseChip(CHIP_BANDAGE, allie[i]);
			if (getPathLength(getCell(), cell) <= getMP()) {
				moveTowardCell(cell);
				useChip(CHIP_BANDAGE, allie[i]);
			}
		}
		i++;
	}

	//Déplacement
	var c = 1;
	while (getDistance(getCell(), getCell(getSummoner())) > 3 && getMP() > 0 && c == 1) {
		c = moveToward(getSummoner(), 1);
	}
	if (getPath(getCell(), getCell(getSummoner())) <= 3) {
		moveAwayFrom(getSummoner(), 2);
	}
}





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
				var action = getActionFromCombo[ORDONNANCEMENT_DEFAULT](combo); // Y a d'autres type d'ordonnancement, choisissez celui que vous préférez (cf ordonnancement)
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
