include("Ordonnanceur");
include("Attaque");
include("Heal");
include("Deplacements");
include("Ciblage");
include("Communication");
include("Resistance");
include("Summon");
include("Tactics");


getOpponent(getAliveEnemies());
SetupAll();
//setBoostCoeff(); //A decommenter si votre poireau joue science
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

if(getFightType() == FIGHT_TYPE_SOLO || getFightType() == FIGHT_TYPE_BATTLE_ROYALE || count(getAliveAllies()) == 1)
{
	var mpAdversaire = getMP(getNearestEnemy());
	moveCacheCache(getCell(getLeek()), getCell(getNearestEnemy()), getMP(), mpAdversaire);

}
else
{
	moveTowardCell(getCenterOfGravity(getAliveAllies()));
}

if (getTP() >= 1)
{
	parler();
}