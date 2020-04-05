include("getArea");
include("getCellToUse");
include("Debug");
include("Utils");

/**
 *		Fonctions :
 *		- pvLost => Calcule le nombre de PV infligé pour une attaque (avec le renvoit de dégat et le vol de vie)
 *		- attaqueTypePoint => remplit un tableau permettant la "meilleur" action pour une arme de type point
 *		- AttaqueTypeAOE => remplit un tableau permettant la "meilleur" action pour une arme de type AOE
 *		- getAttackAction => mets à jour le tableau des actions avec les actions d'attaque
 *		- attaqueTypeLigne => remplit un tableau permettant la "meilleur" action pour une arme de type laser
 *		- frappeDuDemon => remplit un tableau permettant la "meilleur" action pour la frappe du demon
 **/





/**
 *	@auteur : Caneton
 *	getAttackAction => mets à jour le tableau des actions avec les actions d'attaque
 *	Paramètres :
 *			- actions : le tableau des actions à remplir
 *			- toutEnnemis : tableau comportant les leeks sur lesquels on autorise à tirer
 *			- cellsAccessible : tableau associatif des cases accessibles avec leur distance
 *
 *
 **/
function getAttackAction(@actions, @cellsAccessible, toutEnnemis, TPmax, @attack_tools) {
	//On reccupère armes et chip qui font des dommages
	var ope = getOperations();
	var c = 0;
	var nb_action = count(actions);


	// Calcul
	for (var tool in attack_tools) {
		if(ERROR_TOOLS[tool]) continue;
		var tir = [];
		if ( can_use_tool( tool , TPmax ) == true ) {
			var area = ALL_INGAME_TOOLS[tool][TOOL_AOE_TYPE];
			if (area == AREA_POINT) {
				tir = attaqueTypePoint(toutEnnemis, tool, cellsAccessible);
			} else {
				if (area == AREA_LASER_LINE) {
					var cellToCheck = getCellsToCheckForLaser(cellsAccessible, toutEnnemis);
					tir = attaqueTypeLigne(tool, cellToCheck, cellsAccessible);

				} else { //AOE
					if (tool == CHIP_DEVIL_STRIKE) {
						tir = frappeDuDemon(toutEnnemis,cellsAccessible);
					} else {
						tir = attaqueTypeAOE(toutEnnemis, tool, cellsAccessible);
					}
				}
			}
			if ((tir != [] || tir != null) && tir[VALEUR] > 15) // au moins 15 de dégats (en moyenne)
			{
				tir[CHIP_WEAPON] = tool;
				var coutPT;
				var valeur = tir[VALEUR];
				var n;
				var change_weapon = 0;
				if (ALL_INGAME_TOOLS[tool][TOOL_IS_WEAPON] && tool != getWeapon()) {
					change_weapon = 1;
				}
				coutPT = ALL_INGAME_TOOLS[tool][TOOL_PT_COST] ;
				if (ALL_INGAME_TOOLS[tool][TOOL_COOLDOWN_TIME]) {
					n = 1;
				} else {
					n = floor(TPmax / coutPT);
				}
				//ajouter le bon nombre de fois dans les actions
				for (var o = 1; o <= n; o++) {
					tir[NB_TIR] = o;
					tir[PT_USE] = o * coutPT + change_weapon;
					tir[VALEUR] = o * valeur;
					tir[EFFECT] = ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][0][TOOL_EFFECT_TYPE];
					tir[CALLBACK] = (function (params) {
						updateInfoLeeks();
						var cible = getLeekOnCell(params[CELL_VISE]);
						if (cible && isAlreadyShackle(cible, params[EFFECT])) {
							STOP_ACTION = true;
						}
					});
					tir[PARAM] = tir;
					actions[nb_action] = tir;
					nb_action++;
				}
			}
		}
	}
	//debugCP("Calcul getAttackAction => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + " %", COLOR_RED);
}



/**
 * 	@auteur : Caneton
 * 	attaqueTypeLigne => remplit un tableau permettant la "meilleure" action pour une arme de type laser
 *	Paramètres :
 *			- cellToCheck : tableau comportant les cases avec les orientations où il y a des ennemis qui se trouve dans l'alignement
 *			- tool : arme d'attaque (de type LASER !)
 *			- cellsAccessible : tableau associatif des cases accessibles avec leur distance
 * Retour : tableau regroupant les informations permettant de faire une attaque : [CaseOùilFautSeDéplacer, CaseOùIlFautTirer, ValeurAssociée]
 *							(la valeur prend en compte les dégats que l'on inflige à l'ennemi, le retour de dégat et le vol de vie)
 *
 **/
