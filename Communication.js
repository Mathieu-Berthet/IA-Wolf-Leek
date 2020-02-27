
// @auteur : Marmotte33
// Dernière mise à jour: 01/04/2018 par Marmotte
/**
* 	Variables :
* 		 - listeMessages = [type : [[paramètres, auteur]]]
*  				=> liste des messages reçu au début du tour (/!\ ne s'actualise pas pendant le tour)
*
*		   - chefDeMeute = int
*  				=> id du chef de meute
*
*		Fonctions :
*		 - envoyer(type, params) = ()
* 				=> envoie un message du type "type" à toute l'équipe avec les paramères "params"
*							La durée de vie d'un message est de 1 tour maximum
*
*		 - missionAccomplie(type, params, auteur) = ()
* 				=> envoie un message prévenant que la demande de "auteur" du type "type" avec les
*							paramètres "params" n'est plus à faire. Elle n'apparaîtra donc plus lors de
*							l'appel de la fonction "recevoir"
*
*		 - recevoir() = [type : [[paramètres, auteur]]]
*					=> reçois les messages envoyés par l'équipe
*
*		 - parler() = ()
*					=> parle suivant le thème choisi au début de la partie
*
*		 - sendReallyAll(type, params) = ()
*					=> équivalent à sendAll, mais envoie aussi l'information aux ennemis
**/

global listeMessages; // Liste des messages reçus depuis 1 tour
listeMessages = recevoir();

global chefDeMeute = -1; // Numéro du chef de meute (comme getLeek();)
function poireauAlpha() { // A modifier : faire le cas d'une résu pendant le tour
	if (not isAlive(chefDeMeute)) {
		chefDeMeute = getAliveAllies()[0];
		debug("Chef de meute -> " + getName(chefDeMeute));
	}
}
poireauAlpha();

/********************** Pipotron *********************************/
global P_FONCTION = selectPipotron([chanson, pipotronWizard, chanson, pipotronRayman, chanson, chanson]); // Ajouter ici vos pipotron

function parler() {
	if (getTP() > 0) {
		say(P_FONCTION());
	}
}

function selectPipotron(listeFonctions) {
	var choix = listeMessages["PIPOTRON_FONCTION"][0][0];
	if (choix === null) {
		choix = randInt(0, count(listeFonctions));
		sendReallyAll(MESSAGE_CUSTOM, ["PIPOTRON_FONCTION", choix]);
	}
	if (choix < count(listeFonctions)) { return listeFonctions[choix]; }
	else { return random([pipotronWizard, pipotronRayman]); }
}

function getNoteDeMusique() {
	var notes = ["♩", "♪", "♫", "♬", "♭"];
	return random(notes);
}

function chanson() {
	var choix = CHANSON_SYNCHRO[0];
	var vers = CHANSON_SYNCHRO[1];
	if (choix < count(listeChanson)) {
		if (vers == count(listeChanson[choix])) {
			choix = randInt(0, count(listeChanson));
			vers = 0;
		}
		CHANSON_SYNCHRO = [choix, vers + 1];
		sendReallyAll(MESSAGE_CUSTOM, ["CHANSON", CHANSON_SYNCHRO]);
		return listeChanson[choix][vers];
	}
	else { return random([pipotronWizard, pipotronRayman])(); }
}


/********************** Fonction d'envoie de messages *********************************/

/**
Pour utiliser envoyer et recevoir :
 Mettre au début de l'ia "var boiteAuxLettres = recevoir();"
 Cette variable contient toutes les informations émises entre ce tour, et celui d'avant
 La ligne "boiteAuxLettres[MESSAGE_ATTACK]" renvoie par exemple toutes les demandes d'attaque (null si aucune)
 		il suffit de placer l'ennemi ciblé dans params (qui peut être une liste, un entier, une chaine de caratères...)
On peut aussi envoyer des types de messages qui n'existent pas dans le jeu, comme si c'était des types existant
		/!\ Ne pas utiliser pour cela les entiers entre 1 et 13 /!\
"boiteAuxLettres[MESSAGE_ATTACK]" est une liste de la forme [ [params, auteur] ]
Pour récupérer les paramètres, on fait simplement "boiteAuxLettres[MESSAGE_ATTACK][0][0]"
**/

// Variable utilisée dans la fonction "envoyer"
global typeMessageExistant = [MESSAGE_ATTACK : true, MESSAGE_BUFF_AGILITY : true, MESSAGE_BUFF_FORCE : true, MESSAGE_BUFF_MP : true, MESSAGE_BUFF_TP : true, MESSAGE_CUSTOM : true, MESSAGE_DEBUFF : true, MESSAGE_HEAL : true, MESSAGE_MOVE_AWAY : true, MESSAGE_MOVE_AWAY_CELL : true, MESSAGE_MOVE_TOWARD : true, MESSAGE_MOVE_TOWARD_CELL : true, MESSAGE_SHIELD : true];

function envoyer(type, params) {
	if (typeMessageExistant[type] != null) {
		sendAll(type, params);
	}
	else {
		sendAll(MESSAGE_CUSTOM, [type, params]);
	}
}

function missionAccomplie(type, params, auteur) {
  sendAll(MESSAGE_CUSTOM, ["FAIT", [type, params, auteur]]);
}

function recevoir() {
	var messages = getMessages();
	reverse(messages);
	var boiteAuxLettres = [];
	var fait = [];
	for (var message in messages) {
		var type = message[1];
		if (type == MESSAGE_CUSTOM) { // Gestion des messages personnalisés
			type = message[2][0];
			message[2] = message[2][1];
		}
		var params = message[2];
		if (type == "FAIT") { // Ce qui est FAIT n'est plus à faire
			var auteur = params[2];
			if (fait[auteur] === null) {
				fait[auteur] = [];
			}
			type = params[0];
			if (fait[auteur][type] === null) {
				fait[auteur][type] = [];
			}
			fait[auteur][type][params[1]] = true;
		}
		else {
		var auteur = message[0];
			if (fait[auteur][type][params] != null) {
				fait[auteur][type][params] = null;
			}
			else {
				if (boiteAuxLettres[type] === null) {
					boiteAuxLettres[type] = [];
				}
				push(boiteAuxLettres[type], [params, auteur]);
			}
		}
	}
	return boiteAuxLettres;
}

function sendReallyAll(type, params) {
	sendAll(type, params);
	for (var entity in getAliveEnemies()) {
		if (not isSummon(entity)) { sendTo(entity, type, params); }
	}
}

