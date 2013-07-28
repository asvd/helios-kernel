/*********************************************************************

  Layer.js

  This file is part of Helios JavaScript framework.

 __Copying:___________________________________________________________

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


 __Description:_______________________________________________________

     Defines  platform.components.Layer component  which  represents a
     simple rectangular  area on the  screen. Layer is proposed  to be
     used for components arrangement.

     Additionally,    platform.components.Layer   component   contains
     opacity and backgroundColor Property slots.

 __Objects declared:__________________________________________________

 platform.components.Layer              - simple rectangular component
 --platform.components.Layer member public properties: ---------------
  opacity               - js.Property containing Layer's opacity value
  backgroundColor    - js.Property containing Layer's background color
 --platform.components.Layer member private methods: -----------------
  _applyOpacity()               - applies opacity change to the screen
  _applyBackgroundColor()            - applies background color change

*********************************************************************/

include( "_DOMComponent.js" );
include( "../_supply/browser.js" );
include( "../../js/Property.js" );

init = function() {

    // shortcut alias
    var cs = platform.components;

    // some browser-dependent workarounds

    // contains true if browser is Microsoft Internet Explorer
    var isIE = platform._supply.browser.isIE;

    // setOpacity()  function   is  defined  condititonally   and  its
    // implementation depends on the browser.
    //
    // Arguments:
    //  - element is a DOM element to set the opacity  to
    //  - value is measured from 0.0 to 1.0
    if ( isIE ) {
        var setOpacity = function( element, value ) {
            element.style.opacity = value;
	    element.style.filter = ('alpha(opacity='+parseInt(value*100)+')');
        }
    } else {
        var setOpacity = function( element, value ) {
            if ( !element ) return;
            element.style.opacity = value;
        }
    }

    // Layer constructor, creates a DIV element and assigns its style.
    //
    // Arguments:
    //  - parent is some other component who will host current one
    //  - geom contains initial geometry struc
    //  - zIndex is initial z-index value
    //  - visibility is initial visibility ("hidden" or "visible")
    //  - opacity is initial opacity value
    //  - backgroundColor is initial background color
    cs.Layer = function( parent,
                         geom,
                         zIndex,
                         visibility,
                         opacity,
                         backgroundColor ) {
        // creating a DIV element and assigining its basic properties
        cs._DOMComponent.call( this,
                               parent,
                               geom,
                               zIndex,
                               visibility,
                               "div" );

        // otherwise  the  layer  will  be stretched vertically in IE
        if ( isIE ) {
            this._element.innerHTML = '<div></div>';
        }
        
        // initializing the style

        // opacity
        var actualOpacity = 1.0;
        if ( typeof( opacity ) != "undefined" ||
             opacity != null ) {
            actualOpacity = opacity;
        }
        this.opacity = new js.Property( actualOpacity );

        // backgroundColor
        // defaults to opaque black
        var actualBackgroundColor = isIE ? "rgb(0,0,0)" : "rgba(0,0,0,0)"; 
        if ( typeof( backgroundColor ) != "undefined" ||
             backgroundColor != null ) {
            actualBackgroundColor = backgroundColor;
        }
        this.backgroundColor = new js.Property( actualBackgroundColor );

        // handling style change
        this.opacity.sigChanged.listen( this._applyOpacity, this );
        this.backgroundColor.sigChanged.listen( this._applyBackgroundColor, this );

        // applying initial style
        this._applyOpacity();
        this._applyBackgroundColor();
    }
    cs.Layer.prototype = new cs._DOMComponent();


    // Applies background color change to the screen
    cs.Layer.prototype._applyBackgroundColor = function() {
        if ( !this._element ) return;
        this._element.style.backgroundColor = this.backgroundColor.get();
    }


    // Applies opacity change to the screen
    cs.Layer.prototype._applyOpacity = function() {
        setOpacity( this._element, this.opacity.get() );
    }
    

}
