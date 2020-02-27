// dernière mise à jour le 17/02/18 par Caneton
include("GLOBALS");
include("getCellToUse");
include("Attaque");
 
global dangerousEnnemis;
global bestWeapon;
dangerousEnnemis = null;

 
function getResistanceAction(@actions, @cellsAccessible, Allies, TPmax) {
    var nb_action = count(actions);
    for(var tool in ShieldTools) {
        if ( (isWeapon(tool) && (TPmax >= getWeaponCost(tool) + 1 || TPmax == getWeaponCost(tool) && getWeapon == tool)) || (isChip(tool) && getCooldown(tool) == 0 && TPmax >= getChipCost(tool)) ) {
			if (tool == WEAPON_J_LASER)
			{
				var tir;
				if(tool == WEAPON_J_LASER)
				{
					var cellToCheck = getCellsToCheckForLaser(cellsAccessible, Allies + getAliveEnemies());
					tir = shieldTypeLigne(tool, cellToCheck, cellsAccessible);
				}
				else
				{
					tir = proteger(tool, Allies, cellsAccessible);
				}
			
				if ((tir != [] || tir != null) && tir[VALEUR] > 15) 
				{
					tir[CHIP_WEAPON] = tool;
					var coutPT;
					var valeur = tir[VALEUR];
					var n;
					var change_weapon = 0;
					if (isWeapon(tir[CHIP_WEAPON]) && tir[CHIP_WEAPON] != getWeapon()) 
					{
						change_weapon = 1;
					}
					coutPT = (isWeapon(tir[CHIP_WEAPON])) ? getWeaponCost(tir[CHIP_WEAPON]) : getChipCost(tir[CHIP_WEAPON]);
					if (isChip(tir[CHIP_WEAPON]) && getChipCooldown(tir[CHIP_WEAPON])) 
					{
						n = 1;
					} 
					else 
					{
						n = floor(TPmax / coutPT);
					}
					//ajouter le bon nombre de fois dans les actions
					for (var o = 1; o <= n; o++) {
						tir[NB_TIR] = o;
						tir[PT_USE] = o * coutPT + change_weapon;
						tir[VALEUR] = o * valeur;
						tir[EFFECT] = getChipEffects(tool)[0][0];
						actions[nb_action] = tir;
						nb_action++;
					}
				}
			}
        }
    }
}

