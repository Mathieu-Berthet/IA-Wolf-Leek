include("GLOBALS");
include("Debug");



// TODO: Mettre à jour avec les autres variables COEFF_*

COEFF_LEEK_EFFECT = (function (){
		var tab = [];
		var leeks = getAliveAllies() + getAliveEnemies();
		for (var leek in leeks) {
			tab[leek] = [];
			for (var effect : var tabEffect in ALL_EFFECTS) {
				tab[leek][effect] = (isSummon(leek) || isStatic(leek)) ? 0.5 : 1;
			}
		}
		return @tab;
})();



// SCORE_RESISTANCE 
(function () {
	var leeks = getAliveAllies();
	for(var leek in leeks) {
		var value;
		if(getFightType() == FIGHT_TYPE_SOLO) {
			var ennemy = getNearestEnemy();
			if(isSummon(ennemy)) ennemy = getSummoner(ennemy);
			if(getMagic(ennemy) >= 300 && getStrength(ennemy) < 100) {
				value =(isSummon(leek)) ? 0 : 0.2;
			} else {
				value =(isSummon(leek)) ? 0.4 : 1;
			}
		} else {
			 value = (isSummon(leek) || isStatic(leek)) ? 0.2 : 1;
		}
		COEFF_LEEK_EFFECT[leek][EFFECT_DAMAGE_RETURN] = value;
		COEFF_LEEK_EFFECT[leek][EFFECT_ABSOLUTE_SHIELD] = value;
		COEFF_LEEK_EFFECT[leek][EFFECT_RELATIVE_SHIELD] = value;
		COEFF_LEEK_EFFECT[leek][EFFECT_RAW_ABSOLUTE_SHIELD] = value;
	}
})();




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
						
		COEFF_LEEK_EFFECT[allie][EFFECT_BUFF_STRENGTH] = nbDamageTool == 0 ? 0 : sqrt(nbDamageTool);
		COEFF_LEEK_EFFECT[allie][EFFECT_BUFF_WISDOM] = nbHealTool == 0 ? 0 : sqrt(nbHealTool);
		COEFF_LEEK_EFFECT[allie][EFFECT_BUFF_RESISTANCE] = nbResiTool == 0 ? 0 : sqrt(nbResiTool);
		COEFF_LEEK_EFFECT[allie][EFFECT_BUFF_AGILITY] = 1 + (nbReturnDamageTool == 0 ? 0 : sqrt(nbReturnDamageTool)) + (nbScienceTool == 0 ? 0 : sqrt(nbScienceTool));
		COEFF_LEEK_EFFECT[allie][EFFECT_BUFF_TP] = 1.7;
		COEFF_LEEK_EFFECT[allie][EFFECT_BUFF_MP] = 1.7;
		
		
		if(isSummon(allie)) {
			for (var cle : var val in COEFF_LEEK_EFFECT[allie]) {
				if (inArray([EFFECT_BUFF_STRENGTH, EFFECT_BUFF_RESISTANCE, EFFECT_BUFF_WISDOM, EFFECT_BUFF_AGILITY, EFFECT_BUFF_TP, EFFECT_BUFF_MP], cle)) {
					COEFF_LEEK_EFFECT[allie][cle] *= 0.7;
				}
			}
		}
	}
}


