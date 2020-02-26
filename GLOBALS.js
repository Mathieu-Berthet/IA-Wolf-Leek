// dernière mise à jour le : 03/02/2020 par : Caneton

/********************** Globals *********************************/
global CACHER;
global ME = getLeek();
global PHRASE_A_DIRE = [];
global STOP_ACTION;

global COMBO = [];

global INFO_LEEKS = [];
global ID = 0, ABSOLUTE_SHIELD = 1, RELATIVE_SHIELD = 2, STRENGTH = 3, DAMAGE_RETURN = 4, MAGIC = 5, PT = 6, MP = 7;
function updateInfoLeeks() {//TODO : mettre d'autres caractéristiques avec des constantes associées
	var tab = [];
		var leeks = getAliveAllies()+ getAliveEnemies();
		for (var leek in leeks) {
			tab[leek] = [leek, getAbsoluteShield(leek), getRelativeShield(leek),  max(0,getStrength(leek)), getDamageReturn(leek), max(0,getMagic(leek)), getTP(leek), getMP(leek)];
    }
		return tab;
}
INFO_LEEKS = updateInfoLeeks();

  
global SCORE; //TODO: faire une fonction plus précise  <= ok fait par ray dans le ciblage 
SCORE = (function () {
		var tab = [];
		var leeks = getAliveAllies() + getAliveEnemies();
		for (var leek in leeks) {
			tab[leek] = (isSummon(leek)) ? 0.5 : 1;
		}
		return tab;
})();


global SCORE_HEAL; //TODO: faire une fonction plus précise
SCORE_HEAL = (function () {
		var tab = [];
		var leeks = getAliveAllies() + getAliveEnemies();
		for (var leek in leeks) {
			tab[leek] = (isSummon(leek)) ? 0.5 : 1;
		}
		return tab;
})();


global SCORE_TACTIC; //TODO: faire une fonction plus précise
SCORE_TACTIC = (function() {
	var tab = [];
	var leeks = getAliveAllies() + getAliveEnemies();
	for (var leek in leeks) {
		tab[leek] = (isSummon(leek)) ? 0.5 : 1;
	}
	return tab;
})();


global SCORE_RESISTANCE;
SCORE_RESISTANCE = (function () {
	var tab = [];
	var leeks = getAliveAllies();
	for(var leek in leeks) {
		if(getFightType() == FIGHT_TYPE_SOLO) {
			var ennemy = getNearestEnemy();
			if(isSummon(ennemy)) ennemy = getSummoner(ennemy);
			if(getMagic(ennemy) >= 300 && getStrength(ennemy) < 100) {
				tab[leek] =(isSummon(leek)) ? 0 : 0.2;
			} else {
				tab[leek] =(isSummon(leek)) ? 0.4 : 1;
			}
		} else {
			tab[leek] =(isSummon(leek)) ? 0.2 : 1;
		}
	}
	return tab;
})();

/*function nbLeekEnemy() {
	var enemies = getAliveEnemies();
	for(var enemy in enemies) {
		if ()
	}
}*/


function compteurPuceEffect(tools, effect) {
  var compteur = 0;
  for(var tool in tools) {
    var eff = isChip(tool) ? getChipEffects(tool)[0][TYPE] : getWeaponEffects(tool)[0][TYPE];
    if(tool==WEAPON_B_LASER) eff=EFFECT_HEAL;
    if(eff==effect) {
      compteur++;
    }
  }
  return compteur;
}

function setBoostCoeff() { // Méthode du nombre de puce
  var boost = [];
  for (var allie in getAliveAllies()) {
    var tools = getChips(allie)+getWeapons(allie);
    var nbDamageTool = compteurPuceEffect(tools, EFFECT_DAMAGE);
	var nbHealTool = compteurPuceEffect(tools, EFFECT_HEAL);
    var nbResiTool = compteurPuceEffect(tools, EFFECT_ABSOLUTE_SHIELD)+compteurPuceEffect(tools, EFFECT_RELATIVE_SHIELD); 
    var nbReturnDamageTool = compteurPuceEffect(tools, EFFECT_DAMAGE_RETURN); 
    var nbScienceTool =   compteurPuceEffect(tools, EFFECT_BUFF_STRENGTH)
    					+ compteurPuceEffect(tools, EFFECT_BUFF_WISDOM)
    					+ compteurPuceEffect(tools, EFFECT_BUFF_RESISTANCE)
    					+ compteurPuceEffect(tools, EFFECT_BUFF_AGILITY)
    					+ compteurPuceEffect(tools, EFFECT_BUFF_TP)
    					+ compteurPuceEffect(tools, EFFECT_BUFF_MP); 
    
    boost[allie] = [];
    boost[allie][EFFECT_BUFF_STRENGTH] = nbDamageTool == 0 ? 0 : sqrt(nbDamageTool);
    boost[allie][EFFECT_BUFF_WISDOM] = nbHealTool == 0 ? 0 : sqrt(nbHealTool);
    boost[allie][EFFECT_BUFF_RESISTANCE] = nbResiTool == 0 ? 0 : sqrt(nbResiTool);
    boost[allie][EFFECT_BUFF_AGILITY] = 1 + (nbReturnDamageTool == 0 ? 0 : sqrt(nbReturnDamageTool)) + (nbScienceTool == 0 ? 0 : sqrt(nbScienceTool)); 
    boost[allie][EFFECT_BUFF_TP] = 1.7;
    boost[allie][EFFECT_BUFF_MP] = 1.7; 

    
  	if(isSummon(allie)) {
      for (var cle : var val in boost[allie]) { 
        boost[allie][cle] *= 0.7;
      }
    }
    
  }
  SCORE_BOOST = boost;
}


