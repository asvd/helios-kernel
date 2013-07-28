/*********************************************************************

  MouseListener.js

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

     Defines  platform.components.MouseListener component which  is an
     invisible   rectangular   area   which   tracks   mouse   events.
     MouseListener  contains   the  following  signals:  sigMouseOver,
     sigMouseOut, sigMouseDown, sigMouseUp, sigClick. Additionally, it
     contains listenMousePosition() method which enables cursor position
     tracking  and creates  mousePosition property  containing current
     mouse pointer position relatively the MouseListener component.

 __TODO:______________________________________________________________

     Probably it is enough insert an  empty DIV instead of a TABLE for
     IE, this should be checked.

 __Objects declared:__________________________________________________

 platform.components.MouseListener    - mouse event tracking component
 --platform.components.MouseListener member public properties: -------
  sigMouseOver                          - js.Signal sent on mouse over
  sigMouseOut                            - js.Signal sent on mouse out
  sigMouseDown                          - js.Signal sent on mouse down
  sigMouseUp                              - js.Signal sent on mouse up
  sigClick                                   - js.Signal sent on click
  mousePosition                - js.Property keeping mouse coordinates
 --platform.components.MouseListener member public methods: ----------
  listenMousePosition()              - enables mouse position tracking

*********************************************************************/

include( "_DOMComponent.js" );
include( "../../js/Signal.js" );
include( "../../js/Property.js" );
include( "../_supply/browser.js" );

init = function() {

    // shortcut alias
    var cs = platform.components;

    // some browser-dependent workarounds

    // contains true if browser is Microsoft Internet Explorer
    var isIE = platform._supply.browser.isIE;


    // MouseListener constructor,  creates an emty  Layer and attaches
    // mouse events to it.
    //
    // Arguments:
    //  - parent is some other component who will host current one
    //  - geom contains initial geometry struc
    //  - zIndex is initial z-index value
    //  - visibility is initial visibility ("hidden" or "visible")
    //  - listenMousePosition is  a flag defining  whether MouseListener
    //    should  track mouse  position  initially (though  it may  be
    //    perfomed later by calling listenMousePosition() method)
    cs.MouseListener = function( parent,
                                 geom,
                                 zIndex,
                                 visibility,
                                 listenMousePosition ) {
                                 
        // creating a DIV element and assigining its basic properties
        cs._DOMComponent.call( this,
                               parent,
                               geom,
                               zIndex,
                               visibility,
                               "div" );

        // otherwise  the  layer  will  be stretched vertically in IE
        if ( isIE ) {
            // See TODO in the header comment
            this._element.innerHTML = '<table cellspacing=0 cellpadding=0 '+
		'border=0 width=1 height=1><tr><td></td></tr></table>';
        }

        // tracking the mouse events

        this.sigMouseOver = new js.Signal();
        this.sigMouseOut = new js.Signal();
        this.sigMouseDown = new js.Signal();
        this.sigMouseUp = new js.Signal();
        this.sigClick = new js.Signal();

        var thisObj = this;
	this._element.onmouseover = function(){ thisObj.sigMouseOver.send(); }
	this._element.onmouseout  = function(){ thisObj.sigMouseOut.send();  }
	this._element.onmousedown = function(){ thisObj.sigMouseDown.send(); }
	this._element.onmouseup   = function(){ thisObj.sigMouseUp.send();   }
	this._element.onclick     = function(){ thisObj.sigClick.send();     }

        // tracking the coordinatees if needed
        if ( typeof( listenMousePosition ) != "undefined" &&
             listenMousePosition == true ) {
            this.listenMousePosition();
        }
        
    }
    cs.MouseListener.prototype = new cs._DOMComponent();


    // Enables mouse position tracking
    cs.MouseListener.prototype.listenMousePosition = function() {
        // dont initialize mouse tracking twice
        if ( typeof( this.mousePosition ) == "undefined" ) {
            // we need to know absolute offset of the component
            this._listenAbsoluteOffset();
            
            // will keep current mouse position
            this.mousePosition = new js.Property( { x : 0, y : 0 } );

            // updating position on mouse move
            if ( isIE ) {
                this._element.captureEvents( Event.MOUSEMOVE );
            }

            var offset = this._absoluteOffset.get();

            var thisObj = this;

            this._element.onmousemove = function( e ) {
                var newPosition = {}
                if ( isIE ) {
                    newPosition = {
                        x : event.clientX
                            + document.body.scrollLeft
                            - offset.left,
                        y : event.clientY
                            + document.body.scrollTop
                            - offset.top
                    }
                } else {
                    newPosition = {
                        x : e.pageX - offset.left,
                        y : e.pageY - offset.top
                    }
                }
                
	        // fixing possible negative values
	        if ( newPosition.x  < 0 ) {
	            newPosition.x = 0;
	        }
	        
	        if ( newPosition.y < 0 ) {
	            newPosition.y = 0;
	        }

                thisObj.mousePosition.set( newPosition );

            }
            
        }
        
    }

    

}
