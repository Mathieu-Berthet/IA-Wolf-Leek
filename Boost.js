// dernière mise à jour le 25/02/18 par Rayman
include("GLOBALS");
include("getCellToUse");

/*
 *  *50 pour les TP
		*30 pour les PM
		*1 pour la force
		*0.7 pour l'agi
 * 
 * */


function getBoostAction(@actions, @cellsAccessible, Allies) {
	var nb_action = count(actions); 
	for(var chip in BoostsTools) 
	{
		if (getCooldown(chip) == 0 && getTP() >= getChipCost(chip)) 
		{
			var tir = Booster(chip, Allies, cellsAccessible);

			if ((tir != [] || tir != null) && tir[VALEUR] > 3) // au moins 3 de boost (en moyenne)
			{
				tir[CHIP_WEAPON] = chip;
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
					tir[EFFECT] = getChipEffects(chip)[0][0];
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
	var bestAction = [];
	var action;
	var valeur;
	var bestValeur = 0;
	var distanceBestAction = 0;
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
            			boostVal(tool, allie, null, boost);
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

function boostVal(tool, leek, coeffReduction, @boost)
{
	boost = 0;
	var effects = getChipEffects(tool);
	var science = getScience();
	for (var effect in effects) 
	{
		var valMoyen = (effect[MIN] + effect[MAX]) / 2;
		if(effect[TYPE] == EFFECT_BUFF_TP)
		{
			boost = valMoyen*(1+science/100) * 80;
		}
		if(effect[TYPE] == EFFECT_BUFF_MP)
		{
			boost = valMoyen*(1+science/100) * 60;
		}

		if(effect[TYPE] == EFFECT_BUFF_STRENGTH)
		{
			boost = valMoyen*(1+science/100) * 1;
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