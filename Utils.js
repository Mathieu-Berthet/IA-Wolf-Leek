include('GLOBALS');


function getTargetEffect(caster, tool, cellVise, ignoreCasterOnNonePointArea) { // ignoreCasterOnNonePointArea permet de ne pas se prendre pour cible car généralement on va se déplacer donc on ne sera plus dans les targets
	var cibles = getTarget(tool, cellVise);
	var nbCible = count(cibles);
	var infoTool = ALL_INGAME_TOOLS[arme_chip];
	var effects = infoTool[TOOL_ATTACK_EFFECTS];
	var area = infoTool[TOOL_AREA_TYPE];
	
	var returnTab = [];
	
	for(var effect in effects) {
		for(var leek in cibles) {
			if(leek != caster || !ignoreCasterOnNonePointArea || effect[TOOL_MODIFIER_ON_CASTER] || area == AREA_POINT ) { 
			// si leek == caster : On fait parti des cibles mais on suppose que l'on va se déplacer et donc que l'on ne fera pas parti des cibles (cas limite pour certains tools comme pour le gazor => pour éviter d'être dans les cibles on a changé la MIN_RANGE de ces tools)
				if (	(
						(
							effect[TOOL_TARGET_SUMMON] && isSummon(leek)
						) || (
							effect[TOOL_TARGET_NON_SUMMON] && !isSummon(leek)
						)
					) && (
						(
							effect[TOOL_TARGET_ENEMIS] && isEnemy(leek)
						) || (
							effect[TOOL_TARGET_ALLIES] && isAlly(leek)
						)
					) && (
						(
							effect[TOOL_TARGET_CASTER]
						) || (
							leek != caster
						)
					)
				){ 
					if (!effect[IS_SPECIAL]) {
						var cible = leek;
						if(effect[TOOL_MODIFIER_ON_CASTER]) {
							cible = caster;
						}
					
						var coeffAOE;
						if (area == AREA_POINT || area == AREA_LASER_LINE || cellVisee === null) {
							coeffAOE = 1;
						} else {
							var distance = getDistance(cellVisee, getCell(cible));
							if(inArray([AREA_X_1, AREA_X_2, AREA_X_3], area)) { //TODO: vérifier l'ordre des paramètres de inArray
								distance /= sqrt(2);
							}
							coeffAOE = 1 - (ceil(distance) * 0.2);
						}
						
						var coeffNbCible = 1;
						if(effect(TOOL_MODIFIER_MULTIPLIED_BY_TARGETS)) {
							coeffNbCible = nbCible;
						}
						
						var coeffMoyen = effect[TOOL_AVERAGE_POWER];
						
						var coeffCharacteristic = 1;
						if(var characteristic = ALL_EFFECTS[effect[TOOL_EFFECT_TYPE]][BOOSTED_BY] !== null) {
							if(ALL_EFFECTS[effect[TOOL_EFFECT_TYPE]][IS_RELATIF]) {
								coeffCharacteristic = 1 + (getCharacteristiqueFunction(characteristic))(caster);
							} else {
								coeffCharacteristic = 1 + (getCharacteristiqueFunction(characteristic))(caster) / 100;
							}
						}
						
						var value = round(coeffMoyen * coeffCharacteristic * coeffAOE * coeffNbCible);
						
						if(ALL_EFFECTS[effect[TOOL_EFFECT_TYPE]][INTERACT_WITH][INTERACT_SHIELD]) {
							value = max(0, value * (1 - INFO_LEEKS[cible][RELATIVE_SHIELD] / 100) - INFO_LEEKS[cible][ABSOLUTE_SHIELD]);
						}
						
						var stealLife;
						if(ALL_EFFECTS[effect[TOOL_EFFECT_TYPE]][INTERACT_WITH][INTERACT_STEAL_LIFE]) {
							stealLife = getWisdom(caster) * value / 1000;
						}
						
						var damageReturn;
						if(ALL_EFFECTS[effect[TOOL_EFFECT_TYPE]][INTERACT_WITH][INTERACT_RETURN_DAMAGE]) {
							damageReturn = INFO_LEEKS[cible][DAMAGE_RETURN] * value / 1000;
						}
						
						var degatNova;
						if(ALL_EFFECTS[effect[TOOL_EFFECT_TYPE]][INTERACT_WITH][INTERACT_NOVA_DAMAGE]) {
							degatNova = min(getMaxLife(cible) - getLife(cible), 5 * value * (1 + getScience(caster)) / 100);
							// TODO: il me semble que c'est ça la formule. c'est peut-être différent si c'est un effect_damage ou bie du poison... a vérifier
						}
						
						// on sauvegarde les valeurs
						
						if(returnTab[cible] === null) returnTab[cible] = [];
						var oldValue = (returnTab[cible][effect[TOOL_EFFECT_TYPE]] === null) ? 0 : returnTab[cible][effect[TOOL_EFFECT_TYPE]];
						returnTab[cible][effect[TOOL_EFFECT_TYPE]] = oldValue + value;
						
						if(stealLife) {
							if(returnTab[caster] === null) returnTab[caster] = [];
							var oldValue = (returnTab[caster][EFFECT_HEAL] === null) ? 0 : returnTab[caster][EFFECT_HEAL];
							returnTab[caster][EFFECT_HEAL] = oldValue + stealLife;
						}
						
						if(damageReturn) {
							if(returnTab[caster] === null) returnTab[caster] = [];
							var oldValue = (returnTab[caster][EFFECT_LIFE_DAMAGE] === null) ? 0 : returnTab[caster][EFFECT_LIFE_DAMAGE];
							returnTab[caster][EFFECT_LIFE_DAMAGE] = oldValue + damageReturn;
						}
						
						if(degatNova) {
							if(returnTab[caster] === null) returnTab[caster] = [];
							var oldValue = (returnTab[caster][EFFECT_NOVA_DAMAGE] === null) ? 0 : returnTab[caster][EFFECT_NOVA_DAMAGE];
							returnTab[caster][EFFECT_NOVA_DAMAGE] = oldValue + degatNova;
						}
					} else {
						// TODO : antidote & summon & libé...
					}
				}
			}
		}
	}
	
	return returnTab;
}

