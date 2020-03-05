// dernière mise à jour le : 03/02/2020 par : Caneton

/********************** Globals *********************************/
global CACHER;
global ME = getLeek();
global PHRASE_A_DIRE = [];
global STOP_ACTION;
global ERROR_TOOLS;

global COMBO = [];

global INFO_LEEKS = [];
global ID = 0, ABSOLUTE_SHIELD = 1, RELATIVE_SHIELD = 2, STRENGTH = 3, DAMAGE_RETURN = 4, MAGIC = 5, PT = 6, MP = 7;

function updateInfoLeeks() {//TODO : mettre d'autres caractéristiques avec des constantes associées
	var tab = [];
	var leeks = getAliveAllies()+ getAliveEnemies();
	for (var leek in leeks) {
		tab[leek] = [leek, getAbsoluteShield(leek), getRelativeShield(leek),  max(0,getStrength(leek)), getDamageReturn(leek), max(0,getMagic(leek)), getTP(leek), getMP(leek)];
	}
	INFO_LEEKS = tab;
}
 updateInfoLeeks();


global SCORE; //TODO: faire une fonction plus précise  <= ok fait par ray dans le ciblage
SCORE = (function () {
		var tab = [];
		var leeks = getAliveAllies() + getAliveEnemies();
		for (var leek in leeks) {
			tab[leek] = (isSummon(leek)) ? 0.5 : 1;
		}
		return tab;
})();


global SCORE_HEAL; //TODO: faire une fonction plus précise
SCORE_HEAL = (function () {
		var tab = [];
		var leeks = getAliveAllies() + getAliveEnemies();
		for (var leek in leeks) {
			tab[leek] = (isSummon(leek)) ? 0.5 : 1;
		}
		return tab;
})();


global SCORE_TACTIC;
SCORE_TACTIC = (function() {
	var tab = [];
	var leeks = getAliveAllies() + getAliveEnemies();
	for (var leek in leeks) {
		tab[leek] = (isSummon(leek)) ? 0.5 : 1;
	}
	return tab;
})();


global SCORE_RESISTANCE;
SCORE_RESISTANCE = (function () {
	var tab = [];
	var leeks = getAliveAllies();
	for(var leek in leeks) {
		if(getFightType() == FIGHT_TYPE_SOLO) {
			var ennemy = getNearestEnemy();
			if(isSummon(ennemy)) ennemy = getSummoner(ennemy);
			if(getMagic(ennemy) >= 300 && getStrength(ennemy) < 100) {
				tab[leek] =(isSummon(leek)) ? 0 : 0.2;
			} else {
				tab[leek] =(isSummon(leek)) ? 0.4 : 1;
			}
		} else {
			tab[leek] =(isSummon(leek)) ? 0.2 : 1;
		}
	}
	return tab;
})();


function compteurPuceEffect(tools, effect) {
  var compteur = 0;
  for(var tool in tools) {
    var eff = isChip(tool) ? getChipEffects(tool)[0][TYPE] : getWeaponEffects(tool)[0][TYPE];
    if(tool==WEAPON_B_LASER) eff=EFFECT_HEAL;
    if(eff==effect) {
      compteur++;
    }
  }
  return compteur;
}

function setBoostCoeff() { // Méthode du nombre de puce
  var boost = [];
  for (var allie in getAliveAllies()) {
    var tools = getChips(allie)+getWeapons(allie);
    var nbDamageTool = compteurPuceEffect(tools, EFFECT_DAMAGE);
	var nbHealTool = compteurPuceEffect(tools, EFFECT_HEAL);
    var nbResiTool = compteurPuceEffect(tools, EFFECT_ABSOLUTE_SHIELD)+compteurPuceEffect(tools, EFFECT_RELATIVE_SHIELD);
    var nbReturnDamageTool = compteurPuceEffect(tools, EFFECT_DAMAGE_RETURN);
    var nbScienceTool =   compteurPuceEffect(tools, EFFECT_BUFF_STRENGTH)
    					+ compteurPuceEffect(tools, EFFECT_BUFF_WISDOM)
    					+ compteurPuceEffect(tools, EFFECT_BUFF_RESISTANCE)
    					+ compteurPuceEffect(tools, EFFECT_BUFF_AGILITY)
    					+ compteurPuceEffect(tools, EFFECT_BUFF_TP)
    					+ compteurPuceEffect(tools, EFFECT_BUFF_MP);

    boost[allie] = [];
    boost[allie][EFFECT_BUFF_STRENGTH] = nbDamageTool == 0 ? 0 : sqrt(nbDamageTool);
    boost[allie][EFFECT_BUFF_WISDOM] = nbHealTool == 0 ? 0 : sqrt(nbHealTool);
    boost[allie][EFFECT_BUFF_RESISTANCE] = nbResiTool == 0 ? 0 : sqrt(nbResiTool);
    boost[allie][EFFECT_BUFF_AGILITY] = 1 + (nbReturnDamageTool == 0 ? 0 : sqrt(nbReturnDamageTool)) + (nbScienceTool == 0 ? 0 : sqrt(nbScienceTool));
    boost[allie][EFFECT_BUFF_TP] = 1.7;
    boost[allie][EFFECT_BUFF_MP] = 1.7;


  	if(isSummon(allie)) {
      for (var cle : var val in boost[allie]) {
        boost[allie][cle] *= 0.7;
      }
    }

  }
  SCORE_BOOST = boost;
}


