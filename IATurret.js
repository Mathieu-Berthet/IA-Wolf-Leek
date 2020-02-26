include("GLOBALS");
include("getArea");
include("getCellToUse");
include("Ordonnanceur");
include("Attaque");
include("Heal");
include("Deplacement"); //include("CacheCache");
include("Ciblage");
include("Communication");
include("Resistance");
include("Summon");
include("Tactic");
include("Boost");


getOpponent(getAliveEnemies());
setBoostCoeff();

debug("SCORE :");
for (var cle: var val in SCORE) {
	debug(getName(cle) + " => " + val);
}
debug("");

var continu = true;
while (continu) {// Pour l'instant on ne fait qu'une action 
	var actions = [null];// 1er élément à null pour le knapsack
	var cellsAccessible = accessible(getCell(), getMP());
	var toutEnnemis = getAliveEnemies();
	var toutAllies = getAliveAllies();
	var tp = getTP();
	
	getAttackAction(actions, cellsAccessible, toutEnnemis, tp);
	getHealAction(actions, cellsAccessible, toutAllies, tp);
	getResistanceAction(actions, cellsAccessible, toutAllies, tp);
	getBoostAction(actions, cellsAccessible, toutAllies, tp);
	getSummonAction(actions, cellsAccessible, tp);
	getTacticAction(actions, cellsAccessible, toutAllies, toutEnnemis);
	
	var combo = getBestCombo(actions, tp);
	debug(combo);
	if(combo != []) {

		var action = getActionFromCombo[ORDONNANCEMENT_SUMMON_LAST](combo);
		doAction(action);
	} else {
		continu = false;
	}
}

debugW("Fin Action (tour : " + TOUR + "): opération :" + (getOperations() / OPERATIONS_LIMIT * 100) + " %");

if (getTP() >= 1)
{
	parler();
}