/********************** Chansons *********************************/
// Ajouter ici la liste des paroles
global ACDCTnT = [' Oi, oi, oi Oi, oi, oi Oi, oi, oi Oi, oi, oi Oi, oi, oi', 'See me ride out of the sunset', 'On your color TV screen', 'Out for all that I can get If you know what I mean', 'Women to the left of me And women to the right', 'Ain\'t got no gun', 'Ain\'t got no knife', 'Don\'t you start no fight', '\'Cause I\'m T.N.T. I\'m dynamite T.N.T. and I\'ll win the fight T.N.T.', 'I\'m a power load T.N.T. watch me explode', 'I\'m dirty, mean and mighty unclean', 'I\'m a wanted man Public enemy number one Understand', 'So lock up your daughter Lock up your wife', 'Lock up your back door And run for your life', 'The man is back in town  Don\'t you mess me \'round', '\'Cause I\'m T.N.T. I\'m dynamite', '\'Cause I\'m T.N.T. I\'m dynamite T.N.T.', 'and I\'ll win the fight T.N.T. I\'m a power load T.N.T. watch me explode T.N.T.', '(oi, oi, oi) T.N.T. (oi, oi, oi) T.N.T. (oi, oi, oi) T.N.T. (oi, oi, oi)', 'I\'m dynamite (oi, oi) T.N.T. (oi, oi, oi)', 'And I\'ll win the fight (oi, oi, oi) I\'m a power load (oi, oi, oi) T.N.T. Watch me explode '];

global ACDCthunderstruck = [' I was caught In the middle of a railroad track (Thunder)', 'Looked around,And I knew there was no turning back (Thunder)', 'My mind raced And I thought what could I do? (Thunder)',' And I knew There was no help, no help from you (Thunder)', 'Sound in the drums Beatin in my heartThe thundering guns!', 'Tore me apart You ve been - thunderstruck! ','You ve been - thunderstruck! ','Rode down the highwayBroke the limit, we hit the town Went through to', 'Rode down the highway Broke the limit, we hit the town Went through to', ' You ve been - thunderstruck!',' Rode down the highway Broke the limit, we hit the town Went through to', ' Beatin in my heart The thundering guns! Tore me apart',' You ve been - thunderstruck!',' Rode down the highway Broke the limit, we hit the town Went through to',' Beatin in my heart The thundering guns! Tore me apart',' You ve been - thunderstruck!', 'Rode down the highway Broke the limit, we hit the town Went through to',' Beatin in my heart The thundering guns! Tore me apart',' You ve been - thunderstruck!',' Rode down the highway Broke the limit, we hit the town Went through to  Texas, yeah Texas',' And we had some fun We met some gals',' Some gals who gave us good times Broke all the rules, played all the fools',' Yeah, yeah, they, they, they blew our minds',' I was shakin  at the knees Could ve kept me in peace.',' Yeah the ladies were too kind',' You ve been - thunderstruck,',' thunderstruck Yeah yeah yeah,',' thunderstruck Yeah Oh,',' thunderstruck, yeah',' Now we re shaking at the knees Could ve kept me in peace.',' Thunderstruck,  thunderstruck Yeah yeah yeah,',' thunderstruck Thunderstruck, yeah, yeah, yeah',' Said yeah, it s alright We re! Doing fine Yeah,',' it s alright We re! Doing fine So fine', 'Thunderstruck, yeah, yeah,  yeah, ', 'Thunderstruck, thunderstruck, thunderstruck',' Whoa baby, baby, thunderstruck You ve been   thunderstruck', 'thunderstruck Thunderstruck, thunderstruck, thunderstruck You ve been thunderstruck.'];

global viceEtVersa = ['L\'hémorragie de tes désirs', 'S\'est éclipsée sous l\'azur bleu dérisoire', 'Du temps qui se passe', 'Contre duquel on ne peut rien', 'Être ou ne pas être', 'Telle est la question sinusoïdale', 'De l\'anachorète hypocondriaque', 'Mais tu dis (mais tu dis)', 'Que le bonheur est irréductible', 'Et je dis (et il dit)', 'Que ton espoir n\'est pas si désespéré', 'A condition d\'analyser', 'Que l\'absolu ne doit pas être annihilé', 'Par l\'illusoire précarité', 'De nos amours', 'Destituées', 'Et vice et versa', 'Il faut que tu arriveras', 'A laminer tes rancœurs dialectiques', 'Même si je suis con...', '... vaincu que c\'est très difficile', 'Mais comme moi, dis-toi', 'Qu\'il est tellement plus mieux', 'D\'éradiquer les tentacules de la déréliction', 'Et tout deviendra clair', 'Mais tu dis (mais tu dis)', 'Que le bonheur est irréductible', 'Et je dis (et il dit)', 'Que ton espoir n\'est pas si désespéré', 'A condition d\'analyser', 'Que l\'absolu ne doit pas être annihilé', 'Par l\'illusoire précarité', 'De nos amours', 'Destituées', 'Et vice et versa', 'D\'où venons nous ?', 'Où allons nous ?', 'J\'ignore de le savoir', 'Mais ce que je n\'ignore pas de le savoir', 'C\'est que le bonheur', 'Est à deux doigts de tes pieds', 'Et que la simplicité réside dans l\'alcôve', 'Bleue, jaune, mauve et insoupçonnée', 'De nos rêveries', 'Mauves et bleues et jaunes et pourpres', 'Et paraboliques', 'Et vice et versa', 'Mais tu dis (mais tu dis)', 'Que le bonheur est irréductible', 'Et je dis (et il dit)', 'Que ton espoir n\'est pas si désespéré', 'A condition d\'analyser', 'Que l\'absolu ne doit pas être annihilé', 'Par l\'illusoire précarité', 'De nos amours', 'Et qu\'il ne faut pas cautionner l\'irréalité', 'Sous des aspérités absentes et désenchantées', 'De nos pensées iconoclastes et désoxydées', 'Par nos désirs excommuniés de la fatalité', 'Destituée', 'Et vice et versa'];