global SCORE_BOOST;
SCORE_BOOST = (function ()
{
	var tab = [];
	var leeks = getAliveAllies();
	for(var leek in leeks)
	{
		tab[leek] =(isSummon(leek)) ? 0.5 : 1;
	}
	return tab;
})();


//informations concernant une action
global CELL_DEPLACE=0, CELL_VISE=1, VALEUR=2, CHIP_WEAPON=3, NB_TIR=4, PT_USE=5, EFFECT=6, CALLBACK = 7, PARAM = 8;

global NE_laser = 0;
global SO_laser = 1;
global NO_laser = 2;
global SE_laser = 3;

//getEffects: [type, value, caster_id, turns, critical, item_id, target_id]
global TYPE = 0, VALUE = 1, CASTER_ID = 2, TURNS = 3, CRITICAL = 4, ITEM_ID = 5, TARGET_ID = 6;
//getWeaponEffects:[type, min, max, turns, targets]
global MIN = 1, MAX = 2, TARGETS = 4;

global MOYEN = 3;

global MIN_RANGE = (function () {
	var min_range = [];
	for (var i=1; i<130; i++) {
		min_range[i] = (isChip(i)) ? getChipMinRange(i) : getWeaponMinRange(i);
	}
	min_range[CHIP_TRANQUILIZER] = 2;
	min_range[CHIP_TOXIN] = 3;
	min_range[CHIP_SOPORIFIC] = 4;
	min_range[WEAPON_GAZOR] = 4;
  	min_range[CHIP_PLAGUE] = 4;
	return @min_range;
})();

global MAX_RANGE = (function () {
	var max_range = [];
	for (var i=1; i<130; i++) {
		max_range[i] = (isChip(i)) ? getChipMaxRange(i) : getWeaponMaxRange(i);
	}
	return @max_range;
})();


global MINIMUM_TO_USE = (function(){
	var tab = [];
	tab[CHIP_REGENERATION] = 1 * (1 + getWisdom()/100) * getChipEffects(CHIP_REGENERATION)[0][MIN];

	//TODO: rajouter

	return tab;
})();

global NOT_USE_ON;
NOT_USE_ON = (function() {
	var tab = [];
	tab[CHIP_REGENERATION] = [];
	tab[CHIP_FORTRESS] = [];
	tab[CHIP_RAMPART] = [];
	for(var leek in getAliveAllies()) {
		if(isSummon(leek)) {
			tab[CHIP_REGENERATION][leek] = true;
			tab[CHIP_FORTRESS][leek] = true;
			if (getFightType() != FIGHT_TYPE_SOLO && countLeekAllie() > 1) {
				tab[CHIP_RAMPART][leek] = true;
			}
		}
	}
	return tab;
})();

function countLeekAllie() {
	var cpt = 0;
	for(var leek in getAliveAllies()) {
 		if(getType(leek) == ENTITY_LEEK) {
			cpt++;
		}
	}
	return cpt;
 }

global TOUR = 0; TOUR ++; // getTurn()

global _RESU_PRIORITY = [
	"science": 3,
    "strength": 2,
    "magic": 1
];

global LEEK_VALUE = 3;
global TERRITOIRE_PARAM;
TERRITOIRE_PARAM = (function() {  // j'ai mis les valeurs un peu au pifomètre 
	var tab = [];
	for(var leek in getAliveAllies()+getAliveEnemies()) { 
		if (getType(leek) == ENTITY_LEEK) { // évidemment il faudrait prendre en compte les lvl des poireaux
			tab[leek] = [MAX : 5, MIN : 9, LEEK_VALUE : 10]; // Les scores Max sont à courte distance
		}
		if (getType(leek) == ENTITY_BULB) {
			tab[leek] = [MAX : 2, MIN : 5, LEEK_VALUE : 4];
		}
		if (getType(leek) == ENTITY_TURRET) {
			tab[leek] = [MAX : 7, MIN : 9, LEEK_VALUE : 20]; // il faudrait le max au moins jusqu'a la porté du debuf de MP/décharge et le min à la porté du venin
		}
	}
	return tab;
})();


