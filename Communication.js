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

include("Debug");

global listeMessages; // Liste des messages reçus depuis 1 tour
listeMessages = recevoir();

global chefDeMeute = -1; // Numéro du chef de meute (comme getLeek();)
function poireauAlpha() { // A modifier : faire le cas d'une résu pendant le tour
	if (not isAlive(chefDeMeute)) {
		chefDeMeute = getAliveAllies()[0];
		debugP("Chef de meute -> " + getName(chefDeMeute));
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
global Birds = ['Two hearts, one valve','Pumpin\' the blood, we were the flood','We were the body and','Two lives, one life','Stickin\' it out, lettin\' you down','Makin\' it right','Seasons, they will change','Life will make you grow','Dreams will make you cry, cry, cry','Everything is temporary','Everything will slide','Love will never die, die, die','I know that ooh, birds fly in different directions','Ooh, I hope to see you again','Sunsets, sunrises','Livin\' the dream, watchin\' the leaves','Changin\' the seasons','Some nights I think of you','Relivin\' the past, wishin\' it\'d last','Wishin\' and dreamin\' ','Seasons, they will change','Life will make you grow','Death can make you hard, hard, hard','Everything is temporary','Everything will slide','Love will never die, die, die','I know that ooh, birds fly in different directions','Ooh, I hope to see you again','Ooh, birds fly in every direction','Ooh, so fly high, so fly high','When the moon is lookin\' down','Shinin\' light upon your ground','I\'m flyin\' up to let you see','That the shadow cast is me','I know that ooh, birds fly in different directions','Ooh, I hope to see you again','Ooh, birds fly in different directions','Ooh, so fly high, so fly high','Ooh, so fly high, so fly high','Ooh, so fly high, so fly high'];

global ItsTime = ['So, this is what you meant ?','When you said that you were spent','And now it\'s time to build from the bottom of the pit','Right to the top','Don\'t hold back','Packing my bags and giving the academy a rain check','I don\'t ever wanna let you down','I don\'t ever wanna leave this town','\'Cause after all','This city never sleeps at night','It\'s time to begin, isn\'t it ?','I get a little bit bigger, but then I\'ll admit','I\'m just the same as I was','Now don\'t you understand','That I\'m never changing who I am','So this is where you fell','And I am left to sell','The path to heaven runs through miles of clouded hell','Right to the top','Don\'t look back','Turning to rags and giving the commodities a rain check','I don\'t ever wanna let you down','I don\'t ever wanna leave this town','\'Cause after all','This city never sleeps at night','It\'s time to begin, isn\'t it?','I get a little bit bigger, but then I\'ll admit','I\'m just the same as I was','Now don\'t you understand','That I\'m never changing who I am','It\'s time to begin, isn\'t it?','I get a little bit bigger, but then I\'ll admit','I\'m just the same as I was','Now don\'t you understand','That I\'m never changing who I am','This road never looked so lonely','This house doesn\'t burn down slowly','To ashes, to ashes','It\'s time to begin, isn\'t it?','I get a little bit bigger, but then I\'ll admit','I\'m just the same as I was','Now don\'t you understand','That I\'m never changing who I am','It\'s time to begin, isn\'t it ?','I get a little bit bigger, but then I\'ll admit','I\'m just the same as I was','Now don\'t you understand','That I\'m never changing who I am'];

global WhateverItTakes = ['Falling too fast to prepare for this','Tripping in the world could be dangerous','Everybody circling, it\'s vulturous','Negative, nepotist','Everybody waiting for the fall of man','Everybody praying for the end of times','Everybody hoping they could be the one','I was born to run, I was born for this','Whip, whip','Run me like a racehorse','Pull me like a ripcord','Break me down and build me up','I wanna be the slip, slip','Word upon your lip, lip','Letter that you rip, rip','Break me down and build me up','Whatever it takes','\'Cause I love the adrenaline in my veins','I do whatever it takes','\'Cause I love how it feels when I break the chains','Whatever it takes','Yeah, take me to the top I\'m ready for','Whatever it takes','\'Cause I love the adrenaline in my veins','I do what it takes','Always had a fear of being typical','Looking at my body feeling miserable','Always hanging on to the visual','I wanna be invisible','Looking at my years like a martyrdom','Everybody needs to be a part of \'em','Never be enough, I\'m the prodigal son','I was born to run, I was born for this','Whip, whip','Run me like a racehorse','Pull me like a ripcord','Break me down and build me up','I wanna be the slip, slip','Word upon your lip, lip','Letter that you rip, rip','Break me down and build me up','Whatever it takes','\'Cause I love the adrenaline in my veins','I do whatever it takes','\'Cause I love how it feels when I break the chains','Whatever it takes','Yeah, take me to the top, I\'m ready for','Whatever it takes','\'Cause I love the adrenaline in my veins','I do what it takes','Hypocritical, egotistical','Don\'t wanna be the parenthetical, hypothetical','Working onto something that I\'m proud of, out of the box','An epoxy to the world and the vision we\'ve lost','I\'m an apostrophe','I\'m just a symbol to remind you that there\'s more to see','I\'m just a product of the system, a catastrophe','And yet a masterpiece, and yet I\'m half-diseased','And when I am deceased','At least I go down to the grave and die happily','Leave the body and my soul to be a part of thee','I do what it takes','Whatever it takes','\'Cause I love the adrenaline in my veins','I do whatever it takes','\'Cause I love how it feels when I break the chains','Whatever it takes','Yeah, take me to the top, I\'m ready for','Whatever it takes','\'Cause I love the adrenaline in my veins','I do what it takes'];

global IBetMyLife = ['I know I took the path that you would never want for me','I know I let you down, didn\'t I ?','So many sleepless nights where you were waiting up on me','Well I\'m just a slave unto the night','Now remember when I told you that\'s the last you\'ll see of me','Remember when I broke you down to tears','I know I took the path that you would never want for me','I gave you hell through all the years','So I, I bet my life, I bet my life','I bet my life for you','I, I bet my life, I bet my life','I bet my life for you','I\'ve been around the world and never in my wildest dreams','Would I come running home to you','I\'ve told a million lies but now I tell a single truth','There\'s you in everything I do','Now remember when I told you that\'s the last you\'ll see of me','Remember when I broke you down to tears','I know I took the path that you would never want for me','I gave you hell through all the years','So I, I bet my life, I bet my life','I bet my life for you','I, I bet my life, I bet my life','I bet my life for you','Don\'t tell me that I\'m wrong','I\'ve walked that road before','And left you on your own','And please believe them when they say','That it\'s left for yesterday','And the records that I\'ve played','Please forgive me for all I\'ve done','So I, I bet my life, I bet my life','I bet my life for you','I, I bet my life, I bet my life','I bet my life for you'];

global BadLiar = ['Oh, hush, my dear, it\'s been a difficult year','And terrors don\'t prey on','Innocent victims','Trust me, darling, trust me darling','It\'s been a loveless year','I\'m a man of three fears','Integrity, faith and','Crocodile tears','Trust me, darling, trust me, darling','So look me in the eyes','Tell me what you see','Perfect paradise','Tearing at the seams','I wish I could escape','I don\'t wanna fake it','Wish I could erase it','Make your heart believe','But I\'m a bad liar, bad liar','Now you know, now you know','I\'m a bad liar, bad liar','Now you know, you\'re free to go (go)','Did all my dreams never mean one thing?','Does happiness lie in a diamond ring?','Oh, I\'ve been askin\'','Oh, I\'ve been askin\' for problems, problems, problems','I wage my war, on the world inside','I take my gun to the enemy\'s side','Oh, I\'ve been askin\' for (trust me, darling)','Oh, I\'ve been askin\' for (trust me, darling)','Problems, problems, problems','So look me in the eyes','Tell me what you see','Perfect paradise','Tearing at the seams','I wish I could escape','I don\'t wanna fake it','Wish I could erase it','Make your heart believe','But I\'m a bad liar, bad liar','Now you know, now you know','That I\'m a bad liar, bad liar','Now you know, you\'re free to go','I can\'t breathe, I can\'t be','I can\'t be what you want me to be','Believe me, this one time','Believe me','I\'m a bad liar, bad liar','Now you know, now you know','That I\'m a bad liar, bad liar','Now you know, you\'re free to go','Please believe me, please believe me'];

global Demons = ['When the days are cold and the cards all fold','And the saints we see are all made of gold','When your dreams all fail and the ones we hail','Are the worst of all and the blood\'s run stale','I want to hide the truth, I want to shelter you','But with the beast inside, there\'s nowhere we can hide','No matter what we breed, we still are made of greed','This is my kingdom come, this is my kingdom come','When you feel my heat, look into my eyes','It\'s where my demons hide, it\'s where my demons hide','Don\'t get too close, it\'s dark inside','It\'s where my demons hide, it\'s where my demons hide','At the curtain\'s call is the last of all','When the lights fade out, all the sinners crawl','So they dug your grave and the masquerade','Will come calling out at the mess you\'ve made','Don\'t want to let you down, but I am hell bound','Though this is all for you, don\'t want to hide the truth','No matter what we breed, we still are made of greed','This is my kingdom come, this is my kingdom come','When you feel my heat, look into my eyes','It\'s where my demons hide, it\'s where my demons hide','Don\'t get too close, it\'s dark inside','It\'s where my demons hide, it\'s where my demons hide','They say it\'s what you make, I say it\'s up to fate','It\'s woven in my soul, I need to let you go','Your eyes, they shine so bright, I want to save that light','I can\'t escape this now, unless you show me how','When you feel my heat, look into my eyes','It\'s where my demons hide, it\'s where my demons hide','Don\'t get too close, it\'s dark inside','It\'s where my demons hide, it\'s where my demons hide'];

global SomethingHuman = ['My circuits have blown','I know it\'s self-imposed','And all I have shared, and all I have loved','Is all I\'ll ever own','But something has changed','I feel so alive','My life just blew up, I\'d give it all up','I\'ll depressurize','Oh, oh, oh, ten thousand miles left on the road','Oh, oh, oh, five hundred hours \'til I am home','I need something human, human','Human, human','Let\'s face all our fears','Come out of the shade','Let\'s burn all the money, absolve all the lies','And wake up unscathed','The big picture\'s gone','Replaced with visions of you','Now life can begin, I\'ve cleansed all my sins','I\'m about to break through','Oh, oh, oh, five thousand miles left on the road','Oh, oh, oh, two hundred hours \'til I am home','I need something human, human','Human, human','And I need the touch','And something human, human','Oh, oh, oh, less than a mile left on the road','Oh, oh, oh, I will be crawling though your door','I need something human, human','Human, human','And I need your love','And something human, human'];

global Invincible = ['Follow through','Make your dreams come true','Don\'t give up the fight','You will be alright','\'Cause there\'s no one like you in the universe','Don\'t be afraid','What your mind conceives','You should make a stand','Stand up for what you believe','And tonight','We can truly say','Together we\'re invincible','During the struggle','They will pull us down','But please, please','Let\'s use this chance','To turn things around','And tonight','We can truly say','Together we\'re invincible','Do it on your own','It makes no difference to me','What you leave behind','What you choose to be','And whatever they say','Your soul\'s unbreakable','During the struggle','They will pull us down','But please, please','Let\'s use this chance','To turn things around','And tonight','We can truly say','Together we\'re invincible','Together we\'re invincible','During the struggle','They will pull us down','Please, please','Let\'s use this chance','To turn things around','And tonight','We can truly say','Together we\'re invincible','Together we\'re invincible'];

global TimeIsRunningOut = ['I think I\'m drowning','Asphyxiated','I wanna break this spell','That you\'ve created','You\'re something beautiful','A contradiction','I wanna play the game','I want the friction','You will be the death of me','You will be the death of me','Bury it','I won\'t let you bury it','I won\'t let you smother it','I won\'t let you murder it','Our time is running out','Our time is running out','You can\'t push it underground','You can\'t stop it screaming out','I wanted freedom','Bound and restricted','I tried to give you up','But I\'m addicted','Now that you know I\'m trapped sense of elation','You\'d never dream of','Breaking this fixation','You will squeeze the life out of me','Bury it','I won\'t let you bury it','I won\'t let you smother it','I won\'t let you murder it','Our time is running out','Our time is running out','You can\'t push it underground','You can\'t stop it screaming out','How did it come to this?','Oh Oh Oh Yeah yeah yeah yeah yeh','Oh Oh Oh Yeah yeah yeah yeah yeh','Oh Oh Oh Yeah yeah yeah yeah yeh','You will suck the life out of me','Bury it','I won\'t let you bury it','I won\'t let you smother it','I won\'t let you murder it','Our time is running out','Our time is running out','You can\'t push it underground','You can\'t stop it screaming out','How did it come to this ?','Oh Oh Oh Yeah yeah yeah yeah yeh','Oh Oh Oh Yeah yeah yeah yeah yeh','Oh Oh Oh Yeah yeah yeah yeah yeh'];

global SingForAbsolution = ['Lips are turning blue','A kiss that can\'t renew','I only dream of you','My beautiful','Tip toe to your room','A starlight in the gloom','I only dream of you','And you never knew','Sing for absolution','I will be singing','And falling from your grace','Ooh','There\'s nowhere left to hide','In no one to confide','The truth burns deep inside','And will never die','Lips are turning blue','A kiss that can\'t renew','I only dream of you','My beautiful','Sing for absolution','I will be singing','Falling from your grace','Sing for absolution','I will be singing','Falling from your grace','Yeah','Our wrongs remain unrectified','And our souls won\'t be exhumed'];

global Uprising = ['The paranoia is in bloom','The P.R. transmissions will resume','They\'ll try to push drugs, keep us all dumbed down','And hope that we will never see the truth around','Another promise, another scene, another','Packaged lie to keep us trapped in greed with all the','Green belts wrapped around our minds and endless','Red tape to keep the truth confined, so come on','They will not force us','They will stop degrading us','They will not control us','We will be victorious','Interchanging mind control','Come let the revolution take its toll','If you could flick a switch and open your third eye','You\'d see that we should never be afraid to die','Rise up and take the power back','It\'s time the fat cats had a heart attack','You know that their time is coming to an end','We have to unify and watch our flag ascend','They will not force us','They will stop degrading us','They will not control us','We will be victorious','Hey, hey, hey, hey','Hey, hey, hey, hey','Hey, hey, hey, hey','They will not force us','They will stop degrading us','They will not control us','We will be victorious','Hey, hey, hey, hey'];

global Unintended = ['You could be my unintended','Choice to live my life extended','You could be the one I\'ll always love','You could be the one who listens','To my deepest inquisitions','You could be the one I\'ll always love','I\'ll be there as soon as I can','But I\'m busy mending broken','Pieces of the life I had before','First there was the one who challenged','All my dreams and all my balance','She could never be as good as you','You could be my unintended','Choice to live my life extended','You should be the one I\'ll always love','I\'ll be there as soon as I can','But I\'m busy mending broken','Pieces of the life I had before','I\'ll be there as soon as I can','But I\'m busy mending broken','Pieces of the life I had before','Before you'];

global viceEtVersa = ['L\'hémorragie de tes désirs', 'S\'est éclipsée sous l\'azur bleu dérisoire', 'Du temps qui se passe', 'Contre duquel on ne peut rien', 'Être ou ne pas être', 'Telle est la question sinusoïdale', 'De l\'anachorète hypocondriaque', 'Mais tu dis (mais tu dis)', 'Que le bonheur est irréductible', 'Et je dis (et il dit)', 'Que ton espoir n\'est pas si désespéré', 'A condition d\'analyser', 'Que l\'absolu ne doit pas être annihilé', 'Par l\'illusoire précarité', 'De nos amours', 'Destituées', 'Et vice et versa', 'Il faut que tu arriveras', 'A laminer tes rancœurs dialectiques', 'Même si je suis con...', '... vaincu que c\'est très difficile', 'Mais comme moi, dis-toi', 'Qu\'il est tellement plus mieux', 'D\'éradiquer les tentacules de la déréliction', 'Et tout deviendra clair', 'Mais tu dis (mais tu dis)', 'Que le bonheur est irréductible', 'Et je dis (et il dit)', 'Que ton espoir n\'est pas si désespéré', 'A condition d\'analyser', 'Que l\'absolu ne doit pas être annihilé', 'Par l\'illusoire précarité', 'De nos amours', 'Destituées', 'Et vice et versa', 'D\'où venons nous ?', 'Où allons nous ?', 'J\'ignore de le savoir', 'Mais ce que je n\'ignore pas de le savoir', 'C\'est que le bonheur', 'Est à deux doigts de tes pieds', 'Et que la simplicité réside dans l\'alcôve', 'Bleue, jaune, mauve et insoupçonnée', 'De nos rêveries', 'Mauves et bleues et jaunes et pourpres', 'Et paraboliques', 'Et vice et versa', 'Mais tu dis (mais tu dis)', 'Que le bonheur est irréductible', 'Et je dis (et il dit)', 'Que ton espoir n\'est pas si désespéré', 'A condition d\'analyser', 'Que l\'absolu ne doit pas être annihilé', 'Par l\'illusoire précarité', 'De nos amours', 'Et qu\'il ne faut pas cautionner l\'irréalité', 'Sous des aspérités absentes et désenchantées', 'De nos pensées iconoclastes et désoxydées', 'Par nos désirs excommuniés de la fatalité', 'Destituée', 'Et vice et versa'];

global LaTribuDeDana = ['Le vent souffle sur les plaines de la Bretagne armoricaine,', 'je jette un dernier regard sur ma femme, mon fils et mon domaine.', 'Akim, le fils du forgeron est venu me chercher,','Les druides ont décidé de mener le combat dans la vallée.','Là, où tous nos ancêtres,','de géants guerriers celtes', 'après de grandes batailles, se sont imposés en maîtres,', 'c\'est l\'heure maintenant de défendre notre terre,','contre une armée de Simériens prête à croiser le fer.', 'Toute la tribu s\'est réunie autour de grands menhirs,','pour invoquer les dieux afin qu\'ils puissent nous bénir.','Après cette prière avec mes frères sans faire état de zèle,', 'les chefs nous ont donné à tous des gorgées d\'hydromel,','Pour le courage, pour pas qu\'il y ait de faille,','pour rester grands et fiers quand nous serons dans la bataille','car c\'est la première fois pour moi que je pars au combat,','et j\'espère être digne de la tribu de Dana.', 'Dans la vallée ohoh de Dana lalilala.', 'Dans la vallée j\'ai pu entendre les échos.', 'Dans la vallée ohoh de Dana lalilala.','Dans la vallée des chants de guerre près des tombeaux.','Après quelques incantations de druides et de magie,','toute la tribu, le glaive en main courait vers l\'ennemi,','la lutte était terrible et je ne voyais que les ombres,', 'tranchant l\'ennemi qui revenait toujours en surnombre.','Mes frères tombaient l\'un après l\'autre devant mon regard,','sous le poids des armes que possédaient tous ces barbares,','des lances, des haches et des épées dans le jardin d\'Eden','qui écoulait du sang sur l\'herbe verte de la plaine.', 'Comme ces jours de peine, où l\'homme se traîne','à la limite du règne du mal et de la haine,','fallait-il continuer ce combat déjà perdu,','mais telle était la fierté de toute la tribu,', 'la lutte a continué comme ça jusqu\'au soleil couchant,','de férocité extrême en plus d\'acharnement,','fallait défendre la terre de nos ancêtres enterrés là,','et pour toutes les lois de la tribu de Dana.','Dans la vallée ohoh de Dana lalilala.','Dans la vallée j\'ai pu entendre les échos.','Dans la vallée ohoh de Dana lalilala.','Dans la vallée des chants de guerre près des tombeaux.','Au bout de la vallée on entendait le son d\'une corne,','d\'un chef ennemi qui appelait toute sa horde,','avait-il compris qu\'on lutterait même en enfer','et qu\'à la tribu de Dana appartenaient ces terres ?','Les guerriers repartaient, je ne comprenais pas','tout le chemin qu\'ils avaient fait pour en arriver là,','quand mon regard se posa tout autour de moi,','j\'étais le seul debout de la tribu voilà pourquoi.','Mes doigts se sont écartés tout en lâchant mes armes','et le long de mes joues se sont mises à couler des larmes,','je n\'ai jamais compris pourquoi les dieux m\'ont épargné', 'de ce jour noir de notre histoire que j\'ai conté.','Le vent souffle toujours sur la Bretagne armoricaine','et j\'ai rejoins ma femme, mon fils et mon domaine,','j\'ai tout reconstruit de mes mains pour en arriver là,','je suis devenu roi de la tribu de Dana.','Dans la vallée ohoh de Dana lalilala.','Dans la vallée j\'ai pu entendre les échos.','Dans la vallée ohoh de Dana lalilala.','Dans la vallée des chants de guerre près des tombeaux'];

global TakeMeToChurch = ['My lover\'s got humour', 'She\'s the giggle at a funeral','Knows everybody\'s disapproval','I should\'ve worshipped her sooner','If the Heavens ever did speak','She is the last true mouthpiece','Every Sunday\'s getting more bleak','A fresh poison each week','\'We were born sick, \' you heard them say it','My church offers no absolutes','She tells me \'worship in the bedroom\'','The only heaven I\'ll be sent to','Is when I\'m alone with you','I was born sick, but I love it','Command me to be well','Amen, Amen, Amen','Take me to church','I\'ll worship like a dog at the shrine of your lies','I\'ll tell you my sins and you can sharpen your knife','Offer me that deathless death','Good God, let me give you my life','Take me to church','I\'ll worship like a dog at the shrine of your lies','I\'ll tell you my sins and you can sharpen your knife','Offer me that deathless death','Good God, let me give you my life','If I\'m a pagan of the good times','My lover\'s the sunlight','To keep the Goddess on my side','She demands a sacrifice','To drain the whole sea','Get something shiny','Something meaty for the main course','That\'s a fine looking high horse','What you got in the stable?','We\'ve a lot of starving faithful','That looks tasty','That looks plenty','This is hungry work','Take me to church','I\'ll worship like a dog at the shrine of your lies','I\'ll tell you my sins and you can sharpen your knife','Offer me that deathless death','Good God, let me give you my life','Take me to church','I\'ll worship like a dog at the shrine of your lies','I\'ll tell you my sins and you can sharpen your knife','Offer me that deathless death','Good God, let me give you my life','No masters or kings when the ritual begins','There is no sweeter innocence than our gentle sin','In the madness and soil of that sad earthly scene','Only then I am human','Only then I am clean','Amen, Amen, Amen','Take me to church','I\'ll worship like a dog at the shrine of your lies','I\'ll tell you my sins and you can sharpen your knife','Offer me that deathless death','Good God, let me give you my life','Take me to church','I\'ll worship like a dog at the shrine of your lies','I\'ll tell you my sins and you can sharpen your knife','Offer me that deathless death','Good God, let me give you my life'];

global leLoupEtLeChien = ['Un Loup n\'avait que les os et la peau,', 'Tant les chiens faisaient bonne garde.', 'Ce Loup rencontre un Dogue aussi puissant que beau,', 'Gras, poli, qui s\'était fourvoyé par mégarde.', 'L\'attaquer, le mettre en quartiers,', 'Sire Loup l\'eût fait volontiers ;', 'Mais il fallait livrer bataille,', 'Et le Mâtin était de taille', 'A se défendre hardiment.', 'Le Loup donc l\'aborde humblement,', 'Entre en propos, et lui fait compliment', 'Sur son embonpoint, qu\'il admire.', '\' Il ne tiendra qu\'à vous beau sire,', 'D\'être aussi gras que moi, lui repartit le Chien.', 'Quittez les bois, vous ferez bien :', 'Vos pareils y sont misérables,', 'Cancres, haires, et pauvres diables,', 'Dont la condition est de mourir de faim.', 'Car quoi ? rien d\'assuré : point de franche lippée :', 'Tout à la pointe de l\'épée.', 'Suivez-moi : vous aurez un bien meilleur destin. \' ', 'Le Loup reprit : \'Que me faudra-t-il faire ?', '- Presque rien, dit le Chien, donner la chasse aux gens', 'Portants bâtons, et mendiants ;', 'Flatter ceux du logis, à son Maître complaire :', 'Moyennant quoi votre salaire', 'Sera force reliefs de toutes les façons :', 'Os de poulets, os de pigeons,', 'Sans parler de mainte caresse. \' ', 'Le Loup déjà se forge une félicité', 'Qui le fait pleurer de tendresse.', 'Chemin faisant, il vit le col du Chien pelé.', '\' Qu\'est-ce là ? lui dit-il. - Rien. - Quoi ? rien ? - Peu de chose.', '- Mais encor ? - Le collier dont je suis attaché', 'De ce que vous voyez est peut-être la cause.', '- Attaché ? dit le Loup : vous ne courez donc pas', 'Où vous voulez ? - Pas toujours ; mais qu\'importe ?', '- Il importe si bien, que de tous vos repas', 'Je ne veux en aucune sorte,', 'Et ne voudrais pas même à ce prix un trésor. \'', 'Cela dit, maître Loup s\'enfuit, et court encor.'];

global Starlight = ['Far away','The ship is taking me far away','Far away from the memories','Of the people who care if I live or die','The starlight','I will be chasing a starlight','Until the end of my life','I don\'t know if it\'s worth it anymore','Hold you in my arms','I just wanted to hold','You in my arms','My life','You electrify my life','Let\'s conspire to ignite','All the souls that would die just to feel alive','Now I\'ll never let you go','If you promised not to fade away','Never fade away','Our hopes and expectations','Black holes and revelations','Our hopes and expectations','Black holes and revelations','Hold you in my arms','I just wanted to hold','You in my arms','Far away','The ship is taking me far away','Far away from the memories','Of the people who care if I live or die','And I\'ll never let you go','If you promise not to fade away','Never fade away','Our hopes and expectations','Black holes and revelations','Our hopes and expectations','Black holes and revelations','Hold you in my arms','I just wanted to hold','You in my arms','I just wanted to hold'];

global BoulevardOfBrokenDreams = ['I walk a lonely road','The only one that I have ever known','Don\'t know where it goes','But it\'s only me, and I walk alone','I walk this empty street','On the boulevard of broken dreams','Where the city sleeps','And I\'m the only one, and I walk alone','I walk alone, I walk alone','I walk alone and I walk a','My shadow\'s the only one that walks beside me','My shallow heart\'s the only thing that\'s beating','Sometimes I wish someone out there will find me','Till then I walk alone','Ah ah ah ah ah','Ah ah ah ah ah','I\'m walking down the line','That divides me somewhere in my mind','On the border line of the edge','And where I walk alone','Read between the lines','What\'s fucked up and every thing\'s all right','Check my vital signs to know I\'m still alive','And I walk alone','I walk alone, I walk alone','I walk alone and I walk a','My shadow\'s the only one that walks beside me','My shallow heart\'s the only thing that\'s beating','Sometimes I wish someone out there will find me','Till then I walk alone','Ah ah ah ah ah','Ah ah ah ah ah','I walk alone, I walk a','I walk this empty street','On the boulevard of broken dreams','Where the city sleeps','And I\'m the only one, and I walk alone','My shadow\'s the only one that walks beside me','My shallow heart\'s the only thing that\'s beating','Sometimes I wish someone out there will find me','Till then I walk alone'];

global TwentyOneGuns = ['Do you know what\'s worth fighting for','When it\'s not worth dying for ?','Does it take your breath away','And you feel yourself suffocating ?','Does the pain weigh out the pride ?','And you look for a place to hide ?','Did someone break your heart inside ?','You\'re in ruins','One, twenty one guns','Lay down your arms','Give up the fight','One, twenty one guns','Throw up your arms into the sky','You and I','When you\'re at the end of the road','And you lost all sense of control','And your thoughts have taken their toll','When your mind breaks the spirit of your soul','Your faith walks on broken glass','And the hangover doesn\'t pass','Nothing\'s ever built to last','You\'re in ruins','One, twenty one guns','Lay down your arms','Give up the fight','One, twenty one guns','Throw up your arms into the sky','You and I','Did you try to live on your own','When you burned down the house and home ?','Did you stand too close to the fire ?','Like a liar looking for forgiveness from a stone','When it\'s time to live and let die','And you can\'t get another try','Something inside this heart has died','You\'re in ruins','One, twenty one guns','Lay down your arms','Give up the fight','One, twenty one guns','Throw up your arms into the sky','One, twenty one guns','Lay down your arms','Give up the fight','One, twenty one guns','Throw up your arms into the sky','You and I'];

global PutALittleLoveOnMe = ['We fight, we get high holding on to love','We came down \'cause there was nothing holding us','Is it wrong that I still wonder where you are ?','Is it wrong that I still don\'t know my heart ?','Are you all dressed up but with nowhere to go ?','Are your tears falling down when the lights are low ?','Another Friday night tryna put on a show','Do you hate the weekend \'cause nobody\'s calling ?','I\'ve still got so much love hidden beneath this skin','So darling','Put a little love on me','Put a little love on me','When the lights come up and there\'s no shadows dancing','I look around as my heart is collapsing','\'Cause you\'re the only one I need','To put a little love on me','We wrote and we wrote','\'Til there were no more words','We laughed and we cried','Until we saw our worst','Is it wrong that I still wonder where you are ?','Is it wrong that I still don\'t know my heart ?','Are you all dressed up but with nowhere to go ?','Are your tears falling down when the lights are low ?','Another Friday night tryna put on a show','Do you hate the weekend \'cause nobody\'s calling ?','I\'ve still got so much love hidden beneath this skin','Will someone','Put a little love on me, yeah','Put a little love on me','When the lights come up and there\'s no shadow\'s dancing','I look around as my heart is collapsing','\'Cause you\'re the only one I need','To put a little love on me','Last night I lay awake','Stuck on the things we say','And when I close my eyes, the first thing I hear you say is','Put a little love on me, yeah','Put a little love on me','When the lights come up, we\'re the only one\'s dancing','I look around and you\'re standing there asking','You say, you\'re the only one I need','So put your love on me','You\'re the only one I need','Put your love on me'];

global TooMuchToAsk = ['Waiting here for someone','Only yesterday we were on the run','You smile back at me and your face lit up the sun','Now I\'m waiting here for someone','And oh, love, do you feel this rough ?','Why\'s it only you I\'m thinking of ?','My shadow\'s dancing','Without you for the first time','My heart is hoping','You\'ll walk right in tonight','Tell me there are things that you regret','\'Cause if I\'m being honest I ain\'t over you yet','It\'s all I\'m asking','Is it too much to ask ?','Is it too much to ask ?','Someone\'s moving outside','The lights come on and down the drive','I forget you\'re not here when I close my eyes','Do you still think of me sometimes ?','And oh, love, watch the sun coming up','Don\'t it feel fucked up we\'re not in love ?','My shadow\'s dancing','Without you for the first time','My heart is hoping','You\'ll walk right in tonight','Tell me there are things that you regret','\'Cause if I\'m being honest I ain\'t over you yet','It\'s all I\'m asking','Is it too much to ask ?','My shadow\'s dancing','Without you for the first time','My heart is hoping','You\'ll walk right in tonight','Tell me there are things that you regret','\'Cause if I\'m being honest I ain\'t over you yet','My shadow\'s dancing','Without you for the first time','My heart is hoping','You\'ll walk right in tonight','Tell me there are things that you regret','\'Cause if I\'m being honest I ain\'t over you yet','It\'s all I\'m asking','Is it too much to ask ?','It\'s all I\'m asking','Is it too much to ask ?','It\'s all I\'m asking','Is it too much to ask ?'];

global BlackAndWhite = ['That first night we were standing at your door','Fumbling for your keys, then I kissed you','Ask me if I want to come inside','\'Cause we didn\'t want to end the night','Then you took my hand, and I followed you','Yeah, I see us in black and white','Crystal clear on a star lit night','In all your gorgeous colors','I promise that I\'ll love you for the rest of my life','See you standing in your dress','Swear in front of all our friends','There\'ll never be another','I promise that I\'ll love you for the rest of my life','Now, we\'re sitting here in your living room','Telling stories while we share a drink or two','And there\'s a vision I\'ve been holding in my mind','We\'re 65 and you ask','"When did I first know ?" I always knew','Yeah, I see us in black and white','Crystal clear on a star lit night','In all your gorgeous colors','I promise that I\'ll love you for the rest of my life','See you standing in your dress','Swear in front of all our friends','There\'ll never be another','I promise that I\'ll love you for the rest of my life','I want the world to witness','When we finally say I do','It\'s the way you love','I gotta give it back to you','I can\'t promise picket fences','Or sunny afternoons','But, at night when I close my eyes','I see us in black and white','Crystal clear on a star lit night','There\'ll never be another','I promise that I\'ll love ya','I see us in black and white','Crystal clear on a star lit night','In all your gorgeous colors','I promise that I\'ll love you for the rest of my life','See you standing in your dress','Swear in front of all our friends','There\'ll never be another','I promise that I\'ll love you for the rest of my life','There\'ll never be another','I promise that I\'ll love you for the rest of my life'];

global wolfInSheepsClothing = ['Ha-ha-ha, this is about you', 'Beware, beware, be skeptical', 'Of their smiles, their smiles of plated gold', 'Deceit so natural', 'But a wolf in sheep\'s clothing is more than a warning', 'Bah-bah-black sheep, have you any soul?', 'No sir, by the way, what the hell are morals?', 'Jack, be nimble, Jack, be quick', 'Jill\'s a little whore and her alibis are dirty tricks', 'So could you', 'Tell me how you\'re sleeping easy', 'How you\'re only thinking of yourself', 'Show me how you justify', 'Telling all your lies like second nature', 'Listen, mark my words: one day (one day)', 'You will pay, you will pay', 'Karma\'s gonna come collect your debt', 'Aware, aware, you stalk your prey', 'With criminal mentality', 'You sink your teeth into the people you depend on', 'Infecting everyone, you\'re quite the problem', 'Fee-fi-fo-fum, you better run and hide', 'I smell the blood of a petty little coward', 'Jack, be lethal, Jack, be slick', 'Jill will leave you lonely dying in a filthy ditch', 'So could you', 'Tell me how you\'re sleeping easy', 'How you\'re only thinking of yourself', 'Show me how you justify', 'Telling all your lies like second nature', 'Listen, mark my words: one day (one day)', 'You will pay, you will pay', 'Karma\'s gonna come collect your debt', 'Maybe you\'ll change', 'Abandon all your wicked ways', 'Make amends and start anew again', 'Maybe you\'ll see', 'All the wrongs you did to me', 'And start all over, start all over again', 'Who am I kidding?', 'Now, let\'s not get overzealous here', 'You\'ve always been a huge piece of shit', 'If I could kill you I would', 'But it\'s frowned upon in all fifty states', 'Having said that, burn in hell', '(Where are you, motherfucker? Ha ha!)', 'So tell me how you\'re sleeping easy', 'How you\'re only thinking of yourself', 'Show me how you justify', 'Telling all your lies like second nature', 'Listen, mark my words: one day (one day)', 'You will pay, you will pay', 'Karma\'s gonna come collect your debt', 'Karma\'s gonna come collect your debt,', '(She\'s a li—she\'s a li—she\'s a liar)', 'Karma\'s gonna come collect your debt.'];

global JeCodeAvecLeQ = ['Mon dernier ordi a claqué','Il buggait trop : j\'l\'ai balancé','J\'en ai racheté un y a trois jours','Depuis il fait qu\'se mettre à jour','Trop de programmes préinstallés !','Norton impossible à virer !','(C\'est tout la faute aux programmeurs !)','Séquestré dans mon p\'tit bureau','J\'me sens mourir dans mon cerveau','Y a plus d\'chauffage, c\'était trop cher','Ou c\'est retenu sur mon salaire','Ça menace de délocaliser...','Mes petits doigts tout gelés !','Alors !...','Je code avec le Q !','La la la la la la laa...','Si ça bug ou plante j\'men fous :','On m\'paye pas pour tester !','Je code avec le Q !','La la la la la la laa...','Même si le programme marche pas','Tu seras pas remboursé !','Tu seras pas remboursé...','(Ha ha ha...)','J\'ai la dernière console HD !','Elle lit pas les jeux du passé','Beaucoup trop d\'mises-à-jour système','\'Fin bon, pas grave, j\'poireaute quand-même...','Quoi, ils se sont fait pirater ?!','Mon compte bancaire va pas aimer !','(C\'est tout la faute aux développeurs !)','J\'avais besoin d\'aide supplémentaire','Alors on m\'a mis un stagiaire','Mais il fait rien que déconner !','C\'est pas ma responsabilité','Et moi j\'veux pas me faire virer !','J\'ai les mains complètement coupées !','Alors !...','Quatre barres en ville et ça marche pas','La 4G vaut pas mieux qu\'la 3...','J\'voulais réserver l\'TGV','Mais la session à expiré !','J\'vais sur Youtube pour me calmer','Et Flash a cessé de fonctionner !','(Oh oooh)','Nan mais vous savez','C\'était pas si dur de pirater le virtual market','Et de récupérer toutes les coordonnées bancaires','Faut savoir que c\'était vraiment, mais VRAIMENT codé avec le Q','J\'sais de quoi j\'parle : je fais partie de l\'équipe de développement','J\'négocie une augmentation','J\'demande à parler au patron','« Pars en Inde si t\'es pas content !','Faut que le p\'tit Kévin, 13 ans...»','Me révèle ce tyran cruel','«... Aie son Call Of avant Noël ! »','Alors...','Alors !...','Je code avec le Q !','La la la la la la laa...','Tout est toujours plus puissant','Mais de plus en plus lent !','Je code avec le Q !','La la la la la la laa...','Si ça bug ou plante j\'men fous','On continue d\'acheter !','On coooon... (On con...)','Eh oui, on coooon... (On con...)','On est trop coooon... ...tinue d\'acheter !','(Ha ha ha ha ha !)','C\'est la faute à ces ******** d\'******* de ******** de ***** !','Nan mais sérieux, ou quoi ?! Ils font chi€r avec leurs trucs, là','Ahh !','(La la la la la lala !)','Ce métier me rend fou...'];

global SevenDeadlySins = ['Wow oh oh oh oh oh','The pain and the pleasure　All come together','There is no reason why','Wow oh oh oh oh oh','The pain and the pleasure　All come together','There\'s no reason why','I got my demons　They don\'t know','I\'m fierce enough to let them go','It\'s like a fire　A stranglehold','I wish I was invincible','Hello desire　Your my old friend','But I don\'t need you here again','Just take a walk　Go back inside','I\'ll see you on the other side','samayoi tou mono mo tomadoi kou mono mo','subete no tsumi o koe','Wow oh oh oh oh oh','The pain and the pleasure　All come together','There is no reason why','Wow oh oh oh oh oh','The pain and the pleasure　All come together','There\'s no reason why','I get the feeling down below','It\'s coming back to take control','It\'s like a fire　A stranglehold','I feel like I\'m a criminal','One　criminal','Two　animal','Three　typical','Four　breakable','Five　I can\'t fight it','Six　I can\'t fight it','Seven　I can\'t fight it','So I hide it','People falling into the seven deadly sins','samayoi tsuzuke tadoritsuita','hikari o motome negai yo kanae','arayuru tsumi o koete','Wow oh oh oh oh oh','Wow oh oh oh oh oh','The pain and the pleasure　All come together','Wow oh oh oh oh oh','There\'s no reason　There\'s no reason','That\'s the reason why','Wow oh oh oh oh oh','The pain and the pleasure　All come together','There\'s no reason why'];

global listeChanson = [Birds, ItsTime, WhateverItTakes, IBetMyLife, BadLiar, Demons, SomethingHuman, Invincible, TimeIsRunningOut, SingForAbsolution, Uprising, Unintended, viceEtVersa, LaTribuDeDana, TakeMeToChurch, leLoupEtLeChien, Starlight, BoulevardOfBrokenDreams,  TwentyOneGuns, PutALittleLoveOnMe, TooMuchToAsk, BlackAndWhite, wolfInSheepsClothing, JeCodeAvecLeQ, SevenDeadlySins];

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
