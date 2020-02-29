include("GLOBALS");

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
          //debug(getLeekName(enemy) + "is static");
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

	SCORE = [];
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
		SCORE[allie] = 1; // je remet 1, sinon avec la tourelle on risque d'être complétement décalé par rapport aux ennemis
	}
	//TODO: center les résultats sur 1

	getEchantillonCentre(SCORE, dangerousEnemies);
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
    debug("ecart-type = " + ecartType);
	for(var cle : var valeur in tab) {
		resultat[cle] = (ecartType==0) ? 1 : ((valeur - moy) / ecartType) + 1;
		if (resultat[cle] <= 0) {
			// on remet le résultat en positif, sinon ça risque de fausser les résultats
			resultat[cle] = 0.1;
		}
    }
}