global LaTribuDeDana = ['Le vent souffle sur les plaines de la Bretagne armoricaine,', 'je jette un dernier regard sur ma femme, mon fils et mon domaine.', 'Akim, le fils du forgeron est venu me chercher,','Les druides ont décidé de mener le combat dans la vallée.','Là, où tous nos ancêtres,','de géants guerriers celtes', 'après de grandes batailles, se sont imposés en maîtres,', 'c\'est l\'heure maintenant de défendre notre terre,','contre une armée de Simériens prête à croiser le fer.', 'Toute la tribu s\'est réunie autour de grands menhirs,','pour invoquer les dieux afin qu\'ils puissent nous bénir.','Après cette prière avec mes frères sans faire état de zèle,', 'les chefs nous ont donné à tous des gorgées d\'hydromel,','Pour le courage, pour pas qu\'il y ait de faille,','pour rester grands et fiers quand nous serons dans la bataille','car c\'est la première fois pour moi que je pars au combat,','et j\'espère être digne de la tribu de Dana.', 'Dans la vallée ohoh de Dana lalilala.', 'Dans la vallée j\'ai pu entendre les échos.', 'Dans la vallée ohoh de Dana lalilala.','Dans la vallée des chants de guerre près des tombeaux.','Après quelques incantations de druides et de magie,','toute la tribu, le glaive en main courait vers l\'ennemi,','la lutte était terrible et je ne voyais que les ombres,', 'tranchant l\'ennemi qui revenait toujours en surnombre.','Mes frères tombaient l\'un après l\'autre devant mon regard,','sous le poids des armes que possédaient tous ces barbares,','des lances, des haches et des épées dans le jardin d\'Eden','qui écoulait du sang sur l\'herbe verte de la plaine.', 'Comme ces jours de peine, où l\'homme se traîne','à la limite du règne du mal et de la haine,','fallait-il continuer ce combat déjà perdu,','mais telle était la fierté de toute la tribu,', 'la lutte a continué comme ça jusqu\'au soleil couchant,','de férocité extrême en plus d\'acharnement,','fallait défendre la terre de nos ancêtres enterrés là,','et pour toutes les lois de la tribu de Dana.','Dans la vallée ohoh de Dana lalilala.','Dans la vallée j\'ai pu entendre les échos.','Dans la vallée ohoh de Dana lalilala.','Dans la vallée des chants de guerre près des tombeaux.','Au bout de la vallée on entendait le son d\'une corne,','d\'un chef ennemi qui appelait toute sa horde,','avait-il compris qu\'on lutterait même en enfer','et qu\'à la tribu de Dana appartenaient ces terres ?','Les guerriers repartaient, je ne comprenais pas','tout le chemin qu\'ils avaient fait pour en arriver là,','quand mon regard se posa tout autour de moi,','j\'étais le seul debout de la tribu voilà pourquoi.','Mes doigts se sont écartés tout en lâchant mes armes','et le long de mes joues se sont mises à couler des larmes,','je n\'ai jamais compris pourquoi les dieux m\'ont épargné', 'de ce jour noir de notre histoire que j\'ai conté.','Le vent souffle toujours sur la Bretagne armoricaine','et j\'ai rejoins ma femme, mon fils et mon domaine,','j\'ai tout reconstruit de mes mains pour en arriver là,','je suis devenu roi de la tribu de Dana.','Dans la vallée ohoh de Dana lalilala.','Dans la vallée j\'ai pu entendre les échos.','Dans la vallée ohoh de Dana lalilala.','Dans la vallée des chants de guerre près des tombeaux'];

global TakeMeToChurch = ['My lover\'s got humour', 'She\'s the giggle at a funeral','Knows everybody\'s disapproval','I should\'ve worshipped her sooner','If the Heavens ever did speak','She is the last true mouthpiece','Every Sunday\'s getting more bleak','A fresh poison each week','\'We were born sick, \' you heard them say it','My church offers no absolutes','She tells me \'worship in the bedroom\'','The only heaven I\'ll be sent to','Is when I\'m alone with you','I was born sick, but I love it','Command me to be well','Amen, Amen, Amen','Take me to church','I\'ll worship like a dog at the shrine of your lies','I\'ll tell you my sins and you can sharpen your knife','Offer me that deathless death','Good God, let me give you my life','Take me to church','I\'ll worship like a dog at the shrine of your lies','I\'ll tell you my sins and you can sharpen your knife','Offer me that deathless death','Good God, let me give you my life','If I\'m a pagan of the good times','My lover\'s the sunlight','To keep the Goddess on my side','She demands a sacrifice','To drain the whole sea','Get something shiny','Something meaty for the main course','That\'s a fine looking high horse','What you got in the stable?','We\'ve a lot of starving faithful','That looks tasty','That looks plenty','This is hungry work','Take me to church','I\'ll worship like a dog at the shrine of your lies','I\'ll tell you my sins and you can sharpen your knife','Offer me that deathless death','Good God, let me give you my life','Take me to church','I\'ll worship like a dog at the shrine of your lies','I\'ll tell you my sins and you can sharpen your knife','Offer me that deathless death','Good God, let me give you my life','No masters or kings when the ritual begins','There is no sweeter innocence than our gentle sin','In the madness and soil of that sad earthly scene','Only then I am human','Only then I am clean','Amen, Amen, Amen','Take me to church','I\'ll worship like a dog at the shrine of your lies','I\'ll tell you my sins and you can sharpen your knife','Offer me that deathless death','Good God, let me give you my life','Take me to church','I\'ll worship like a dog at the shrine of your lies','I\'ll tell you my sins and you can sharpen your knife','Offer me that deathless death','Good God, let me give you my life'];

global leLoupEtLeChien = ['Un Loup n\'avait que les os et la peau,', 'Tant les chiens faisaient bonne garde.', 'Ce Loup rencontre un Dogue aussi puissant que beau,', 'Gras, poli, qui s\'était fourvoyé par mégarde.', 'L\'attaquer, le mettre en quartiers,', 'Sire Loup l\'eût fait volontiers ;', 'Mais il fallait livrer bataille,', 'Et le Mâtin était de taille', 'A se défendre hardiment.', 'Le Loup donc l\'aborde humblement,', 'Entre en propos, et lui fait compliment', 'Sur son embonpoint, qu\'il admire.', '\' Il ne tiendra qu\'à vous beau sire,', 'D\'être aussi gras que moi, lui repartit le Chien.', 'Quittez les bois, vous ferez bien :', 'Vos pareils y sont misérables,', 'Cancres, haires, et pauvres diables,', 'Dont la condition est de mourir de faim.', 'Car quoi ? rien d\'assuré : point de franche lippée :', 'Tout à la pointe de l\'épée.', 'Suivez-moi : vous aurez un bien meilleur destin. \' ', 'Le Loup reprit : \'Que me faudra-t-il faire ?', '- Presque rien, dit le Chien, donner la chasse aux gens', 'Portants bâtons, et mendiants ;', 'Flatter ceux du logis, à son Maître complaire :', 'Moyennant quoi votre salaire', 'Sera force reliefs de toutes les façons :', 'Os de poulets, os de pigeons,', 'Sans parler de mainte caresse. \' ', 'Le Loup déjà se forge une félicité', 'Qui le fait pleurer de tendresse.', 'Chemin faisant, il vit le col du Chien pelé.', '\' Qu\'est-ce là ? lui dit-il. - Rien. - Quoi ? rien ? - Peu de chose.', '- Mais encor ? - Le collier dont je suis attaché', 'De ce que vous voyez est peut-être la cause.', '- Attaché ? dit le Loup : vous ne courez donc pas', 'Où vous voulez ? - Pas toujours ; mais qu\'importe ?', '- Il importe si bien, que de tous vos repas', 'Je ne veux en aucune sorte,', 'Et ne voudrais pas même à ce prix un trésor. \'', 'Cela dit, maître Loup s\'enfuit, et court encor.'];

