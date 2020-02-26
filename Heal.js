// dernière mise à jour le 17/02/18 par Caneton
include("GLOBALS");
include("getCellToUse");
include("getArea");


/*
	TODO : 	
  				- faire le "heal de zone"
          - Ajuster le SCORE_HEAL dans les globales
*/


function getHealAction(@actions, @cellsAccessible, Allies, Ennemies) 
{
	var nb_action = count(actions);
	for (var chip in HealTools) 
	{
		if ((isWeapon(chip) && (getTP() >= getWeaponCost(chip) + 1 || getTP() == getWeaponCost(chip) && getWeapon() == chip)) || (isChip(chip) && getCooldown(chip) == 0 && getTP() >= getChipCost(chip))) 
		{
			var effect = getChipEffects(chip);
			if ((effect[0][0] == EFFECT_HEAL || effect[0][0] == EFFECT_BOOST_MAX_LIFE) || chip == WEAPON_B_LASER) 
			{
				var tir;
				if(chip==WEAPON_B_LASER) 
				{
					var cellToCheck = getCellsToCheckForLaser(cellsAccessible, getAliveAllies());
			 		tir = healTypeLigne(chip, cellToCheck, cellsAccessible);
				} 
				else 
				{
					tir = soigner(chip, Allies, cellsAccessible, Ennemies);
				}
				if ((tir != [] || tir != null) && tir[VALEUR] > 15) // au moins 15 de dégats (en moyenne)
				{
					tir[CHIP_WEAPON] = chip;
					var coutPT;
					var valeur = tir[VALEUR];
					var n;
					var change_weapon = 0;
					if (isWeapon(tir[CHIP_WEAPON]) && tir[CHIP_WEAPON] != getWeapon()) {
						change_weapon = 1;
					}
					coutPT = (isWeapon(tir[CHIP_WEAPON])) ? getWeaponCost(tir[CHIP_WEAPON]) : getChipCost(tir[CHIP_WEAPON]);
					if (isChip(tir[CHIP_WEAPON]) && getChipCooldown(tir[CHIP_WEAPON])) {
						n = 1;
					} else {
						n = 1 /*floor(getTP() / coutPT)*/;
					}
					//ajouter le bon nombre de fois dans les actions 
					for (var o = 1; o <= n; o++) {
						tir[NB_TIR] = o;
						tir[PT_USE] = o * coutPT + change_weapon;
						tir[VALEUR] = o * valeur;
						tir[EFFECT] = isChip(chip) ? getChipEffects(chip)[0][0] : EFFECT_HEAL;
						actions[nb_action] = tir;
						nb_action++;
					}
				}
			}
		}
	}
}


