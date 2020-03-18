include("Ordonnanceur");
include("Attaque");
include("Heal");
include("Deplacements");
include("Ciblage");
include("Communication");
include("Resistance");
include("Summon");
include("Tactics");
include("Boost");
include("Debug");

getOpponent(getAliveEnemies());
SetupAll();
setBoostCoeff();

ERROR_TOOLS = [];

debugP("SCORE :");
for (var cle: var val in SCORE) {
	debugP(getName(cle) + " => " + val);
}
debugP("");

var continu = true;
while (continu) {// Pour l'instant on ne fait qu'une action
	var actions = [null];// 1er élément à null pour le knapsack
	var cellsAccessible = accessible(getCell(), 0);
	var toutEnnemis = getAliveEnemies();
	var toutAllies = getAliveAllies();
	var tp = getTP();

	getAttackAction(actions, cellsAccessible, toutEnnemis, tp, AttackTools);
	getHealAction(actions, cellsAccessible, toutAllies, toutEnnemis, tp, HealTools);
	getResistanceAction(actions, cellsAccessible, toutAllies, tp, ShieldTools);
	getBoostAction(actions, cellsAccessible, toutAllies, toutEnnemis, tp, BoostsTools);
	getSummonAction(actions, cellsAccessible, tp, SummonTools);
	getTacticAction(actions, cellsAccessible, toutAllies, toutEnnemis, TacticsTools);

	var combo = getBestCombo(actions, tp);
	//debugP(combo);
	if(combo != []) {

		var action = getActionFromCombo[ORDONNANCEMENT_SUMMON_LAST](combo);
		var isUseSucess = doAction(action);
		if(!isUseSucess) {
			debugEP('Action non effectué : ' + action + '\n Attention à la boucle infinie');
			// TODO : mettre en place un mécanisme pour ne pas refaire la même action
			ERROR_TOOLS[action[CHIP_WEAPON]] = true;
		}
	} else {
		continu = false;
	}
}

debugWP("Fin Action (tour : " + TOUR + "): opération :" + (getOperations() / OPERATIONS_LIMIT * 100) + " %");

if (getTP() >= 1)
{
	parler();
}
