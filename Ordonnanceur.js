include("GLOBALS");

global ORDONNANCEMENT_DEFAULT = ORDONNANCEMENT_BVF;
global ORDONNANCEMENT_BVF = 0;// Big Value First
global ORDONNANCEMENT_SCIENCE = 1;//Spécial pour la science //Ne pas être un ordonnancement par defaut
global ORDONNANCEMENT_SUMMON_FIRST = 2; // Summon les bulbes en premier
global ORDONNANCEMENT_SUMMON_LAST = 3; // Summon les bulbes à la fin
global ORDONNANCEMENT_DEBUFF = 4;

global getActionFromCombo = [];
getActionFromCombo[ORDONNANCEMENT_BVF] = function(@combo) {
	var best;
	var valeur = 0;
	for (var i = 0; i < count(combo); i++) {
		if (combo[i][VALEUR] > valeur) {
			best = i;
			valeur = combo[i][VALEUR];
		}
	}
	return @combo[best];
};
getActionFromCombo[ORDONNANCEMENT_SCIENCE] = function(@combo) {
	var action = getActionInComboByTool(combo, CHIP_STRETCHING);
	if(action[CELL_DEPLACE]==-1) {// -1 si utilisation de la puce sur soi
		return action;
	}
	action = getActionInComboByTool(combo, CHIP_REFLEXES);
	if(action[CELL_DEPLACE]==-1) {
		return action;
	}
	action = getActionInComboByTool(combo, CHIP_RAGE);
	if(action[CELL_DEPLACE]==-1) {
		return action;
	}
	action = getActionInComboByTool(combo, CHIP_MOTIVATION);
	if(action[CELL_DEPLACE]==-1) {
		return action;
	}
	if(getFightType()==FIGHT_TYPE_SOLO || getFightType()==FIGHT_TYPE_BATTLE_ROYALE) {
		action = getActionInComboByTool(combo, CHIP_DOPING);
		if(action[CELL_DEPLACE]==-1) {
			return action;
		}
		action = getActionInComboByTool(combo, CHIP_PROTEIN);
		if(action[CELL_DEPLACE]==-1) {
			return action;
		}
	}
	//TODO: Rajouter des choses si besoin
	return getActionFromCombo[ORDONNANCEMENT_DEFAULT](combo);
};



getActionFromCombo[ORDONNANCEMENT_DEBUFF] = function(@combo) {
	var action = getActionInComboByTool(combo, CHIP_SOPORIFIC);
	if(action[CELL_DEPLACE]==-1) {// -1 si utilisation de la puce sur soi
		return action;
	}
	action = getActionInComboByTool(combo, CHIP_TRANQUILIZER);
	if(action[CELL_DEPLACE]==-1) {
		return action;
	}
	
	/*action = getActionInComboByTool(combo, CHIP_TRANQUILIZER);
	if(action[CELL_DEPLACE]==-1) {
		return action;
	}
	
	action = getActionInComboByTool(combo, CHIP_TRANQUILIZER);
	if(action[CELL_DEPLACE]==-1) {
		return action;
	}*/
	
	action = getActionInComboByTool(combo, CHIP_COVETOUSNESS);
	if(action[CELL_DEPLACE]==-1) {
		return action;
	}
	
	action = getActionInComboByTool(combo, CHIP_VENOM);
	if(action[CELL_DEPLACE]==-1) {
		return action;
	}
	//TODO: Rajouter des choses si besoin
	return getActionFromCombo[ORDONNANCEMENT_DEFAULT](combo);
};


getActionFromCombo[ORDONNANCEMENT_SUMMON_FIRST] = function(@combo) {
	for (var i = 0; i < count(combo); i++) {
		if (combo[i][EFFECT] == EFFECT_SUMMON) {
			return @combo[i];
			//TODO: faire une règle de priorité entre plusieurs summon ?
		}
	}
	return @getActionFromCombo[ORDONNANCEMENT_DEFAULT](combo);
};

getActionFromCombo[ORDONNANCEMENT_SUMMON_LAST] = function(@combo) {
	var nonSummonAction = [];
	var summonAction = [];
	for (var i = 0; i < count(combo); i++) {
		if (combo[i][EFFECT] != EFFECT_SUMMON) {
			push(nonSummonAction, @combo[i]);
		} else {
			push(summonAction, @combo[i]);
		}
	}
	if(count(nonSummonAction)) {
		return @getActionFromCombo[ORDONNANCEMENT_DEFAULT](combo);
	} else {
		if(!count(summonAction)) debugW("Actions Vide ???");
		return @summonAction[0];
	}
};

