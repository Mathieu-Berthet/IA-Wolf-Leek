include("getArea");
include("getCellToUse");
include("Debug");
include("Utils");

/**
 *		Fonctions :
 *		- getAttackAction => mets à jour le tableau des actions avec les actions d'attaque
 *		- attaqueTypePoint => remplit un tableau permettant la "meilleur" action pour une arme de type point
 *		- AttaqueTypeAOE => remplit un tableau permettant la "meilleur" action pour une arme de type AOE
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
					tir[PM_USE] = (tir[CELL_DEPLACE] >= 0) ? cellsAccessible[tir[CELL_DEPLACE]] : 0;
					tir[VALEUR] = o * valeur;
					tir[EFFECT] = ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][0][TOOL_EFFECT_TYPE];
					tir[CALLBACK] = (function (params) {
						updateInfoLeeks();
						var cible = getEntityOnCell(params[CELL_VISE]);
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
			var cellVise = [
				'cell' : cell[from] + MIN_RANGE[tool] * orientation[cell[withOrientation]],
				'from' : cell[from],
				'orientation' : cell[withOrientation]
			];
			var oldPosition = INFO_LEEKS[ME][CELL];
			INFO_LEEKS[ME][CELL] = cell[from]; // on simule le déplacement
			var aTargetEffect = getTargetEffect(ME, tool, cellVise, true);
			checkKill(aTargetEffect);
			var valeur = getValueOfTargetEffect(aTargetEffect);
			INFO_LEEKS[ME][CELL] = oldPosition;
			if (valeur > valeurMax || valeur == valeurMax && cellsAccessible[cell[from]] < distanceBestAction) {
				bestAction[CELL_DEPLACE] = cell[from];
				bestAction[CELL_VISE] = cell[from] + MIN_RANGE[tool]* orientation[cell[withOrientation]];
				bestAction[VALEUR] = valeur;
				valeurMax = valeur;
				distanceBestAction = cellsAccessible[cell[from]];
			}
		}
	}
	//debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + bestAction + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
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
	var lost = getTargetEffect(ME, CHIP_DEVIL_STRIKE, getCell(), false)[ME][EFFECT_DAMAGE][0]; // pas besoin de simuler le déplacement car le dernier paramètre est à false
	if (lost < 100) {
		for (var i = 0; i < count(toutEnnemis); i++) {
			var cellE = getCell(toutEnnemis[i]);
			var zone = getEffectiveArea(CHIP_DEVIL_STRIKE, cellE);
			for (var j in zone) {
				if(!deja_fait[j] && (isEmptyCell(j) || j==getCell())) {
					deja_fait[j]=true;
					if (cellsAccessible[j] !== null) {
						var oldPosition = INFO_LEEKS[ME][CELL];
						INFO_LEEKS[ME][CELL] = cellsAccessible[j]; // on simule le déplacement
						var aTargetEffect = getTargetEffect(ME, CHIP_DEVIL_STRIKE, j, true);
						checkKill(aTargetEffect);
						var valeur = getValueOfTargetEffect(aTargetEffect);
						INFO_LEEKS[ME][CELL] = oldPosition;
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
	//debugP("Frappe du demon : " + bestAction + " => " + ((getOperations() - oper) / OPERATIONS_LIMIT * 100) + "%");
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
							var oldPosition = INFO_LEEKS[ME][CELL];
							INFO_LEEKS[ME][CELL] = cell_deplace; // on simule le déplacement
							var aTargetEffect = getTargetEffect(ME, tool, cell, true);
							checkKill(aTargetEffect);
							var valeur = getValueOfTargetEffect(aTargetEffect);
							INFO_LEEKS[ME][CELL] = oldPosition;
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
	//debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + bestAction + " => " + ((getOperations() - oper) / OPERATIONS_LIMIT * 100) + "%");
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
			cell_deplace = getCellToUseChip(tool, ennemis); // TODO : ah bah la fonction de leekwars ne prends pas en compte que la puce n'a pas besoin de LOS... il va falloir coder quelque chose qui vérifie juste la cellDistance
			var length = getPathLength(getCell(), cell_deplace);
			ok = length <= getMP() && length !== null;

		} else {
			cell_deplace = getCellToUseToolsOnCell(tool, cellEnnemis, cellsAccessible);
			ok = cell_deplace !== -2;
		}

		if (ok) { //la cellule doit être atteignable
			var oldPosition = INFO_LEEKS[ME][CELL];
			INFO_LEEKS[ME][CELL] = cell_deplace; // on simule le déplacement
			var aTargetEffect = getTargetEffect(ME, tool, cellEnnemis, true);
			valeur = getValueOfTargetEffect(aTargetEffect);
			INFO_LEEKS[ME][CELL] = oldPosition;
			if (valeur > bestValeur || valeur == bestValeur && cellsAccessible[cell_deplace] < distanceBestAction) {
				bestAction[CELL_DEPLACE] = cell_deplace;
				bestAction[CELL_VISE] = cellEnnemis;
				bestAction[VALEUR] = valeur;
				distanceBestAction = cellsAccessible[cell_deplace];
				bestValeur = valeur;
			}
		}
	}
	//debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + bestAction + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}