function getOpponent(enemies) {
	var dangerousEnemies = [];
	var coeffAllies = [];
	var strength = -1;
	var heal = -1;
	var res = -1;
	var poison = -1;
	var science = -1;
	var agile = -1;
	var coeffDangereux = 0;
	var coeffAllie = 0;
	var degatPoisonPris = 0;
	for (var enemy in enemies)
	{
		strength = getStrength(enemy);
		heal = getWisdom(enemy);
		res = getResistance(enemy);
		poison = getMagic(enemy);
		science = getScience(enemy);
		agile = getAgility(enemy);
		coeffDangereux = // revoir le calcul, difficile de repositionner la tourelle avec un bon coeff
			  science * 5 * getLevel(enemy) / 100
			+ strength * 4 * getLevel(enemy) / 100
			+ heal * 3 * getLevel(enemy) / 100
			+ res * 2 * getLevel(enemy) / 100
			+ poison * 4 * getLevel(enemy) / 100
			+ agile * 2 * getLevel(enemy) / 100;
		for(var effect in getEffects(enemy))
		{
			if(effect[0] == EFFECT_POISON)
			{
				degatPoisonPris += effect[1];
			}
			if(effect[0] == EFFECT_HEAL)
			{
				degatPoisonPris -= effect[1];
			}
		}
		if (getCellDistance(getCell(), getCell(enemy)) < 8) 
		{
			coeffDangereux *= 3;
		}
		if(degatPoisonPris >= getLife(enemy)) {
			coeffDangereux *= 0.2; // j'évite le 0, si un poireau n'a rien a faire autant le kill avant qu'il reçoive un antidote
		}
		if (isSummon(enemy)) {
			coeffDangereux *= 0.5;
		}
		if (isStatic(enemy)) {
		     //debugP(getLeekName(enemy) + "is static");
		     if(isStatic(ME)){
		     	coeffDangereux =1;
		     } else {
				coeffDangereux = 0.45; // avec ces stat la tourelle a un coeff bcp trop élevé
				coeffDangereux *= getTotalLife(enemy) / getLife(enemy); // si il n'y a plus beaucoup de vie, on se focus dessus
			}
		}
		dangerousEnemies[enemy] = coeffDangereux;
		coeffDangereux = 0;
	}

	var score = [];
	getEchantillonCentre(SCORE, dangerousEnemies);
	
	for (var allie in getAliveAllies())
	{/*
		strength = getStrength(allie);
		heal = getWisdom(allie);
		res = getResistance(allie);
		poison = getMagic(allie);
		science = getScience(allie);
		agile = getAgility(allie);
		coeffAllie = science * 5 * getLevel(allie) / 100 + strength * 4 * getLevel(allie) / 100 + heal * 3 * getLevel(allie) / 100 + res * 2 * getLevel(allie) / 100 + poison * 4 * getLevel(allie) / 100 + agile * 2 * getLevel(allie) / 100;
		if (isSummon(allie))
		{
			coeffAllie *= 0.5;
		}
		coeffAllies[allie] = coeffAllie;
		coeffAllie = 0;
		*/
		score[allie] = (isSummon(allie) || isStatic(allie)) ? 0.5 : 1; // je remet 1, sinon avec la tourelle on risque d'être complétement décalé par rapport aux ennemis
	}
	//TODO: center les résultats sur 1

	for (var leek : var value in score) {
		COEFF_LEEK_EFFECT[leek][EFFECT_DAMAGE] = value;
		COEFF_LEEK_EFFECT[leek][EFFECT_POISON] = value;
		COEFF_LEEK_EFFECT[leek][EFFECT_NOVA_DAMAGE] = value;
		COEFF_LEEK_EFFECT[leek][EFFECT_LIFE_DAMAGE] = value;
	}
	//getEchantillonCentre(SCORE, coeffAllies);
}


/**
 * @auteur : Caneton
 * recentre les coefficients "sur 1"
 *
 * J'ai pas encore tester...
 * il faut au moins 2 elements dans le tableau
 */
function getEchantillonCentre(@resultat, tab) {
	var moy = 0;
	var nb = count(tab);
	var ecartType;

    for (var x in tab) moy += x;
    moy /= nb;

    var somme2 = 0;
    for (var x in tab) somme2 += (x - moy) ** 2;

	if(nb>1) {
		var s2prim = somme2 / (nb - 1);
		ecartType = sqrt(s2prim);
	} else {
		ecartType = 0;
	}
    debugP("ecart-type = " + ecartType);
	for(var cle : var valeur in tab) {
		resultat[cle] = (ecartType==0) ? 1 : ((valeur - moy) / ecartType) + 1;
		if (resultat[cle] <= 0) {
			// on remet le résultat en positif, sinon ça risque de fausser les résultats
			resultat[cle] = 0.1;
		}
    }
}
