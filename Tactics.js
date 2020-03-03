/* ============== A Tester ==========*/

include("GLOBALS");
include("getCellToUse");
include("getArea");



function getTacticAction(@actions, @cellsAccessible, Allies, Ennemies)
{
	var nb_action = count(actions);
	for(var chip in TacticsTools)
	{
		if(ERROR_TOOLS[chip]) continue;
		if((isWeapon(chip) && (getTP() >= getWeaponCost(chip) + 1 || getTP() == getWeaponCost(chip) && getWeapon() == chip)) || (isChip(chip) && getCooldown(chip) == 0 && getTP() >= getChipCost(chip)))
		{
			var effect = getChipEffects(chip);
			var tir;
			if(chip == CHIP_LIBERATION || chip == CHIP_ANTIDOTE || chip == CHIP_INVERSION || chip == CHIP_TELEPORTATION)
			{
				tir = tactic(chip, Allies, Ennemies, cellsAccessible);
			}
			if((tir != [] || tir != null) && tir[VALEUR] > 15) // A Vérifier
			{
				tir[CHIP_WEAPON] = chip;
				var coutPT;
				var valeur = tir[VALEUR];
				var n;
				var change_weapon = 0;
				if(isWeapon(tir[CHIP_WEAPON]) && tir[CHIP_WEAPON] != getWeapon())
				{
					change_weapon = 1;
				}
				coutPT = (isWeapon(tir[CHIP_WEAPON])) ? getWeaponCost(tir[CHIP_WEAPON] ): getChipCost(tir[CHIP_WEAPON]);
				if (isChip(tir[CHIP_WEAPON]) && getChipCooldown(tir[CHIP_WEAPON]))
				{
					n  = 1;
				}
				else
				{
					n = 1; /*floor(getTP() / coutPT)*/
				}
				for (var o = 1; o <= n; o++)
				{
					tir[NB_TIR] = o;
					tir[PT_USE] =  o* coutPT + change_weapon;
					tir[VALEUR] = o * valeur;
					tir[EFFECT] = getChipEffects(chip)[0][0];
					actions[nb_action] = tir;
					nb_action++;
				}
			}
		}
	}
}

