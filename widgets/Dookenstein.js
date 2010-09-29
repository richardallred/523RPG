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
		//postMixInProperties is called before the html is intialized
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
		this.DELIMITER = '^*'
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
			strengthbonus: '-4',
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
			if (dataSplit[i].indexOf('DELIMITER:') != -1) {
				//set delimiter to something other than '^*'
				this.DELIMITER = dataSplit[i].split('DELIMITER:')[1];
			}
			else if (dataSplit[i].indexOf('WEAPON:') != -1) {
				//Parse weapon information
				var addedWeapon = {
					name: 'Error with weapon initialization - no name specified',
					strengthbonus: 'NaN',
					accuracy: 'NaN',
					hitMessages: [],
					missMessages: []
				}
				weaponSplit = dataSplit[i].split('WEAPON:')[1].split(this.DELIMITER);
				addedWeapon.name = weaponSplit[0];
				addedWeapon.strengthbonus = dojo.number.parse(weaponSplit[1]);
				addedWeapon.accuracy = dojo.number.parse(weaponSplit[2]);
				if (isNaN(addedWeapon.strengthbonus)) {
					console.log('Error initializing weapon strength (Not a number)!');
					addedWeapon.strengthbonus = -4;
				}
				if (isNaN(addedWeapon.accuracy)) {
					console.log('Error initializing weapon accuracy (Not a number)!');
					addedWeapon.accuracy = 55;
				}
				for (y = 0; y < weaponSplit.length; y++) {
					if (weaponSplit[y].indexOf('HIT:') != -1) {
						addedWeapon.hitMessages[addedWeapon.hitMessages.length] = weaponSplit[y].split('HIT:')[1];
					}
					if (weaponSplit[y].indexOf('MISS:') != -1) {
						addedWeapon.missMessages[addedWeapon.missMessages.length] = weaponSplit[y].split('MISS:')[1];
					}
				}
				if (addedWeapon.hitMessages.length == 0) {
					addedWeapon.hitMessages = ['You hit your enemy'];
				}
				if (addedWeapon.missMessages.length == 0) {
					addedWeapon.missMessages = ['You miss.'];
				}
				this.possibleWeapons[this.possibleWeapons.length] = addedWeapon;
				console.log('Added Weapon.  Name: ' + addedWeapon.name + ', Strength bonus: ' + addedWeapon.strengthbonus + ', Accuracy: ' + addedWeapon.accuracy + ', Hit message 1: ' + addedWeapon.hitMessages[0] + ', Miss message 1:' + addedWeapon.missMessages[0]);
			}
			else if (dataSplit[i].indexOf('UNARMED:') != -1) {
				//Parse weapon information for the case where you must fight unarmed (default:bare hands)
				var addedUnarmed = {
					name: 'Error with unarmed initialization - no name specified',
					strengthbonus: 'NaN',
					accuracy: 'NaN',
					hitMessages: [],
					missMessages: []
				}
				unarmedSplit = dataSplit[i].split('UNARMED:')[1].split(this.DELIMITER);
				addedUnarmed.name = unarmedSplit[0];
				addedUnarmed.strengthbonus = dojo.number.parse(unarmedSplit[1]);
				addedUnarmed.accuracy = dojo.number.parse(unarmedSplit[2]);
				if (isNaN(addedUnarmed.strengthbonus)) {
					console.log('Error initializing unarmed strength (Not a number)!');
					addedUnarmed.strengthbonus = -4;
				}
				if (isNaN(addedUnarmed.accuracy)) {
					console.log('Error initializing unarmed accuracy (Not a number)!');
					addedUnarmed.accuracy = 55;
				}
				for (y = 0; y < unarmedSplit.length; y++) {
					if (unarmedSplit[y].indexOf('HIT:') != -1) {
						addedUnarmed.hitMessages[addedUnarmed.hitMessages.length] = unarmedSplit[y].split('HIT:')[1];
					}
					if (unarmedSplit[y].indexOf('MISS:') != -1) {
						addedUnarmed.missMessages[addedUnarmed.missMessages.length] = unarmedSplit[y].split('MISS:')[1];
					}
				}
				if (addedUnarmed.hitMessages.length == 0) {
					addedUnarmed.hitMessages = ['You hit your enemy'];
				}
				if (addedUnarmed.missMessages.length == 0) {
					addedUnarmed.missMessages = ['You miss.'];
				}
				console.log('Added Unarmed.  Name: ' + addedUnarmed.name + ', Strength bonus: ' + addedUnarmed.strengthbonus + ', Accuracy: ' + addedUnarmed.accuracy + ', Hit message 1: ' + addedUnarmed.hitMessages[0] + ', Miss message 1:' + addedUnarmed.missMessages[0]);
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
					var newVariable = {
						name: initialSplit[0],
						value: initialSplit[1]
					}
					this.initVariableList[this.variableList.length] = newVariable;
					for (y = 0; y < this.initVariableList.length; y++) {
						this.variableList[y] = this.initVariableList[y];
					}
					console.log('Initialized variable: ' + newVariable.name + ', value: ' + newVariable.value);
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

	_focusZero: function(event) {
		//select Read Text Again button
		this.currentFocus = 0;
		this.rereadText.focus();
	},
	_rereadText: function(event) {
		this.runJSonic();
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
			} else {
				this._onClick(this.currentFocus);
			}
		}
		else if (e.keyCode == 119 ||e.keyCode == 87 || e.keyCode == 38) {
			//W or up pressed - move up a button
			this.currentFocus --;
			if (this.currentFocus < 0) {
				this.changeFocus(this.buttons.length);
			} else {
				this.changeFocus(this.currentFocus);
			}
		}
		else if (e.keyCode == 115 ||e.keyCode == 83 || e.keyCode == 120 || e.keyCode == 88 || e.keyCode == 40) {
			//X or S or down pressed - move down a button
			this.currentFocus ++;
			if (this.currentFocus > this.buttons.length) {
				this.changeFocus(0);
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
			this._focusZero();
			this.js.stop();
			this.js.say({text: "Read text again"});
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
			this.page = choicesArray[choiceNum * 2 - 1];
			this.processChoice(this.page, choiceNum);
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
				INVADD:item1,item2 - Add all listed items to inventory
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
				COMBAT: - Special command to start combat
				RESTART: - The story has reached some sort of end, so restart from page 1
				*/
				
				for(p=0; p<specialPageArray.length; p++){
					//INVSPLIT:item.  If the item is in the inventory, go the first page, otherwise go to the second page
					//INVSPLIT does not work with multiple special commands
					if (specialPageArray[p].match('INVSPLIT:') != null) {
						inventoryCheck = specialPageArray[p].split('INVSPLIT:');
						if (inventoryCheck[1] in this.oc(this.inventory) || specialPageArray.length < 3) {
							//passed inventory check, redirect to first page
							this.page = specialPageArray[1];
							this.processChoice(this.page,0);
							return;
						} else {
							//failed inventory check, redirect to second page
							this.page = specialPageArray[2];
							this.processChoice(this.page,0);
							return;
						}
					}
					//GOLDSPLIT:n.  If current gold >= n, go to the first page, otherwise go to the second page
					//GOLDSPLIT does not work with multiple special commands
					else if (specialPageArray[p].match('GOLDSPLIT:') != null) {
						goldCheck = specialPageArray[p].split('GOLDSPLIT:');
						if (this.gold >= goldCheck[1]) {
							//passed gold check, redirect to first page
							this.page = specialPageArray[1];
							this.processChoice(this.page,0);
							return;
						} else {
							//failed gold check, redirect to second page
							this.page = specialPageArray[2];
							this.processChoice(this.page,0);
							return;
						}
					}
					//INVCHECK:item.  If the item is in the inventory, display the page, otherwise redirect to another page
					//INVCHECK does not work with multiple special commands
					else if (specialPageArray[p].match('INVCHECK:') != null) {
						inventoryCheck = specialPageArray[p].split('INVCHECK:');
						if (inventoryCheck[1] in this.oc(this.inventory) || specialPageArray.length < 3) {
							this.message = specialPageArray[p+1];
						} else {
							//failed inventory check, redirect to a new page
							this.page = specialPageArray[2];
							this.processChoice(this.page,0);
							return;
						}
					}
					//INVADD:item1,item2,...  Add items to inventory
					else if (specialPageArray[p].match('INVADD:') != null) {
						inventoryAdd = specialPageArray[p].split('INVADD:');
						//Add multiple inventory items by seperating them by a comma
						if (inventoryAdd[1].match(',') != null) {
							inventoryAddArray = inventoryAdd[1].split(',');
							for (i = 0; i < inventoryAddArray.length; i++) {
								this.inventory[this.inventory.length] = inventoryAddArray[i];
							}
						} else {
							this.inventory[this.inventory.length] = inventoryAdd[1];
						}
						//this.message = specialPageArray[p+1];
					}
					//INVBUY:item,gold cost ... Add an item to your inventory and remove that amount of gold.
					//Does not work with multiple commands but is almost equivalent to INVADD: and LOSEGOLD: together
					else if (specialPageArray[p].match('INVBUY:') != null) {
						inventoryAdd = specialPageArray[p].split('INVBUY:');
						//Add multiple inventory items by seperating them by a comma
						if (inventoryAdd[1].match(',') != null) {
							goldSpent = inventoryAdd[1].split(',');
							if (dojo.number.parse(this.gold) < dojo.number.parse(goldSpent[1])) {
								if (specialPageArray.length > 2) {
									//not enough gold, redirect to another page (optional)
									this.page = specialPageArray[2];
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
						//go to inventory selection mode (stay on this page until all items are taken)
						this.invselect = 1;
						
						//this.message = specialPageArray[p+1];
						selectedString = inventoryAddNumber[1] - alreadyTakenCount;
						if (inventoryAddNumber[1] == 1) {
							//do not show "you can take 1 more item" if there is only one item to take
						} else {
							if (selectedString != 1) {
								this.message = this.message + ' <br>You can take ' + selectedString + ' more items.'
							} else {
								this.message = this.message + ' <br>You can take ' + selectedString + ' more item.'
							}
						}
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
								this.page = specialPageArray[2];
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
						//this.message = specialPageArray[p+1];
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
					//Does not work with multiple commands
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
							this.page = specialPageArray[1];
							this.processChoice(this.page,0);
							return;
						} else {
							//failed inventory check, redirect to second page
							this.page = specialPageArray[2];
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
					//COMBAT: enemy name, enemy weapon, enemy base strength, enemy defense, enemy health, hit messages, miss messages, run away option, run away link
					//Combat does not work with multiple commands
					else if (specialPageArray[p].match('COMBAT:') != null) {
						if (this.inCombat = 0) {
							//just entering combat, allow the user to switch weapons
						}
						//default for wonCombat is false, set to true if the enemy's health goes to zero
						wonCombat = false;
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
						//go to combat mode
						this.inCombat = 1;
						if (wonCombat) {
							this.message = specialPageArray[p+1];
							this.inCombat = 0;
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
			this._focusZero();
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
		choicesString = choicesString + 'Read text again';
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
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillRect(0,0,MAX_WIDTH,HEALTHBAR_HEIGHT);
			ctx.fillStyle = "rgb(0,128,0)";
			proportion = currentHealth/this.MAX_HEALTH;
			ctx.fillRect(0,0,proportion * MAX_WIDTH,HEALTHBAR_HEIGHT);
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