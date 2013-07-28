// this file will not be included in the final distribution

init = function() {
    if ( typeof document == 'undefined' ) return;

    logManager = {
	// layer with a log window
	logWindow : null,
	createLogWindow : function() {
	    this.logWindow = document.createElement("div");
	    this.logWindow.style.position = "absolute";
	    this.logWindow.style.top = "20px";
	    this.logWindow.style.left = "20px";
	    this.logWindow.style.fontFamily = "monospace";
	    this.logWindow.style.fontSize = "10px";
	    this.logWindow.style.backgroundColor = "#112233";
	    this.logWindow.style.color = "#aabbcc";
	    this.logWindow.style.width = "600px";
	    this.logWindow.style.height = "300px";
	    this.logWindow.style.overflow = "auto";
	    this.logWindow.innerHTML = this.logText;
	    document.getElementsByTagName('body').item(0).appendChild(this.logWindow);
	},
	// shows a window containing a log
	showLog : function() {
	    if ( this.logWindow == null ) {
		this.createLogWindow();
	    } else {
		this.logWindow.style.visibility = "visible";
	    }
	    this.logShown = true;
	},

	//hides a log window
	hideLog : function () {
	    if ( this.logWindow != null ) {
		this.logWindow.style.visibility = "hidden";
	    }
	    this.logShown = false;
	},
	
	// adds a string to the log
	logg : function( str ) {
	    this.logText += str;
	    if ( this.logShown ) {
		this.logWindow.innerHTML = this.logText;
	    }
	},
	log : function( str ) {
	    this.logText += str + "<br>";
	    if ( this.logShown ) {
		this.logWindow.innerHTML = this.logText;
	    }
	},
	logRed : function( str ) {
	    this.logText += "<font color=#cc5533>" + str + "</font><br>";
	    if ( this.logShown ) {
		this.logWindow.innerHTML = this.logText;
	    }
	},
	logGreen : function( str ) {
	    this.logText += "<font color=#00cc00>" + str + "</font><br>";
	    if ( this.logShown ) {
		this.logWindow.innerHTML = this.logText;
	    }
	},
	// is the log shown?
	logShown : false,
	// contains a log
	logText : ""
    }
    
}