global Starlight = ['Far away','The ship is taking me far away','Far away from the memories','Of the people who care if I live or die','The starlight','I will be chasing a starlight','Until the end of my life','I don\'t know if it\'s worth it anymore','Hold you in my arms','I just wanted to hold','You in my arms','My life','You electrify my life','Let\'s conspire to ignite','All the souls that would die just to feel alive','Now I\'ll never let you go','If you promised not to fade away','Never fade away','Our hopes and expectations','Black holes and revelations','Our hopes and expectations','Black holes and revelations','Hold you in my arms','I just wanted to hold','You in my arms','Far away','The ship is taking me far away','Far away from the memories','Of the people who care if I live or die','And I\'ll never let you go','If you promise not to fade away','Never fade away','Our hopes and expectations','Black holes and revelations','Our hopes and expectations','Black holes and revelations','Hold you in my arms','I just wanted to hold','You in my arms','I just wanted to hold'];

global BoulevardOfBrokenDreams = ['I walk a lonely road','The only one that I have ever known','Don\'t know where it goes','But it\'s only me, and I walk alone','I walk this empty street','On the boulevard of broken dreams','Where the city sleeps','And I\'m the only one, and I walk alone','I walk alone, I walk alone','I walk alone and I walk a','My shadow\'s the only one that walks beside me','My shallow heart\'s the only thing that\'s beating','Sometimes I wish someone out there will find me','Till then I walk alone','Ah ah ah ah ah','Ah ah ah ah ah','I\'m walking down the line','That divides me somewhere in my mind','On the border line of the edge','And where I walk alone','Read between the lines','What\'s fucked up and every thing\'s all right','Check my vital signs to know I\'m still alive','And I walk alone','I walk alone, I walk alone','I walk alone and I walk a','My shadow\'s the only one that walks beside me','My shallow heart\'s the only thing that\'s beating','Sometimes I wish someone out there will find me','Till then I walk alone','Ah ah ah ah ah','Ah ah ah ah ah','I walk alone, I walk a','I walk this empty street','On the boulevard of broken dreams','Where the city sleeps','And I\'m the only one, and I walk alone','My shadow\'s the only one that walks beside me','My shallow heart\'s the only thing that\'s beating','Sometimes I wish someone out there will find me','Till then I walk alone'];

global EtatDAmour = ['Point final, t\'as semé sans sonner','Des points d\'interrogation','Je passe mon temps à les escalader','Toutes ces montagnes de questions','Toi ma beauté mon addiction','J\'rejoue notre partition','J\'coupe les refrains','Où tu dis que j\'suis coupable','J\'mets mes fausses notes sur la table','Si tu reviens','Oublie au moins les mots qui nous freinent','Faisons le vide avant qu\'la coupe soit pleine','Reprends la main, j\'veux dire la mienne','Faisons le plein pour fuir loin de la peine','Si ton coeur détale en rupture brutale','Moi l\'animal j\'retiens ma respiration','Je compte à rebours, je guette ton retour','Dans tous mes, tous mes états d\'amour','Dans mes états, tous mes états d\'amour','Dans mes états d\'amour','Par essence j\'suis un peu pyromane','J\'me brûle de tant de questions','Je te promets qu\'si tu retrouves la flamme','J\'éteins tes hésitations','J\'me fais des films en noir et blanc','J\'aurai l\'oscar de l\'amant','De l\'âme en peine','J\'préfère largement l\'histoire','Où tu m\'embrasses au hasard','J\'rejoue la scène','Oublie au moins les mots qui nous freinent','Faisons le vide avant qu\'la coupe soit pleine','Reprends la main, j\'veux dire la mienne','Faisons le plein pour fuir loin de la peine','Si ton coeur détale en rupture brutale','Moi l\'animal j\'retiens ma respiration','Je compte à rebours, je guette ton retour','Dans tous mes, tous mes états d\'amour','Dans mes états, tous mes états d\'amour','Dans mes états, dans mes états d\'amour','Dans mes états, dans mes états tous mes états d\'amour','Si ton coeur détale en rupture brutale','Moi l\'animal j\'retiens ma respiration','Je compte à rebours, je guette ton retour','Dans tous mes, tous mes états d\'amour','Dans mes états, tous mes états d\'amour','Dans mes états, dans mes états d\'amour'];

global LaReineDesNeiges = ['L\'hiver s\'installe doucement dans la nuit','La neige est reine à son tour','Un royaume de solitude','Ma place est là pour toujours','Le vent qui hurle en moi ne pense plus à demain','Il est bien trop fort','J\'ai lutté, en vain','Cache tes pouvoirs, n\'en parle pas','Fais attention, le secret survivra','Pas d\'états d\'âme, pas de tourments','De sentiments','Libérée, Délivrée','Je ne mentirai plus jamais','Libérée, Délivrée','C\'est décidé, je m\'en vais','J\'ai laissé mon enfance en été','Perdue dans l\'hiver','Le froid est pour moi le prix de la liberté.','Quand on prend de la hauteur','Tout semble insignifiant','La tristesse, l\'angoisse et la peur','M\'ont quittées depuis longtemps','Je veux voir ce que je peux faire','De cette magie pleine de mystères','Le bien, le mal, je dis tant pis, tant pis','Libérée, Délivrée','Les étoiles me tendent les bras','Libérée, Délivrée','Non, je ne pleure pas','Me voilà !','Oui, je suis là !','Perdue dans l\'hiver','Mon pouvoir vient du ciel et envahit l\'espace','Mon âme s\'exprime en dessinant et sculptant dans la glace','Et mes pensées sont des fleurs de cristal gelées.','Non je ne reviendrai pas','Le passé est passé !','Libérée, Délivrée','Désormais plus rien ne m\'arrête','Libérée, Délivrée','Plus de princesse parfaite','Je suis là !','Comme je l\'ai rêvé !','Perdue dans l\'hiver','Le froid est pour moi le prix de la liberté.'];

global wolfInSheepsClothing = ['Ha-ha-ha, this is about you', 'Beware, beware, be skeptical', 'Of their smiles, their smiles of plated gold', 'Deceit so natural', 'But a wolf in sheep\'s clothing is more than a warning', 'Bah-bah-black sheep, have you any soul?', 'No sir, by the way, what the hell are morals?', 'Jack, be nimble, Jack, be quick', 'Jill\'s a little whore and her alibis are dirty tricks', 'So could you', 'Tell me how you\'re sleeping easy', 'How you\'re only thinking of yourself', 'Show me how you justify', 'Telling all your lies like second nature', 'Listen, mark my words: one day (one day)', 'You will pay, you will pay', 'Karma\'s gonna come collect your debt', 'Aware, aware, you stalk your prey', 'With criminal mentality', 'You sink your teeth into the people you depend on', 'Infecting everyone, you\'re quite the problem', 'Fee-fi-fo-fum, you better run and hide', 'I smell the blood of a petty little coward', 'Jack, be lethal, Jack, be slick', 'Jill will leave you lonely dying in a filthy ditch', 'So could you', 'Tell me how you\'re sleeping easy', 'How you\'re only thinking of yourself', 'Show me how you justify', 'Telling all your lies like second nature', 'Listen, mark my words: one day (one day)', 'You will pay, you will pay', 'Karma\'s gonna come collect your debt', 'Maybe you\'ll change', 'Abandon all your wicked ways', 'Make amends and start anew again', 'Maybe you\'ll see', 'All the wrongs you did to me', 'And start all over, start all over again', 'Who am I kidding?', 'Now, let\'s not get overzealous here', 'You\'ve always been a huge piece of shit', 'If I could kill you I would', 'But it\'s frowned upon in all fifty states', 'Having said that, burn in hell', '(Where are you, motherfucker? Ha ha!)', 'So tell me how you\'re sleeping easy', 'How you\'re only thinking of yourself', 'Show me how you justify', 'Telling all your lies like second nature', 'Listen, mark my words: one day (one day)', 'You will pay, you will pay', 'Karma\'s gonna come collect your debt', 'Karma\'s gonna come collect your debt,', '(She\'s a li—she\'s a li—she\'s a liar)', 'Karma\'s gonna come collect your debt.'];

