
/**
 * Auteur : Caneton
 * getCenterOfGravity => retourne le centre de gravité d'un goupe de poireau
 * PS: j'ai calculé les écarts types ( == moyennes des écarts à la moyenne) selon les 2 axes
 * 			Ils sont pour l'instant en debug mais il serait surement intéressant de les retourner
 **/
include("MapDangerV2");
function getCenterOfGravity(leeks) {
	var distanceMoyenne;
	var X = [];
	var Y = [];
	var centre;
	var nb = 0;
	for (var leek in leeks) {
		var cell = getCell(leek);
		X[nb] = getCellX(cell);
		Y[nb] = getCellY(cell);
		nb++;
	}
	//moyenne
	var xmoy = 0;
	var ymoy = 0;
	for (var x in X) xmoy+=x;
	for (var y in Y) ymoy+=y;
	xmoy /= nb;
	ymoy /= nb;
	centre = getCellFromXY(xmoy, ymoy);
	mark(centre, getColor(255, 30, 255));

	if(nb>=2) {
		//écart-type
		var somme2X = 0;
		var somme2Y = 0;
		for (var x in X) somme2X+=(x-xmoy)**2;
		for (var y in Y) somme2Y+=(y-ymoy)**2;
		var s2primX = somme2X/(nb-1);
		var s2primY = somme2Y/(nb-1);
		var ecartTypeX = sqrt(s2primX);
		var ecartTypeY = sqrt(s2primY);
		debug("ecartTypeX = " + ecartTypeX);
		debug("ecartTypeY = " + ecartTypeY);
	}

	return centre;
}



/**
* Fonction : Cases accessibles
* @auteur : rayman26, corrigé par Caneton^^
*	Avancement : Terminé !
* Parametres :
*							cellule : La cellule du poireau dont on veut determiner les cases accessibles
*							mp: Le nombre de MP qu'il possède
*	Retour : tableau associatif avec pour clé la cellule et pour valeur la distance pour aller sur cette cellule
*
*	Evolution possible du code : ajouter en paramètre un tableau de poireau à ignorer
*															=> peut permettre de calculer les cases accessibles d'un ennemis quand on est suceptible de se déplacer après
**/
function accessible(cellule, mp)
{
	var deplacement = [cellule : 0];
	var caseTest = [cellule : true];


	for (var a = 1; a <= mp; a++)
	{
		var CaseEnTest = caseTest;
		caseTest = [];

		for (var case : var i in CaseEnTest)
		{
			var cx = getCellX(case);
			var cy = getCellY(case);

			for (var x = -1;x <=1; x+=2)
			{
				var o = getCellFromXY(cx+x, cy);
				if(o != null && getCellContent(o) == CELL_EMPTY) // On peut éviter cette opération. Il suffit de le faire au tout début de la partie pour
				{ // les obstacles et de le stocker dans un tableau. Après on regarde dans le tableau, et on vérifie que ce n'est pas un poireau/bulbe.
					if(deplacement[o] === null) // ça économise quelques opérations. Marmotte
					{
						caseTest[o] = true;
						deplacement[o] = a;
					}
				}
			}

			for(var y = -1; y<=1; y+=2)
			{
				var p = getCellFromXY(cx, cy+y);
				if(p !=null && getCellContent(p) == CELL_EMPTY) // Idem. Pour vérifier si ce ce n'est pas une entité, on peut faire un tableau au début du
				{ // tour des emplacements des entités. Ce tableau peut aussi être utile par la suite dans d'autre fonction. Par contre je ne sais pas si
					// on gagne des opé avec cette astuce ci ^^ Marmotte
					if(deplacement[p] === null)
					{
						caseTest[p] = true;
						deplacement[p] = a;
					}
				}
			}
		}
	}
	return deplacement;
}





/*****************************************************	Déplacement *******************************************************************************/
//TODO: définir la méthode que l'on va utilisé pour se déplacer

/**
*	<Cache_Cache_de_Ray>
**/

