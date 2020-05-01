include("getArea");
include("getCellToUse");
include("Debug");
include("Utils");

/*
 * 
 * 50 pour les TP
 * 30 pour les PM
 * 1 pour la force
 * 0.7 pour l'agi
 *
 * */


function getBoostAction(@actions, @cellsAccessible, Allies, Ennemies, TPmax, @boost_tools) {
	var nb_action = count(actions);
	var toutPoireau = Allies + Ennemies;
	for(var tool in boost_tools)
	{
		if(ERROR_TOOLS[tool]) continue;
		var tir = [];
		if (getCooldown(tool) == 0 && getTP() >= ALL_INGAME_TOOLS[tool][TOOL_PT_COST])
		{
			var area = ALL_INGAME_TOOLS[tool][TOOL_AOE_TYPE] ;
			if(area == AREA_POINT)
			{
				tir = Booster(tool, Allies, cellsAccessible);
			}
			else
			{
				tir = boostTypeAOE(toutPoireau,  tool,  @cellsAccessible);
			}
			if ((tir != [] || tir != null) && tir[VALEUR] > 3) // au moins 3 de boost (en moyenne)
			{
				tir[CHIP_WEAPON] = tool;
				var coutPT;
				var valeur = tir[VALEUR];
				var n;
				var change_weapon = 0;
				coutPT = ALL_INGAME_TOOLS[tool][TOOL_PT_COST] ;
				if (ALL_INGAME_TOOLS[tool][TOOL_COOLDOWN_TIME])
				{
					n = 1;
				}
				else
				{
					n = floor(getTP() / coutPT);
				}
				//ajouter le bon nombre de fois dans les actions
				for (var o = 1; o <= n; o++)
				{
					tir[NB_TIR] = o;
					tir[PT_USE] = o * coutPT + change_weapon;
					tir[VALEUR] = o * valeur;
					tir[EFFECT] = ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][0][TOOL_EFFECT_TYPE] ;
					actions[nb_action] = tir;
					nb_action++;
				}
			}
		}
	}
}

function haveEffect(leek,tool) {
  var effs = getEffects(leek);
  for (var eff in effs) {
  	if(eff[ITEM_ID]==tool) {
		return true;
	}
  }
  return false;
}

