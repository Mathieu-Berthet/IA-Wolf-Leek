// Les différents type de lancement
//LAUNCH_TYPE_CIRCLE
//LAUNCH_TYPE_DIAGONAL
//LAUNCH_TYPE_DIAGONAL_INVERTED
//LAUNCH_TYPE_LINE
//LAUNCH_TYPE_LINE_INVERTED
//LAUNCH_TYPE_STAR
//LAUNCH_TYPE_STAR_INVERTED
//
include("GLOBALS");
include("Debug");

var entitiesToIgnore = getAliveAllies() + getAliveEnemies();

function getCellsToUseTool(tool, cell, entitiesToIgnore)
{
	var mini = MIN_RANGE[tool];
	var maxi = ALL_INGAME_TOOLS[tool][TOOL_MAX_RANGE];
	var launch_type = ALL_INGAME_TOOLS[tool][TOOL_LAUNCH_TYPE];
	var needLos = ALL_INGAME_TOOLS[tool][TOOL_NEED_LINE_OF_SIGHT];
	
	if (launch_type == LAUNCH_TYPE_CIRCLE)
	{
		return getCellTypeCircle(cell, mini, maxi, needLos, entitiesToIgnore)
	}
	else if (launch_type == LAUNCH_TYPE_LINE)
	{
		return getCellTypeLine(cell, mini, maxi, needLos, entitiesToIgnore)
	}
	else if (launch_type == LAUNCH_TYPE_DIAGONAL)
	{
		return getCellTypeDiagonal(cell, mini, maxi, needLos, entitiesToIgnore)
	}
	else if (launch_type == LAUNCH_TYPE_STAR)
	{
		return getCellTypeStar(cell, mini, maxi, needLos, entitiesToIgnore)
	}
	else if (launch_type == LAUNCH_TYPE_LINE_INVERTED)
	{
		return getCellTypeLineInverted(cell, mini, maxi, needLos, entitiesToIgnore)
	}
	else if (launch_type == LAUNCH_TYPE_STAR_INVERTED)
	{
		return getCellTypeStarInverted(cell, mini, maxi, needLos, entitiesToIgnore)
	}
	else if (launch_type == LAUNCH_TYPE_DIAGONAL_INVERTED)
	{
		return getCellTypeDiagonalInverted(cell, mini, maxi, needLos, entitiesToIgnore)
	}
	
	var name = ALL_INGAME_TOOLS[tool][TOOL_NAME];
	debugE("Launch - getCellsToUseTool - type de launch non pris en charge : " + name);
	return [];
}

/*function updateEntitiesToIgnore() {
		entitiesToIgnore = getAliveAllies() + getAliveEnemies();
}*/

function getCellTypeCircle(cell, minRange, maxRange, needLos, entitiesToIgnore) 
{
	var x = getCellX(cell);
	var y = getCellY(cell);

	var result = [];
	for (var rangeX = -maxRange; rangeX <= maxRange ; rangeX++) {
		for (var rangeY = -maxRange; rangeY <= maxRange ; rangeY++) {
			if(abs(rangeY) + abs(rangeX) < minRange || abs(rangeY) + abs(rangeX) > maxRange) continue;
			var c = getCellFromXY(x + rangeX, y + rangeY);
			if(c === null) continue;
			if(needLos && lineOfSight(cell, c, entitiesToIgnore))
			push(result, c);
		}
	}
	return result;
}

function getCellTypeLine(cell, minRange, maxRange, needLos, entitiesToIgnore) {
	var x = getCellX(cell);
	var y = getCellY(cell);

	var result = [];
	for (var range = minRange; range <= maxRange ; range++) {
		for (var sensX in [1, -1]) {
			var c = getCellFromXY(x + sensX * range, y);
			if(c === null) continue;
			if(needLos && lineOfSight(cell, c, entitiesToIgnore))
			push(result, c);
		}
		for(var sensY in [1, -1]) {
			var c = getCellFromXY(x, y + sensY * range);
			if(c === null) continue;
			if(needLos && lineOfSight(cell, c, entitiesToIgnore))
			push(result, c);
		}
	}
	return result;
}

function getCellTypeDiagonal(cell, minRange, maxRange, needLos, entitiesToIgnore) {
	var x = getCellX(cell);
	var y = getCellY(cell);

	var result = [];
	for (var range = minRange / 2; range <= maxRange / 2 ; range ++) {
		for (var sensX in [1, -1]) {
			for(var sensY in [1, -1]) {
				var c = getCellFromXY(x + sensX * range, y + sensY * range);
				if(c === null) continue;
				if(needLos && lineOfSight(cell, c, entitiesToIgnore))
				push(result, c);
			}
		}

	}
	return result;
}

function getCellTypeStar(cell, minRange, maxRange, needLos, entitiesToIgnore) {
		return getCellTypeDiagonal(cell, minRange, maxRange, needLos, entitiesToIgnore) + getCellTypeLine(cell, minRange, maxRange, needLos, entitiesToIgnore);
	}


function getCellTypeLineInverted(cell, minRange, maxRange, needLos, entitiesToIgnore) {
		return arrayDiff(getCellTypeCircle(cell, minRange, maxRange, needLos, entitiesToIgnore), getCellTypeLine(cell, minRange, maxRange, needLos, entitiesToIgnore));
	}


function getCellTypeDiagonalInverted(cell, minRange, maxRange, needLos, entitiesToIgnore) {
		return arrayDiff(getCellTypeCircle(cell, minRange, maxRange, needLos, entitiesToIgnore), getCellTypeDiagonal(cell, minRange, maxRange, needLos, entitiesToIgnore));
	}

	
function getCellTypeStarInverted(cell, minRange, maxRange, needLos, entitiesToIgnore) {
		return arrayDiff(getCellTypeCircle(cell, minRange, maxRange, needLos, entitiesToIgnore), getCellTypeDiagonal(cell, minRange, maxRange, needLos, entitiesToIgnore));
	}


function arrayDiff(tab1, tab2) {
	return arrayFilter(tab1, function(value) {
		return !inArray(tab2, value);
	});
}