/******************************************************************/

// fonctions de setup Pseud3mys  //
// remplace getChips():
  // *getChipsDammage()
  // *getChipsShield()
  // *getChipsRelativeShield()
  // *getChipsHeal()


global AttackTools = []; // puces et arme qui font des dégats, du poison et du debuff dans le meme tableau
global ShieldTools = []; // Shield : abs & relative, et renvoie dans le meme tableau + J_Laser
global HealTools = []; // Heal + B_Laser
global BoostsTools = []; // Pour les boost
global TacticsTools = []; // Les puces tactiques
global SummonTools = []; //Les bulbes et la résurrection

global Setup=false;

function SetupAll(){
	if(Setup==true) return Setup;
	var ope = getOperations();
	SetupTools();
	Setup = true;
	ope = (getOperations()-ope)/OPERATIONS_LIMIT*100;
	debugW("Setup reussi ! ("+ope+"%)");
	return Setup;
}

function SetupTools(){//equipe les puces et les armes
	var Tools = getChips() + getWeapons();
	for(var i=0;i<count(Tools);i++){//trier les chips
    	//Pour les attaques
		var effectPoison = getValeurEffect(Tools[i],  EFFECT_POISON,  ME,  "moy");
		var effectDamage = getValeurEffect(Tools[i], EFFECT_DAMAGE, ME,"moy");
		var effectDebuffMagic = getValeurEffect(Tools[i], EFFECT_SHACKLE_MAGIC, ME,"moy");
		var effectDebuffStrength = getValeurEffect(Tools[i], EFFECT_SHACKLE_STRENGTH, ME,"moy");
		var effectDebuffPT = getValeurEffect(Tools[i], EFFECT_SHACKLE_TP, ME,"moy");
		var effectDebuffPM = getValeurEffect(Tools[i], EFFECT_SHACKLE_MP, ME,"moy");
		var effectLifeDamage = getValeurEffect(Tools[i], EFFECT_LIFE_DAMAGE, ME, "moy");
		var effectNovaDamage = getValeurEffect(Tools[i], EFFECT_NOVA_DAMAGE, ME, "moy");
		var AllAttaque = effectPoison + effectDamage + effectDebuffMagic + effectDebuffStrength + effectDebuffPT + effectDebuffPM + effectLifeDamage + effectNovaDamage;

		//Pour les Shield + renvoie
		var effRelaShield=getValeurEffect(Tools[i],EFFECT_RELATIVE_SHIELD, ME,"moy");
		var effectShield = getValeurEffect(Tools[i],EFFECT_ABSOLUTE_SHIELD, ME,"moy");
		var effectRenvoie = getValeurEffect(Tools[i],EFFECT_DAMAGE_RETURN, ME,"moy");
		var effectStealShield = getValeurEffect(Tools[i], EFFECT_STEAL_ABSOLUTE_SHIELD, ME, "moy");
		var AllShield = effRelaShield + effectShield + effectRenvoie + effectStealShield;

		//Pour les soins
		var effectSoin;
		if(Tools[i] != CHIP_INVERSION) //Pour ne pas avoir inversion dans les puces de soins
		{
			effectSoin = getValeurEffect(Tools[i],EFFECT_HEAL, ME,"moy");
		}
		var effectBoostLife = getValeurEffect(Tools[i],EFFECT_BOOST_MAX_LIFE, ME,"moy");
		var AllSoin = effectSoin + effectBoostLife;

		//Pour les puces tactiques
		var effectLibe = getValeurEffect(Tools[i],EFFECT_DEBUFF, ME,"moy");
		var effectAntidote = getValeurEffect(Tools[i],EFFECT_ANTIDOTE, ME,"moy");
		var effectInvert = getValeurEffect(Tools[i],EFFECT_INVERT, ME,"moy");
		var effectTeleport = getValeurEffect(Tools[i],EFFECT_TELEPORT, ME,"moy");
		var AllTatics = effectLibe + effectAntidote + effectInvert + effectTeleport;

    //Pour les boosts
		var effectBuffStrength = getValeurEffect(Tools[i],  EFFECT_BUFF_STRENGTH,  ME,  "moy");
		var effectBuffAgile = getValeurEffect(Tools[i], EFFECT_BUFF_AGILITY, ME,"moy");
		var effectBuffResis = getValeurEffect(Tools[i], EFFECT_BUFF_RESISTANCE, ME,"moy");
		var effectBuffMP = getValeurEffect(Tools[i], EFFECT_BUFF_MP, ME,"moy");
		var effectBuffTP = getValeurEffect(Tools[i], EFFECT_BUFF_TP, ME,"moy");
		var effectBuffWisdom = getValeurEffect(Tools[i], EFFECT_BUFF_WISDOM, ME,"moy");
		var effectRawBuffTP = getValeurEffect(Tools[i], EFFECT_RAW_BUFF_TP, ME,"moy");
		var effectRawBuffMP = getValeurEffect(Tools[i], EFFECT_RAW_BUFF_MP, ME,"moy");
		var AllBoost = effectBuffStrength + effectBuffAgile + effectBuffResis + effectBuffMP + effectBuffTP + effectBuffWisdom + effectRawBuffTP + effectRawBuffMP;

    //Les invocations
		var effectSummon = getValeurEffect(Tools[i], EFFECT_SUMMON, ME, "moy");
    	var effectResurrect = getValeurEffect(Tools[i], EFFECT_RESURRECT, ME, "moy");
		var AllSummons = effectSummon + effectResurrect;

		if(AllAttaque>0) push(AttackTools,Tools[i]);
		if(AllShield>0) push(ShieldTools,Tools[i]);
		if(AllSoin>0) push(HealTools,Tools[i]);
		if(AllBoost>0) push(BoostsTools,Tools[i]);
		if(AllTatics>0) push(TacticsTools,Tools[i]);
		if(AllSummons>0) push(SummonTools,Tools[i]);
	}
}

