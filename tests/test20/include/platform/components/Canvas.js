/*********************************************************************

  Canvas.js

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

     Defines  platform.components.Canvas component which  represents a
     rectangular    component   and    provides    Canvas   interface,
     i.e. getContext() method.

 __Objects declared:__________________________________________________

 platform.components.Canvas             - rectangular canvas component
 --platform.components.Canvas member public methods: -----------------
  getContext()                    - returnes the canvas context object
 --platform.components.Canvas member private methods: ----------------
  _applyCanvasGeometry()       - applies geometry change to the canvas

*********************************************************************/

include( "_DOMComponent.js" );
include( "../_supply/excanvas/excanvas.js" );
include( "../_supply/browser.js" );

init = function() {

    // shortcut alias
    var cs = platform.components;

    // contains true if browser is Microsoft Internet Explorer
    var isIE = platform._supply.browser.isIE;

    // Canvas constructor, creates a CANVAS element.
    //
    // Arguments:
    //  - parent is some other component who will host current one
    //  - geom contains initial geometry struc
    //  - zIndex is initial z-index value
    //  - visibility is initial visibility ("hidden" or "visible")
    cs.Canvas = function( parent,
                          geom,
                          zIndex,
                          visibility ) {
        // creating a CANVAS element, assigining its basic properties
        cs._DOMComponent.call( this,
                               parent,
                               geom,
                               zIndex,
                               visibility,
                               "canvas" );

        // initializing the canvas for IE using excanvas
        if ( isIE &&
             typeof( platform.supply.excanvas ) != "undefined" ) {
            platform._supply.excanvas.G_vmlCanvasManager.initElement(
                this._element );
        }

        // for Canvas we should also resize the canvas itself
        // (along with the DOM element style)
        this.geometry.sigChanged.listen( this._applyCanvasGeometry, this );
        // initially setting the canvas geometry
        this._applyCanvasGeometry( { top: 0, left: 0, width: 0, height: 0 } );
    }
    cs.Canvas.prototype = new cs._DOMComponent();

    // Returns the drawing context
    cs.Canvas.prototype.getContext = function( ctx ) {
        switch ( ctx ) {
        case "2d" : return this._element.getContext( ctx );
        default : return null;
        }
    }

    // Applies geometry to the canvas itself
    //
    // Argument:
    //  - oldGeom is a previous component geometry
    cs.Canvas.prototype._applyCanvasGeometry = function( oldGeom ) {
        var geom = this.geometry.get();
        if( parseInt( oldGeom.width ) != parseInt( geom.width ) ||
            parseInt( oldGeom.height ) != parseInt( geom.height ) ) {
            this._element.width  = geom.width;
            this._element.height = geom.height;
        }
    }


}
