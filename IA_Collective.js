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
include("Territoire");
include("Debug");

// clearMap();
debugTerritoires(getTerritoires(getAliveAllies(), getAliveEnemies()));

COMBO = [];
CACHER = false;
ERROR_TOOLS = [];

getOpponent(getAliveEnemies());
SetupAll();

debugP("SCORE_DAMAGE :");
for (var leek: var effects in COEFF_LEEK_EFFECT) {
	debugP(getName(leek) + " => " + effects[EFFECT_DAMAGE]);
}
debugP("");

//setBoostCoeff(); //A decommenter si votre poireau joue science
var continu = true;

while (continu) { // Pour l'instant on ne fait qu'une action
	var actions = [null]; // 1er élément à null pour le knapsack
	var cellsAccessible = accessible(getCell(), getMP());
	var toutEnnemis = getAliveEnemies();
	var toutAllies = getAliveAllies();
	var tp = getTP();

	getAttackAction(actions, cellsAccessible, toutEnnemis, tp, AttackTools);
	getHealAction(actions, cellsAccessible, toutAllies, toutEnnemis, tp, HealTools);
	getResistanceAction(actions, cellsAccessible, toutAllies, tp, ShieldTools);
	getBoostAction(actions, cellsAccessible, toutAllies, toutEnnemis, tp, BoostsTools);
	getSummonAction(actions, cellsAccessible, tp, SummonTools);
	getTacticAction(actions, cellsAccessible, toutAllies, toutEnnemis, TacticsTools);

	var combo = getBestCombo(actions, getTP());
	//debugP(combo);
	if(combo != []) {
		var action = getActionFromCombo[ORDONNANCEMENT_LIBERATION_FIRST](combo); // ORDONNANCEMENT_LIBERATION_FIRST -> ORDONNANCEMENT_SCIENCE -> ORDONNANCEMENT_DEFAULT -> ORDONNANCEMENT_SUMMON_LAST
		for(var i = 1; i <= action[4]; i++){
			push(COMBO, action[3]);
		}
		var isUseSucess = doAction(action);
		if(!isUseSucess) {
			debugEP('Action non effectué : ' + action + '\n Attention à la boucle infinie');
			ERROR_TOOLS[action[CHIP_WEAPON]] = true;
		}
	} else {
		continu = false;
	}
}

debugWP("Fin Action (tour : " + TOUR + "): opération :" + (getOperations() / OPERATIONS_LIMIT * 100) + " %");
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