function getCharacteristiqueFunction(characteristic) {
	return [
		CHARACTERISTIC_LIFE : getLife,
		CHARACTERISTIC_STRENGTH : getStrength,
		CHARACTERISTIC_WISDOM : getWisdom,
		CHARACTERISTIC_AGILITY : getAgility,
		CHARACTERISTIC_RESISTANCE : getResistance,
		CHARACTERISTIC_SCIENCE : getScience,
		CHARACTERISTIC_MAGIC : getMagic,
		CHARACTERISTIC_FREQUENCY : getFrequency,
		CHARACTERISTIC_MOVEMENT : getMP,
		CHARACTERISTIC_TURN_POINT : getTP
	][charactetistic];
}

function getValueOfTargetEffect(aTargetEffect) {
	// on parcours les cibles & effect retourné par getTargetEffect
	// et on attribut un score en fonction de COEFF_EFFECT dans ALL_EFFECT, du score de chaque Leek, de la team du leek
	
	// TODO: calcul spécial pour la résistance; utiliser isAlreadyShackle
	var coeffReturned = 0;
	for (var leek : var effectLeek in aTargetEffect) {
	  for (var effect : var value in effectLeek) {
	    var infoEffect = ALL_EFFECTS[effect];
	    if (!infoEffect[IS_SPECIAL]) {
	      if (inArray([EFFECT_ABSOLUTE_SHIELD, EFFECT_RELATIVE_SHIELD], effect)) {
	        //TODO:
	      } else {
  	      value = (isAlreadyShacle (leek, effect)) ? 0 : value ;
  	      
  	      coeffReturned += infoEffect[COEFF] * COEFF_LEEK_EFFECT[leek][effect] * value; // TODO : Creer une nouvelle variable dans les globals et inclure ce qui a ete fait dedans.
	      }
	    } else {
	      //TODO : faire une fonction spéciale pour l'inversion
	    }
	  }
	}
	return coeffReturned;
}
