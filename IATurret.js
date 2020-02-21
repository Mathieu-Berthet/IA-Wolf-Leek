include("Ordonnanceur");
include("Attaque");
include("Heal");
include("CacheCache");
include("Ciblage");
include("Communication");
include("Resistance");
include("Summon");
include("Tactics");
include("Booster");


getOpponent(getAliveEnemies());
SetupAll();
setBoostCoeff();
var continu = true;
while (continu) {// Pour l'instant on ne fait qu'une action 
	var actions = [null];// 1er élément à null pour le knapsack
	var cellsAccessible = accessible(getCell(), getMP());
	var toutEnnemis = getAliveEnemies();
	var toutAllies = getAliveAllies();
	
	
	getAttackAction(actions, cellsAccessible, toutEnnemis);
	getHealAction(actions, cellsAccessible, toutAllies);
	getResistanceAction(actions, cellsAccessible, toutAllies, getTP());
	getBoostAction(actions, cellsAccessible, toutAllies);
	getSummonAction(actions, cellsAccessible);
	getTacticAction(actions, cellsAccessible, toutAllies, toutEnnemis);
	
	var combo = getBestCombo(actions, getTP());
	//debug(combo);
	if(combo != []) {

		var action = getActionFromCombo[ORDONNANCEMENT_SUMMON_LAST](combo);
		doAction(action);
	} else {
		continu = false;
	}
}

if (getTP() >= 1)
{
	parler();
}