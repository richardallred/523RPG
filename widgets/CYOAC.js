/**
* Choose your own adventure creator
 */
dojo.provide('myapp.CYOAC');
dojo.require('dijit._Widget');
dojo.require('dijit._Templated');
dojo.require('dijit.form.TextBox');
dojo.require('dijit.form.SimpleTextarea');
dojo.require('dijit.form.Select');
dojo.require('dijit.form.ComboBox');
dojo.require('dojo.i18n');
dojo.require('dojo.number');
dojo.require('dojo.hash');
dojo.require('dojo.data.ItemFileWriteStore');
dojo.require('uow.audio.JSonic');
dojo.requireLocalization('myapp', 'CYOAC');

dojo.declare('myapp.CYOAC', [dijit._Widget, dijit._Templated], {
    widgetsInTemplate: true,
	templatePath: dojo.moduleUrl('myapp.templates', 'CYOAC.html'),

	postCreate: function() {
		//this.displayMessage.innerHTML = this.message;
		this.connect(window,'onkeyup','_onKeyPress');
		this.generatePage();
	},
    postMixInProperties: function() {
		//Initialize page text and choices
		this.savedPages = [];
		this.savedPageText = [];
		this.savedChoices = [];
		this.numChoices = 1;
		this.choiceLabels = [];
		this.choiceLinks = [];
		//this.currentPage = "Starting Page";
		this.currentPage = "";
		this.message = "You are currently editing the first page of your game <br>";
    },
	
	_onClick: function() {
		
	},
	_addAnotherChoice: function(event) {
		var tempChoiceLabels = [];
		var tempChoiceLinks = [];
		for (i = 0; i < this.numChoices; i++) {
			tempChoiceLabels.push(this.choiceLabels[i].value);
			tempChoiceLinks.push(this.choiceLinks[i].value);
		}
		this.numChoices ++;
		this.generateChoices();
		for (i = 0; i < this.numChoices-1; i++) {
			this.choiceLabels[i].attr('value',tempChoiceLabels[i]);
			this.choiceLinks[i].attr('value',tempChoiceLinks[i]);
		}
		this.choiceLabels[this.numChoices-1].attr('value', '');
		this.choiceLinks[this.numChoices-1].attr('value', '');
	},
	_deleteChoice: function(event) {
		var tempChoiceLabels = [];
		var tempChoiceLinks = [];
		for (i = 0; i < this.numChoices; i++) {
			tempChoiceLabels.push(this.choiceLabels[i].value);
			tempChoiceLinks.push(this.choiceLinks[i].value);
		}
		if (this.numChoices > 0) {
			this.numChoices --;
			this.generateChoices();
		}
		for (i = 0; i < this.numChoices; i++) {
			this.choiceLabels[i].attr('value',tempChoiceLabels[i]);
			this.choiceLinks[i].attr('value',tempChoiceLinks[i]);
		}
	},
	_saveAndGo: function(event) {
		var goToValue = this.goToPageText.value;
		if (this._saveAll()) {
			//if saved successfully, then go
			if (goToValue !== '') {
				this._goToPage(goToValue);
			} else {
				this._goToPage();
			}
		}
	},
	_saveAndGoFromChoice: function(choiceNum) {
		if (this._saveAll()) {
			//if saved successfully, then go
			this._goToPageFromChoice(choiceNum);
		}
	},
	_goToPageFromChoice: function(choiceNum) {
		//if (this.choiceLinkText.value === '') {
		if (this.choiceLinks[choiceNum].value === '') {
			this.message += "No page specified to go to. <br>";
			this.displayMessage.innerHTML = '<br><br>' + this.message + '<br>';
			this.message = '';
		} else {
			found = -1;
			for (i = 0; i < this.savedPageText.length; i++) {
				if (this.savedPages[i] === this.choiceLinks[choiceNum].value) {
					this.message += "Successfully loaded page: " + this.choiceLinks[choiceNum].value+ " <br>";
					if (i === 0) {
						this.message += "You are currently editing the first page of your game <br>";
					}
					found = i;
					i = this.savedPageText.length;
				}
			}
			this.pageNameText.attr('value', this.choiceLinks[choiceNum].value);
			//this.pageNameText.value = this.choiceLinks[choiceNum].value;
			this.currentPage = this.pageNameText.value;
			if (found === -1) {
				this.message += "Now editing page: " + this.choiceLinks[choiceNum].value + " <br>";
				this.pageTextArea.attr('value', '');
				//this.pageTextArea.value = '';
				this.numChoices = 1;
				this.generateChoices();
				for (i = 0; i < this.choiceLabels.length; i++) {
					this.choiceLabels[i].attr('value', '');
					this.choiceLinks[i].attr('value', '');
				}
				//this.choiceText.value = '';
				//this.choiceLinkText.value = '';
			} else {
				this.pageTextArea.attr('value', this.savedPageText[found]);
				//this.pageTextArea.value = this.savedPageText[found];
				this.numChoices = this.savedChoices[found].split('^*').length/2;
				this.generateChoices();
				for (i = 0; i < this.choiceLabels.length; i++) {
					this.choiceLabels[i].attr('value', this.savedChoices[found].split('^*')[i*2]);
					this.choiceLinks[i].attr('value', this.savedChoices[found].split('^*')[i*2+1]);
				}
				//this.choiceText.value = this.savedChoices[found].split('^*')[0];
				//this.choiceLinkText.value = this.savedChoices[found].split('^*')[1];
			}
			this.goToPageText.attr('value', '');
			
			this.displayMessage.innerHTML = '<br><br>' + this.message + '<br>';
			this.message = '';
		}
	},
	_goToPage: function(comboBoxValue) {
		if (comboBoxValue === undefined && this.goToPageText.value === '') {
			this.message += "No page specified to go to. <br>";
			this.displayMessage.innerHTML = '<br><br>' + this.message + '<br>';
			this.message = '';
		} else {
			if (comboBoxValue === undefined) {
				comboBoxValue = this.goToPageText.value;
			}
			found = -1;
			for (i = 0; i < this.savedPages.length; i++) {
				if (this.savedPages[i] === comboBoxValue) {
					this.message += "Successfully loaded page: " + comboBoxValue + " <br>";
					if (i === 0) {
						this.message += "You are currently editing the first page of your game <br>";
					}
					found = i;
					i = this.savedPages.length;
				}
			}
			this.pageNameText.attr('value', comboBoxValue);
			//this.pageNameText.value = this.goToPageText.value;
			this.currentPage = comboBoxValue;
			if (found === -1) {
				this.message += "Now editing page: " + comboBoxValue + " <br>";
				this.pageTextArea.attr('value', '');
				//this.pageTextArea.value = '';
				this.numChoices = 1;
				this.generateChoices();
				for (i = 0; i < this.choiceLabels.length; i++) {
					this.choiceLabels[i].attr('value', '');
					this.choiceLinks[i].attr('value', '');
				}
				//this.choiceText.value = '';
				//this.choiceLinkText.value = '';
			} else {
				this.pageTextArea.attr('value', this.savedPageText[found]);
				//this.pageTextArea.value = this.savedPageText[found];
				this.numChoices = this.savedChoices[found].split('^*').length/2;
				if (this.numChoices === 0.5) {
					this.numChoices = 0;
				}
				this.generateChoices();
				for (i = 0; i < this.choiceLabels.length; i++) {
					this.choiceLabels[i].attr('value', this.savedChoices[found].split('^*')[i*2]);
					this.choiceLinks[i].attr('value', this.savedChoices[found].split('^*')[i*2+1]);
				}
				//this.choiceText.value = this.savedChoices[found].split('^*')[0];
				//this.choiceLinkText.value = this.savedChoices[found].split('^*')[1];
			}
			this.goToPageText.attr('value', '');
			this.displayMessage.innerHTML = '<br><br>' + this.message + '<br>';
			this.message = '';
		}
	},
	_saveAll: function() {
		var def = uow.data.getDatabase({
		  database: 'testdb', 
		  collection : 'cyoa', 
		  mode : 'c'
		});
		def.then(function(db) {
		  db.newItem({value : 'test'});
		  db.save();
		});
		var fetchtest = uow.data.getDatabase({
			database: 'testdb', 
			collection : 'cyoa', 
			mode : 'r'
		});
		def.then(function(db) {
			db.fetch({
				count: 1,
				onBegin: function() {
				  console.log('begin');
				},
				onItem: function(item) {
				  console.log(item);
				},
				onComplete: function(items) {
					console.log('done');
				},
				onError: function(e) {
				  console.log('db error');
				}
			});
		});
		found = -1;
		this.message = '';
		if (this.pageNameText.value === '' || this.pageNameText.value === 'Insert Page Name') {
			this.message = "Save Failed: You must specify a page name. <br>";
			this.displayMessage.innerHTML = '<br><br>' + this.message + '<br>';
			this.message = '';
			return false;
		} else {
			for (i = 0; i < this.savedPages.length; i++) {
				if (this.savedPages[i] === this.currentPage || this.savedPages[i] === this.pageNameText.value) {
					//page with this name has already been saved so update it
					if (this.currentPage !== this.pageNameText.value && this.savedPages[i] === this.pageNameText.value) {
						this.message = "Save Failed: The Page Name you specified already exists as a different page.  Change the Page Name to avoid overwriting that page. <br>";
						found = -2;
						this.displayMessage.innerHTML = '<br><br>' + this.message + '<br>';
						this.message = '';
						return false;
					} else {
						if (i === 0) {
							this.message = "You are currently editing the first page of your game <br>";
						}
						found = i;
					}
					//break loop
					//i = this.savedPages.length;
				}
			}
			if (found === -1) {
				//make a new page since no existing page of this name has been found
				this.savedPages.push(this.pageNameText.value);
				this.savedPageText.push(this.pageTextArea.value);
				var addChoiceString = '';
				for (i = 0; i < this.choiceLabels.length; i++) {
					if (i == 0) {
						addChoiceString = this.choiceLabels[i].value + '^*' + this.choiceLinks[i].value;
					} else {
						addChoiceString += '^*' + this.choiceLabels[i].value + '^*' + this.choiceLinks[i].value;
					}
				}
				this.savedChoices.push(addChoiceString);
				//this.savedChoices[this.savedChoices.length] = this.choiceText.value + '^*' + this.choiceLinkText.value;
				this.currentPage = this.pageNameText.value;
				this.message += "Successfully saved data for page: " + this.currentPage + "<br>";
			} else {
				this.savedPages[found] = this.pageNameText.value;
				this.savedPageText[found] = this.pageTextArea.value;
				var addChoiceString = '';
				for (i = 0; i < this.choiceLabels.length; i++) {
					if (i == 0) {
						addChoiceString = this.choiceLabels[i].value + '^*' + this.choiceLinks[i].value;
					} else {
						addChoiceString += '^*' + this.choiceLabels[i].value + '^*' + this.choiceLinks[i].value;
					}
				}
				this.savedChoices[found] = addChoiceString;
				//this.savedChoices[found] = this.choiceText.value + '^*' + this.choiceLinkText.value;
				if (this.currentPage !== this.pageNameText.value) {
					this.message += "Successfully renamed page to: " + this.pageNameText.value + "<br>";
				}
				this.currentPage = this.pageNameText.value;
				this.message += "Successfully updated page: " + this.currentPage + "<br>";
			}
			this.displayMessage.innerHTML = '<br><br>' + this.message + '<br>';
			//update combo box to contain the newly saved page
			this.generateComboBox();
			return true;
		}
	},
	_onKeyPress: function(event) {
		/*var textarea = new dijit.form.SimpleTextarea({
                name: "myarea",
                rows: "4",
                cols: "50",
                style: "width:auto;"
            }, "myarea");
            textarea.attr('value', 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.');
			dojo.place(textarea.domNode, this.generateDiv);*/
	},
	generatePage: function(event) {
		//clear all elements
		dojo.empty(this.generateDiv);
		var lineOne = dojo.doc.createElement('span');
        lineOne.innerHTML = "Edit another page:&nbsp";
        dojo.place(lineOne, this.generateDiv);
		//comboDiv is set to 'span' so it is on the same line
		this.comboDiv = dojo.doc.createElement('span');
		dojo.place(this.comboDiv, this.generateDiv);
		this.generateComboBox();
		var saveGoButton = new dijit.form.Button({ label: 'Save and Go' });
		this.connect(saveGoButton, 'onClick', dojo.hitch(this,"_saveAndGo"));
		dojo.place(saveGoButton.domNode, this.generateDiv);
		var goButton = new dijit.form.Button({ label: 'Go without saving' });
		this.connect(goButton, 'onClick', dojo.hitch(this,"_goToPage",undefined));
		dojo.place(goButton.domNode, this.generateDiv);
		var listButton = new dijit.form.Button({ label: 'List pages' });
		this.connect(listButton, 'onClick', dojo.hitch(this,"_listPages"));
		dojo.place(listButton.domNode, this.generateDiv);
		
		this.displayMessage = dojo.doc.createElement('span');
		this.displayMessage.innerHTML = '<br><br>' + this.message + '<br>';
		dojo.place(this.displayMessage, this.generateDiv);
		
		var lineTwo = dojo.doc.createElement('span');
		lineTwo.innerHTML = 'Page Name:&nbsp';
		//lineTwo.innerHTML = 'Page Name:&nbsp<input type="text" value="Insert page name" dojoAttachPoint="pageNameText"><br>';
		dojo.place(lineTwo, this.generateDiv);
		this.pageNameText = new dijit.form.TextBox({ value: 'Insert Page Name' });
		dojo.place(this.pageNameText.domNode, this.generateDiv);
		
		var lineThree = dojo.doc.createElement('span');
		lineThree.innerHTML = '<br>Page Text:';	
		lineThree.innerHTML += '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp';
		//lineThree.innerHTML = 'Page Text:&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp<select name="pageOptions"><option value="none">Special Page Commands</option><option value="displayif">Redirect to another page...</option><option value="displayifvar">Add or remove an inventory item...</option><option value="displayifvisited">Gain/lose life or gold...</option><option value="displayifvisited">Set or display a variable...</option><option value="displayifvisited">Gain or lose life or gold...</option><option value="displayifvisited">Add combat or another minigame...</option></select><br>';
		dojo.place(lineThree, this.generateDiv);
		this.pageOptions = new dijit.form.Select({ 
			options: [{
                label: 'Advanced Page Commands',
                value: 'none'
            },
            {
                label: 'Redirect to another page...',
                value: 'split'
            },
            {
                label: 'Add or remove an inventory item...',
                value: 'inv'
            },
            {
                label: 'Gain/lose health or gold...',
                value: 'gain'
            },
			{
                label: 'Set or display a variable...',
                value: 'var'
            },
            {
                label: 'Add combat or another minigame...',
                value: 'mini'
            }] });
		dojo.place(this.pageOptions.domNode, this.generateDiv);
		//To do: replace this with an image of a question mark
		var tempSpan = dojo.doc.createElement('span');
		tempSpan.innerHTML = '&nbsp&nbsp(?)';
		dojo.place(tempSpan, this.generateDiv);
		
		var lineFour = dojo.doc.createElement('span');
		lineFour.innerHTML = '<br>';
		//lineFour.innerHTML = '<textarea rows="15" cols="80" dojoAttachPoint="pageTextArea">Insert page text here</textarea><br>';
		dojo.place(lineFour, this.generateDiv);
		this.pageTextArea = new dijit.form.SimpleTextarea({ 
				value: "Insert page text here",
				rows: "15",
                cols: "80",
                style: "width:auto;"});
		dojo.place(this.pageTextArea.domNode, this.generateDiv);
		
		this.choicesDiv = dojo.doc.createElement('div');
		dojo.place(this.choicesDiv, this.generateDiv);
		this.generateChoices();
		
		var lineFive = dojo.doc.createElement('span');
		lineFive.innerHTML = '<br>';
		dojo.place(lineFive, this.generateDiv);
		var addChoiceButton = new dijit.form.Button({ label: 'Add another choice' });
		this.connect(addChoiceButton, 'onClick', dojo.hitch(this,"_addAnotherChoice"));		
		dojo.place(addChoiceButton.domNode, this.generateDiv);
		var removeChoiceButton = new dijit.form.Button({ label: 'Delete last choice' });
		this.connect(removeChoiceButton, 'onClick', dojo.hitch(this,"_deleteChoice"));		
		dojo.place(removeChoiceButton.domNode, this.generateDiv);
		
		var lineSix = dojo.doc.createElement('span');
		lineSix.innerHTML = '<br>';
		dojo.place(lineSix, this.generateDiv);
		var addImageButton = new dijit.form.Button({ label: 'Add image' });
		dojo.place(addImageButton.domNode, this.generateDiv);
		
		//dojo.empty(this.generateDiv);
	},
	generateComboBox: function(event) {
		dojo.empty(this.comboDiv);
		var options = new dojo.data.ItemFileWriteStore({data: {identifier: 'name', items:[]}});
		var ln = this.savedPages.length;
		for (var i=0; i < ln; i++) {
			options.newItem({name: this.savedPages[i]});
		}

        this.goToPageText = new dijit.form.ComboBox({
			store: options,
			searchAttr: "name"
        });
		dojo.place(this.goToPageText.domNode, this.comboDiv);
	},
	generateChoices: function(event) {
		this.choiceLabels = [];
		this.choiceLinks = [];
		dojo.empty(this.choicesDiv);
		for (i = 1; i <= this.numChoices; i++) {
			var choiceSpan1 = dojo.doc.createElement('span');
			choiceSpan1.innerHTML = '<br>Choice ' + i + ' Label: &nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp Choice ' + i + ' Link:';
			choiceSpan1.innerHTML += '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp';
			//choiceSpan1.innerHTML += '<select name="choiceOptions"><option value="none">Special Choice Commands</option><option value="displayif">Display if an item is in inventory...</option><option value="displayifvar">Display if a variable is a given value...</option><option value="displayifvisited">Display if a page has been visited...</option></select>';
			dojo.place(choiceSpan1, this.choicesDiv);
			var choiceOptions = new dijit.form.Select({ 
			options: [{
                label: 'Advanced Choice ' + i + ' Commands',
                value: 'none'
            },
            {
                label: 'Display choice if an item is in inventory...',
                value: 'displayif'
            },
            {
                label: 'Display choice if a variable is a given value...',
                value: 'displayifvar'
            },
            {
                label: 'Display choice if a page has been visited...',
                value: 'displayifvisited'
            }] });
			dojo.place(choiceOptions.domNode, this.choicesDiv);
			var choiceSpan2 = dojo.doc.createElement('span');
			choiceSpan2.innerHTML = '<br>';
			//choiceSpan2.innerHTML = '<br><input type="text" dojoAttachPoint="choiceText" value="Insert choice 1 label">&nbsp <input type="text" dojoAttachPoint="choiceLinkText" value="Link choice 1 to this page">&nbsp';
			dojo.place(choiceSpan2, this.choicesDiv);

			var choiceText = new dijit.form.TextBox({ value: 'Insert choice 1 label' });
			dojo.place(choiceText.domNode, this.choicesDiv);
			this.choiceLabels.push(choiceText);

			var choiceLinkText = new dijit.form.TextBox({ value: 'Link choice 1 to this page' });
			dojo.place(choiceLinkText.domNode, this.choicesDiv);
			this.choiceLinks.push(choiceLinkText);

			var b = new dijit.form.Button({ label: 'Save and go to this page' });
			this.connect(b, 'onClick', dojo.hitch(this,"_saveAndGoFromChoice",i-1));
			dojo.place(b.domNode, this.choicesDiv);
			var b2 = new dijit.form.Button({ label: 'Go to this page without saving' });
			this.connect(b2, 'onClick', dojo.hitch(this,"_goToPageFromChoice",i-1));
			dojo.place(b2.domNode, this.choicesDiv);
		}
	},
	_listPages: function(event) {
		this.message = "";
		if (this.savedPageText.length === 0) {
			this.message = "You have no saved pages <br>";
			this.displayMessage.innerHTML = '<br><br>' + this.message + '<br>';
		}
		var addBR = 0;
		for (i = 0; i < this.savedPageText.length; i++) {
			this.message += this.savedPages[i];
			if (i < this.savedPageText.length - 1) {
				this.message += ',';
				if (this.message.length % 120 > addBR) {
					addBR = this.message.length % 120;
				} else {
					addBR = this.message.length % 120;
					this.message += '<br>';
				}
			}
		}
		this.displayMessage.innerHTML = '<br><br>' + this.message + '<br><br>';
		this.message = "";
	}
});