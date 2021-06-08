include("GLOBALS");

// Memorise sous la forme : {combo : nb_reps}
function Memorise(combo) {
	if(combo == [] or getFightType() != FIGHT_TYPE_SOLO)
	{
		return;
	}
	sort(combo);

	var registres = getRegisters();
	for(var key : var val in registres){
		var k = jsonDecode(key);
		var v = jsonDecode(val);

		for(var c : var rep in v) {
			c = jsonDecode(c);
			if(c == combo) {	// Ce combo existe déjà
				v[jsonEncode(combo)] += 1;
				setRegister(key, jsonEncode(v));
				return;
			}
		}
	}
	var K = getHighestRegisterKey();
	var tab = jsonDecode(getRegister(K));
	combo = jsonEncode(combo);

	if(tab == null) {	// Première utilisation
		tab = [combo : 1];
		//tab[combo] = 1;
		K = 0;
		setRegister(K, jsonEncode(tab));
		return;
	} else {
		var counter = 0;	// On compte le nb de combos stockés dans ce registre
		for(var tabKey : var tabVal in tab) {
			counter += 1;
		}
		if(counter > 10) {	// déjà 10 combos sont stockés dans le registre
			K += 1;
			tab = [combo : 1];
			setRegister(K, jsonEncode(tab));
			return;
		} else {	// un ou plusieurs combos déja stockés
			tab[combo] = 1;
			setRegister(K, jsonEncode(tab));
			return;
		}
	}
}


function getHighestRegisterKey() {
	var Max = 0;
	var registres = getRegisters();
	for(var key : var val in registres) {
		if(key > Max) {
			Max = key;
		}
	}
	return number(Max);
}



function clearAllRegisters() { // pour effacer tous les registres rapidement
	var registres = getRegisters();
	for(var key : var val in registres) {
		deleteRegister(key);
	}
}