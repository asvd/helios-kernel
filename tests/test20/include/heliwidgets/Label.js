/*********************************************************************

  Label.js

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

     Defines heliwidgets.Label Widget used  for creating a simple text
     element.


 __Objects declared:__________________________________________________

 heliwidgets.Label                                 - Label constructor
 --heliwidgets.Label public properties: ------------------------------
  label              - string js.Property containing text of the label


*********************************************************************/

include( "heliwidgets.js" );
include( "Widget.js" );
include( "../js/Property.js" );

init = function() {

    // keeps heliwidgets routines
    // a shorter name for better reading of this file
    var hw = heliwidgets;


    // Label constructor.
    //
    // Argument:
    // - initStruc is a structure to initialize widget with
    hw.Label = function( initStruc ) {
	// overridding widget's  name, used in  _create() and _destroy()
	// to find out corresponding engine routines
	this._widgetType = "Label";

        // particular widget type  properties should be created before
        // parent constructor is called

	this.label = new js.Property( " " );

	// no such for label

	//parent constructor
        hw.Widget.call( this, initStruc );
	
    }
    hw.Label.prototype = new hw.Widget();
    
}