global JeCodeAvecLeQ = ['Mon dernier ordi a claqué','Il buggait trop : j\'l\'ai balancé','J\'en ai racheté un y a trois jours','Depuis il fait qu\'se mettre à jour','Trop de programmes préinstallés !','Norton impossible à virer !','(C\'est tout la faute aux programmeurs !)','Séquestré dans mon p\'tit bureau','J\'me sens mourir dans mon cerveau','Y a plus d\'chauffage, c\'était trop cher','Ou c\'est retenu sur mon salaire','Ça menace de délocaliser...','Mes petits doigts tout gelés !','Alors !...','Je code avec le Q !','La la la la la la laa...','Si ça bug ou plante j\'men fous :','On m\'paye pas pour tester !','Je code avec le Q !','La la la la la la laa...','Même si le programme marche pas','Tu seras pas remboursé !','Tu seras pas remboursé...','(Ha ha ha...)','J\'ai la dernière console HD !','Elle lit pas les jeux du passé','Beaucoup trop d\'mises-à-jour système','\'Fin bon, pas grave, j\'poireaute quand-même...','Quoi, ils se sont fait pirater ?!','Mon compte bancaire va pas aimer !','(C\'est tout la faute aux développeurs !)','J\'avais besoin d\'aide supplémentaire','Alors on m\'a mis un stagiaire','Mais il fait rien que déconner !','C\'est pas ma responsabilité','Et moi j\'veux pas me faire virer !','J\'ai les mains complètement coupées !','Alors !...','Quatre barres en ville et ça marche pas','La 4G vaut pas mieux qu\'la 3...','J\'voulais réserver l\'TGV','Mais la session à expiré !','J\'vais sur Youtube pour me calmer','Et Flash a cessé de fonctionner !','(Oh oooh)','Nan mais vous savez','C\'était pas si dur de pirater le virtual market','Et de récupérer toutes les coordonnées bancaires','Faut savoir que c\'était vraiment, mais VRAIMENT codé avec le Q','J\'sais de quoi j\'parle : je fais partie de l\'équipe de développement','J\'négocie une augmentation','J\'demande à parler au patron','« Pars en Inde si t\'es pas content !','Faut que le p\'tit Kévin, 13 ans...»','Me révèle ce tyran cruel','«... Aie son Call Of avant Noël ! »','Alors...','Alors !...','Je code avec le Q !','La la la la la la laa...','Tout est toujours plus puissant','Mais de plus en plus lent !','Je code avec le Q !','La la la la la la laa...','Si ça bug ou plante j\'men fous','On continue d\'acheter !','On coooon... (On con...)','Eh oui, on coooon... (On con...)','On est trop coooon... ...tinue d\'acheter !','(Ha ha ha ha ha !)','C\'est la faute à ces conn@rds d\'€nculés de conn@rds de m€rde !','Nan mais sérieux, ou quoi ?! Ils font chi€r avec leurs trucs, là','Ahh !','(La la la la la lala !)','Ce métier me rend fou...'];

global LesBetises = ['J\'ai tout mangé le chocolat','J\'ai tout fumé les Craven A','Et comme t\'étais toujours pas là','J\'ai tout vidé le Rhum Coca','J\'ai tout démonté tes tableaux','J\'ai tout découpé tes rideaux','Tout déchiré tes belles photos','Que tu cachais dans ton bureau','Fallait pas m\' quitter tu vois','Il est beau le résultat','Je fais rien que des bêtises','Des bêtises quand t\'es pas là','J\'ai tout démonté le bahut','J\'ai tout bien étalé la glu','Comm\' t\'étais toujours pas rev\'nu','J\'ai tout haché menu menu','J\'ai tout brûlé le beau tapis','J\'ai tout scié les pieds du lit','Tout décousu tes beaux habits','Et mis le feu à la pend\'rie','Fallait pas m\' quitter tu vois','Il est beau le résultat','Je fais rien que des bêtises','Des bêtises quand t\'es pas là','Fallait pas casser mon cœur','M\' laisser sans baby sitter','Je fais rien que des bêtises','Des bêtises quand mes yeux pleurent','J\'ai tout renversé les poubelles','J\'ai tout pillé ta belle vaisselle','Attends c\'est pas tout à fait tout','J\'ai aussi dépensé tous tes sous','Fallait pas m\' quitter tu vois','Il est beau le résultat','Je fais rien que des bêtises','Des bêtises quand t\'es pas là'];