function attaqueTypeLigne(tool, @cellToCheck, @cellsAccessible) {
	var ope = getOperations();
	var from = 0;
	var withOrientation = 1;

	var orientation = [-17, 17, -18, 18];
	var degat = [];
	var degat_renvoyer = 0;
	var volDeVie = 0;

	var valeurMax = 0;
	var distanceBestAction = 100;
	var bestAction = [];

	for (var cell in cellToCheck) {
		if (lineOfSight(cell[from], cell[from] + MIN_RANGE[tool] * orientation[cell[withOrientation]], ME)) {
			/*
			var cell_affecter = getAreaLine(tool,cell[from], cell[withOrientation]);
			var sommeDegat = 0;
			var sommeVolVie = 0;
			var sommeRenvoi = 0;
			for (var i in cell_affecter) {
				if (getCellContent(i) == CELL_PLAYER) {
					var leek = getLeekOnCell(i);
					if (leek != getLeek()) {
						pvLost(INFO_LEEKS[ME], INFO_LEEKS[leek], tool, cell, degat, degat_renvoyer, volDeVie);
						var team = (isAlly(leek)) ? -1 : 1;
						sommeDegat += team * SCORE[leek] * degat[MOYEN];
						sommeVolVie += volDeVie;
						sommeRenvoi += degat_renvoyer;
					}
				}
			}
			var valeur = sommeDegat + min(getTotalLife() - getLife(), sommeVolVie) - sommeRenvoi;
			*/
			var aTargetEffect = getTargetEffect(ME, tool, cell[from] + MIN_RANGE[tool] * orientation[cell[withOrientation]], true, true);
			var valeur = getValueOfTargetEffect(aTargetEffect);
			if (valeur > valeurMax || valeur == valeurMax && cellsAccessible[cell[from]] < distanceBestAction) {
				bestAction[CELL_DEPLACE] = cell[from];
				bestAction[CELL_VISE] = cell[from] + MIN_RANGE[tool]* orientation[cell[withOrientation]];
				bestAction[VALEUR] = valeur;
				valeurMax = valeur;
				distanceBestAction = cellsAccessible[cell[from]];
			}
		}
	}
	debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + bestAction + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}


/**
 *	@auteur : Caneton
 * frappeDuDemon => remplit un tableau permettant la "meilleur" action pour la frappe du demon
 *	Paramètres :
 *			- toutEnnemis : tableau comportant les leeks sur lesquels on autorise à tirer
 *			- cellsAccessible : tableau associatif des cases accessibles avec leur distance
 * Retour : tableau regroupant les informations permettant de faire une attaque : [CaseOùilFautSeDéplacer, CaseOùIlFautTirer, ValeurAssociée]
 *							(la valeur prends en compte les dégats que l'on inflige à l'ennemis, le retour de dégat et le vol de vie)
 *
 **/
