// dernière mise à jour le 29/04/18 par Yama et Caneton
include("GLOBALS");
include("getCellToUse");
include("IA_Bulbe");
include("MapDangerV1");


global bulbeOffensif = [CHIP_ROCKY_BULB: 90, CHIP_ICED_BULB: 120, CHIP_FIRE_BULB: 225, CHIP_LIGHTNING_BULB: 240];
global bulbeDefensif = [CHIP_HEALER_BULB: 300, CHIP_METALLIC_BULB: 270, CHIP_PUNY_BULB: 60];


function getSummonAction(@actions, @cellsAccessible, TPmax) {
	var nb_action = count(actions);
	for (var chip in SummonTools) {
		if (isChip(chip) && getCooldown(chip) == 0 && getTP() >= getChipCost(chip) && (bulbeOffensif[chip] !== null or bulbeDefensif[chip] !== null or chip === CHIP_RESURRECTION)) {
			var tir;
			if (chip == CHIP_RESURRECTION) {
				tir = resu( /*param*/ );
			} else {
				if (compteurBulbe() < 6) {
					tir = summonBulb(chip, IA_Collective, getNearestEnemy(), cellsAccessible);
				}
			}
			if ((tir != [] || tir != null)) {
				actions[nb_action] = tir;
				nb_action++;
			}
			debug(getChipName(chip) + " => " + tir);
		}
	}
}


function isLeek(entity) {
	return getType(entity) == ENTITY_LEEK;
}


function resu() {
	var alliesDead = getDeadAllies();
	var allieDead = arrayFilter(alliesDead, isLeek);
	var isScience = [];
	var isStrength = [];
	var isMagic = [];
	var priority = [];
	if (allieDead == null || !count(allieDead)) return null;
	for (var leek in allieDead)
	{
		priority[leek] = 0;
		if(getScience(leek) > 300) isScience[leek] = true;
		if(getStrength(leek) > 200) isStrength[leek] = true;
		if(getMagic(leek) > 200) isMagic[leek]= true;
		if(isScience[leek]) priority[leek] += _RESU_PRIORITY["science"];
		if(isStrength[leek]) priority[leek] += _RESU_PRIORITY["strength"];
		if(isMagic[leek]) priority[leek] += _RESU_PRIORITY["magic"];
	}
	var allieToResurrect = allieDead[0];
	for (var allie = 1; allie < count(allieDead); allie++)
	{
		if (priority[allie] > priority[allieToResurrect])
		{
			allieToResurrect = allieDead[allie];
		}
	}
	var tir = [];
	tir[CELL_DEPLACE] = -1; // TODO: mettre la cell où il faut se déplacer pour pouvoir faire le summon (si pas besoin de se déplaser : mettre -1)
	tir[NB_TIR] = 0;
	tir[PT_USE] = getChipCost(CHIP_RESURRECTION);
	tir[EFFECT] = EFFECT_RESURRECT;
	tir[CALLBACK] = function(param) {
	resurrect(param[0], getSaferCell());
	/* Mise à jour variable global pour pouvoir booster */
	getOpponent(getAliveEnemies());
	setBoostCoeff();
	};
	tir[PARAM] = [allieToResurrect];
	tir[VALEUR] = getTotalLife(allieToResurrect);
	return tir;
}


function summonBulb(CHIP, IA, ennemie, @cellsAccessible) {
	var tir = [];
	tir[CELL_DEPLACE] = -1; // TODO: mettre la cell où il faut se déplacer pour pouvoir faire le summon (si pas besoin de se déplaser : mettre -1)
	tir[VALEUR] = getBulbValue(CHIP, ennemie);
	tir[NB_TIR] = 0;
	tir[PT_USE] = getChipCost(CHIP);
	tir[EFFECT] = EFFECT_SUMMON;
	tir[CALLBACK] = (function(param) { //param = [chip, IA, cellsAccessible]
		// appeler la fonction cache-cache si on veux se cacher avant le summon !
		if (getTP() - tir[PT_USE] < 4) { // alors on se cache
			var tab = [];
			for (var cell: var dist in cellsAccessible) push(tab, cell);
			var cellCache = getCellToGo(getDangerMap(tab));
			moveTowardCell(cellCache);
			CACHER = true;
		}
		var allCells = [];
		CellsToUseTool(param[0], getCell(), allCells);
		var cellOuSummon = allCells[0];

		var maCell = getCell();
		if(bulbeDefensif[param[0]] || param[0]==CHIP_LIGHTNING_BULB) {
			var cellEne = getCenterOfGravity(getAliveEnemies());
			var distMax = getCellDistance(cellEne, allCells[0]);
			for (var cell in allCells) {
				var dist = getCellDistance(cell, cellEne);
				if(dist > distMax && lineOfSight(maCell, cell)) {
					distMax = dist;
					cellOuSummon = cell;
				}
			}
		}
		// TODO: recupérer le code d'erreur en cas d'échec => pas de cell pour summon => boucle infini
		summon(param[0], cellOuSummon, param[1]);
  	/* Mise à jour des variables globales pour pouvoir booster et ne pas kill le bulbe */
		updateInfoLeeks();
		getOpponent(getAliveEnemies());
		setBoostCoeff();
	});
  tir[PARAM] = [CHIP, IA, cellsAccessible];
  return tir;
}


//Si vous voyez d'autres situations à distinguer, dites le, j'en vois plus pour l'instant
function getBulbValue(CHIP, ennemie) {
	var absResistance = getAbsoluteShield(ennemie);
	var relatResistance = getRelativeShield(ennemie);
	var hp = getLife();
	var hpEnnemie = getLife(ennemie);
	var distance = getPathLength(getCell(), getCell(ennemie));
	var value;
	var Attaque = 0;
	if (bulbeOffensif[CHIP] !== null) {
		value = bulbeOffensif[CHIP];
		Attaque = 1;
	} else {
		value = bulbeDefensif[CHIP];
	}
	value += getChipCost(CHIP) * 15;
	var countBulbe = compteurBulbe();
	if (getFightType() !== FIGHT_TYPE_SOLO and getFightType() !== FIGHT_TYPE_BATTLE_ROYALE) {
		value /= 2;
	}
	if ((absResistance >= 100 or relatResistance >= 20) and Attaque == 1) {
		value /= 2;
	}
	if (hpEnnemie < 0.35 * getTotalLife(ennemie) and Attaque == 1) {
		if (distance >= 10 and CHIP == CHIP_FIRE_BULB) {
			value *= 3;
		} else {
			value *= 2;
		}
	}
	if (getScience() >= 400 and countBulbe == 0) {
		value *= 10;
	}
	if (hp <= 0.35 * getTotalLife() and Attaque == 0) {
		value *= 2;
	}
	if (distance >= 15 and Attaque == 0) {
		value *= 2;
	} else {
		value /= 2;
	}
	if (hp >= 0.90 * getTotalLife() and CHIP == CHIP_METALLIC_BULB) {
		value *= 2;
	}
	value *= (1 / (countBulbe / 4 + 0.5));
	return value;
}


function compteurBulbe() {
	var allies = getAliveAllies();
	var nbBulbes = 0;
	for (var allie in allies) {
		if (isSummon(allie)) nbBulbes++;
	}
	return nbBulbes;
}
