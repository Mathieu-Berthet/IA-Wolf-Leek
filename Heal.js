// dernière mise à jour le 17/02/18 par Caneton
include("getArea");
include("getCellToUse");
include("Debug");



/*
	TODO : 	
  				- faire le "heal de zone"
          - Ajuster le SCORE_HEAL dans les globales
*/


function getHealAction(@actions, @cellsAccessible, Allies, Ennemies, TPmax, @heal_tools) 
{
	var nb_action = count(actions);
	var toutPoireau = Allies + Ennemies;
	for (var tool in heal_tools) 
	{
		if(ERROR_TOOLS[tool]) continue;
		var tir = [];
		if ( can_use_tool( tool , TPmax ) ) 
		{
			var area = ALL_INGAME_TOOLS[tool][TOOL_AOE_TYPE] ;
			if(area == AREA_POINT)
			{
				tir = soigner(tool, Allies, cellsAccessible);
			}
			else
			{
				if(tool == WEAPON_B_LASER) 
				{
					var cellToCheck = getCellsToCheckForLaser(cellsAccessible, getAliveAllies());
			 		tir = healTypeLigne(tool, cellToCheck, cellsAccessible);
				} 
				else 
				{
					tir = healTypeAOE(toutPoireau, tool, cellsAccessible);
				}
			}
			if ((tir != [] || tir != null) && tir[VALEUR] > 15) // au moins 15 de dégats (en moyenne)
			{
				tir[CHIP_WEAPON] = tool;
				var coutPT;
				var valeur = tir[VALEUR];
				var n;
				var change_weapon = 0;
				if (ALL_INGAME_TOOLS[tool][TOOL_IS_WEAPON] && tool != getWeapon()) {
					change_weapon = 1;
				}
				coutPT = ALL_INGAME_TOOLS[tool][TOOL_PT_COST] ;
				if (ALL_INGAME_TOOLS[tool][TOOL_COOLDOWN_TIME]) {
					n = 1;
				} else {
					n = floor(getTP() / coutPT);
				}
				//ajouter le bon nombre de fois dans les actions 
				for (var o = 1; o <= n; o++) {
					tir[NB_TIR] = o;
					tir[PT_USE] = o * coutPT + change_weapon;
					tir[VALEUR] = o * valeur;
					tir[EFFECT] = !ALL_INGAME_TOOLS[tool][TOOL_IS_WEAPON] ? ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][0][TOOL_EFFECT_TYPE] : EFFECT_HEAL;
					actions[nb_action] = tir;
					nb_action++;
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
	
	var nbCibles = 0;
	
	var valeurMax = 0;
	var distanceBestAction = 100;
	var bestAction = [];

	for (var cell in cellToCheck) {
		if (lineOfSight(cell[from], cell[from] + MIN_RANGE[tool] * orientation[cell[withOrientation]], ME)) {
			var cell_affecter = getAreaLine(tool,cell[from], cell[withOrientation]);
			var sommeHeal = 0;
			var killAllie = false;
			for (var i in cell_affecter) {
				if (getCellContent(i) == CELL_PLAYER) {
					var leek = getLeekOnCell(i);
					if (leek != getLeek()) {
						healVal(tool, leek, null, heal, boostMaxLife, degat, nbCibles);
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
	debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + bestAction + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}


function soigner(tool, allies, @cellsAccessible) { // pour les puces de soins sans AOE
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
					cellAllie = getCell(allie);
					cell_deplace = getCellToUseToolsOnCell(tool, cellAllie, cellsAccessible);
					if (cell_deplace != -2) { //la cellule doit être atteignable
						var heal, boostMaxLife, dammage;
						var nbCibles = 0;
						healVal(tool, allie, null, heal, boostMaxLife, dammage, nbCibles);
						
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
	debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + bestAction + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}

function getTargetHeal(tool, cell) {
	return (!ALL_INGAME_TOOLS[tool][TOOL_IS_WEAPON]) ? getChipTargets(tool, cell) : getWeaponTargets(tool, cell);
}

function healTypeAOE(toutPoireau, tool, @cellsAccessible)
{
	var oper = getOperations();
	var bestAction = [];
	var distanceBestAction = 0;
	
	var heal = 0;
	var degat = 0;
	var boostMaxLife = 0;
	
	var cell_deplace;
	var valeurMax = 0;
	var maxRange = ALL_INGAME_TOOLS[tool][TOOL_MAX_RANGE];
	var deja_fait = [];
	for (var poireau in toutPoireau)
	{
		var distance = getCellDistance(getCell(), getCell(poireau));
		if (distance <= maxRange + getMP())
		{
			var zone = getEffectiveArea(tool, getCell(poireau));
			if (zone != null) 
			{
				for (var cell in zone) 
				{
					if (!deja_fait[cell]) 
					{
						deja_fait[cell] = true;
						cell_deplace = getCellToUseToolsOnCell(tool, cell, cellsAccessible);
						var sommeHeal = 0;
						if (cell_deplace != -2) 
						{
							var cibles = getTargetHeal(tool, cell);
							if (cibles != []) 
							{
								var nbCibles = count(cibles);
								for (var leek in cibles) 
								{
									if (leek != getLeek()) 
									{
										healVal(tool,  leek,  null,  heal,  boostMaxLife, degat, nbCibles);
										var team = (isEnemy(leek)) ? -1 : 1;
										sommeHeal += team * SCORE[leek] * heal;
									}
								}
							}
							var valeur = sommeHeal;
							if (valeur > valeurMax || valeur == valeurMax && cellsAccessible[cell_deplace] < distanceBestAction) {
								bestAction[CELL_DEPLACE] = cell_deplace;
								bestAction[CELL_VISE] = cell;
								bestAction[VALEUR] = valeur;
								valeurMax = valeur;
								distanceBestAction = cellsAccessible[cell_deplace];
							}
						}
					}
				}
			}
		}
	}
	debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + bestAction + " => " + ((getOperations() - oper) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}




function healVal(tool, leek, coeffReduction, @heal, @boostMaxLife, @dammage, nbCibles)
{
	heal = 0; boostMaxLife = 0; dammage = 0;
	var effects = ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS] ;
	var sagesse = getWisdom();
	if(coeffReduction === null || coeffReduction > 1 || coeffReduction < 0.5) coeffReduction = 1;
	
	for (var effect in effects) 
	{
		var valMoyen = ALL_INGAME_TOOLS[tool][TOOL_AVERAGE_POWER];
		if(effect[TOOL_EFFECT_TYPE]==EFFECT_HEAL) 
		{
			if(tool == CHIP_VAMPIRIZATION)
			{
				heal = min(coeffReduction*valMoyen*nbCibles, coeffReduction*valMoyen);
			}
			else
			{
				heal = min(coeffReduction*valMoyen*(1+sagesse/100),(getTotalLife(leek)-getLife(leek)));
			}
			
		} 
		if(effect[TOOL_EFFECT_TYPE]==EFFECT_DAMAGE) 
		{
			dammage = max(0,effect[TOOL_MAX_POWER]*(1+getStrength()/100)*(1-getRelativeShield(leek))-getAbsoluteShield(leek));
		} 
		if(effect[TOOL_EFFECT_TYPE]==EFFECT_BOOST_MAX_LIFE) 
		{
			boostMaxLife = valMoyen*(1+sagesse/100);
		}
	}
}
