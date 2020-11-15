// dernière mise à jour le : 03/02/2020 par : Caneton

include("Debug");

/********************** Globals *********************************/
global NUMBER_OF_INGAME_ITEMS = 160;
global TOUR = 0; TOUR ++; // getTurn()
global CACHER;
global ME; ME = getLeek();
global PHRASE_A_DIRE = [];
global STOP_ACTION;
global ERROR_TOOLS;
global USE_VIE_PREVISIONNEL = false; // vérification des kills via les effets ; mettre à true en solo ou si on joue poison
global ONLY_ONE_SHOOT = false; // ne tir qu'une seule fois dans le doAction ; conseillé si on utilise la vie prévisionnelle + la magie
global COMBO = [];

global INFO_LEEKS = [];

global ID = 0, ABSOLUTE_SHIELD = 1, RELATIVE_SHIELD = 2, STRENGTH = 3, DAMAGE_RETURN = 4, MAGIC = 5, PT = 6, MP = 7, CELL = 8, LIFE = 9, MAX_LIFE = 10, SAGESSE = 11, VIE_PREVISIONNEL = 99;


function updateInfoLeeks() {//TODO : mettre d'autres caractéristiques avec des constantes associées
	var tab = [];
	var leeks = getAliveAllies()+ getAliveEnemies();
	for (var leek in leeks) {
		tab[leek] = [
			ID 			 : leek,
			ABSOLUTE_SHIELD : getAbsoluteShield(leek),
			RELATIVE_SHIELD : getRelativeShield(leek),
			STRENGTH		 : max(0,getStrength(leek)),
			DAMAGE_RETURN	 : getDamageReturn(leek),
			MAGIC		 : max(0,getMagic(leek)),
			PT			 : getTP(leek),
			MP			 : getMP(leek),
			CELL			 : getCell(leek),
			LIFE			 : getLife(leek),
			MAX_LIFE		 : getTotalLife(leek),
			SAGESSE		 : getWisdom(leek)
		];
	}
	INFO_LEEKS = @tab;
}

updateInfoLeeks();

global COEFF_LEEK_EFFECT;

// --------------------------- A Supprimer un fois que les effects "Tactic" seront pris en compte dans le fichier Utils.js  ...

global SCORE_TACTIC;
SCORE_TACTIC = (function() {
	var tab = [];
	var leeks = getAliveAllies() + getAliveEnemies();
	for (var leek in leeks) {
		tab[leek] = (isSummon(leek)) ? 0.5 : 1;
	}
	return tab;
})();

// ---------------------------------------------------------------------------


//informations concernant une action
global CELL_DEPLACE=0, CELL_VISE=1, VALEUR=2, CHIP_WEAPON=3, NB_TIR=4, PT_USE=5, EFFECT=6, CALLBACK = 7, PARAM = 8, PM_USE = 9;

// orientation pour le laser
global NE_laser = 0;
global SO_laser = 1;
global NO_laser = 2;
global SE_laser = 3;

//getEffects: [type, value, caster_id, turns, critical, item_id, target_id]
global TYPE = 0, VALUE = 1, CASTER_ID = 2, TURNS = 3, CRITICAL = 4, ITEM_ID = 5, TARGET_ID = 6;
//getWeaponEffects:[type, min, max, turns, targets]
global MIN = 1, MAX = 2, TARGETS = 4;

global MOYEN = 3;

global
	NAME_METALLIC_BULB 	= "metallic_bulb",
	NAME_HEALER_BULB 	= "healer_bulb",
	NAME_PUNY_BULB 		= "puny_bulb",
	NAME_LIGHTING_BULB 	= "lightning_bulb",
	NAME_ROCKY_BULB 	= "rocky_bulb",
	NAME_ICED_BULB 		= "iced_bulb",
	NAME_FIRE_BULB 		= "fire_bulb",
	NAME_WIZARD_BULB 	= "wizard_bulb";