function Booster(tool, allies, @cellsAccessible)
{
	// pour les puces de boost sans AOE.
	var ope = getOperations();
	var cell_deplace;
	var cellAllie;
	var cellEnnemie;
	var bestAction = [];
	var action;
	var valeur;
	var bestValeur = 0;
	var distanceBestAction = 0;
	for (var allie in allies)
	{
		var eff = ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][0] ;
		if ((eff[TOOL_TARGET_SUMMONS] && isSummon(allie)) || (eff[TOOL_TARGET_NON_SUMMONS] && !isSummon(allie)))
		{
      		if(!(MIN_RANGE[tool] != 0 && allie == ME))
			{
        		if(!haveEffect(allie,tool))
				{
          			cellAllie = getCell(allie);
          			cell_deplace = getCellToUseToolsOnCell(tool, cellAllie, cellsAccessible);
          			if (cell_deplace != -2) { //la cellule doit être atteignable
		       			/*var boost;
						var nbCibles = 0;
		       			boostVal(tool, allie, null, boost, nbCibles);
		       			var coeff = SCORE_BOOST[allie][eff[TOOL_EFFECT_TYPE]];
						if(coeff===null) debugEP("["+ALL_INGAME_TOOLS[tool][TOOL_NAME]+"]Pas de valeur pour : "+ eff[TOOL_EFFECT_TYPE]);
						valeur = coeff*(boost);*/
						var oldPosition = INFO_LEEKS[ME][CELL];
						INFO_LEEKS[ME][CELL] = cell_deplace;
						var aTargetEffect = getTargetEffect(ME, tool, cellAllie, true, true);
						valeur = getValueOfTargetEffect(aTargetEffect);
						INFO_LEEKS[ME][CELL] = oldPosition;
						if (valeur > bestValeur || valeur == bestValeur && cellsAccessible[cell_deplace] < distanceBestAction)
						{
							if(getLeekOnCell(cellAllie)==ME)
							{
							  bestAction[CELL_DEPLACE] = -1;
							  bestAction[CELL_VISE] = -1;
							}
							else
							{
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
	debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + bestAction + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}

function getTargetBoost(tool, cell) {
	return (!ALL_INGAME_TOOLS[tool][TOOL_IS_WEAPON]) ? getChipTargets(tool, cell) : getWeaponTargets(tool, cell);
}

function boostTypeAOE(toutPoireau, tool, @cellsAccessible)
{
	var oper = getOperations();
	var bestAction = [];
	var distanceBestAction = 0;
	var cell_deplace;
	var valeurMax = 0;
	var maxRange = ALL_INGAME_TOOLS[tool][TOOL_MAX_RANGE] ;
	var deja_fait = [];
	for (var poireau in toutPoireau) {
		if(!(MIN_RANGE[tool] != 0 && poireau == ME)) {
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
							var sommeBoostTP = 0;
							var sommeBoostMP = 0;
							var boost;
							if (cell_deplace != -2)
							{/*
								var cibles = getTargetBoost(tool, cell);
								if (cibles != [])
								{
									var nbCibles = count(cibles);
									for (var leek in cibles)
									{
										if (leek != getLeek())
										{
											boostVal(tool,  leek,  null,  boost, nbCibles);
											sommeBoostTP += boost;
											sommeBoostMP += boost;
										}
									}
								}
								var valeur = sommeBoostTP + sommeBoostMP;*/
								// hmmm... je comprends pas tout du code existant... 
								
								var oldPosition = INFO_LEEKS[ME][CELL];
								INFO_LEEKS[ME][CELL] = cell_deplace;
								var aTargetEffect = getTargetEffect(ME, tool, cell, true, true);
								var valeur = getValueOfTargetEffect(aTargetEffect);
								INFO_LEEKS[ME][CELL] = oldPosition;
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
	}
	debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + bestAction + " => " + ((getOperations() - oper) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}


/**
 * @DEPRECIATED
 */
function boostVal(tool, leek, coeffReduction, @boost, nbCibles) {
	debugW('la fonction boostVal est dépréciée');
	boost = 0;
	var effects = ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS];
	var science = getScience();
	for (var effect in effects) 
	{
		var valMoyen = effect[TOOL_AVERAGE_POWER];
		if(effect[TOOL_EFFECT_TYPE] == EFFECT_BUFF_TP)
		{
			boost = valMoyen*(1+science/100) * 80;
		}
		
		if(effect[TOOL_EFFECT_TYPE] == EFFECT_RAW_BUFF_TP)
		{
			boost = valMoyen*nbCibles * 80;
		}
		
		if(effect[TOOL_EFFECT_TYPE] == EFFECT_BUFF_MP) {
			if (isStatic(leek)) {
				boost = 0;
			} else {
				boost = valMoyen*(1+science/100) * 80;
			}
		}
		
		if(effect[TOOL_EFFECT_TYPE] == EFFECT_RAW_BUFF_MP)
		{
			boost = valMoyen*nbCibles * 60;
		}

		if(effect[TOOL_EFFECT_TYPE] == EFFECT_BUFF_STRENGTH || effect[TOOL_EFFECT_TYPE] == EFFECT_AFTEREFFECT)
		{
			if(effect[TOOL_EFFECT_TYPE] == EFFECT_BUFF_STRENGTH)
			{
				boost = valMoyen*(1+science/100) * 1;
			}
			if(effect[TOOL_EFFECT_TYPE] == EFFECT_AFTEREFFECT)
			{
				var degat = valMoyen*(1+science/100) *1;
				if(degat >= getLife(leek))
				{
					boost = 0;
				}
			}
		}

		if(effect[TOOL_EFFECT_TYPE]== EFFECT_BUFF_AGILITY)
		{
			boost = valMoyen*(1+science/100) * 0.7;
		}

		if(effect[TOOL_EFFECT_TYPE] == EFFECT_BUFF_RESISTANCE)
		{
		  boost = valMoyen*(1+science/100) * 0.7;
		}
			if(effect[TOOL_EFFECT_TYPE] == EFFECT_BUFF_WISDOM) 
		{
		  boost = valMoyen*(1+science/100) * 0.7;
		}		
	}
}
