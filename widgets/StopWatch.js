/**
 * UOW sample stop watch widget.
 *
 * Copyright UNC Open Web Team 2010. All Rights Reserved.
 */
dojo.provide('myapp.StopWatch');
dojo.require('dijit._Widget');
dojo.require('dijit._Templated');
dojo.require('dojo.i18n');
dojo.requireLocalization('myapp', 'StopWatch');

dojo.declare('myapp.StopWatch', [dijit._Widget, dijit._Templated], {
    // the template has other dojo widgets in it that need to be parsed
    widgetsInTemplate: true,
    // the template for this widget exists here
    templatePath: dojo.moduleUrl('myapp.templates', 'StopWatch.html'),
    
    // this method gets called before the template is in the DOM, but after
    // all options are available
    postMixInProperties: function() {
        this.labels = dojo.i18n.getLocalization('myapp', 'StopWatch');
        this._startTime = 0;
        this._timer = null;
    },
   
    _onClick: function(event) {
        var curr = this.buttonWidget.attr('label');
        if(curr == this.labels.start_label) {
            this.start();
        } else if(curr == this.labels.stop_label) {
            this.stop();
        } else {
            this.reset();
        }
    },
    
    _onUpdate: function() {
        var now = new Date();
        var dt = now.getTime() - this._startTime.getTime();
        this.timeNode.innerHTML = dt/1000;
    },
    
    reset: function() {
        this.timeNode.innerHTML = '';
        this.buttonWidget.attr('label', this.labels.start_label);
    },
    
    start: function() {
        this._startTime = new Date();
        this._timer = setInterval(dojo.hitch(this, '_onUpdate'), 100);
        this.buttonWidget.attr('label', this.labels.stop_label);
    },
    
    stop: function() {
        this._startTime = null;
        clearInterval(this._timer);
        this.buttonWidget.attr('label', this.labels.reset_label);
    }
});