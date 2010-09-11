/**
* Dookenstein version 2
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
		this.labels = {choiceOne: choicesArray[0], choiceTwo: '', choiceThree: '', choiceFour: '', choiceFive: '', choiceSix: ''};		
		this.message = this.pageText[this.page];
		//if restart is set to 1, the game will reset upon the next button press
		this.restart = 0;
		//special mode for selecting multiple inventory items
		this.invselect = 0;
    },
	
	loadPageTextAndChoices: function(event) {
		//The index of the arrays is the page number
		//pageText is the text for that page, and choices is the possible decisions
		//choices is split by the special character sequence ^* as follows
		//choice one text^*choice one will lead to this page^*choice two text^*choice two will lead to this page...
		this.pageText[0] = 'Welcome to Return to Castle Dookenstein, the epic adventure saga.';
		this.choices[0] = 'Play the game!^*1';
		this.pageText[1] = 'You are sent on a quest to the nearby land of Dookia, which has been at war with your people of Carolinia for centuries.  Your spies report that the King of Dookia has uncovered a legendary artifact, a powerful ring that gives the power to cast devestating magic.  The King, the brutal and tyrannous King K, plans to march into battle with the ring in one week\'s time to subjugate Carolinia under Dookian rule forever. Knowing that such an artifact could spell doom for Carolinia, you sneak into Dookia territory and approach the castle of the King.  You hope to sneak into the castle, recover the ring, and save your people.';
		this.choices[1] = 'Continue^*2';
		this.pageText[2] = 'INVSELECT:3^*When you were leaving Carolina, you were given access to the royal armory to obtain items you needed for your quest.  In order to travel lightly for the long journey to the Dookian castle, you decided to take just three items from the store room. <br> Which items did you take?';
		this.choices[2] = 'Sword^*3^*Crossbow^*3^*Grappling hook^*3^*Lockpicking kit^*3^*First aid kit^*3^*Leather vest^*3';
		this.pageText[3] = 'INVSELECT:1^*In order to pass through Dookia without arousing suspicion, you selected a disguise to enter the country with.  If you take the clothes of a Dookian merchant, you can talk your way through situations by pretending to be a harmless trader.  If you take the clothes of a Dookian mercenary, you can pretend to be looking for work while being constantly ready for combat.  If you take the dark garb of an assassin, you would arouse more suspicion but easily blend into dark areas. <br>Which clothes did you pick?';
		this.choices[3] = 'Merchant Disguise^*4^*Mercenary Disguise^*4^*Assassin Garb^*4';
		this.pageText[4] = 'You manage to arrive at Castle Dookenstein without incident.  The castle is a towering fortress of stone that is surrounded by a large moat.  There is a large forest to the right of the castle.  There is a path that leads to the castle drawbridge and the main gate, which is closed.  Across the drawbridge, there are two guards in full Dookian armor standing by the gate.  On the top of the castle, there are several more guards facing the front of the castle and holding crossbows.  You come up with several ideas to enter the castle, but all of them are risky. <br>  You could try to talk your way past the guards and enter the front gate. <br> You could avoid the guards and try to swim across the moat.  <br> You could hide in the forest and try to shoot the gate guards with a crossbow.  <br> You could go to the back side of the castle and try to grapple up to the roof with a grappling hook.';
		this.choices[4] = 'Try the front gate^*5^*Swim the moat^*6^*Attack the guards with a crossbow^*7^*Grapple up the back wall^*8';
		this.pageText[5] = 'You are in a passageway.  There is a foul stench coming from the north. <br>There are exits to the north and to the south.';
		this.choices[5] = 'Go North^*27^*Go South^*4';
		this.pageText[6] = 'INVSPLIT:armor^*18^*19';
		this.choices[6] = 'null^*1';
		this.pageText[7] = 'INVSPLIT:Crossbow^*11^*9';
		this.choices[7] = 'null^*1';
		this.pageText[8] = 'INVSPLIT:Grappling hook^*100^*10';
		this.choices[8] = 'null^*1';
		this.pageText[9] = 'Since you did not bring a crossbow, it is impossible to attack the guards from the woods.';
		this.choices[9] = 'Select another choice^*4';
		this.pageText[10] = 'Since you did not bring a grappling hook, your plan to grapple up the back wall does not get very far.';
		this.choices[10] = 'Select another choice^*4';
		this.pageText[11] = 'You hide in the woods and carefully aim at one of the gate guards with your crossbow.  You aim is true and the guard falls to the ground.  The other guard sees this and shouts and alarm.  The castle gate opens and six armed soldiers on horseback emerge and gallop towards the forest, where you are hiding.  The horses are fast and will approach you very soon.';
		this.choices[11] = 'Try to shoot the guards as they approach^*12^*Try to hide in a patch of nearby undergrowth^*13^*Run away as fast as you can through the trees^*14';
		this.pageText[12] = 'RESTART:^*Crouching behind a bush, you manage to shoot two of the riders before the rest of them reach you.  One of the remaining four soldiers gallops up to you and cuts you down with his sword. <br>Your life ends here.';
		this.choices[12] = 'null^*1';
		this.pageText[13] = 'RESTART:^*You dive into a thick patch of bushes that manage to conceal your person.  You hear the soldiers dismount and begin to search for you.  You keep completely still as several of the soldiers begin to hack at the vegetation with their swords.  After a few minutes, one of the swords cuts through to your hiding place.  Before you can react, the soldier runs you through. <br> Your life ends here.';
		this.choices[13] = 'null^*1';
		this.pageText[14] = 'text';
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
		this.choices[19] = 'Put on the armor^*17^*Go West^*4';
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
	_choiceFive: function(event) {
		this.choose(5);
	},
	_choiceSix: function(event) {
		this.choose(6);
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
				//INVSPLIT checks the inventory for an item.  If the item is in the inventory, go the first page, otherwise go to the second page
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
				//if there is an inventory check (INVCHECK), true will go to the first ^* split, and false will redirect to the page after the ^*
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
				//add inventory items with INVADD
				else if (specialPageArray[0].match('INVADD:') != null) {
					inventoryAdd = specialPageArray[0].split('INVADD:');
					//Add multiple inventory items by seperating them by a comma
					if (inventoryAdd[1].match(',') != null) {
						inventoryAddArray = inventoryAdd.split(',');
						for (i = 0; i < inventoryAddArray.length; i++) {
							//inventory[inventory.length] = inventoryAddArray[i];
							this.inventory[this.inventory.length] = inventoryAddArray[i];
						}
					} else {
						this.inventory[this.inventory.length] = inventoryAdd[1];
					}
					this.message = specialPageArray[1];
				}
				//choose a certain number of inventory items with INVSELECT.  INVSELECT:n, choose n items from the choices
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
							choicesArray[i] = 'Taken';
							if (this.invselect == 1) {
								alreadyTakenCount ++;
							}
						}
						choicesArray[i+1] = this.page;
					}
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
				//LOSEHEALTH: n, lose n health
				else if (specialPageArray[0].match('LOSEHEALTH:') != null) {
					healthLost = specialPageArray[0].split('LOSEHEALTH:');
					this.health = this.health - healthLost[1];
					this.message = specialPageArray[1] + '<br>Health Left: ' + this.health + '/' + this.MAX_HEALTH;
					if (this.health <= 0) {
						this.message = this.message + '<br>Your wounded body can take no more, and collapse to the ground.  You are dead.';
						this.restart = 1;
					}
				}
				else if (specialPageArray[0].match('GAINHEALTH:') != null) {
					healthGain = specialPageArray[0].split('GAINHEALTH:');
					this.health = this.health + healthGain[1];
					if (this.health > this.MAX_HEALTH) {
						this.health = this.MAX_HEALTH;
					}
					this.message = specialPageArray[1] + '<br>Health Left: ' + this.health + '/' + this.MAX_HEALTH;
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
			//End special pages testing
			if (this.restart == 0) {
				if (this.invselect == 0) {
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