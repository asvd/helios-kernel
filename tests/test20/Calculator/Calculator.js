/*********************************************************************

  This  file  is  part  of  Calculator  demo  application  for  Helios
  framework and Heliwidgets library.

     Copyright 2008, 2009 Dmitry Prokashev

     Helios is free software: you can redistribute it and/or modify it
     under the terms of the GNU General Public License as published by
     the Free Software Foundation, either version 3 of the License, or
     (at your option) any later version.

     Helios is  distributed in  the hope that  it will be  useful, but
     WITHOUT  ANY  WARRANTY;  without  even the  implied  warranty  of
     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
     General Public License for more details.

     You should have received a copy of the GNU General Public License
     along with Helios.  If not, see <http://www.gnu.org/licenses/>.

*********************************************************************/

/*

This  module  contains the  source  of  the  Calculator widgets.  More
strictly, here  is the calculator  logic defined, and its  widgets and
properties are defined in  CalculatorLayout.js which is kinda resource
file.

Calculator is a  successor of a Frame widget (which  is a successor of
Widget general object). Each Widget instance provides a usefull method
called initWithResource().  This method takes one argument  which is a
structure  containing  fields  which   may  define  some  of  widget's
properties, its  theme and probably a  set of child  widgets. If there
are    child   widgets    defined   in    the    argument   structure,
initWithResource() will create the desired child widgets and set their
desired properties.

Actually I  could create the  whole calculator layout  manually inside
its  constructor  (Calculator() function  defined  below),  same as  I
created the Calculator widget itself and placed it into the rootWidget
in main.js module.  But Calculator  has a big number of child widgets,
so  I  define  a  structure  called CalculatorLayour  and  defined  in
CalculatorLayout.js module,  and provide the structure  as an argument
of the  initWithResource() method.  Such approach will  prevent mixing
the logical and layout code, and besides manually widget creation is a
bit longer (measuring in lines of code).

*/

// Contains layout structure
include( "CalculatorLayout.js" );


