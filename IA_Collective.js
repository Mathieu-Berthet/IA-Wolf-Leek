include("Ordonnanceur");
include("Attaque");
include("Heal");
include("Deplacements");
include("Ciblage");
include("Boost");
include("Communication");
include("Summon");
include("MapDangerV1");
//include("MapDangerV2");
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

if (inArray([FIGHT_TYPE_SOLO, FIGHT_TYPE_BATTLE_ROYALE], getFightType()) || getMagic() > 300 && getStrength()  < 200) {
	USE_VIE_PREVISIONNEL = true; // Pour prendre en compte si une entité va mourir par le poison ()
}


var continu = true;
while (continu) { // Pour l'instant on ne fait qu'une action

	if(USE_VIE_PREVISIONNEL) {
		setViePrevisionel();
	}


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
		var action = getActionFromCombo[ORDONNANCEMENT_PERSONNALISE[ORDONANCEMENT_START]](combo); // ORDONNANCEMENT_LIBERATION_FIRST -> ORDONNANCEMENT_SCIENCE -> ORDONNANCEMENT_DEFAULT -> ORDONNANCEMENT_SUMMON_LAST
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


if(!CACHER) {
	//var mapDangerV2 = dangerCombo(getDanger(getAliveEnemies(),getLeek())); // V2, coute 3-4% de plus en solo, plus en team
	var mapDangerV1 = getDangerMap(getReachableCells(getCell(), getMP()));
	// pour visualiser la map : debugArrayMap(mapDangerV1)
	var cell = getCellToGo(mapDangerV1);
	moveTowardCell(cell);
}

if (getTP() >= 1) {
	parler();
}