global LesSardines = ['Pour faire une chanson facile, facile,','Faut d\'abord des paroles débiles, débiles,','Une petite mélodie qui te prend bien la tête,', 'Et une chorégraphie pour bien faire la fête,','Dans celle là, on se rassemble, à 5, ou 6, ou 7', 'Et on se colle tous ensemble, en chantant à tue tête.', 'Ha ! Qu\'est-ce qu\'on est serré, au fond de cette boite,', 'Chantent les sardines, chantent les sardines, ','Ha ! Qu\'est-ce qu\'on est serré, au fond de cette boite,', 'Chantent les sardines entre l\'huile et les aromates.','Ha ! Qu\'est-ce qu\'on est serré, au fond de cette boite,', 'Chantent les sardines, chantent les sardines, ','Ha ! Qu\'est-ce qu\'on est serré, au fond de cette boite,', 'Chantent les sardines entre l\'huile et les aromates.','Bien sûr, que c\'est vraiment facile, facile, ','C\'est même complètement débile, débile, ','C\'est pas fait pour penser, c\'est fait pour faire la fête,', 'C\'est fait pour se toucher, se frotter les arêtes , ','Alors on se rassemble, à 5, ou 6, ou 7, ','Et puis on saute ensemble en chantant à tue tête,', 'Ha ! Qu\'est-ce qu\'on est serré, au fond de cette boite,', 'Chantent les sardines, chantent les sardines, ','Ha ! Qu\'est-ce qu\'on est serré, au fond de cette boite,', 'Chantent les sardines entre l\'huile et les aromates.','Ha ! Qu\'est-ce qu\'on est serré, au fond de cette boite,', 'Chantent les sardines, chantent les sardines, ','Ha ! Qu\'est-ce qu\'on est serré, au fond de cette boite,', 'Chantent les sardines entre l\'huile et les aromates.','Et puis, pour respirer un p\'tit peu, on s\'écarte en se tenant la main,', 'Et puis, pour être encore plus heureux, ','On fait là, là, là, en chantant mon refrain !', 'Là, là, là, là, là, là, là, là, là, là, là, là, là, là, là,','Là, là, là, là, là, là, là, là, là, là, là, là, là, là, là,','Là, là, là, là, là, là, là, là, là, là, là, là, là, là, là,','Là, là, là, là, là, là, là, là, là, là, là, là, là, là, là,','Et maintenant, on se resserre tous ! ','On se resserre, et maintenant qu\'on l\'a connaît,', 'On va chanter la chanson des sardines ! Attention ! Allez !', 'Ha ! Qu\'est-ce qu\'on est serré, au fond de cette boite, ','Chantent les sardines, chantent les sardines, ','Ha ! Qu\'est-ce qu\'on est serré, au fond de cette boite,', 'Chantent les sardines entre l\'huile et les aromates.','Ha ! Qu\'est-ce qu\'on est serré, au fond de cette boite,', 'Chantent les sardines, chantent les sardines, ','Ha ! Qu\'est-ce qu\'on est serré, au fond de cette boite, ','Chantent les sardines entre l\'huile et les aromates.'];

global LesLacsDuConnemara = ['Terre brûlée au vent','Des landes de pierres','Autour des lacs, c\'est pour les vivants','Un peu d\'enfer, le Connemara','Des nuages noirs qui viennent du nord','Colorent la terre, les lacs, les rivières','C\'est le décor du Connemara','Au printemps suivant, le ciel irlandais était en paix','Maureen a plongé nue dans un lac du Connemara','Sean Kelly s\'est dit \'je suis catholique\', Maureen aussi','L\'église en granit de Limerick, Maureen a dit oui','De Tipperary, Barry-Connely et de Galway','Ils sont arrivés dans le comté du Connemara','Y\'avait les Connors, les O\'Connolly, les Flaherty du Ring of Kerry','Et de quoi boire trois jours et deux nuits','Là-bas au Connemara','On sait tout le prix du silence','Là-bas au Connemara','On dit que la vie, c\'est une folie','Et que la folie, ça se danse','Terre brûlée au vent, des landes de pierres','Autour des lacs, c\'est pour les vivants','Un peu d\'enfer, le Connemara','Des nuages noirs qui viennent du nord','Colorent la terre, les lacs, les rivières','C\'est le décor du Connemara','On y vit encore au temps des Gaëls et de Cromwell','Au rythme des pluies et du soleil','Aux pas des chevaux','On y croit encore aux monstres des lacs','Qu\'on voit nager certains soirs d\'été','Et replonger pour l\'éternité','On y voit encore','Des hommes d\'ailleurs venus chercher','Le repos de l\'âme et pour le coeur à un goût de meilleur','L\'on y croit encore','Que le jour viendra, il est tout près','Où les Irlandais feront la paix autour de la Croix','Là-bas au Connemara','On sait tout le prix de la guerre','Là-bas au Connemara','On n\'accepte pas','La paix des Gallois','Ni celle des rois d\'Angleterre'];

global LesDemonsDeMinuit = ['Rue déserte','Dernière cigarette','Plus rien ne bouge','Juste un bar qui éclaire le trottoir','D\'un néon rouge','J\'ai besoin','De trouver quelqu\'un','J\'veux pas dormir','Je cherche un peu de chaleur','À mettre dans mon cœur','Ils m\'entraînent au bout de la nuit','Les démons de minuit','M\'entraînent jusqu\'à l\'insomnie','Les fantômes de l\'ennui','Dans mon verre','Je regarde la mer','Qui se balance (qui se balance)','J\'veux un disque','De funky music','Faut que ça danse (faut que ça danse)','J\'aime cette fille','Sur talons-aiguilles','Qui se déhanche','Ça met un peu de chaleur','Au fond de mon cœur','Ils m\'entraînent au bout de la nuit','Les démons de minuit','M\'entraînent jusqu\'à l\'insomnie','Les fantômes de l\'ennui','Ils m\'entraînent au bout de la nuit','Les démons de minuit','M\'entraînent jusqu\'à l\'insomnie','Les fantômes de l\'ennui','J\'aime cette fille','Ses talons-aiguilles','Qui se déhanche','Ça met un peu de chaleur','Au fond de mon cœur','Ils m\'entraînent au bout de la nuit (jusqu\'au bout de la nuit)','Les démons de minuit','M\'entraînent jusqu\'à l\'insomnie (ils m\'entraînent)','Les fantômes de l\'ennui','Ils m\'entraînent au bout de la nuit'];

global PartenaireParticulier = ['Je suis un être à la recherche','Non pas de la vérité','Mais simplement d\'une aventure','Qui sorte un peu de la banalité','J\'en ai assez de ce carcan','Qui m\'enferme dans toutes ces règles','Ils me disent de rester dans la norme','Mais l\'on finit par s\'y ennuyer','Alors je cherche et je trouverai','Cette fille qui me manque tant','Alors je cherche et je trouverai','Cette fille qui me tente tant','Qui me tente tant','Partenaire particulier','Cherche partenaire particulière','Débloquée, pas trop timide','Et une bonne dose de savoir-faire','Savoir-faire','Vous comprendrez que de tels péchés','Parfois sont difficiles à avouer','Ils sont autour de moi si coincés','Ce n\'est pas parmi eux que je trouverai','Je dois trouver de nouveaux horizons','Mais je finis parfois par tourner en rond','Alors je cherche et je trouverai','Cette fille qui me manque tant','Alors je cherche et je trouverai','Cette fille qui me tente tant','Qui me tente tant','Partenaire particulier','Cherche partenaire particulière','Débloquée, pas trop timide','Et une bonne dose de savoir-faire','Savoir-faire','Alors je cherche et je trouverai','Cette fille qui me manque tant','Alors je cherche et je trouverai','Cette fille qui me tente tant','Alors je cherche et je trouverai','Cette fille qui me manque tant','Alors je cherche et je trouverai','Cette fille qui me tente tant','Me tente tant','Partenaire particulier','Cherche partenaire particulière','Débloquée, pas trop timide','Et une bonne dose de savoir-faire','Savoir-faire','Partenaire particulier','Cherche partenaire particulière','Débloquée, pas trop timide','Et une bonne dose de savoir-faire','Partenaire particulier','Cherche partenaire particulière','Débloquée, pas trop timide','Et une bonne dose de savoir-faire','Partenaire particulier','Cherche partenaire particulière','Débloquée, pas trop timide','Et une bonne dose de savoir-faire','Partenaire particulier','Cherche partenaire particulière'];