global TURRET_ALLY;
global TURRET_ENNEMY;
if(getFightType() == FIGHT_TYPE_TEAM && TOUR == 1) {
	for (var entity in getAliveAllies() + getAliveEnemies()) {
		if(getType(entity) == ENTITY_TURRET) {
			if(isAlly(entity)) {
				TURRET_ALLY = entity;
			} else {
				TURRET_ENNEMY = entity;
			}
		}
	}
}


// Permet de ne pas se faire prendre sois même dans l'AOE
global MIN_RANGE = (function () {
	var min_range = [];
	for (var i=1; i< NUMBER_OF_INGAME_ITEMS; i++) {
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
	for (var i=1; i< NUMBER_OF_INGAME_ITEMS; i++) {
		max_range[i] = (isChip(i)) ? getChipMaxRange(i) : getWeaponMaxRange(i);
	}
	return @max_range;
})();

// Permet de ne pas utiliser une arme / puce si la valeur est trop faible
// Note : le contrôle sur la vatiable MINIMUM_TO_USE n'est pas fait dans tout les fichiers
global MINIMUM_TO_USE;
// permet de ne pas utiliser une arme / chip sur une entitée précise
// Note : le contrôle sur la vatiable NOT_USE_ON n'est pas fait dans tout les fichiers
global NOT_USE_ON;

// compte le nombre d'entitées de type ENTITY_LEEK
function countLeekAllie() {
	var cpt = 0;
	for(var leek in getAliveAllies()) {
 		if(getType(leek) == ENTITY_LEEK) {
			cpt++;
		}
	}
	return cpt;
 }



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


global
		CHARACTERISTIC_LIFE = 'LIFE',
		CHARACTERISTIC_STRENGTH = 'STRENGTH',
		CHARACTERISTIC_WISDOM = 'WISDOM',
		CHARACTERISTIC_AGILITY = 'AGILITY',
		CHARACTERISTIC_RESISTANCE = 'RESISTANCE',
		CHARACTERISTIC_SCIENCE = 'SCIENCE',
		CHARACTERISTIC_MAGIC = 'MAGIC',
		CHARACTERISTIC_FREQUENCY = 'FREQUENCY',
		CHARACTERISTIC_MOVEMENT = 'MOVEMENT',
		CHARACTERISTIC_TURN_POINT = 'TURN_POINT';

global
		COEFF_EFFECT = 'COEFF_EFFECT',
		BOOSTED_BY = 'BOOSTED_BY',
		IS_RELATIF = 'IS_RELATIF',
		IS_SPECIAL = 'IS_SPECIAL',
		IS_HEALTHY = 'IS_HEALTHY',
		INTERACT_WITH = 'INTERACT_WITH';

global
		INTERACT_SHIELD = 'INTERACT_SHIELD',
		INTERACT_STEAL_LIFE = 'INTERACT_STEAL_LIFE',
		INTERACT_RETURN_DAMAGE = 'INTERACT_RETURN_DAMAGE',
		INTERACT_NOVA_DAMAGE = 'INTERACT_NOVA_DAMAGE';



/** Tableau de la forme :
 * 	ALL_EFFECTS = [
 *		EFFECT_ID : [
 *			COEFF_EFFECT : aNumber
 *			BOOSTED_BY : aCaracteristic
 *			IS_RELATIF : Boolean
 *			IS_SPECIAL : Boolean
 *			IS_HEALTHY : Boolean
 *			INTERACT_WITH : [
 *				INTERACT_SHIELD : Boolean
 *				INTERACT_STEAL_LIFE : Boolean
 * 				INTERACT_RETURN_DAMAGE : Boolean
 *				INTERACT_NOVA_DAMAGE : Boolean / aNumber (en %)
 *			]
 *		]
 *	]
 *
 * COEFF_EFFECT est à ajouster, le reste est supposé correspondre au 'modèle de LeekWars'
 */
global ALL_EFFECTS = [
	EFFECT_DAMAGE : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : CHARACTERISTIC_STRENGTH,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : false,
		INTERACT_WITH : [
			INTERACT_SHIELD : true,
			INTERACT_STEAL_LIFE : true,
			INTERACT_RETURN_DAMAGE : true,
			INTERACT_NOVA_DAMAGE : 5
		]
	],
	EFFECT_POISON : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : CHARACTERISTIC_MAGIC,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : false,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : 10
		]
	],
	EFFECT_NOVA_DAMAGE : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : CHARACTERISTIC_SCIENCE,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : false,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_LIFE_DAMAGE : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : CHARACTERISTIC_LIFE,
		IS_RELATIF : true,
		IS_SPECIAL : false,
		IS_HEALTHY : false,
		INTERACT_WITH : [
			INTERACT_SHIELD : true,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : true,
			INTERACT_NOVA_DAMAGE : 5
		]
	],
	// EFFET SHACKLE
	EFFECT_SHACKLE_TP : [
		COEFF_EFFECT : 40,
		BOOSTED_BY : CHARACTERISTIC_MAGIC,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : false,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_SHACKLE_MP : [
		COEFF_EFFECT : 35,
		BOOSTED_BY : CHARACTERISTIC_MAGIC,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : false,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_SHACKLE_STRENGTH : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : CHARACTERISTIC_MAGIC,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : false,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_SHACKLE_MAGIC : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : CHARACTERISTIC_MAGIC,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : false,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	// EFFECT BUFF
	EFFECT_BUFF_TP : [
		COEFF_EFFECT : 80,
		BOOSTED_BY : CHARACTERISTIC_SCIENCE,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_BUFF_MP : [
		COEFF_EFFECT : 80,
		BOOSTED_BY : CHARACTERISTIC_SCIENCE,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_BUFF_STRENGTH : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : CHARACTERISTIC_SCIENCE,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_BUFF_AGILITY :  [
		COEFF_EFFECT : 0.7,
		BOOSTED_BY : CHARACTERISTIC_SCIENCE,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_BUFF_RESISTANCE : [
		COEFF_EFFECT : 0.7,
		BOOSTED_BY : CHARACTERISTIC_SCIENCE,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_BUFF_WISDOM : [
		COEFF_EFFECT : 0.7,
		BOOSTED_BY : CHARACTERISTIC_SCIENCE,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],

	EFFECT_AFTEREFFECT : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : CHARACTERISTIC_SCIENCE,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : false,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : 5
		]
	],
	// HEAL
	EFFECT_HEAL : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : CHARACTERISTIC_WISDOM,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false,
		]
	],
	EFFECT_BOOST_MAX_LIFE : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : CHARACTERISTIC_WISDOM,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false,
		]
	],
	// RESISTANCE
	EFFECT_RELATIVE_SHIELD : [
		COEFF_EFFECT : 3,
		BOOSTED_BY : CHARACTERISTIC_RESISTANCE,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_ABSOLUTE_SHIELD : [
		COEFF_EFFECT : 3,
		BOOSTED_BY : CHARACTERISTIC_RESISTANCE,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_DAMAGE_RETURN : [
		COEFF_EFFECT : 3,
		BOOSTED_BY : CHARACTERISTIC_AGILITY,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false,
		]
	],
	EFFECT_ABSOLUTE_VULNERABILITY : [
		COEFF_EFFECT : 3,
		BOOSTED_BY : null,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : false,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false,
		]
	],
	EFFECT_STEAL_ABSOLUTE_SHIELD : [
		COEFF_EFFECT : 3,
		BOOSTED_BY : null,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_VULNERABILITY : [
		COEFF_EFFECT : 12,
		BOOSTED_BY : null,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : false,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],

	// EFFET SPECIAUX
	EFFECT_SUMMON : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : null,
		IS_RELATIF : false,
		IS_SPECIAL : true,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_ANTIDOTE : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : null,
		IS_RELATIF : false,
		IS_SPECIAL : true,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_DEBUFF : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : null,
		IS_RELATIF : true,
		IS_SPECIAL : true,
		IS_HEALTHY : null,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_KILL : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : null,
		IS_RELATIF : false,
		IS_SPECIAL : true,
		IS_HEALTHY : false,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_INVERT : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : null,
		IS_RELATIF : false,
		IS_SPECIAL : true,
		IS_HEALTHY : null,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_RESURRECT : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : null,
		IS_RELATIF : false,
		IS_SPECIAL : true,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_TELEPORT : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : null,
		IS_RELATIF : false,
		IS_SPECIAL : true,
		IS_HEALTHY : false,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],

	// EFFETS PASSIF
	// Pour l'instant l'IA ne les prends pas en compte les effets passif
	// Mettre un EFFET dans le boosted by ?
	// Je mets is_special à 1 pour l'intant => faudrait peut être mets un is_passif
	EFFECT_DAMAGE_TO_ABSOLUTE_SHIELD : [
		COEFF_EFFECT : 0,
		BOOSTED_BY : null,
		IS_RELATIF : true,
		IS_SPECIAL : true,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_DAMAGE_TO_STRENGTH : [
		COEFF_EFFECT : 0,
		BOOSTED_BY : null,
		IS_RELATIF : true,
		IS_SPECIAL : true,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_NOVA_DAMAGE_TO_MAGIC : [
		COEFF_EFFECT : 0,
		BOOSTED_BY : null,
		IS_RELATIF : true,
		IS_SPECIAL : true,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_POISON_TO_SCIENCE : [
		COEFF_EFFECT : 0,
		BOOSTED_BY : null,
		IS_RELATIF : true,
		IS_SPECIAL : true,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],

	// EFFECT_RAW
	EFFECT_RAW_ABSOLUTE_SHIELD : [
		COEFF_EFFECT : 3,
		BOOSTED_BY : null,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_RAW_BUFF_MAGIC : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : null,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_RAW_BUFF_MP : [
		COEFF_EFFECT : 60,
		BOOSTED_BY : null,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_RAW_BUFF_SCIENCE : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : null,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_RAW_BUFF_STRENGTH : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : null,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_RAW_BUFF_TP : [
		COEFF_EFFECT : 80,
		BOOSTED_BY : null,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_RAW_BUFF_WISDOM : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : null,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	],
	EFFECT_PROPAGATION : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : null,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false,
		]
	],
	/*RAW_BUFF_RESISTANCE : [
		COEFF_EFFECT : 1,
		BOOSTED_BY : null,
		IS_RELATIF : false,
		IS_SPECIAL : false,
		IS_HEALTHY : true,
		INTERACT_WITH : [
			INTERACT_SHIELD : false,
			INTERACT_STEAL_LIFE : false,
			INTERACT_RETURN_DAMAGE : false,
			INTERACT_NOVA_DAMAGE : false
		]
	]*/
];

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
	SetupTools( AttackTools , ShieldTools , HealTools , BoostsTools , TacticsTools , SummonTools ) ;
	Setup = true;
	ope = (getOperations()-ope)/OPERATIONS_LIMIT*100;
	debugWP("Setup reussi ! ("+ope+"%)");
	return Setup;
}

function SetupTools( @attack_tools , @shield_tools , @heal_tools , @boost_tools , @tactics_tools , @summon_tools ) //equipe les puces et les armes
{
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
		var effectPropagation = getValeurEffect(Tools[i], EFFECT_PROPAGATION, ME, "moy");
		var AllAttaque = effectPoison + effectDamage + effectDebuffMagic + effectDebuffStrength + effectDebuffPT + effectDebuffPM + effectLifeDamage + effectNovaDamage + effectPropagation;

		//Pour les Shield + renvoie
		var effRelaShield=getValeurEffect(Tools[i],EFFECT_RELATIVE_SHIELD, ME,"moy");
		var effectShield = getValeurEffect(Tools[i],EFFECT_ABSOLUTE_SHIELD, ME,"moy");
		var effectRenvoie = getValeurEffect(Tools[i],EFFECT_DAMAGE_RETURN, ME,"moy");
		var effectStealShield = getValeurEffect(Tools[i], EFFECT_STEAL_ABSOLUTE_SHIELD, ME, "moy");
		var effectVulnerability = getValeurEffect(Tools[i], EFFECT_VULNERABILITY, ME, "moy");
		var AllShield = effRelaShield + effectShield + effectRenvoie + effectStealShield + effectVulnerability;

		//Pour les soins
		var effectSoin = getValeurEffect(Tools[i],EFFECT_HEAL, ME,"moy"); // Prend en compte l'inversion
		var effectBoostLife = getValeurEffect(Tools[i],EFFECT_BOOST_MAX_LIFE, ME,"moy");
		var AllSoin = effectSoin + effectBoostLife;

		//Pour les puces tactiques
		var effectLibe = getValeurEffect(Tools[i],EFFECT_DEBUFF, ME,"moy");
		var effectAntidote = getValeurEffect(Tools[i],EFFECT_ANTIDOTE, ME,"moy");
		// var effectInvert = getValeurEffect(Tools[i],EFFECT_INVERT, ME,"moy"); // Déjà compris dans heal & resistance (pour les allies et les enemmis)
		var effectTeleport = getValeurEffect(Tools[i],EFFECT_TELEPORT, ME,"moy");
		var AllTatics = effectLibe + effectAntidote /*+ effectInvert*/ + effectTeleport;

    //Pour les boosts
		var effectBuffStrength = getValeurEffect(Tools[i],  EFFECT_BUFF_STRENGTH,  ME,  "moy");
		var effectBuffAgile = getValeurEffect(Tools[i], EFFECT_BUFF_AGILITY, ME,"moy");
		var effectBuffResis = getValeurEffect(Tools[i], EFFECT_BUFF_RESISTANCE, ME,"moy");
		var effectBuffMP = getValeurEffect(Tools[i], EFFECT_BUFF_MP, ME,"moy");
		var effectBuffTP = getValeurEffect(Tools[i], EFFECT_BUFF_TP, ME,"moy");
		var effectBuffWisdom = getValeurEffect(Tools[i], EFFECT_BUFF_WISDOM, ME,"moy");
		var effectRawBuffTP = getValeurEffect(Tools[i], EFFECT_RAW_BUFF_TP, ME,"moy");
		var effectRawBuffMP = getValeurEffect(Tools[i], EFFECT_RAW_BUFF_MP, ME,"moy");
		var effectRawBuffWisdom = getValeurEffect(Tools[i], EFFECT_RAW_BUFF_WISDOM, ME, "moy");
		//var effectRawBuffResistance = getValeurEffect(Tools[i], RAW_BUFF_RESISTANCE, ME, "moy");
		var AllBoost = effectBuffStrength + effectBuffAgile + effectBuffResis + effectBuffMP + effectBuffTP + effectBuffWisdom + effectRawBuffTP + effectRawBuffMP + effectRawBuffWisdom /*+  effectRawBuffResistance*/ ;

    //Les invocations
		var effectSummon = getValeurEffect(Tools[i], EFFECT_SUMMON, ME, "moy");
    	var effectResurrect = getValeurEffect(Tools[i], EFFECT_RESURRECT, ME, "moy");
		var AllSummons = effectSummon + effectResurrect;

		if(AllAttaque>0) push(attack_tools,Tools[i]);
		if(AllShield>0) push(shield_tools,Tools[i]);
		if(AllSoin>0) push(heal_tools,Tools[i]);
		if(AllBoost>0) push(boost_tools,Tools[i]);
		if(AllTatics>0) push(tactics_tools,Tools[i]);
		if(AllSummons>0) push(summon_tools,Tools[i]);
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
		debugEP("arg tool est null in getValeurEffect");
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
				else debugEP("[error-getValeurEffect] arg valeur wrong");
				var amelioration = 0;
				if(effectVoulu == EFFECT_ABSOLUTE_SHIELD || effectVoulu == EFFECT_RELATIVE_SHIELD) amelioration = getResistance(leek);
		  		if(effectVoulu == EFFECT_DAMAGE_RETURN) amelioration = getAgility(leek);
				if(effectVoulu == EFFECT_HEAL || effectVoulu == EFFECT_BOOST_MAX_LIFE) amelioration = getWisdom(leek);
				if(effectVoulu == EFFECT_DAMAGE)amelioration = getStrength(leek);
				if(effectVoulu == EFFECT_POISON || effectVoulu == EFFECT_SHACKLE_STRENGTH || effectVoulu == EFFECT_SHACKLE_MAGIC || effectVoulu == EFFECT_SHACKLE_TP|| effectVoulu == EFFECT_SHACKLE_MP) amelioration = getMagic(leek);
				if(effectVoulu == EFFECT_BUFF_STRENGTH || effectVoulu == EFFECT_BUFF_WISDOM || effectVoulu == EFFECT_BUFF_RESISTANCE || effectVoulu == EFFECT_BUFF_AGILITY||
			 effectVoulu == EFFECT_BUFF_TP || effectVoulu == EFFECT_BUFF_MP || effectVoulu == EFFECT_NOVA_DAMAGE) amelioration = getScience(leek);
				if(effectVoulu == EFFECT_DEBUFF || effectVoulu == EFFECT_ANTIDOTE || effectVoulu == EFFECT_INVERT || effectVoulu == EFFECT_TELEPORT) amelioration = 0;
				if(effectVoulu == EFFECT_RAW_BUFF_TP || effectVoulu == EFFECT_RAW_BUFF_MP || effectVoulu == EFFECT_RAW_BUFF_WISDOM || /* effectVoulu == RAW_BUFF_RESISTANCE || */ effectVoulu == EFFECT_PROPAGATION) amelioration = 0;

		  return Valeur*(1+amelioration/100) + 1;
		}
	}
	return 0;// si pas de "effect" alors return null
}

