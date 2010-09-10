/**
 * UOW sample stop watch widget.
 *
 * Copyright UNC Open Web Team 2010. All Rights Reserved.
 */
dojo.provide('myapp.Maze');
dojo.require('dijit._Widget');
dojo.require('dijit._Templated');
dojo.require('dojo.i18n');
dojo.requireLocalization('myapp', 'Maze');

dojo.declare('myapp.Maze', [dijit._Widget, dijit._Templated], {
    widgetsInTemplate: true,
	templatePath: dojo.moduleUrl('myapp.templates', 'Maze.html'),

    postMixInProperties: function() {
		//Page 1: the program starts here
	    //this.labels = dojo.i18n.getLocalization('myapp', 'Maze');
		this.labels = {choiceOne: 'Enter the Maze', choiceTwo: '', choiceThree: '', choiceFour: ''};
		this.message = 'Welcome to Maze';
		this.page = 0;
		this.sword = 0;
		console.log('Start Maze');
    },
	
	_choiceOne: function(event) {
		if (this.page == 0) {
			this.labels = {choiceOne: 'Go North', choiceTwo: 'Go East'};
			this.message = 'You are in a maze.  There are exits to the north and to the east.';
			this.page = 1;
		}
		else if (this.page == 1) {
			this.labels = {choiceOne: 'Go South', choiceTwo: 'Go East'};
			this.message = 'You are in a maze.  There are exits to the south and to the east.';
			this.page = 2;
		}
		else if (this.page == 2) {
			this.labels = {choiceOne: 'Go North', choiceTwo: 'Go East'};
			this.message = 'You are in a maze.  There are exits to the north and to the east.';
			this.page = 1;
		}
		else if (this.page == 3) {
			this.labels = {choiceOne: 'Go North', choiceTwo: 'Go East'};
			this.message = 'You are in a maze.  There are exits to the north and to the east.';
			this.page = 1;
		}
		else if (this.page == 4) {
			this.labels = {choiceOne: 'Go South'};
			this.message = 'You are in a maze.  There is an exit to the south.';
			this.page = 5;
		}
		else if (this.page == 5) {
			this.labels = {choiceOne: 'Go North', choiceTwo: 'Go East', choiceThree: 'Go South', choiceFour: 'Go West'};
			this.message = 'You are in a maze.  There are exits to the north, to the east, to the west, and to the south.';
			this.page = 4;
		}
		else if (this.page == 6) {
			this.labels = {choiceOne: 'Go West'};
			this.message = 'You take the sword.  There is nothing else in the room.';
			this.sword = 1;
			this.page = 8;
		}
		else if (this.page == 7) {
			this.labels = {choiceOne: 'Go North', choiceTwo: 'Go East', choiceThree: 'Go South', choiceFour: 'Go West'};
			this.message = 'You are in a maze.  There are exits to the north, to the east, to the west, and to the south.';
			this.page = 4;
		}
		else if (this.page == 8) {
			this.labels = {choiceOne: 'Go North', choiceTwo: 'Go East', choiceThree: 'Go South', choiceFour: 'Go West'};
			this.message = 'You are in a maze.  There are exits to the north, to the east, to the west, and to the south.';
			this.page = 4;
		}
		else if (this.page == 9) {
			if (this.sword == 1) {
				this.labels = {choiceOne: 'Continue to the East'};
				this.message = 'Using your sword, you defeat the monster.';
				this.page = 11;
			} else {
				this.labels = {choiceOne: 'Restart the Maze'};
				this.message = 'You try to fight the monster with your bare hands but the monster easily dispatches you.  You are dead.';
				this.page = 10;
			}
		}
		else if (this.page == 10) {
			this.labels = {choiceOne: 'Go North', choiceTwo: 'Go East'};
			this.message = 'You are in a maze.  There are exits to the north and to the east.';
			this.clearCanvas();
			this.page = 1;
		}
		else if (this.page == 11) {
			this.labels = {choiceOne: 'Restart the Maze'};
			this.message = 'You have escaped the maze.  You win!';
			this.sword = 0;
			this.page = 12;
		}
		else if (this.page == 12) {
			this.labels = {choiceOne: 'Go North', choiceTwo: 'Go East'};
			this.message = 'You are in a maze.  There are exits to the north and to the east.';
			this.clearCanvas();
			this.page = 1;
		}
		else if (this.page == 13) {
			this.labels = {choiceOne: 'Go North', choiceTwo: 'Go East', choiceThree: 'Go South', choiceFour: 'Go West'};
			this.message = 'You are in a maze.  There are exits to the north, to the east, to the west, and to the south.';
			this.page = 4;
		}
		this.refreshButtons();
	},
	_choiceTwo: function(event) {
		if (this.page == 1) {
			this.labels = {choiceOne: 'Go West'};
			this.message = 'You are in a maze.  There is an exit to the west.';
			this.page = 3;
		}
		else if (this.page == 2) {
			this.labels = {choiceOne: 'Go East', choiceTwo: 'Go West'};
			this.message = 'You are in a maze.  There are exits to the east and to the west.';
			this.page = 13;
		}
		else if (this.page == 4) {
			if (this.sword == 0) {
				this.labels = {choiceOne: 'Take the sword', choiceTwo: 'Go West'};
				this.message = 'You are in a maze.  There is a sword on the ground.  There is an exit to the west.';
				this.page = 6;
			} else {
				this.labels = {choiceOne: 'Go West'};
				this.message = 'You are in a maze.  There is an exit to the west.';
				this.page = 8;
			}
		}
		else if (this.page == 6) {
			this.labels = {choiceOne: 'Go North', choiceTwo: 'Go East', choiceThree: 'Go South', choiceFour: 'Go West'};
			this.message = 'You are in a maze.  There are exits to the north, to the east, to the west, and to the south.';
			this.page = 4;
		}
		else if (this.page == 7) {
			this.labels = {choiceOne: 'Fight the monster', choiceTwo: 'Go West'};
			this.message = 'You are in a maze.  There is a hideous monster in the room that is blocking an exit to the east.  There is an exit to the west.';
			this.page = 9;
		}
		else if (this.page == 9) {
			this.labels = {choiceOne: 'Go North', choiceTwo: 'Go East'};
			this.message = 'You are in a maze.  There are exits to the north and to the east.';
			this.page = 7;
		}
		else if (this.page == 13) {
			this.labels = {choiceOne: 'Go South', choiceTwo: 'Go East'};
			this.message = 'You are in a maze.  There are exits to the south and to the east.';
			this.page = 2;
		}
		this.refreshButtons();
	},
	_choiceThree: function(event) {
		if (this.page == 4) {
			this.labels = {choiceOne: 'Go North', choiceTwo: 'Go East'};
			this.message = 'You are in a maze.  There are exits to the north and to the east.';
			this.page = 7;
		}
		this.refreshButtons();
	},
	_choiceFour: function(event) {
		if (this.page == 4) {
			this.labels = {choiceOne: 'Go East', choiceTwo: 'Go West'};
			this.message = 'You are in a maze.  There are exits to the east and to the west.';
			this.page = 13;
		}
		this.refreshButtons();
	},
	refreshButtons: function() {
		this.buttonOne.attr('label', this.labels.choiceOne);
		if (this.labels.choiceTwo == null) {
			this.buttonTwo.attr('style', 'display: none');
		} else {
			this.buttonTwo.attr('style', 'display: inline');
			this.buttonTwo.attr('label', this.labels.choiceTwo);
		}
		if (this.labels.choiceThree == null) {
			this.buttonThree.attr('style', 'display: none');
		} else {
			this.buttonThree.attr('style', 'display: inline');
			this.buttonThree.attr('label', this.labels.choiceThree);
		}
		if (this.labels.choiceFour == null) {
			this.buttonFour.attr('style', 'display: none');
		} else {
			this.buttonFour.attr('style', 'display: inline');
			this.buttonFour.attr('label', this.labels.choiceFour);
		}
		this.displayMessage.innerHTML = this.message;
		this.displayPageNumber.innerHTML = '(page: ' + this.page + ')';
		this.draw();
	},
	draw: function() {
        var canvas = dojo.byId("canvas");
        var ctx = canvas.getContext("2d");
		//erase all red dots
		ctx.fillStyle = "rgb(255,255,255)";
		ctx.fillRect(9, 88, 5, 5);
		ctx.fillRect(29, 88, 5, 5);
		ctx.fillRect(9, 68, 5, 5);
		ctx.fillRect(29, 68, 5, 5);
		ctx.fillRect(49, 68, 5, 5);
		ctx.fillRect(49, 48, 5, 5);
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
			ctx.fillRect(20, 100, 22, 2);
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
			ctx.fillRect(40, 40, 20, 2);
			ctx.fillRect(60, 40, 2, 20);
			//draw red dot
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillRect(49, 48, 5, 5);
		}
		else if (this.page == 6 || this.page == 8) {
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
		else if (this.page == 9 || this.page == 10 || this.page == 11) {
			ctx.fillRect(60, 80, 20, 2);
			ctx.fillRect(60, 100, 20, 2);
			//draw red dot
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillRect(69, 88, 5, 5);
		}
		else if (this.page == 12) {
			ctx.fillRect(80, 80, 20, 2);
			ctx.fillRect(80, 100, 20, 2);
			ctx.fillRect(100, 80, 2, 22);
			//draw red dot
			ctx.fillStyle = "rgb(255,0,0)";
			ctx.fillRect(89, 88, 5, 5);
		}
	},
	clearCanvas: function() {
        var canvas = dojo.byId("canvas");
        var ctx = canvas.getContext("2d");
		ctx.fillStyle = "rgb(255,255,255)";
		ctx.fillRect(0,0,150,150);
	},
	
});