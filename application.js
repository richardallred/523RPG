/**
 * Sample startup script for a UOW application.
 *
 * Import dojo modules or your own before you use them; remove these if you
 * replace the default layout.
 *
 * Copyright UNC Open Web Team 2010. All Rights Reserved.
 */
dojo.provide('myapp.Main');
dojo.require('dojo.parser');
dojo.require('dijit.layout.BorderContainer');
dojo.require('dijit.layout.ContentPane');
dojo.require('dijit.layout.AccordionContainer');
dojo.require('dijit.layout.TabContainer');
dojo.require('myapp.Dookenstein');
dojo.require('myapp.Maze');
dojo.require('myapp.CYOAC');

// adjust the namespace if you changed it in index.html; this widget serves
// as our main controller to do stuff across the whole app and kick off the
// app when the page loads
dojo.declare('myapp.Main', null, {
    constructor: function() {
        // this example code connects an event handler to the tabs and 
        // accordion to show the last selected in the footer area of the page; 
        // replace it with code that makes sense for your own app
        var tabs = dijit.byId('tabs');
        dojo.connect(tabs, '_transition', this, '_onSelectPane');
        var sb = dijit.byId('sidebar');
        dojo.connect(sb, '_transition', this, '_onSelectPane');
        
        // a little template for what we'll show in the footer
        this._msg = 'Selected {newPane}, deselected {oldPane}';
        // store the footer so we don't have to look it up all the time
        this._footer = dojo.byId('footer');
        
        // we create one StopWatch widget in markup in index.html
        // we'll create another here programmatically as a demonstration
        //var sw = new myapp.StopWatch();
        //var tab2 = dojo.byId('tab2');
        //dojo.place(sw.domNode, tab2, 'last');
    },
    
    _onSelectPane: function(newPane, oldPane) {
        var text = dojo.replace(this._msg, {
            newPane: newPane.title,
            oldPane: oldPane.title
        });
    }
});

dojo.ready(function() {
    // build our main widget when everything is ready; adjust the name here
    // if you change it above but otherwise leave this alone and do all 
    // work in the widget above
    var app = new myapp.Main();        
});