// FIN fonctions de setup Pseud3mys  //

function can_use_tool( tool_id , TPmax )
{
	return ((ALL_INGAME_TOOLS[tool_id][TOOL_IS_WEAPON] && (TPmax >= ALL_INGAME_TOOLS[tool_id][TOOL_PT_COST] + 1 || TPmax == ALL_INGAME_TOOLS[tool_id][TOOL_PT_COST] && getWeapon() == tool_id)) || (!ALL_INGAME_TOOLS[tool_id][TOOL_IS_WEAPON] && getCooldown(tool_id) == 0 && TPmax >= ALL_INGAME_TOOLS[tool_id][TOOL_PT_COST])) ;
}

// ajout ordonnateur

global ALL_INGAME_TOOLS = [] ;
global TOOL_NAME = "name" ; // sert juste à simplifier la lecture lors des debugs, supprimable sinon
global TOOL_IS_WEAPON = "is weapon" ; // il faudra rajouter ischip si un jour il y a trois types d'actif
global TOOL_MIN_POWER = "min power" ;
global TOOL_AVERAGE_POWER = "average power" ;
global TOOL_MAX_POWER = "max power" ;
global TOOL_EFFECT_TYPE = "effect type" ;
global TOOL_ATTACK_EFFECTS = "attack effects" ;
global TOOL_MIN_RANGE = "min range" ; // l'appel aux min/max sont fait dans l'ia donc bon, si ça peut eco quelques opé...
global TOOL_MAX_RANGE = "max range" ;
global TOOL_PT_COST = "pt cost" ;
global TOOL_NEED_LINE_OF_SIGHT = "need line of sight" ;
global TOOL_IS_INLINE = "is inline" ;
global TOOL_AOE_TYPE = "aoe type" ;
global TOOL_COOLDOWN_TIME = "cooldown time" ;
global TOOL_NUMBER_TURN_EFFECT_LAST = "number turn effect last" ;
global TOOL_MODIFIER_STACKABLE = "modifier stackable" ;
global TOOL_MODIFIER_MULTIPLIED_BY_TARGETS = "modifier multiplied by targets" ;
global TOOL_MODIFIER_ON_CASTER = "modifier on caster" ;
global TOOL_TARGET_ALLIES = "target allies" ;
global TOOL_TARGET_ENEMIES = "target enemies" ;
global TOOL_TARGET_SUMMONS = "target summons" ;
global TOOL_TARGET_NON_SUMMONS = "target non summons" ;
global TOOL_TARGET_CASTER = "target caster" ;