function frappeDuDemon(toutEnnemis, @cellsAccessible) {
	var oper = getOperations();
	var bestAction = [];
	var distanceBestAction = 0;
	var valeurMax = 0;
	var deja_fait = [];
	/*var lost=[];
	pvLost(INFO_LEEKS[ME], INFO_LEEKS[ME], CHIP_DEVIL_STRIKE, getCell(), lost, null, null);
	lost=lost[MIN];*/
	var lost = getTargetEffect(ME, CHIP_DEVIL_STRIKE, getCell(), false, false)[ME][EFFECT_DAMAGE][0];
	if (lost < 100) {
		for (var i = 0; i < count(toutEnnemis); i++) {
			var cellE = getCell(toutEnnemis[i]);
			var zone = getEffectiveArea(CHIP_DEVIL_STRIKE, cellE);
			for (var j in zone) {
				if(!deja_fait[j] && (isEmptyCell(j) || j==getCell())) {
					deja_fait[j]=true;
					if (cellsAccessible[j] !== null) {
						/*
						var ennemis = getChipTargets(CHIP_DEVIL_STRIKE, j);
						var totpv = 0;
						var totrenvoi = 0;
						var totvoldevie = 0;
						for (var ene in ennemis) {
							var degat = [];
							var renvoi = 0;
							var voldevie = 0;
							pvLost(INFO_LEEKS[ME], INFO_LEEKS[ene], CHIP_DEVIL_STRIKE, j, degat, renvoi, voldevie);
							var team = (isAlly(ene)) ? -1 : 1;
							totpv += team * SCORE[ene] * degat[MOYEN];
							if(ene!=ME) {
								totrenvoi += renvoi;
								totvoldevie += voldevie;
							}
						}
						var valeur = totpv + min(getTotalLife() - getLife(), totvoldevie) - totrenvoi;
						*/
						var aTargetEffect = getTargetEffect(ME, CHIP_DEVIL_STRIKE, j, true, true);
						var valeur = getValueOfTargetEffect(aTargetEffect);
						if (valeur > valeurMax || valeur == valeurMax && cellsAccessible[j] < distanceBestAction) {
							bestAction[CELL_DEPLACE] = j;
							bestAction[CELL_VISE] = j;
							bestAction[VALEUR] = valeur;
							valeurMax = valeur;
							distanceBestAction = cellsAccessible[j];
						}
					}
				}
			}
		}
	}
	debugP("Frappe du demon : " + bestAction + " => " + ((getOperations() - oper) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}


/**
 *	@auteur : Caneton
 * AttaqueTypeAOE => remplit un tableau permettant la "meilleur" action pour une arme de type AOE
 *	Paramètres :
 *			- toutEnnemis : tableau comportant les leeks sur lesquels on autorise à tirer
 *			- tool : arme ou puce d'attaque ( de préférance de type AOE)
 *			- cellsAccessible : tableau associatif des cases accessibles avec leur distance
 * Retour : tableau regroupant les informations permettant de faire une attaque : [CaseOùilFautSeDéplacer, CaseOùIlFautTirer, ValeurAssociée]
 *							(la valeur prends en compte les dégats que l'on inflige à l'ennemis, le retour de dégat et le vol de vie)
 *
 **/
function attaqueTypeAOE(toutEnnemis, tool, @cellsAccessible) {
	var oper = getOperations();
	var bestAction = [];
	var distanceBestAction = 0;
	var cell_deplace;
	var valeurMax = 0;
	var maxRange = ALL_INGAME_TOOLS[tool][TOOL_MAX_RANGE];
	var deja_fait = [];
	for (var ennemis in toutEnnemis) {
		var distance = getDistance(getCell(), getCell(ennemis));
		if (distance <= maxRange + getMP())
		{ // Ne permet pas de tirer au delà de maxRange alors que l'AOE pourrait toucher un ennemi sans être à range ? // Je sais pas trop, comme ça je dirais que si en fait, mais faudrait voir avec Caneton. Tu peux lui mettre un MP pour lui dire, il verra quand il sera co.
			var zone = getEffectiveArea(tool, getCell(ennemis));
			if (zone != null) {
				for (var cell in zone) {
					if (!deja_fait[cell]) {
						deja_fait[cell] = true;
						cell_deplace = getCellToUseToolsOnCell(tool, cell, cellsAccessible);
						var sommeDegat = 0;
						var sommeRenvoi = 0;
						var sommeVolVie = 0;
						var degat, degat_renvoyer, volDeVie;
						if (cell_deplace != -2) {
							/*var cibles = getTarget(tool, cell);
							if (cibles != []) {
								for (var leek in cibles) {
									if (leek != getLeek()) {
										pvLost(INFO_LEEKS[ME], INFO_LEEKS[leek], tool, cell, degat, degat_renvoyer, volDeVie);
										var team = (isAlly(leek)) ? -1 : 1;
										sommeDegat += team * SCORE[leek] * degat[MOYEN];
										sommeVolVie += volDeVie;
										sommeRenvoi += degat_renvoyer;
									}
								}
							}
							var valeur = sommeDegat + min(getTotalLife() - getLife(), sommeVolVie) - sommeRenvoi;
							*/
							var aTargetEffect = getTargetEffect(ME, tool, cell, true, true);
							var valeur = getValueOfTargetEffect(aTargetEffect);
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
	debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + bestAction + " => " + ((getOperations() - oper) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}




/**
 *	@auteur : Caneton
 * attaqueTypePoint => remplit un tableau permettant la "meilleur" action pour une arme de type point
 *	Paramètres :
 *			- toutEnnemis : tableau comportant les leeks sur lesquels on autorise à tirer
 *			- tool : arme ou puce d'attaque ( de préférance de type point car il n'y a pas de prise en compte de l'AOE)
 *			- cellsAccessible : tableau associatif des cases accessibles avec leur distance
 * Retour : tableau regroupant les informations permettant de faire une attaque : [CaseOùilFautSeDéplacer, CaseOùIlFautTirer, ValeurAssociée]
 *							(la valeur prends en compte les dégats que l'on inflige à l'ennemis, le retour de dégat et le vol de vie)
 *
 **/
function attaqueTypePoint(toutEnnemis, tool, @cellsAccessible) {
	var ope = getOperations();
	var cell_deplace;
	var cellEnnemis;
	var bestAction = [];
	var action;
	var valeur;
	var bestValeur = 0;
	var distanceBestAction = 0;
	var ok = false;
	for (var ennemis in toutEnnemis) {
		cellEnnemis = getCell(ennemis);
		if(tool == CHIP_SPARK) {
			cell_deplace = getCellToUseChip(tool, ennemis);
			var length = getPathLength(getCell(), cell_deplace);
			ok = length <= getMP() && length !== null;

		} else {
			cell_deplace = getCellToUseToolsOnCell(tool, cellEnnemis, cellsAccessible);
			ok = cell_deplace !== -2;
		}

		if (ok) { //la cellule doit être atteignable
			/*
			var degat = [0, 0],
				degat_renvoyer = 0,
				volDeVie = 0;
			pvLost(INFO_LEEKS[ME], INFO_LEEKS[ennemis], tool, null, degat, degat_renvoyer, volDeVie);
			degat[MOYEN] *= SCORE[ennemis];
			valeur = degat[MOYEN] + min(getTotalLife() - getLife(), volDeVie) - degat_renvoyer;
			*/
			var aTargetEffect = getTargetEffect(ME, tool, cellEnnemis, true, true);
			valeur = getValueOfTargetEffect(aTargetEffect);
			if (valeur > bestValeur || valeur == bestValeur && cellsAccessible[cell_deplace] < distanceBestAction) {
				bestAction[CELL_DEPLACE] = cell_deplace;
				bestAction[CELL_VISE] = cellEnnemis;
				bestAction[VALEUR] = valeur;
				distanceBestAction = cellsAccessible[cell_deplace];
				bestValeur = valeur;
			}
		}
	}
	debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + bestAction + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}





function getTarget(tool, cell) {
	return (!ALL_INGAME_TOOLS[tool][TOOL_IS_WEAPON]) ? getChipTargets(tool, cell) : getWeaponTargets(tool, cell);
}





/**
 * @auteur : Caneton
 * Proccédure pvLost => Calcule le nombre de PV infligé pour une attaque (avec le renvoit de dégat et le vol de vie, ainsi que le retour de chatiment)
 *
 *	paramètre :
 *		- tireur et cible => tableau de la forme : [Leek, AbsoluteShield, RelativeShield, force, RenvoiDegat]
 *		- arme_chip => l'arme ou la chip utilisée
 *	 	- cellVisee => la cellule cible (peut-être mis à null si ce n'est pas pour calculer les AOE)
 *			/!\ paramètres passés par adresse(@) => la valeur est initialisée avant l'appel de la fonction puis modifié dans la fonction !
 *		- degat : tableau contenant les degats minimum et moyen : [degatMin, degatMoyen]
 *		- degat_renvoyer : valeur des renvois de dégat
 *		- volDeVie : valeur du vol de vie
 *
 * @DEPRECIATED
 */
function pvLost(tireur, cible, arme_chip, cellVisee, @degat, @degat_renvoyer, @volDeVie) {
	debugW('La fonction pvLost est dépréciée');
	/*	Tireur et cible sont des tableaux de la forme :*/
	var Leek = 0;
	var AbsoluteShield = 1;
	var RelativeShield = 2;
	var Strenght = 3;
	var RenvoiDegat = 4;
	var Magie = 5;
	var Science = 6;

	/*								*/

	degat = [0, 0];
	degat_renvoyer = 0;
	volDeVie = 0;


	var aoe;
	var effects = ALL_INGAME_TOOLS[arme_chip][TOOL_ATTACK_EFFECTS];
	var area = ALL_INGAME_TOOLS[arme_chip][TOOL_AOE_TYPE];
	var degatMoyen = 0;
	var degatMin = 0;

	if (area == AREA_POINT || area == AREA_LASER_LINE || cellVisee === null) {
		aoe = 1;
	} else {
		var distance = getCellDistance(cellVisee, getCell(cible[Leek]));
		aoe = 1 - (distance * 0.2);
	}

	if (aoe < 0.399) {
		debugEP("pvLost : Erreur dans le calcul de l'aoe ! : " + aoe + " => " + ALL_INGAME_TOOLS[arme_chip][TOOL_NAME]);
		aoe = 0;
	}

	for (var effect in effects) {
		if (effect[TOOL_EFFECT_TYPE] == EFFECT_DAMAGE) {
			degatMoyen = effect[TOOL_AVERAGE_POWER];
			degatMin = effect[TOOL_MIN_POWER];
			var degatBrutMoyen = aoe * degatMoyen * (1 + tireur[Strenght] / 100);
			var degatBrutMin = aoe * degatMin * (1 + tireur[Strenght] / 100);
			var degatTmp = [0, 0];
			degatTmp[MOYEN] = max(degatBrutMoyen * (1 - cible[RelativeShield] / 100) - cible[AbsoluteShield], 0);
			degatTmp[MIN] = max(degatBrutMin * (1 - cible[RelativeShield] / 100) - cible[AbsoluteShield], 0);

			degat[MOYEN] = degat[MOYEN] + degatTmp[MOYEN];
			degat[MIN] = degat[MIN] + degatTmp[MIN];
			degat_renvoyer = degat_renvoyer + cible[RenvoiDegat] * degatTmp[MOYEN] / 100;
			volDeVie = volDeVie + getWisdom(tireur[Leek]) * degatTmp[MOYEN] / 1000;
		}
		if (effect[TOOL_EFFECT_TYPE] == EFFECT_POISON) {
			degatMoyen = effect[TOOL_AVERAGE_POWER];
			degatMin = effect[TOOL_MIN_POWER];
			var degatBrutMoyen = aoe * degatMoyen * (1 + tireur[Magie] / 100);
			var degatBrutMin = aoe * degatMin * (1 + tireur[Magie] / 100);
			var nb_tour = effect[TOOL_NUMBER_TURN_EFFECT_LAST];
			degat[MOYEN] = degat[MOYEN] + sqrt(nb_tour) * degatBrutMoyen; //petit bonus pour le effets qui dure plus long temps(a adapter si besoin)
			degat[MIN] = degat[MIN] + degatBrutMin[MIN];
		}
		if (effect[TOOL_EFFECT_TYPE] == EFFECT_SHACKLE_TP && ! isAlreadyShackle(cible[Leek], effect[TOOL_EFFECT_TYPE])) {
			degatMoyen = effect[TOOL_AVERAGE_POWER];
			degatMin = effect[TOOL_MIN_POWER];
			var degatBrutMoyen = aoe * degatMoyen * (1 + tireur[Magie] / 100);
			var degatBrutMin = aoe * degatMin * (1 + tireur[Magie] / 100);
			var nb_tour = effect[TOOL_NUMBER_TURN_EFFECT_LAST];
			degat[MOYEN] = degat[MOYEN] + sqrt(nb_tour) * degatBrutMoyen * 40; //petit bonus pour le effets qui dure plus long temps(a adapter si besoin)
			degat[MIN] = degat[MIN] + degatBrutMin[MIN];
		}
		if (effect[TOOL_EFFECT_TYPE] == EFFECT_SHACKLE_MP && ! isAlreadyShackle(cible[Leek], effect[TOOL_EFFECT_TYPE])) {
			degatMoyen = effect[TOOL_AVERAGE_POWER];
			degatMin = effect[TOOL_MIN_POWER];
			var degatBrutMoyen = aoe * degatMoyen * (1 + tireur[Magie] / 100);
			var degatBrutMin = aoe * degatMin * (1 + tireur[Magie] / 100);
			var nb_tour = effect[TOOL_NUMBER_TURN_EFFECT_LAST];
			degat[MOYEN] = degat[MOYEN] + sqrt(nb_tour) * degatBrutMoyen * 35; //petit bonus pour le effets qui dure plus long temps(a adapter si besoin)
			degat[MIN] = degat[MIN] + degatBrutMin[MIN];
		}
		if (effect[TOOL_EFFECT_TYPE] == EFFECT_SHACKLE_STRENGTH && ! isAlreadyShackle(cible[Leek], effect[TOOL_EFFECT_TYPE])) {
			degatMoyen = effect[TOOL_AVERAGE_POWER];
			degatMin = effect[TOOL_MIN_POWER];
			var degatBrutMoyen = aoe * degatMoyen * (1 + tireur[Magie] / 100);
			var degatBrutMin = aoe * degatMin * (1 + tireur[Magie] / 100);
			var nb_tour = effect[TOOL_NUMBER_TURN_EFFECT_LAST];
			degat[MOYEN] = degat[MOYEN] + sqrt(nb_tour) * degatBrutMoyen; //petit bonus pour le effets qui dure plus long temps(a adapter si besoin)
			degat[MIN] = degat[MIN] + degatBrutMin[MIN];
		}
		if (effect[TOOL_EFFECT_TYPE] == EFFECT_SHACKLE_MAGIC && ! isAlreadyShackle(cible[Leek], effect[TOOL_EFFECT_TYPE])) {
			degatMoyen = effect[TOOL_AVERAGE_POWER];
			degatMin = effect[TOOL_MIN_POWER];
			var degatBrutMoyen = aoe * degatMoyen * (1 + tireur[Magie] / 100);
			var degatBrutMin = aoe * degatMin * (1 + tireur[Magie] / 100);
			var nb_tour = effect[TOOL_NUMBER_TURN_EFFECT_LAST];
			degat[MOYEN] = degat[MOYEN] + sqrt(nb_tour) * degatBrutMoyen; //petit bonus pour le effets qui dure plus long temps(a adapter si besoin)
			degat[MIN] = degat[MIN] + degatBrutMin[MIN];
		}

		if(effect[TOOL_EFFECT_TYPE] == EFFECT_KILL) {
			var bulbe = cible[Leek];
			if(isAlly(bulbe)) {
				degat[MOYEN] = getLife(bulbe);
				degat[MIN] = getLife(bulbe);
				volDeVie = 0;// pas de vol de vie si on tue le bulbe
				degat_renvoyer = 0; // pas de renvoi non plus
				break;
			}
		}
		if(arme_chip == CHIP_PUNISHMENT)
		{
			var degat_ligne_ennemie = 0;
			var degat_ligne_lanceur = 0;
			if(effect[TOOL_EFFECT_TYPE] == EFFECT_LIFE_DAMAGE)
			{
				degatMoyen = effect[TOOL_AVERAGE_POWER] * getLife(tireur) / 100;
				var degatBrutMoyen = aoe * degatMoyen;
				var degatTmp = [0, 0];
				degatTmp[MOYEN] = max(degatBrutMoyen * (1 - cible[RelativeShield] / 100) - cible[AbsoluteShield], 0);
				degat[MOYEN] = degat[MOYEN] + degatTmp[MOYEN];
				degat_renvoyer = degat_renvoyer + cible[RenvoiDegat] * degatTmp[MOYEN] / 100;
				degat_ligne_ennemie = degat[MOYEN];
			}
			if(effect[TOOL_EFFECT_TYPE] == EFFECT_TARGET_ALWAYS_CASTER)
			{
				var degat_retour_chatiment = effect[TOOL_AVERAGE_POWER] * getLife(tireur) / 100;
				var degatBrutMoyen = aoe * degat_retour_chatiment;
				var degatTmp = [0, 0];
				degatTmp[MOYEN] = max(degatBrutMoyen * (1 - tireur[RelativeShield] / 100) - tireur[AbsoluteShield], 0);
				degat[MOYEN] = degat[MOYEN] + degatTmp[MOYEN];
				degat_ligne_lanceur = degat[MOYEN];

				if(degat[MOYEN] >= getLife(tireur))
				{
					degatMoyen = 0;
				}
				else
				{
					degat[MOYEN] = min(degat_ligne_ennemie, getLife(cible)) - degat_ligne_lanceur; //Calcul du risque
				}
			}
		}
		if(effect[TOOL_EFFECT_TYPE] == EFFECT_NOVA_DAMAGE)
		{
			degatMoyen = effect[TOOL_AVERAGE_POWER] ;
			degatMin = effect[TOOL_MIN_POWER] ;
			var degatBrutMoyen = aoe * degatMoyen * (1 + tireur[Science] / 100);
			var degatBrutMin = aoe * degatMin * (1 + tireur[Science] / 100);

			degat[MOYEN] = degat[MOYEN] + degatBrutMoyen;
			degat[MIN] = degat[MIN] + degatBrutMin;
		}
	}
}



