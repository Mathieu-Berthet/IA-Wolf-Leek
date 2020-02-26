include("GLOBALS");
include("getArea");
include("getCellToUse");
include("Attaque");
include("Heal");
include("Deplacement");
include("Ciblage");
include("Boost");
include("Ordonnanceur");
include("Communication");
include("Summon");
include("Map de danger");
include("Resistance");
include("StatsCombo");


COMBO = [];


//include("/New IA + Knapsack/Fonction/Bulbes");
//include("/Graph_test/Map de danger");
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
setBoostCoeff();

debug("SCORE :");
for (var cle: var val in SCORE) {
	debug(getName(cle) + " => " + val);
}
debug("");

// debugW("NOT_USE_ON : "+NOT_USE_ON);
// debugW("MINIMUM_TO_USE : "+MINIMUM_TO_USE);

CACHER = false;

/*==============Ajout par rapport au code Share================*/
var armor = true;
if (getFightType() == FIGHT_TYPE_SOLO) {
	var leek = getNearestEnemy();
	if (isSummon(leek)) leek = getSummoner(leek);
	if (getStrength(leek) <= 100 && getMagic(leek) >= 300) {
		armor = false;
	}
}
/*
if (armor) {
	useChip(CHIP_ARMOR, getLeek());
	if (getCooldown(CHIP_ARMOR) == 1) {
		useChip(CHIP_SHIELD, getLeek());
	}
}
*/
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
var continu = true;
while (continu) { // Pour l'instant on ne fait qu'une action 
	var actions = [null]; // 1er élément à null pour le knapsack
	var cellsAccessible = accessible(getCell(), getMP());
	var toutEnnemis = getAliveEnemies();
	var toutAllies = getAliveAllies();
	var tp = getTP();

	getAttackAction(actions, cellsAccessible, toutEnnemis, tp);
	getHealAction(actions, cellsAccessible, toutAllies, tp);
	getBoostAction(actions, cellsAccessible, toutAllies, tp);
	getSummonAction(actions, cellsAccessible, tp);
	getResistanceAction(actions, cellsAccessible, toutAllies, tp);
	//TODO : rajouter des actions de heal, shield, summon, entrave, ... tout ce qu'on veut en fait


	var combo = getBestCombo(actions, getTP());
	//debug(combo);
	if (combo != []) {
		/*TODO: reccuperer une action et l'exectuer
		 peut - être pour commencer réccupérer l'action qui à la plus grosse valeur
		 puis faire les actions de sorte à minimiser le déplacement
		*/

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
/* ================================================= */

/*
if (!getCooldown(CHIP_HEALER_BULB)) {
	summon(CHIP_HEALER_BULB, getCellToUseChip(CHIP_HEALER_BULB, getLeek()), bulbe_gerisseur);
}

if (!getCooldown(CHIP_HELMET) && getTP() >= 3) {
	debugC("hors de l'arbre", COLOR_GREEN);
	useChip(CHIP_HELMET, getLeek());
}
*/
include("Map de danger");
//debugArrayMap(getDangerMap(getReachableCells(getCell(), getMP())));
//debugW("Fin IA : opération :" + (getOperations() / OPERATIONS_LIMIT * 100) + " %");

parler();

include("/Cache-Cache");
var centre = count(getAliveAllies()) != 1? getCenterOfGravity(getAliveAllies()) : getCell();
var tab_dis_ene = enemis_tableau(true);
var maxi = 15;
if (getFightContext() == FIGHT_CONTEXT_TEST) maxi = 7;

if (getTurn() > 50 || getFightType() == FIGHT_TYPE_TEAM) {
	maxi = 9;
}
if (tab_dis_ene != null && !CACHER) {

	if (getPathLength(getCell(), getCell(tab_dis_ene[0][0])) < maxi) {
		var PM = getMP();
		var cell_accessible = [getCell()];
		var cell_deja_parcouru = [];
		new_cell_accessible(@PM, @cell_accessible, @cell_deja_parcouru, true);

		var PM2 = getMP(tab_dis_ene[0][0]);
		var cell_accessible2 = [getCell(tab_dis_ene[0][0])];
		var cell_deja_parcouru2 = [];
		new_cell_accessible(@PM2, @cell_accessible2, @cell_deja_parcouru2, false);

		var tab = replis(cell_accessible, cell_accessible2);
		var N = count(tab);
		var end = [];
		for (var i = 0; i < N; i++) {
			end[i] = tab[i][0];
			mark(tab[i][0]);
		}

		var a = randInt(0, N);
		moveTowardCell(end[a]);

	} else {
		if ((getFightType() == FIGHT_TYPE_SOLO || getFightType() == FIGHT_TYPE_BATTLE_ROYALE)) {
			moveToward(tab_dis_ene[0][0], 3);
		} else {
			moveTowardCell(centre);
		}
	}
}

//debugW("Fin IA après cache-cache: opération :" + (getOperations() / OPERATIONS_LIMIT * 100) + " %");