if ( getTurn() == 1 ) // je n'ai pas ultra compris l'idée des globales fonctions pour qu'elle ne se lancent que le premier tour ^^'
{
	//var op_ordo = getOperations() ;
	create_all_tools_tab() ;
	//debugEP( getOperations()-op_ordo ) ;
	//debugEP( ALL_INGAME_TOOLS ) ;




	// Modification pour le EFFECT_STEAL_ABSOLUTE_SHIELD
	// J'ai pas tout compris sur comment marchait le effets STEAL_* mais si on change l'effet par EFFECT_RAW_ABSOLUTE_SHIELD et que l'on ajoute le modifier multiplied by targets on aura le même résultat (et l'IA devrait marcher)
	// cf https://leekwars.com/forum/category-3/topic-9714
	ALL_INGAME_TOOLS[WEAPON_J_LASER][TOOL_ATTACK_EFFECTS][1][TOOL_MODIFIER_MULTIPLIED_BY_TARGETS] = true;
	ALL_INGAME_TOOLS[WEAPON_J_LASER][TOOL_ATTACK_EFFECTS][1][TOOL_EFFECT_TYPE] = EFFECT_RAW_ABSOLUTE_SHIELD;



	// Modification pour les STEROID qui ne fonctionne pas comme dans la description
	// cf https://leekwars.com/forum/category-3/topic-9790
	// Surement plus besoin de ça, vu que steroid a changer
	/*ALL_INGAME_TOOLS[CHIP_STEROID][TOOL_ATTACK_EFFECTS][2] = ALL_INGAME_TOOLS[CHIP_STEROID][TOOL_ATTACK_EFFECTS][1];
	ALL_INGAME_TOOLS[CHIP_STEROID][TOOL_ATTACK_EFFECTS][2][TOOL_NUMBER_TURN_EFFECT_LAST] = 0;*/

}