function shieldTypeLigne(tool, @cellToCheck, @cellsAccessible)
{
	var ope = getOperations();
	var from = 0;
	var withOrientation = 1;

	var orientation = [-17, 17, -18, 18];
	
	var absoluteVulne = 0;
	//var absoluteShield = 0;

	var valeurMax = 0;
	var distanceBestAction = 100;
	var bestAction = [];
	
	for (var cell in cellToCheck) 
	{
		if (lineOfSight(cell[from], cell[from] + MIN_RANGE[tool] * orientation[cell[withOrientation]], ME)) 
		{
			var cell_affecter = getAreaLine(tool,cell[from], cell[withOrientation]);
			var sommeShield = 0;
			for (var i in cell_affecter) 
			{
				if (getCellContent(i) == CELL_PLAYER) 
				{
					var leek = getLeekOnCell(i);
					if (leek != getLeek()) 
					{
						absoluteVulne += ResistVal(tool, leek);
						var team = (isAlly(leek)) ? 0.5 : 1;
						absoluteVulne += team * SCORE[leek];
					}
				}
			}
			if ((absoluteVulne > valeurMax || absoluteVulne == valeurMax && cellsAccessible[cell[from]] < distanceBestAction)) 
			{
				bestAction[CELL_DEPLACE] = cell[from];
				bestAction[CELL_VISE] = cell[from] + MIN_RANGE[tool]* orientation[cell[withOrientation]];
				bestAction[VALEUR] = absoluteVulne;
				valeurMax = absoluteVulne;
				distanceBestAction = cellsAccessible[cell[from]];
			}
		}
	}
	debug(getWeaponName(tool) + " : " + bestAction + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}




function haveffect(leek,tool) {
    var effs = getEffects(leek);
    for (var eff in effs) {
        if(eff[ITEM_ID]==tool) {
            return true;
        }
    }
    return false;
}
 
 
function proteger(tool, allies, @cellsAccessible) {// pour les puces de shield sans AOE
    var ope = getOperations();
    var cell_deplace;
    var cellAllie;
    var bestAction = [];
    var action;
    var valeur;
    var bestValeur = 0;
    var distanceBestAction = 0;
    for (var allie in allies) {
        var targets = getChipEffects(tool)[0][TARGETS];
        if (((targets & EFFECT_TARGET_SUMMONS) && isSummon(allie)) || ((targets & EFFECT_TARGET_NON_SUMMONS) && !isSummon(allie))) {
            if (!(MIN_RANGE[tool] != 0 && allie == ME)) {
                if(!NOT_USE_ON[tool][allie]) {
                    if(!haveffect(allie,tool)) {
                        cellAllie = getCell(allie);
                        cell_deplace = getCellToUseToolsOnCell(tool, cellAllie, cellsAccessible);
                        if (cell_deplace != -2) { //la cellule doit être atteignable
                            var resist = ResistVal(tool, allie);
                            valeur = SCORE_RESISTANCE[allie]*(resist);
                       		debug("Value : "+valeur);
                            if (valeur > bestValeur || valeur == bestValeur && cellsAccessible[cell_deplace] < distanceBestAction) {
                                if(getLeekOnCell(cellAllie)==ME) {
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
    debug(getChipName(tool) + " : " + bestAction + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
    return @bestAction;
}
 
function ResistVal(tool, leek){
    var effects = getChipEffects(tool);
    var resistance = getResistance();
    var agility = getAgility();
    for (var effect in effects) {
        var valMoyen = (effect[MIN] + effect[MAX]) / 2;
        if(effect[TYPE] == EFFECT_RELATIVE_SHIELD || effect[TYPE]==EFFECT_ABSOLUTE_SHIELD) {
            if(dangerousEnnemis===null) {
                findDangerousEnnemis();
                bestWeapon = getBestWeapon(dangerousEnnemis);
            }
            var degat = [0,0];
            var degat2 = [0,0];
            var null1,null2;
            pvLost(INFO_LEEKS[dangerousEnnemis], INFO_LEEKS[leek], bestWeapon, null, degat, null1, null2);
            var sans = degat[MOYEN];
        	debug("sans = "+sans);
            var clone = INFO_LEEKS[leek];
            effect[TYPE] == EFFECT_ABSOLUTE_SHIELD ? clone[1]+=valMoyen*(1+resistance/100) : clone[2]+=valMoyen*(1+resistance/100); // Suppose que l'on a pas déjà la puce /!\
        	debug("origin : "+INFO_LEEKS[leek]);
        	debug("prevision : "+clone);
            pvLost(INFO_LEEKS[dangerousEnnemis], clone, bestWeapon, null, degat2, null1, null2);
            var avec = degat2[MOYEN];
        	debug("avec = "+avec);
            var bonus = sans - avec;
            debug(isChip(bestWeapon) ? getChipName(bestWeapon) : getWeaponName(bestWeapon));
            debug("bonus = "+bonus);
            return 3*bonus; // TODO: ajuster le coeff
        }
        if(effect[TYPE]==EFFECT_DAMAGE_RETURN) {
            var renvois = valMoyen*(1+agility/100) * effect[TURNS];
            return 3*renvois;
        }
		if(effect[TYPE] == EFFECT_ABSOLUTE_VULNERABILITY || effect[TYPE] == EFFECT_STEAL_ABSOLUTE_SHIELD)
		{
			var vulne = valMoyen * effect[TURNS];
			//TO continue. Because first effect will give a negative value, and the other, the same value but in positive. So value will became 0 at the end.
			return 3*vulne;
		}
    }
}
 
 
 
function findDangerousEnnemis() {//TODO: améliorer
    var maxStrengh = 0;
    var ennemis = getAliveEnemies();
    for (var j = 0; j< count(ennemis); j++) {
        var saForce = getStrength(ennemis[j]);
        if (saForce > maxStrengh || saForce == maxStrengh && getLevel(ennemis[j] > getLevel(dangerousEnnemis))) {
            dangerousEnnemis = ennemis[j];
            maxStrengh = saForce;
        }
    }
}
 
function getBestWeapon(leek) {
    var weapons = getWeapons(leek);
    var chips = getChips(leek);
    var best;
    var degat = 0;
    for (var i in weapons+chips) {
        var effet = isChip(i) ? getChipEffects(i) : getWeaponEffects(i);
        if (effet[0][TYPE] == EFFECT_DAMAGE && i != CHIP_BURNING) {
            var tmp = (effet[0][MIN] + effet[0][MAX]) / 2;
            if (tmp > degat) {
                degat = tmp;
                best = i;
            }
        }
    }
    return best;
}


//[Lightning] [[27, 20, 20, 2, 31, 1], [29, 20, 20, 2, 31, 5]] (Retour debug J_Laser)
// 31 = Toutes les cibles sauf soit meme
// 1 = Cumulable (effet de vol)
// 5 == cumulable et sur soi (récupération du bouclier absolu)