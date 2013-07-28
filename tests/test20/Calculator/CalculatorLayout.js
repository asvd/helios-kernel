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

This  module  defines  CalculatorLayout  structure which  is  used  to
initialize   a   Calculator    widget.   The   structure   is   rather
straighforward, I will comment on several fields of it.

*/


// Including widgets used in Calculator
include( "../include/heliwidgets/Button.js" );
include( "../include/heliwidgets/Label.js" );
include( "../include/heliwidgets/Widget.js" );
include( "../include/heliwidgets/Selector.js" );
include( "../include/heliwidgets/Glasscase.js" );

init = function() {

    CalculatorLayout = {
        geometry : { width : 180, height : 300 },
	children: [
            // Screen
	    {
		type : heliwidgets.Glasscase,
		geometry: { left: 7, top: 9, right: 7, height: 32 },
		children : [
		    {
			name : "screenLabel",
			type : heliwidgets.Label,
			theme : {
			    labelTextAlign: "right",
			    fontSize : "18px",
                            fontWeight : "bold"
			},
			label: "0",
			geometry: { left: 5, right: 5, middle: 0, height: "70%" }
		    },
		]
	    },

            // Widget with all buttons
	    {
		type : heliwidgets.Widget,
		geometry : { top : 68, bottom: 3, left: 2, right: 2 },
		children : [

		    // AC
		    {
			name : "buttonClear",
			type: heliwidgets.Button,
			geometry : { top: "4%", left: "3%", width: "20%", height: "13%"},
			label : "AC"
		    },

		    // / button
		    {
			name : "buttonDivide",
			type: heliwidgets.Button,
			geometry : { top: "20%", left: "3%", width: "20%", height: "13%"},
			label : "&#247;"
		    },

		    // * button
		    {
			name : "buttonMultiply",
			type: heliwidgets.Button,
			geometry : { top: "36%", left: "3%", width: "20%", height: "13%"},
			label : "&#215;"
		    },

		    // - button
		    {
			name : "buttonSubstract",
			type: heliwidgets.Button,
			geometry : { top: "52%", left: "3%", width: "20%", height: "13%"},
			label : "-"
		    },

		    // + button
		    {
			name : "buttonAdd",
			type: heliwidgets.Button,
			geometry : { top: "68%", left: "3%", width: "20%", height: "13%"},
			label : "+"
		    },

		    // =
		    {
			name : "buttonShowResult",
			type: heliwidgets.Button,
			geometry : { top: "84%", left: "3%", width: "20%", height: "13%"},
			label : "="
		    },

		    // F
		    {
			name : "buttonF",
			type: heliwidgets.Button,
			geometry :{ left: "77%", top: "4%", width: "20%", height: "13%"},
			availability : "disabled",
			label : "F"
		    },

		    // E
		    {
			name : "buttonE",
			type: heliwidgets.Button,
			geometry : { left: "54%", top: "4%", width: "20%", height: "13%"},
			availability : "disabled",
			label : "E"
		    },

		    // D
		    {
			name : "buttonD",
			type: heliwidgets.Button,
			geometry : { left: "31%", top: "4%", width: "20%", height: "13%"},
			availability : "disabled",
			label : "D"
		    },

		    // C
		    {
			name : "buttonC",
			type: heliwidgets.Button,
			geometry : { left: "77%", top: "20%", width: "20%", height: "13%"},
			availability : "disabled",
			label : "C"
		    },

		    // B
		    {
			name : "buttonB",
			type: heliwidgets.Button,
			geometry : { left: "54%", top: "20%", width: "20%", height: "13%"},
			availability : "disabled",
			label : "B"
		    },

		    // A
		    {
			name : "buttonA",
			type: heliwidgets.Button,
			geometry : { left: "31%", top: "20%", width: "20%", height: "13%"},
			availability : "disabled",
			label : "A"
		    },

		    // 9
		    {
			name : "button9",
			type: heliwidgets.Button,
			geometry : { left: "77%", top: "36%", width: "20%", height: "13%"},
			label : "9"
		    },

		    // 8
		    {
			name : "button8",
			type: heliwidgets.Button,
			geometry : { left: "54%", top: "36%", width: "20%", height: "13%"},
			label : "8"
		    },

		    // 7
		    {
			name : "button7",
			type: heliwidgets.Button,
			geometry : { left: "31%", top: "36%", width: "20%", height: "13%"},
			label : "7"
		    },

		    // 6
		    {
			name : "button6",
			type: heliwidgets.Button,
			geometry : { left: "77%", top: "52%", width: "20%", height: "13%"},
			label : "6"
		    },

		    // 5
		    {
			name : "button5",
			type: heliwidgets.Button,
			geometry : { left: "54%", top: "52%", width: "20%", height: "13%"},
			label : "5"
		    },

		    // 4
		    {
			name : "button4",
			type: heliwidgets.Button,
			geometry : { left: "31%", top: "52%", width: "20%", height: "13%"},
			label : "4"
		    },

		    // 3
		    {
			name : "button3",
			type: heliwidgets.Button,
			geometry : { left: "77%", top: "68%", width: "20%", height: "13%"},
			label : "3"
		    },

		    // 2
		    {
			name : "button2",
			type: heliwidgets.Button,
			geometry : { left: "54%", top: "68%", width: "20%", height: "13%"},
			label : "2"
		    },

		    // 1
		    {
			name : "button1",
			type: heliwidgets.Button,
			geometry : { left: "31%", top: "68%", width: "20%", height: "13%"},
			label : "1"
		    },

		    // .
		    {
			name : "buttonPeriod",
			type: heliwidgets.Button,
			geometry : { left: "77%", top: "84%", width: "20%", height: "13%"},
			label : "."
		    },

		    // 0
		    {
			name : "button0",
			type: heliwidgets.Button,
			geometry : { left: "54%", top: "84%", width: "20%", height: "13%"},
			label : "0"
		    },

		    // +/- button
		    {
			name : "buttonPM",
			type: heliwidgets.Button,
			geometry : { left: "31%", top: "84%", width: "20%", height: "13%"},
			label : "&#177;"
		    }

		    
		]
	    },

	    // BIN/OCT/DEC/HEX selector
            
            // For some strange  reason, when declaring Selector above
            // the buttons, its bullet is not rendered in Opera.
	    {
		name : "baseSelector",
		type : heliwidgets.Selector,
		geometry : { left: 7, top : 46, right: 7, height: 22 },
		selectedIndex : 2,
		items : [
		    { label : "BIN", value : 2 },
		    { label : "OCT", value : 8 },
		    { label : "DEC", value : 10 },
		    { label : "HEX", value : 16 }
		]
	    }

	]
    }
    
}