function create_all_tools_tab()
{
	for ( var id_item = 0 ; id_item < NUMBER_OF_INGAME_ITEMS ; id_item++ )
	{
		if ( isChip( id_item ) == true ) // je suis habitué à voir les true/false, c'est juste plus lisible pour moi
		{
			ALL_INGAME_TOOLS[id_item] = [] ;
			get_chip_stats( ALL_INGAME_TOOLS[id_item] ,  id_item ) ;
		}
		else if ( isWeapon( id_item ) == true )
		{
			ALL_INGAME_TOOLS[id_item] = [] ;
			get_weapon_stats( ALL_INGAME_TOOLS[id_item] ,  id_item ) ;
		}
	}
}

function get_weapon_stats( @weapon_tab , id_arme )
{
	weapon_tab[TOOL_NAME] = getWeaponName( id_arme ) ;
	weapon_tab[TOOL_IS_WEAPON] = true ;
	weapon_tab[TOOL_ATTACK_EFFECTS] = [] ;
	all_stats_effects( weapon_tab[TOOL_ATTACK_EFFECTS] ,  getWeaponEffects( id_arme ) ) ;
	weapon_tab[TOOL_MIN_RANGE] = getWeaponMinRange( id_arme ) ;
	weapon_tab[TOOL_MAX_RANGE] = getWeaponMaxRange( id_arme ) ;
	weapon_tab[TOOL_PT_COST] = getWeaponCost( id_arme ) ;
	weapon_tab[TOOL_NEED_LINE_OF_SIGHT] = weaponNeedLos( id_arme ) ;
	weapon_tab[TOOL_IS_INLINE] = isInlineWeapon( id_arme ) ;
	weapon_tab[TOOL_AOE_TYPE] = getWeaponArea( id_arme ) ;
	weapon_tab[TOOL_COOLDOWN_TIME] = 0 ;
}