function healTypeLigne(tool, @cellToCheck, @cellsAccessible) {
	var ope = getOperations();
	var from = 0;
	var withOrientation = 1;

	var orientation = [-17, 17, -18, 18];
	//var tabResultat = [];

	//var tireur = [getLeek(), null, null, getStrength(), null];
	//var cible;
	var heal = 0;
	var degat = 0;
	var boostMaxLife = 0;

	var valeurMax = 0;
	var distanceBestAction = 100;
	var bestAction = [];
	var area = [];
	for (var cell in cellToCheck) {
		if (lineOfSight(cell[from], cell[from] + MIN_RANGE[tool] * orientation[cell[withOrientation]], ME)) {
			var cell_affecter = getAreaLine(tool,cell[from], cell[withOrientation]);
			var sommeHeal = 0;
			var killAllie = false;
			for (var i in cell_affecter) {
				if (getCellContent(i) == 1) {
					var leek = getLeekOnCell(i);
					if (leek != getLeek()) {
						healVal(tool, leek, null, heal, boostMaxLife, degat, area);
						var team = (isAlly(leek)) ? 1 : -1;
						heal = heal - degat;
						sommeHeal += team * SCORE[leek] * heal;
						if(degat>getLife(leek)&&isAlly(leek)) killAllie = true;
					}
				}
			}
			if (!killAllie && (sommeHeal > valeurMax || sommeHeal == valeurMax && cellsAccessible[cell[from]] < distanceBestAction)) {
				bestAction[CELL_DEPLACE] = cell[from];
				bestAction[CELL_VISE] = cell[from] + MIN_RANGE[tool]* orientation[cell[withOrientation]];
				bestAction[VALEUR] = sommeHeal;
				valeurMax = sommeHeal;
				distanceBestAction = cellsAccessible[cell[from]];
			}
		}
	}
	debug(getWeaponName(tool) + " : " + bestAction + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}


function soigner(tool, allies, @cellsAccessible, ennemies) { // pour les puces de soins sans AOE
	var ope = getOperations();
	var cell_deplace;
	var cellAllie;
	var cellEnnemie;
	var bestAction = [];
	var action;
	var valeur;
	var bestValeur = 0;
	var distanceBestAction = 0;
	var area = [];
	for(var ennemie in ennemies)
	{
		var eff = getChipEffects(tool)[0];
		var targets = eff[TARGETS];
		if (((targets & EFFECT_TARGET_SUMMONS) && isSummon(ennemie)) || ((targets & EFFECT_TARGET_NON_SUMMONS) && !isSummon(ennemie))) 
		{
      		if(!(MIN_RANGE[tool] != 0)) 
			{
				cellEnnemie = getCell(ennemie);
				cell_deplace = getCellToUseToolsOnCell(tool, cellEnnemie, cellsAccessible);
				if(tool == CHIP_VAMPIRIZATION)
				{
					area = getChipEffectiveArea(tool, cellAllie);
				}
				if (cell_deplace != -2) 
				{ //la cellule doit être atteignable
					var heal, boostMaxLife, dammage;
					healVal(tool, ennemie, null, heal, boostMaxLife, dammage, area);
					var coeff = SCORE_BOOST[ennemie][eff[TYPE]];
					if(coeff===null) 
					{
						debugE("["+getChipName(tool)+"]Pas de valeur pour : "+ eff[TYPE]);
					}
					valeur = coeff*(heal);
					if (valeur > bestValeur || valeur == bestValeur && cellsAccessible[cell_deplace] < distanceBestAction) 
					{
						if(getLeekOnCell(cellEnnemie)!=ME) 
						{
						  bestAction[CELL_DEPLACE] = -1;
						  bestAction[CELL_VISE] = -1;
						} 
						else 
						{
						  bestAction[CELL_DEPLACE] = cell_deplace;
						  bestAction[CELL_VISE] = cellEnnemie;
						}
						bestAction[VALEUR] = valeur;
						distanceBestAction = cellsAccessible[cell_deplace];
						bestValeur = valeur;
					}
				}
			}
		}
	}
	
	
	
	for (var allie in allies) {
		var targets = getChipEffects(tool)[0][TARGETS];
		if (((targets & EFFECT_TARGET_SUMMONS) && isSummon(allie)) || ((targets & EFFECT_TARGET_NON_SUMMONS) && !isSummon(allie))) 
		{
			if (!(MIN_RANGE[tool] != 0 && allie == ME)) 
			{
				if(!NOT_USE_ON[tool][allie]) 
				{
					cellAllie = getCell(allie);
					cell_deplace = getCellToUseToolsOnCell(tool, cellAllie, cellsAccessible);
					if (cell_deplace != -2) { //la cellule doit être atteignable
						var heal, boostMaxLife, dammage;
						healVal(tool, allie, null, heal, boostMaxLife, dammage, area);
						
						if(MINIMUM_TO_USE[tool]===null || MINIMUM_TO_USE[tool]<= heal) {
							valeur = SCORE_HEAL[allie] * (boostMaxLife + heal);
							if (valeur > bestValeur || valeur == bestValeur && cellsAccessible[cell_deplace] < distanceBestAction) {
								if (getLeekOnCell(cellAllie) == ME) {
									bestAction[CELL_DEPLACE] = -1;
									bestAction[CELL_VISE] = -1;
								} else {
									bestAction[CELL_DEPLACE] = cell_deplace;
									bestAction[CELL_VISE] = cellAllie;
								}
								bestAction[VALEUR] = valeur;
								distanceBestAction = cellsAccessible[cell_deplace];
								bestValeur = valeur;
							}
						}
					}
				}
			}
		}
	}
	debug((isChip(tool) ? getChipName(tool) : getWeaponName(tool)) + " : " + bestAction + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}

function healVal(tool, leek, coeffReduction, @heal, @boostMaxLife,@dammage, area){
	heal = 0; boostMaxLife = 0; dammage = 0;
	var effects = isChip(tool) ? getChipEffects(tool) : getWeaponEffects(tool);
	var sagesse = getWisdom();
	if(coeffReduction === null || coeffReduction > 1 || coeffReduction < 0.5) coeffReduction = 1;
	
	for (var effect in effects) {
		var valMoyen = (effect[MIN] + effect[MAX]) / 2;
		if(effect[TYPE]==EFFECT_HEAL) 
		{
			if(tool == CHIP_VAMPIRIZATION)
			{
				var nbCibles = 0;
				if(area != [])
				{
					for(var cell in area)
					{
						if(getCellContent(cell) == 1)
						{
							var leekCible = getLeekOnCell(cell);
							if(isEnemy(leekCible))
							{
								nbCibles++;
							}
						}
					}
				}
				heal = min(coeffReduction*valMoyen*nbCibles, coeffReduction*valMoyen);
			}
			else
			{
				heal = min(coeffReduction*valMoyen*(1+sagesse/100),(getTotalLife(leek)-getLife(leek)));
			}
			
		} if(effect[TYPE]==EFFECT_DAMAGE) {
			dammage = max(0,effect[MAX]*(1+getStrength()/100)*(1-getRelativeShield(leek))-getAbsoluteShield(leek));
		} if(effect[TYPE]==EFFECT_BOOST_MAX_LIFE) {
			boostMaxLife = valMoyen*(1+sagesse/100);
		}
	}
}