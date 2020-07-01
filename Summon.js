// dernière mise à jour le 29/04/18 par Yama et Caneton
include("IA_Bulbe");
include("Debug");


global bulbeOffensif = [CHIP_ROCKY_BULB: 90, CHIP_ICED_BULB: 120, CHIP_FIRE_BULB: 225, CHIP_LIGHTNING_BULB: 240, CHIP_WIZARD_BULB: 180];
global bulbeDefensif = [CHIP_HEALER_BULB: 300, CHIP_METALLIC_BULB: 270, CHIP_PUNY_BULB: 60];


function getSummonAction(@actions, @cellsAccessible, TPmax, @summon_tools) {
	var nb_action = count(actions);
	for (var tool in summon_tools) {
		if(ERROR_TOOLS[tool]) continue;
		if ( !ALL_INGAME_TOOLS[tool][TOOL_IS_WEAPON] && getCooldown(tool) == 0 && getTP() >= ALL_INGAME_TOOLS[tool][TOOL_PT_COST] && (bulbeOffensif[tool] !== null or bulbeDefensif[tool] !== null or tool === CHIP_RESURRECTION)) {
			var tir;
			if (tool == CHIP_RESURRECTION) {
				tir = resu(cellsAccessible);
			} else {
				if (compteurBulbe() < 6) {
					tir = summonBulb(tool, IA_Collective, getNearestEnemy(), cellsAccessible);
				}
			}
			if ((tir != [] || tir != null)) {
				actions[nb_action] = tir;
				nb_action++;
			}
			debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " => " + tir);
		}
	}
}


function isLeek(entity) {
	return getType(entity) == ENTITY_LEEK;
}


function resu(@cellsAccessible) {
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
	tir[NB_TIR] = 0; // 0 pour ne pas passer dans le useChipOnCell du doAction dans l'ordonnanceur
	tir[CHIP_WEAPON] = CHIP_RESURRECTION;
	tir[PT_USE] = getChipCost(CHIP_RESURRECTION);
	tir[PM_USE] = 0; // Note:  Le calcul est fait dans la callback sans ordonanceur pour la résu, l'action sera faite en premier si on utilise l'ordancement NearestFirst
	tir[EFFECT] = EFFECT_RESURRECT;
	tir[CALLBACK] = (function(param) {
		var cellToResurect;
		if(getMP() > 0) {
			var tab = [];
			for (var cell: var dist in cellsAccessible) push(tab, cell); // Note : on pourrait utiliser la résurection sur plus de cells car il y a une portée
			var map_danger = getDangerMap(tab);
			cellToResurect = getCellToGo(map_danger);
			var cellDeplace = getCellToUseToolsOnCell(CHIP_RESURRECTION, cellToResurect, cellsAccessible);
			moveTowardCell(cellDeplace);
		} else {
			var myCell = getCell();
			var cellsToResurect = [];
			CellsToUseTool(CHIP_RESURRECTION, myCell, cellsToResurect);
			var map_danger = getDangerMap(cellsToResurect);
			cellToResurect = getCellToGo(map_danger);
		}
		var code_return = resurrect(param[0], cellToResurect);
		/* Mise à jour variable global pour pouvoir booster */
		// getOpponent(getAliveEnemies());
		addCoeffEffectLeek(allieToResurrect);
		updateInfoLeeks();
		setBoostCoeff();
		return code_return;
	});
	tir[PARAM] = [allieToResurrect];
	tir[VALEUR] = getTotalLife(allieToResurrect);
	return tir;
}


