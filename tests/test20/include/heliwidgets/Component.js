/*********************************************************************

  Component.js

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

     Defines heliwidgets.Component  Widget used for  creating a widget
     which will contain some component, defined in Platform API.


 __Objects declared:__________________________________________________

 heliwidgets.Component                         - Component constructor
 --heliwidgets.Component public properties: --------------------------
  componentConstructor         - constructor function of the component
  component         - points to the component itself providing its API

*********************************************************************/

include( "heliwidgets.js" );
include( "Widget.js" );

init = function() {

    // keeps heliwidgets routines
    // a shorter name for better reading of this file
    var hw = heliwidgets;


    // Component constructor.
    //
    // Argument:
    // - initStruc is a structure to initialize widget with
    hw.Component = function( initStruc ) {
	// overridding widget's  name, used in  _create() and _destroy()
	// to find out corresponding engine routines
	this._widgetType = "Component";

	// particular  widget  type properties  should  be created  before
	// parent constructor is called

        // keeps constructor of  the component conforming the Platform
        // Component API
	this.componentConstructor = new js.Property( function(){} );

        // will point to the component object itself providing its API
        this.component = null;

	//parent constructor
        hw.Widget.call( this, initStruc );
	
    }
    hw.Component.prototype = new hw.Widget();
    
}
