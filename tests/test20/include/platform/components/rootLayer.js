/*********************************************************************

  rootLayer.js

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

     Defines platform.components.rootLayer object which provides Layer
     component API and represents the first existing Layer filling the
     whole browser window.

     rootLayer's  geometry is changed  by the  browser window  when it
     gets resized,  so listen to  rootLayer.geometry.sigChanged if you
     want to handle resize.

     rootLayer  does  not  include  parent and  zIndex.   Other  style
     Properties  (visibility,   opacity,  backgroundColor)  are  still
     present.

     rootLayer.geometry  Property should not  be changed  manually, it
     will be changed by the browser  resize, and API provides a way to
     listen     to     such      change     subscribing     to     the
     rootLayer.geometry.sigChanged signal.


 __Objects declared:__________________________________________________

 platform.components.rootLayer   - root Layer filling the whole window
 --platform.components.rootLayer member public properties: -----------
  geometry          - js.Property containing rootLayer simple geometry
  visibility       - js.Property containing rootLayer visibility value
  opacity             - js.Property containing rootLayer opacity value
  backgroundColor  - js.Property containing rootLayer background color
 --platform.components.rootLayer member private properties: ----------
  _element         - actual DOM element corresponding to the rootLayer
  _absoluteOffset    - keeps rootLayer offset which is always ( 0, 0 )
 --platform.components.rootLayer member public methods: --------------
  appendChild()  - hosts some other component as a child for rootLayer
  removeChild()                        - removes some hosted component
 --platform.components.rootLayer member private methods: -------------
  _updateGeometry()       - changes geometry Property whenever resized
  _applyVisibility()         - applies visibility change to the screen
  _applyOpacity()               - applies opacity change to the screen
  _applyBackgroundColor()            - applies background color change
  _listenAbsoluteOffset()          - empty, needed for offset tracking
  _unlistenAbsoluteOffset()        - empty, needed for offset tracking

*********************************************************************/

include( "components.js" );
include( "../../js/Property.js" );
include( "../_supply/browser.js" );

// style properties  application methods  will be imported  from these
// two components
include( "_DOMComponent.js" );
include( "Layer.js" );

init = function() {

    if ( typeof document == 'undefined' ) return;

    // shortcut alias
    var cs = platform.components;

    // some browser-dependent workarounds

    // contains true if browser is Microsoft Internet Explorer
    var isIE = platform._supply.browser.isIE;

    // Conditionally  defining getDimensions() function  which returns
    // an array containing width and height of the browser's body
    if ( window.innerWidth ) {
	var getDimensions = function() {
	    return {
		width : window.innerWidth,
		height : window.innerHeight
	    };
	}
    } else if ( document.getElement &&
                document.getElement.clientWidth ) {
	var getDimensions = function() {
	    return {
		width : document.getElement.clientWidth,
		height : document.getElement.clientHeight
	    };
	}
    } else if ( document.documentElement ) {
	var getDimensions = function() {
	    return {
		width : document.documentElement.clientWidth,
		height : document.documentElement.clientHeight
	    };
        }
    }
	
    if ( ( typeof ( getDimensions ) == "undefined" ||
	   getDimensions().width == 0 ) &&
	 document.body ) {
	var getDimensions = function() {
	    return {
		width : document.body.clientWidth,
		height : document.body.clientHeight
	    };
        }
    }

    var currentDimensions = getDimensions();

    var body = document.getElementsByTagName( "body" ).item( 0 );

    // this will prevent scrollbars blinking after resize
    var container = document.createElement( "div" );
    container.style.position = "absolute";
    container.style.overflow = "hidden";
    container.style.top = 0;
    container.style.left = 0;
    container.style.width = "100%";
    container.style.height = "100%";
//    body.appendChild( container );

    // platform.components.rootLayer object itself
    cs.rootLayer = {
        _element : container,
        geometry : new js.Property( {
            top : 0,
            left : 0,
            width : currentDimensions.width,
            height : currentDimensions.height
        } ),
        visibility : new js.Property( "visible" ),
        opacity : new js.Property( 1 ),
        backgroundColor : new js.Property( "rgba(0,0,0,0)" ),
        // child manipulation methods are the same
        appendChild : cs._DOMComponent.prototype.appendChild,
        removeChild : cs._DOMComponent.prototype.removeChild,
        // _updateGeometry method  differs from other  _apply* methods
        // meaning that _apply* methods catch some property change and
        // apply  this  change to  the  screen, while  _updateGeometry
        // handles rootLayer geometry change by the browser resize and
        // sends geometry change signal
        _updateGeometry : function() {
            currentDimensions = getDimensions();
            this.geometry.set(
                {
                    top : 0,
                    left : 0,
                    width : currentDimensions.width,
                    height : currentDimensions.height
                } );
        },
        // application methods are the same
        _applyVisibility : cs._DOMComponent.prototype._applyVisibility,
        _applyOpacity : cs.Layer.prototype._applyOpacity,
        _applyBackgroundColor : cs.Layer.prototype._applyBackgroundColor,
        // absolute     offset     routines    implementation,     see
        // _DOMComponent.js comments on this
        // the property is never changed, signal never sent
        _absoluteOffset : new js.Property( { top : 0, left : 0 } ),
        _listenAbsoluteOffset : function() {},
        _unlistenAbsoluteOffset : function() {}
    }

    // conditionnaly handling browser resize
    if ( false && isIE ) {
	body.onresize = cs.rootLayer._updateGeometry();
    } else {
	body.setAttribute(
            "onResize",
	    "javascript:platform.components.rootLayer._updateGeometry()"
        );
    }

    // handling style change
    cs.rootLayer.visibility.sigChanged.listen(
        cs.rootLayer._applyVisibility, cs.rootLayer );
    cs.rootLayer.opacity.sigChanged.listen(
        cs.rootLayer._applyOpacity, cs.rootLayer );
    cs.rootLayer.backgroundColor.sigChanged.listen(
        cs.rootLayer._applyBackgroundColor, cs.rootLayer );

    

}
