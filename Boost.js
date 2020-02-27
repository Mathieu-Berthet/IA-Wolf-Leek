// dernière mise à jour le 25/02/18 par Rayman
include("GLOBALS");
include("getArea");
include("getCellToUse");

/*
 *  *50 pour les TP
		*30 pour les PM
		*1 pour la force
		*0.7 pour l'agi
 * 
 * */


function getBoostAction(@actions, @cellsAccessible, Allies, Ennemies) {
	var nb_action = count(actions);
	var toutPoireau = Allies + Ennemies;
	for(var tool in BoostsTools) 
	{
		var tir = [];
		if (getCooldown(tool) == 0 && getTP() >= getChipCost(tool)) 
		{
			var area = (isChip(tool) ? getChipArea(tool) : getWeaponArea(tool));
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
				coutPT = getChipCost(tir[CHIP_WEAPON]);
				if (isChip(tir[CHIP_WEAPON]) && getChipCooldown(tir[CHIP_WEAPON])) 
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
					tir[EFFECT] = getChipEffects(tool)[0][0];
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
	// pour les puces de soins sans AOE.   De boost*
	var ope = getOperations();
	var cell_deplace;
	var cellAllie;
	var cellEnnemie;
	var bestAction = [];
	var action;
	var valeur;
	var bestValeur = 0;
	var distanceBestAction = 0;
	//var area = [];
	for (var allie in allies) 
	{
		var eff = getChipEffects(tool)[0];
		var targets = eff[TARGETS];
		if (((targets & EFFECT_TARGET_SUMMONS) && isSummon(allie)) || ((targets & EFFECT_TARGET_NON_SUMMONS) && !isSummon(allie))) 
		{
      		if(!(MIN_RANGE[tool] != 0 && allie == ME)) 
			{
        		if(!haveEffect(allie,tool)) 
				{
          			cellAllie = getCell(allie);
          			cell_deplace = getCellToUseToolsOnCell(tool, cellAllie, cellsAccessible);
          			if (cell_deplace != -2) 
					{ //la cellule doit être atteignable
            			var boost;
						var nbCibles = 0;
            			boostVal(tool, allie, null, boost, nbCibles);
            			var coeff = SCORE_BOOST[allie][eff[TYPE]];
						if(coeff===null) 
						{
							debugE("["+getChipName(tool)+"]Pas de valeur pour : "+ eff[TYPE]);
						}
						valeur = coeff*(boost);
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
	debug(getChipName(tool) + " : " + bestAction + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}

function getTarget(tool, cell) {
	return (isChip(tool)) ? getChipTargets(tool, cell) : getWeaponTargets(tool, cell);
}

function boostTypeAOE(toutPoireau, tool, @cellsAccessible)
{
	var oper = getOperations();
	var bestAction = [];
	var distanceBestAction = 0;
	var cell_deplace;
	var valeurMax = 0;
	var maxRange = (isChip(tool)) ? getChipMaxRange(tool) : getWeaponMaxRange(tool);
	var deja_fait = [];
	for (var poireau in toutPoireau) {
		var distance = getDistance(getCell(), getCell(poireau));
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
						{
							var cibles = getTarget(tool, cell);
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
							var valeur = sommeBoostTP + sommeBoostMP;
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
	if (isChip(tool)) debug(getChipName(tool) + " : " + bestAction + " => " + ((getOperations() - oper) / OPERATIONS_LIMIT * 100) + "%");
	else debug(getWeaponName(tool) + " : " + bestAction + " => " + ((getOperations() - oper) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}



function boostVal(tool, leek, coeffReduction, @boost, nbCibles)
{
	boost = 0;
	var effects = getChipEffects(tool);
	var science = getScience();
	for (var effect in effects) 
	{
		var valMoyen = (effect[MIN] + effect[MAX]) / 2;
		if(effect[TYPE] == EFFECT_BUFF_TP)
		{
			if(tool == CHIP_COVETOUSNESS)
			{
				boost = valMoyen*nbCibles * 80;
			}
			else
			{
				boost = valMoyen*(1+science/100) * 80;
			}
		}
		if(effect[TYPE] == EFFECT_BUFF_MP)
		{
			if(tool == CHIP_PRECIPITATION)
			{
				boost = valMoyen*nbCibles * 60;
			}
			else
			{
				boost = valMoyen*(1+science/100) * 60;
			}
		}

		if(effect[TYPE] == EFFECT_BUFF_STRENGTH || effect[TYPE] == EFFECT_AFTEREFFECT)
		{
			if(effect[TYPE] == EFFECT_BUFF_STRENGTH)
			{
				boost = valMoyen*(1+science/100) * 1;
			}
			if(effect[TYPE] == EFFECT_AFTEREFFECT)
			{
				var degat = valMoyen*(1+science/100) *1;
				if(degat >= getLife(leek))
				{
					boost = 0;
				}
			}
		}

		if(effect[TYPE]== EFFECT_BUFF_AGILITY)
		{
			boost = valMoyen*(1+science/100) * 0.7;
		}

		if(effect[TYPE] == EFFECT_BUFF_RESISTANCE)
		{
		  boost = valMoyen*(1+science/100) * 0.7;
		}
			if(effect[TYPE] == EFFECT_BUFF_WISDOM) 
		{
		  boost = valMoyen*(1+science/100) * 0.7;
		}		
	}
}


//[test] [[32, 1, 1, 2, 29, 6]] --> Convoitise
//[test] [[2, 38, 40, 0, 29, 6]] --> Vampirisme
//[test] [[31, 1, 1, 1, 29, 6]] --> Precipitation