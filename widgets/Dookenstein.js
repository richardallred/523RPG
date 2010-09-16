/**
* Dookenstein version 2
 */
dojo.provide('myapp.Dookenstein');
dojo.require('dijit._Widget');
dojo.require('dijit._Templated');
dojo.require('dojo.i18n');
dojo.require('dojo.number');
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
	},
    postMixInProperties: function() {
		//postMixInProperties is called before the html is intialized
		//initialize variables
		this.pageText = new Array();
		this.choices = new Array();
		this.inventory = new Array();
		//the zeroth element of inventory is never used and is filled with the word inventory
		this.inventory[0] = 'Inventory';
		
		//set starting health and gold.  Health can never go above MAX_HEALTH
		this.MAX_HEALTH = 50;
		this.health = this.MAX_HEALTH;
		this.STARTING_GOLD = 20;
		this.gold = this.STARTING_GOLD;
		
		choicesArray = new Array();
		//At this point in the code, this.choices and this.pageText are still undefined
		//choicesArray = this.choices[this.page].split('^*');
		//this.labels = {choiceOne: choicesArray[0], choiceTwo: '', choiceThree: '', choiceFour: '', choiceFive: '', choiceSix: '', choiceSeven: '', choiceEight: ''};
		this.labels = {choiceOne: '', choiceTwo: '', choiceThree: '', choiceFour: '', choiceFive: '', choiceSix: '', choiceSeven: '', choiceEight: ''};
		//this.message = this.pageText[this.page];
		//This message will be overwritten if the text file is loaded properly
		this.message = 'Failed to load text file';
		
		//if restart is set to 1, the game will reset upon the next button press
		this.restart = 0;
		//special mode for selecting multiple inventory items
		this.invselect = 0;
    },
	
	loadPageTextAndChoices: function(data) {
		//The index of the arrays is the page number
		//pageText is the text for that page, and choices is the possible decisions
		//choices is split by the special character sequence ^* as follows
		//choice one text^*choice one will lead to this page^*choice two text^*choice two will lead to this page...
		
		dataSplit = data.split('\n');
		pageNumber = 0;
		pageInfo = '';
		for (i = 0; i < dataSplit.length; i++) {
			//remove any carriage returns (which are sometimes not removed by split('\n')
			dataSplit[i] = dataSplit[i].replace(new RegExp( '\\r', 'g' ),'');
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
			//fill pageText first, then choices
			if (this.pageText[pageNumber] == null) {
				this.pageText[pageNumber] = pageInfo;
			} else {
				this.choices[pageNumber] = pageInfo;
			}
		}
		
		this.page = 0;
		this.message = this.pageText[this.page];
		choicesArray = this.choices[this.page].split('^*');
		//must call refresh buttons in here because this method is dojo.deferred (will occur last)
		this.refreshButtons();
	},
	
	_choiceOne: function(event) {
		this.choose(1);
	},
	_choiceTwo: function(event) {
		this.choose(2);
	},
	_choiceThree: function(event) {
		this.choose(3);
	},
	_choiceFour: function(event) {
		this.choose(4);
	},
	_choiceFive: function(event) {
		this.choose(5);
	},
	_choiceSix: function(event) {
		this.choose(6);
	},
	_choiceSeven: function(event) {
		this.choose(7);
	},
	_choiceEight: function(event) {
		this.choose(8);
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
			specialPageArray = this.pageText[this.page].split('^*');
			if (specialPageArray.length == 1) {
				this.message = specialPageArray[0];
			} else {
				//INVSPLIT:item.  If the item is in the inventory, go the first page, otherwise go to the second page
				if (specialPageArray[0].match('INVSPLIT:') != null) {
					inventoryCheck = specialPageArray[0].split('INVSPLIT:');
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
				//INVCHECK:item.  If the item is in the inventory, display the page, otherwise redirect to another page
				else if (specialPageArray[0].match('INVCHECK:') != null) {
					inventoryCheck = specialPageArray[0].split('INVCHECK:');
					if (inventoryCheck[1] in this.oc(this.inventory) || specialPageArray.length < 3) {
						this.message = specialPageArray[1];
					} else {
						//failed inventory check, redirect to a new page
						this.page = specialPageArray[2];
						this.processChoice(this.page,0);
						return;
					}
				}
				//INVADD:item1,item2,...  Add items to inventory
				else if (specialPageArray[0].match('INVADD:') != null) {
					inventoryAdd = specialPageArray[0].split('INVADD:');
					//Add multiple inventory items by seperating them by a comma
					if (inventoryAdd[1].match(',') != null) {
						inventoryAddArray = inventoryAdd[1].split(',');
						for (i = 0; i < inventoryAddArray.length; i++) {
							this.inventory[this.inventory.length] = inventoryAddArray[i];
						}
					} else {
						this.inventory[this.inventory.length] = inventoryAdd[1];
					}
					this.message = specialPageArray[1];
				}
				//INVREMOVE:item1,item2,... Remove items from inventory
				else if (specialPageArray[0].match('INVREMOVE:') != null) {
					inventoryRemove = specialPageArray[0].split('INVREMOVE:');
					removedArray = new Array();
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
						this.message = specialPageArray[1];
					} else {
						//display what items have been removed (if any)
						this.message = specialPageArray[1];
						for (i = 0; i < removedArray.length; i++) {
							this.message = this.message + removedArray[i];
							if (i > 0 && i < removedArray.length - 1) {
								this.message = this.message + ', ';
							}
						}
					}
				}
				//INVCLEAR: items, remove all inventory contents except for the items specified.  Clears gold unless 'gold' is listed in items
				else if (specialPageArray[0].match('INVCLEAR:') != null) {
					inventorySave = specialPageArray[0].split('INVCLEAR:');
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
					this.message = specialPageArray[1];
				}
				//choose a certain number of items to add to inventory with INVSELECT.  INVSELECT:n, choose n items from the choices
				else if (specialPageArray[0].match('INVSELECT:') != null) {
					inventoryAddNumber = specialPageArray[0].split('INVSELECT:');
					choicesArray = this.choices[this.page].split('^*');
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
					if (alreadyTakenCount >= inventoryAddNumber[1]) {
						//the number of inventory items you can take has been reached, move on to the next page
						this.invselect = 0;
						choicesArray = this.choices[this.page].split('^*');
						this.page = choicesArray[choiceNum * 2 - 1];
						this.processChoice(this.page, choiceNum);
						return;
					}
					this.message = specialPageArray[1];
				}
				//choose a certain number of items to remove from inventory with INVREMOVESELECT.  INVREMOVESELECT:n, choose n items from the choices
				else if (specialPageArray[0].match('INVREMOVESELECT:') != null) {
					inventoryRemoveNumber = specialPageArray[0].split('INVREMOVESELECT:');
					choicesArray = this.choices[this.page].split('^*');
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
						this.page = nextPageNum;
						this.processChoice(this.page, choiceNum);
						return;
					}
					this.message = specialPageArray[1];
				}
				//LOSEHEALTH: n, lose n health.  Cause death of health is 0 or less
				else if (specialPageArray[0].match('LOSEHEALTH:') != null) {
					healthLost = specialPageArray[0].split('LOSEHEALTH:');
					this.health = this.health - healthLost[1];
					this.message = specialPageArray[1] + '<br>Health Left: ' + this.health + '/' + this.MAX_HEALTH;
					if (this.health <= 0) {
						this.message = this.message + '<br>Your wounded body can take no more, and collapse to the ground.  You are dead.';
						this.restart = 1;
					}
				}
				//GAINHEALTH: n, gain n health.  Cannot go above maximum health.
				else if (specialPageArray[0].match('GAINHEALTH:') != null) {
					healthGain = specialPageArray[0].split('GAINHEALTH:');
					this.health = this.health + healthGain[1];
					if (this.health > this.MAX_HEALTH) {
						this.health = this.MAX_HEALTH;
					}
					this.message = specialPageArray[1] + '<br>Health Left: ' + this.health + '/' + this.MAX_HEALTH;
				}
				//LOSEGOLD: n, lose n gold.  Optional to redirect to another page is not enough gold.
				else if (specialPageArray[0].match('LOSEGOLD:') != null) {
					goldLost = specialPageArray[0].split('LOSEGOLD:');
					if (specialPageArray.length > 2) {
						if (this.gold < goldLost[1]) {
							//not enough gold, redirect to another page
							this.page = specialPageArray[2];
							this.processChoice(this.page,0);
							return;
						}
					}
					if (goldLost[1] == 'all') {
						this.gold = 0;
					} else {
						this.gold = this.gold - goldLost[1];
					}
					if (this.gold < 0) {
						this.gold = 0;
					}
					//this.message = specialPageArray[1] + '<br>You have ' + this.gold + ' gold coins.';
					this.message = specialPageArray[1];
				}
				//GAINGOLD: n, gain n gold
				else if (specialPageArray[0].match('GAINGOLD:') != null) {
					goldGain = specialPageArray[0].split('GAINGOLD:');
					this.gold = this.gold + goldGain[1];
					this.message = specialPageArray[1] + '<br>You have ' + this.gold + ' gold coins.';
				}
				//DISPLAYGOLD: show how much gold the player has in the message
				else if (specialPageArray[0].match('DISPLAYGOLD:') != null) {
					this.message = specialPageArray[1] + '<br>You have ' + this.gold + ' gold coins.';
				}
				//restart the game on next button press with RESTART
				else if (specialPageArray[0].match('RESTART:') != null) {
					this.message = specialPageArray[1];
					this.restart = 1;
				}
				else {
					//the special command was not found, so display it in the message (this should not happen)
					this.message = specialPageArray[0];
				}
			}
			//End special pages testing
			if (this.restart == 0) {
				if (this.invselect == 0) {
					//if you are in inventory selection mode, do not go to the next page
					choicesArray = this.choices[this.page].split('^*');
				}
			} else {
				choicesArray[0] = 'Restart';
				choicesArray[1] = 1;
				for (i = 2; i < choicesArray.length; i++) {
					choicesArray[i] = '';
				}
			}
			this.refreshButtons();
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
	//update the choice buttons and display message
	refreshButtons: function() {
		this.buttonOne.attr('label', choicesArray[0]);
		if (choicesArray.length <= 2 || choicesArray[2] == null || choicesArray[2] == '') {
			this.buttonTwo.attr('style', 'display: none');
		} else {
			this.buttonTwo.attr('style', 'display: inline');
			this.buttonTwo.attr('label', choicesArray[2]);

		}
		if (choicesArray.length <= 4 || choicesArray[4] == null || choicesArray[4] == '') {		
			this.buttonThree.attr('style', 'display: none');
		} else {
			this.buttonThree.attr('style', 'display: inline');
			this.buttonThree.attr('label', choicesArray[4]);
		}
		if (choicesArray.length <= 6 || choicesArray[6] == null || choicesArray[6] == '') {
			this.buttonFour.attr('style', 'display: none');
		} else {
			this.buttonFour.attr('style', 'display: inline');
			this.buttonFour.attr('label', choicesArray[6]);
		}
		if (choicesArray.length <= 8 || choicesArray[8] == null || choicesArray[8] == '') {
			this.buttonFive.attr('style', 'display: none');
		} else {
			this.buttonFive.attr('style', 'display: inline');
			this.buttonFive.attr('label', choicesArray[8]);
		}
		if (choicesArray.length <= 10 || choicesArray[10] == null || choicesArray[10] == '') {
			this.buttonSix.attr('style', 'display: none');
		} else {
			this.buttonSix.attr('style', 'display: inline');
			this.buttonSix.attr('label', choicesArray[10]);
		}
		if (choicesArray.length <= 12 || choicesArray[12] == null || choicesArray[12] == '') {
			this.buttonSeven.attr('style', 'display: none');
		} else {
			this.buttonSeven.attr('style', 'display: inline');
			this.buttonSeven.attr('label', choicesArray[12]);
		}
		if (choicesArray.length <= 14 || choicesArray[14] == null || choicesArray[14] == '') {
			this.buttonEight.attr('style', 'display: none');
		} else {
			this.buttonEight.attr('style', 'display: inline');
			this.buttonEight.attr('label', choicesArray[14]);
		}
		this.displayMessage.innerHTML = this.message;
		this.draw();
	},
	//draw images on the html5 canvas
	draw: function() {
        var canvas = dojo.byId("canvas");
        var ctx = canvas.getContext("2d");
		ctx.fillStyle = "rgb(255,255,255)";
		ctx.fillRect(0,0,150,150);
	},
	//clear the inventory and the canvas and reset health and gold
	restartGame: function() {
		this.restart = 0;
		this.health = this.MAX_HEALTH;
		this.gold = this.STARTING_GOLD;
		
		for (i = 1; i < this.inventory.length; i++) {
			this.inventory[i] = '';
		}
		this.clearCanvas();
	},
	clearCanvas: function() {
        var canvas = dojo.byId("canvas");
        var ctx = canvas.getContext("2d");
		ctx.fillStyle = "rgb(255,255,255)";
		ctx.fillRect(0,0,150,150);
	},
	
});