function getToolsDammage(){
	if(Setup==false) SetupAll();
	return AttackTools;
}
function getToolsShield(){
	if(Setup==false) SetupAll();
	return ShieldTools;
}
function getToolsBoost(){
	if(Setup==false) SetupAll();
	return BoostsTools;
}
function getToolsTactics(){
	if(Setup==false) SetupAll();
	return TacticsTools;
}
function getToolsSummon(){
	if(Setup==false) SetupAll();
	return SummonTools;
}
function getToolsHeal(){
	if(Setup==false) SetupAll();
	return HealTools;
}

function getValeurEffect(tool, effectVoulu, leek, valeur){
	if(tool==null){
		debugE("arg tool est null in getValeurEffect");
		return false;
	}
	var effects;
	if(isChip(tool)){
		effects = getChipEffects(tool);
	}else{
		effects = getWeaponEffects(tool);
	}
	for (var effect in effects) //plus efficace que for (var i = 0; i < count(effects); i++)
	{
		if (effect[0] == effectVoulu)
		{//on cherche l'effet damage
				var nbrTour=effect[3];
				if(effect[3]==0) nbrTour=1;
				var Valeur = 0;
				if(valeur=="moy")Valeur = (effect[1] + effect[2]) / 2 * nbrTour;//moyenne
				else if(valeur=="-")Valeur = effect[1] * nbrTour;  //le minimum
				else if(valeur=="moy-")Valeur = ((effect[1]+effect[2])/2+effect[1])/2 * nbrTour;//moyenne en - et moy
				else if(valeur=="+")Valeur = effect[2]* nbrTour; //le maximum
				else debugE("[error-getValeurEffect] arg valeur wrong");
				var amelioration = 0;
				if(effectVoulu == EFFECT_ABSOLUTE_SHIELD || effectVoulu == EFFECT_RELATIVE_SHIELD) amelioration = getResistance(leek);
		  if(effectVoulu == EFFECT_DAMAGE_RETURN) amelioration = getAgility(leek);
				if(effectVoulu == EFFECT_HEAL || effectVoulu == EFFECT_BOOST_MAX_LIFE) amelioration = getWisdom(leek);
				if(effectVoulu == EFFECT_DAMAGE)amelioration = getStrength(leek);
				if(effectVoulu == EFFECT_POISON || effectVoulu == EFFECT_SHACKLE_STRENGTH || effectVoulu == EFFECT_SHACKLE_MAGIC || effectVoulu == EFFECT_SHACKLE_TP|| effectVoulu == EFFECT_SHACKLE_MP) amelioration = getMagic(leek);
				if(effectVoulu == EFFECT_BUFF_STRENGTH || effectVoulu == EFFECT_BUFF_WISDOM || effectVoulu == EFFECT_BUFF_RESISTANCE || effectVoulu == EFFECT_BUFF_AGILITY||
			 effectVoulu == EFFECT_BUFF_TP || effectVoulu == EFFECT_BUFF_MP || effectVoulu == EFFECT_RAW_BUFF_TP || effectVoulu == EFFECT_RAW_BUFF_MP ||
			 effectVoulu == EFFECT_NOVA_DAMAGE) amelioration = getScience(leek);
				if(effectVoulu == EFFECT_DEBUFF || effectVoulu == EFFECT_ANTIDOTE || effectVoulu == EFFECT_INVERT || effectVoulu == EFFECT_TELEPORT) amelioration = 0;

		  return Valeur*(1+amelioration/100) + 1;
			}
		}
	return 0;// si pas de "effect" alors return null
}

// FIN fonctions de setup Pseud3mys  //
