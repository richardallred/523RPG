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
		this.pageText[1] = 'You are sent on a quest to the nearby land of Dookia, which has been at war with your people of Carolinia for centuries.  Your spies report that the King of Dookia has uncovered a legendary artifact, a powerful ring that gives its possessor the power to cast devestating magic.  The brutal and tyrannous King K plans to march into battle with the ring in one week\'s time to subjugate Carolinia under Dookian rule forever. Knowing that such an artifact could spell doom for Carolinia, you sneak into Dookia territory and approach the castle of the King.  You hope to sneak into the castle, recover the ring, and save your people.';
		this.choices[1] = 'Continue^*2';
		this.pageText[2] = 'INVSELECT:4^*When you were leaving Carolinia, you were given a pouch of gold coins and access to the royal armory to obtain items you needed for your quest.  In order to travel lightly for the long journey to the Dookian castle, you decided to take just four items from the store room. <br> Which items did you take?';
		this.choices[2] = 'Sword^*3^*Crossbow^*3^*Hidden dagger^*3^*Grappling hook^*3^*Lockpicking kit^*3^*First aid kit^*3^*Leather vest (not implemented yet)^*3^*Shield (not implemented yet)^*3';
		this.pageText[3] = 'INVSELECT:1^*In order to pass through Dookia without arousing suspicion, you selected a disguise to enter the country with.  If you take the clothes of a Dookian merchant, you can talk your way through situations by pretending to be a harmless trader.  If you take the clothes of a Dookian mercenary, you can pretend to be looking for work while being constantly ready for combat.  If you take the dark garb of an assassin, you would arouse more suspicion but easily blend into dark areas. <br>Which clothes did you pick?';
		this.choices[3] = 'Merchant Disguise^*4^*Mercenary Disguise^*4^*Assassin Garb^*4';
		this.pageText[4] = 'You manage to arrive at Castle Dookenstein without incident.  The castle is a towering fortress of stone that looms over the countryside, surrounded by a deep moat.  An ancient forest is to the right of the castle.  There is a path that leads to the castle drawbridge and the main gate, which is closed.  Across the drawbridge, there are two guards in full Dookian armor standing by the gate.  On the top of the castle, there are several more guards facing the front of the castle and holding crossbows.  You come up with several ideas to enter the castle, but all of them are risky. <br>  You could try to talk your way past the guards and enter the front gate. <br> You could avoid the guards and try to swim across the moat.  <br> You could hide in the forest and try to shoot the gate guards with a crossbow.  <br> You could go to the back side of the castle and try to grapple up to the roof with a grappling hook.';
		this.choices[4] = 'Try the front gate^*5^*Swim the moat^*200^*Attack the guards with a crossbow^*7^*Grapple up the back wall^*8';
		this.pageText[5] = 'INVSPLIT:Merchant Disguise^*6^*26';
		this.choices[5] = 'null^*1';
		this.pageText[6] = 'As part of your merchant disguise, you brought a horse and cart full of goods.  You ride the horse across the drawbridge and approach the guards.  One of them asks you to state your business.';
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
		this.pageText[14] = 'You immediately start sprinting through the trees away from the castle.  The thick undergrowth hinders your progress, as you have to force your way through the vegetation.  You look over your shoulder and see the soldiers dismount their horses to give chase.  Three of them load crossbows and point them at your fleeing form.  Despite the heavy vegetation, the soldiers have a clear shot at you.';
		this.choices[14] = 'Dive to the ground^*15^*Keep running and hope you are not hit^*16';
		this.pageText[15] = 'RESTART:^*As you dive to the ground, you can hear crossbow bolts whiz over your head.  Unfortunately, you dive into a thick patch of briars, which lodge into your clothes and skin.  The thorns tear at you as you struggle to extricate yourself, and by the time you struggle free, one of the soldiers has managed to catch up to you.  He cuts you down with his sword. <br> Your life ends here.';
		this.choices[15] = 'null^*1';
		this.pageText[16] = 'Two of the crossbow bolts lodge harmlessly into trees, but one of them buries itself into your right shoulder.  Ignoring the pain, you continue to run haphazardly through the woods.  After several minutes of frenzied running, you are forced the stop from pain and exhaustion.  The soldiers are nowhere to be seen, but you realize that you are lost.  Except for a stream flowing on the left, there are no visible landmarks in sight.';
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
		this.pageText[27] = 'DISPLAYGOLD:^*"You need a merchant\'s permit to trade inside these walls," says one of the guards gruffly.  You tell him that you do not have one.  "We will be willing to overlook that detail, for 5 gold apiece," the guard says.';
		this.choices[27] = 'Bribe the guards with 10 gold^*37^*Refuse to pay the guards^*36';
		this.pageText[28] = 'INVCHECK:Grappling hook^*You say that you are bringing supplies and rations to the soldiers to prepare for the upcoming invasion.  One of the guards searches your cart thoroughly.  He takes out the grappling hook that you had hidden under a sack of food. "What use does a merchant have of this?" demands the guard.^*70';
		this.choices[28] = 'Say that you were planning to sell it to someone inside the castle.^*73^*Say that you use it for recreational purposes^*93^*Say that someone must have planted it in your cart^*93';
		this.pageText[29] = '"The King has no time to waste with messages from common merchants," says one of the guards dismissively, "He is planning an important campaign and cannot be bothered right now."';
		this.choices[29] = 'Try to bribe the guards^*64^*Leave and try to find another way in^*31';
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
		this.pageText[37] = 'INVSPLIT:Hidden dagger^*77^*78';
		this.choices[37] = 'null^*1';
		this.pageText[38] = 'RESTART:^*Your attack is extremely short lived.  One of the guards shouts in warning and several of the guards on the roof fire crossbow bolts at you, turning you into a human pincushion. <br>Your life ends here.';
		this.choices[38] = 'null^*1';
		this.pageText[39] = '"And just who exactly are you visiting?" says the guard.  You randomly make up a dookian sounding name, hoping that it sounds credible.  Both guards draw their swords.  "You\'re lying," says one of them, "Surrender your weapons immediately or you will be cut down."';
		this.choices[39] = 'Insist that you are telling the truth^*49^*Surrender to the guards^*42^*Fight the guards^*38^*Flee across the drawbridge^*41^*Take a running leap into the moat^*41';
		this.pageText[40] = '"You think that we are such fools," says one of the guards, "that we would take an assassin to the king just because he claims to have a message?"  Both guards draw their swords.  "Surrender your weapons immediately," demands the guard.';
		this.choices[40] = 'Surrender to the guards^*42^*Fight the guards^*38^*Flee across the drawbridge^*41^*Take a running leap into the moat^*41';
		this.pageText[41] = 'RESTART:^*You turn and sprint away from the guards but only make it a few steps before you are brought down by several crossbow bolts in the back. <br>Your life ends here.';
		this.choices[41] = 'null^*1';
		this.pageText[42] = 'INVCLEAR:Assassin garb,Merchant Disguise,Mercenary Disguise,Hidden dagger^*The guards roughly search you and remove all the items that you are carrying and all your gold coins.  They then bind your hands behind your back and lead you into the castle.  You are lead downwards into a dank dungeon and thrown into a filthy cell.  "We will soon find out what your true purpose here is," leers one of the guards.';
		this.choices[42] = 'Continue^*550';
		this.pageText[43] = 'INVSPLIT:Grappling hook^*44^*45';
		this.choices[43] = 'null^*1';
		this.pageText[44] = 'You quickly look around at the nearby branches and pick a thick one that might support your weight.  You launch your grappling hook twice, but it fails to lodge itself into the branch both times.  By now, the guards are dangerously close, and you have no choice but to try to hide in the foliage.';
		this.choices[44] = 'Try to hide in a patch of thick vegetation^*13';
		this.pageText[45] = 'You don\'t have a grappling hook, and you don\'t have enough time to climb a tree with your bare hands.';
		this.choices[45] = 'Go back^*11';
		this.pageText[46] = '"And what family member is that?" asks one of the guards.  You quickly make up something that you hope is convincing. <br>You say that you are visiting...';
		this.choices[46] = 'Your father, the Duke of Pucia^*56^*Your parents, the Rosens^*57^*Your half-cousin, Norman Orwell^*58';
		this.pageText[47] = 'DISPLAYGOLD:^*"Very well," says one of the guards, "Give me the item to deliver and the name of the person, and I will make sure that the item is delivered - for a small fee of five gold pieces, of course."';
		this.choices[47] = 'Give the guards one of your items and the gold^*62^*Say that the delivery must be made in person^*63';
		this.pageText[48] = '"Very well," says one of the guards, "Give me the message and I will ensure that it is delivered to the King."';
		this.choices[48] = 'Say that the message must be delivered in person^*65^*Tell him that there is a plot to overthrow the King^*66^*Tell him that the Carolinians plan to attack the castle^*67^*Tell him that one of the King\'s relatives has died^*68';
		this.pageText[49] = '"If you are telling the truth," says the guard, "Then you will surrender your weapons immediately and come with us."';
		this.choices[49] = 'Surrender to the guards^*42^*Fight the guards^*38^*Flee across the drawbridge^*41^*Take a running leap into the moat^*41';
		this.pageText[50] = '"The Duke\'s youngest son Ernest is not a merchant," says one of the guards, "And you look nothing like him."  The guards seize you and place you under arrest.';
		this.choices[50] = 'Continue^*42';
		this.pageText[51] = '"Welcome, Ernest," says the guard, bowing his head. "Enjoy your visit."  The gate opens and you enter the castle.';
		this.choices[51] = 'Enter the castle^*300';
		this.pageText[52] = 'DISPLAYGOLD:^*One of the guards gets a greedy glint in his eye.  "We could allow you to enter the castle, but it will cost you dearly.  15 gold pieces for each of us, and no less."';
		this.choices[52] = 'Give the guards 30 gold pieces^*97^*Try to get in with only 20 gold pieces^*53^*Forget talking and fight your way in^*38^*Leave and try to find another way in^*31';
		this.pageText[53] = 'LOSEGOLD:20^*The guards pocket your gold pieces and laugh at you.  "A fool and his money are soon parted," mocks one of the guards.';
		this.choices[53] = 'Attack them^*38^*Leave and try to find another way in^*31';
		this.pageText[54] = 'DISPLAYGOLD:^*"If that delivery is so important to you," says one of the guards, "then it must be worth something for us to let you in.  10 gold pieces for each of us should be sufficient."';
		this.choices[54] = 'Give the guards 20 gold^*55^*Say that you only have 10 gold^*94^*Attack the guards^*38^*Leave and try to find another way in^*31';
		this.pageText[55] = 'LOSEGOLD:20^*The guards take your gold coins and call for the gate to be opened.  "Make your delivery quickly and stay out of trouble," says one of them.';
		this.choices[55] = 'Enter the Castle^*300';
		this.pageText[56] = '"I was not aware that his excellency was residing in the castle," the guard says, "Which one of his children are you?"  You realize that you don\'t know the names of the Duke\'s children but you blurt out the first name that comes to mind. <br>You say that you are...';
		this.choices[56] = 'Frank^*59^*Brian^*61^*Thomas^*61^*Leroy^*61^*Bob^*61^*Ernest^*60^*Ned^*61^*Kyle^*61';
		this.pageText[57] = '"You will have to visit your parents another time," says one of the guards, "Everyone in the castle is preparing for the upcoming invasion."  The guard gestures for you to leave.';
		this.choices[57] = 'Leave and try to find another way in^*31^*Try to bribe the guards^*52^*Forget talking and fight your way in^*38';
		this.pageText[58] = '"You will have to visit your half-cousin another time," says one of the guards, "Everyone in the castle is preparing for the upcoming invasion."  The guard gestures for you to leave.';
		this.choices[58] = 'Leave and try to find another way in^*31^*Try to bribe the guards^*52^*Forget talking and fight your way in^*38';
		this.pageText[59] = 'LOSEHEALTH:5^*"The Duke\'s son Frank died two months ago," says one of the guards, "You are either a ghost or a spy, and I don\'t believe in ghosts."  The other guard draws a mace and clubs you on the head before you can react, causing you to lose 5 health.  While you are still dazed from the blow, the guards seize you.';
		this.choices[59] = 'Continue^*42';
		this.pageText[60] = 'INVSPLIT:Merchant Disguise^*50^*51';
		this.choices[60] = 'null^*1';
		this.pageText[61] = 'LOSEHEALTH:5^*"The Duke has no son by that name," says one of the guards, "You are a spy."  The other guard draws a mace and clubs you on the head before you can react, causing you to lose 5 health.  While you are still dazed from the blow, the guards seize you.';
		this.choices[61] = 'Continue^*42';
		this.pageText[62] = 'INVREMOVESELECT:1^*When the guard asks you who you want to delivery made to, you make up a Dookian sounding name, Norman Orwell.  Which item do you give the guard to deliver?';
		this.choices[62] = 'Continue^*95';
		this.pageText[63] = '"You will have to make your delivery next week", says one of the guards, "Everyone in the castle is preparing for the upcoming invasion."  The guard gestures for you to leave.';
		this.choices[63] = 'Say that the delivery must be made today^*54^*Leave and try to find another way in^*31^*Try to bribe the guards^*52^*Forget talking and fight your way in^*38';
		this.pageText[64] = 'DISPLAYGOLD:^*You tell the guards that you will make it worth their while if they allow you an audience with the king.  The guards agree to do it, but only if they are each paid 10 gold pieces.  You try to negiotiate with them, but they say that their jobs are at stake and refuse to take any less money.';
		this.choices[64] = 'Pay them 20 gold^*69^*Leave and try to find another way in^*31';
		this.pageText[65] = 'The urgency of your tone convinces the guards and they reluctantly decide to allow you an audience with the King.  "You had better not be wasting his time," says one of the guards, "Or he will execute you on the spot."  The castle gate is opened and a regiment of soldiers lead you to the throne room.  You enter the throne room, and can see King K sitting on a golden throne that is draped with dark blue tapestries.  The King has an ornate golden ring upon his finger and carries a scepter in his hand. One of the soldiers announces that you have a message for the King.  "What message is that?" demands King K.';
		this.choices[65] = 'Content not added^*1';
		this.pageText[66] = '"A plot to overthrow the King?" says one of the guards, "King K must hear of this immediately!" The castle gate is opened and a regiment of soldiers lead you to the throne room.  You enter the throne room, and can see King K sitting on a golden throne that is draped with dark blue tapestries.  The King has an ornate golden ring upon his finger and carries a scepter in his hand. "This mercenary says that he knows of a plot to overthrow you," announces one of the soldiers.  King K demands that you tell him the details immediately.';
		this.choices[66] = 'Content not added^*1';
		this.pageText[67] = 'The guards laugh at you. "The King doesn\'t care if those pathetic Carolinians attack the castle.  Castle Dookenstein is too well defended and the King has a weapon that will crush any opposing force.  Stop wasting our time with useless information."  The guard who spoke gestures for you to leave.';
		this.choices[67] = 'Leave and try to find another way in^*31^*Attack the guards^*38';
		this.pageText[68] = 'You tell the guard that the King\'s nephew has passed away.  "I will deliver that message to the King," says the guard.  The gate opens and the guard walks in.  You start to follow him, but the other guard holds out a hand to stop you.  "You are no longer needed here, mercenary," says the guard, "The message will be delivered."';
		this.choices[68] = 'Run past the guard through the open gate^*76^*Leave and try to find another way into the castle^*31';
		this.pageText[69] = 'LOSEGOLD:20^*You pay the guards 10 coins each and they pocket it and agree to give you an audience with the King.  "You had better not be wasting his time," says one of the guards, "Or he will execute you on the spot."  The castle gate is opened and a regiment of soldiers lead you to the throne room.  You enter the throne room, and can see King K sitting on a golden throne that is draped with dark blue tapestries.  The King has an ornate golden ring upon his finger and carries a scepter in his hand. One of the soldiers announces that you have a message for the King.  "What message is that?" demands King K.';
		this.choices[69] = 'Content not added^*1';
		this.pageText[70] = 'INVSPLIT:Lockpicking kit^*71^*72';
		this.choices[70] = 'null^*1';
		this.pageText[71] = 'You say that you are bringing supplies and rations to the soldiers to prepare for the upcoming invasion.  One of the guards searches your pack while the other guard searches your cart thoroughly.  He takes out the lockpicking kit that you had hidden in your cart. "These are used only by thieves and spies," says the guard, "You are no merchant!"  The guards immediately seize you.';
		this.choices[71] = 'Continue^*42';
		this.pageText[72] = 'INVREMOVE:Sword,Crossbow^*You say that you are bringing supplies and rations to the soldiers to prepare for the upcoming invasion.  One of the guards searches your pack while the other guard searches your cart thoroughly.  They remove any weapons that you had brought (except the hidden dagger). Finally, the guards allow you entry.  "Deliver these supplies to Colonel Graywald in the barracks," says one of the guards, "He will pay you for them."';
		this.choices[72] = 'Enter the castle^*300';
		this.pageText[73] = 'INVSPLIT:Lockpicking kit^*74^*75';
		this.choices[73] = 'null^*1';
		this.pageText[74] = 'LOSEHEALTH:5^*The guards reluctantly accept your story, but they confiscate your grappling hook to be safe.  The guard continues searching your cart, and finds the lockpicking kit that you had hidden there.  "A grappling hook and a lockpicking kit?" exclaims the guard, "You are no merchant!" Before you can react, the other guard takes a mace and clubs you on the head, causing you to lose 5 health.  While you are still dazed from the blow, the guards seize you.';
		this.choices[74] = 'Continue^*42';
		this.pageText[75] = 'INVREMOVE:Grappling hook,Sword,Crossbow^*The guards reluctantly accept your story, but they confiscate your grappling hook to be safe.  The guard continues searching your cart, and removes any weapons that you had brought (except the hidden dagger).  Finally, the guards allow you entry.  "Deliver these supplies to Colonel Graywald in the barracks," says one of the guards, "He will pay you for them."';
		this.choices[75] = 'Enter the castle^*300';
		this.pageText[76] = 'RESTART:^*As you run past the guard and into the gate, he gives a shout of warning.  Several guards converge from the courtyard, and they cut you down with their swords.  Your life ends here.';
		this.choices[76] = 'null^*1';
		this.pageText[77] = 'INVSPLIT:Sword^*79^*80'
		this.choices[77] = 'null^*1';
		this.pageText[78] = 'INVSPLIT:Sword^*85^*86'
		this.choices[78] = 'null^*1';
		this.pageText[79] = 'INVSPLIT:Crossbow^*81^*82';
		this.choices[79] = 'null^*1';
		this.pageText[80] = 'INVSPLIT:Crossbow^*83^*84';
		this.choices[80] = 'null^*1';
		this.pageText[81] = 'LOSEGOLD:10^*The guards pocket your gold coins. "You must be some sort of fool to try to trade without a permit," says one of the guards, "Don\'t blame us if you get arrested."  <br>"You are not allowed to bring weapons into the castle," says the other guard, "We will have to confiscate any that you have." <br>As part of your merchant disguise, you hid your sword and crossbow in your cart.  Your hidden dagger is well concealed in your clothing.  You could hand them over or hope that the guards do not find them.';
		this.choices[81] = 'Give the guards your sword, crossbow, and hidden dagger^*88^*Give the guards your sword and crossbow but not your hidden dagger^*91^*Pretend that you have no weapons^*92';
		this.pageText[82] = 'LOSEGOLD:10^*The guards pocket your gold coins. "You must be some sort of fool to try to trade without a permit," says one of the guards, "Don\'t blame us if you get arrested."  <br>"You are not allowed to bring weapons into the castle," says the other guard, "We will have to confiscate any that you have." <br>As part of your merchant disguise, you hid your sword in your cart.  Your hidden dagger is well concealed in your clothing.  You could hand them over or hope that the guards do not find them.';
		this.choices[82] = 'Give the guards your sword and hidden dagger^*88^*Give the guards your sword but not your hidden dagger^*90^*Pretend that you have no weapons^*92';
		this.pageText[83] = 'LOSEGOLD:10^*The guards pocket your gold coins. "You must be some sort of fool to try to trade without a permit," says one of the guards, "Don\'t blame us if you get arrested."  <br>"You are not allowed to bring weapons into the castle," says the other guard, "We will have to confiscate any that you have." <br>As part of your merchant disguise, you hid your crossbow in your cart.  Your hidden dagger is well concealed in your clothing.  You could hand them over or hope that the guards do not find them.';
		this.choices[83] = 'Give the guards your crossbow and hidden dagger^*88^*Give the guards your crossbow but not your hidden dagger^*90^*Pretend that you have no weapons^*92';
		this.pageText[84] = 'LOSEGOLD:10^*The guards pocket your gold coins. "You must be some sort of fool to try to trade without a permit," says one of the guards, "Don\'t blame us if you get arrested."  <br>"You are not allowed to bring weapons into the castle," says the other guard, "We will have to confiscate any that you have." <br>Your hidden dagger is well concealed in your clothing.  You could hand it over or hope that the guards do not find it.';
		this.choices[84] = 'Give the guards your hidden dagger^*88^*Pretend that you have no weapons^*89';
		this.pageText[85] = 'LOSEGOLD:10^*The guards pocket your gold coins. "You must be some sort of fool to try to trade without a permit," says one of the guards, "Don\'t blame us if you get arrested."  <br>"You are not allowed to bring weapons into the castle," says the other guard, "We will have to confiscate any that you have." <br>As part of your merchant disguise, you hid your weapons in your cart.  You could hand them over or hope that the guards do not find them.';
		this.choices[85] = 'Give the guards your weapons^*88^*Pretend that you have no weapons^*92';
		this.pageText[86] = 'INVSPLIT:Crossbow^*85^*87';
		this.choices[86] = 'null^*1';
		this.pageText[87] = 'LOSEGOLD:10^*The guards pocket your gold coins. "You must be some sort of fool to try to trade without a permit," says one of the guards, "Don\'t blame us if you get arrested."  <br>"You are not allowed to bring weapons into the castle," says the other guard, "We will have to confiscate any that you have."  You tell the guards that you have no weapons.  The guards briefly search you and your cart, and then allow you to enter the castle.';
		this.choices[87] = 'Enter the Castle^*300';
		this.pageText[88] = 'INVREMOVE:Sword,Crossbow,Hidden dagger^*The guards remove your weapons and briefly search you and your cart.  Satisfied, they allow you to enter the castle.';
		this.choices[88]  = 'Enter the Castle^*300';
		this.pageText[89] = 'The guards briefly search you and your cart but do not find your hidden dagger.  Satisfied, the allow you to enter the castle.';
		this.choices[89] = 'Enter the Castle^*300';
		this.pageText[90] = 'INVREMOVE:Sword,Crossbow^*The guards take your weapon and briefly search you and your cart but do not find your hidden dagger.  Satisfied, the allow you to enter the castle.';
		this.choices[90] = 'Enter the Castle^*300';
		this.pageText[91] = 'INVREMOVE:Sword,Crossbow^*The guards take your sword and crossbow and briefly search you and your cart but do not find your hidden dagger.  Satisfied, the allow you to enter the castle.';
		this.choices[91] = 'Enter the Castle^*300';
		this.pageText[92] = 'RESTART:^*You tell the guards that you have no weapons. The guards briefly search you and your cart. "He is lying!" exclaims the guard searching the cart, as he uncovers a weapon.  "The punishment for lying to a castle guard is death," says the other guard grimly, drawing his sword.  Without any weapons, you cannot defend yourself. <br>Your life ends here.'
		this.choices[92] = 'null^*1';
		this.pageText[93] = 'The guards do not believe you. "I think that the grappling hook is the tool of a spy, not a merchant," declares one of them.  Before you can react, the guards seize you.  "We will find out soon enough."';
		this.choices[93] = 'Continue^*42';
		this.pageText[94] = '"If you don\'t have enough gold, then you aren\'t getting into the castle," replies the guard.';
		this.choices[94] = 'Say that you must have counted wrong and you actually have 20 gold pieces^*55^*Attack the guards^*38^*Leave and find another way in^*31';
		this.pageText[95] = 'LOSEGOLD:5^*The guard takes your delivery and 5 gold pieces and calls for the gate to be opened. The gate opens and the guard walks in.  You start to follow him, but the other guard holds out a hand to stop you.  "You are no longer needed here, mercenary," says the guard, "The delivery will be made."';
		this.choices[95] = 'Insist that you come with the guard to make sure^*96^*Run past the guard through the open gate^*76^*Leave and try to find another way into the castle^*31';
		this.pageText[96] = 'You are allowed to follow the guard into the castle courtyard.  Knowing that the guard will soon find out that there is no such person as Norman Orwell, you wait until he is not looking and lose him in the crowd of people.  Soon, the guard is completely out of sight.';
		this.choices[96] = 'Continue^*300';
		this.pageText[97] = 'LOSEGOLD:30^*You pay the guards, and they allow you to enter the castle.^*98';
		this.choices[97] = 'Enter the Castle^*300';
		this.pageText[98] = 'DISPLAYGOLD:^*You don\'t have enough money.';
		this.choices[98] = 'Go Back^*52';
		
		this.pageText[100] = 'As you work your way around to the back of the castle looking for a good place to attach your grappling hook, you see two towers with windows that you could grapple to, one to the North and one to the East.  The northern tower is a bit higher than the east but the ledges appear to be the same from the ground.';
		this.choices[100] = 'Grapple up the Northern Tower^*101^*Grapple up the Eastern Tower^*102';
		this.pageText[101]= 'You swing the hook around and around and launch it up to the ledge of the window on the Northern Tower.  You miss the ledge by a few feet.  After a few more failed tries you realize that your grappling hook is not quite long enough to reach this ledge.';
		this.choices[101]= 'Keep trying to get up the North Tower by climbing up a nearby tree^*103^*Give up and try the Eastern Tower^*102';
		this.pageText[102] = 'You walk over to the eastern tower and you swing the hook around and around and launch it up to the ledge of the window, it catches and the hold seems firm';
		this.choices[102] = 'Pull yourself up the grapple^*104^*Reconsider this whole climbing thing and go back around to the front of the castle^*4';
		this.pageText[103]='LOSEHEALTH:5^*You climb up to the top of the tree, far enough to where you think the grapple will now reach the North tower, as you swing the grapple you lose your balance and fall to the ground.  You decide not to try that again.';
		this.choices[103] ='Try the Eastern tower^*102^*Go back to the castle entrance^*4';
		this.pageText[200] = 'Page 200 (moat)';
		this.choices[200] = 'Content not added^*1';
		this.pageText[300] = 'Page 300 (castle courtyard)';
		this.choices[300] = 'Content not added^*1';
		this.pageText[550] = 'INVSPLIT:Hidden dagger^*551^*552';
		this.choices[550] = 'null^*1';
		this.pageText[551] = 'LOSEHEALTH:5^*The guards did not manage to find the hidden dagger that you concealed on your person.  Though your hands are bound behind your back, you manage to reach the dagger and use it to cut through your restraints.  Using the dagger with bound hands is difficult and you cut yourself several times before you manage to free yourself, causing a loss of 5 health.  This dagger and the clothes on your back are the only items you have left - the guards took everything else.  You are surrounded by three stone cell walls and a study looking barred cell door.';
		this.choices[551] = 'Search for a way out of your cell^*553^*Save your strength and wait for a guard to approach^*554';
		this.pageText[552] = 'You struggle to free your bound hands from their restraints, but to no avail.  You are surrounded by three stone cell walls and a study looking barred cell door, and you can think of no way out of the cell.  The guards have taken everything but the clothes on your back.  You have no option but to sit in the cell and wait to see what happens to you.';
		this.choices[552] = 'Continue^*555';
		this.pageText[553] = 'Search for a way out';
		this.choices[553] = 'Content not added^*1';
		this.pageText[554] = 'Save your strength and wait for a guard';
		this.choices[554] = 'Content not added^*1';
		this.pageText[555] = 'Wait in the cell';
		this.choices[555] = 'Content not added^*1';
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
				//remove inventory items with INVREMOVE
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
						this.message = specialPageArray[1];
						for (i = 0; i < removedArray.length; i++) {
							this.message = this.message + removedArray[i];
							if (i > 0 && i < removedArray.length - 1) {
								this.message = this.message + ', ';
							}
						}
					}
				}
				//INVCLEAR: n, remove all inventory items except for n.  Clears gold unless 'gold' is listed in n
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
					//does not work for more than 1 item at the moment
					inventoryRemoveNumber[1] = 1;
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
					if (this.invselect == 1) {
						//remove chosen item from inventory
						for (i = 1; i < this.inventory.length; i++) {
							if (this.inventory[i] == choicesArray[choiceNum * 2 - 2]) {
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
					if (alreadyRemovedCount >= inventoryRemoveNumber[1] || this.inventory.length == 1) {
						//the number of inventory items you can pick has been reached, move on to the next page
						this.invselect = 0;
						this.page = nextPageNum;
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
				else if (specialPageArray[0].match('GAINGOLD:') != null) {
					goldGain = specialPageArray[0].split('GAINGOLD:');
					this.gold = this.gold + goldGain[1];
					this.message = specialPageArray[1] + '<br>You have ' + this.gold + ' gold coins.';
				}
				else if (specialPageArray[0].match('DISPLAYGOLD:') != null) {
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