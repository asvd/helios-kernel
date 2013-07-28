/*********************************************************************

  _DOMComponent.js

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

     Defines platform.components._DOMComponent  object which should be
     a parent  of each  component created as  some DOM element  in the
     browser-based   implementation   of   the  Platform   API.    The
     _DOMComponent object itself is not  part of the Platform API. But
     its public slots (those without  the "_" prefix) are inherited by
     the components and thus are part of their public API

     _DOMComponent  constructor  performs the  things  common for  all
     DOM-based  components,   such  as  element   creation  and  style
     assignements.

     Another  feature of  the  _DOMComponent is  the  tracking of  the
     absolute offset. This is needed to implement tracking of relative
     mouse position for MouseListener component. To calculate absolute
     offset, one must add  component coordinates to the parent layer's
     absolute  offset. But  to prevent  recalculating this  value each
     time  the offset  is needed,  each component  keeps  its absolute
     offset  and  recalculates  it  whenever whether  its  coordinates
     cahgned, or parent's absolute  offset changed. And finally, since
     this  feature is needed  only to  implement MouseListener,  it is
     disabled by  default.  When MouseListener's listenMousePosition()
     method is called,  component initializes absolute offset tracking
     for  itself, and for  all parents  recursively. To  track offset,
     each  component should  provide a  property, so  it  is described
     here, and not in the MouseListener object.

     Since absolute offset is  only needed to implement MouseListener,
     it  is not included  into public  API and  declared as  a private
     property   _absoluteOffset,  and   it  is   initialized  whenever
     _listenAbsoluteOffset() method is called.

     We also want the listener to be removed whenever it is not needed
     anymore. For  this purpose there  is an _unlistenAbsoluteOffset()
     method which stops offset tracking  and calls the same method for
     the parent  component. But the component can  have several hosted
     sub-components who  use the  offset, so there  is also  a counter
     called _absoluteOffsetUsers  which contains a  number of absolute
     offset  property  users. The  absolute  offset tracking  actually
     stops when this counter reaches 0.

 __TODO:______________________________________________________________

     There is probably another way to track absolute offset of the DOM
     object, this should be  investigated, and if yes, such workaround
     should be removed from here, and from rootLayer object which also
     provides absoluteOffset property.

All  signals should  be removed  from  the whole  Platform libary  (to
improve preformance and simplify implementation)

 __Objects declared:__________________________________________________

 platform.components._DOMComponent  - DOM-based components parent obj.
 --platform.components._DOMComponent public properties: --------------
  parent                    - some other component which hosts current
  geometry          - js.Property containing component simple geometry
  zIndex              - js.Property containing component z-index value
  visibility       - js.Property containing component visibility value
 --platform.components._DOMComponent private properties: -------------
  _element         - actual DOM element corresponding to the component
  _absoluteOffset    - element offset relatively to the browser window
  _absoluteOffsetUsers             - a number of absolute offset users
 --platform.components._DOMComponent public methods: -----------------
  appendChild()       - hosts some other component as a child for this
  removeChild()                        - removes some hosted component
  remove()                         - removes component from the parent
 --platform.components._DOMComponent private methods: ----------------
  _applyGeometry()             - applies geometry change to the screen
  _applyZIndex()                - applies z-index change to the screen
  _applyVisibility()         - applies visibility change to the screen
  _listenAbsoluteOffset()            - starts tracking absolute offset
  _unlistenAbsoluteOffset()           - stops tracking absolute offset
  _actuallyListenAbsoluteOffset()      - starts tracking parent offset
  _actuallyUnlistenAbsoluteOffset()     - stops tracking parent offset 
  _updateAbsoluteOffset()              - updates absolute offset value

*********************************************************************/

include( "components.js" );
include( "../../js/Property.js" );
include( "../../js/base.js" );

