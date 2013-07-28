/*********************************************************************

  Widget.js

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

     Defines heliwidgets.engines.helianthus.Widget  object, a storage
     of  common  widget creation  and  destruction methods.   create()
     method is intended to be called from particular widget's create()
     method. It  creates a Layer  which will store widget  graphic and
     also attaches  signals to  events.  destroy() method  removes the
     Layer away  from the screen.   It should be called  by particular
     widget's destroy() methods.

     create() method also handles  change of widget's zIndex Property,
     attaching a _applyZIndex() method  to the event, and also handles
     change   of  widget's  opacity   Property  change,   attaching  a
     _applyOpacity()  method in the  same way.   _applyZIndex() method
     moves widget layer lower or upper when needed.

     _applyGeometry()  method  is subscribed  to  geometry change  and
     moves and resizes widget layer in the proper way.

     destroy()  should  be  called  by particular  widget's  destroy()
     method  in the  end,  after all  created  in particular  widget's
     create() is cleared.


 __Objects declared:__________________________________________________

 heliwidgets.engines.helianthus.Widget   - keeps widget creation stuff
 --heliwidgets.engines.helianthus.Widget private properties: ---------
  _layer                  - points to the main widget component layer
 --heliwidgets.engines.helianthus.Widget public methods: -------------
  create()         - creates a layer for the widget and handles events
  destroy()        - destroys widgeet layer and removes event handlers
 --heliwidgets.engines.helianthus.Widget private methods: ------------
  _applyOpacity()      - applies opacity Property change on the screen
  _applyZIndex()        - applies zIndex Property change on the screen
  _applyGeometry()             - applies geometry change on the screen


*********************************************************************/

include( "helianthus.js" );
include( "../../../js/base.js" );
include( "../../../platform/components/Layer.js" );

init = function() {

    var helianthus = heliwidgets.engines.helianthus;

    var Widget = helianthus.Widget = {};

    // Creates a set of widget's  layers described in the main comment
    // at the  top of the  file.  Also creates  a set of  *Host layers
    // which   will    be   used   by    children'   widget   create()
    // method. Attaches events to signals.
    //
    // Should be called by  particular widget's create() method before
    // everything else is done.
    //
    // Argument:
    //  - componentConstructor  (opt.) is  a constructor  function for
    //    the  component  to create  as  a  layer.  When omitted,  the
    //    default platform.components.Layer is used.
    Widget.create = function( componentConstructor ) {
        // component constructor
        var Component = platform.components.Layer;
        if ( typeof( componentConstructor ) != "undefined" &&
             componentConstructor != null ) {
            Component = componentConstructor;
        }

        // calculating geometry
        var geom = this.simpleGeometry.get();
        var offset = this.parent.offset.get();
        geom.left += offset.left;
        geom.top += offset.top;
        
	// creating widget layer
	this._layer = new Component( this.parent._layer,
                                     geom,
                                     this.zIndex.get() );
        
	// subscribing to widget properties change
	this.simpleGeometry.sigChanged.listen( Widget._applyGeometry, this );
	this.parent.offset.sigChanged.listen( Widget._applyGeometry, this );
	this.opacity.sigChanged.listen( Widget._applyOpacity, this );
	this.zIndex.sigChanged.listen( Widget._applyZIndex, this );
    }

    // Undoes everything done  by Widget.create() (removes all created
    // layers from the screen).
    //
    // Should be called by  particular widget's destroy() method after
    // everything else is destroyed.
    Widget.destroy = function() {
	this._layer.remove();
	// unsubscribing from widget properties change
	this.simpleGeometry.sigChanged.unlisten( Widget._applyGeometry, this );
	this.parent.offset.sigChanged.unlisten( Widget._applyGeometry, this );
	this.opacity.sigChanged.unlisten( Widget._applyOpacity, this );
	this.zIndex.sigChanged.unlisten( Widget._applyZIndex, this );
    }


    // Subscribed  to   zIndex.sigChanged  signal,  rearranges  actual
    // layers on the screen to match newly assigned zIndex value.
    Widget._applyZIndex = function() {
	this._layer.zIndex.set( this.zIndex.get() );
    }


    // Subscribed to opacity.sigChanged signal, applies newly assigned
    // opacity value to the actual layers on the screen.
    Widget._applyOpacity = function() {
	this._layer.opacity.set( this.opacity.get() );
    }


    // Subscrtibed to geometry.sigSimpleChanged signal, updates actual
    // layer's geometry on the screen.
    Widget._applyGeometry = function() {
        // calculating geometry
        var geom = js.clone( this.simpleGeometry.get() );
        var offset = this.parent.offset.get();
        geom.left += offset.left;
        geom.top += offset.top;
        
        this._layer.geometry.set( geom );
    }

}