global SCORE_BOOST;
SCORE_BOOST = (function () { // [Caneton] : je crois que l'on peut retirer la variable SCORE_BOOSTS est mis à jour par la fonction setBoostCoeff 
	var tab = [];
	var leeks = getAliveAllies();
	for(var leek in leeks) {
    //Méthode selon les puces et leurs effets
		for(var chip in getChips(leek)) {
		  for(var effect in getChipEffects(chip)) {
			  if(effect[0][0] == EFFECT_DAMAGE) {
				tab[leek][EFFECT_BUFF_STRENGTH] += 2;
			  }
			  if(effect[0][0] == EFFECT_HEAL) {
				tab[leek][EFFECT_BUFF_WISDOM] += 2;
			  }
			  if(effect[0][0] == EFFECT_RELATIVE_SHIELD || effect[0][0] == EFFECT_ABSOLUTE_SHIELD) {
				tab[leek][EFFECT_BUFF_RESISTANCE] += 2;
			  }
		  }
		}    
    //Méthode selon les stats
		if(getStrength(leek) > 0) {
		  tab[leek][EFFECT_BUFF_STRENGTH] = 2;
		}
		if(getWisdom(leek) > 0) {
		  tab[leek][EFFECT_BUFF_WISDOM] = 2;
		}
		if(getResistance(leek) > 0) {
		  tab[leek][EFFECT_BUFF_RESISTANCE] = 2;
		}
		if(getAgility(leek) > 0) {
		  tab[leek][EFFECT_BUFF_AGILITY] = 2;
		}
		tab[leek] =(isSummon(leek)) ? 0.5 : 1;
	}
	return tab;
})();





//informations concernant une action
global CELL_DEPLACE=0, CELL_VISE=1, VALEUR=2, CHIP_WEAPON=3, NB_TIR=4, PT_USE=5, EFFECT=6, CALLBACK = 7, PARAM = 8;

global NE_laser = 0;
global SO_laser = 1;
global NO_laser = 2;
global SE_laser = 3;

//getEffects: [type, value, caster_id, turns, critical, item_id, target_id]
global TYPE = 0, VALUE = 1, CASTER_ID = 2, TURNS = 3, CRITICAL = 4, ITEM_ID = 5, TARGET_ID = 6;
//getWeaponEffects:[type, min, max, turns, targets]
global MIN = 1, MAX = 2, TARGETS = 4;

global MOYEN = 3;

global MIN_RANGE = (function () {
	var min_range = [];
	for (var i=1; i<130; i++) {
		min_range[i] = (isChip(i)) ? getChipMinRange(i) : getWeaponMinRange(i);
	}
	min_range[CHIP_TOXIN] = 2;
	min_range[WEAPON_GAZOR] = 4;//ou 3, à vérifier
  	min_range[CHIP_PLAGUE] = 4;
	return @min_range;
})();

global MAX_RANGE = (function () {
	var max_range = [];
	for (var i=1; i<130; i++) {
		max_range[i] = (isChip(i)) ? getChipMaxRange(i) : getWeaponMaxRange(i);
	}
	return @max_range;
})();


global MINIMUM_TO_USE = (function(){
	var tab = [];
	tab[CHIP_REGENERATION] = 1 * (1 + getWisdom()/100) * getChipEffects(CHIP_REGENERATION)[0][MIN];
	
	//TODO: rajouter
	
	return tab;
})();
	
global NOT_USE_ON;
NOT_USE_ON = (function() {
	var tab = [];
	tab[CHIP_REGENERATION] = [];
	tab[CHIP_FORTRESS] = [];
	for(var leek in getAliveAllies()+getAliveEnemies()) {
		if(isSummon(leek)) {
			tab[CHIP_REGENERATION][leek] = true;
			tab[CHIP_FORTRESS][leek] = true;
		}
	}
	return tab;
})();

global TOUR = 0; TOUR ++; // getTurn()

global _RESU_PRIORITY = [
  "science": 3,
  "strength": 2,
  "magic": 1
];
/******************************************************************/