init = function() {
    platform.components._DOMComponent = function(){};
    if ( typeof document == 'undefined' ) return;

    // shortcut alias
    var cs = platform.components;

    
    // _DOMComponent constructor, creates DOM element and assignes its
    // style.
    //
    // Arguments:
    //  - parent is some other component who will host current one
    //  - geom contains initial geometry struc
    //  - zIndex is initial z-index value
    //  - visibility is initial visibility ("hidden" or "visible")
    //  - elementName is a name of the DOM element to be created
    cs._DOMComponent = function( parent,
                                 geom,
                                 zIndex,
                                 visibility,
                                 elementName ) {
        // assigning a parent component
        this.parent = parent || null;

        // DOM element creation
        if ( elementName ) {
            this._element = document.createElement( elementName );
            this._element.style.position = "absolute";
            this._element.style.overflow = "hidden";

            // initializing the style

            // geometry
            var actualGeom = {
                left: 0,
                top: 0,
                width: 0,
                height: 0
            };
            
            if ( geom ) {
                for ( var i in geom ) {
                    if ( typeof( actualGeom[ i ] ) != "undefined" ) {
                        actualGeom[ i ] = geom[ i ];
                    }
                }
            }

            this.geometry = new js.Property( actualGeom );

            this.zIndex = new js.Property( zIndex || 0 );
            this.visibility = new js.Property( visibility || "visible" );

            // handling style change
            this.geometry.sigChanged.listen( this._applyGeometry, this );
            this.visibility.sigChanged.listen( this._applyVisibility, this );
            this.zIndex.sigChanged.listen( this._applyZIndex, this );

            // applying initial style
            this._applyGeometry( {  top : 0, left : 0, width : 0, height : 0 } );
            this._applyVisibility();
            this._applyZIndex();

            // keeps current absolute offset, null until needed
            this._absoluteOffset = null;
            // number of users listening to the absolute offset
            this._absoluteOffsetUsers = 0;
            
            // creating element on the screen, if there is a parent
            if ( this.parent ) {
                this.parent.appendChild( this );
            }
        } // else the constructor was called for the prototype, skip
    }


    // Appends a child component to the current one
    //
    // Argument:
    //  - child is a component to append as a child
    cs._DOMComponent.prototype.appendChild = function( child ) {
        this._element.appendChild( child._element );
        child.parent = this;
        // listening absolute offset if needed
        if ( child._absoluteOffset != null ) {
            child._actuallyListenAbsoluteOffset();
        }
    }
    
    
    // Removes some existing child component from this component
    //
    // Argument:
    //  - child is some child component to remove
    cs._DOMComponent.prototype.removeChild = function( child ) {
        // unlistening absolute offset if needed
        if ( child._absoluteOffset != null ) {
            child._actuallyUnlistenAbsoluteOffset();
        }
        // removing the DOM element
        this._element.removeChild( child._element );
        child.parent = null;
    }


    // Removes the current component from its parent and from memory
    cs._DOMComponent.prototype.remove = function() {
        // removing component from the parent, if there is one
        if ( this.parent ) {
            this.parent.removeChild( this );
        }

        // removing the element itself
        this._element = null;
    }


    // Applies geometry change to the screen
    cs._DOMComponent.prototype._applyGeometry = function( oldGeom ) {
        var geom = this.geometry.get();
        this._element.style.top = geom.top + "px";
        this._element.style.left = geom.left + "px";
        // change the dimensions only when needed
        if ( geom.width != oldGeom.width ||
             geom.height != oldGeom.height ) {
            this._element.style.width = geom.width + "px";
            this._element.style.height = geom.height + "px";
        }
    }


    // Applies z-index change to the screen
    cs._DOMComponent.prototype._applyZIndex = function() {
        this._element.style.zIndex = this.zIndex.get();
    }
    

    // Applies visibility change to the screen
    cs._DOMComponent.prototype._applyVisibility = function() {
        this._element.style.visibility = this.visibility.get();
    }


    // Starts  tracking DOM  element absolute  offset. This  method is
    // used  to notify  component about  there  is some  user for  its
    // absolute offset.
    cs._DOMComponent.prototype._listenAbsoluteOffset = function() {
        this._absoluteOffsetUsers++;

        // start listening absolute offset (if not yet started)
        if ( this._absoluteOffset == null ) {
            // creating own absolute offset property
            this._absoluteOffset = new js.Property( {top : 0, left : 0} );
            // listening parent's offset if there is a parent
            if ( this.parent != null ) {
                this._actuallyListenAbsoluteOffset();
            }
        } // else the offset is already under tracking
    }


    // Actually  starts offset listtening  asking parent  component to
    // report his offset. Called by _listenAbsoluteOffset if we have a
    // parent,  or  by parent's  appendChild()  whenever component  is
    // hosted.
    cs._DOMComponent.prototype._actuallyListenAbsoluteOffset = function() {
        // first lets ask a parent to track the offset
        this.parent._listenAbsoluteOffset();
        // initializing absolute offset value
        this._updateAbsoluteOffset();
        // subscribing to events which may lead to offset change
        this.geometry.sigChanged.listen(
            this._updateAbsoluteOffset, this );
        this.parent._absoluteOffset.sigChanged.listen(
            this._updateAbsoluteOffset, this );
    }


    // Stops tracking DOM element absolute offset
    cs._DOMComponent.prototype._unlistenAbsoluteOffset = function() {
        this._absoluteOffsetUsers--;

        // check if we need to really stop offset tracking (i.e. there
        // is no users anymore)
        if ( this._absoluteOffsetUsers <= 0 ) {
            // if we have a parent, unlistening his absolute offset
            if ( this.parent != null ) {
                this._actuallyUnlistenAbsoluteOffset();
            }
            // removing absoluteOffset property
            this._absoluteOffset = null;
        }
    }


    // Called by  _unlistenAbsoluteOffset if we  have a parent,  or by
    // parent's removeChild() whenever component is removed
    cs._DOMComponent.prototype._actuallyUnlistenAbsoluteOffset = function() {
        // unsubscribing from events
        this.geometry.sigChanged.unlisten(
            this._updateAbsoluteOffset, this );
        this.parent._absoluteOffset.sigChanged.unlisten(
            this._updateAbsoluteOffset, this );
        // we dont need parent to track his offset anymore
        this.parent._unlistenAbsoluteOffset();
    }


    // Updates  absolute  offset  value  (subscribed to  geometry  and
    // parent's absolute offset changes)
    cs._DOMComponent.prototype._updateAbsoluteOffset = function() {
        var geom = this.geometry.get();
        var newOffset = js.clone( this.parent._absoluteOffset.get() );
        newOffset.top += geom.top;
        newOffset.left += geom.left;
        // changes will not be applied if values are the same
        this._absoluteOffset.set( newOffset );
    }
    
}
