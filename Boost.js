include("getArea");
include("getCellToUse");
include("Debug");
include("Utils");

/*
 *
 * 50 pour les TP
 * 30 pour les PM
 * 1 pour la force
 * 0.7 pour l'agi
 *
 * */


function getBoostAction(@actions, @cellsAccessible, Allies, Ennemies, TPmax, @boost_tools) {
	var nb_action = count(actions);
	var toutPoireau = Allies + Ennemies;
	for(var tool in boost_tools)
	{
		if(ERROR_TOOLS[tool]) continue;
		var tir = [];
		if (can_use_tool( tool , TPmax ))
		{
			var area = ALL_INGAME_TOOLS[tool][TOOL_AOE_TYPE] ;
			if(area == AREA_POINT) {
				if (tool == WEAPON_BROADSWORD) {
					tir = taperDansLeVide(tool);
				} else {
					tir = Booster(tool, Allies, cellsAccessible);
				}

			} else {
				tir = boostTypeAOE(toutPoireau,  tool,  @cellsAccessible);
			}
			if ((tir != [] || tir != null) && tir[VALEUR] > 3) // au moins 3 de boost (en moyenne)
			{
				tir[CHIP_WEAPON] = tool;
				var coutPT;
				var valeur = tir[VALEUR];
				var n;
				var change_weapon =  (ALL_INGAME_TOOLS[tool][TOOL_IS_WEAPON] && tool != getWeapon()) ? 1 : 0;
				coutPT = ALL_INGAME_TOOLS[tool][TOOL_PT_COST] ;
				if (ALL_INGAME_TOOLS[tool][TOOL_COOLDOWN_TIME])
				{
					n = 1;
				}
				else
				{
					n = floor(getTP() / coutPT);
				}
				//ajouter le bon nombre de fois dans les actions
				for (var o = 1; o <= min(n, 2); o++)
				{
					tir[NB_TIR] = o;
					tir[PT_USE] = o * coutPT + change_weapon;
					tir[PM_USE] = tir[CELL_DEPLACE] >= 0 ? cellsAccessible[tir[CELL_DEPLACE]] : 0;
					tir[VALEUR] = o * valeur;
					tir[EFFECT] = ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][0][TOOL_EFFECT_TYPE] ;
					actions[nb_action] = tir;
					nb_action++;
				}
			}
		}
	}
}

function haveEffect(leek,tool) {
  var effs = getEffects(leek);
  for (var eff in effs) {
  	if(eff[ITEM_ID]==tool) {
		return true;
	}
  }
  return false;
}

function Booster(tool, allies, @cellsAccessible)
{
	// pour les puces de boost sans AOE.
	var ope = getOperations();
	var cell_deplace;
	var cellAllie;
	var cellEnnemie;
	var bestAction = [];
	var action;
	var valeur;
	var bestValeur = 0;
	var distanceBestAction = 0;
	for (var allie in allies) {
		var eff = ALL_INGAME_TOOLS[tool][TOOL_ATTACK_EFFECTS][0] ;
		if ((eff[TOOL_TARGET_SUMMONS] && isSummon(allie)) || (eff[TOOL_TARGET_NON_SUMMONS] && !isSummon(allie))) {
      if(!(MIN_RANGE[tool] != 0 && allie == ME)) {
				if(!haveEffect(allie,tool)) {
					cellAllie = getCell(allie);
					cell_deplace = getCellToUseToolsOnCell(tool, cellAllie, cellsAccessible);
					if (cell_deplace != -2) { //la cellule doit être atteignable

						var oldPosition = INFO_LEEKS[ME][CELL];
						INFO_LEEKS[ME][CELL] = cell_deplace;
						var aTargetEffect = getTargetEffect(ME, tool, cellAllie, true);
						checkKill(aTargetEffect);
						valeur = getValueOfTargetEffect(aTargetEffect);
						INFO_LEEKS[ME][CELL] = oldPosition;

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
	debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + bestAction + " => " + ((getOperations() - ope) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}

function getTargetBoost(tool, cell) {
	return (!ALL_INGAME_TOOLS[tool][TOOL_IS_WEAPON]) ? getChipTargets(tool, cell) : getWeaponTargets(tool, cell);
}

function boostTypeAOE(toutPoireau, tool, @cellsAccessible)
{
	var oper = getOperations();
	var bestAction = [];
	var distanceBestAction = 0;
	var cell_deplace;
	var valeurMax = 0;
	var maxRange = ALL_INGAME_TOOLS[tool][TOOL_MAX_RANGE] ;
	var deja_fait = [];
	for (var poireau in toutPoireau) {
		if(!(MIN_RANGE[tool] != 0 && poireau == ME)) {
			var distance = getCellDistance(getCell(), getCell(poireau));
			if (distance <= maxRange + getMP()) {
				var zone = getEffectiveArea(tool, getCell(poireau));
				if (zone != null) {
					for (var cell in zone) {
						if (!deja_fait[cell]) {
							deja_fait[cell] = true;
							cell_deplace = getCellToUseToolsOnCell(tool, cell, cellsAccessible);
							if (cell_deplace != -2) {
								var oldPosition = INFO_LEEKS[ME][CELL];
								INFO_LEEKS[ME][CELL] = cell_deplace;
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
	}
	debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + bestAction + " => " + ((getOperations() - oper) / OPERATIONS_LIMIT * 100) + "%");
	return @bestAction;
}


/**
 * Permet de taper dans le vide => les effets AlwaysOnCaster non multiplié par le nombre de cible s'applique
 * Marche pour les tools avec un range de 1 => WEAPON_BROADSWORD
 *
 */
function taperDansLeVide(tool) {
	var oper = getOperations();
	var action = [];
	var cellReferance = getCell();
	var X = getCellX(cellReferance);
	var Y = getCellY(cellReferance);
	var CaseACote = [getCellFromXY(X + 1, Y), getCellFromXY(X - 1, Y), getCellFromXY(X, Y + 1), getCellFromXY(X, Y - 1)];

	var casesValide = arrayFilter(CaseACote, function (cell) {
		return cell !== null && isEmptyCell(cell);
	});

	if(!isEmpty(casesValide)) {
		var cellVide; for (var key : var cell in casesValide) {cellVide = cell; break;} // c'est moche mais il y a pas de fonction arrayValues :(
		var aTargetEffect = getTargetEffect(ME, tool, cellVide, true);
		var valeur = getValueOfTargetEffect(aTargetEffect);
		if(valeur > 0) {
			action[CELL_DEPLACE] = -1;
			action[CELL_VISE] = cellVide;
			action[VALEUR] = valeur;
		}
	}


	debugP(ALL_INGAME_TOOLS[tool][TOOL_NAME] + " : " + action + " => " + ((getOperations() - oper) / OPERATIONS_LIMIT * 100) + "%");
	return @action;
}