function getActionInComboByTool(@combo, tool) {
	for(var action in combo) {
		if(action[CHIP_WEAPON]==tool) {
			return action;
		}
	}
}



function getBestCombo(@actions, TP) {
	var W = TP; // TP Total
	var p = [null]; //Tableau des valeurs(gain) de chaque Action[i]
	var w = [null]; //Tableau des poids de chaque Action[i]
	var n = count(actions);
	for (var i = 1; i < n; i++) {
		push(p, actions[i][VALEUR]);
		push(w, actions[i][PT_USE]);
	}
	var resultat = knapsack(p, w, TP);
	var monCombo = [];
	var nbr_item = 0;
	for (var i = 1; i < n; i++) {
		if (resultat[i]) {
			monCombo[nbr_item] = actions[i];
			nbr_item++;
		}
	}
	return @monCombo;
}



function doAction(attack) {
	if (attack != [] && attack != null) {
		mark(attack[CELL_DEPLACE], COLOR_BLUE);
		mark(attack[CELL_VISE], COLOR_RED);
		if (attack[CELL_DEPLACE] != -1) {
			moveTowardCell(attack[CELL_DEPLACE]);
		}
		var n = 0;
		var nbPeopleAvant=count(getAliveAllies()+getAliveEnemies());
		var nbPeopleApres = nbPeopleAvant;
		while (n < attack[NB_TIR] && nbPeopleApres==nbPeopleAvant) {
			if (isWeapon(attack[CHIP_WEAPON])) {
				if (getWeapon() != attack[CHIP_WEAPON]) {
					setWeapon(attack[CHIP_WEAPON]);
				}
				useWeaponOnCell(attack[CELL_VISE]);
			} else {
				if (attack[CELL_VISE] != -1) {
					useChipOnCell(attack[CHIP_WEAPON], attack[CELL_VISE]);
				} else {
					useChipOnCell(attack[CHIP_WEAPON], getCell());
				}
			}
			n++;
			nbPeopleApres=count(getAliveAllies()+getAliveEnemies());
		}
    if(attack[CALLBACK] !== null) {
        attack[CALLBACK](attack[PARAM]);
  	}
		return USE_SUCCESS;
	} else {
		return USE_FAILED;
	}
}



/**
 *	@auteur : Caneton
 *	knapsack => Sert à trouver le meilleur combo
 *	entrées :
 *						p : tableau des poids. p[i] poids de la ième action (en PT)
 *						w : tableau des gains. p[i] gain de la ième action (ex: dégats infligés, soin reçu, protection reçu,...)
 *						W : Nombre total de PT que l'on dispose
 *	sortie : tableau de booléen.  p[i] == true => la ième action appartient au meilleur combo.
 *
 *	/!\ Dans chaque tableau la valeur en 0 doit être null !!!
 *
 *	ex :
 *	var W = 15;
 *	var p = [null, 4, 3, 3, 7];
 *	var w = [null, 5, 3, 4, 6];
 * sortie : [null, 1, 1, 0, 1]
 **/
function knapsack(p, w, W) {
	var n = count(p);
	var T = [];
	var x = [];

	for (var c = 0; c < n; c++) {
		T[c] = [];
	}


	for (var c = 0; c < n; c++) {
		x[c] = 0;
	}
	x[0] = null;

	/*				début de l'algo			*/

	for (var c = 0; c <= W; c++) {
		T[0][c] = 0;
	}

	for (var i = 1; i < n; i++) {
		for (var c = 0; c <= W; c++) {
			if (c >= w[i]) {
				T[i][c] = max(T[i - 1][c], T[i - 1][c - w[i]] + p[i]);
			} else {
				T[i][c] = T[i - 1][c];
			}
		}
	}

	/*		réccupération du meilleur combo */
	var i = n;
	var c = W;
	while (i > 0) {
		if (T[i][c] > T[i - 1][c]) {
			x[i] = 1;
			c = c - w[i];
		}
		i--;
	}

	return x;
}