global NuitDeFolie = ['Y’a pas de saison pour que vive la musique au fond','Pas de saison pour que vive le son','En marchant tu donnes une cadence à tes pas','Tu sens la musique au bout de tes doigts','Tu dis que la vie qu\'on t\'a donnée est faite pour ça','Tant de choses grâce au son tu connaîtras','Ton cœur est un saphir de pick-up','On a trouvé des décibels dans ton check-up','Et tu chantes, chantes, chantes ce refrain qui te plaît','Et tu tapes, tapes, tapes, c\'est ta façon d\'aimer','Ce rythme qui t\'entraîne jusqu\'au bout de la nuit','Réveille en toi le tourbillon d\'un vent de folie','Et tu chantes, chantes, chantes ce refrain qui te plaît','Et tu tapes, tapes, tapes, c\'est ta façon d\'aimer','Ce rythme qui t\'entraîne jusqu\'au bout de la nuit','Réveille en toi le tourbillon d\'un vent de folie','Tu danses le monde, musique américaine','La cadence du funk au plus haut t\'emmène','Le tempo en délire, si ce soir il fait chaud','C\'est qu\'on monte nos mains vers le point le plus haut','Et tu chantes, chantes, chantes ce refrain qui te plaît','Et tu tapes, tapes, tapes, c\'est ta façon d\'aimer','Ce rythme qui t\'entraîne jusqu\'au bout de la nuit','Réveille en toi le tourbillon d\'un vent de folie','Et tu chantes, chantes, chantes ce refrain qui te plaît','Et tu tapes, tapes, tapes, c\'est ta façon d\'aimer','Ce rythme qui t\'entraîne jusqu\'au bout de la nuit','Réveille en toi le tourbillon d\'un vent de folie','Toi qui dessines au fond de ton ennui les notes d\'une mélodie','Une musique sans accords majeurs c\'est une piste sans danseurs','Mais si tu ranges dans ces moments-là dans un placard tes idées noires','Les notes pourront se danser et nous reviendrons les chanter','Quand le sucre est tombé, choqué, le café renversé','Je sentais bien que la journée était mal commencée','Plus tard la caisse était cassée avant que craquent les chromes','Mettant la gomme j\'avais détalé','La musique était mon sourire, les vieux succès mes souvenirs, on sort tous son dernier soupir','Lorsqu\'on va mourir','Mais un souffle j\'avais gardé car on ne peut pas trépasser, chacun le sait','Sans voir un disc jockey','Et tu chantes, danses jusqu\'au bout de la nuit','Tes flashes en musique funky','Y’a la basse qui frappe et la guitare qui choque','Et y’a le batteur qui s\'éclate et toi qui tiens le choc','Et tu chantes, chantes, chantes ce refrain qui te plaît','Et tu tapes, tapes, tapes, c\'est ta façon d\'aimer','Ce rythme qui t\'entraîne jusqu\'au bout de la nuit','Réveille en toi le tourbillon d\'un vent de folie','Et tu chantes, chantes, chantes ce refrain qui te plaît','Et tu tapes, tapes, tapes, c\'est ta façon d\'aimer','Ce rythme qui t\'entraîne jusqu\'au bout de la nuit','Réveille en toi le tourbillon d\'un vent de folie','Et tu chantes, chantes, chantes ce refrain qui te plaît','Et tu tapes, tapes, tapes, c\'est ta façon d\'aimer','Ce rythme qui t\'entraîne jusqu\'au bout de la nuit','Réveille en toi le tourbillon d\'un vent de folie','Et tu chantes, chantes, chantes ce refrain qui te plaît','Et tu tapes, tapes, tapes, c\'est ta façon d\'aimer'];

global BarbieGirl = ['I\'m a Barbie girl in a Barbie world','Life in plastic, it\'s fantastic','You can brush my hair, undress me everywhere','Imagination, life is your creation','Come on Barbie, let\'s go party!','I\'m a Barbie girl in a Barbie world','Life in plastic, it\'s fantastic','You can brush my hair, undress me everywhere','Imagination, life is your creation','I\'m a blond, bimbo girl, in a fantasy world','Dress me up, make me talk, I\'m your dollie','You\'re my doll, rock\'n\'roll, feel the glamour and pain','Kiss me here, touch me there, hanky panky','You can touch, you can play','If you say, I\'m always yours, oohoh','I\'m a Barbie girl in a Barbie world','Life in plastic, it\'s fantastic','You can brush my hair, undress me everywhere','Imagination, life is your creation','Come on Barbie, let\'s go party!','Ah ah ah yeah','Come on Barbie, let\'s go party!','Ooh woa, ooh woa','Come on Barbie, let\'s go party!','Ah ah ah yeah','Come on Barbie, let\'s go party!','Ooh woa, ooh woa','Make me walk, make me talk, do whatever you please','I can act like a star, I can beg on my knees','Come jump in, bimbo friend, let us do it again','Hit the town, fool around, let\'s go party','You can touch, you can play,','if you say, I\'m always yours,','You can touch, you can play,','if you say, I\'m always yours,','Come on Barbie, let\'s go party!','Ah ah ah yeah','Come on Barbie, let\'s go party!','Ooh woa, ooh woa','Come on Barbie, let\'s go party!','Ah ah ah yeah','Come on Barbie, let\'s go party!','Ooh woa, ooh woa','I\'m a Barbie girl in a Barbie world','Life in plastic, it\'s fantastic','You can brush my hair, undress me everywhere','Imagination, life is your creation','I\'m a Barbie girl in a Barbie world','Life in plastic, it\'s fantastic','You can brush my hair, undress me everywhere','Imagination, life is your creation','Come on Barbie, let\'s go party!','Ah ah ah yeah','Come on Barbie, let\'s go party!','Ooh woa, ooh woa','Come on Barbie, let\'s go party!','Ah ah ah yeah','Come on Barbie, let\'s go party!','Ooh woa, ooh woa'];

global SevenDeadlySins = ['Wow oh oh oh oh oh','The pain and the pleasure　All come together','There is no reason why','Wow oh oh oh oh oh','The pain and the pleasure　All come together','There\'s no reason why','I got my demons　They don\'t know','I\'m fierce enough to let them go','It\'s like a fire　A stranglehold','I wish I was invincible','Hello desire　Your my old friend','But I don\'t need you here again','Just take a walk　Go back inside','I\'ll see you on the other side','samayoi tou mono mo tomadoi kou mono mo','subete no tsumi o koe','Wow oh oh oh oh oh','The pain and the pleasure　All come together','There is no reason why','Wow oh oh oh oh oh','The pain and the pleasure　All come together','There\'s no reason why','I get the feeling down below','It\'s coming back to take control','It\'s like a fire　A stranglehold','I feel like I\'m a criminal','One　criminal','Two　animal','Three　typical','Four　breakable','Five　I can\'t fight it','Six　I can\'t fight it','Seven　I can\'t fight it','So I hide it','People falling into the seven deadly sins','samayoi tsuzuke tadoritsuita','hikari o motome negai yo kanae','arayuru tsumi o koete','Wow oh oh oh oh oh','Wow oh oh oh oh oh','The pain and the pleasure　All come together','Wow oh oh oh oh oh','There\'s no reason　There\'s no reason','That\'s the reason why','Wow oh oh oh oh oh','The pain and the pleasure　All come together','There\'s no reason why'];

