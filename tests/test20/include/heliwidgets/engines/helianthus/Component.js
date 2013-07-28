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

     Defines  helianthus  engine  routines  for creating  a  Component
     widget.

 __Objects declared:__________________________________________________

 heliwidgets.engines.helianthus.Component    - Component widget engine
 --heliwidgets.engines.helianthus.Component public properties: -------
  component         - points to the component itself providing its API
 --heliwidgets.engines.helianthus.Component private properties: ------
  _hiderProperty  - anime.Property which hides and shows the component
 --heliwidgets.engines.helianthus.Component public methods: ----------
  create()         - creates a layer for the widget and handles events
  destroy()       - destroys widgeet layer
 --heliwidgets.engines.helianthus.Component private methods: ---------
  _applyGeometry()    - applies geometry Property change on the screen
  _applyComponentConstructor()         - changes component constructor
  _usabilityHandler()                - hides component with the widget
  _hider()                  - animator function for the _hiderProperty

*********************************************************************/

include( "helianthus.js" );
include( "Widget.js" );

include( "../../../anime/Property.js" );
include( "../../../anime/styles/leap.js" );

init = function() {

    var helianthus = heliwidgets.engines.helianthus;
    
    var Component = helianthus.Component = {};
    var Widget = helianthus.Widget;

    Component.create = function() {
	// calling common widget create()
	Widget.create.call( this, this.componentConstructor.get() );

        // providing component API access
        this.component = this._layer;

	// creating animations
	this._hiderProperty = new anime.Property( Component._hider, 0, this );

	this.usability.sigChanged.listen( Component._usabilityHandler, this );
        
	// updating resized layers' geometry
	this.simpleGeometry.sigChanged.listen( Component._applyGeometry, this );

	// updating component on demand
	this.componentConstructor.sigChanged.listen( Component._applyComponentConstructor, this );

    }


    // Destroies a  Component from the screen, undoes  everything done by
    // create() method.
    Component.destroy = function() {
        // removing the component
        this.component.remove();

	// calling common widget destroy()
	Widget.destroy.call( this );
    }


    // Event handlers

    // Resizes all special sized layers on geometry change
    Component._applyGeometry = function( oldGeom ) {
        var geom = this.simpleGeometry.get();
        if ( geom.width != oldGeom.width ||
             geom.height != oldGeom.height ) {
	    // dims is the same as geom but with left and top set to 0
	    var dims = helianthus._supply.cssgeom.moveRect( geom, 0, 0 );

            this.component.geometry.set( dims );
        }
    }


    // Applies componentConstructor change  - removes an old component
    // and  recreates  the new  one.
    Component._applyComponentConstructor = function() {
        this.destroy();
        this.create();
    }


    // Applies usability property change to the screen
    //
    // Comment:  all times  set to  0 due  to there  may be  a  lot of
    // widgets  which their  state simultatniously,  so  animation may
    // look slow
    Component._usabilityHandler = function( oldValue ) {
	if ( oldValue == "hidden" ) {
	    // label was hidden and now shown
	    this.hiderProperty.animate({
		targetValue: 0,
		time: 0,
		style: anime.styles.leap
	    });
	} else if ( this.usability.get() == "hidden" ) {
	    // label was shown and now hidden
	    this.hiderProperty.animate({
		targetValue: 100,
		time: 0,
		style: anime.styles.leap
	    });
	}
    }
    

    // Hide animator
    Component._hider = function( val ) {
	// hiding all layers
	var realOpacity = Math.crop( Math.round(100-val) / 100, 0, 1 );
	this.normalLayer.opacity.set( realOpacity );
    }


}