function summonBulb(CHIP, IA, ennemie, @cellsAccessible) {
	var tir = [];
	tir[CELL_DEPLACE] = -1; // TODO: mettre la cell où il faut se déplacer pour pouvoir faire le summon (si pas besoin de se déplaser : mettre -1)
	tir[VALEUR] = getBulbValue(CHIP, ennemie);
	tir[CHIP_WEAPON] = CHIP;
	tir[NB_TIR] = 0; // 0 pour ne pas passer dans le useChipOnCell du doAction dans l'ordonnanceur
	tir[PT_USE] = ALL_INGAME_TOOLS[CHIP][TOOL_PT_COST] ;
	tir[PM_USE] = tir[CELL_DEPLACE] >= 0 ? cellsAccessible[tir[CELL_DEPLACE]] : 0;
	tir[EFFECT] = EFFECT_SUMMON;
	tir[CALLBACK] = (function(param) { //param = [chip, IA, cellsAccessible]
		// appeler la fonction cache-cache si on veux se cacher avant le summon !
		if (haveOrdonnancement(ORDONNANCEMENT_SUMMON_LAST)) { // alors on se cache
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
		var code_return = summon(param[0], cellOuSummon, param[1]);
  	/* Mise à jour des variables globales pour pouvoir booster et ne pas kill le bulbe */
		var bulbe = getLeekOnCell(cellOuSummon);
		addCoeffEffectBulbe(bulbe);
		updateInfoLeeks();
		getOpponent(getAliveEnemies());
		setBoostCoeff();
		return code_return;
	});
  tir[PARAM] = [CHIP, IA, cellsAccessible];
  return tir;
}

/**
 * initialise tout les coefficients des effets pour le bulbe
 * 0.5 par défaut
 */
function addCoeffEffectBulbe(bulbe) {
	COEFF_LEEK_EFFECT[bulbe] = [];
	for (var effect : var value in ALL_EFFECTS) {
		COEFF_LEEK_EFFECT[bulbe][effect] = 0.5;
	}
	COEFF_LEEK_EFFECT[bulbe][EFFECT_KILL] = getLife(bulbe);
}

/**
 * initialise tout les coefficients des effets pour le bulbe
 * 0.5 par défaut
 */
function addCoeffEffectLeek(leek) {
	COEFF_LEEK_EFFECT[leek] = [];
	for (var effect : var value in ALL_EFFECTS) {
		COEFF_LEEK_EFFECT[leek][effect] = 1;
	}
	COEFF_LEEK_EFFECT[leek][EFFECT_KILL] = getTotalLife(leek);
}

// TODO : Améliorer les coefficients en fonction des situations
function getBulbValue(CHIP, ennemie) {
	var absResistanceEnnemy = getAbsoluteShield(ennemie);
	var relatResistanceEnnemy = getRelativeShield(ennemie);
	var summonnerLife = getLife();
	var hpEnnemie = getLife(ennemie);
	var magieEnnemie = getMagic(ennemie);
	var forceEnnemie = getStrength(ennemie);
	var scienceEnnemie = getScience(ennemie);
	var distance = getPathLength(getCell(), getCell(ennemie));
	var value;
	var isBulbeOffensif = false;
	if (bulbeOffensif[CHIP] !== null) {
		value = bulbeOffensif[CHIP];
		isBulbeOffensif = true;
	} else {
		value = bulbeDefensif[CHIP];
	}
	value += ALL_INGAME_TOOLS[CHIP][TOOL_PT_COST] * 15;
	var countBulbe = compteurBulbe();
	if (!inArray([FIGHT_TYPE_SOLO, FIGHT_TYPE_BATTLE_ROYALE], getFightType())) {
		value /= 2;
	}
	if ((absResistanceEnnemy >= 100 || relatResistanceEnnemy >= 20) && isBulbeOffensif && CHIP != CHIP_WIZARD_BULB ) {
		value /= 2;
	}
	if (hpEnnemie < 0.35 * getTotalLife(ennemie) && isBulbeOffensif) {
		if (distance >= 10 && CHIP == CHIP_FIRE_BULB) {
			value *= 3;
		} else {
			value *= 2;
		}
	}
	if (getScience() >= 400 && compteurBulbeCondition(function (bulbe_id) {
		return inArray([NAME_FIRE_BULB, NAME_ICED_BULB, NAME_LIGHTING_BULB], getName(bulbe_id));
	}) == 0) {
		value *= 10;
	}
	if (summonnerLife <= 0.35 * getTotalLife() && !isBulbeOffensif) {
		value *= 2;
	}
	if (distance >= 15 && !isBulbeOffensif) {
		value *= 2;
	} else {
		value /= 2;
	}
	if (CHIP == CHIP_METALLIC_BULB && count(getEntities(true,  function (entity) {return isSummon(entity) && getName(entity) == NAME_METALLIC_BULB;})) <= 1 && (scienceEnnemie >= 200 || forceEnnemie >= 200 || count(getEntities(false,  function (entity) {return isSummon(entity) && inArray([NAME_FIRE_BULB, NAME_ICED_BULB, NAME_LIGHTING_BULB, NAME_ROCKY_BULB], getName(entity)) ;})) <= 1)  ) {
		value *= 2;
	}
	if (CHIP == CHIP_HEALER_BULB && magieEnnemie >= 300 && count(getEntities(true,  function (entity) {return isSummon(entity) && getName(entity) == NAME_HEALER_BULB;})) <= 1) {
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



function compteurBulbeCondition(condition_callback) {
	var allies = getAliveAllies();
	var nbBulbes = 0;
	for (var allie in allies) {
		if (isSummon(allie) && condition_callback(allie)) nbBulbes++;
	}
	return nbBulbes;
}


function getEntities(teamAllie, condition_callback) {
	return arrayFilter(teamAllie ? getAliveAllies() : getAliveEnemies(), condition_callback);
}

function haveOrdonnancement(ordonancement) {
	return inArray(ORDONNANCEMENT_PERSONNALISE, ordonancement);
}
