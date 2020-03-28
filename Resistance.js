// dernière mise à jour le 17/02/18 par Caneton
include("Attaque");
include("Debug");


function getResistanceAction(@actions, @cellsAccessible, Allies, TPmax, @shield_tools) {
	var nb_action = count(actions);
	for(var tool in shield_tools) {
		if(ERROR_TOOLS[tool]) continue;
		if ( can_use_tool( tool , TPmax ) == true ) {
			var tir;
			if(tool == WEAPON_J_LASER) {
				var cellToCheck = getCellsToCheckForLaser(cellsAccessible, Allies + getAliveEnemies());
				tir = shieldTypeLigne(tool, cellToCheck, cellsAccessible);
			} else {
				tir = proteger(tool, Allies, cellsAccessible);
			}

			if ((tir != [] || tir != null) && tir[VALEUR] > 15) {
				tir[CHIP_WEAPON] = tool;
				var valeur = tir[VALEUR];
				var change_weapon =  ( ALL_INGAME_TOOLS[tool][TOOL_IS_WEAPON] && tool != getWeapon()) ? 1 : 0;
				var coutPT = ALL_INGAME_TOOLS[tool][TOOL_PT_COST] ;
				var n = (ALL_INGAME_TOOLS[tool][TOOL_COOLDOWN_TIME]) ? 1 : floor(TPmax / coutPT);
				
				//ajouter le bon nombre de fois dans les actions
				for (var o = 1; o <= n; o++) {
					tir[NB_TIR] = o;
					tir[PT_USE] = o * coutPT + change_weapon;
					tir[VALEUR] = o * valeur;
					tir[EFFECT] = ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][0][TOOL_EFFECT_TYPE] ;
					tir[CALLBACK] = (function (leek) {
						INFO_LEEKS[leek][ABSOLUTE_SHIELD] = getAbsoluteShield(leek);
						INFO_LEEKS[leek][RELATIVE_SHIELD] = getRelativeShield(leek);
					});
					tir[PARAM] = tir[CELL_VISE] == -1 ? getLeek() : getLeekOnCell(tir[CELL_VISE]);
					actions[nb_action] = tir;
					nb_action++;
				}
			}
		}
	}
}

function shieldTypeLigne(tool, @cellToCheck, @cellsAccessible)
{
	var ope = getOperations();
	var from = 0;
	var withOrientation = 1;

	var orientation = [-17, 17, -18, 18];

	var absoluteVulne = 0;
	//var absoluteShield = 0;

	var valeurMax = 0;
	var distanceBestAction = 100;
	var bestAction = [];

	for (var cell in cellToCheck)
	{
		if (lineOfSight(cell[from], cell[from] + MIN_RANGE[tool] * orientation[cell[withOrientation]], ME))
		{
			var cell_affecter = getAreaLine(tool,cell[from], cell[withOrientation]);
			var sommeShield = 0;
			for (var i in cell_affecter)
			{
				if (getCellContent(i) == CELL_PLAYER)
				{
					var leek = getLeekOnCell(i);
					if (leek != getLeek())
					{
						absoluteVulne += ResistVal(tool, leek);
						var team = (isAlly(leek)) ? 0.5 : 1;
						absoluteVulne += team * SCORE[leek];
					}
				}
			}
			if ((absoluteVulne > valeurMax || absoluteVulne == valeurMax && cellsAccessible[cell[from]] < distanceBestAction))
			{
				bestAction[CELL_DEPLACE] = cell[from];
				bestAction[CELL_VISE] = cell[from] + MIN_RANGE[tool]* orientation[cell[withOrientation]];
				bestAction[VALEUR] = absoluteVulne;
				valeurMax = absoluteVulne;
				distanceBestAction = cellsAccessible[cell[from]];
			}
		}
	}
	debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + bestAction + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}

function haveffect(leek,tool) {
	var effs = getEffects(leek);
	for (var eff in effs) {
		if(eff[ITEM_ID]==tool) {
			return true;
		}
	}
	return false;
}


function proteger(tool, allies, @cellsAccessible) {// pour les puces de shield sans AOE
	var ope = getOperations();
	var cell_deplace;
	var cellAllie;
	var bestAction = [];
	var action;
	var valeur;
	var bestValeur = 0;
	var distanceBestAction = 0;
	for (var allie in allies) {
		if ((ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][0][TOOL_TARGET_SUMMONS] && isSummon(allie)) || (ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][0][TOOL_TARGET_NON_SUMMONS] && !isSummon(allie))) {
			if (!(MIN_RANGE[tool] != 0 && allie == ME)) {
				if(!NOT_USE_ON[tool][allie]) {
					if(!haveffect(allie,tool)) {
						cellAllie = getCell(allie);
						cell_deplace = getCellToUseToolsOnCell(tool, cellAllie, cellsAccessible);
						if (cell_deplace != -2) { //la cellule doit être atteignable
							var resist = ResistVal(tool, allie);
							valeur = SCORE_RESISTANCE[allie]*(resist);
							if (valeur > bestValeur || valeur == bestValeur && cellsAccessible[cell_deplace] < distanceBestAction) {
								if(getLeekOnCell(cellAllie)==ME) {
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
	debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + bestAction + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}

function ResistVal(tool, leek){
	var effects = ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS];
	var resistance = getResistance();
	var agility = getAgility();
	for (var effect in effects) {
		var valMoyen = effect[TOOL_AVERAGE_POWER] ;
		if(effect[TOOL_EFFECT_TYPE] == EFFECT_RELATIVE_SHIELD || effect[TOOL_EFFECT_TYPE] == EFFECT_ABSOLUTE_SHIELD) {
			if(dangerousEnnemis===null) {
				findDangerousEnnemis();
				bestWeapon = getBestWeapon(dangerousEnnemis);
			}
			var degat = [0,0];
			var degat2 = [0,0];
			var null1,null2;
			pvLost(INFO_LEEKS[dangerousEnnemis], INFO_LEEKS[leek], bestWeapon, null, degat, null1, null2);
			var sans = degat[MOYEN];
			var clone = INFO_LEEKS[leek];
			effect[TOOL_EFFECT_TYPE] == EFFECT_ABSOLUTE_SHIELD ? clone[1]+=valMoyen*(1+resistance/100) : clone[2]+=valMoyen*(1+resistance/100); // Suppose que l'on a pas déjà la puce /!\ 
			pvLost(INFO_LEEKS[dangerousEnnemis], clone, bestWeapon, null, degat2, null1, null2);
			var avec = degat2[MOYEN];
			var bonus = sans - avec;
			return 3*bonus; // TODO: ajuster le coeff
		}
		if(effect[TOOL_EFFECT_TYPE]==EFFECT_DAMAGE_RETURN) {
			var renvois = valMoyen*(1+agility/100) * effect[TOOL_NUMBER_TURN_EFFECT_LAST];
	 		return 3*renvois;
		}
		if(effect[TOOL_EFFECT_TYPE] == EFFECT_ABSOLUTE_VULNERABILITY || effect[TOOL_EFFECT_TYPE] == EFFECT_STEAL_ABSOLUTE_SHIELD)
		{
			var vulne = valMoyen * effect[TOOL_NUMBER_TURN_EFFECT_LAST];
			//TO continue. Because first effect will give a negative value, and the other, the same value but in positive. So value will became 0 at the end.
			return 3*vulne;
		}
    }
}




