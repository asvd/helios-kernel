/*********************************************************************

  Button.js

  This file is part of Heliwidgets library for Helios framework.

 __Copying:___________________________________________________________

     Copyright 2008, 2009 Dmitry Prokashev

     Heliwidgets  is free  software:  you can  redistribute it  and/or
     modify it  under the terms of  the GNU General  Public License as
     published by  the Free Software  Foundation, either version  3 of
     the License, or (at your option) any later version.

     Heliwidgets is  distributed in the  hope that it will  be useful,
     but WITHOUT  ANY WARRANTY; without  even the implied  warranty of
     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
     General Public License for more details.

     You should have received a copy of the GNU General Public License
     along    with   the   Heliwidgets    library.    If    not,   see
     <http://www.gnu.org/licenses/>.


 __Description:_______________________________________________________

     Defines heliwidgets.Button Widget which is a simple button.


 __Objects declared:__________________________________________________

 heliwidgets.Button                               - Button constructor
 --heliwidgets.Button public properties: -----------------------------
  pushed     - boolean js.Property defining whether a button is pushed
  keyboardHighlighted  - defines whether a button is keyboard-selected
  mouseHighlighted  - defines whether a button is hovered by the mouse
  label                       - string js.Property, keeps button label
  buttonType       - string js.Property, keeps name of the button type
  sigPushed                - js.Signal sent whenever button is clicked

*********************************************************************/

include( "heliwidgets.js" );
include( "Widget.js" );
include( "../js/Property.js" );
include( "../js/Signal.js" );

init = function() {

    // a shorter name for better reading of this file
    var hw = heliwidgets;


    // Button constructor.
    //
    // Argument:
    // - initStruc is a structure to initialize widget with
    hw.Button = function( initStruc ) {
	// overridding widget's  name, used in  _create() and _destroy()
	// to find out corresponding engine routines
	this._widgetType = "Button";

	// particular  widget  type properties  should  be created  before
	// parent constructor is called

	// button state properties
	this.pushed = new js.Property( false );
	this.keyboardHighlighted = new js.Property( false );
	this.mouseHighlighted = new js.Property( false );

	// defines a label appearing on the button
	this.label = new js.Property( " " );

	// "normal", "highlightVertical" or "highlightHorizontal"
	this.buttonType = new js.Property( "normal" );

	// sent whenever button is clicked and enabled
	this.sigPushed = new js.Signal();

	//parent constructor
        hw.Widget.call( this, initStruc );

    }
    hw.Button.prototype = new hw.Widget();
    
}