function get_chip_stats( @chip_tab , id_puce )
{
	chip_tab[TOOL_NAME] = getChipName( id_puce ) ;
	chip_tab[TOOL_IS_WEAPON] = false ;
	chip_tab[TOOL_ATTACK_EFFECTS] = [] ;
	all_stats_effects( chip_tab[TOOL_ATTACK_EFFECTS] ,  getChipEffects( id_puce ) ) ;
	chip_tab[TOOL_MIN_RANGE] = getChipMinRange( id_puce ) ;
	chip_tab[TOOL_MAX_RANGE] = getChipMaxRange( id_puce ) ;
	chip_tab[TOOL_PT_COST] = getChipCost( id_puce ) ;
	chip_tab[TOOL_NEED_LINE_OF_SIGHT] = chipNeedLos( id_puce ) ;
	chip_tab[TOOL_IS_INLINE] = isInlineChip( id_puce ) ;
	chip_tab[TOOL_AOE_TYPE] = getChipArea( id_puce ) ;
	chip_tab[TOOL_COOLDOWN_TIME] = getChipCooldown( id_puce ) ;
}

function all_stats_effects( @stat , @effects )
{
	var nb_effects = 0 ;
	for ( var effect in effects )
	{
		stat[nb_effects] = [] ;
		stats_effects( stat[nb_effects] , effect ) ;
		nb_effects++ ;
	}
}

