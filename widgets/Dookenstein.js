/**
* Dookenstein version 4
 */
dojo.provide('myapp.Dookenstein');
dojo.require('dijit._Widget');
dojo.require('dijit._Templated');
dojo.require('dojo.i18n');
dojo.require('dojo.number');
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
		//set starting health and gold.  Health can never go above MAX_HEALTH (default max health is 50)
		this.STARTING_HEALTH = 50;
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
			hitMessages: ['You hit your enemy'],
			missMessages: ['You miss.']
		}
		this.unarmed = defaultWeapon;
		//initialize weapons array (does not include unarmed)
		this.possibleWeapons = new Array();
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
		//if restart is set to 1, the game will reset upon the next button press
		this.restart = 0;
		//special mode for selecting multiple inventory items
		this.invselect = 0;
		//special mode for combat
		this.inCombat = 0;
		this.chooseWeapon = 0;
		this.invselecting = 0;
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
			}	else if (dataSplit[i].indexOf('SHIELD:') != -1) {
				//Parse weapon information for the case where you must fight unarmed (default:bare hands)
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
			else if (dataSplit[i].indexOf('INITIALIZE:') != -1) {
				//Initialize variables - default is 50 health, 10 strength, and 0 gold
				initialSplit = dataSplit[i].split('INITIALIZE:')[1].split(',');
				if (initialSplit[0] == 'Health') {
					this.STARTING_HEALTH = dojo.number.parse(initialSplit[1]);
					if (isNaN(this.STARTING_HEALTH)) {
						console.log('Failed to initialize Health (Error - Not a number).  Health set to default of 50.');
						this.STARTING_HEALTH = 50;
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
		this.message = this.pageText[this.page];
		//choicesArray = this.choices[this.page].split('^*');
		choicesArray = this.choices[this.page].split(this.DELIMITER);

		//must call refreshAll in here because this method is dojo.deferred (will occur last)
		this.refreshAll();
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
		this.runJSonic();
	},
	_settings: function(event) {
		//"Settings" or "Go back" was selected
		if (this.menuLevel == -1 || this.menuLevel == 1) {
			this.menuLevel = 0;
			this.menuCategory = "Settings";
			//currently in the game, go to settings menu
			this.message = "Settings";
			choicesArray = [];
			choicesArray[0] = "Sound Options";
			choicesArray[1] = 1;
			choicesArray[2] = "Display Options";
			choicesArray[3] = 2;
			choicesArray[4] = "Game Options";
			choicesArray[5] = 3;
			this.settings.attr('label','Go back');
		} else if (this.menuLevel == 0) {
			//currently in main settings menu, go back to the game
			this.menuLevel = -1;
			this.settings.attr('label','Settings');
			this.processChoice(this.page,0);
		} else {
			this.menuLevel = this.menuLevel - 2;
			this.navigateSettings(0);
		}
		this.refreshAll();
	},
	
	navigateSettings: function(choiceNum) {
		//navigate the settings menu
		this.menuLevel ++;
		if (this.menuLevel > 3) {
			this.message = "Option not implemented";
			choicesArray = [];
			this.menuLevel --;
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
					var p = document.getElementsByTagName('div');
					for(i=0;i<p.length;i++) {
						p[i].style.color = "black";
					}
					this.message = "Font color set to black."
					this.menuLevel --;
				}
				else if (choiceNum == 2) {
					var p = document.getElementsByTagName('div');
					for(i=0;i<p.length;i++) {
						p[i].style.color = "white";
					}
					this.message = "Font color set to white."
					this.menuLevel --;
				}
				else if (choiceNum == 3) {
					var p = document.getElementsByTagName('div');
					for(i=0;i<p.length;i++) {
						p[i].style.color = "blue";
					}
					this.message = "Font color set to blue."
					this.menuLevel --;
				}
				else if (choiceNum == 4) {
					var p = document.getElementsByTagName('div');
					for(i=0;i<p.length;i++) {
						p[i].style.color = "green";
					}
					this.message = "Font color set to green."
					this.menuLevel --;
				} else if (choiceNum == 5) {
					var p = document.getElementsByTagName('div');
					for(i=0;i<p.length;i++) {
						p[i].style.color = "yellow";
					}
					this.message = "Font color set to yellow."
					this.menuLevel --;
				} else if (choiceNum == 6) {
					var p = document.getElementsByTagName('div');
					for(i=0;i<p.length;i++) {
						p[i].style.color = "pink";
					}
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
					choicesArray[10] = "Pink";
					choicesArray[11] = 6;
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
					choicesArray[10] = "Pink";
					choicesArray[11] = 6;
				} else {
					this.menuLevel --;
				}
			} else if (this.menuCategory == "Game options") {
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
				else if (choiceNum == 2) {
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
					//Display health
					this.message = 'Health Left: ' + this.health + '/' + this.MAX_HEALTH;
					this.menuLevel --;
				} else {
					this.menuLevel --;
				}
			} else {
				this.menuLevel --;
			}
			
		}
		else if (this.menuLevel == 1) {
			if (choiceNum == 1 || this.menuCategory == "Audio settings") {
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
			else if (choiceNum == 2 || this.menuCategory == "Font settings" || this.menuCategory == "Font color" || this.menuCategory == "Background color") {
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
			else if (choiceNum == 3 || this.menuCategory == "Game options" || this.menuCategory == "Difficulty options" || this.menuCategory == "Inventory options") {
				this.message = "Game options";
				this.menuCategory = "Game options";
				choicesArray = [];
				choicesArray[0] = "Set difficultly level";
				choicesArray[1] = 1;
				choicesArray[2] = "Manage Inventory";
				choicesArray[3] = 2;
				choicesArray[4] = "Display Health Left";
				choicesArray[5] = 3;
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
			this.js.say({text: "Settings"});
		} else {
			this.buttons[focusNum - 1].focus();
			//make JSonic say the name the button that is focused on
			this.js.stop();
			this.js.say({text: this.buttons[focusNum - 1].label});
		}
	},
	choose: function(choiceNum) {
		if (this.restart == 1) {
			this.restartGame();
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
		if (this.pageText.length <= this.page || this.choices.length <= this.page) {
			this.message = 'ERROR: The specified page does not exist';
		} else {
			//check for special pages (combat, death, items)
			//specialPageArray = this.pageText[this.page].split('^*');
			specialPageArray = this.pageText[this.page].split(this.DELIMITER);

			if (specialPageArray.length == 1) {
				//no special commands, just display the text
				this.message = specialPageArray[0];
			} else {
				//the last thing in the array should be the actual page text (except in special circumstances)
				this.message = specialPageArray[specialPageArray.length-1];
				//loop through all special commands and run them if found
				/*List of special commands:
				INVSPLIT:item^*x^*y - Go to page x if item is in inventory, otherwise go to page y
				GOLDSPLIT:n^*x^*y - If gold is at least n, go to page x, otherwise go to page y
				INVCHECK:item^*text^*x - If item is in inventory, display text.  Otherwise, redirect to page x
				INVADD:item1,item2 - Add all listed items to inventory.  Add false as a parameter to avoid duplicate adding.
				INVBUY:item,n^*x - Add item to inventory, lose n gold.  Redirect to page x if gold is less than n
				INVREMOVE:item1,item2 - Remove all listed items from inventory and display a message.  Add false to not display a message
				INVCLEAR:item1, item2 - Remove all inventory items except the ones listed
				INVSELECT:n - Select n inventory items of the user's choice from the list of choices
				INVREMOVESELECT:n - Remove n inventory items of the user's choice from the inventory
				LOSEHEALTH:n - Lose n health.  If resulting health is 0 or less, the character dies
				GAINHEALTH:n - Gain n health.  Cannot exceed the maximum health
				LOSEGOLD:n^*x - Lose n gold.  Redirect to page x if gold is less than n (optional)
				GAINGOLD:n - Gain n gold
				DISPLAYGOLD - Display a message saying how much gold the character has
				VARSPLIT:var,value^*x^*y - Go to page x if external variable var = value, otherwise go to page y
				VARSET:var,value - Set the value of external variable var to value
				VARDISPLAY:var - Display the value of var in a message
				COMBAT: - Special command to start combat
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
					//INVADD:item1,item2,...  Add items to inventory.  Add false as a paramter to avoid duplicate adding
					else if (specialPageArray[p].match('INVADD:') != null) {
						inventoryAdd = specialPageArray[p].split('INVADD:');
						//Add multiple inventory items by seperating them by a comma
						if (inventoryAdd[1].match(',') != null) {
							inventoryAddArray = inventoryAdd[1].split(',');
							checkForDuplicates = false;
							if ('false' in this.oc(inventoryAddArray)) {
								checkForDuplicates = true;
							}
							for (i = 0; i < inventoryAddArray.length; i++) {
								if (!checkForDuplicates) {
									this.inventory[this.inventory.length] = inventoryAddArray[i];
								} else {
									//only add something to the inventory if it is not already there
									if (inventoryAddArray[i] in this.oc(this.inventory)) {
									} else if (inventoryAddArray[i] != 'false') {
										this.inventory[this.inventory.length] = inventoryAddArray[i];
									}
								}
							}
						} else {
							this.inventory[this.inventory.length] = inventoryAdd[1];
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
							//this.message = specialPageArray[p+1];
						} else {
							//display what items have been removed (if any)
							//this.message = specialPageArray[p+1];
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
							this.inventory[this.inventory.length] = choicesArray[choiceNum * 2 - 2];
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
					else if (specialPageArray[p].match('INVREMOVESELECT:') != null) {
						inventoryRemoveNumber = specialPageArray[p].split('INVREMOVESELECT:');
						//choicesArray = this.choices[this.page].split('^*');
						choicesArray = this.choices[this.page].split(this.DELIMITER);
						nextPageNum = choicesArray[1];
						j = 0;
						for (i = 1; i < this.inventory.length; i++) {
							if (this.inventory[i] != '') {
								choicesArray[j] = this.inventory[i];
								choicesArray[j+1] = nextPageNum;
								//j is needed because inventory might contain null items
								j = j + 2;
							}
						}
						if (this.invselect == 0) {
							originalInventorySize = choicesArray.length/2;
							lastRemovedNum = 100;
						}
						currentInventorySize = choicesArray.length/2;
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
						}
						alreadyRemovedCount = 0;
						for (i = 0; i < choicesArray.length; i+=2) {
							//remove all choices that have already been taken
							if (!(choicesArray[i] in this.oc(this.inventory))) {
								choicesArray[i] = 'Removed ' + choicesArray[i];
								if (this.invselect == 1) {
									alreadyRemovedCount ++;
								}
							}
							choicesArray[i+1] = this.page;
						}
						//go to inventory selection mode (stay on this page until all items are taken)
						this.invselect = 1;
						if (alreadyRemovedCount >= inventoryRemoveNumber[1] || this.inventory.length == 1 || originalInventorySize - currentInventorySize + alreadyRemovedCount >= inventoryRemoveNumber[1]) {
							//the number of inventory items you can pick has been reached, move on to the next page
							this.invselect = 0;
							this.invselecting = 0;
							this.page = nextPageNum;
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
					//GAINGOLD: n, gain n gold
					else if (specialPageArray[p].match('GAINGOLD:') != null) {
						goldGain = specialPageArray[p].split('GAINGOLD:');
						this.gold = dojo.number.parse(this.gold) + dojo.number.parse(goldGain[1]);
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
							enemyName = 'enemy';
							enemyWeaponName = 'None';
							enemyStr = 10;
							enemyDef = 0;
							enemyHealth = 20;
							initialEnemyHealth = 20;
							enemyHealthFraction = enemyHealth/initialEnemyHealth;
							enemyAcc = 55;
							enemyHitMessages = [];
							enemyMissMessages = [];
							for (x = 0; x < combatInfo.length; x++) {
								if (combatInfo[x].match('NAME:') != null) {
									enemyName = combatInfo[x].split('NAME:')[1];
								}
								if (combatInfo[x].match('WEAPON:') != null) {
									enemyWeaponName = combatInfo[x].split('WEAPON:')[1];
								}
								if (combatInfo[x].match('STRENGTH:') != null) {
									enemyStr = dojo.number.parse(combatInfo[x].split('STRENGTH:')[1]);
								}
								if (isNaN(enemyStr)) {
									console.log('Error initializing strength for ' + combatInfo[0] + '. (Not a number)!');
									enemyStr = 10;
								}
								if (combatInfo[x].match('DEFENSE:') != null) {
									enemyDef = dojo.number.parse(combatInfo[x].split('DEFENSE:')[1]);
								}
								if (isNaN(enemyDef)) {
									console.log('Error initializing defense for ' + combatInfo[0] + '. (Not a number)!');
									enemyDef = 0;
								}
								if (combatInfo[x].match('HEALTH:') != null) {
									enemyHealth = dojo.number.parse(combatInfo[x].split('HEALTH:')[1]);
									initialEnemyHealth = enemyHealth;
								}
								if (isNaN(enemyHealth)) {
									console.log('Error initializing health for ' + combatInfo[0] + '. (Not a number)!');
									enemyHealth = 20;
								}
								if (combatInfo[x].match('HIT:') != null) {
									enemyHitMessages[enemyHitMessages.length] = combatInfo[x].split('HIT:')[1];
								}
								if (combatInfo[x].match('MISS:') != null) {
									enemyMissMessages[enemyMissMessages.length] = combatInfo[x].split('MISS:')[1];
								}
							}
							for (x = 0; x < this.possibleWeapons.length; x++) {
								if (this.possibleWeapons[x].name == enemyWeaponName) {
									enemyStr = dojo.number.parse(enemyStr) + dojo.number.parse(this.possibleWeapons[x].strengthbonus);
									enemyAcc = dojo.number.parse(this.possibleWeapons[x].accuracy) - 10;
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
						if (this.inCombat == 1 && choiceNum == 2 && this.chooseWeapon == 0) {
							//change weapon selected
							this.chooseWeapon = 1;
						} else {
							this.chooseWeapon = 0;
						}
						if (this.inCombat == 0 || this.chooseWeapon == 1) {
							//just entering combat, allow the user to switch weapons
							this.message = 'Choose a weapon to fight with.'
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
							availableShields = [];
							for (x = 0; x < this.possibleWeapons.length; x++) {
								for (y = 1; y < this.inventory.length; y++) {
									if (this.possibleWeapons[x].name == this.inventory[y] && this.possibleWeapons[x].type == 'shield') {
										availableShields[availableShields.length] = this.possibleWeapons[x];
									}
								}
							}
							if (availableShields.length == 1) {
								currentShield = availableShields[0];
							} else {
								currentShield = "None";
							}
							this.chooseWeapon = -1;
							this.inCombat = 1;
						} else {
							//default for wonCombat is false, set to true if the enemy's health goes to zero
							wonCombat = false;
							if (currentShield != "None") {
								this.message = combatInfo[0] + '.  You are using: ' + currentWeapon.name + ' and ' + currentShield.name + '. ';
							} else {
								this.message = combatInfo[0] + '.  You are using: ' + currentWeapon.name;
							}
							if (choiceNum == 1 && !disableFight) {
								//Fight selected
								strCompare = this.strength + currentWeapon.strengthbonus - enemyStr;
								k = Math.floor(Math.random()*(10));
								damageDealt = 4 + Math.round(strCompare/2) + k - enemyDef;
								damageTaken = 4 - Math.round(strCompare/2) - Math.floor(k/2);
								if (damageDealt < 0) {
									damageDealt = 0;
								}
								if (damageTaken < 0) {
									damageTaken = 0;
								}
								damageRatio = damageDealt/enemyHealth;
								if (k < 2) {
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
								if (randomNum <= enemyAcc/100) {
									enemyHit = true;
								} else {
									enemyHit = false;
								}
								for (t = 0; t < currentWeapon.hitMessages.length; t++) {
									currentWeapon.hitMessages[t] = currentWeapon.hitMessages[t].replace('#enemy',enemyName);
								}
								for (t = 0; t < currentWeapon.missMessages.length; t++) {
									currentWeapon.missMessages[t] = currentWeapon.missMessages[t].replace('#enemy',enemyName);
								}
								if (youHit) {
									k = Math.floor(Math.random()*(currentWeapon.hitMessages.length));
									combatString = combatString + ' <br>' + currentWeapon.hitMessages[k] + damageMessage + ' dealing ' + damageDealt + ' damage.';
									//this.message = this.message + ' <br>' + currentWeapon.hitMessages[k] + damageMessage + ' dealing ' + damageDealt + ' damage.';
									enemyHealth -= damageDealt;
									enemyHealthFraction = enemyHealth/initialEnemyHealth;
									if (enemyHealthFraction <= 0) {
										combatString = combatString + ' <br>The ' + enemyName + ' collapses.'
										//this.message = this.message + ' <br>The ' + enemyName + ' collapses.'
									} else if (enemyHealthFraction < 0.1) {
										combatString = combatString + ' <br>The ' + enemyName + ' looks nearly dead.'
										//this.message = this.message + ' <br>The ' + enemyName + ' looks nearly dead.'
									} else if (enemyHealthFraction < 0.2) {
										combatString = combatString + ' <br>The ' + enemyName + ' looks severely wounded.'
										//this.message = this.message + ' <br>The ' + enemyName + ' looks severely wounded.'
									} else if (enemyHealthFraction < 0.3) {
										combatString = combatString + ' <br>The ' + enemyName + ' looks weak.'
										//this.message = this.message + ' <br>The ' + enemyName + ' looks weak.'
									} else if (enemyHealthFraction < 0.4) {
										combatString = combatString + ' <br>The ' + enemyName + ' looks quite wounded.'
										//this.message = this.message + ' <br>The ' + enemyName + ' looks quite wounded.'
									} else if (enemyHealthFraction < 0.5) {
										combatString = combatString + ' <br>The ' + enemyName + ' looks hurt.'
										//this.message = this.message + ' <br>The ' + enemyName + ' looks hurt.'
									} else if (enemyHealthFraction < 0.6) {
										combatString = combatString + ' <br>The ' + enemyName + ' looks somewhat wounded.'
										//this.message = this.message + ' <br>The ' + enemyName + ' looks somewhat wounded.'
									} else if (enemyHealthFraction < 0.8) {
										combatString = combatString + ' <br>The ' + enemyName + ' looks a little wounded.'
										//this.message = this.message + ' <br>The ' + enemyName + ' looks a little wounded.'
									} else {
										combatString = combatString + ' <br>The ' + enemyName + ' looks mostly healthy.'
										//this.message = this.message + ' <br>The ' + enemyName + ' looks mostly healthy.'
									}
									
								} else {
									if (Math.random() < 0.4) {
										k = Math.floor(Math.random()*(currentWeapon.missMessages.length));
										combatString = combatString + ' <br>' + currentWeapon.missMessages[k] + ' ';
										//this.message = this.message + ' <br>' + currentWeapon.missMessages[k];
									} else {
										k = Math.floor(Math.random()*(enemyMissMessages.length));
										combatString = combatString + ' <br>' + enemyMissMessages[k] + ' ';
										//this.message = this.message + ' <br>' + enemyMissMessages[k];
									}
								}
								if (enemyHit && enemyHealth > 0) {
									k = Math.floor(Math.random()*(enemyHitMessages.length));
									damageTaken = Math.ceil(damageTaken * enemyHealthFraction);
									combatString = combatString + ' <br>' + enemyHitMessages[k] + ', hitting you for ' + damageTaken + ' damage. ';
									//this.message = this.message + ' <br>' + enemyHitMessages[k] + ', hitting you for ' + damageTaken + ' damage.';
									//reduce damage from shield and armor
									if (currentShield != "None") {
										if (Math.random() <= currentShield.probability/100) {
											damageTaken -= currentShield.defense;
											if (damageTaken < 0) {
												damageTaken = 0;
											}
											combatString = combatString + ' <br>Your ' + currentShield.name + ' has protected you from some of the damage. ';
											//this.message = this.message + ' <br>Your ' + currentShield.name + ' has protected you from some of the damage.';
										}
									}									
									this.health -= damageTaken;
								} else if (enemyHealth > 0) {
									//k = Math.floor(Math.random()*(enemyMissMessages.length+1));
									if (currentShield != "None" && Math.random() < 0.5) {
										combatString = combatString + ' <br>You block the ' + enemyName + 'with your shield. ';
										//this.message = this.message + ' <br>You block the ' + enemyName + 'with your shield.';
									} else {
										combatString = combatString + ' <br>The ' + enemyName + ' misses. ';
										//this.message = this.message + ' <br>The ' + enemyName + ' misses.';
									}
								}

								if (this.health < 0) {
									this.health = 0;
								}
								combatString = combatString + '<br>Health Left: ' + this.health + '/' + this.MAX_HEALTH;
								//this.message = this.message + '<br>Health Left: ' + this.health + '/' + this.MAX_HEALTH;
								if (this.health <= 0) {
									combatString = combatString + '<br>The ' + enemyName + ' has killed you in combat. ';
									//this.message = this.message + '<br>The ' + enemyName + ' has killed you in combat.';
									this.restart = 1;
								} else if (enemyHealth <= 0) {
									wonCombat = true;
								}
							}
							choicesArray = [];
							choicesArray[0] = 'Fight';
							choicesArray[1] = this.page;
							choicesArray[2] = 'Change Weapon';
							choicesArray[3] = this.page;
							if (wonCombat) {
								combatString = combatString + '<br>' + specialPageArray[p+1];
								//this.message = this.message + '<br>' + specialPageArray[p+1];
								this.inCombat = 0;
							}
							this.message = this.message + combatString;
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
				if (this.invselect == 0 && this.inCombat == 0) {
					//if you are in inventory selection mode or combat mode, you are overriding the choice selection
					//choicesArray = this.choices[this.page].split('^*');
					choicesArray = this.choices[this.page].split(this.DELIMITER);
				}
			} else {
				//only possible choice is to restart the game
				choicesArray = ['Restart',1];
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
		this.drawAll();
	},
	runJSonic: function() {
		this.js.stop();
		this.js.setProperty({name: "rate", value: this.sonicRate});
		//don't let JSonic read the <br> tag
		messageminusbr = this.message.replace(new RegExp( '<br>', 'g' ),'');
		this.js.say({text : messageminusbr, cache : true});
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
		choicesString = choicesString + 'Settings.  Read text again';
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
		
		for (i = 1; i < this.inventory.length; i++) {
			//clear whole inventory except for the never used 0th element
			this.inventory[i] = '';
		}
		for (i = 0; i < this.initVariableList.length; i++) {
			//reset all external variables
			this.variableList[i].value = this.initVariableList[i].value;
		}
		this.clearCanvas();
	},
	clearCanvas: function() {
        var canvas = dojo.byId("canvas");
        var ctx = canvas.getContext("2d");
		ctx.fillStyle = "rgb(255,255,255)";
		MAX_WIDTH = canvas.width;
		MAX_HEIGHT = canvas.height;
		ctx.fillRect(0,0,MAX_WIDTH,MAX_HEIGHT);
	},
	
});