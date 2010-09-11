/**
* Dookenstein version 0
 */
dojo.provide('myapp.Dookenstein');
dojo.require('dijit._Widget');
dojo.require('dijit._Templated');
dojo.require('dojo.i18n');
dojo.requireLocalization('myapp', 'Dookenstein');

dojo.declare('myapp.Dookenstein', [dijit._Widget, dijit._Templated], {
    widgetsInTemplate: true,
	templatePath: dojo.moduleUrl('myapp.templates', 'Dookenstein.html'),

    postMixInProperties: function() {
		//Page 0: the program starts here (title page)
		//load from data all pages and choices
		this.pageText = new Array();
		this.choices = new Array();
		this.inventory = new Array();
		this.inventory[0] = 'Inventory';
		this.inventoryString = 'Inventory: None';
		this.loadPageTextAndChoices();
		
		this.MAX_HEALTH = 50;
		this.health = this.MAX_HEALTH;

		//instantiate choice buttons
		choicesArray = new Array();
		//even elements of choicesArray contain choice text
		//odd elements of choiceArray contain page links
		this.page = 0;
		choicesArray = this.choices[this.page].split('^*');
		this.labels = {choiceOne: choicesArray[0], choiceTwo: '', choiceThree: '', choiceFour: ''};		
		this.message = this.pageText[this.page];
		//if restart is set to 1, the game will reset upon the next button press
		this.restart = 0;
    },
	
	loadPageTextAndChoices: function(event) {
		//The index of the arrays is the page number
		//pageText is the text for that page, and choices is the possible decisions
		//choices is split by the special character sequence ^* as follows
		//choice one text^*choice one will lead to this page^*choice two text^*choice two will lead to this page...
		this.pageText[0] = 'Welcome to Return to Castle Dookenstein, the epic adventure saga.';
		this.choices[0] = 'Play the game!^*1';
		this.pageText[1] = 'You are in a maze. <br>There are exits to the north and to the east.';
		this.choices[1] = 'Go North^*2^*Go East^*3';
		this.pageText[2] = 'You are in a maze. <br>There are exits to the south and to the east.';
		this.choices[2] = 'Go South^*1^*Go East^*13';
		this.pageText[3] = 'You are in a maze. <br>There are exits to the south and to the west.';
		this.choices[3] = 'Go West^*1^*Go South^*32';
		this.pageText[4] = 'You are in a maze. <br>There are exits in all directions.';
		this.choices[4] = 'Go North^*5^*Go South^*7^*Go East^*6^*Go West^*13';
		this.pageText[5] = 'You are in a passageway.  There is a foul stench coming from the north. <br>There are exits to the north and to the south.';
		this.choices[5] = 'Go North^*27^*Go South^*4';
		this.pageText[6] = 'INVSPLIT:armor^*18^*19';
		this.choices[6] = 'null^*1';
		this.pageText[7] = 'You are in a maze. <br>There are exits to the north and to the east.';
		this.choices[7] = 'Go North^*4^*Go East^*9';
		this.pageText[8] = 'INVSPLIT:armor^*22^*23';
		this.choices[8] = 'null^*1';
		this.pageText[9] = 'You are in a maze.  There is a hideous monster in the room that is blocking an exit to the east. <br>There is an exit to the west.';
		this.choices[9] = 'Fight the Monster^*11^*Go West^*7';
		this.pageText[10] = 'RESTART:^*You try to fight the monster with your bare hands but the monster easily dispatches you. <br>You are dead.';
		this.choices[10] = 'null^*1';
		this.pageText[11] = 'INVSPLIT:sword^*29^*10';
		this.choices[11] = 'null^*1';
		this.pageText[12] = 'INVSPLIT:armor^*26^*15';
		this.choices[12] = 'null^*1';
		this.pageText[13] = 'You are in a passageway. <br>There are exits to the east and to the west.';
		this.choices[13] = 'Go East^*4^*Go West^*2';
		this.pageText[14] = 'In this room, you see a skeleton of another adventurer on the ground.  In its hand is a sword, and it is wearing a suit of plate mail armor that looks like it would fit you. <br>There is an exit to the west.'
		this.choices[14] = 'Take the sword^*8^*Put on the armor^*17^*Leave to the West^*4';
		this.pageText[15] = 'LOSEHEALTH:5^*To the east, you can see the maze exit.  As you head towards it, you set off a trap that sends a swinging blade heading towards you.  You leap out of the way just in time and the blade grazes your back instead of killing you (You lose 5 health).  You brush yourself off and carefully make your way to the exit.';
		this.choices[15] = 'Exit the Maze^*16';
		this.pageText[16] = 'RESTART:^*You have escaped the maze.  You win!';
		this.choices[16] = 'null^*1';
		this.pageText[17] = 'INVSPLIT:sword^*24^*25';
		this.choices[17] = 'null^*1';
		this.pageText[18] = 'INVCHECK:sword^*In this room, there is the skeleton of another adventurer on the ground.  You have stripped the skeleton of all its loot, and there is nothing else useful in the room. <br>There is an exit to the west.^*21'
		this.choices[18] = 'Kick the skeleton^*20^*Go West^*4';
		this.pageText[19] = 'INVCHECK:sword^*In this room, there is the skeleton of another adventurer on the ground, which is wearing a suit of plate mail armor. <br>There is an exit to the west.^*14';
		this.choices[19] = 'Take the armor^*17^*Go West^*4';
		this.pageText[20] = 'LOSEHEALTH:2^*After having looted all its gear, you decide to maliciously kick the skeleton of the dead adventurer.  Nothing happens except that you cut your toe on a protruding piece of bone (You lose 2 health).';
		this.choices[20] = 'Leave to the West^*4';
		this.pageText[21] = 'In this room, there is the skeleton of another adventurer on the ground.  The skeleton is holding a sword. <br>There is an exit to the west.';
		this.choices[21] = 'Take the sword^*8^*Go West^*4';
		this.pageText[22] = 'INVADD:sword^*You take the sword.  The skeleton has no more gear to loot.';
		this.choices[22] = 'Go West^*4';
		this.pageText[23] = 'INVADD:sword^*You take the sword.  The skeleton is still wearing a suit of armor.';
		this.choices[23] = 'Put on the armor^*17^*Go West^*4';
		this.pageText[24] = 'INVADD:armor^*You remove the armor from the corpse and put it on.  It fits you quite well.  This heavy plate armor will slow you down, but offers excellent protection.  The skeleton has no more gear to loot.';
		this.choices[24] = 'Go West^*4';
		this.pageText[25] = 'INVADD:armor^*You remove the armor from the corpse and put it on.  It fits you quite well.  This heavy plate armor will slow you down, but offers excellent protection.  The skeleton is still holding a sword.';
		this.choices[25] = 'Take the sword^*8^*Go West^*4';
		this.pageText[26] = 'RESTART:^*On the other side of this room, you can see the maze exit.  As you head towards it, you set off a trap that sends a swinging blade heading towards you.  You try to leap out of the way, but your armor slows you down and the blade beheads you.  You are dead.';
		this.choices[26] = 'null^*1';
		this.pageText[27] = 'LOSEHEALTH:15^*You have entered a room filled with poisonous gas.  The gas enters your system, making you feel extremely ill (You lose 15 health).  The gas makes it almost impossible to see anything in the room.';
		this.choices[27] = 'Hold your breath and search the room^*28^*Leave immediately to the south^*5';
		this.pageText[28] = 'RESTART:^*You hold your breath and search the room with your hands, looking for useful objects.  However, the poison gas already in your system overwhelms you and you pass out.  You never wake up.';
		this.choices[28] = 'null^*1';
		this.pageText[29] = 'INVSPLIT:armor^*30^*31';
		this.choices[29] = 'null^*1';
		this.pageText[30] = 'As you fight the monster, the monster tries to scratch you with its claws, but your armor protects you from damage.  Using your sword, you slay the monster.';
		this.choices[30] = 'Continue to the East^*12';
		this.pageText[31] = 'LOSEHEALTH:20^*As you fight the monster, the monster\'s claws tear into your unprotected skin (You lose 20 health).  The battle is fierce, but you manage to slay the monster with your sword.';
		this.choices[31] = 'Continue to the East^*12';
		this.pageText[32] = 'You are in a maze. <br>There are exits to the north, the east, and the west.';
		this.choices[32] = 'Go North^*3^*Go East^*33^*Go West^*34';
		this.pageText[33] = 'You are in a dead end. <br>There is an exit to the west.';
		this.choices[33] = 'Go West^*32';
		this.pageText[34] = 'You are in a room with an ornate marble fountain in the center.  When you look at the water bubbling from it, you suddenly feel quite thirsty. <br>There is an exit to the east.';
		this.choices[34] = 'Drink from the fountain^*35^*Go back east without drinking^*32';
		this.pageText[35] = 'LOSEHEALTH:10^*You greedily drink from the water flowing from the fountain.  It is quite refreshing.  Once you are finished drinking, you are gripped with a terrible pain in your stomach.  You double up and vomit repeatedly, feeling extremely sick from the water you drunk (You lose 10 health).  It takes you a little while to gather the strength to get back up.'
		this.choices[35] = 'Leave the room to the east^*32';
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
	choose: function(choiceNum) {
		if (this.restart == 1) {
			this.restartGame();
		}
		if (choicesArray.length < choiceNum * 2) {
			this.message = 'ERROR: The previous choice did not link to a page';
		} else {
			this.page = choicesArray[choiceNum * 2 - 1];
			this.processChoice(this.page);
		}
	},
	processChoice: function(pageNum) {			
		this.page = pageNum;
		if (this.pageText.length <= this.page || this.choices.length <= this.page) {
			this.message = 'ERROR: The specified page does not exist';
		} else {
			//check for special pages (combat, death, items)
			specialPageArray = this.pageText[this.page].split('^*');
			if (specialPageArray.length == 1) {
				this.message = specialPageArray[0];
			} else {
				//INVSPLIT checks the inventory for an item.  If the item is in the inventory, go the first page, otherwise go to the second page
				if (specialPageArray[0].match('INVSPLIT:') != null) {
					inventoryCheck = specialPageArray[0].split('INVSPLIT:');
					if (inventoryCheck[1] in this.oc(this.inventory) || specialPageArray.length < 3) {
						//passed inventory check, redirect to first page
						this.page = specialPageArray[1];
						this.processChoice(this.page);
					} else {
						//failed inventory check, redirect to second page
						this.page = specialPageArray[2];
						this.processChoice(this.page);
					}
				}
				//if there is an inventory check (INVCHECK), true will go to the first ^* split, and false will redirect to the page after the ^*
				else if (specialPageArray[0].match('INVCHECK:') != null) {
					inventoryCheck = specialPageArray[0].split('INVCHECK:');
					if (inventoryCheck[1] in this.oc(this.inventory) || specialPageArray.length < 3) {
						this.message = specialPageArray[1];
					} else {
						//failed inventory check, redirect to a new page
						this.page = specialPageArray[2];
						this.processChoice(this.page);
					}
				}
				//add inventory items with INVADD
				else if (specialPageArray[0].match('INVADD:') != null) {
					inventoryAdd = specialPageArray[0].split('INVADD:');
					//Add multiple inventory items by seperating them by a comma
					if (inventoryAdd[1].match(',') != null) {
						inventoryAddArray = inventoryAdd.split(',');
						for (i = 0; i < inventoryAddArray.length; i++) {
							//inventory[inventory.length] = inventoryAddArray[i];
							inventory[this.inventory.length] = inventoryAddArray[i];
						}
					} else {
						this.inventory[this.inventory.length] = inventoryAdd[1];
					}
					this.message = specialPageArray[1];
				}
				else if (specialPageArray[0].match('LOSEHEALTH:') != null) {
					healthLost = specialPageArray[0].split('LOSEHEALTH:');
					this.health = this.health - healthLost[1];
					this.message = specialPageArray[1] + '<br>Health Left: ' + this.health + '/' + this.MAX_HEALTH;
					if (this.health <= 0) {
						this.message = this.message + '<br>Your wounded body can take no more, and collapse to the ground.  You are dead.';
						this.restart = 1;
					}
				}
				//restart the game on next button press with RESTART
				else if (specialPageArray[0].match('RESTART:') != null) {
					this.message = specialPageArray[1];
					this.restart = 1;
				}
				else {
					this.message = specialPageArray[0];
				}
			}
			if (this.restart == 0) {
				choicesArray = this.choices[this.page].split('^*');
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
		this.displayMessage.innerHTML = this.message;
		this.draw();
	},
	//draw images on the html5 canvas
	draw: function() {
        var canvas = dojo.byId("canvas");
        var ctx = canvas.getContext("2d");
		//erase all red dots
		ctx.fillStyle = "rgb(255,255,255)";
		ctx.fillRect(9, 88, 5, 5);
		ctx.fillRect(29, 88, 5, 5);
		ctx.fillRect(9, 68, 5, 5);
		ctx.fillRect(29, 68, 5, 5);
		ctx.fillRect(29, 108, 5, 5);
		ctx.fillRect(49, 108, 5, 5);
		ctx.fillRect(9, 108, 5, 5);
		ctx.fillRect(49, 68, 5, 5);
		ctx.fillRect(49, 48, 5, 5);
		ctx.fillRect(49, 28, 5, 5);
		ctx.fillRect(69, 68, 5, 5);
		ctx.fillRect(49, 88, 5, 5);
		ctx.fillRect(69, 88, 5, 5);
		ctx.fillRect(89, 88, 5, 5);
		//set color to black
		ctx.fillStyle = "rgb(0,0,0)";
		if (this.page == 1) {
			ctx.fillRect(0, 80, 2, 20);
			ctx.fillRect(0, 80, 2, 20);
			ctx.fillRect(0, 100, 20, 2);
			//draw red dot
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillRect(9, 88, 5, 5);
		}
		else if (this.page == 2) {
			ctx.fillRect(0, 60, 20, 2);
			ctx.fillRect(0, 60, 2, 20);
			//draw red dot
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillRect(9, 68, 5, 5);
		}
		else if (this.page == 3) {
			ctx.fillRect(20, 80, 20, 2);
			ctx.fillRect(40, 80, 2, 20);
			//ctx.fillRect(20, 100, 22, 2);
			//draw red dot
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillRect(29, 88, 5, 5);
		}
		else if (this.page == 13) {
			ctx.fillRect(20, 60, 20, 2);
			ctx.fillRect(20, 80, 20, 2);
			//draw red dot
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillRect(29, 68, 5, 5);
		}
		else if (this.page == 4) {
			//ctx.fillRect(40, 40, 2, 22);
			//ctx.fillRect(60, 40, 2, 20);
			//ctx.fillRect(60, 60, 20, 2);
			//ctx.fillRect(60, 80, 20, 2);
			//ctx.fillRect(40, 80, 2, 22);
			//draw red dot
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillRect(49, 68, 5, 5);
		}
		else if (this.page == 5) {
			ctx.fillRect(40, 40, 2, 22);
			//ctx.fillRect(40, 40, 20, 2);
			ctx.fillRect(60, 40, 2, 20);
			//draw red dot
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillRect(49, 48, 5, 5);
		}
		else if (this.page == 14 || this.page == 18 || this.page == 19 || this.page == 20 || this.page == 21 || this.page == 22 || this.page == 23 || this.page == 24 || this.page == 25) {
			ctx.fillRect(60, 60, 20, 2);
			ctx.fillRect(80, 60, 2, 22);
			ctx.fillRect(60, 80, 20, 2);
			//draw red dot
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillRect(69, 68, 5, 5);
		}
		else if (this.page == 7) {
			ctx.fillRect(40, 80, 2, 22);
			ctx.fillRect(40, 100, 20, 2);
			//draw red dot
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillRect(49, 88, 5, 5);
		}
		else if (this.page == 9 || this.page == 10 || this.page == 11 || this.page == 30 || this.page == 31) {
			ctx.fillRect(60, 80, 20, 2);
			ctx.fillRect(60, 100, 20, 2);
			//draw red dot
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillRect(69, 88, 5, 5);
		}
		else if (this.page == 15 || this.page == 26) {
			ctx.fillRect(80, 80, 20, 2);
			ctx.fillRect(80, 100, 20, 2);
			//ctx.fillRect(100, 80, 2, 22);
			//draw red dot
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillRect(89, 88, 5, 5);
		}
		else if (this.page == 16) {
			//draw green dot
			ctx.fillStyle = "rgb(0,255,0)";
			ctx.fillRect(109, 88, 5, 5);
		}
		else if (this.page == 27 || this.page == 28) {
			ctx.fillRect(40, 20, 2, 22);
			ctx.fillRect(40, 20, 20, 2);
			ctx.fillRect(60, 20, 2, 20);
			//draw red dot
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillRect(49, 28, 5, 5);
		}
		else if (this.page == 32) {
			ctx.fillRect(20, 120, 20, 2);
			//draw red dot
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillRect(29, 108, 5, 5);
		}
		else if (this.page == 33) {
			ctx.fillRect(40, 120, 20, 2);
			ctx.fillRect(40, 100, 20, 2);
			ctx.fillRect(60, 100, 2, 22);
			//draw red dot
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillRect(49, 108, 5, 5);
		}
		else if (this.page == 34 || this.page == 35) {
			ctx.fillRect(0, 120, 20, 2);
			ctx.fillRect(0, 100, 20, 2);
			ctx.fillRect(0, 100, 2, 22);
			//draw red dot
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillRect(9, 108, 5, 5);
		}
	},
	//clear the inventory and the canvas and reset health
	restartGame: function() {
		this.restart = 0;
		this.health = this.MAX_HEALTH;
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