init = function() {

    // Maximum number of digits on the screen
    var maxChars = 12;

    // covnerts digit to its value
    var digitValue = new Array();
    for ( var i = 0; i < 16; i++ ) {
        digitValue[ i.toString( 16 ).toUpperCase() ] = i;
    }

    // covnerts value to digit
    var valueDigit = new Array();
    for ( var i = 0; i < 16; i++ ) {
        valueDigit[ i ] = i.toString( 16 ).toUpperCase();
    }
    
    // Calculator constructor. All  widgets' constructors usually take
    // one  argument  which  is  forwarded to  the  initWithResource()
    // method, this allows creating and initializing a widget within a
    // single line. Here I follow this convention.
    Calculator = function( initStruct ) {
        // first create a frame and  place a set of widgets defined in
        // CalculatorLayout struc.
	heliwidgets.Frame.call( this, CalculatorLayout );
        // Now apply the settings provided by the caller
	this.initWithResource( initStruct );

        // Initialization structure keeps a set of child widgets which
        // are   already   created   for   the  calculator   at   this
        // point. Structure also keeps  an information about how child
        // widgets are named. For example,  name of the "AC" button is
        // "buttonClear", and thus after creation it is available as a
        // Calculator   "slot"  (prototype-programming   term)  called
        // buttonClear.   Below   I    refer   to   this   button   as
        // this.buttonClear.  Other widget  names  are obvious  enough
        // too.

	// keeps current base (2, 8, 10 or 16)
	this.base = 10;

        // this  will initialize  all variables,  this method  is also
        // called whenever user clicks the "AC" button
	this.initialize();

        // connecting  widget  actions  to  event  signals.  js.Signal
        // object is defined in  include/js/Signal.js module and it is
        // a pretty simple implementation  of observer pattern. If you
        // are not familiar with it, refer to wiki or somwhere. Helios
        // framework  tutorial and  api guides  both  contain detailed
        // description on how this object works.
	this.buttonClear.sigPushed.listen( this.initialize, this );
        // digital buttons
        for ( var i = 0; i < 16; i++ ) {
            // this[ "button" + valueDigit[ i ] ]  equals this.buttonA
            // for i  == 10, this.buttonB for i==11,  etc; all buttons
            // has been created by initWithResource method

            this[ "button" + valueDigit[ i ] ].sigPushed.listen(
                this.handleDigit, // subscripted method
                this, // subscripted object
                valueDigit[ i ] // argument provided to the subscripted method
            );

        }
        // handleDigit  defines itself  that  the "-"  sign should  be
        // added before the  label, or removed if there  is such value
        // already
	this.buttonPM.sigPushed.listen( this.handleDigit, this, "-" );
	this.buttonPeriod.sigPushed.listen(
	    function() {
		this.handleDigit( "." );
		// disabling the button so user can enter the dot only once
		this.buttonPeriod.availability.set( "disabled" );
	    }, this );
        this.buttonDivide.sigPushed.listen( this.handleOperation, this, "/" );
        this.buttonMultiply.sigPushed.listen( this.handleOperation, this, "*" );
        this.buttonSubstract.sigPushed.listen( this.handleOperation, this, "-" );
        this.buttonAdd.sigPushed.listen( this.handleOperation, this, "+" );
        this.buttonShowResult.sigPushed.listen( this.calculate, this );
	this.baseSelector.sigSelected.listen( this.updateBase, this );
    }
    Calculator.prototype = new heliwidgets.Frame();

    
    // Creates  (sets) all  variables  to their  initial values.  This
    // method is also called whenever user clicks the "AC" button.
    Calculator.prototype.initialize = function() {
	// creating zero on the screen
	this.screenLabel.label.set( "0" );
	// keeps currently shown value
	this.value = 0;
        // keeps previous value for the binary operations
        this.prevValue = 0;
        // pending operation
        this.currentOperation = "=";
        // prevents clearing  the screen after  user push a  digit, it
        // becames true when user  clicked on operation button, so his
        // new input  should start a new  value, but the  old value is
        // still shown on the screen
        this.startNewInput = false;
        // button was probably disabled  if user has pushed it before,
        // enabling it back
	this.buttonPeriod.availability.set( "enabled" );
    }

    // Code below  contains a calculator logic definition.  If you are
    // interested only in helios and heliwidgets, you may skip reading
    // this and follow to the CalculatorLayout.js.
    
    // Adds a char to the display
    Calculator.prototype.handleDigit = function( val ) {
        var oldLabel = "0";
        if ( this.startNewInput ) {
            // ignore the previous value
            this.startNewInput = false;
        } else {
            // taking the value from the screen
	    oldLabel = this.screenLabel.label.get();
        }
	if ( val == "-" ) {
	    if ( oldLabel[ 0 ] == "-" ) {
		// removing minus
		this.screenLabel.label.set( oldLabel.substr( 1, oldLabel.length-1 ) );
	    } else if ( oldLabel.length < maxChars ) {
		// adding minus to the left
		this.screenLabel.label.set( val + oldLabel );
	    }
	} else if ( oldLabel.length < maxChars ) {
	    if ( ( oldLabel == "0" || oldLabel == "-0" ) &&
		 val != "." ) {
		this.screenLabel.label.set( oldLabel.substr( 0, oldLabel.length-1 ) + val );
	    } else {
		this.screenLabel.label.set( oldLabel + val );
	    }
	}
    }

    // updates base according to selector change
    Calculator.prototype.updateBase = function() {
	var base = this.baseSelector.getValue();

	// copying value to the memory
	this.screen2Mem();

	// actually updating base
	this.base = base;

	// copying value back to the screen
	this.mem2Screen();

        // enabling/disabling the desired buttons
        for ( i = 2; i < 16; i++ ) {
            this[ "button" + valueDigit[ i ] ].availability.set(
                this.base > i ? "enabled" : "disabled"
            );
        }
    }

    
    // copies value from the screen to the memory
    Calculator.prototype.screen2Mem = function() {
	var label = this.screenLabel.label.get();
	// first we will store the sign
	var negative = (label[ 0 ] == "-");
	// removing "-" sign if needed
	if ( negative ) {
	    label = label.substr( 1, label.length - 1 );
	}
	// second lets split the value into integer and fractional parts
	var pointIdx = label.indexOf( "." );
	var integer;
	var fractional;
	if ( pointIdx != -1 ) {
	    integer = label.substr( 0, pointIdx );
	    fractional = label.substr( pointIdx + 1, label.length - pointIdx - 1 );
	} else {
	    integer = label;
	    fractional = "";
	}

	// now lets create a value
	var value = 0;
	// adding integer part
	var i;
	var deg = 1;
	for ( i = integer.length-1; i >=0; i--, deg *= this.base ) {
	    value += digitValue[ integer[ i ] ]*deg;
	}
	// adding fractional part
	if ( pointIdx != -1 ) {
	    deg = 1 / this.base;
	    for ( i = 0; i < fractional.length; i++, deg /= this.base ) {
		value += digitValue[ fractional[ i ] ]*deg;
	    }
	}

	// fixing value sign if needed
	if ( negative ) {
	    value = -value;
	}

	// assigning value
	this.value = value;
    }


    // copies value from the memory back to the screen (generating the
    // label string value according to the current base)
    Calculator.prototype.mem2Screen = function() {
	var value = this.value;
	var negative = (this.value < 0);
	if ( negative ) {
	    value = -value;
	}
	var integer = Math.floor( value );
	var fractional = value - integer;
        
	// now converting value to the base system

        // first calculate the number of digits for the current base
        var digitnum = 1;
        var num = 1;
        
        while ( num <= integer ) {
            num *= this.base;
            digitnum++;
        }

        // now  digitnum  keeps  the  number of  value  representation
        // digits  for the  current base,  and num  keeps  the maximal
        // degree of base which does not exceed the value

        // let us create a string with integer part of the value
        var label = ""; // it will be assigned to the screen label later

        var intPart = 0;
        var newChar;
        while ( num > 1 ) {
            num /= this.base;
            intPart = Math.floor( integer / num );
            newChar = valueDigit[ intPart ];
            label += newChar;
            integer %= num;
        }

        // filling zero if empty
        if ( label.length == 0 ) {
            label = "0";
        }

        // concatenating the minus sign if needed
        if ( negative ) {
            label = "-" + label;
        }
        
        // now lets check if our new representation exceeds the maxChars
        if ( label.length > maxChars ) {
            // cropping the value simply removing the leading digits
            var chars2Remove = label.length - maxChars;

            if ( negative ) {
                // remove the minus and all chars which are out of screen
                var label = label.substr( chars2Remove+1, label.length - (chars2Remove+1) )
                // remove leading zeroes
                while ( label[ 0 ] == "0" ) {
                    label = label.substr( 1, label.length - 1 );
                }
                // put back the leading "-" sign
                label = "-" + label;
            } else {
                // remove all chars which are out of screen
                label = label.substr( chars2Remove , label.length - chars2Remove );
                // remove leading zeroes
                while ( label[ 0 ] == "0" ) {
                    label = label.substr( 1, label.length - 1 );
                }
            }
        }

        // calculating how  many digits left for  the fractional part,
        // one extra char for the decimal point
        var fracDigits = maxChars - label.length - 1;

        // now lets create a fractional part
        if ( fractional != 0 &&
             // do we have enough digits for the fractional part?
             fracDigits > 0 ) {
            // adding decimal point
            label += ".";

            num = 1/this.base;
            var i = 0;
            var fracPart = 0;
            while ( fractional > 0 &&
                    i < fracDigits ) {
                i++;
                fracPart = Math.floor( fractional / num );
                newChar = valueDigit[ fracPart ];
                label += newChar;
                fractional = fractional - fracPart*num;
                num /= this.base;
            }

            // removing trailing zeroes
            while ( label[ label.length - 1 ] == "0" ) {
                label = label.substr( 0, label.length - 1 );
            }

            // probably after removing all  zeroes, we've got a dot at
            // the tail of the label,  removing it; we do not put this
            // in  the loop above,  because in  this case  some zeroes
            // from the integer part could be removed too
            if ( label[ label.length - 1 ] == "." ) {
                label = label.substr( 0, label.length - 1 );
            }
            
        }

        // enable back the dot button in  case when there is no dot in
        // the  label (this could  happen when  fraction part  has not
        // been fit into  the display and was cropped  during the base
        // conversion
        if ( label.indexOf( "." ) == -1 ) {
	    this.buttonPeriod.availability.set( "enabled" );
        }

        // assignin the label to the screen
        this.screenLabel.label.set( label );
    }


    // Creates a pending operation
    Calculator.prototype.handleOperation = function( op ) {
        if ( !this.startNewInput ) {
            // calculating previous result
            this.calculate();
        } // otherwise simply change the operation
        
        // backing up previous value
        this.prevValue = this.value;
        
        this.currentOperation = op;
    }

    
    Calculator.prototype.calculate = function() {
        var result = 0;
        // taking the value from the screen to the memory
        this.screen2Mem();
        switch( this.currentOperation ) {
        case "+": result = this.prevValue + this.value; break;
        case "-": result = this.prevValue - this.value; break;
        case "*": result = this.prevValue * this.value; break;
        case "/": result = (this.value != 0)?(this.prevValue / this.value):0; break;
        default : result = this.value; // there was no pending operation
        }

        // showing result to the screen
        this.value = result;
        this.prevValue = 0;
        if ( this.currentOperation != "=" ) {
            this.mem2Screen();
        }

        // clearing current operation
        this.currentOperation = "=";
        this.startNewInput = true;
        this.buttonPeriod.availability.set( "enabled" );
    }


    
}