function stats_effects( @tab_effect , @effect )
{
	tab_effect[TOOL_MIN_POWER] = effect[1] ;
	tab_effect[TOOL_AVERAGE_POWER] = (effect[1]+effect[2])/2 ;
	tab_effect[TOOL_MAX_POWER] = effect[2] ;
	tab_effect[TOOL_EFFECT_TYPE] = effect[0] ;
	tab_effect[TOOL_NUMBER_TURN_EFFECT_LAST] = effect[3] ;
	// effect[4/5] & truc renvoi un nombre donc pour avoir un true/false j'ai ajouté un && true
	tab_effect[TOOL_MODIFIER_STACKABLE] = (effect[5] & EFFECT_MODIFIER_STACKABLE) && true ;
	tab_effect[TOOL_MODIFIER_MULTIPLIED_BY_TARGETS] = (effect[5] & EFFECT_MODIFIER_MULTIPLIED_BY_TARGETS) && true ;
	tab_effect[TOOL_MODIFIER_ON_CASTER] = (effect[5] & EFFECT_MODIFIER_ON_CASTER) && true ;
	tab_effect[TOOL_TARGET_ALLIES] = (effect[4] & EFFECT_TARGET_ALLIES) && true ;
	tab_effect[TOOL_TARGET_ENEMIES] = (effect[4] & EFFECT_TARGET_ENEMIES) && true ;
	tab_effect[TOOL_TARGET_SUMMONS] = (effect[4] & EFFECT_TARGET_SUMMONS) && true ;
	tab_effect[TOOL_TARGET_NON_SUMMONS] = (effect[4] & EFFECT_TARGET_NON_SUMMONS) && true ;
	tab_effect[TOOL_TARGET_CASTER] = (effect[4] & EFFECT_TARGET_CASTER) && true ;
}
