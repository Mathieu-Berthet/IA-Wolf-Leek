/* ============== A Tester ==========*/

include("getCellToUse");
include("getArea");



function getTacticAction(@actions, @cellsAccessible, Allies, Ennemies, @tactics_tools)
{
	var nb_action = count(actions);
	for(var tool in tactics_tools)
	{
		if(ERROR_TOOLS[tool]) continue;
		if( can_use_tool( tool , getTP() ) )
		{
			var effect = ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS] ;
			var tir;
			if(inArray([CHIP_LIBERATION, CHIP_ANTIDOTE, CHIP_INVERSION, CHIP_TELEPORTATION], tool)) {
				tir = tactic(tool, Allies, Ennemies, cellsAccessible);
			}
			if((tir != [] || tir != null) && tir[VALEUR] > 15) // A Vérifier
			{
				tir[CHIP_WEAPON] = tool;
				var coutPT;
				var valeur = tir[VALEUR];
				var n;
				var change_weapon = 0;
				if(ALL_INGAME_TOOLS[tool][TOOL_IS_WEAPON] && tool != getWeapon())
				{
					change_weapon = 1;
				}
				coutPT = ALL_INGAME_TOOLS[tool][TOOL_PT_COST];
				if (ALL_INGAME_TOOLS[tool][TOOL_COOLDOWN_TIME])
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
					tir[EFFECT] = ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][0][TOOL_EFFECT_TYPE] ;
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
    if((ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][0][TOOL_TARGET_SUMMONS] && isSummon(allie)) || (ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][0][TOOL_TARGET_NON_SUMMONS] && !isSummon(allie)))
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
  //debug(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + bestAction + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}

function tacticVal(tool, leek, coeffReduction, @libere, @antidote, @invert, @teleport)
{
	libere = 0; antidote = 0; invert = 0;
	var effects = ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS];
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
				unEffet[VALUE] = round( unEffet[VALUE]*0.6 ) ;
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
				unEffet[VALUE] = round( unEffet[VALUE]*0.6 ) ;
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
			invert += ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][1][TOOL_MIN_POWER] ;
			return invert;
		}
		else
		{
			invert += ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][2][TOOL_MIN_POWER] ;
			return invert;
		}
	}

	if(tool == CHIP_TELEPORTATION)
	{

	}
}
