include("Ordonnanceur");
include("Attaque");
include("Heal");
include("Deplacements");
include("Ciblage");
include("Boost");
include("Communication");
include("Summon");
include("MapDangerV1");
include("Resistance");
include("StatsCombos");
include("Tactics");

COMBO = [];
CACHER = false;


getOpponent(getAliveEnemies());
SetupAll();

debug("SCORE :");
for (var cle: var val in SCORE) {
	debug(getName(cle) + " => " + val);
}
debug("");

//setBoostCoeff(); //A decommenter si votre poireau joue science
var continu = true;

while (continu) { // Pour l'instant on ne fait qu'une action
	var actions = [null]; // 1er élément à null pour le knapsack
	var cellsAccessible = accessible(getCell(), getMP());
	var toutEnnemis = getAliveEnemies();
	var toutAllies = getAliveAllies();
	var tp = getTP();

	getAttackAction(actions, cellsAccessible, toutEnnemis, tp);
	getHealAction(actions, cellsAccessible, toutAllies, toutEnnemis, tp);
	getResistanceAction(actions, cellsAccessible, toutAllies, tp);
	getBoostAction(actions, cellsAccessible, toutAllies, toutEnnemis, tp);
	getSummonAction(actions, cellsAccessible, tp);
	getTacticAction(actions, cellsAccessible, toutAllies, toutEnnemis);

	var combo = getBestCombo(actions, getTP());
	//debug(combo);
	if(combo != []) {
		var action = getActionFromCombo[ORDONNANCEMENT_SCIENCE](combo);
		for(var i = 1; i <= action[4]; i++){
			push(COMBO, action[3]);
		}
		doAction(action);
	} else {
		continu = false;
	}
}

debugW("Fin Action (tour : " + TOUR + "): opération :" + (getOperations() / OPERATIONS_LIMIT * 100) + " %");
Memorise(COMBO);


// Déplacement : TODO : je crois que Leekwiz avais fait de bonne fonction qui mélange cache-cache + centre de gravité
if(!CACHER) {
	if(getFightType() == FIGHT_TYPE_SOLO || getFightType() == FIGHT_TYPE_BATTLE_ROYALE || count(getAliveAllies()) == 1) {
		var mpAdversaire = getMP(getNearestEnemy());
		moveCacheCache(getCell(getLeek()), getCell(getNearestEnemy()), getMP(), mpAdversaire);
	} else {
		moveTowardCell(getCenterOfGravity(getAliveAllies()));
	}
}

if (getTP() >= 1) {
	parler();
}
