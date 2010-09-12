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
		//Initialize
		this.pageText = new Array();
		this.choices = new Array();
		this.inventory = new Array();
		this.inventory[0] = 'Inventory';
		this.inventoryString = 'Inventory: None';
		
		this.MAX_HEALTH = 50;
		this.health = this.MAX_HEALTH;
		this.STARTING_GOLD = 20;
		this.gold = this.STARTING_GOLD;
		
		//load from data all pages and choices
		this.loadPageTextAndChoices();

		//instantiate choice buttons
		choicesArray = new Array();
		//even elements of choicesArray contain choice text
		//odd elements of choiceArray contain page links
		this.page = 0;
		choicesArray = this.choices[this.page].split('^*');
		this.labels = {choiceOne: choicesArray[0], choiceTwo: '', choiceThree: '', choiceFour: '', choiceFive: '', choiceSix: '', choiceSeven: '', choiceEight: ''};
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
		this.pageText[1] = 'You are sent on a quest to the nearby land of Dookia, which has been at war with your people of Carolinia for centuries.  Your spies report that the King of Dookia has uncovered a legendary artifact, a powerful ring that gives its possessor the power to cast devestating magic.  The King, the brutal and tyrannous King K, plans to march into battle with the ring in one week\'s time to subjugate Carolinia under Dookian rule forever. Knowing that such an artifact could spell doom for Carolinia, you sneak into Dookia territory and approach the castle of the King.  You hope to sneak into the castle, recover the ring, and save your people.';
		this.choices[1] = 'Continue^*2';
		this.pageText[2] = 'INVSELECT:4^*When you were leaving Carolinia, you were given a pouch of gold coins and access to the royal armory to obtain items you needed for your quest.  In order to travel lightly for the long journey to the Dookian castle, you decided to take just four items from the store room. <br> Which items did you take?';
		this.choices[2] = 'Sword^*3^*Crossbow^*3^*Hidden dagger^*3^*Grappling hook^*3^*Lockpicking kit^*3^*First aid kit^*3^*Leather vest^*3^*Shield^*3';
		this.pageText[3] = 'INVSELECT:1^*In order to pass through Dookia without arousing suspicion, you selected a disguise to enter the country with.  If you take the clothes of a Dookian merchant, you can talk your way through situations by pretending to be a harmless trader.  If you take the clothes of a Dookian mercenary, you can pretend to be looking for work while being constantly ready for combat.  If you take the dark garb of an assassin, you would arouse more suspicion but easily blend into dark areas. <br>Which clothes did you pick?';
		this.choices[3] = 'Merchant Disguise^*4^*Mercenary Disguise^*4^*Assassin Garb^*4';
		this.pageText[4] = 'You manage to arrive at Castle Dookenstein without incident.  The castle is a towering fortress of stone that looms over the countryside, surrounded by a deep moat.  An ancient forest is to the right of the castle.  There is a path that leads to the castle drawbridge and the main gate, which is closed.  Across the drawbridge, there are two guards in full Dookian armor standing by the gate.  On the top of the castle, there are several more guards facing the front of the castle and holding crossbows.  You come up with several ideas to enter the castle, but all of them are risky. <br>  You could try to talk your way past the guards and enter the front gate. <br> You could avoid the guards and try to swim across the moat.  <br> You could hide in the forest and try to shoot the gate guards with a crossbow.  <br> You could go to the back side of the castle and try to grapple up to the roof with a grappling hook.';
		this.choices[4] = 'Try the front gate^*5^*Swim the moat^*200^*Attack the guards with a crossbow^*7^*Grapple up the back wall^*8';
		this.pageText[5] = 'INVSPLIT:Merchant Disguise^*6^*26';
		this.choices[5] = 'null^*1';
		this.pageText[6] = 'As part of your mechant disguise, you brought a horse and cart full of goods.  You ride the horse across the drawbridge and approach the guards.  One of them asks you to state your business.';
		this.choices[6] = 'Say that you wish to trade inside the castle walls^*27^*Say that you have an important delivery for the soldiers inside the castle^*28^*Say that you have an important message for the King^*29^*Say that you are visiting a family member^*46';
		this.pageText[7] = 'INVSPLIT:Crossbow^*11^*9';
		this.choices[7] = 'null^*1';
		this.pageText[8] = 'INVSPLIT:Grappling hook^*100^*10';
		this.choices[8] = 'null^*1';
		this.pageText[9] = 'Since you did not bring a crossbow, it is impossible to attack the guards from the woods.';
		this.choices[9] = 'Select another choice^*4';
		this.pageText[10] = 'Since you did not bring a grappling hook, your plan to grapple up the back wall does not get very far.';
		this.choices[10] = 'Select another choice^*4';
		this.pageText[11] = 'You hide in the woods and carefully aim at one of the gate guards with your crossbow.  Your aim is true and the guard falls to the ground.  The other guard sees this and shouts an alarm.  The castle gate opens and six armed soldiers on horseback emerge and gallop towards the forest, where you are hiding.  The horses are fast and will approach you very soon.';
		this.choices[11] = 'Try to shoot the guards as they approach^*12^*Try to hide in a patch of thick vegetation^*13^*Run away as fast as you can through the trees^*14^*Try to grapple into a tree^*43';
		this.pageText[12] = 'RESTART:^*Crouching behind a bush, you manage to shoot two of the riders before the rest of them reach you.  As you are reloading your crossbow for a third shot, one of the remaining four soldiers gallops up to you and cuts you down with his sword. <br>Your life ends here.';
		this.choices[12] = 'null^*1';
		this.pageText[13] = 'RESTART:^*You dive into a thick patch of bushes that manage to conceal your person.  You hear the soldiers dismount and begin to search for you.  You lie completely still as several of the soldiers begin to hack at the nearby undergrowth with their swords.  After a few minutes, one of the swords cuts through to your hiding place.  Before you can react, the soldier runs you through. <br> Your life ends here.';
		this.choices[13] = 'null^*1';
		this.pageText[14] = 'You immediately start sprinting through the trees away from the castle.  The thick undergrowth hinders your progress, as you have to force your way through the vegetation.  You look over your shoulder and see the soldiers dismount their horses to give chase.  Two of them load crossbows and point them at your fleeing form.';
		this.choices[14] = 'Dive to the ground^*15^*Keep running and hope you are not hit^*16';
		this.pageText[15] = 'RESTART:^*As you dive to the ground, you can hear crossbow bolts whiz over your head.  Unfortunately, you dive into a thick patch of briars, which lodge into your clothes and skin.  The thorns tear at you as you struggle to extricate yourself, and by the time you struggle free, one of the soldiers has managed to catch up to you.  He cuts you down with his sword. <br> Your life ends here.';
		this.choices[15] = 'null^*1';
		this.pageText[16] = 'One of the crossbow bolts lodges harmlessly into a tree, but another one buries itself into your right shoulder.  Ignoring the pain, you continue to run haphazardly through the woods.  After several minutes of frenzied running, you are forced the stop from pain and exhaustion.  The soldiers are no where to be seen, but you realize that you are lost.  Except for a stream flowing on the left, there are no visible landmarks in sight.';
		this.choices[16] = 'Continue^*17';
		this.pageText[17] = 'INVSPLIT:First aid kit^*18^*19';
		this.choices[17] = 'null^*1';
		this.pageText[18] = 'You look down at your shoulder and see that your clothes are stained with blood.  The bolt has embedded itself into your flesh, and the wound is still bleeding.  You are starting to feel faint from blood loss.  If you pull the bolt out, you can wash the wound in the stream and bandage yourself with supplies from your first aid kit.  However, pulling the bolt out may cause you to pass out from the resulting bleeding.'
		this.choices[18] = 'Pull the bolt out and bandage <br>yourself with the first aid kit^*22^*Leave the bolt in your body and try to <br>make your way out of the forest^*21';
		this.pageText[19] = 'You look down at your shoulder and see that your clothes are stained with blood.  The bolt has embedded itself into your flesh, and the wound is still bleeding.  You are starting to feel faint from blood loss.  If you pull the bolt out, you can wash the wound in the stream and attempt to bandage yourself with leaves from the forest floor.  However, pulling the bolt out may cause you to pass out from the resulting bleeding.';
		this.choices[19] = 'Pull the bolt out and try to <br>bandage yourself with leaves^*20^*Leave the bolt in your body and try to <br>make your way out of the forest^*21';
		this.pageText[20] = 'RESTART:^*Wincing, you extract the bolt from your shoulder.  Blood flows freely from the wound as you wash it with water from the stream.  You gather a handful of leaves and try to staunch the flow, but the leaves are ineffective.  You soon pass out and die from blood loss.';
		this.choices[20] = 'null^*1';
		this.pageText[21] = 'RESTART:^*You decide to leave the bolt in your shoulder and start trying to find your way out of the woods.  You start to follow a path of broken twigs from where you ran, but you feel so weak you can hardly concentrate.  You soon reach the point where your wounded body can take no more and you collapse to the ground. <br>Your life ends here.';
		this.choices[21] = 'null^*1';
		this.pageText[22] = 'LOSEHEALTH:30^*Wincing, you extract the bolt from your shoulder.  Blood flows freely from the wound as you wash it with water from the stream.  You wrap some bandanges around your shoulder and manage to stop the flow.  You are still alive, but your ordeal has cost you 30 health.  You decide to try to make your way back to the castle.';
		this.choices[22] = 'Try to find a way out of the forest^*23';
		this.pageText[23] = 'You manage to follow a path of broken twigs and torn foliage from where you ran, although it takes you several hours.  Your body is tired from the beating it took and you have to rest several times.  When you finally reach the castle again, it is nightfall.  You see that there are many guards patrolling the castle walls.  With the increased security and your wounded state, the only way you can think of to enter the castle is to use the cover of night to sneak to the moat and swim across it.';
		this.choices[23] = 'Swim the moat^*200';
		this.pageText[24] = 'You cross the drawbridge and approach the gate in your mercenary disguise.  One of the guards asks you to state your business.';
		this.choices[24] = 'Say that you are looking for work in the castle guard^*30^*Say that you are making a delivery for a client^*47^*Say that you are visiting a family member^*46^*Say that you have an important message for the King^*48';
		this.pageText[25] = 'You cross the drawbridge and approach the gate.  The guards look at you suspiciously and put their hands on their weapons.  "Assassins are not welcome in this castle," says one of the guards.';
		this.choices[25] = 'Say that you are visiting a family member^*39^*Say that you have an important message for the King^*40^*Attack the guards^*38^*Leave and try to find another way in^*31';
		this.pageText[26] = 'INVSPLIT:Mercenary Disguise^*24^*25';
		this.choices[26] = 'null^*1';
		this.pageText[27] = 'LOSEGOLD:0^*"You need a merchant\'s permit to trade inside these walls," says one of the guards gruffly.  You tell him that you do not have one.  "We will be willing to overlook that detail, for 5 gold apiece," the guard says, winking at you.';
		this.choices[27] = 'Bribe the guards with 10 gold^*37^*Refuse to pay the guards^*36';
		this.pageText[28] = 'You have an important delivery for the soldiers inside (merchant)';
		this.choices[28] = 'null^*1';
		this.pageText[29] = 'You have a message for the king (merchant)';
		this.choices[29] = 'null^*1';
		this.pageText[30] = 'You are looking for work in the King\'s guard (merc)';
		this.choices[30] = 'null^*1';
		this.pageText[31] = 'You leave the front gate and return to the path outside the castle.  The guards watch you leave until you are out of sight.  It looks like you will need to find another way in. <br>You could avoid the guards and try to swim across the moat.  <br> You could hide in the forest and try to shoot the gate guards with a crossbow.  <br> You could go to the back side of the castle and try to grapple up to the roof with a grappling hook.';
		this.choices[31] = 'Swim the moat^*200^*Attack the guards with a crossbow^*34^*Grapple up the back wall^*32';
		this.pageText[32] = 'INVSPLIT:Grappling hook^*100^*33';
		this.choices[32] = 'null^*1';
		this.pageText[33] = 'Since you did not bring a grappling hook, your plan to grapple up the back wall does not get very far.';
		this.choices[33] = 'Select another choice^*31';
		this.pageText[34] = 'INVSPLIT:Crossbow^*11^*35';
		this.choices[34] = 'null^*1';
		this.pageText[35] = 'Since you did not bring a crossbow, it is impossible to attack the guards from the woods.';
		this.choices[35] = 'Select another choice^*31';
		this.pageText[36] = '"What kind of merchant doesn\'t have a permit?" demands one of the guards. "Get out of here," says the other one dismissively.';
		this.choices[36] = 'Leave and find another way in^*31^*Fight the guards^*38';
		this.pageText[37] = 'bribe the guards';
		this.choices[37] = 'null^*1';
		this.pageText[38] = 'RESTART:^*Your attack is extremely short lived.  One of the gate guards shouts in warning and several of the guards on the roof fire crossbow bolts at you, turning you into a human pincushion. <br>Your life ends here.';
		this.choices[38] = 'null^*1';
		this.pageText[39] = '"And just who exactly are you visiting?" says the guard.  You randomly make up a dookian sounding name, hoping that it sounds credible.  Both guards draw their swords.  "You\'re lying," says one of them, "Surrender your weapons immediately or you will be cut down."';
		this.choices[39] = 'Insist that you are telling the truth^*49^*Surrender to the guards^*42^*Fight the guards^*38^*Flee across the drawbridge^*41^*Take a running leap into the moat^*41';
		this.pageText[40] = '"You think that we are such fools," says one of the guards, "that we would take an assassin to the king just because he claims to have a message?"  Both guards draw their swords.  "Surrender your weapons immediately," demands the guard.';
		this.choices[40] = 'Surrender to the guards^*42^*Fight the guards^*38^*Flee across the drawbridge^*41^*Take a running leap into the moat^*41';
		this.pageText[41] = 'RESTART:^*You turn and sprint away from the guards but only make it a few steps before you are brought down by several crossbow bolts in the back. <br>Your life ends here.';
		this.choices[41] = 'null^*1';
		this.pageText[42] = 'INVCLEAR:Assassin garb,Hidden dagger^*The guards search you and remove all the items that you are carrying and all your gold coins.  They then bind your hands behind your back and lead you into the castle.  You are lead downwards into a dank dungeon and thrown into a filthy cell.  "We will soon find out what your true purpose here is," leers one of the guards.';
		this.choices[42] = 'Continue^*50';
		this.pageText[43] = 'INVSPLIT:Grappling hook^*44^*45';
		this.choices[43] = 'null^*1';
		this.pageText[44] = 'You quickly look around at the nearby branches and pick a thick one that might support your weight.  You fire your grappling hook twice, but it fails to lodge itself into the branch both times.  By now, the guards are dangerously close, and you have no choice but to try to hide in the foliage.';
		this.choices[44] = 'Try to hide in a patch of thick vegetation^*13';
		this.pageText[45] = 'You don\'t have a grappling hook.';
		this.choices[45] = 'Go back^*11';
		this.pageText[46] = 'Want to visit a family member (merch)';
		this.choices[46] = 'null^*1';
		this.pageText[47] = 'Delivery for a client (merc)';
		this.choices[47] = 'null^*1';
		this.pageText[48] = 'Message for the king (merc)';
		this.choices[48] = 'null^*1';
		this.pageText[49] = '"If you are telling the truth," says the guard, "Then you will surrender your weapons immediately and come with us."';
		this.choices[49] = 'Surrender to the guards^*42^*Fight the guards^*38^*Flee across the drawbridge^*41^*Take a running leap into the moat^*41';
		this.pageText[50] = 'INVSPLIT:Hidden dagger^*51^*52';
		this.choices[50] = 'null^*1';
		this.pageText[51] = 'LOSEHEALTH:5^*The guards did not manage to find the hidden dagger that you concealed on your person.  Though your hands are bound behind your back, you manage to reach the dagger and use it to cut through your restraints.  Using the dagger with bound hands is difficult and you cut yourself several times before you manage to free yourself, causing a loss of 5 health.  This dagger and the clothes on your back are the only items you have left - the guards took everything else.  You are surrounded by three stone cell walls and a study looking barred cell door.';
		this.choices[51] = 'Search for a way out of your cell^*53^*Save your strength and wait for a guard to approach^*54';
		this.pageText[52] = 'You struggle to free your bound hands from their restraints, but to no avail.  You are surrounded by three stone cell walls and a study looking barred cell door, and you can think of no way out of the cell.  The guards have taken everything but the clothes on your back.  You have no option but to sit in the cell and wait to see what happens to you.';
		this.choices[52] = 'Continue^*55';
		this.pageText[53] = 'Search for a way out';
		this.choices[53] = 'null^*1';
		this.pageText[54] = 'Save your strength and wait for a guard';
		this.choices[54] = 'null^*1';
		this.pageText[55] = 'Wait in the cell';
		this.choices[55] = 'null^*1';
		this.pageText[100] = "As you work your way around to the back of the castle looking for a good place to attach your grappling hook, you see two towers with windows that you could grapple to, one to the North and one to the East.  The northern tower is a bit higher than the east but the ledges appear to be the same from the ground."';
		this.choices[100] = 'Grapple up the Northern Tower^*101^*Grapple up the Eastern Tower^*102';
		this.pageText[200] = 'Page 200 (moat)';
		this.choices[200] = 'Content not added^*1';
		this.pageText[300] = 'Page 300 (castle courtyard)';
		this.choices[300] = 'Content not added^*1';
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
						inventoryAddArray = inventoryAdd[1].split(',');
						for (i = 0; i < inventoryAddArray.length; i++) {
							this.inventory[this.inventory.length] = inventoryAddArray[i];
						}
					} else {
						this.inventory[this.inventory.length] = inventoryAdd[1];
					}
					this.message = specialPageArray[1];
				}
				//INVCLEAR: n, remove all inventory items except for n.  Clears gold unless 'gold' is listen in n
				else if (specialPageArray[0].match('INVCLEAR:') != null) {
					inventorySave = specialPageArray[0].split('INVCLEAR:');
					//Add multiple inventory items by seperating them by a comma
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
				//LOSEGOLD: n, lose n gold
				else if (specialPageArray[0].match('LOSEGOLD:') != null) {
					goldLost = specialPageArray[0].split('LOSEGOLD:');
					if (goldLost[1] == 'all') {
						this.gold = 0;
					} else {
						this.gold = this.gold - goldLost[1];
					}
					if (this.gold < 0) {
						this.gold = 0;
					}
					this.message = specialPageArray[1] + '<br>You have ' + this.gold + ' gold coins.';
				}
				else if (specialPageArray[0].match('GAINGOLD:') != null) {
					goldGain = specialPageArray[0].split('GAINGOLD:');
					this.gold = this.gold + goldGain[1];
					this.message = specialPageArray[1] + '<br>You have ' + this.gold + ' gold coins.';
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