/**
* Dookenstein version 4
 */
dojo.provide('myapp.Dookenstein');
dojo.require('dijit._Widget');
dojo.require('dijit._Templated');
dojo.require('dojo.i18n');
dojo.require('dojo.number');
dojo.require('dojo.hash');
dojo.require('uow.audio.JSonic');
dojo.requireLocalization('myapp', 'Dookenstein');

dojo.declare('myapp.Dookenstein', [dijit._Widget, dijit._Templated], {
    widgetsInTemplate: true,
	templatePath: dojo.moduleUrl('myapp.templates', 'Dookenstein.html'),

	postCreate: function() {
		//postCreate is called after the dom is created
		//load from data all pages and choices and update first page
		var xhrArgs = {
			url: 'dookInput.txt',
			handleAs: "text",
			preventCache: true,
			//dojo.hitch will fix scope problems
			load: dojo.hitch(this,"loadPageTextAndChoices")
		}
		dojo.xhrGet(xhrArgs);
		this.connect(window,'onkeyup','_onKeyPress');
	},
    postMixInProperties: function() {
		//postMixInProperties is called before the html is initialized
		//initialize jsonic from unc open web
		uow.getAudio({defaultCaching: true}).then(dojo.hitch(this, function(js) { this.js = js; }));
		//initialize variables
		this.pageText = new Array();
		this.choices = new Array();
		this.images = new Array();
		this.inventory = new Array();
		//the zeroth element of inventory is never used and is filled with the word inventory
		this.inventory[0] = 'Inventory';

		//Set delimiter (regular expression to parse input - default is ^*)
		this.DELIMITER = '^*';
		//Set comment delimiter (//, for example) - default is that comments are not allowed in the file
		this.COMMENTDELIMITER = "";
		//set starting health and gold.  Health can never go above MAX_HEALTH (default max health is 100)
		this.STARTING_HEALTH = 100;
		this.MAX_HEALTH = this.STARTING_HEALTH;
		this.health = this.MAX_HEALTH;
		this.STARTING_GOLD = 0;
		this.gold = this.STARTING_GOLD;
		//set starting strength/combat skill (default is 10)
		this.STARTING_STRENGTH = 10;
		this.strength = this.STARTING_STRENGTH;
		//initialize weapon data (default: unarmed with bare hands)
		var defaultWeapon = {
			name: 'Your bare hands',
			type: 'unarmed',
			strengthbonus: '-3',
			accuracy: '55',
			special: [],
			hitMessages: ['You hit your enemy'],
			missMessages: ['You miss.']
		}
		this.unarmed = defaultWeapon;
		//initialize weapons array (does not include unarmed)
		this.possibleWeapons = new Array();
		//initialize healing items array
		this.healingItems = new Array();
		//initialize external variables array
		this.initVariableList = new Array();
		this.variableList = new Array();
		//array containing button objects
		this.buttons = new Array();
		//menu level for game settings
		this.menuLevel = -1;
		this.menuCategory = "Settings";
		//default difficulty level is normal.  A harder difficulty will decrease the character's survivability
		this.difficulty = "Normal";
		//This message will be overwritten if the text file is loaded properly
		this.message = 'Failed to load game data';
		//set button focus to zero (Reread text button)
		this.currentFocus = 0;
		this.reread = 0;
		//if restart is set to 1, the game will reset upon the next button press
		this.restart = 0;
		//special mode for selecting multiple inventory items
		this.invselect = 0;
		//special mode for combat
		this.inCombat = 0;
		this.ignoreEffect = false;
		this.loadHashIgnore = false;
		this.chooseWeapon = 0;
		this.invselecting = 0;
		//special mode for Maze
		this.inMaze=0;
		//special mode for lock picking
		this.inLockPicking = 0;
		this.currentTumbler = 1;
		this.currentPushes = 0;
		this.maxPushes = 0;
		this.tumblers=[];
		this.maxTumblers = 0;
		this.maxWrong=0;
		this.hint='';
		//special mode for Maze
		this.inMaze=0;
		//special mode for safe cracking
		this.inSafeCracking =0;
		this.hasCombo = 0;
		this.currentNum =0;
		this.num = new Array(3);
		this.checked = 0;
		this.maxNum = 0;
		this.display = new Array(3);
		this.damage=0;
		//set jsonic reading rate - default for JSonic is 200
		this.sonicRate = 250;
		this.sonicVolume = 1.0;
    },
	
	loadPageTextAndChoices: function(data) {
		//The index of the arrays is the page number
		//pageText is the text for that page, and choices is the possible decisions
		//choices is split by the special character sequence this.DELIMITER (Default ^*) as follows
		//choice one text^*choice one will lead to this page^*choice two text^*choice two will lead to this page...
		
		dataSplit = data.split('\n');
		pageNumber = 0;
		pageInfo = '';
		for (i = 0; i < dataSplit.length; i++) {
			//remove any carriage returns (which are sometimes not removed by split('\n'))
			dataSplit[i] = dataSplit[i].replace(new RegExp( '\\r', 'g' ),'');
			if (this.COMMENTDELIMITER != "" && dataSplit[i].indexOf(this.COMMENTDELIMITER) == 0) {
				//comment delimiter found at start of line, so do nothing
			}
			else if (dataSplit[i].indexOf('COMMENTDELIMITER:') != -1) {
				//set delimiter for comments
				this.COMMENTDELIMITER = dataSplit[i].split('COMMENTDELIMITER:')[1];
			}
			else if (dataSplit[i].indexOf('DELIMITER:') != -1) {
				//set delimiter to something other than '^*'
				this.DELIMITER = dataSplit[i].split('DELIMITER:')[1];
			}
			else if (dataSplit[i].indexOf('INITWEAPON:') != -1) {
				//Parse weapon information
				var added = {
					name: 'Error with weapon initialization - no name specified',
					type: 'weapon',
					strengthbonus: 'NaN',
					accuracy: 'NaN',
					special: [],
					hitMessages: [],
					missMessages: []
				}
				splitResult = dataSplit[i].split('INITWEAPON:')[1].split(this.DELIMITER);
				added.name = splitResult[0];
				added.strengthbonus = dojo.number.parse(splitResult[1]);
				added.accuracy = dojo.number.parse(splitResult[2]);
				if (isNaN(added.strengthbonus)) {
					console.log('Error initializing weapon strength (Not a number)!');
					added.strengthbonus = -3;
				}
				if (isNaN(added.accuracy)) {
					console.log('Error initializing weapon accuracy (Not a number)!');
					added.accuracy = 55;
				}
				for (y = 0; y < splitResult.length; y++) {
					if (splitResult[y].indexOf('SPECIAL:') != -1) {
						added.special[added.special.length] = splitResult[y].split('SPECIAL:')[1];
					}
					if (splitResult[y].indexOf('HIT:') != -1) {
						added.hitMessages[added.hitMessages.length] = splitResult[y].split('HIT:')[1];
					}
					if (splitResult[y].indexOf('MISS:') != -1) {
						added.missMessages[added.missMessages.length] = splitResult[y].split('MISS:')[1];
					}
				}
				if (added.hitMessages.length == 0) {
					added.hitMessages = ['You hit your enemy'];
				}
				if (added.missMessages.length == 0) {
					added.missMessages = ['You miss.'];
				}
				this.possibleWeapons[this.possibleWeapons.length] = added;
				//console.log('Added Weapon.  Name: ' + added.name + ', Strength bonus: ' + added.strengthbonus + ', Accuracy: ' + added.accuracy + ', Hit message 1: ' + added.hitMessages[0] + ', Miss message 1:' + added.missMessages[0]);
			}
			else if (dataSplit[i].indexOf('UNARMED:') != -1) {
				//Parse weapon information for the case where you must fight unarmed (default:bare hands)
				var added = {
					name: 'Error with unarmed initialization - no name specified',
					strengthbonus: 'NaN',
					accuracy: 'NaN',
					special: [],
					hitMessages: [],
					missMessages: []
				}
				splitResult = dataSplit[i].split('UNARMED:')[1].split(this.DELIMITER);
				added.name = splitResult[0];
				added.strengthbonus = dojo.number.parse(splitResult[1]);
				added.accuracy = dojo.number.parse(splitResult[2]);
				if (isNaN(added.strengthbonus)) {
					console.log('Error initializing unarmed strength (Not a number)!');
					added.strengthbonus = -3;
				}
				if (isNaN(added.accuracy)) {
					console.log('Error initializing unarmed accuracy (Not a number)!');
					added.accuracy = 55;
				}
				for (y = 0; y < splitResult.length; y++) {
						if (splitResult[y].indexOf('SPECIAL:') != -1) {
						added.special[added.special.length] = splitResult[y].split('SPECIAL:')[1];
					}
					if (splitResult[y].indexOf('HIT:') != -1) {
						added.hitMessages[added.hitMessages.length] = splitResult[y].split('HIT:')[1];
					}
					if (splitResult[y].indexOf('MISS:') != -1) {
						added.missMessages[added.missMessages.length] = splitResult[y].split('MISS:')[1];
					}
				}
				if (added.hitMessages.length == 0) {
					added.hitMessages = ['You hit your enemy'];
				}
				if (added.missMessages.length == 0) {
					added.missMessages = ['You miss.'];
				}
				this.unarmed = added;
				//console.log('Added Unarmed.  Name: ' + added.name + ', Strength bonus: ' + added.strengthbonus + ', Accuracy: ' + added.accuracy + ', Hit message 1: ' + added.hitMessages[0] + ', Miss message 1:' + added.missMessages[0]);
			}
			else if (dataSplit[i].indexOf('SHIELD:') != -1) {
				//Parse shield information
				var added = {
					name: 'Error with shield initialization - no name specified',
					type: 'shield',
					defense: NaN,
					probability: NaN
				}
				splitResult = dataSplit[i].split('SHIELD:')[1].split(this.DELIMITER);
				added.name = splitResult[0];
				added.defense = dojo.number.parse(splitResult[1]);
				added.probability = dojo.number.parse(splitResult[2]);
				if (isNaN(added.defense)) {
					console.log('Error initializing shield defense (Not a number)!');
					added.defense = 0;
				}
				if (isNaN(added.probability)) {
					console.log('Error initializing shield probability (Not a number)!');
					added.probability = 0;
				}
				this.possibleWeapons[this.possibleWeapons.length] = added;
			}
			else if (dataSplit[i].indexOf('ARMOR:') != -1) {
				//Parse armor information
				var added = {
					name: 'Error with armor initialization - no name specified',
					type: 'armor',
					defense: NaN,
					probability: NaN
				}
				splitResult = dataSplit[i].split('ARMOR:')[1].split(this.DELIMITER);
				added.name = splitResult[0];
				added.defense = dojo.number.parse(splitResult[1]);
				added.probability = dojo.number.parse(splitResult[2]);
				if (isNaN(added.defense)) {
					console.log('Error initializing armor defense (Not a number)!');
					added.defense = 0;
				}
				if (isNaN(added.probability)) {
					console.log('Error initializing armor probability (Not a number)!');
					added.probability = 0;
				}
				this.possibleWeapons[this.possibleWeapons.length] = added;
			}
			else if (dataSplit[i].indexOf('HEALING:') != -1) {
				//Parse a healing item (such as a first aid kit) for automatic healing after combat
				var added = {
					name: 'Error with healing item initialization - no name specified',
					amount: 0.5
				}
				splitResult = dataSplit[i].split('HEALING:')[1].split(this.DELIMITER);
				added.name = splitResult[0];
				added.amount = dojo.number.parse(splitResult[1]);
				if (isNaN(added.amount)) {
					console.log('Error healing item amount (Not a number)!');
					added.amount = 0.5;
				}
				this.healingItems[this.healingItems.length] = added;
			}
			else if (dataSplit[i].indexOf('INITIALIZE:') != -1) {
				//Initialize variables - default is 100 health, 10 strength, and 0 gold
				initialSplit = dataSplit[i].split('INITIALIZE:')[1].split(',');
				if (initialSplit[0] == 'Health') {
					this.STARTING_HEALTH = dojo.number.parse(initialSplit[1]);
					if (isNaN(this.STARTING_HEALTH)) {
						console.log('Failed to initialize Health (Error - Not a number).  Health set to default of 100.');
						this.STARTING_HEALTH = 100;
					}
					//Max health is the value that your health cannot exceed.  This could change in-game if you get stronger
					//Starting health is initialized in the game file and will not change.  When game is reset, max health returns to starting health
					this.MAX_HEALTH = this.STARTING_HEALTH;
					this.health = this.MAX_HEALTH;
				} else if (initialSplit[0] == 'Strength') {
					this.STARTING_STRENGTH = dojo.number.parse(initialSplit[1]);
					if (isNaN(this.STARTING_STRENGTH)) {
						console.log('Failed to initialize Strength (Error - Not a number).  Strength set to default of 10.');
						this.STARTING_STRENGTH = 10;
					}
					this.strength = this.STARTING_STRENGTH;
				} else if (initialSplit[0] == 'Gold') {
					this.STARTING_GOLD = dojo.number.parse(initialSplit[1]);
					if (isNaN(this.STARTING_GOLD)) {
						console.log('Failed to initialize Gold (Error - Not a number).  Gold set to default of 0.');
						this.STARTING_GOLD = 0;
					}
					this.gold = this.STARTING_GOLD;
				} else {
					//initialized unknown variable: add it to the list
					var newInitVariable = {
						name: initialSplit[0],
						value: initialSplit[1]
					}
					var newVariable = {
						name: initialSplit[0],
						value: initialSplit[1]
					}
					this.initVariableList[this.initVariableList.length] = newInitVariable;
					this.variableList[this.variableList.length] = newVariable;
					//console.log('Initialized variable: ' + newVariable.name + ', value: ' + newVariable.value);
				}
			} else {
				// parse page information
				pageNumber = dataSplit[i].split(':')[0];
				if (dataSplit[1].split(':').length > 1) {
					pageInfo = dataSplit[i].split(':')[1];
					//get text after all other colons
					for (k = 2; k < dataSplit[i].split(':').length; k++) {
						pageInfo = pageInfo + ':' + dataSplit[i].split(':')[k];
					}
				} else {
					pageInfo = '';
					console.log('Error: page detected with no information');
				}
				//fill pageText first, then choices, then image link
				if (this.pageText[pageNumber] == null) {
					this.pageText[pageNumber] = pageInfo;
				} else if (this.choices[pageNumber] == null) {
					this.choices[pageNumber] = pageInfo;
				} else {
					//page text and choices are already full, so add an image
					this.images[pageNumber] = pageInfo;
				}
			}
		}
		
		this.page = 0;
		if (dojo.hash() != '') {
			this.loadHash();
			this.processChoice(this.page,0);
		} else {
		this.message = this.pageText[this.page];
		//choicesArray = this.choices[this.page].split('^*');
		choicesArray = this.choices[this.page].split(this.DELIMITER);
		//this.exportPageTextAndChoices();
		//must call refreshAll in here because this method is dojo.deferred (will occur last)
		}
		this.refreshAll();
	},

	exportPageTextAndChoices: function() {
		outputString = '';
		for (i = 0; i < this.choices.length; i++) {
			if (this.choices[i] != null) {
				choiceSplit = this.choices[i].split(this.DELIMITER);
				for (j = 1; j < choiceSplit.length; j+= 2) {
					if (choiceSplit[j] != 1 && choiceSplit[j] != 999) {
						stringtoAdd = i + '->' + choiceSplit[j] + ';<br>';
						if (!outputString.match(stringtoAdd)) {
							outputString += i + '->' + choiceSplit[j] + ';<br>';
						}
					} else {
						pageTextSplit = this.pageText[i].split(this.DELIMITER);
						for (k = 0; k < pageTextSplit.length; k++) {
							if (!isNaN(dojo.number.parse(pageTextSplit[k]))) {
								stringtoAdd = i + '->' + pageTextSplit[k] + ';<br>';
								if (!outputString.match(stringtoAdd)) {
									outputString += i + '->' + pageTextSplit[k] + ';<br>';
								}
							}
						}
					}
				}
			}
		}
		//this.message = outputString;
		//console.log(outputString);
	},
	
	_onClick: function(buttonNum) {
		this.choose(buttonNum);
	},

	_focusSettings: function(event) {
		//select the Settings button
		this.currentFocus = -1;
		this.settings.focus();
	},
	_focusReread: function(event) {
		//select Read Text Again button
		this.currentFocus = 0;
		this.rereadText.focus();
	},
	_rereadText: function(event) {
		this.reread = 1;
		this.runJSonic();
	},
	_settings: function(event) {
		//"Settings" or "Go back" was selected
		if (this.menuLevel == -1 || this.menuLevel == 1) {
			if (this.menuLevel == -1) {
				tempPageText = this.message;
				tempChoices = [];
				for (i = 0; i < choicesArray.length; i++) {
					tempChoices[i] = choicesArray[i];
				}
			}
			this.menuLevel = 0;
			this.menuCategory = "Settings";
			//currently in the game, go to settings menu
			this.message = "Settings";
			choicesArray = [];
			choicesArray[0] = "Save Game"
			choicesArray[1] = 1;
			choicesArray[2] = "Load Game"
			choicesArray[3] = 2;
			choicesArray[4] = "Sound Options";
			choicesArray[5] = 3;
			choicesArray[6] = "Display Options";
			choicesArray[7] = 4;
			choicesArray[8] = "Game Options";
			choicesArray[9] = 5;
			this.settings.attr('label','Go back');
		} else if (this.menuLevel == 0) {
			//currently in main settings menu, go back to the game
			this.menuLevel = -1;
			this.settings.attr('label','Settings');
			//this.processChoice(this.page,0);
			this.message = tempPageText;
			choicesArray = [];
			for (i = 0; i < tempChoices.length; i++) {
				choicesArray[i] = tempChoices[i];
			}
		} else {
			this.menuLevel = this.menuLevel - 2;
			this.navigateSettings(0);
		}
		this.refreshAll();
	},
	
	navigateSettings: function(choiceNum) {
		//navigate the settings menu
		this.menuLevel ++;
		if (this.menuLevel > 4) {
			this.message = "Option not implemented";
			choicesArray = [];
			this.menuLevel --;
		}
		else if (this.menuLevel == 4) {
			if (this.menuCategory == "Inventory options") {
				this.message = "This item cannot be used right now."
				this.menuLevel --;
			} else {
				this.menuLevel --;
			}
		}
		else if (this.menuLevel == 3) {
			if (this.menuCategory == "Font settings") {
				if (choiceNum == 1) {
					var p = document.getElementsByTagName('div');
					for(i=0;i<p.length;i++) {
						if(p[i].style.fontSize) {
							var s = parseInt(p[i].style.fontSize.replace("px",""));
						} else {
							var s = 12;
						}
						if(s<=40) {
							s += 2;
							this.message = "Font size increased to " + s + "."
						}
						p[i].style.fontSize = s+"px"
				   }
					this.menuLevel --;
				}
				else if (choiceNum == 2) {
					var p = document.getElementsByTagName('div');
					for(i=0;i<p.length;i++) {
						if(p[i].style.fontSize) {
							var s = parseInt(p[i].style.fontSize.replace("px",""));
						} else {
							var s = 12;
						}
						if(s>=8) {
							s -= 2;
							this.message = "Font size decreased to " + s + "."
						}
						p[i].style.fontSize = s+"px"
				   }
					this.menuLevel --;
				} else {
					this.menuLevel --;
				}
			} else if (this.menuCategory == "Font color") {
				if (choiceNum == 1) {
					this.displayMessage.style.color = "black";
					this.message = "Font color set to black."
					this.menuLevel --;
				}
				else if (choiceNum == 2) {
					this.displayMessage.style.color = "white";
					this.message = "Font color set to white."
					this.menuLevel --;
				}
				else if (choiceNum == 3) {
					this.displayMessage.style.color = "blue";
					this.message = "Font color set to blue."
					this.menuLevel --;
				}
				else if (choiceNum == 4) {
					this.displayMessage.style.color = "green";
					this.message = "Font color set to green."
					this.menuLevel --;
				} else if (choiceNum == 5) {
					this.displayMessage.style.color = "yellow";
					this.message = "Font color set to yellow."
					this.menuLevel --;
				} else if (choiceNum == 6) {
					this.displayMessage.style.color = "red";
					this.message = "Font color set to red."
					this.menuLevel --;
				} else if (choiceNum == 7) {
					this.displayMessage.style.color = "pink";
					this.message = "Font color set to pink."
					this.menuLevel --;
				} else {
					this.menuLevel --;
				}
			} else if (this.menuCategory == "Background color") {
				if (choiceNum == 1) {
					this.message = "Background color set to white."
					var p = document.getElementsByTagName('div');
					for(i=0;i<p.length;i++) {
						p[i].style.background = "white";
					}
					this.menuLevel --;
				}
				else if (choiceNum == 2) {
					this.message = "Background color set to blue."
					var p = document.getElementsByTagName('div');
					for(i=0;i<p.length;i++) {
						p[i].style.background = "blue";
					}
					this.menuLevel --;
				} else if (choiceNum == 3) {
					this.message = "Background color set to black."
					var p = document.getElementsByTagName('div');
					for(i=0;i<p.length;i++) {
						p[i].style.background = "black";
					}
					this.menuLevel --;
				} else if (choiceNum == 4) {
					this.message = "Background color set to green."
					var p = document.getElementsByTagName('div');
					for(i=0;i<p.length;i++) {
						p[i].style.background = "green";
					}
					this.menuLevel --;
				} else if (choiceNum == 5) {
					this.message = "Background color set to yellow."
					var p = document.getElementsByTagName('div');
					for(i=0;i<p.length;i++) {
						p[i].style.background = "yellow";
					}
					this.menuLevel --;
				} else if (choiceNum == 6) {
					this.message = "Background color set to red."
					var p = document.getElementsByTagName('div');
					for(i=0;i<p.length;i++) {
						p[i].style.background = "red";
					}
					this.menuLevel --;
				} else if (choiceNum == 7) {
					this.message = "Background color set to pink."
					var p = document.getElementsByTagName('div');
					for(i=0;i<p.length;i++) {
						p[i].style.background = "pink";
					}
					this.menuLevel --;
				} else {
					this.menuLevel --;
				}
			} else if (this.menuCategory == "Difficulty options") {
				if (choiceNum == 1) {
					this.difficulty = "Easy";
					this.message = "Set difficulty to " + this.difficulty + "."
					this.menuLevel --;
				}
				else if (choiceNum == 2) {
					this.difficulty = "Normal";
					this.message = "Set difficulty to " + this.difficulty + "."
					this.menuLevel --;
				}
				else if (choiceNum == 3) {
					this.difficulty = "Hard";
					this.message = "Set difficulty to " + this.difficulty + "."
					this.menuLevel --;
				} else {
					this.menuLevel --;
				}
			} else if (this.menuCategory == "Inventory options") {
				if (choiceNum == 1) {
					inventoryArray = [];
					for (b = 0; b < this.inventory.length; b++) {
						if (this.inventory[b] == "undefined") {
							this.inventory[b] = "";
						}
						if (this.inventory[b] != "") {
							inventoryArray[inventoryArray.length] = this.inventory[b];
						}
					}
					if (inventoryArray.length == 1) {
						this.message = "There are no items in your inventory.";
					} else {
						this.message = inventoryArray[0] + ": ";
						for (b = 1; b < inventoryArray.length; b++) {
							if (inventoryArray[b] != "undefined") {
								this.message = this.message + inventoryArray[b];
							}
							if (b < inventoryArray.length - 1) {
								this.message = this.message + ", ";
							} else {
								this.message = this.message + ". ";
							}
						}
					}
					this.menuLevel --;
				} else if (choiceNum == 2) {
					inventoryArray = [];
					for (b = 0; b < this.inventory.length; b++) {
						if (this.inventory[b] == "undefined") {
							this.inventory[b] = "";
						}
						if (this.inventory[b] != "") {
							inventoryArray[inventoryArray.length] = this.inventory[b];
						}
					}
					if (inventoryArray.length <= 1) {
						this.message = "There are no items in your inventory.";
						this.menuLevel --;
					} else {
						choicesArray = [];
						h = 0;
						this.message = "Select an inventory item to use.";
						for (c = 1; c < inventoryArray.length; c++) {
							if (inventoryArray[c] != 'undefined') {
								choicesArray[h] = inventoryArray[c];
								choicesArray[h+1] = c;
								h = h + 2;
							}
						}
					}
				} else {
					this.menuLevel --;
				}
			} else {
				this.menuLevel --;
			}
		}
		else if (this.menuLevel == 2) {
			if (this.menuCategory == "Audio settings") {
				if (choiceNum == 1) {
					//Mute Sound
					this.muteJSonic();
					if (this.sonicVolume == 0.0) {
						this.message = "Sound muted.";
					} else {
						this.message = "Sound unmuted.";
					}
					this.menuLevel --;
				}
				else if (choiceNum == 2) {
					//Speed up reading
					this.speedUpJSonic();
					this.message = "Sped up reading.";
					this.menuLevel --;
				}
				else if (choiceNum == 3) {
					//Slow down reading
					this.slowDownJSonic();
					this.message = "Slowed down reading.";
					this.menuLevel --;
				} else {
					this.menuLevel --;
				}
			} else if (this.menuCategory == "Display settings") {
				if (choiceNum == 1) {
					//Change font size
					this.message = "Font settings";
					this.menuCategory = "Font settings";
					choicesArray = [];
					choicesArray[0] = "Increase font size";
					choicesArray[1] = 1;
					choicesArray[2] = "Decrease font size";
					choicesArray[3] = 2;
				}
				else if (choiceNum == 2) {
					this.message = "What do you want to set the font color to?";
					this.menuCategory = "Font color";
					//Change font color
					choicesArray = [];
					choicesArray[0] = "Black";
					choicesArray[1] = 1;
					choicesArray[2] = "White";
					choicesArray[3] = 2;
					choicesArray[4] = "Blue";
					choicesArray[5] = 3;
					choicesArray[6] = "Green";
					choicesArray[7] = 4;
					choicesArray[8] = "Yellow";
					choicesArray[9] = 5;
					choicesArray[10] = "Red";
					choicesArray[11] = 6;
					choicesArray[12] = "Pink";
					choicesArray[13] = 7;
				}
				else if (choiceNum == 3) {
					this.message = "What do you want to set the background color to?";
					this.menuCategory = "Background color";
					//Change background color
					choicesArray = [];
					choicesArray[0] = "White";
					choicesArray[1] = 1;
					choicesArray[2] = "Blue";
					choicesArray[3] = 2;
					choicesArray[4] = "Black";
					choicesArray[5] = 2;
					choicesArray[6] = "Green";
					choicesArray[7] = 4;
					choicesArray[8] = "Yellow";
					choicesArray[9] = 5;
					choicesArray[10] = "Red";
					choicesArray[11] = 6;
					choicesArray[12] = "Pink";
					choicesArray[13] = 7;
				} else {
					this.menuLevel --;
				}
			} else if (this.menuCategory == "Game options" || this.menuCategory == "Inventory options") {
				if (choiceNum == 1) {
					//Set difficulty level
					this.message = "Your difficulty level is " + this.difficulty + ".  What do you want to change the difficulty level to?";
					this.menuCategory = "Difficulty options";
					choicesArray = [];
					choicesArray[0] = "Easy";
					choicesArray[1] = 1;
					choicesArray[2] = "Normal";
					choicesArray[3] = 2;
					choicesArray[4] = "Hard";
					choicesArray[5] = 3;
				}
				else if (choiceNum == 2 || this.menuCategory == "Inventory options") {
					this.message = "Inventory options";
					this.menuCategory = "Inventory options";
					//Manage Inventory
					choicesArray = [];
					choicesArray[0] = "Display inventory";
					choicesArray[1] = 1;
					choicesArray[2] = "Use an inventory item";
					choicesArray[3] = 2;
				}
				else if (choiceNum == 3) {
					//Display inventory
					inventoryArray = [];
					for (b = 0; b < this.inventory.length; b++) {
						if (this.inventory[b] == "undefined") {
							this.inventory[b] = "";
						}
						if (this.inventory[b] != "") {
							inventoryArray[inventoryArray.length] = this.inventory[b];
						}
					}
					if (inventoryArray.length == 1) {
						this.message = "There are no items in your inventory.";
					} else {
						this.message = inventoryArray[0] + ": ";
						for (b = 1; b < inventoryArray.length; b++) {
							if (inventoryArray[b] != "undefined") {
								this.message = this.message + inventoryArray[b];
							}
							if (b < inventoryArray.length - 1) {
								this.message = this.message + ", ";
							} else {
								this.message = this.message + ". ";
							}
						}
					}
					this.menuLevel --;
				}
				else if (choiceNum == 4) {
					//Display health
					this.message = 'Health Left: ' + this.health + '/' + this.MAX_HEALTH;
					this.menuLevel --;
				}
				else if (choiceNum == 5) {
					//Display gold
					this.message = 'You have ' + this.gold + ' gold.';
					this.menuLevel --;
				} else {
					this.menuLevel --;
				}
			} else {
				this.menuLevel --;
			}
			
		}
		else if (this.menuLevel == 1) {
			if (choiceNum == 1) {
				if (this.inCombat == 0 && this.inMaze == 0 && this.inLockPicking == 0 && this.inSafeCracking == 0 && this.invselect == 0 && this.restart == 0) {
					this.updateHash();
					this.message = "Game saved successfully.";
				} else if (this.invselect == 1) {
					this.message = "You cannot save the game during inventory selection.";
				} else if (this.inCombat == 1) {
					this.message = "You cannot save the game during combat.";
				} else {
					this.message = "You cannot save the game right now.";
				}
				this.menuLevel --;
			}
			else if (choiceNum == 2) {
				if (dojo.hash() != '') {
					this.loadHash();
					this.message = "Game loaded successfully.";
					this.settings.attr('label','Settings');
					this.inCombat = 0;
					this.restart = 0;
					this.invselect = 0;
					this.inLockPicking = 0;
					this.inSafeCracking = 0;
					this.inMaze = 0;
					this.processChoice(this.page,0);
					this.menuLevel --;
				} else {
					this.message = "You do not have a saved game.";
				}
				this.menuLevel --;
			}
			else if (choiceNum == 3 || this.menuCategory == "Audio settings") {
				this.message = "Audio settings";
				this.menuCategory = "Audio settings";
				choicesArray = [];
				choicesArray[0] = "Mute Sound";
				choicesArray[1] = 1;
				choicesArray[2] = "Speed up reading";
				choicesArray[3] = 2;
				choicesArray[4] = "Slow down reading";
				choicesArray[5] = 3;
			}
			else if (choiceNum == 4 || this.menuCategory == "Font settings" || this.menuCategory == "Font color" || this.menuCategory == "Background color") {
				this.message = "Display settings";
				this.menuCategory = "Display settings";
				choicesArray = [];
				choicesArray[0] = "Change font size";
				choicesArray[1] = 1;
				choicesArray[2] = "Change font color";
				choicesArray[3] = 2;
				choicesArray[4] = "Change background color";
				choicesArray[5] = 3;
			}
			else if (choiceNum == 5 || this.menuCategory == "Game options" || this.menuCategory == "Difficulty options" || this.menuCategory == "Inventory options") {
				this.message = "Game options";
				this.menuCategory = "Game options";
				choicesArray = [];
				choicesArray[0] = "Set difficulty level";
				choicesArray[1] = 1;
				choicesArray[2] = "Manage Inventory";
				choicesArray[3] = 2;
				choicesArray[4] = "Display Inventory";
				choicesArray[5] = 3;
				choicesArray[6] = "Display Health Left";
				choicesArray[7] = 4;
				choicesArray[8] = "Display Gold Left";
				choicesArray[9] = 5;
			} else {
				this._settings();
			}
		}
		this.refreshAll();
	},
	
	_onKeyPress: function(e) {
		//use e.keyCode to get ASCII values
		//for switch users, switches are meant to mapped to X and C keys
		if (e.keyCode == 109 || e.keyCode == 77) {
			//pressed M key - mute JSonic
			this.muteJSonic();
		}
		else if (e.keyCode == 97 || e.keyCode == 65 || e.keyCode == 37) {
			//pressed A or left arrow key - slow reading down
			this.slowDownJSonic();
		}
		else if (e.keyCode == 100 || e.keyCode == 68 || e.keyCode == 39) {
			//pressed D or right arrow key - speed reading up
			this.speedUpJSonic();
		}
		else if (e.keyCode == 99 ||e.keyCode == 67 || e.keyCode == 13 || e.keyCode == 32) {
			//C or Enter or spacebar pressed - choose currently focused button
			if (this.currentFocus == 0) {
				this._rereadText();
			} else if (this.currentFocus == -1) {
				this._settings();
			} else {
				this._onClick(this.currentFocus);
			}
		}
		else if (e.keyCode == 119 ||e.keyCode == 87 || e.keyCode == 38) {
			//W or up pressed - move up a button
			this.currentFocus --;
			if (this.currentFocus < -1) {
				this.changeFocus(this.buttons.length);
			} else {
				this.changeFocus(this.currentFocus);
			}
		}
		else if (e.keyCode == 115 ||e.keyCode == 83 || e.keyCode == 120 || e.keyCode == 88 || e.keyCode == 40) {
			//X or S or down pressed - move down a button
			this.currentFocus ++;
			if (this.currentFocus > this.buttons.length) {
				this.changeFocus(-1);
			} else {
				this.changeFocus(this.currentFocus);
			}
		}
		else if (e.keyCode >= 48 && e.keyCode <= 57) {
			//0-9 key pressed - select choice zero to 9
			convertedNum = (e.keyCode - 48);
			if (this.buttons.length >= convertedNum) {
				this.changeFocus(convertedNum);
			}
		}
	},
	changeFocus: function(focusNum) {
		this.currentFocus = focusNum;
		if (focusNum == 0) {
		//set focus on read text again button
			this._focusReread();
			this.js.stop();
			this.js.say({text: "Read text again"});
		} else if (focusNum == -1) {
		//set focus on settings button
			this._focusSettings();
			this.js.stop();
			this.js.say({text: this.settings.label});
		} else {
			this.buttons[focusNum - 1].focus();
			//make JSonic say the name the button that is focused on
			this.js.stop();
			this.js.say({text: this.buttons[focusNum - 1].label});
		}
	},
	choose: function(choiceNum) {
		if (this.restart == 1 && this.menuLevel == -1) {
			if (choiceNum == 1) {
				//'Restart' button pressed
				this.restartGame();
			} else if (choiceNum == 2) {
				this.loadHash();
				this.restart = 0;
				this.inCombat = 0;
				this.restart = 0;
				this.invselect = 0;
				this.inLockPicking = 0;
				this.inSafeCracking = 0;
				this.inMaze = 0;
				choicesArray[choiceNum * 2 - 1] = this.page;
			}
		}
		if (choicesArray.length < choiceNum * 2) {
			this.message = 'ERROR: The previous choice did not link to a page';
		} else {
			if (this.menuLevel == -1) {
				//if menuLevel is not -1, then currently in game settings mode
				this.page = choicesArray[choiceNum * 2 - 1];
				this.processChoice(this.page, choiceNum);
			} else {
				this.navigateSettings(choiceNum);
			}
		}
	},
	processChoice: function(pageNum, choiceNum) {
		this.page = pageNum;
		//console.log(choiceNum);
		if (this.pageText.length <= this.page || this.choices.length <= this.page) {
			this.message = 'ERROR: The specified page does not exist';
		} else {
			//check for special pages (combat, death, items)
			//specialPageArray = this.pageText[this.page].split('^*');
			specialPageArray = this.pageText[this.page].split(this.DELIMITER);

			if (specialPageArray.length == 1 || this.loadHashIgnore) {
				//no special commands, just display the text
				this.message = specialPageArray[specialPageArray.length-1];
				if (this.loadHashIgnore && specialPageArray[0].match('GAINGOLD:') != null) {
					//fix bug with gold gain and loading the page
					goldGain = specialPageArray[0].split('GAINGOLD:');
					if (goldGain[1].match('-') != null) {
						randomGain = goldGain[1].split('-');
						rand = Math.random()*(dojo.number.parse(randomGain[1]) - dojo.number.parse(randomGain[0]));
						goldGained = Math.round(rand) + dojo.number.parse(randomGain[0]);
						this.message = this.message.replace('#gold',goldGained);
					}
				}
				this.loadHashIgnore = false;
			} else {
				//the last thing in the array should be the actual page text (except in special circumstances)
				this.message = specialPageArray[specialPageArray.length-1];
				this.ignoreEffect = true;
				//loop through all special commands and run them if found
				/*List of special commands:
				INVSPLIT:item^*x^*y - Go to page x if item is in inventory, otherwise go to page y
				ANYSPLIT:item1,item2^*x^*y - Go to page x if any of the listed items are in inventory, otherwise go to page y
				ALLSPLIT:item1,item2^*x^*y - Go to page x if all of the listed items are in inventory, otherwise go to page y
				GOLDSPLIT:n^*x^*y - If gold is at least n, go to page x, otherwise go to page y
				HEALTHSPLIT:n^*x^*y - If health is at least n, go to page x, otherwise go to page.  MAX can be used for n.
				RANDSPLIT:^*x^*y^*z^*... Randomly go to any of the listed pages, all with equal probability
				HEALTHSPLIT:n^*x^*y - If gold is at least n, go to page x, otherwise go to page.  MAX can be used for n.
				INVCHECK:item^*text^*x - If item is in inventory, display text.  Otherwise, redirect to page x
				INVADD:item1,item2 - Add all listed items to inventory.  Add true as a parameter to allow duplicate adding.
				INVBUY:item,n^*x - Add item to inventory, lose n gold.  Redirect to page x if gold is less than n
				INVREMOVE:item1,item2 - Remove all listed items from inventory and display a message.  Add false to not display a message
				INVCLEAR:item1, item2 - Remove all inventory items except the ones listed
				INVSELECT:n - Select n inventory items of the user's choice from the list of choices
				INVREMOVESELECT:n - Remove n inventory items of the user's choice from the inventory
				LOSEHEALTH:n - Lose n health.  If resulting health is 0 or less, the character dies
				GAINHEALTH:n - Gain n health.  Cannot exceed the maximum health
				LOSEGOLD:n^*x - Lose n gold.  Redirect to page x if gold is less than n (optional)
				GAINGOLD:n - Gain n gold.  Use GAINGOLD:x-y to gain a random amount of gold between x and y
				DISPLAYGOLD - Display a message saying how much gold the character has
				VARSPLIT:var,value^*x^*y - Go to page x if external variable var = value, otherwise go to page y
				VARSET:var,value - Set the value of external variable var to value
				VARDISPLAY:var - Display the value of var in a message
				COMBAT: - Special command to start combat
				LOCKPICK:var - Creates a lock picking game with var number of tumblers
				SAFECRACK:abortPage - Creates a safe cracking game and shows parts of the combination based off how many "Combination" are found in the inventory. go to abortPage if abort.
				RESTART: - The story has reached some sort of end, so restart from page 1
				*/
				
				for(p=0; p<specialPageArray.length; p++){
					//INVSPLIT:item.  If the item is in the inventory, go the first page, otherwise go to the second page
					//INVSPLIT does not work with multiple special commands unless it is last
					if (specialPageArray[p].match('INVSPLIT:') != null) {
						inventoryCheck = specialPageArray[p].split('INVSPLIT:');
						if (inventoryCheck[1] in this.oc(this.inventory) || specialPageArray.length < 3) {
							//passed inventory check, redirect to first page
							this.page = specialPageArray[specialPageArray.length-2];
							this.processChoice(this.page,0);
							return;
						} else {
							//failed inventory check, redirect to second page
							this.page = specialPageArray[specialPageArray.length-1];
							this.processChoice(this.page,0);
							return;
						}
					}
					//ANYSPLIT:item,item2,...  If any of the items are in the inventory, go the first page, otherwise go to the second page
					//ANYSPLIT does not work with multiple special commands unless it is last
					if (specialPageArray[p].match('ANYSPLIT:') != null) {
						inventoryCheckArray = specialPageArray[p].split('ANYSPLIT:')[1].split(',');
						passedCheck = false;
						for (q = 0; q < inventoryCheckArray.length; q++) {
							if (inventoryCheckArray[q] in this.oc(this.inventory)) {
								passedCheck = true;
							}
						}
						if (passedCheck) {
							//passed inventory check, redirect to first page
							this.page = specialPageArray[specialPageArray.length-2];
							this.processChoice(this.page,0);
							return;
						} else {
							//failed inventory check, redirect to second page
							this.page = specialPageArray[specialPageArray.length-1];
							this.processChoice(this.page,0);
							return;
						}
					}
					//ALLSPLIT:item,item2,...  If all of the items are in the inventory, go the first page, otherwise go to the second page
					//ALLSPLIT does not work with multiple special commands unless it is last
					if (specialPageArray[p].match('ALLSPLIT:') != null) {
						inventoryCheckArray = specialPageArray[p].split('ALLSPLIT:')[1].split(',');
						passedCheck = true;
						for (q = 0; q < inventoryCheckArray.length; q++) {
							if (inventoryCheckArray[q] in this.oc(this.inventory)) {
								//the specified item is in the inventory
							} else {
								passedCheck = false;
							}
						}
						if (passedCheck) {
							//passed inventory check, redirect to first page
							this.page = specialPageArray[specialPageArray.length-2];
							this.processChoice(this.page,0);
							return;
						} else {
							//failed inventory check, redirect to second page
							this.page = specialPageArray[specialPageArray.length-1];
							this.processChoice(this.page,0);
							return;
						}
					}
					//GOLDSPLIT:n.  If current gold >= n, go to the first page, otherwise go to the second page
					//GOLDSPLIT does not work with multiple special commands unless it is last
					else if (specialPageArray[p].match('GOLDSPLIT:') != null) {
						goldCheck = specialPageArray[p].split('GOLDSPLIT:');
						if (this.gold >= goldCheck[1]) {
							//passed gold check, redirect to first page
							this.page = specialPageArray[specialPageArray.length-2];
							this.processChoice(this.page,0);
							return;
						} else {
							//failed gold check, redirect to second page
							this.page = specialPageArray[specialPageArray.length-1];
							this.processChoice(this.page,0);
							return;
						}
					}
					//HEALTHSPLIT:n^*x^*y - If health is at least n, go to page x, otherwise go to page.  MAX can be used for n.
					//HEALTHSPLIT does not work with multiple special commands unless it is last
					else if (specialPageArray[p].match('HEALTHSPLIT:') != null) {
						healthSplit = specialPageArray[p].split('HEALTHSPLIT:');
						if (healthSplit[1].match('MAX') != null) {
							healthCheck = this.MAX_HEALTH;
						} else {
							healthCheck = healthSplit[1];
						}
						if (this.health >= healthCheck) {
							//passed gold check, redirect to first page
							this.page = specialPageArray[specialPageArray.length-2];
							this.processChoice(this.page,0);
							return;
						} else {
							//failed gold check, redirect to second page
							this.page = specialPageArray[specialPageArray.length-1];
							this.processChoice(this.page,0);
							return;
						}
					}
					//RANDSPLIT:^*x^*y^*z^*... Randomly go to any of the listed pages, all with equal probability
					//RANDSPLIT only works with mutiple commands if it is last
					else if (specialPageArray[p].match('RANDSPLIT:') != null) {
						randSplit = [];
						numPossiblePages = (specialPageArray.length-1) - p;
						if (numPossiblePages > 0) {
							for (r = 0; r < numPossiblePages; r++) {
								randSplit[r] = specialPageArray[p+r+1];
							}
							rand = Math.round(Math.random()*(numPossiblePages-1));
							//redirect to the randomly chosen page
							this.page = randSplit[rand];
							this.processChoice(this.page,0);
						}
					}
					//INVCHECK:item.  If the item is in the inventory, display the page, otherwise redirect to another page
					//INVCHECK does not work with multiple special commands unless it is the last command
					else if (specialPageArray[p].match('INVCHECK:') != null) {
						inventoryCheck = specialPageArray[p].split('INVCHECK:');
						if (inventoryCheck[1] in this.oc(this.inventory) || specialPageArray.length < 3) {
							this.message = specialPageArray[p+1];
						} else {
							//failed inventory check, redirect to a new page
							this.page = specialPageArray[specialPageArray.length-1];
							this.processChoice(this.page,0);
							return;
						}
					}
					//INVADD:item1,item2,...  Add items to inventory.  Add true as a paramter to allow duplicate adding
					else if (specialPageArray[p].match('INVADD:') != null) {
						inventoryAdd = specialPageArray[p].split('INVADD:');
						//Add multiple inventory items by seperating them by a comma
						if (inventoryAdd[1].match(',') != null) {
							inventoryAddArray = inventoryAdd[1].split(',');
							checkForDuplicates = true;
							displayInvMessage = true;
							if ('true' in this.oc(inventoryAddArray)) {
								checkForDuplicates = false;
							}
							if ('false' in this.oc(inventoryAddArray)) {
								displayInvMessage = false;
							}
							for (i = 0; i < inventoryAddArray.length; i++) {
								if (!checkForDuplicates) {
									this.inventory[this.inventory.length] = inventoryAddArray[i];
								} else {
									//only add something to the inventory if it is not already there
									if (inventoryAddArray[i] in this.oc(this.inventory)) {
										if (displayInvMessage) {
											this.message = this.message + ' <br>You already have a ' + inventoryAddArray[i].toLowerCase() + ' so you do not take another one.'
										}
									} else if (inventoryAddArray[i] != 'true' && inventoryAddArray[i] != 'false') {
										this.inventory[this.inventory.length] = inventoryAddArray[i];
									}
								}
							}
						} else {
							//only one parameter specified
							if (inventoryAdd[1] in this.oc(this.inventory)) {
								this.message = this.message + ' <br>You already have a ' + inventoryAdd[1].toLowerCase() + ' so you do not take another one.'
							} else {
								this.inventory[this.inventory.length] = inventoryAdd[1];
							}
						}
						inventoryDisplayTest = false;
						if (inventoryDisplayTest) {
							//display inventory in the message, for testing purposes only
							for (u = 0; u < this.inventory.length; u++) {
								this.message = this.message + '<br>' + this.inventory[u];
							}
						}
						//this.message = specialPageArray[p+1];
					}
					//INVBUY:item,gold cost ... Add an item to your inventory and remove that amount of gold.
					//Only works with multiple commands if it is the last command
					else if (specialPageArray[p].match('INVBUY:') != null) {
						inventoryAdd = specialPageArray[p].split('INVBUY:');
						//Add multiple inventory items by seperating them by a comma
						if (inventoryAdd[1].match(',') != null) {
							goldSpent = inventoryAdd[1].split(',');
							if (dojo.number.parse(this.gold) < dojo.number.parse(goldSpent[1])) {
								if (specialPageArray.length > 2) {
									//not enough gold, redirect to another page (optional)
									this.page = specialPageArray[specialPageArray.length-1];
									this.processChoice(this.page,0);
									return;
								}
								this.message = "You do not have enough gold coins.";
							} else {
								this.message = specialPageArray[p+1];
								//add to inventory
								this.inventory[this.inventory.length] = goldSpent[0];
								//spend gold
								this.gold = dojo.number.parse(this.gold) - dojo.number.parse(goldSpent[1]);
							}
						} else {
							//no gold cost was specified, so act like INVADD
							this.message = specialPageArray[p+1];
							this.inventory[this.inventory.length] = inventoryAdd[1];
						}
					}
					//INVREMOVE:item1,item2,... Remove items from inventory.  Add false as a parameter to display no message
					else if (specialPageArray[p].match('INVREMOVE:') != null) {
						inventoryRemove = specialPageArray[p].split('INVREMOVE:');
						removedArray = [];
						inventoryRemoveArray = [];
						removedArray[0] = '<br> You are no longer carrying: ';
						//Remove multiple inventory items by seperating them by a comma
						if (inventoryRemove[1].match(',') != null) {
							inventoryRemoveArray = inventoryRemove[1].split(',');
							for (i = 1; i < this.inventory.length; i++) {
								for (j = 0; j < inventoryRemoveArray.length; j++) {
									if (this.inventory[i] == inventoryRemoveArray[j]) {
										this.inventory[i] = '';
										removedArray[removedArray.length] = inventoryRemoveArray[j];
									}
								}
							}
						} else {
							for (i = 1; i < this.inventory.length; i++) {
								if (this.inventory[i] == inventoryRemove[1]) {
									this.inventory[i] = '';
									removedArray[1] = inventoryRemove[1];
								}
							}
						}
						if (removedArray.length == 1) {
						} else {
							//display what items have been removed (if any)
							if ('false' in this.oc(inventoryRemoveArray)) {
								//do not show a "you are no longer carrying" message
							} else {
								for (i = 0; i < removedArray.length; i++) {
									this.message = this.message + removedArray[i];
									if (i > 0 && i < removedArray.length - 1) {
										this.message = this.message + ', ';
									}
								}
							}
						}
					}
					//INVCLEAR: items, remove all inventory contents except for the items specified.  Clears gold unless 'gold' is listed in items
					else if (specialPageArray[p].match('INVCLEAR:') != null) {
						inventorySave = specialPageArray[p].split('INVCLEAR:');
						//Save multiple inventory items by seperating them by a comma
						remove = true;
						if (inventorySave[1].match(',') != null) {
							inventorySaveArray = inventorySave[1].split(',');
							for (i = 1; i < this.inventory.length; i++) {
								for (j = 0; j < inventorySaveArray.length; j++) {
									if (this.inventory[i] == inventorySaveArray[j]) {
										remove = false;
									}
								}
								if (remove) {
									this.inventory[i] = '';
								} else {
									remove = true;
								}
							}
							if (!('gold' in this.oc(inventorySaveArray))) {
								this.gold = 0;
							}
						} else {
							for (i = 1; i < this.inventory.length; i++) {
								if (!(this.inventory[i] == inventorySave[1])) {
									this.inventory[i] = '';
								}
							}
							if (inventorySave[1] != 'gold') {
								this.gold = 0;
							}
						}
						//this.message = specialPageArray[p+1];
					}
					//INVSELECT: choose a certain number of items to add to inventory.  INVSELECT:n, choose n items from the choices
					else if (specialPageArray[p].match('INVSELECT:') != null) {
						inventoryAddNumber = specialPageArray[p].split('INVSELECT:');
						//choicesArray = this.choices[this.page].split('^*');
						choicesArray = this.choices[this.page].split(this.DELIMITER);

						alreadyTakenCount = 0;
						if (this.invselect == 1) {
							//add chosen item to inventory
							if (!(choicesArray[choiceNum * 2 - 2] in this.oc(this.inventory))) {
								this.inventory[this.inventory.length] = choicesArray[choiceNum * 2 - 2];
							}
						}
						for (i = 0; i < choicesArray.length; i+=2) {
							//remove all choices that have already been taken
							if (choicesArray[i] in this.oc(this.inventory)) {
								choicesArray[i] = 'Taken ' + choicesArray[i];
								if (this.invselect == 1) {
									alreadyTakenCount ++;
								}
							}
							choicesArray[i+1] = this.page;
						}
						//test to see if all items are taken for some reason
						takenCountTest = 0;
						for (i = 0; i < choicesArray.length; i+=2) {
							if ('Taken' in this.oc(choicesArray[i].split(" "))) {
								takenCountTest ++;
							}
						}
						if (takenCountTest == choicesArray.length/2) {
							alreadyTakenCount = inventoryAddNumber[1];
						}
						
						//this.message = specialPageArray[p+1];
						selectedString = inventoryAddNumber[1] - alreadyTakenCount;
						if (inventoryAddNumber[1] == 1) {
							//do not show "you can take 1 more item" if there is only one item to take
						} else {
							if (selectedString != 1) {
								this.message = this.message + ' <br>You can take ' + selectedString + ' more items.'
								if (this.invselect == 1) {
									this.js.say({text :'You can take ' + selectedString + ' more items.'});
								}
							} else {
								this.message = this.message + ' <br>You can take ' + selectedString + ' more item.'
								if (this.invselect == 1) {
									this.js.say({text :'You can take ' + selectedString + ' more item.'});
								}
							}
						}
						
						//go to inventory selection mode (stay on this page until all items are taken)
						this.invselect = 1;
						
						if (alreadyTakenCount >= inventoryAddNumber[1]) {
							//the number of inventory items you can take has been reached, move on to the next page
							this.invselect = 0;
							this.invselecting = 0;
							//choicesArray = this.choices[this.page].split('^*');
							choicesArray = this.choices[this.page].split(this.DELIMITER);
							this.page = choicesArray[choiceNum * 2 - 1];
							this.processChoice(this.page, choiceNum);
							return;
						}
					}
					//choose a certain number of items to remove from inventory with INVREMOVESELECT.  INVREMOVESELECT:n, choose n items from the choices
					//INVREMOVESELECT:n,item1,item2,... choose n items that are NOT any of the items listed
					else if (specialPageArray[p].match('INVREMOVESELECT:') != null) {
						if (specialPageArray[p].match(',') != null) {
							inventoryRemoveExclude = specialPageArray[p].split('INVREMOVESELECT:')[1].split(',');
							inventoryRemoveNumber = inventoryRemoveExclude[0];
						} else {
							inventoryRemoveNumber = specialPageArray[p].split('INVREMOVESELECT:')[1];
						}
						//choicesArray = this.choices[this.page].split('^*');
						choicesArray = this.choices[this.page].split(this.DELIMITER);
						nextPageNum = choicesArray[1];
						extraChoices = [];
						for (c = 2; c < choicesArray.length; c++) {
							extraChoices[c-2] = choicesArray[c];
						}
						choicesArray = [];
						j = 0;
						for (i = 1; i < this.inventory.length; i++) {
							if (this.inventory[i] != '') {
								exclude = false;
								if (specialPageArray[p].match(',') != null) {
									for (k = 0; k < inventoryRemoveExclude.length; k++) {
										if (this.inventory[i] == inventoryRemoveExclude[k]) {
											exclude = true;
										}
									}
								}
								if (!exclude) {
									choicesArray[j] = this.inventory[i];
									choicesArray[j+1] = nextPageNum;
									//j is needed because inventory might contain null items
									j = j + 2;
								}
							}
						}
						if (extraChoices.length > 0) {
							for (c = 0; c < extraChoices.length; c++) {
								choicesArray[choicesArray.length] = extraChoices[c];
							}
						}
						if (this.invselect == 0) {
							originalInventorySize = choicesArray.length/2;
							lastRemovedNum = 100;
						}
						currentInventorySize = choicesArray.length/2;
						leaveSelect = false;
						if (this.invselect == 1) {
							//remove chosen item from inventory
							if (choiceNum * 2 - 2 > lastRemovedNum) {
								choiceNum -= 1;
							}
							for (i = 1; i < this.inventory.length; i++) {
								if (this.inventory[i] == choicesArray[choiceNum * 2 - 2]) {
									lastRemovedNum = choiceNum * 2 - 2;
									this.inventory[i] = '';
								}
							}
							for (s = 0; s < extraChoices.length; s++) {
								if (extraChoices[s] == choicesArray[choiceNum * 2 - 2]) {
									//leave inventory selection and go to the page
									leaveSelect = true;
								}
							}
						}
						alreadyRemovedCount = 0;
						for (i = 0; i < choicesArray.length; i+=2) {
							//remove all choices that have already been taken
							if (!(choicesArray[i] in this.oc(this.inventory)) && !(choicesArray[i] in this.oc(extraChoices))) {
								choicesArray[i] = 'Removed ' + choicesArray[i];
								if (this.invselect == 1) {
									alreadyRemovedCount ++;
								}
							}
							if (!(choicesArray[i] in this.oc(extraChoices)) || this.invselect == 0) {
								choicesArray[i+1] = this.page;
							}
						}
						//go to inventory selection mode (stay on this page until all items are taken)
						this.invselect = 1;
						if (alreadyRemovedCount >= inventoryRemoveNumber || this.inventory.length == 1 || originalInventorySize - currentInventorySize + alreadyRemovedCount >= inventoryRemoveNumber || leaveSelect) {
							//the number of inventory items you can pick has been reached, move on to the next page
							this.invselect = 0;
							this.invselecting = 0;
							if (leaveSelect) {
								this.page = choicesArray[choiceNum * 2 - 1];
							} else {
								this.page = nextPageNum;
							}
							this.processChoice(this.page, choiceNum);
							return;
						}
						//this.message = specialPageArray[p+1];
					}
					//LOSEHEALTH: n, lose n health.  Cause death of health is 0 or less
					else if (specialPageArray[p].match('LOSEHEALTH:') != null) {
						healthLost = specialPageArray[p].split('LOSEHEALTH:');
						this.health = dojo.number.parse(this.health) - dojo.number.parse(healthLost[1]);
						if (this.health < 0) {
							this.health = 0;
						}
						this.message = this.message + '<br>Health Left: ' + this.health + '/' + this.MAX_HEALTH;
						if (this.health <= 0) {
							this.message = this.message + '<br>Your wounded body can take no more, and you collapse to the ground.  You are dead.';
							this.restart = 1;
						}
					}
					//GAINHEALTH: n, gain n health.  Cannot go above maximum health.
					else if (specialPageArray[p].match('GAINHEALTH:') != null) {
						healthGain = specialPageArray[p].split('GAINHEALTH:');
						this.health = dojo.number.parse(this.health) + dojo.number.parse(healthGain[1]);
						if (this.health > this.MAX_HEALTH) {
							this.health = this.MAX_HEALTH;
						}
						//this.message = specialPageArray[p+1] + '<br>Health Left: ' + this.health + '/' + this.MAX_HEALTH;
						this.message = this.message + '<br>Health Left: ' + this.health + '/' + this.MAX_HEALTH;
					}
					//LOSEGOLD: n, lose n gold.  Optional to redirect to another page is not enough gold.
					else if (specialPageArray[p].match('LOSEGOLD:') != null) {
						goldLost = specialPageArray[p].split('LOSEGOLD:');
						if (specialPageArray.length > 2) {
							if (dojo.number.parse(this.gold) < dojo.number.parse(goldLost[1])) {
								//not enough gold, redirect to another page
								this.page = specialPageArray[specialPageArray.length-1];
								this.processChoice(this.page,0);
								return;
							}
						}
						if (goldLost[1] == 'all') {
							this.gold = 0;
						} else {
							this.gold = dojo.number.parse(this.gold) - dojo.number.parse(goldLost[1]);
						}
						if (this.gold < 0) {
							this.gold = 0;
						}
						//this.message = specialPageArray[p+1] + '<br>You have ' + this.gold + ' gold coins.';
						this.message = specialPageArray[p+1];
					}
					//GAINGOLD: n, gain n gold.  Use GAINGOLD:x-y to gain a random amount of gold between x and y
					else if (specialPageArray[p].match('GAINGOLD:') != null) {
						goldGain = specialPageArray[p].split('GAINGOLD:');
						if (goldGain[1].match('-') != null) {
							randomGain = goldGain[1].split('-');
							rand = Math.random()*(dojo.number.parse(randomGain[1]) - dojo.number.parse(randomGain[0]));
							goldGained = Math.round(rand) + dojo.number.parse(randomGain[0]);
							this.gold = dojo.number.parse(this.gold) + dojo.number.parse(goldGained);
							this.message = this.message.replace('#gold',goldGained);
						} else {
							this.gold = dojo.number.parse(this.gold) + dojo.number.parse(goldGain[1]);
						}
						//this.message = specialPageArray[p+1] + '<br>You have ' + this.gold + ' gold coins.';
						this.message = this.message + '<br>You have ' + this.gold + ' gold coins.';

					}
					//DISPLAYGOLD: show how much gold the player has in the message
					else if (specialPageArray[p].match('DISPLAYGOLD:') != null) {
						if (this.gold == 1) {
							this.message = this.message + '<br>You have ' + this.gold + ' gold coin.';
							//this.message = specialPageArray[p+1] + '<br>You have ' + this.gold + ' gold coin.';
						} else {
							this.message = this.message + '<br>You have ' + this.gold + ' gold coins.';
							//this.message = specialPageArray[p+1] + '<br>You have ' + this.gold + ' gold coins.';
						}
					}
					//VARSPLIT:var, value.  If var = value, go to the first page, otherwise go to the second page.
					//Does not work with multiple commands unless it is last
					else if (specialPageArray[p].match('VARSPLIT:') != null) {
						varSplit = specialPageArray[p].split('VARSPLIT:')[1].split(',');
						passedCheck = false;
						for (y = 0; y < this.variableList.length; y++) {
							if (this.variableList[y].name == varSplit[0]) {
								if (this.variableList[y].value == varSplit[1]) {
									passedCheck = true;
								}
							}
						}
						if (passedCheck) {
							//passed variable check, redirect to first page
							this.page = specialPageArray[specialPageArray.length-2];
							this.processChoice(this.page,0);
							return;
						} else {
							//failed variable check, redirect to second page
							this.page = specialPageArray[specialPageArray.length-1];
							this.processChoice(this.page,0);
							return;
						}
					}
					//VARSET: var, value.  Set an external variable (specified in the game data file)
					else if (specialPageArray[p].match('VARSET:') != null) {
						varSet = specialPageArray[p].split('VARSET:')[1].split(',');
						for (y = 0; y < this.variableList.length; y++) {
							if (this.variableList[y].name == varSet[0]) {
								this.variableList[y].value = varSet[1];
							}
						}
					}
					//VARDISPLAY: var.  Display the value of var.
					else if (specialPageArray[p].match('VARDISPLAY:') != null) {
						varSplit = specialPageArray[p].split('VARDISPLAY:')[1];
						for (y = 0; y < this.variableList.length; y++) {
							if (this.variableList[y].name == varSplit) {
								this.message = this.message + '<br>' + this.variableList[y].name + ':' + this.variableList[y].value;
							}
						}
					}
					//COMBAT: enemy name, enemy weapon, enemy base strength, enemy defense, enemy health, hit messages, miss messages, run away option, run away link
					//Combat does not work with multiple commands
					else if (specialPageArray[p].match('COMBAT:') != null) {
						combatString = "";
						if (this.inCombat == 0) {
							//parse enemy info
							combatInfo = specialPageArray[p].split('COMBAT:')[1].split(',');
							autoFight = false;
							stunned = false;
							enemies = [];
							totalHealthLost = 0;
							//default enemy values (if none specified)
							var enemyVar = {
								name: 'enemy',
								weapon: 'None',
								str: 10,
								def: 0,
								health: 20,
								initialHealth: 20,
								acc: 55,
								accMod: 0,
								stunned: false,
								special:[],
								hitmessages:[],
								missmessages:[]
							}
							enemies[0] = enemyVar;
							enemyHealthFraction = 1;
							for (x = 0; x < combatInfo.length; x++) {
								if (combatInfo[x].match('NAME:') != null) {
									enemies[0].name = combatInfo[x].split('NAME:')[1];
								}
								else if (combatInfo[x].match('WEAPON:') != null) {
									enemies[0].weapon = combatInfo[x].split('WEAPON:')[1];
								}
								else if (combatInfo[x].match('STRENGTH:') != null) {
									enemies[0].str = dojo.number.parse(combatInfo[x].split('STRENGTH:')[1]);
									if (isNaN(enemies[0].str)) {
										console.log('Error initializing strength for ' + combatInfo[0] + '. (Not a number)!');
										enemies[0].str = 10;
									}
								}
								else if (combatInfo[x].match('DEFENSE:') != null) {
									enemies[0].def = dojo.number.parse(combatInfo[x].split('DEFENSE:')[1]);
									if (isNaN(enemies[0].def)) {
										console.log('Error initializing defense for ' + combatInfo[0] + '. (Not a number)!');
										enemies[0].def = 0;
									}
								}
								else if (combatInfo[x].match('ACCURACY:') != null) {
									enemies[0].acc = dojo.number.parse(combatInfo[x].split('ACCURACY:')[1]);
									if (isNaN(enemies[0].acc)) {
										console.log('Error initializing accuracy for ' + combatInfo[0] + '. (Not a number)!');
										enemies[0].acc = 55;
									}
								}
								else if (combatInfo[x].match('HEALTH:') != null) {
									enemies[0].health = dojo.number.parse(combatInfo[x].split('HEALTH:')[1]);
									if (isNaN(enemies[0].health)) {
										console.log('Error initializing health for ' + combatInfo[0] + '. (Not a number)!');
										enemies[0].health = 20;
									}
									enemies[0].initialHealth = enemies[0].health;
								}
								else if (combatInfo[x].match('HIT:') != null) {
									enemies[0].hitmessages[enemies[0].hitmessages.length] = combatInfo[x].split('HIT:')[1];
								}
								else if (combatInfo[x].match('MISS:') != null) {
									enemies[0].missmessages[enemies[0].missmessages.length] = combatInfo[x].split('MISS:')[1];
								}
								else if (combatInfo[x].match('RUN:') != null) {
									console.log("Run away: ") + combatInfo[x].split('RUN:')[1];
								}
								else if (combatInfo[x].match('NAME') != null) {
									//added multiple enemies by use of NAME2, NAME3, etc
									newEnemyNumber = dojo.number.parse(combatInfo[x].split('NAME')[1].split(':')[0]);
									if (!isNaN(newEnemyNumber)) {
										var newEnemy = {
											name: 'enemy',
											weapon: 'None',
											str: 10,
											def: 0,
											health: 20,
											initialHealth: 20,
											acc: 55,
											accMod: 0,
											stunned: false,
											special:[],
											hitmessages:[],
											missmessages:[]
										}
										enemies[newEnemyNumber-1] = newEnemy;
										enemies[newEnemyNumber-1].name = combatInfo[x].split('NAME')[1].split(':')[1];
									}
								}
								else if (combatInfo[x].match('WEAPON') != null) {
									newEnemyNumber = dojo.number.parse(combatInfo[x].split('WEAPON')[1].split(':')[0]);
									if (!isNaN(newEnemyNumber)) {
										if (enemies.length < newEnemyNumber) {
											console.log('Error: NAME' + newEnemyNumber + ': must be specified for this enemy.');
										} else {
											enemies[newEnemyNumber-1].weapon = combatInfo[x].split('WEAPON')[1].split(':')[1];
										}
									}
								}
								else if (combatInfo[x].match('STRENGTH') != null) {
									newEnemyNumber = dojo.number.parse(combatInfo[x].split('STRENGTH')[1].split(':')[0]);
									if (!isNaN(newEnemyNumber)) {
										if (enemies.length < newEnemyNumber) {
											console.log('Error: NAME' + newEnemyNumber + ': must be specified for this enemy.');
										} else {
											enemies[newEnemyNumber-1].str = combatInfo[x].split('STRENGTH')[1].split(':')[1];
											if (isNaN(enemies[newEnemyNumber-1].str)) {
												console.log('Error initializing strength for ' + enemies[newEnemyNumber-1].name + '. (Not a number)!');
												enemies[newEnemyNumber-1].str = 10;
											}
										}
									}
								}
								else if (combatInfo[x].match('DEFENSE') != null) {
									newEnemyNumber = dojo.number.parse(combatInfo[x].split('DEFENSE')[1].split(':')[0]);
									if (!isNaN(newEnemyNumber)) {
										if (enemies.length < newEnemyNumber) {
											console.log('Error: NAME' + newEnemyNumber + ': must be specified for this enemy.');
										} else {
											enemies[newEnemyNumber-1].def = combatInfo[x].split('DEFENSE')[1].split(':')[1];
											if (isNaN(enemies[newEnemyNumber-1].def)) {
												console.log('Error initializing defense for ' + enemies[newEnemyNumber-1].name + '. (Not a number)!');
												enemies[newEnemyNumber-1].def = 0;
											}
										}
									}
								}
								else if (combatInfo[x].match('ACCURACY') != null) {
									newEnemyNumber = dojo.number.parse(combatInfo[x].split('ACCURACY')[1].split(':')[0]);
									if (!isNaN(newEnemyNumber)) {
										if (enemies.length < newEnemyNumber) {
											console.log('Error: NAME' + newEnemyNumber + ': must be specified for this enemy.');
										} else {
											enemies[newEnemyNumber-1].acc = combatInfo[x].split('ACCURACY')[1].split(':')[1];
											if (isNaN(enemies[newEnemyNumber-1].acc)) {
												console.log('Error initializing accuracy for ' + enemies[newEnemyNumber-1].name + '. (Not a number)!');
												enemies[newEnemyNumber-1].acc = 55;
											}
										}
									}
								}
								else if (combatInfo[x].match('HEALTH') != null) {
									newEnemyNumber = dojo.number.parse(combatInfo[x].split('HEALTH')[1].split(':')[0]);
									if (!isNaN(newEnemyNumber)) {
										if (enemies.length < newEnemyNumber) {
											console.log('Error: NAME' + newEnemyNumber + ': must be specified for this enemy.');
										} else {
											enemies[newEnemyNumber-1].health = combatInfo[x].split('HEALTH')[1].split(':')[1];
											if (isNaN(enemies[newEnemyNumber-1].health)) {
												console.log('Error initializing health for ' + enemies[newEnemyNumber-1].name + '. (Not a number)!');
												enemies[newEnemyNumber-1].health = 20;
											}
											enemies[newEnemyNumber-1].initialHealth = enemies[newEnemyNumber-1].health;
										}
									}
								}
								else if (combatInfo[x].match('HIT') != null) {
									newEnemyNumber = dojo.number.parse(combatInfo[x].split('HIT')[1].split(':')[0]);
									if (!isNaN(newEnemyNumber)) {
										if (enemies.length < newEnemyNumber) {
											console.log('Error: NAME' + newEnemyNumber + ': must be specified for this enemy.');
										} else {
											enemies[newEnemyNumber-1].hitmessages[enemies[newEnemyNumber-1].hitmessages.length] = combatInfo[x].split('HIT')[1].split(':')[1];
										}
									}
								}
								else if (combatInfo[x].match('MISS') != null) {
									newEnemyNumber = dojo.number.parse(combatInfo[x].split('MISS')[1].split(':')[0]);
									if (!isNaN(newEnemyNumber)) {
										if (enemies.length < newEnemyNumber) {
											console.log('Error: NAME' + newEnemyNumber + ': must be specified for this enemy.');
										} else {
											enemies[newEnemyNumber-1].missmessages[enemies[newEnemyNumber-1].missmessages.length] = combatInfo[x].split('MISS')[1].split(':')[1];
										}
									}
								}
							}
							aliveEnemies = [];
							for (e = 0; e < enemies.length; e++) {
								if (enemies[e].health > 0) {
									aliveEnemies[e] = enemies[e];
								}
							}
							for (x = 0; x < this.possibleWeapons.length; x++) {
								for (y = 0; y < enemies.length; y++) {
									if (this.possibleWeapons[x].name == enemies[y].weapon) {
										//enemies[y].str = dojo.number.parse(enemies[y].str) + dojo.number.parse(this.possibleWeapons[x].strengthbonus);
										if (this.possibleWeapons[x].special.length != 0) {
											for (s = 0; s < this.possibleWeapons[x].special.length; s++) {
												enemies[y].special[enemies[y].special.length] = this.possibleWeapons[x].special[s];
											}
										}
									}
								}
							}
						}
						if (this.chooseWeapon == -1) {
							//just selected a weapon
							currentWeapon = availableWeapons[choiceNum - 1];
							disableFight = true;
						} else {
							disableFight = false;
						}
						if (this.inCombat == 1 && choiceNum == aliveEnemies.length+1 && this.chooseWeapon == 0) {
							//automatically fight selected
							autoFight = true;
						}
						if (this.inCombat == 1 && choiceNum == aliveEnemies.length+2 && this.chooseWeapon == 0) {
							//change weapon selected
							this.chooseWeapon = 1;
						} else {
							this.chooseWeapon = 0;
						}
						if (this.inCombat == 0 || this.chooseWeapon == 1) {
							//just entering combat, allow the user to switch weapons
							this.message = 'Choose a weapon to fight with.'
							this.js.stop();
							this.js.say({text : this.message, cache : true});
							availableWeapons = [];
							for (x = 0; x < this.possibleWeapons.length; x++) {
								for (y = 1; y < this.inventory.length; y++) {
									if (this.possibleWeapons[x].name == this.inventory[y] && this.possibleWeapons[x].type == 'weapon') {
										availableWeapons[availableWeapons.length] = this.possibleWeapons[x];
									}
								}
							}
							availableWeapons[availableWeapons.length] = this.unarmed;
							choicesArray = [];
							for (z = 0; z < availableWeapons.length; z++) {
								choicesArray[z*2] = availableWeapons[z].name;
								choicesArray[z*2+1] = this.page;
							}
							//parse shields
							availableShields = [];
							for (x = 0; x < this.possibleWeapons.length; x++) {
								for (y = 1; y < this.inventory.length; y++) {
									if (this.possibleWeapons[x].name == this.inventory[y] && this.possibleWeapons[x].type == 'shield') {
										availableShields[availableShields.length] = this.possibleWeapons[x];
									}
								}
							}
							if (availableShields.length > 1) {
								currentShield = availableShields[0];
								//automatically choose best shield
								for (z = 0; z < availableShields.length; z++) {
									if (availableShields[z].defense > currentShields.defense) {
										currentShield = availableShield[z];
									}
								}
							} else if (availableShields.length == 1) {
								currentShield = availableShields[0];
							} else {
								currentShield = "None";
							}
							//parse armor
							availableArmor = [];
							for (x = 0; x < this.possibleWeapons.length; x++) {
								for (y = 1; y < this.inventory.length; y++) {
									if (this.possibleWeapons[x].name == this.inventory[y] && this.possibleWeapons[x].type == 'armor') {
										availableArmor[availableArmor.length] = this.possibleWeapons[x];
									}
								}
							}
							if (availableArmor.length > 1) {
								currentArmor = availableArmor[0];
								//automatically choose best armor
								for (z = 0; z < availableArmor.length; z++) {
									if (availableArmor[z].defense > currentArmor.defense) {
										currentArmor = availableArmor[z];
									}
								}
							} else if (availableArmor.length == 1) {
								currentArmor = availableArmor[0];
							} else {
								currentArmor = "None";
							}
							this.chooseWeapon = -1;
							this.inCombat = 1;
						} else {
							//default for wonCombat is false, set to true if the health of all enemies goes to zero
							wonCombat = false;
							if (currentShield != "None") {
								this.message = combatInfo[0] + '.  You are using: ' + currentWeapon.name + ' and ' + currentShield.name + '. ';
							} else {
								this.message = combatInfo[0] + '.  You are using: ' + currentWeapon.name;
							}
							if (disableFight) {
								this.js.stop();
								this.js.say({text : this.message, cache : true});
							}
							if (choiceNum <= enemies.length && !disableFight) {
								for (f = 0; f < aliveEnemies.length; f++) {
									//Fight selected
									strCompare = this.strength + currentWeapon.strengthbonus - aliveEnemies[f].str;
									//k is randomly selected from 0-10.  A higher k value means that you deal more and take less damage.
									k = Math.floor(Math.random()*(10));
									//75% chance that enemy defense will reduce damage you deal
									if (Math.random() <= 0.75) {
										damageDealt = 4 + Math.round(strCompare/2) + k - aliveEnemies[f].def;
									} else {
										damageDealt = 4 + Math.round(strCompare/2) + k;
									}
									//if you are at low health, you will deal less damage
									damageDealt = damageDealt - Math.round(Math.floor(damageDealt * (1 - this.health/this.STARTING_HEALTH))/2);
									damageTaken = 4 - Math.round(strCompare/2) - Math.floor(k/2);
									if (damageDealt <= 0) {
										//always deal at least one damage, if you hit
										damageDealt = 1;
									}
									if (damageTaken < 0) {
										damageTaken = 0;
									}
									if (damageDealt == 1) {
										damageMessage = ' and barely make a scratch,'
									} else if (k < 5) {
										damageMessage = ' and inflict a minor wound,'
									} else if (k < 7) {
										damageMessage = ' and inflict a large wound,'
									} else if (k < 9) {
										damageMessage = ' and inflict a deep wound,'
									} else {
										damageMessage = ' and inflict a grave wound,'
									}
									randomNum = Math.random();
									if (randomNum <= currentWeapon.accuracy/100) {
										youHit = true;
									} else {
										youHit = false;
									}
									randomNum = Math.random();
									modifiedEnemyAcc = aliveEnemies[f].acc;
									if (currentShield != "None") {
										modifiedEnemyAcc -= 10;
									}
									if (currentArmor != "None") {
										modifiedEnemyAcc -= 5;
									}
									modifiedEnemyAcc += aliveEnemies[f].accMod;
									if (randomNum <= modifiedEnemyAcc/100) {
										enemyHit = true;
										if (aliveEnemies[f].accMod <= 0) {
											aliveEnemies[f].accMod -= 1;
										} else {
											aliveEnemies[f].accMod = 0;
										}
									} else {
										enemyHit = false;
										aliveEnemies[f].accMod += 1;
									}
									if (f == choiceNum - 1) {
										aliveEnemies[f].stunned = false;
										if (stunned) {
											combatString = combatString + ' <br>You are stunned and cannot attack.'
											stunned = false;
										}
										else if (youHit) {
											j = Math.floor(Math.random()*(currentWeapon.hitMessages.length));
											combatString = combatString + ' <br>' + currentWeapon.hitMessages[j].replace('#enemy',aliveEnemies[f].name) + damageMessage + ' dealing ' + damageDealt + ' damage.';
											aliveEnemies[f].health -= damageDealt;
											if ('Cut' in this.oc(currentWeapon.special)) {
												//if you inflicted more than a minor wound, enemy will take bleeding damage
												if (k >= 5) {
													cutDamage = Math.floor(Math.random()*(4))+1;
													aliveEnemies[f].health -= cutDamage;
													combatString = combatString + ' <br>The ' + aliveEnemies[f].name + ' loses an additional ' + cutDamage + ' health from blood loss.';
												}
											}
											if ('Blunt' in this.oc(currentWeapon.special)) {
												//if you inflicted more than a minor wound, 40% chance to stun the enemy
												if (k >= 5) {
													if (Math.random() < 0.4) {
														aliveEnemies[f].stunned = true;
													}
												}
											}
											enemyHealthFraction = aliveEnemies[f].health/aliveEnemies[f].initialHealth;
											if (enemyHealthFraction <= 0) {
												combatString = combatString + ' <br>The ' + aliveEnemies[f].name + ' collapses. '
											} else if (enemyHealthFraction < 0.1) {
												combatString = combatString + ' <br>The ' + aliveEnemies[f].name + ' looks nearly dead.'
											} else if (enemyHealthFraction < 0.2) {
												combatString = combatString + ' <br>The ' + aliveEnemies[f].name + ' looks severely wounded.'
											} else if (enemyHealthFraction < 0.3) {
												combatString = combatString + ' <br>The ' + aliveEnemies[f].name + ' looks weak.'
											} else if (enemyHealthFraction < 0.4) {
												combatString = combatString + ' <br>The ' + aliveEnemies[f].name + ' looks quite wounded.'
											} else if (enemyHealthFraction < 0.5) {
												combatString = combatString + ' <br>The ' + aliveEnemies[f].name + ' looks hurt.'
											} else if (enemyHealthFraction < 0.6) {
												combatString = combatString + ' <br>The ' + aliveEnemies[f].name + ' looks somewhat wounded.'
											} else if (enemyHealthFraction < 0.8) {
												combatString = combatString + ' <br>The ' + aliveEnemies[f].name + ' looks a little wounded.'
											} else {
												combatString = combatString + ' <br>The ' + aliveEnemies[f].name + ' looks mostly healthy.'
											}
											if (aliveEnemies[f].stunned) {
												combatString = combatString + ' <br>The ' + aliveEnemies[f].name + ' is stunned from your blow and cannot attack.';
											}
										} else {
											if (Math.random() < 0.4 || aliveEnemies[f].missmessages.length == 0) {
												j = Math.floor(Math.random()*(currentWeapon.missMessages.length));
												combatString = combatString + ' <br>' + currentWeapon.missMessages[j].replace('#enemy',aliveEnemies[f].name) + ' ';
											} else {
												j = Math.floor(Math.random()*(aliveEnemies[f].missmessages.length));
												combatString = combatString + ' <br>' + aliveEnemies[f].missmessages[j] + ' ';
											}
										}
									}
									if (enemyHit && aliveEnemies[f].health > 0 && !aliveEnemies[f].stunned) {
										j = Math.floor(Math.random()*(aliveEnemies[f].hitmessages.length));
										damageTaken = damageTaken - Math.round(Math.floor(damageTaken * (1 - enemyHealthFraction))/2);
										if (damageTaken <= 0) {
											//lose a minimum of 1 health if you are hit (unless you have armor)
											damageTaken = 1;
										}
										combatString = combatString + ' <br>' + aliveEnemies[f].hitmessages[j] + ', hitting you for ' + damageTaken + ' damage. ';
										//reduce damage from shield and armor
										if (currentShield != "None") {
											if (Math.random() <= currentShield.probability/100) {
												damageTaken -= currentShield.defense;
												if (damageTaken > 0) {
													combatString = combatString + ' <br>Your ' + currentShield.name + ' protects you from some of the damage. ';
												} else {
													combatString = combatString + ' <br>Your ' + currentShield.name + ' protects you from all of the damage. ';
												}
												//this.message = this.message + ' <br>Your ' + currentShield.name + ' has protected you from some of the damage.';
											}
										}
										if (currentArmor != "None" && damageTaken > 0) {
											if (Math.random() <= currentArmor.probability/100) {
												damageReduced = Math.floor(Math.random()*(currentArmor.defense))
												if (damageReduced == 0) {
													damageReduced = 1;
												}
												damageTaken -= damageReduced;
												if (damageTaken > 0) {
													combatString = combatString + ' <br>Your ' + currentArmor.name + ' protects you from some of the damage. ';
												} else {
													combatString = combatString + ' <br>Your ' + currentArmor.name + ' protects you from all of the damage. ';
												}
											}
										}
										if (damageTaken <= 0) {
											damageTaken = 0;
										} else {
											if ('Cut' in this.oc(aliveEnemies[f].special)) {
												//if you were damaged by a sharp weapon, you may take bleeding damage
												if (k < 5 && Math.random() < 0.5) {
													cutDamage = Math.floor(Math.random()*(4))+1;
													this.health -= cutDamage;
													totalHealthLost += cutDamage;
													combatString = combatString + ' <br>You lose an additional ' + cutDamage + ' health from blood loss.';
												}
											}
											if ('Blunt' in this.oc(aliveEnemies[f].special)) {
												//if you were damaged by a sharp weapon, you may be stunned
												if (k < 5 && Math.random() < 0.4) {
													combatString = combatString + ' <br>The blow stuns you.';
													stunned = true;
												}
											}
										}
										this.health -= damageTaken;
										totalHealthLost += damageTaken;
									} else if (aliveEnemies[f].health > 0 && !aliveEnemies[f].stunned) {
										if (currentShield != "None" && Math.random() < 0.5) {
											combatString = combatString + ' <br>You block the ' + aliveEnemies[f].name + ' with your shield. ';
										} else {
											combatString = combatString + ' <br>The ' + aliveEnemies[f].name + ' misses. ';
										}
									}

									if (this.health < 0) {
										this.health = 0;
									}
									if (f == aliveEnemies.length - 1 || this.health <= 0) {
										combatString = combatString + '<br>Health Left: ' + this.health + '/' + this.MAX_HEALTH;
									}
									if (aliveEnemies[f].health > 0) {
										combatminusbr = combatString.replace(new RegExp( '<br>', 'g' ),'');
										this.js.stop();
										this.js.say({text : combatminusbr, cache : true});
									}
									//this.message = this.message + '<br>Health Left: ' + this.health + '/' + this.MAX_HEALTH;
									if (this.health <= 0) {
										combatString = combatString + '<br>The ' + aliveEnemies[f].name + ' has killed you in combat. ';
										f = aliveEnemies.length;
										this.restart = 1;
									}
								}
								if (this.health > 0) {
									//the player has survived this round of combat
									wonCombat = true;
									aliveEnemies = [];
									for (e = 0; e < enemies.length; e++) {
										if (enemies[e].health > 0) {
											//update which enemies are still alive
											aliveEnemies[aliveEnemies.length] = enemies[e];
											wonCombat = false;
										}
									}
								}
							}
							choicesArray = [];
							for (e = 0; e < aliveEnemies.length*2; e+=2) {
								choicesArray[e] = 'Attack the ' + aliveEnemies[e/2].name;
								choicesArray[e+1] = this.page;
							}
							choicesArray[aliveEnemies.length*2] = 'Automatically fight (Skip the combat)';
							choicesArray[aliveEnemies.length*2+1] = this.page;
							choicesArray[aliveEnemies.length*2+2] = 'Change Weapon';
							choicesArray[aliveEnemies.length*2+3] = this.page;
							
							if (wonCombat) {
								combatString = combatString + '<br>' + specialPageArray[p+1];
								//see if there are any healing items
								if (this.healingItems.length > 0) {
									maxAmount = 0;
									healed = 0;
									itemName = '';
									for (h = 0; h < this.healingItems.length; h++) {
										if (this.healingItems[h].name in this.oc(this.inventory)) {
											if (this.healingItems[h].amount > maxAmount) {
												maxAmount = this.healingItems[h].amount;
												itemName = this.healingItems[h].name;
											}
										}
									}
									healed = Math.floor(totalHealthLost * maxAmount);
									if (healed > 0) {
										combatString = combatString + '<br>You use your ' + itemName.toLowerCase() + ' to recover ' + healed + ' of your lost health.'
										this.health += healed;
									}
								}
								this.inCombat = 0;
								autoFight = false;
								this.message = 'You have won the fight.';
								this.ignoreEffect = true;
							} else if (autoFight && this.health > 0) {
								this.processChoice(this.page, 1);
								combatString = '';
							}
							this.message = this.message + combatString;
						}
					}
					//LOCKPICK: num of tumblers
					else if (specialPageArray[p].match('LOCKPICK:') !=null) {
						//Check to see if I'm setting up everything for the first time
						if(this.inLockPicking==0){
							//Read # of tumblers as set by the call from the input file
							numOfTumbler = specialPageArray[p].split('LOCKPICK:');
							numOfTumblers=dojo.number.parse(numOfTumbler[1]);
							//this.message=this.message+"<br>There are " + numOfTumblers +" Tumblers in this lock";
							this.maxTumblers=numOfTumblers;
							this.tumblers= new Array(numOfTumblers);
							//console.log("created tumbler array");
							for(m=0; m<=numOfTumblers; m++){
								//Set values for the number of keypresses randomly for each tumbler dependant on the diffuculty setting
								if(this.difficulty=="Easy"){
									this.tumblers[m]=Math.ceil(Math.random()*3);
									this.maxWrong=5;
									this.maxPushes=3;
								}else if(this.difficulty=="Normal"){
									this.tumblers[m]=Math.ceil(Math.random()*6);
									this.maxWrong=10;
									this.maxPushes=6;
								}else{
									this.tumblers[m]=Math.ceil(Math.random()*9);
									this.maxWrong=15;
									this.maxPushes=9;
								}								
							}
							
							hintsArray = [];
							hintsArray1= [];
							hintsArray2= [];
							hintsArray3= [];
							hintsArray4= [];
							hintsArray5= [];
							hintsArray6= [];
							hintsArray7= [];
							hintsArray8= [];
							hintsArray9= [];
							
							hintsArray[1]=hintsArray1;
							hintsArray[2]=hintsArray2;
							hintsArray[3]=hintsArray3;
							hintsArray[4]=hintsArray4;
							hintsArray[5]=hintsArray5;
							hintsArray[6]=hintsArray6;
							hintsArray[7]=hintsArray7;
							hintsArray[8]=hintsArray8;
							hintsArray[9]=hintsArray9;

							
							hintsArray1[1]='Marcus Ginyard\'s number while playing basketball for the Tar Heels';
							hintsArray1[2]='Number of NCAA women\'s basketball championships won by the lady Tar Heels';
							hintsArray1[3]='The number of All-Americans on the 2007 Carolina basketball team';
							hintsArray1[4]='Number of years Marvin Williams was a Tar Heel before leaving for the NBA';
							hintsArray1[5]='The margin of victory for the Tar Heels men\'s basketball team in the 1982 championship game.';
							hintsArray1[6]='The lonliest number';
							hintsArray1[7]='Margin of victory during Dean Smith\'s first NCAA title in 1982';
						
							
							hintsArray2[1]='Number of national championships won under UNC men\'s basketball coach Roy Williams';
							hintsArray2[2]='Raymond Felton\'s number while playing for the Tar Heel men\'s basketball team';
							hintsArray2[3]='Number of times coach Dean Smith won national coach of the year';
							hintsArray2[4]='Number of times UNC men\'s basketball team has gone undefeated for an entire season';
							hintsArray2[5]='Number of losses for the 1982 UNC mens basketball team';
							hintsArray2[6]='2';
							hintsArray2[7]='2';
														
							hintsArray3[1]='Number of Tar Heels that were drafted in the first round of the 2009 NBA draft';
							hintsArray3[2]='Number of years Ty Lawson was a Tar Heel before leaving for the NBA';
							hintsArray3[3]='Number of years Michael Jordan was a Tar Heel before leaving for the NBA';
							hintsArray3[4]='Number of movies in the Matrix series';
							hintsArray3[5]='Number of Tar Heel men\'s basketball players chosen as All-Americans in 1998';
							hintsArray3[6]='Number of overtimes that it took for Carolina to win its first NCAA title in 1954';
							hintsArray3[7]='Number of losses for the 2009 UNC men\'s basketball team';
							
							
							hintsArray4[1]='Number of Tar Heels that were drafted in the first round of the 2007 NBA draft';
							hintsArray4[2]='Number of years Phil Ford was a Tar Heel before leaving for the NBA';
							hintsArray4[3]='The number that was in the name of UNC a very famous offense ran by UNC and Phil Ford that dealt with holding the ball until the opposing defense conceeded an easy basketball';
							hintsArray4[4]='Average number of conference losses per year for men\'s basketball coach Dean Smith.';
							hintsArray4[5]='Number of losses for the 2005 UNC men\'s basketball team';
							hintsArray4[6]='Number of times UNC men\'s lacrosse team has won the NCAA national championship';
							hintsArray4[7]='4';
							
							hintsArray5[1]='Total number of NCAA national championships won by the UNC men\'s basketball team';
							hintsArray5[2]='Ty Lawson\'s average number of assists per game over his career as a Tar Heel';
							hintsArray5[3]='Number of times the UNC men\'s basketball team has finished 1st in both the AP and Coaches poll';
							hintsArray5[4]='The margin of victory for the UNC men\'s basketball team in the 2005 national championship game';
							hintsArray5[5]='Number of UNC wrestlers that have been crowned national champions in their weight class';
							hintsArray5[6]='5';
							hintsArray5[7]='5';
														
							hintsArray6[1]='Number of times the UNC basketball team has been crowned champions of men\'s basketball';
							hintsArray6[2]='Ty Lawson\'s average number assists per game over his career as a Tar Heel';
							hintsArray6[3]='Number of movies in the Star Wars saga.';
							hintsArray6[4]='Margin of victory for UNC men\'s basketball team during the 1993 NCAA championship game';
							hintsArray6[5]='Number of times the UNC women\'s field hockey team has won the NCAA national championship';
							hintsArray6[6]='The number of strings on a standard guitar';
							hintsArray6[7]='The number of points recieved for a touchdown in american football';
							
							
							hintsArray7[1]='Average number of losses per year for men\'s basketball coach Dean Smith';
							hintsArray7[2]='The number of deadly sins';
							hintsArray7[3]='Record for the highest number of steals in ACC tournament game by a Tar Heel, set by Dudley Bradley in 1979, against Duke';
							hintsArray7[4]='Number of years in which the UNC women\'s soccer team did NOT win the national championship';
							hintsArray7[5]='Number of years a typical student attends Hogwarts in the book series Harry Potter';
							hintsArray7[6]='7';
							hintsArray7[7]='7';
														
							hintsArray8[1]='The number of wins(in hundreds i.e. 235->2, 656->6, etc.) that Dean Smith had before retiring in 1998';
							hintsArray8[2]='The number of points scored in the final 17 seconds of the game to send the game to overtime against Duke in 1979';
							hintsArray8[3]='Number of UNC men\'s basketball players that have been named ACC Rookie of the Year.';
							hintsArray8[4]='Number of times coach Dean Smith won ACC coach of the year';
							hintsArray8[5]='Record for the fewest points scored in a single game by a Tar Heel men\'s basketball team';
							hintsArray8[6]='8';
							hintsArray8[7]='8';
							
							
							hintsArray9[1]='Tyler Hansborough\'s average number of rebounds per game ove rhis career as a Tar Heel';
							hintsArray9[2]='Number of UNC basketball players/coaches who have been inducted in the basketball hall of fame';
							hintsArray9[3]='Highest number of steals in a single game ever for a Tar Heel, set by Derrick Phelps in 1992, against Georgia Tech';
							hintsArray9[4]='Number of UNC women swimmers that won national championships in at least one event';
							hintsArray9[5]='The number of innings in a typical baseball game';
							hintsArray9[6]='The square root of 144 divided by 4 and then multiplied by 3';
							hintsArray9[7]='9';
														
							this.inLockPicking=1;
							choicesArray = [];
							this.message=this.message+"<br><br>You are currently picking Tumbler #<b>"+(this.currentTumbler) +"</b> of <b>"+numOfTumblers;
							this.message=this.message+"</b>.  You have pushed this tumbler <b>"+(this.currentPushes)+ "</b> time(s).  ";
							this.message=this.message+"Each tumbler can be pressed a maximum of <b>"+this.maxPushes+"</b> times.<br>";
							this.message=this.message+"<br>You have <b>"+this.maxWrong+"</b> attempts left to check tumblers in this lock.<br>";
							//Find a hint for the current tumbler						
							curhintArray=hintsArray[this.tumblers[this.currentTumbler-1]];
							this.hint=curhintArray[Math.ceil(Math.random()*7)];
							//Add it to the message
							this.message=this.message+"<br><b>HINT:"+this.hint+"</b>";
							
							choicesArray[0]='Pick tumbler '+this.currentTumbler;
							choicesArray[1]=this.page;
							choicesArray[2]='Check tumbler '+this.currentTumbler;
							choicesArray[3]=this.page;
							choicesArray[4]='Start this Tumbler over';
							choicesArray[5]=this.page;
							choicesArray[6]='Skip Lock-picking Game';
							choicesArray[7]=this.page;
						
						//Return after button hit
						}else{
							//Choose to pick the tumbler once
							if(choiceNum==1){
								//Check to make sure we haven't reached the max pushes
								if(this.currentPushes!=this.maxPushes){
									this.currentPushes+=1;
									this.message=this.message+"<br><br>You are currently picking Tumbler #<b>"+(this.currentTumbler) +"</b> of <b>"+this.maxTumblers;
									this.message=this.message+"</b>.  You have pushed this tumbler <b>"+(this.currentPushes)+ "</b> time(s).  ";
									this.message=this.message+"Each tumbler can be pressed a maximum of <b>"+this.maxPushes+"</b> times.<br>";
									this.message=this.message+"<br>You have <b>"+this.maxWrong+"</b> attempts left to check tumblers in this lock.<br>";
									this.message=this.message+"<br><b>HINT:"+this.hint+"</b>";
								//Circle back to 1 push after hitting max
								}else{
									this.currentPushes=1;
									this.message=this.message+"<br><br>You are currently picking Tumbler #<b>"+(this.currentTumbler) +"</b> of <b>"+this.maxTumblers;
									this.message=this.message+"</b>.  You have pushed this tumbler <b>"+(this.currentPushes)+ "</b> time(s).  ";
									this.message=this.message+"Each tumbler can be pressed a maximum of <b>"+this.maxPushes+"</b> times.<br>";
									this.message=this.message+"<br>You have <b>"+this.maxWrong+"</b> attempts left to check tumblers in this lock.<br>";
									this.message=this.message+"<br><b>HINT:"+this.hint+"</b>";
								}
								
							//Choose to check current pushes
							}else if(choiceNum==2){
								//Correct number of pushes for that tumbler
								if(this.currentPushes==this.tumblers[this.currentTumbler-1]){
									//Move to next tumbler
									this.currentTumbler++;
									this.message=this.message+"<br><br>You successfully opened this tumbler!<br>";	
									this.message=this.message+"<br>You are currently picking Tumbler #<b>"+(this.currentTumbler) +"</b> of <b>"+this.maxTumblers;
									this.message=this.message+".</b>  You have pushed this tumbler <b>"+(this.currentPushes)+ "</b> time(s).  ";
									this.message=this.message+"Each tumbler can be pressed a maximum of <b>"+this.maxPushes+"</b> times<br>";
									this.message=this.message+"<br>You have <b>"+this.maxWrong+"</b> attempts left to check tumblers in this lock.<br>";
									curhintArray=hintsArray[this.tumblers[this.currentTumbler-1]];
									this.hint=curhintArray[Math.ceil(Math.random()*7)];
									this.message=this.message+"<br><b>HINT:"+this.hint+"</b>";
									
									//Check to see if we are done
									if(this.currentTumbler<=this.maxTumblers){
										this.currentPushes=0;
										choicesArray[0]='Pick tumbler '+this.currentTumbler;
										choicesArray[1]=this.page;
										choicesArray[2]='Check tumbler '+this.currentTumbler;
										choicesArray[3]=this.page;
									//End case
									}else{
										this.currentPushes=0;
										this.currentTumbler=0;
										this.inLockPicking=0;
										this.message="Congratulations! You picked the lock!";
									}
								//Incorrect Pushes for the that tumbler
								}else{
									//Take away one of the attempts
									this.maxWrong--;
									//In this case, they have run out of attempts
									if(this.maxWrong==0){
										this.message="You have failed at picking this lock";
										this.inLockPicking=0;
									//Otherwise tell them its wrong and try again
									}else{
										this.message=this.message+"<br><br>This is the incorrect number of pushes for this tumbler!  Please Try Again!<br>"
										this.message=this.message+"<br>You are currently picking Tumbler #<b>"+(this.currentTumbler)+"</b> of <b>"+this.maxTumblers;
										this.message=this.message+"</b>.  You have pushed this tumbler <b>"+(this.currentPushes)+ "</b> time(s).  ";
										this.message=this.message+"Each tumbler can be pressed a maximum of <b>"+this.maxPushes+"</b> times<br>";
										this.message=this.message+"<br>You have <b>"+this.maxWrong+"</b> attempts left to check tumblers in this lock.<br>";
										this.message=this.message+"<br><b>HINT:"+this.hint+"</b>";
									}
								}
							//Choose to start the current tumbler over, does not reset max wrong
							}else if(choiceNum==3){
								this.currentPushes=0;
								this.message=this.message+"<br><br>You are currently picking Tumbler #"+(this.currentTumbler)+" of "+this.maxTumblers;
								this.message=this.message+".  You have pushed this tumbler "+(this.currentPushes)+ " time(s).  ";
								this.message=this.message+"Each tumbler can be pressed a maximum of "+this.maxPushes+" times";
								this.message=this.message+"<br>You have "+this.maxWrong+" attempts left to check tumblers in this lock.<br>";
								this.message=this.message+"<br><b>HINT:"+this.hint+"</b>";
							}else if(choiceNum==4){
								this.currentPushes=0;
								this.currentTumbler=0;
								this.inLockPicking=0;
								this.message="Congratulations! You picked the lock!";
							}
							
						}
					}
					
					//Maze:  This implements a randomized maze
					else if (specialPageArray[p].match('MAZE:') !=null) {
					//Prelim and First Run, inMaze is default 0.
					if(this.inMaze==0){
						//Parse messages for maze rooms
						MazeText=specialPageArray[p].split('MAZE:')[1].split(',MESSAGE:');
						this.message=specialPageArray[specialPageArray.length-1];
						//set default maze size and adjust it according to game difficulty level.
						mazeSize=4;
						if(this.difficulty=='Easy')
							{mazeSize=3;}
						if(this.difficulty=='Normal')
							{mazeSize=4;}
						if(this.difficulty=='Hard')
							{mazeSize=5;}

						//Populate the 2D Array with doors ramdomly stripping out any repeats until it reaches bottom right cell of array.
						MazeArray = [];
						row=0;
						col=0;
						mazeRow=0;
						mazeCol=0;
						for(i=0; i<=mazeSize;i++){
							MazeArray[i] =[];
							for(p=0; p<=mazeSize-1;p++){
								MazeArray[i][p]="";
							}
						}
						while(row !=mazeSize-1 || col!=mazeSize-1)
						{
							temp=Math.ceil(Math.random()*4);
							if(temp==1){
								if(row!=0){
									if(MazeArray[row][col].indexOf('N')==-1){
										MazeArray[row][col]+='N';
									}
									row--;
									if(MazeArray[row][col].indexOf('S')==-1){
									MazeArray[row][col]+='S';
									}
								}
							}
							else if(temp==2){
								if(col!=mazeSize-1){
								if(MazeArray[row][col].indexOf('E')==-1){
									MazeArray[row][col]+='E';
									}
									col++;
									if(MazeArray[row][col].indexOf('W')==-1){
									MazeArray[row][col]+='W';
									}
								}
							}
							else if(temp==3){
								if(row!=mazeSize-1){
								if(MazeArray[row][col].indexOf('S')==-1){
								MazeArray[row][col]+='S';
								}
								row++;
								if(MazeArray[row][col].indexOf('N')==-1){
								MazeArray[row][col]+='N';
								}
								}
							}
							else if(temp==4){
								if(col!=0){
								if(MazeArray[row][col].indexOf('W')==-1){
								MazeArray[row][col]+='W';
								}
								col--;
								if(MazeArray[row][col].indexOf('E')==-1){
								MazeArray[row][col]+='E';
								}
								}
							}
						}
						//Sort the cells so that NESW appear in that order.
						for(i=0; i<=mazeSize;i++){
							for(p=0; p<=mazeSize-1;p++){
							tempStr="";
							if(MazeArray[i][p].indexOf('N')!=-1){
								tempStr+='N'
							}
							if(MazeArray[i][p].indexOf('E')!=-1){
								tempStr+='E'
							}
							if(MazeArray[i][p].indexOf('S')!=-1){
								tempStr+='S'
							}
							if(MazeArray[i][p].indexOf('W')!=-1){
								tempStr+='W'
							}
							MazeArray[i][p]=tempStr;
							}
						}
						//Putting custom choices in the array for Maze navigation
						choicesArray = [];
							if(mazeRow==mazeSize-1 && mazeCol==mazeSize-1)
							{
								this.message='YOU WIN';
							}
							for(i=0; i<MazeArray[mazeRow][mazeCol].length; i++)
								{
								dir='';
								if(MazeArray[mazeRow][mazeCol].charAt(i)=='N')
									{dir='North';}
								if(MazeArray[mazeRow][mazeCol].charAt(i)=='E')
									{dir='East';}
								if(MazeArray[mazeRow][mazeCol].charAt(i)=='S')
									{dir='South';}
								if(MazeArray[mazeRow][mazeCol].charAt(i)=='W')
									{dir='West';}
								choicesArray[i*2] ='Go to your ' + dir;
								choicesArray[i*2+1] =this.page;
								}
						//Prints the Maze array to the Console
						for (m=0; m<MazeArray.length-1; m++)
							{
							console.log(MazeArray[m]);
							}
						this.inMaze=1;
						}
						//Every subsequent run through the maze code
						else
						{	
							//On Button press, update which cell of maze player is currently in
							if(MazeArray[mazeRow][mazeCol].charAt(choiceNum-1)=='N')
								{
									mazeRow--;
								}
							else if(MazeArray[mazeRow][mazeCol].charAt(choiceNum-1)=='E')
								{
									mazeCol++;
								}
							else if(MazeArray[mazeRow][mazeCol].charAt(choiceNum-1)=='S')
								{
									mazeRow++;
								}
							else if(MazeArray[mazeRow][mazeCol].charAt(choiceNum-1)=='W')
								{
									mazeCol--;
								}
							//Putting custom choices in the array for Maze navigation
							choicesArray = [];
							//Randomly choose one of the messages read in from the input file and put it on the page
							temp=Math.ceil(Math.random()*MazeText.length-1);
							this.message=MazeText[temp];

							if(mazeRow==mazeSize-1 && mazeCol==mazeSize-1)
							{
								this.message='YOU WIN';
								this.inMaze=0;
							}
							//poulate the array of choices with the correct direction options
							for(i=0; i<MazeArray[mazeRow][mazeCol].length; i++)
								{
								dir='';
								if(MazeArray[mazeRow][mazeCol].charAt(i)=='N')
									{dir='North';}
								if(MazeArray[mazeRow][mazeCol].charAt(i)=='E')
									{dir='East';}
								if(MazeArray[mazeRow][mazeCol].charAt(i)=='S')
									{dir='South';}
								if(MazeArray[mazeRow][mazeCol].charAt(i)=='W')
									{dir='West';}
								choicesArray[i*2] ='Go to your ' + dir;
								choicesArray[i*2+1] =this.page;
								}
						}
						
					}
					
					//SAFECRACK:abortPage
					else if(specialPageArray[p].match('SAFECRACK:') != null) {
						
						if(this.inSafeCracking==0){
							//this.hasCombo = specialPageArray[p].split('SAFECRACK:');
							//this.hasCombo2 = dojo.number.parse(this.hasCombo[1]);
							//if(this.hasCombo[1]=="true")
							//	this.hasCombo = 1;
							
							this.inSafeCracking = 1;
							//num = new Array(3);
							
							for(i=0;i<3;i++){
								if(this.difficulty=="Easy"){
									this.maxNum=20;
									this.num[i] = Math.floor(Math.random()*this.maxNum);
									this.damage = 5;
								}else{
									if(this.difficulty=="Normal"){
										this.maxNum = 40;
										this.num[i] = Math.floor(Math.random()*this.maxNum);
										this.damage = 10;
									}else{
										this.maxNum = 60;
										this.num[i] = Math.floor(Math.random()*this.maxNum);
										this.damage = 15;
									}
								}
								
							}
							
							for(i=0;i<this.inventory.length;i++){
								if(this.inventory[i]=="Combination"){
									this.hasCombo++;
								}
							}
							if(this.hasCombo>0){
								this.message += "You have " + this.hasCombo + " combination(s) to the safe.<br>" 
								this.display[0] = Math.floor(Math.random()*3);
								this.display[1]=Math.floor(Math.random()*3);
								this.display[2]=Math.floor(Math.random()*3);
								while(this.display[1] == this.display[0])
									this.display[1]=Math.floor(Math.random()*3);
								while(this.display[2] == this.display[0] || this.display[2] == this.display[1])
									this.display[2]=Math.floor(Math.random()*3);
								this.message= this.message+this.num[this.display[0]]+" is one part of the combination<br>";
								if(this.hasCombo>1)
									this.message= this.message+this.num[this.display[1]]+" is another<br>";
								if(this.hasCombo>2)
									this.message= this.message+this.num[this.display[2]]+" is another<br>";
							}
							
							this.currentNum = 0;
							choicesArray = [];
							choicesArray[0]='Turn dial right by 1';
							choicesArray[1]=this.page;
							choicesArray[2]='Turn dial right by 3';
							choicesArray[3]=this.page;
							choicesArray[4]='Turn dial right by 5';
							choicesArray[5]=this.page;
							choicesArray[6]='Turn dial right by 10';
							choicesArray[7]=this.page;
							choicesArray[8]='Turn dial right by 20';
							choicesArray[9]=this.page;
							choicesArray[10]='Check number ' + (this.checked+1);
							choicesArray[11]=this.page;
							choicesArray[12]='Abort';
							choicesArray[13]=this.page;
						}
						else{
							//this.message+=" " + choiceNum + " ";
							if(this.hasCombo>0){
								this.message += "You have " + this.hasCombo + " combination(s) to the safe.<br>"
								this.message= this.message+this.num[this.display[0]]+" is one part of the combination<br>";
								if(this.hasCombo>1)
									this.message= this.message+this.num[this.display[1]]+" is another<br>";
								if(this.hasCombo>2)
									this.message= this.message+this.num[this.display[2]]+" is another<br>";
							}
							if(this.checked==0 || this.checked==2){
								choicesArray = [];
								choicesArray[0]='Turn dial right by 1';
								choicesArray[1]=this.page;
								choicesArray[2]='Turn dial right by 3';
								choicesArray[3]=this.page;
								choicesArray[4]='Turn dial right by 5';
								choicesArray[5]=this.page;
								choicesArray[6]='Turn dial right by 10';
								choicesArray[7]=this.page;
								choicesArray[8]='Turn dial right by 20';
								choicesArray[9]=this.page;
								choicesArray[10]='Check number ' + (this.checked+1);
								choicesArray[11]=this.page;
								choicesArray[12]='Abort';
								choicesArray[13]=this.page;
								if(choiceNum<=5)
								{
									if(choiceNum<3){
										if(choiceNum<2){
											this.currentNum = (this.currentNum+1)%this.maxNum;
										}else{
											this.currentNum = (this.currentNum+3)%this.maxNum;
										}
									}else{
										if(choiceNum<4){
											this.currentNum = (this.currentNum+5)%this.maxNum;
										}else{
											if(choiceNum<5){
												this.currentNum = (this.currentNum+10)%this.maxNum;
											}else{
												this.currentNum = (this.currentNum+20)%this.maxNum;
											}
										}
									}
								}
							}
							else{
								choicesArray = [];
								choicesArray[0]='Turn dial left by 1';
								choicesArray[1]=this.page;
								choicesArray[2]='Turn dial left by 3';
								choicesArray[3]=this.page;
								choicesArray[4]='Turn dial left by 5';
								choicesArray[5]=this.page;
								choicesArray[6]='Turn dial left by 10';
								choicesArray[7]=this.page;
								choicesArray[8]='Turn dial left by 20';
								choicesArray[9]=this.page;
								choicesArray[10]='Check number ' + (this.checked+1);
								choicesArray[11]=this.page;
								choicesArray[12]='Abort';
								choicesArray[13]=this.page;
								if(choiceNum<=5)
								{
									if(choiceNum<3){
										if(choiceNum<2){
											this.currentNum = Math.abs((this.currentNum-1+this.maxNum)%this.maxNum);
										}else{
											this.currentNum = Math.abs((this.currentNum-3+this.maxNum)%this.maxNum);
										}
									}else{
										if(choiceNum<4){
											this.currentNum = Math.abs((this.currentNum-5+this.maxNum)%this.maxNum);
										}else{
											if(choiceNum<5){
												this.currentNum = Math.abs((this.currentNum-10+this.maxNum)%this.maxNum);
											}else{
												this.currentNum = Math.abs((this.currentNum-20+this.maxNum)%this.maxNum);
											}
										}
									}
								}
							}
							
							if(choiceNum==6){
								if(this.currentNum==this.num[this.checked]){
									this.checked++;
									this.message += "You have successfully cracked the number! <br>";
									if(this.checked==this.num.length){
										this.inSafeCracking = 0;
										this.checked=0;
										this.message = "You have successfully cracked the safe! <br>";
									}
									else
									{
										if(this.checked == 1){
											choicesArray = [];
											choicesArray[0]='Turn dial left by 1';
											choicesArray[1]=this.page;
											choicesArray[2]='Turn dial left by 3';
											choicesArray[3]=this.page;
											choicesArray[4]='Turn dial left by 5';
											choicesArray[5]=this.page;
											choicesArray[6]='Turn dial left by 10';
											choicesArray[7]=this.page;
											choicesArray[8]='Turn dial left by 20';
											choicesArray[9]=this.page;
										}else
										{
											choicesArray = [];
											choicesArray[0]='Turn dial right by 1';
											choicesArray[1]=this.page;
											choicesArray[2]='Turn dial right by 3';
											choicesArray[3]=this.page;
											choicesArray[4]='Turn dial right by 5';
											choicesArray[5]=this.page;
											choicesArray[6]='Turn dial right by 10';
											choicesArray[7]=this.page;
											choicesArray[8]='Turn dial right by 20';
											choicesArray[9]=this.page;
										}
										choicesArray[10]='Check number ' + (this.checked+1);
										choicesArray[11]=this.page;
										choicesArray[12]='Abort';
										choicesArray[13]=this.page;
									}
								}else{
									this.health -= this.damage;
									this.message += "Please try again.<br>";
								}
							}
							
						}
						passedCheck = false;
						if(choiceNum==7){
							passedCheck = true;
						}
						if (passedCheck) {
							// abort safecracking, redirect to first page
							var abortPage = specialPageArray[p].split('SAFECRACK:');
							this.inSafeCracking = 0;
							this.checked=0;
							this.page = abortPage[1];
							this.processChoice(this.page,0);
							return;
						}
						if(this.inSafeCracking != 0){
							this.message+="The max number on this dial is " + this.maxNum + "<br>";
							this.message += "The dial is on " + this.currentNum + "<br>";
						}
						
						if(this.health<= 0){
							this.inSafeCracking = 0;
							this.checked=0;
							this.message = "You have failed cracked the safe! <br>";
							this.restart = 1;
						}
					}
					
					//restart the game on next button press with RESTART
					else if (specialPageArray[p].match('RESTART:') != null) {
						//this.message = specialPageArray[p+1];
						this.restart = 1;
					}
					else {
						//the special command was not found, so display it in the message (this should not happen)
						//this.message = specialPageArray[p];
					}
				}
			}
			//End special pages testing
			if (this.restart == 0) {
				//if you are in inventory selection mode, a minigame or combat mode, you are overriding the choice selection
				if (this.invselect == 0 && this.inCombat == 0 && this.inLockPicking==0 && this.inSafeCracking==0 && this.inMaze==0) {
					//Special commands for choices:
					//DISPLAYIF:item1,item2,...,text  Only display this choice if all listed items are in inventory
					//DISPLAYIFNOT:item1,item2,...,text  Only display this choice if none of the listed items are in the inventory
					//DISPLAYIFVAR:variable,value,text  Only display this choice if variable = value
					//DISPLAYIFNOTVAR:variable,value,text  Only display this choice if variable != value
					choicesArray = [];
					tempChoicesArray = this.choices[this.page].split(this.DELIMITER);
					t = 0;
					for (r = 0; r < tempChoicesArray.length; r+=2) {
						if (tempChoicesArray[r].indexOf('DISPLAYIFNOTVAR:') == 0) {
							varSplit = tempChoicesArray[r].split('DISPLAYIFNOTVAR:')[1].split(',');
							passedCheck = false;
							for (y = 0; y < this.variableList.length; y++) {
								if (this.variableList[y].name == varSplit[0]) {
									if (this.variableList[y].value == varSplit[1]) {
										passedCheck = true;
									}
								}
							}
							if (passedCheck) {
								//passed variable check, so do not display the choice
							} else {
								//failed variable check, so display the choice
								choicesArray[t] = varSplit[2];
								choicesArray[t+1] = tempChoicesArray[r+1];
								t += 2;
							}
						} else if (tempChoicesArray[r].indexOf('DISPLAYIFNOT:') == 0) {
							inventoryCheckArray = tempChoicesArray[r].split('DISPLAYIFNOT:')[1].split(',');
							passedCheck = true;
							for (i = 0; i < inventoryCheckArray.length-1; i++) {
								if (inventoryCheckArray[i] in this.oc(this.inventory)) {
									//item is in inventory, will not display choice
									passedCheck = false;
								} else {
									//item is not in inventory, passedCheck remains true
								}
							}
							if (passedCheck) {
								//all items in inventory, display choice
								//choice text is the last comma parameter of DISPLAYIF
								choicesArray[t] = inventoryCheckArray[inventoryCheckArray.length-1];
								choicesArray[t+1] = tempChoicesArray[r+1];
								t += 2;
							} else {
								//failed inventory check, do not display
							}
						} else if (tempChoicesArray[r].indexOf('DISPLAYIFVAR:') == 0) {
							varSplit = tempChoicesArray[r].split('DISPLAYIFVAR:')[1].split(',');
							passedCheck = false;
							for (y = 0; y < this.variableList.length; y++) {
								if (this.variableList[y].name == varSplit[0]) {
									if (this.variableList[y].value == varSplit[1]) {
										passedCheck = true;
									}
								}
							}
							if (passedCheck) {
								//passed variable check, display the choice
								choicesArray[t] = varSplit[2];
								choicesArray[t+1] = tempChoicesArray[r+1];
								t += 2
							} else {
								//failed variable check, do not display the choice
							}
						} else if (tempChoicesArray[r].indexOf('DISPLAYIF:') == 0) {
							inventoryCheckArray = tempChoicesArray[r].split('DISPLAYIF:')[1].split(',');
							passedCheck = true;
							for (i = 0; i < inventoryCheckArray.length-1; i++) {
								if (inventoryCheckArray[i] in this.oc(this.inventory)) {
									//item is in inventory, passedCheck remains true
								} else {
									//item is not in inventory, will not display choice
									passedCheck = false;
								}
							}
							if (passedCheck) {
								//all items in inventory, display choice
								//choice text is the last comma parameter of DISPLAYIF
								choicesArray[t] = inventoryCheckArray[inventoryCheckArray.length-1];
								choicesArray[t+1] = tempChoicesArray[r+1];
								t += 2;
							} else {
								//failed inventory check, do not display
							}
						} else {
							//no special commands
							choicesArray[t] = tempChoicesArray[r];
							choicesArray[t+1] = tempChoicesArray[r+1];
							t += 2;
						}
					}
				}
			} else {
				//only possible choice is to restart the game
				//if (this.inCombat == 1 || this.inSafeCracking == 1) {
				if (dojo.hash() == '') {
					choicesArray = ['Restart',1];
				} else {
				//if there is a saved game, there is an option to load it
					choicesArray = ['Restart',1,'Load Game'];
				}
				this.health = 0;
				this.drawHealthBar(this.health);
			}
			this.refreshAll();
		}
	},
	//oc converts an array into an object, to use with the "in" javascript command
	oc: function(a) {
		var o = {};
		for(var i=0;i<a.length;i++)
		{
			o[a[i]]='';
		}
		return o;
	},
	//update the choice buttons and display message.  Also read all text and draw on the canvas.
	refreshAll: function() {
		//delete all choices buttons
		dojo.empty(this.buttonDiv);
		this.buttons = [];
		//make new choice buttons
		this.createButtons(choicesArray);
		//don't keep replaying text when in inventory selection mode (but do play text the first time)
		if (this.invselect == 1) {
			if (this.invselecting == 0) {
				this.invselecting = 1;
			} else {
				this.invselecting = 2;
			}
		} else {
			this.invselecting = 0;
		}
		if (this.invselecting != 2) {
			//read off page text and buttons
			this._focusReread();
			this.runJSonic();
		}
		this.displayMessage.innerHTML = this.message;
		//update URL bar with the dojo hash function
		//if (this.inCombat == 0 && this.inMaze == 0 && this.inLockPicking == 0 && this.invselect == 0 && this.restart == 0) {
			//this.updateHash();
		//}
		this.drawAll();
	},
	runJSonic: function() {
		if (this.inCombat == 0 || this.reread == 1) {
			this.js.stop();
		}
		this.js.setProperty({name: "rate", value: this.sonicRate});
		//don't let JSonic read the <br> tag
		if (this.inCombat == 0 || this.reread == 1) {
			messageminusbr = this.message.replace(new RegExp( '<br>', 'g' ),'');
			this.js.say({text : messageminusbr, cache : true});
		}
		this.reread = 0;
		//choicesString = messageminusbr + '  Your choices are: ';
		choicesString = 'Your choices are: ';
		//this.js.say({text : 'Your choices are', cache : true});
		for (i = 0 ; i < choicesArray.length; i+=2) {
			if (choicesArray[i] != null && choicesArray[i] != '') {
				//remove br tag from choices text
				choicesminusbr = choicesArray[i].replace(new RegExp( '<br>', 'g' ),'');
				choicesString = choicesString + choicesminusbr + ".  ";
				//this.js.say({text : choicesminusbr, cache : true});
			}
		}
		choicesString = choicesString + this.settings.label + '.  ' + this.rereadText.label;
		//this.js.say({text : 'Read text again', cache : true});
		this.js.say({text : choicesString, cache : true});
	},
	muteJSonic: function() {
		this.js.stop();
		if (this.sonicVolume == 0.0) {
			this.js.setProperty({name: "volume", value: 1.0});
			this.sonicVolume = 1.0;
			this.runJSonic();
		} else {
			this.js.setProperty({name: "volume", value: 0.0});
			this.sonicVolume = 0.0;
		}
	},
	speedUpJSonic: function() {
		this.sonicRate += 50;
		this.runJSonic();
	},
	slowDownJSonic: function() {
		this.sonicRate -= 50;
		this.runJSonic();
	},
	//save all data to the URL bar with dojo.hash
	updateHash: function() {
		HASHDELIM = '%&';
		hashString = '';
		if (this.ignoreEffect) {
			hashString = hashString + 'ignoreEffect';
			this.ignoreEffect = false;
		} else {
			hashString = hashString + Math.random();
		}
		hashString = hashString + HASHDELIM;
		for (i = 1; i < this.inventory.length; i++) {
			//hash all inventory items
			hashString = hashString + this.inventory[i];
			hashString = hashString + HASHDELIM;
		}
		hashString = hashString + 'EndInventory';
		hashString = hashString + HASHDELIM;
		hashString = hashString + this.page;
		hashString = hashString + HASHDELIM;
		hashString = hashString + this.health;
		hashString = hashString + HASHDELIM;
		hashString = hashString + this.strength;
		hashString = hashString + HASHDELIM;
		hashString = hashString + this.gold;
		hashString = hashString + HASHDELIM;
		hashString = hashString + this.MAX_HEALTH;
		hashString = hashString + HASHDELIM;		
		for (i = 0; i < this.variableList.length; i++) {
			//hash all external variables
			hashString = hashString + this.variableList[i].value;
			hashString = hashString + HASHDELIM;
		}
		converted = '';
		for (i = 0; i < hashString.length; i++) {
			converted = converted + (hashString.charCodeAt(i)) + '&';
		}
		dojo.hash(converted);
	},
	//load data from the URL bar
	loadHash: function() {
		hashValue = dojo.hash();
		hashSplit = hashValue.split('&');
		converted = '';
		for (i = 0; i < hashSplit.length; i++) {
			converted = converted + String.fromCharCode(hashSplit[i]);
		}
		
		HASHDELIM = '%&';
		hashInvSplit = converted.split('EndInventory')[0].split(HASHDELIM);
		hashVarSplit = converted.split('EndInventory')[1].split(HASHDELIM);
		if (hashInvSplit[0] == 'ignoreEffect') {
			this.loadHashIgnore = true;
		}
		//unconvert inventory items (if any)
		this.inventory = [];
		this.inventory[0] = 'Inventory';
		if (hashInvSplit.length > 2) {
			//i = 0 is a random number and i = hashSplitOne.length - 1 is a null string, so discard those
			for (i = 1; i < hashInvSplit.length-1; i++) {
				if (hashInvSplit != '') {
					this.inventory[this.inventory.length] = hashInvSplit[i];
				}
			}
		}
		this.page = hashVarSplit[1];
		this.health = dojo.number.parse(hashVarSplit[2]);
		this.strength = dojo.number.parse(hashVarSplit[3]);
		this.gold = dojo.number.parse(hashVarSplit[4]);
		this.MAX_HEALTH = dojo.number.parse(hashVarSplit[5]);
		for (i = 6; i < hashVarSplit.length-1; i++) {
			this.variableList[i-6].value = hashVarSplit[i];
		}
	},
	//create buttons and place them.  Parameter inputArray: array of choices for this page
	createButtons: function(inputArray) {
		for(var i = 0; i < inputArray.length; i+=2) {
			var b = new dijit.form.Button({ label: inputArray[i] });
			this.connect(b, 'onClick', dojo.hitch(this,"_onClick",i/2+1));
			this.buttons.push(b);
			dojo.place(b.domNode, this.buttonDiv);
			dojo.create('br', null, this.buttonDiv);
		}
	},
	//draw images on the html5 canvas
	drawAll: function() {
		this.clearCanvas();		
		this.drawHealthBar(this.health);
		if (this.images[this.page] != null) {
			this.drawImage(this.images[this.page]);
		}
	},
	drawHealthBar: function(currentHealth) {
		if (this.MAX_HEALTH > 0) {
			//only draw the health bar if health is enabled in this adventure
			var canvas = dojo.byId("canvas");
			var ctx = canvas.getContext("2d");
			MAX_WIDTH = canvas.width;
			MAX_HEIGHT = canvas.height;
			HEALTHBAR_HEIGHT = 20;
			HEALTHBAR_WIDTH = 0.5 * MAX_WIDTH;
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillRect(0,0,HEALTHBAR_WIDTH,HEALTHBAR_HEIGHT);
			ctx.fillStyle = "rgb(0,128,0)";
			proportion = currentHealth/this.MAX_HEALTH;
			ctx.fillRect(0,0,proportion * HEALTHBAR_WIDTH,HEALTHBAR_HEIGHT);
			//add notification text
			ctx.fillStyle = 'rgb(255,255,255)';
			ctx.font = '20px sans-serif';
			ctx.textBaseline = 'top';
			ctx.fillText("Current Health:" + currentHealth +"/"+this.MAX_HEALTH,0,0);
		}
	},
	drawImage: function(imageURL) {
		var canvas = dojo.byId("canvas");
		var ctx = canvas.getContext("2d");
		MAX_WIDTH = canvas.width;
		MAX_HEIGHT = canvas.height - (HEALTHBAR_HEIGHT + 5);
		var img = new Image();
		img.onload = function(){
			if (img.width > img.height) {
				imgScale = MAX_WIDTH / img.width;
				newWidth = MAX_WIDTH;
				newHeight = img.height * imgScale;
				ctx.drawImage(img,0,HEALTHBAR_HEIGHT + 5,newWidth,newHeight);
			} else {
				imgScale = MAX_HEIGHT / img.height;
				newWidth = img.width * imgScale;
				newHeight = MAX_HEIGHT;
				ctx.drawImage(img,0,HEALTHBAR_HEIGHT + 5,newWidth,newHeight);
			}
		}
		img.src = imageURL;
	},
	//clear the inventory and the canvas and reset health and gold
	restartGame: function() {
		this.restart = 0;
		this.MAX_HEALTH = this.STARTING_HEALTH;
		this.health = this.MAX_HEALTH;
		this.gold = this.STARTING_GOLD;
		
		this.inCombat = 0;
		
		this.inventory = [];
		this.inventory[0] = 'Inventory';
		for (i = 0; i < this.initVariableList.length; i++) {
			//reset all external variables
			this.variableList[i].value = this.initVariableList[i].value;
		}
		this.clearCanvas();
	},
	clearCanvas: function() {
        var canvas = dojo.byId("canvas");
        var ctx = canvas.getContext("2d");
		if (this.buttonDiv.style.background != "") {
			//fill canvas to the same color as the background color
			ctx.fillStyle = this.buttonDiv.style.background;
		} else {
			ctx.fillStyle = "rgb(255,255,255)";
		}
		MAX_WIDTH = canvas.width;
		MAX_HEIGHT = canvas.height;
		ctx.fillRect(0,0,MAX_WIDTH,MAX_HEIGHT);
	},
	
});