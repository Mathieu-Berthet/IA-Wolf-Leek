/*============== A Tester ==========*/

include("GLOBALS");
include("getCellToUse");
include("getArea");



function getTacticAction(@actions, @cellsAccessible, Allies, Ennemies) {
  var nb_action = count(actions);
  var chips = getChips();
  for(var chip in chips) {
     if((isWeapon(chip) && (getTP() >= getWeaponCost(chip) + 1 || getTP() == getWeaponCost(chip) && getWeapon() == chip)) || (isChip(chip) && getCooldown(chip) == 0 && getTP() >= getChipCost(chip))) {
       var effect = getChipEffects(chip);
       if((effect[0][0] == EFFECT_DEBUFF || effect[0][0] == EFFECT_INVERT || effect[0][0] == EFFECT_ANTIDOTE)) {
         var tir;
         if(chip == CHIP_LIBERATION || chip == CHIP_ANTIDOTE || chip == CHIP_INVERSION) {
           tir = tactic(chip, Allies, Ennemies, cellsAccessible);
         }
         if((tir != [] || tir != null) && tir[VALEUR] > 15) { // A Vérifier
          tir[CHIP_WEAPON] = chip;
          var coutPT;
          var valeur = tir[VALEUR];
          var n;
          var change_weapon = 0;
          if(isWeapon(tir[CHIP_WEAPON]) && tir[CHIP_WEAPON] != getWeapon()) {
             change_weapon = 1;
          }
          coutPT = (isWeapon(tir[CHIP_WEAPON])) ? getWeaponCost(tir[CHIP_WEAPON] ): getChipCost(tir[CHIP_WEAPON]);
          if (isChip(tir[CHIP_WEAPON]) && getChipCooldown(tir[CHIP_WEAPON])) {
            n  = 1;
          } else {
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
}

function tactic(tool, allies, ennemies, @cellsAccessible) {
  var ope = getOperations();
  var cell_deplace;
  var cellAllie;
  var bestAction = [];
  var action;
  var valeur;
  var bestValeur = 0;
  var distanceBestAction = 0;
  for(var allie in allies) {
    var targets = getChipEffects(tool)[0][TARGETS];
    if(((targets & EFFECT_TARGET_SUMMONS) && isSummon(allie)) || ((targets & EFFECT_TARGET_NON_SUMMONS) && !isSummon(allie))) {
      if(!(MIN_RANGE[tool] != 0 && allie == ME)) {
        if(!NOT_USE_ON[tool][allie]) {
          cellAllie = getCell(allie);
          cell_deplace = getCellToUseToolsOnCell(tool, cellAllie, cellsAccessible);
          if(cell_deplace != -2) {
            var libere, antidote, invert;
            tacticVal(tool, allie, null, libere, antidote, invert);
            if(MINIMUM_TO_USE[tool] === null || MINIMUM_TO_USE[tool] <= libere) {
              valeur = SCORE_TACTIC[allie] * (antidote + libere);
              if(valeur > bestValeur || valeur == bestValeur && cellsAccessible[cell_deplace] < distanceBestAction) {
                if(getLeekOnCell(cellAllie) == ME) {
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
                  
function tacticVal(tool, leek, coeffReduction, @libere, @antidote, @invert) {
  libere = 0; antidote = 0; invert = 0;
  var effects = isChip(tool) ? getChipEffects(tool) : getWeaponEffects(tool);
  //if(coeffReduction === null || coeffReduction < 1 || coeffRedcution < 0) coeffReduction = 1;
  if(tool == CHIP_ANTIDOTE) {
    var effectPoison = getEffects(leek);
    for(var unEffet in effectPoison) {
      var eff = unEffet[TYPE];
      if (eff == EFFECT_POISON) {
        antidote += unEffet[VALUE];
      }
    }
    return antidote;
  } else if(tool == CHIP_LIBERATION) {
    if(isAlly(leek)) {
      var effectMalus = getEffects(leek);
      for(var unEffet in effectMalus) {
        var eff = unEffet[TYPE];
        if (eff == EFFECT_POISON){
          libere += unEffet[VALUE];
        }
        if(eff == EFFECT_SHACKLE_MAGIC) {
          libere += unEffet[VALUE];
        }
        if(eff == EFFECT_SHACKLE_MP) {
          libere += unEffet[VALUE] * 60;
        }
        if(eff == EFFECT_SHACKLE_STRENGTH) {
          libere += unEffet[VALUE];
        }
        /*if(eff == EFFECT_SHACKLE_TP)
        {
          libere += unEffet[VALUE] * 80;
        }*/
        
        if(eff == EFFECT_BUFF_TP) {
          libere -= unEffet[VALUE] * 80;
        }
        if(eff == EFFECT_BUFF_MP) {
          libere -= unEffet[VALUE] * 60;
        }
        if(eff == EFFECT_BUFF_STRENGTH) {
          libere -= unEffet[VALUE] * 1;
        }
        if(eff == EFFECT_BUFF_AGILITY) {
          	libere -= unEffet[VALUE] * 0.7;
        }
        if(eff == EFFECT_BUFF_RESISTANCE) {
          	libere -= unEffet[VALUE] * 0.7;
        }
        if(eff == EFFECT_BUFF_WISDOM) {
        	libere -= unEffet[VALUE] * 0.7;
        }
        if(eff == EFFECT_ABSOLUTE_SHIELD) {
			libere -= unEffet[VALUE];
        }
        if(eff == EFFECT_RELATIVE_SHIELD) {
			libere -= unEffet[VALUE];
        }
      }
      return libere;
    } else {
      var effect = getEffects(leek);
      for(var unEffet in effect) {
        var eff = unEffet[TYPE];
        if(eff == EFFECT_BUFF_TP) {
          	libere += unEffet[VALUE] * 80;
        }
        if(eff == EFFECT_BUFF_MP) {
          	libere += unEffet[VALUE] * 60;
        }
        if(eff == EFFECT_BUFF_STRENGTH) {
          	libere += unEffet[VALUE] * 1;
        }
        if(eff == EFFECT_BUFF_AGILITY) {
          	libere += unEffet[VALUE] * 0.7;
        }
        if(eff == EFFECT_BUFF_RESISTANCE) {
          	libere += unEffet[VALUE] * 0.7;
        }
        if(eff == EFFECT_BUFF_WISDOM) {
          	libere += unEffet[VALUE] * 0.7;
        }
        if(eff == EFFECT_ABSOLUTE_SHIELD) {
			libere += unEffet[VALUE];
        }
        if(eff == EFFECT_RELATIVE_SHIELD) {
			libere += unEffet[VALUE];
        }
      }
      return libere;
    }
  }
  
  if(tool == CHIP_INVERSION) {
    //Ici le code pour inversion, a finir plus tard
  }
}










/*function antidoteAndLiberation() {
//Pour liberation
	var effect = getEffects(getNearestEnemy()); //TODO: changer pour ne pas avoir un bulbe :P 
	var rentable = 0;
	var rentableValeur = 0;

	//Pour antidote
	var effectPoison = getEffects(getLeek());
	var antiPoison = 0;
	var antiPoisonValeur = 0;
	var antiMalus = 0;
	var antiMalusValeur = 0;
	

	if((antiPoison >= 2 && antiPoisonValeur >= 240) && antiPoison >= antiMalus && antiPoisonValeur >= antiMalusValeur) {
		useChip(CHIP_ANTIDOTE, getLeek());
	} else if (antiMalus > antiPoison && (antiMalus > 0 && antiMalusValeur >= 0) && antiMalus > rentable && antiMalusValeur > rentableValeur) {
		useChip(CHIP_LIBERATION, getLeek());
	}
	if(getCooldown(CHIP_LIBERATION) == 0 && rentable > 0 && rentableValeur >= 0) {
	 	useChip(CHIP_LIBERATION, getNearestEnemy());
	}
}*/