// récupère toutes les cells où je peux me déplacer sans ligne de vue avec celles où peux se déplacer l'adversaire
function getCacheCacheCells(me, TheEnemy, mp, mpAdv)
{
    var my_move_cells = accessible(me, mp);
    var enemy_move_cells = accessible(TheEnemy, mpAdv);
    var safe_cells = [];
	var isSafe;

    for (var myCell : var myMP in my_move_cells)
	{
		isSafe = true;
		for (var HisCell : var HisMP in enemy_move_cells)
		{
			if (lineOfSight(myCell, HisCell))
			{
				isSafe = false;
				break;
			}
		}
		if(isSafe)
		{
			push(safe_cells, myCell);
		}
    }
    return safe_cells;
}
//var cellEnemy = getCell(TheEnemy);

/* [Caneton] : j'ai un conflit et je sais pas quel est la bonne version,
 à la vue du commentaire en dessous je commente cette fonction
 getCellToGo est plus adapté pour le cache-cache de toutes les façons*/
function getNearestCellFromCell(safe_cells, cellEnemy) // PB ? // Quel est le problème ?
{
	var dist = 1000;
	var safe_cellule;
	for (var i in safe_cells)
	{
		if(i == null)
		{
			safe_cellule = null;
		}
		else
		{
			if(getCellDistance(i, cellEnemy) < dist)
			{
				dist = getCellDistance(i, cellEnemy);
				safe_cellule = i;
			}
		}
	}
	return safe_cellule;
}


/*function getNearestCellFromCell(cell, tableau_cellules) {
	var cellule;
	var tableau_distances = [];
	var position;
	for (cellule in tableau_cellules) {
		push(tableau_distances, getCellDistance(cell, cellule));
	}
	position = search(tableau_distances, arrayMin(tableau_distances));
	var tab_cells = tableau_cellules;
	return tab_cells[position];
}*/

// récupère la cell la plus proche de l'adversaire parmis les cells où je peux me planquer
function getCacheCacheCell(me, TheEnemy, mp, mpAdv)
{
    var safe_cell;
    var safe_cells = getCacheCacheCells(me, TheEnemy, mp, mpAdv);

    if (safe_cells != null)
	{
        safe_cell = getNearestCellFromCell(safe_cells, TheEnemy);
        return safe_cell;
    }
	else
	{
        return null;
    }
}

// fonctionne comme un "moveAwayFrom()"
function moveCacheCache(me, TheEnemy, mp, mpAdv)
{
	var cache_cache_cell = getCacheCacheCell(me, TheEnemy, mp, mpAdv);
	if (cache_cache_cell != null)
	{
		if(cache_cache_cell === getCell(me))
		{
			moveToward(getNearestAlly());
		}
		else
		{
			moveTowardCell(cache_cache_cell);
		}
	}
	else
	{
		moveToward(getNearestAlly());
	}
}


/**
*	</Cache_Cache_de_Ray>
**/

// =========================
// La fonction getCellToGo renvoit, a partir de la map de danger, une cellule sure :
// la cellule la plus proche du centre de gravité si j'ai des alliés, sinon, la cellule la plus proche de l'ennemi. A peaufiner.
// =========================
function getCellToGo(map_danger_)
{
	var cell;
	if(count(getAliveAllies()) >= 2)
	{
		cell = getNearestCellToGoFromCell(getCenterOfGravity(getAliveAllies()), map_danger_);
		return cell;
	}
	else
	{
		cell = getNearestCellToGoFromCell(getCell(getNearestEnemy()), map_danger_);
		return cell;
	}
}

function getNearestCellToGoFromCell(cellule, map_danger_) //map_danger_ de la forme [cell : danger]
{
	var danger_min;
	var SaferCells = [];
	var array_values = [];
	for(var key : var value in map_danger_){
		push(array_values, value);
	}
	danger_min = arrayMin(array_values);

	for(var cell:var danger in map_danger_){
		if(danger == danger_min and isEmptyCell(cell)){
			push(SaferCells, cell);
		}
	}
	return getNearestCellFromCell_2(cellule, SaferCells);
}

/// LA FONCTION ! ///
function getNearestCellFromCell_2(cell, tableau_cellules)
{
	var cellule;
	var tableau_distances = [];
	var position;
	for (cellule in tableau_cellules)
	{
		push(tableau_distances, getCellDistance(cell, cellule));
	}
	position = search(tableau_distances, arrayMin(tableau_distances));
	var tab_cells = tableau_cellules;
	return tab_cells[position];
}