global listeChanson = [viceEtVersa, LaTribuDeDana, TakeMeToChurch, leLoupEtLeChien, Starlight, BoulevardOfBrokenDreams, EtatDAmour, LaReineDesNeiges, wolfInSheepsClothing, JeCodeAvecLeQ, LesBetises, LesSardines, LesLacsDuConnemara, LesDemonsDeMinuit, PartenaireParticulier, NuitDeFolie, ACDCthunderstruck, BarbieGirl, ACDCTnT, SevenDeadlySins]; // Puis la rajouter ici . y a quelq'un ?

global CHANSON_SYNCHRO; // CHANSON_SYNCHRO = [chanson, vers]
function sychroChanson() {
	var sychro = listeMessages["CHANSON"][0][0];
	if (sychro === null and CHANSON_SYNCHRO === null) {
		CHANSON_SYNCHRO = [randInt(0, count(listeChanson)), 0];
		sendReallyAll(MESSAGE_CUSTOM, ["CHANSON", CHANSON_SYNCHRO]);
	}
	else if (sychro !== null) {
		CHANSON_SYNCHRO = sychro;
	}
}
sychroChanson();

/********************** Pipotron (fonctions) *********************************/

function pipotronWizard(){  // Fonction qui renvoie une phrase aléatoire
    var sujets = ["Le chien","La voiture","René Cotty","L'épave du Titanic","Un pauvre champignon","La reine des neiges","Mon prof d'Histoire","Mr le President","Une grand-mère","Un sac de patates","le repas de ce midi","Le chat du voisin","Un petit poisson rouge"];
    var adjectifs_1 = ["qui passait par là","de ma voisine","enragé","sur le point de mourrir","dans un taxi","au bord d'un lac","perdu dans la forêt","coincé entre deux gros types","plus poilu que jamais","qui nageait dans l'ocean","trempé de sueur","en promotion","dans un hélicoptère","à cheval sur un balais","admirant son reflet dans un mirroir","encore dans l'enfance","plus content que jamais"];
    var verbes = ["mange","dort sur","observe","dérobe","rentre dans","embrasse","possède","propose","conserve","exécute","joue avec","utilise","vomit","programme","danse sur","glisse sur","s'amuse avec","patauge dans","dessine"];
    var noms = ["un jeu","des anguilles","l'aéroglisseur","son nez","des chaussures","une farce","un bon sandwich","la poule du voisin","de la volaille","ma prof d'anglais","un crayon","un innocent poireau","un plat de lasagnes","la noix de coco","Donald Trump","un groupe de coqs"];
    var ccs = ["dans une cave","pour rire","afin de dormir","tous les matins","chaque nuit","sur le trottoir","dans un parc","raisonnable","sous terre","pour se distraire","pour le fun","dans un sous-marin nucléaire","à ski"];
    var sujet = sujets[randInt(0,count(sujets))];   // Choix du sujet
    var adjectif_1 = adjectifs_1[randInt(0,count(adjectifs_1))];   // Choix de l'adjectif / complément 1
    var verbe = verbes[randInt(0,count(verbes))];   // Choix du verbe
    var nom = noms[randInt(0,count(noms))];   // Choix du nom / groupe nominal
    var cc = ccs[randInt(0,count(ccs))];   // Choix du complément 2
    var phrase = sujet+" "+adjectif_1+" "+verbe+" "+nom+" "+cc+".";
    return phrase;
}

//======================================================================================================\\
// Pipotron Rayman
// Pipotron
global keys = [
"mas",
"fem",
"Tit"
];

global Nom = [
'mas' :["Zeus",
		"Poseidon",
		"Hades",
	"Appolon",
	"Dyonisos",
	"Hephaïstos",
	"Ares",
	"Hermes",
	"Ra",
	"Seth",
	"Ptah",
	"Anubis",
	"Horus",
	"Thot",
	"Osiris",
	"Thor",
	"Odin",
	"Loki",
	"Heimdall",
	"Foreste",
	"Bragi",
	"Njord",
	"Baldr",
	"Tyr",],
'fem' : ["Hera",
	"Athena",
	"Artémis",
	"Aphrodite"
	"Hestia",
	"Isis",
	"Bastet",
	"Hathor",
	"Nephtys",
	"Sekhmet"
	"Serket",
	"Freyja"
	"Skadi",
	"Hel",
	],
'Tit' : ["Ouranos",
	"Cronos",
	"Ocean",
	"Prométhée",
	"Hyperion",
	"Helios",
	"Atlas",
	"Rhea"
	"Theia",
	"Gaia",
	"Leto",
	"Hecate"
	]
];

global genre = [
'mas' : ["Dieu"],
'fem' : ["Déesse"],
'Tit' : ["Titan"]
];

global fonction = [
"roi des Dieux",
"reine des Dieux"
"de la mer",
"des enfers",
"de la famille et du mariage",
"de la sagesse et de la guerre",
"du soleil",
"de la lune et de la chasse",
"du vin et des fetes",
"des forges",
"de la guerre",
"des messagers et des voleurs",
"de la beauté et de l'amour",
"du foyer",
"de la magie",
"des ténèbres",
"de la protection et des chats",
"de la création",
"du jugement et des morts",
"du ciel, de l'amour' et de la fertilité",
"de la nuit et de la mort",
"de la guerre et du désert",
"des scorpions",
"de la vengeance",
"de la sagesse",
"du jugement",
"du tonnerre",
"souverain d'Asgard",
"souveraine d'Asgard",
"du mal et de la tromperie",
"de la beauté",
"Seigneur du ciel",
"Seigneur de la terre",
"gardien d'Asgard",
"de la justice",
"de la poésie et des scaldes",
"de la mer et des orages",
"de l'hiver et de la chasse",
"roi des titans",
"de la prévoyance",
"de la maternité",
"de la vue et de la lumière",
"de la fertilité",
"de la vision de l'observation et de la lumiere",
"du courage",
];

function random(array) {
	return array[randInt(0, count(array))];
}

function pipotronRayman() {
	var key = random(keys);
	var nom = random(Nom[key]);
	var personne = random(genre[key]);
	var Fonction = random(fonction);
	var phrase = "Vive " + nom + ", " + personne + " " + Fonction;
	return phrase;
}