function tactic(tool, allies, ennemies, @cellsAccessible)
{
  var ope = getOperations();
  var cell_deplace;
  var cellAllie;
  var bestAction = [];
  var action;
  var valeur;
  var bestValeur = 0;
  var distanceBestAction = 0;
  for(var allie in allies)
  {
    var targets = getChipEffects(tool)[0][TARGETS];
    if(((targets & EFFECT_TARGET_SUMMONS) && isSummon(allie)) || ((targets & EFFECT_TARGET_NON_SUMMONS) && !isSummon(allie)))
    {
      if(!(MIN_RANGE[tool] != 0 && allie == ME))
      {
        if(!NOT_USE_ON[tool][allie])
        {
          cellAllie = getCell(allie);
          cell_deplace = getCellToUseToolsOnCell(tool, cellAllie, cellsAccessible);
          if(cell_deplace != -2)
          {
            var libere, antidote, invert, teleport;
			tacticVal(tool, allie, null, libere, antidote, invert, teleport);

            if(MINIMUM_TO_USE[tool] === null || MINIMUM_TO_USE[tool] <= libere)
            {
              valeur = SCORE_TACTIC[allie] * (antidote + libere + invert + teleport);
              if(valeur > bestValeur || valeur == bestValeur && cellsAccessible[cell_deplace] < distanceBestAction)
              {
                if(getLeekOnCell(cellAllie) == ME)
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
  }
  //debug((isChip(tool) ? getChipName(tool) : getWeaponName(tool)) + " : " + bestAction + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}

function tacticVal(tool, leek, coeffReduction, @libere, @antidote, @invert, @teleport)
{
	libere = 0; antidote = 0; invert = 0;
	var effects = isChip(tool) ? getChipEffects(tool) : getWeaponEffects(tool);
	//if(coeffReduction === null || coeffReduction < 1 || coeffRedcution < 0) coeffReduction = 1;
	if(tool == CHIP_ANTIDOTE && isAlly(leek))
	{
		var effectPoison = getEffects(leek);
		for(var unEffet in effectPoison)
		{
			var eff = unEffet[TYPE];
			if (eff == EFFECT_POISON)
			{
				antidote += unEffet[VALUE];
			}
		}
		return antidote;
	}
	else if(tool == CHIP_LIBERATION)
	{
		if(isAlly(leek))
		{
			var effectMalus = getEffects(leek);
			for(var unEffet in effectMalus)
			{
				var eff = unEffet[TYPE];
				if (eff == EFFECT_POISON)
				{
					libere += unEffet[VALUE];
				}
				if(eff == EFFECT_SHACKLE_MAGIC)
				{
					libere += unEffet[VALUE];
				}
				if(eff == EFFECT_SHACKLE_MP)
				{
					libere += unEffet[VALUE] * 60;
				}
				if(eff == EFFECT_SHACKLE_STRENGTH)
				{
					libere += unEffet[VALUE];
				}
				if(eff == EFFECT_SHACKLE_TP)
				{
				  libere += unEffet[VALUE] * 80;
				}

				if(eff == EFFECT_BUFF_TP)
				{
					libere -= unEffet[VALUE] * 80;
				}
				if(eff == EFFECT_BUFF_MP)
				{
					libere -= unEffet[VALUE] * 60;
				}
				if(eff == EFFECT_BUFF_STRENGTH)
				{
					libere -= unEffet[VALUE] * 1;
				}
				if(eff == EFFECT_BUFF_AGILITY)
				{
					libere -= unEffet[VALUE] * 0.7;
				}
				if(eff == EFFECT_BUFF_RESISTANCE)
				{
					libere -= unEffet[VALUE] * 0.7;
				}
				if(eff == EFFECT_BUFF_WISDOM)
				{
					libere -= unEffet[VALUE] * 0.7;
				}
				if(eff == EFFECT_ABSOLUTE_SHIELD)
				{
					libere -= unEffet[VALUE];
				}
				if(eff == EFFECT_RELATIVE_SHIELD)
				{
					libere -= unEffet[VALUE];
				}
			}
			return libere;
		}
		else
		{
			var effect = getEffects(leek);
			for(var unEffet in effect)
			{
				var eff = unEffet[TYPE];
				if(eff == EFFECT_BUFF_TP)
				{
					libere += unEffet[VALUE] * 80;
				}
				if(eff == EFFECT_BUFF_MP)
				{
					libere += unEffet[VALUE] * 60;
				}

				if(eff == EFFECT_BUFF_STRENGTH)
				{
					libere += unEffet[VALUE] * 1;
				}

				if(eff == EFFECT_BUFF_AGILITY)
				{
					libere += unEffet[VALUE] * 0.7;
				}

				if(eff == EFFECT_BUFF_RESISTANCE)
				{
					libere += unEffet[VALUE] * 0.7;
				}
				if(eff == EFFECT_BUFF_WISDOM)
				{
					libere += unEffet[VALUE] * 0.7;
				}
				if(eff == EFFECT_ABSOLUTE_SHIELD)
				{
					libere += unEffet[VALUE];
				}
				if(eff == EFFECT_RELATIVE_SHIELD)
				{
					libere += unEffet[VALUE];
				}

				if (eff == EFFECT_POISON)
				{
					libere -= unEffet[VALUE];
				}
				if(eff == EFFECT_SHACKLE_MAGIC)
				{
					libere -= unEffet[VALUE];
				}
				if(eff == EFFECT_SHACKLE_MP)
				{
					libere -= unEffet[VALUE] * 60;
				}
				if(eff == EFFECT_SHACKLE_STRENGTH)
				{
					libere -= unEffet[VALUE];
				}
				if(eff == EFFECT_SHACKLE_TP)
				{
				  libere -= unEffet[VALUE] * 80;
				}
			}
			return libere;
		}
	}

	if(tool == CHIP_INVERSION)
	{
		if(isAlly(leek))
		{
			var effectInversion = getChipEffects(CHIP_INVERSION);
			if(effectInversion[1][TYPE] == EFFECT_HEAL)
			{
				invert += effectInversion[1][MIN];
			}
			return invert;
		}
		else
		{
			var effectInversion = getChipEffects(CHIP_INVERSION);
			if(effectInversion[2][TYPE] == EFFECT_VULNERABILITY)
			{
				invert += effectInversion[2][MIN];
			}
			return invert;
		}
	}

	if(tool == CHIP_TELEPORTATION)
	{

	}
}
