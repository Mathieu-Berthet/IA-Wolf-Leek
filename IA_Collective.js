include("Ordonnanceur");
include("Attaque");
include("Heal");
include("Deplacement");
include("Ciblage");
include("Boost");
include("Communication");
include("Summon");
include("Map de danger");
include("Resistance");
include("StatsCombo");
include("Tactics");

COMBO = [];
CACHER = false;

// [Caneton] à retirer avant commit
/*==============Ajout par rapport au code Share================*/


if (getFightType() == FIGHT_TYPE_SOLO) {
	setCoeffSolo();
	//getOpponent(getAliveEnemies());
	var ennemis = getNearestEnemy();
	if(isSummon(ennemis)) ennemis = getSummoner(ennemis);
	if(getLeekID(ennemis) == 60498 || getLeekID(ennemis) == 59247) {
		SCORE_RESISTANCE[getLeek()] = 0;
	}
} else {
	getOpponent(getAliveEnemies());
}


var armor = true;
if (getFightType() == FIGHT_TYPE_SOLO) {
	var leek = getNearestEnemy();
	if (isSummon(leek)) leek = getSummoner(leek);
	if (getStrength(leek) <= 100 && getMagic(leek) >= 300) {
		armor = false;
	}
}

var effet = getEffects();
var poison = 0;
for (var i = 0; i < count(effet); i++) {
	if (effet[i][0] == EFFECT_POISON) {
		poison = poison + effet[i][1];
		debug("poison :" + effet[i][1]);
	}
}

if (poison > 300) {
	if (getCooldown(CHIP_ANTIDOTE) == 0 && getTP() >= 3) {
		useChip(CHIP_ANTIDOTE, getLeek());
	} else {
		debug("Pas de libé :p");
	}
}

/*===============================================================*/

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
	getHealAction(actions, cellsAccessible, toutAllies, tp);
    getResistanceAction(actions, cellsAccessible, toutAllies, tp);
	getBoostAction(actions, cellsAccessible, toutAllies, tp);
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
