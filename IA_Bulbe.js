include("GLOBALS");
include("getArea");
include("getCellToUse");
include("Attaque");
include("Heal");
include("Deplacement");
include("Ciblage");
include("Boost");
include("Ordonnanceur");
include("Communication");
include("Summon");
include("Map de danger");
include("Resistance");

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
	if(getName()=="healer_bulb") bulbe_gerisseur();
	else {
		getOpponent(getAliveEnemies());
		setBoostCoeff();
		if (isSummon(ME)) SCORE[ME] = 1;

		debug("SCORE :");
		for (var cle: var val in SCORE) {
			debug(getName(cle) + " => " + val);
		}
		debug("");
		
		var i = 0;
		var allie = getAliveAllies();
		var nb_allie = count(allie);
		while(i < nb_allie && getCooldown(CHIP_DOPING) == 0) {
			var effect = getEffects(allie[i]);
			var booster = false;
			if (effect != null) {
				for (var j = 0; j < count(effect); j++) {
					if (effect[j][5] == CHIP_DOPING) {
						booster = true;
					}
				}
			}
			if (booster == false && getLife(allie[i]) > 300 && (isSummon(allie[i])) ? getStrength(allie[i]) > 300 : getStrength(allie[i]) > 150) {
				var cell = getCellToUseChip(CHIP_DOPING, allie[i]);
				if (getPathLength(getCell(), cell) <= getMP()) {
					moveTowardCell(cell);
					useChip(CHIP_DOPING, allie[i]);
				}
			}
			i++;
		}
		
		var continu = true;
		while (continu) { // Pour l'instant on ne fait qu'une action 
			var actions = [null]; // 1er élément à null pour le knapsack
			var cellsAccessible = accessible(getCell(), getMP());
			var toutEnnemis = getAliveEnemies();
			var toutAllies = getAliveAllies();
			var tp = getTP();

			getAttackAction(actions, cellsAccessible, toutEnnemis, tp);
			getHealAction(actions, cellsAccessible, toutAllies, tp);
			//getBoostAction(actions, cellsAccessible, toutAllies);
			//getSummonAction(actions, cellsAccessible);
			//TODO : rajouter des actions de heal, shield, summon, entrave, ... tout ce qu'on veut en fait


			var combo = getBestCombo(actions, getTP());
			debug(combo);
			if (combo != []) {
				var action = getActionFromCombo[ORDONNANCEMENT_DEFAULT](combo); // Y a d'autres type d'ordonnancement, choisissez celui que vous préférez (cf ordonnancement)
				doAction(action);
			} else {
				continu = false;
			}
		}
		/*
		var c = 1;
		while (getDistance(getCell(), getCell(getSummoner())) > 3 && getMP() > 0 && c == 1) {
			c = moveToward(getSummoner(), 1);
		}
		if (getPath(getCell(), getCell(getSummoner())) <= 3) {
			moveAwayFrom(getSummoner(), 2);
		}*/
		
		if(getCellDistance(getCell(), getSummoner()) >= 7 and getCellDistance(getCell(), getSummoner()) < getCellDistance(getCell(), getNearestEnemy())){
			moveToward(getSummoner());
		} else {
			var accessibles_cells = getReachableCells(getCell(), getMP());		// Cellules accessibles, array non associatif.
			var cellule = getCell(getSummoner());		// La cell don on doit étre le plus proche
			var map_danger = getDangerMap(accessibles_cells);		// Map de danger v1 ( la v2 consomme trop d'op, pour juste un bulbe )
			moveTowardCell(getNearestCellToGoFromCell(cellule, map_danger));	// Fonction dans l'ia "Deplacements"
			//debug("accessibles_cell : " + accessibles_cells);
			//debug("map_danger : " + map_danger);
			debug("cell ^^ : " + getNearestCellToGoFromCell(cellule, map_danger));
		}
	}
	parler(); // (cf Communication)
	debug(getOperations());
}
