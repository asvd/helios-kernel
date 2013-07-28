/*
 * Contains platform-dependent part of  the kernel tests. We don't use
 * platform API here, so we have to work with browser directly.
 */

init = function() {
    tests = {};

    if ( typeof window != 'undefined' ) {
        var delay = 100;
        var body = document.getElementsByTagName("body").item(0);
        body.style.backgroundColor = "#333344";

        // CONSOLE
        var style = {
            backgroundColor : "#000000",
            color : "#cccccc",
            padding : "5px",
            width : "500px",
            height : "500px",
            fontFamily : "sans",
            fontSize : "10px",
            overflow : "auto",
            position : "absolute"
        }

        var consoleDiv = document.createElement("div");
        for ( i in style ) {
            consoleDiv.style[i] = style[i];
        }

        body.appendChild(consoleDiv);

        // KERNEL SATISTICS
        style = {
            backgroundColor : "#000000",
            color : "#cccccc",
            padding : "5px",
            left : "520px",
            width : "106px",
            height : "240px",
            fontFamily : "sans",
            fontSize : "10px",
            position : "absolute"
        }

        var stats = document.createElement("div");
        for ( i in style ) {
            stats.style[i] = style[i];
        }

        body.appendChild(stats);

        var oldStats = "";
        var updateStats = function() {
            var result = "";
            for ( var i in kernel.moduleStates ) {
                result += "" + i + ": " +kernel.getStatistics()[ kernel.moduleStates[ i ] ]+ "<br/>";
            }
            if ( oldStats != result )  {
                stats.innerHTML = oldStats = result;
            }
            setTimeout( updateStats, delay );
        }
        updateStats();


        // SINGLE MODULE PERSONAL STATISTICS
        style = {
            backgroundColor : "#000000",
            color : "#cccccc",
            padding : "5px",
            left : "520px",
            width : "106px",
            top : "260px",
            height : "248px",
            fontFamily : "sans",
            fontSize : "10px",
            position : "absolute"
        }

        var perstats = document.createElement("div");
        for ( i in style ) {
            perstats.style[i] = style[i];
        }

        body.appendChild(perstats);

        var oldPerStats = "";
        tests.updatePerStats = function() {
            var mod = kernel.getModule("/tests/kernel/test20/main.js");
            var result = "";
            if ( mod !== null ) {
                var modStats = mod.getStatistics();
                for ( var i in kernel.moduleStates ) {
                    result += "" + i + ": " +modStats[ kernel.moduleStates[ i ] ]+ "<br/>";
                }
            }
            if ( oldPerStats != result )  {
                perstats.innerHTML = oldPerStats = result;
            }
            setTimeout( tests.updatePerStats, delay );
        }


        // MODS

        style = {
            backgroundColor : "#000000",
            color : "#cccccc",
            padding : "5px",
            left : "638px",
            width : "350px",
            height : "500px",
            fontFamily : "sans",
            fontSize : "10px",
            position : "absolute",
            overflow : "auto"
        }

        var mods = document.createElement("div");
        for ( i in style ) {
            mods.style[i] = style[i];
        }

        body.appendChild(mods);

        var oldMods = "";
        var updateMods = function() {
            var result = "";
            var modules = kernel.getModulesList();
            for ( var i=0; i < modules.length; i++) {
                result += "" + modules[i].path + ": " + modules[i].state+ "<br/>";
            }
            if ( oldMods != result ){
                mods.innerHTML = oldMods = result;
            }
            setTimeout( updateMods, delay );
        }
        updateMods();


        // external functions

        tests.print = function( text ) {
            consoleDiv.innerHTML += text;
        }

        tests.printRed = function( text ) {
            tests.print( "<font color=#cc7766>" + text + "</font>" );
        }
        tests.printGreen = function( text ) {
            tests.print( "<font color=#66cc77>" + text + "</font>" );
        }

        tests.printLine = function() {
            tests.print('<br/>');
        }

    } else {
        // NODEJS

        var red   = '\033[31m';
        var green = '\033[32m';
        var blue  = '\033[34m';
        var reset = '\033[0m';

        tests.print = function(val) {
            process.stdout.write(val);
        }
        
        tests.printRed = function(text) {
            tests.print( red+text+reset );
        }

        tests.printGreen = function(text) {
            tests.print( green+text+reset );
        }

        tests.printLine = function() {
            console.log();
        }
        
        tests.updatePerStats = function() {}
   }



}