//include("GLOBALS");

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
	for (var enemy in enemies) {
	 debug(getName(enemy) + " => " + isStatic(enemy));
		strength = getStrength(enemy);
		heal = getWisdom(enemy);
		res = getResistance(enemy);
		poison = getMagic(enemy);
		science = getScience(enemy);
		agile = getAgility(enemy);
		coeffDangereux = 
			  science * 5 * getLevel(enemy) / 100 
			+ strength * 4 * getLevel(enemy) / 100 
			+ heal * 3 * getLevel(enemy) / 100 
			+ res * 2 * getLevel(enemy) / 100 
			+ poison * 4 * getLevel(enemy) / 100 
			+ agile * 2 * getLevel(enemy) / 100;
		if (getCellDistance(getCell(), getCell(enemy)) < 8) {
			coeffDangereux *= 3;
		}
		if (isSummon(enemy))  {
			coeffDangereux *= 0.5;
		}
		if (isStatic(enemy)) {
		debug("is static");
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
		SCORE[allie] = 1;
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
		if (nb == 1) debugE("Mais Pillow, tu as fais comment tes inégalités ??? "); 
		var s2prim = somme2 / (nb - 1);
		ecartType = sqrt(s2prim);
	} else {
		ecartType = 0;
	}
	for(var cle : var valeur in tab) {
		resultat[cle] = (ecartType==0) ? 1 : ((valeur - moy) / ecartType) + 1;
		if (resultat[cle] <= 0) {
			// on remet le résultat en positif, sinon ça risque de fausser les résultats
			resultat[cle] = 0.1;
		}
    }
}



function setCoeffSolo() {
	var Scoring = [];
	if (getFightType() == FIGHT_TYPE_SOLO) {
		var leeks = getAliveEnemies();
		var _MAGIC = false;
		var _SHIELD = false;
		var _LITTLE_SCIENCE = false;
		var _MEDIUM_SCIENCE = false;
		var _BIG_SCIENCE = false;
		var _SAGESSE = false;
		var _FORCE = false;

		for (var leek in leeks) {
			if (!isSummon(leek)) {
				Scoring[leek] = 1;
				if (getMagic(leek) >= 300) {
					_MAGIC = true;
				}
				if (getResistance(leek) >= 200) {
					_SHIELD = true;
				}
				if (getScience(leek) >= 200 && getScience(leek) < 300) {
					_LITTLE_SCIENCE = true;
				}
				if (getScience(leek) >= 300 && getScience(leek) < 410) {
					_MEDIUM_SCIENCE = true;
				}
				if (getScience(leek) >= 410) {
					_BIG_SCIENCE = true;
				}
				if (getScience(leek) >= 200) {
					_FORCE = true;
				}
			}

			if (isSummon(leek)) {
				if (getName(leek) == "metallic_bulb") {
					Scoring[leek] = 0.5;
					var effects = getLaunchedEffects(leek);
					for(var effect in effects) {
						if (effect[0] == EFFECT_ABSOLUTE_SHIELD || effect[0] == EFFECT_RELATIVE_SHIELD) {
							if (effect[6] == getSummoner(leek)) {
								Scoring[leek] += 0.2;
							}
						}
					}
				} else if (getName(leek) == "healer_bulb") {
					Scoring[leek] = 0.5;
				} else if (getName(leek) == "lightning_bulb") {
					Scoring[leek] = 0.5;
					if (!_FORCE && _MAGIC) {
						Scoring[leek] = 0.8;
					}
				} else if (getName(leek) == "puny_bulb") {
					Scoring[leek] = 0.5;
				} else if (getName(leek) == "rocky_bulb") {
					Scoring[leek] = 0.3;
					if (!_FORCE && _MAGIC) {
						Scoring[leek] = 0.6;
					}
				} else if (getName(leek) == "iced_bulb") {
					Scoring[leek] = 0.4;
					if (!_FORCE && _MAGIC) {
						Scoring[leek] = 0.7;
					}
				} else if (getName(leek) == "fire_bulb") {
					Scoring[leek] = 0.4;
					if (!_FORCE && _MAGIC) {
						Scoring[leek] = 0.7;
					}
				}
			}
		}
	}
	if(getFightType() != FIGHT_TYPE_SOLO) {//TODO
		var leeks = getAliveEnemies();
		for (var leek in leeks) {
			if (!isSummon(leek)) {
				Scoring[leek] = 1;
			} else {
				Scoring[leek] = 0.3;
			}
		}
	}
	/*			alliés   		*/
	var leeks = getAliveAllies();
	for (var leek in leeks) {
		if (!isSummon(leek)) {
			Scoring[leek] = 1;
		} else {
			Scoring[leek] = 0.5;//Todo
		}
	}
	SCORE=Scoring;
}

