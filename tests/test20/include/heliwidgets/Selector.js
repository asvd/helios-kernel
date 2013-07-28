/*********************************************************************

  Selector.js

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

     Defines  heliwidgets.Selector widget  which is  used to  select a
     single value from  a given set of values.  Selector is a compound
     widget, so it does not require an engine implementation.

     Selector is inherited from heliwidgets.Frame and along with frame
     properties  also provides  some  usefull ones.  Selector's layout
     property whoose value equals whether "horizontal" (by default) or
     "vertical"   defines   whether   Selector   items   are   located
     horizontally  or  vertically.  Selector's selectedIndex  property
     keeps and  allows to set programmatically a  selected item index.
     Selector::items[] array keeps a set  of items, each of which is a
     single widget (a Table cell  actually). You can use this array to
     operate with a  single item widget. But if you  want to replace a
     text label  with some custom  child widget (e.g.   with graphical
     icon), add  widgets to  itemButton widget property  (read below),
     which is a highlight  button handling mouse events performed over
     an item. Otherwise you will simply hover the button with your new
     widgets and the button will not handle signals.

     Each  new created  item (which  is a  table cell  with  a labeled
     highlight button)  also provide  a label js.Property  changed via
     property  setter.  Item's itemButton  property provides  acces to
     the highlight button widget located  on the cell.  Also each cell
     has index js.Property, which  keeps item's index and when set()',
     moves the item to the new position.

     A  certain  item may  be  disabled  by  setting its  availability
     property value to "disabled".

     Items may  have a value ("value" resource  name). Different items
     could have the same value. Value can be a string, or a number, or
     anything. You can change an item value by simply assigning, since
     it is not a js.Property. Selector's getValue() method will return
     the value of the currently selected item.

     Selector  widget has  selectedIndex js.Property  which  allows to
     move the  selection bullet programmatically. You  can assign some
     positive value  to the  property which will  mean an index  of an
     item to select,  and also you may use the  special -1 value which
     will  mean to  hide the  selection bullet  completely  instead of
     selecting some item.


 __Objects declared:__________________________________________________

 heliwidgets.Selector                           - Selector constructor
 --heliwidgets.Selector public properties: ---------------------------
  layout                   - js.Property, defines selector orientation
  selectedIndex           - js.Property, defines a selected item index
  sigSelected    - js.Signal sent whenever some other item is selected
  items[]         - keeps an array of selector items, each is a Widget
  bullet   - a button on the _bulletFrame which hanldes bullet actions
 --heliwidgets.Selector private properties: --------------------------
  _mouseListener            - tracks mouse events when bullet is moved
  _bulletFrame         - a glass frame widget that represents a bullet
  _itemsTable          - a table each cell of which represents an item
  _bulletSize         - keeps bullet current width or height in pixels
  _bulletSize_2                                      = _bulletSize / 2
  _bulletMoverProperty       - animation property which moves a bullet
  _sigBulletMouseDown    - sent whenever mouse is pushed on the bullet
  _sigBulletMouseUp          - sent whenever mouse releases the bullet
 --heliwidgets.Selector public methods: ------------------------------
  getValue()                    - returns a value of the selected item
  addItem()   - adds a new selector item with provided label and index
  removeItem()                - removes a given item from the selector
  switchItems()                        - switches two items vice versa
  moveItem()                       - moves an item to the new position
 --heliwidgets.Selector private methods: -----------------------------
  _initWithCustomResource()  - parses Selector resource (set of items)
  _create()     - calls Frame._create() and initializes mouse listener
  _mouseTrackerSubscriber()          - initializes coordinate tracking
  _startBulletMovement()     - starts moving the bullet with the mouse
  _stopBulletMovement()       - stops moving the bullet with the mouse
  _bulletTracker                     - moves the bullet with the mouse
  _isCorrectIdx() - checks whether an argument is a correct item index
  _moveBulletToItem()   - animately moves a bullet to the desired item
  _bulletMover()       - animator which performs bullet move animation
  _applyBulletGeometry()  - is called whenever bullet geometry changes
  _applySelectedIndex()                      - performs item selection
  _applyLayout()    - performs layout update, listens to layout change
  _applyIndeces()          - called whenever items sequence is changed
  _doSwitchItems()                     - actually performs item switch
 --Selector item public properties: ----------------------------------
  label              - string js.Property, a text written on the label
  value                       - a value of an item (not a js.Property)
  itemButton        - a button which handles interraction with an item
  index                         - number js.Property, keeps item index
 --Selector item private methods: ------------------------------------
  _move()                    - moves an item from old to current index
  _select()                      - moves the bullet to select the item



 __TODO:______________________________________________________________

     Remove  the bullet  (set to  -1)  when selected  item is  removed
     (instead of finding closest enabled item).


     Probably  it is  not  correct to  initialize anime.Property  here
     since  it is  not an  engine routine.   Suppose we  should  add a
     method for hw.Frame  (or hw.Widget) that will move  the widget to
     the desired position and its implementation for helianthus should
     apply the animation.


     Is there  some way  to quickly fetch  a currently  selected item?
   something shorter than selector.items[selector.selectedIndex.get()]


*********************************************************************/

include( "heliwidgets.js" );
include( "Frame.js" );
include( "Button.js" );
include( "Table.js" );
include( "Component.js" );

include( "../anime/Property.js" );
include( "../anime/styles/fspline.js" );
include( "../anime/styles/cspline.js" );
include( "../anime/styles/leap.js" );
include( "../math/stuff.js" );
include( "../js/Property.js" );
include( "../js/Signal.js" );
include( "../platform/components/MouseListener.js" );

init = function() {

    // keeps heliwidgets routines
    // a shorter name for better reading of this file
    var hw = heliwidgets;


    // A resource that will initialize the selector
    var selectorResource = {
        frameType : "normal",
//        frameType : "glass",
//        frameType : "lower",
        children: [
            // listens to the mouse coordinates and hosts other stuff
            {
                type : hw.Component,
                name : "_mouseListener",
                geometry : { left: 0, top: 0, right: 0, bottom: 0 },
                componentConstructor : platform.components.MouseListener,
                isEventComponent : true,
                children : [
                    // table will contain items
                    {
                        type : hw.Table,
                        name : "_itemsTable",
                        geometry : { left: 0, top: 0, right: 0, bottom: 0 }
                    },
                    // bullet
                    {
                        type: hw.Frame,
                        name : "_bulletFrame",
                        frameType: "glass",
                        geometry: { left: 0, top: 0, right: 0, bottom: 0 },
                        children: [
                            // bullet button
                            {
                                type : hw.Button,
                                name : "bullet",
                                buttonType : "highlightVertical",
                                geometry: { left: 0, top: 0, right: 0, bottom: 0 }
                            }
                        ]
                    }
                ]
            }
        ]
    }

    // Selector constructor. Inherited from Frame.
    //
    // Argument:
    // - initStruct is a structure to initialize widget with
    hw.Selector = function( initStruct ) {
        // particular  widget  type properties  should  be created  before
        // parent  constructor is  called  (because constructor  calls
        // initWithResource() which may assing properties)

        // Selector layout, "horizontal" or "vertical"
        this.layout = new js.Property( "horizontal" );

        // Selected item property
        this.selectedIndex = new js.Property( 0 );

	// Sent whenever selected another item, an alias
	this.sigSelected = this.selectedIndex.sigChanged;

        // Will keep items (table cells actually)
        this.items = new Array();

        // creating base set of subwidgets
        hw.Frame.call( this, selectorResource );

        // initializing with provided structure
        this.initWithResource( initStruct );

        // bullet move animation
        this._bulletMoverProperty = new anime.Property( this._bulletMover, 0, this );

        // signals are not connected yet so we call it here
        this._applyBulletGeometry();
        this._applyLayout();

        // used by methods which handles mouse selector dragging
        this._sigBulletMouseDown = new js.Signal();
        this._sigBulletMouseUp = new js.Signal();

        // connecting events to signals
        this.simpleGeometry.sigChanged.listen( this._applyBulletGeometry, this );
        this.layout.sigChanged.listen( this._applyLayout, this );
        this.selectedIndex.sigChanged.listen( this._applySelectedIndex, this );

        this.bullet.pushed.sigChanged.listen( function() {
            if ( this.bullet.pushed.get() == true ) {
                this._sigBulletMouseDown.send();
            } else {
                this._sigBulletMouseUp.send();
            }
        }, this );

    }
    hw.Selector.prototype = new hw.Frame();



    // Custom resource initializer. Parses a set of items resource.
    //
    // Arguments:
    // - name should equal "items" for Selector
    // - resource is an array of items
    // - rootObject  is  an  object  which should  have  some  objects
    //   initialized as its properties
    hw.Selector.prototype._initWithCustomResource = function( name,
                                                              resource,
                                                              rootObject ) {
        // checking the name of the resource provided
        switch ( name ) {
        case "items" :
            // initializing array of items
            var newItem; // currently created item
            var itemName; // current item name
            var value; // current item value
            var label; // current item label
            // for each item
            for ( var item in resource ) {
                // unsetting itemName
                itemName = null;
                // specially checking if there is a item name provided
                if ( typeof ( resource[ item ].name ) != "undefined" ) {
                    itemName = resource[ item ].name;
                    // removing  name from  the  structure to  prevent
                    // discouraging item initializer
                    resource[ item ].name = null;
                    delete resource[ item ].name;
                }
                // setting the label
                if ( typeof ( resource[ item ].label ) == "undefined" ) {
                    label = "";
                } else {
                    label = resource[ item ].label;
                    // removing  the  label   from  the  structure  to
                    // prevent discouraging item initializer
                    resource[ item ].label = null;
                    delete resource[ item ].label;
                }
                // setting the value
                if ( typeof ( resource[ item ].value ) == "undefined" ) {
                    value = "";
                } else {
                    value = resource[ item ].value;
                    // removing  the  value   from  the  structure  to
                    // prevent discouraging item initializer
                    resource[ item ].value = null;
                    delete resource[ item ].value;
                }
                // adding the new item
                newItem = this.addItem( label, value );
                // assigning to the rootObject if needed
                if ( itemName != null &&
                     // denies overriding existing properties
                     typeof ( rootObject[ itemName ] ) == "undefined" ) {
                    rootObject[ itemName ] = newItem;
                }
                // this is  probably not needed for  the Selector, but
                // we keep it here for the conformance
                newItem.initWithResource( resource[ item ], rootObject );
            }
            break;
        default : break; // unknown resource name, skipping
        }
    }


    // Calls Frame._create() and then initializes mouse listener.
    //
    // Overriding _create()  because we  also want to  start listening
    // mouse position for the listener component after it is created.
    hw.Selector.prototype._create = function() {
        hw.Frame.prototype._create.call( this );
        this._mouseListener.component.listenMousePosition();
        // read _mouseTrackerSubscriber comment below...
        this._mouseListener.component.mousePosition.sigChanged.listen(
            this._mouseTrackerSubscriber, this );
    }


    // Initially subscribes  mouse listener  after a cursor  was moved
    // over the selector.
    //

    // If mouse  pointer is above  the selector when the  page loaded,
    // its mousePosition  will equal 0, because there  was no movement
    // to track. So here is  a simple workaround that enables selector
    // tracking after the first mouse move.
    hw.Selector.prototype._mouseTrackerSubscriber = function() {
        // unsubscribing this method, we dont need it anymore
        this._mouseListener.component.mousePosition.sigChanged.listen(
            this._mouseTrackerSubscriber, this );
        // creating an event handler  that will catch mouse down event
        // on a selector and start moving it along with the pointer
        this._sigBulletMouseDown.listen( this._startBulletMovement, this );

    }


    // Starts moving the bullet with the mouse
    hw.Selector.prototype._startBulletMovement = function() {
        var layout = this.layout.get();
        this._initialSelectorPosition = this.selectedIndex.get() * this._bulletSize;
        // current cursor coordinates
        var mousePosition = this._mouseListener.component.mousePosition.get();
        // will store mouse coordinate at the moment of click
        this._initialCoordinate = (layout == "horizontal")?
            mousePosition.x:
            mousePosition.y;
        // moving the selector bullet with the mouse
        this._mouseListener.component.mousePosition.sigChanged.listen( this._bulletTracker, this );
        // unsubscribing selector mover on mouse up
        this._sigBulletMouseUp.listen( this._stopBulletMovement, this );
        // This  will  work  around  a  rare  situation  when  the
        // Selector layout is changed during bullet move, stopping
        // everything if layout  changed. This functionallity have
        // not yet been tested.
        this.layout.sigChanged.listen( this._stopBulletMovement, this );
    }


    // Stops moving the bullet with the mouse. Ubsubscribes the bullet
    // mover and  itself and move  the bullet to the  correct position
    // when moving is finished.
    hw.Selector.prototype._stopBulletMovement = function() {
        // unsubscribing signals
        this._mouseListener.component.mousePosition.sigChanged.unlisten( this._bulletTracker, this );
        this._sigBulletMouseUp.unlisten( this._stopBulletMovement, this );
        this.layout.sigChanged.unlisten( this._stopBulletMovement, this );
        // moving the selector to the closest item
        var selectorGeom = this._bulletFrame.simpleGeometry.get();
        var offset = (this.layout.get()=="horizontal") ?
            selectorGeom.left : selectorGeom.top;
        var oldIndex = this.selectedIndex.get();

        // finding the closest enabled item

        // will keep actual item number where to move
        var newIndex = oldIndex;
        // number of px between selector and closest available item
        var minPath = null;
        for ( var i = 0; i < this.items.length; i++ ) {
            if ( this.items[ i ].usability.get() == "enabled" &&
                 (
                     (minPath == null) ||
                     ( Math.abs( this._bulletSize * i - offset ) < minPath )
                 )
               ) {
                // closer position found
                minPath = Math.abs( this._bulletSize * i - offset );
                newIndex = i;
            }
        }

        this.selectedIndex.set( newIndex );
        // selectedIndex.sigChanged is not  delivered in case when
        // selected    item   is    the   same,    so    we   call
        // _applySelectedIndex() manually
        if ( oldIndex == newIndex ) {
            this._applySelectedIndex();
        }
    }


    // Moves the bullet with the mouse.
    hw.Selector.prototype._bulletTracker = function(){
        var mousePosition = this._mouseListener.component.mousePosition.get();
        var layout = this.layout.get();

        // target value for the animation  as if the bullet was moving
        // with the mouse
        var offset = (this._initialSelectorPosition -
                           this._initialCoordinate +
                           ((layout == "horizontal")?
                            mousePosition.x:
                            mousePosition.y));

        // but actually  we want  the bullet to  move a bit  slower as
        // closer it is to some enabled item

        // number of  px between  selector and closest  available item
        // (signed)
        var minPath = null;

        // finding the closest enabled item
        for ( var i = 0; i < this.items.length; i++ ) {
            if ( this.items[ i ].usability.get() == "enabled" &&
                 (
                     (minPath == null) ||
                     ( Math.abs( this._bulletSize * i - offset ) < Math.abs( minPath ) )
                 )
               ) {
                // closer position found
                minPath = this._bulletSize * i - offset;
            }
        }

        // half of the range between two fixed positions (items)
        var half = this._bulletSize_2;

        var actualOffset = offset;

        if ( Math.abs( minPath ) <= half ) {
            // distance between offset and point between two items
            var x = half - Math.abs( minPath );
            // correction to the offset
            // (here bullet size==2*half)
            var theSin = Math.sin( x * Math.PI / this._bulletSize );
            // 0.0 to 1.0, lower value means stronger gravity.
            // --
            // in the between-items point  the function will equal sin
            // and thus  it will connect smoothly with  linear part in
            // case when the next item is disabled. in the points near
            // item position, the function will be closer to sqrt(sin)
            // and  thus it will  move the  selector towards  the item
            // stronger than just a plain sin.
            var coeff = 1 - x / half;
            var diff = half * ( Math.sqrt( theSin ) * (1-coeff) + theSin * coeff ) - x;
            actualOffset += minPath > 0 ? diff : -diff;
        } // else closest item is disabled and we move the bullet lineary with the mouse

        // this  will  deny  the  bullet  move  over  the  first  item
        // (_bulletMover animator allows  negative values for the case
        // when index is set to -1, so we need to check it here)
        if ( actualOffset < 0 ) {
            actualOffset = 0;
        }

        this._bulletMoverProperty.animate({
            targetValue : actualOffset,  // gravity offset
//            targetValue : offset,   // sync with mouse offset
            time: 0,
            style : anime.styles.leap
        });
    }


    // Returns  true when  index is  between 0  and this.items.length,
    // false otherwise. Note  that -1 is allowed value  for setting as
    // selectedIndex property,  but it is not considered  as a correct
    // index if using this function.
    //
    // Argument:
    // - index is a number to check whether it is a correct index
    hw.Selector.prototype._isCorrectIdx = function( index ) {
         return (
             typeof( index ) != "undefined" &&
             index < this.items.length &&
             index >= 0
         );
    }


    // Returns the value of the selected item
    hw.Selector.prototype.getValue = function() {
        return this.items[ this.selectedIndex.get() ].value;
    }


    // Adds a new item at the  'index' position or to the end (in case
    // when index is not specified or is out of range).
    //
    // Returns the newly added item (actually the Table cell).
    //
    // Arguments:
    // - label is a text which should appear as an item label
    // - value is a value assigned to the item
    // - index is a number where to place the created item
    hw.Selector.prototype.addItem = function( label, value, index ) {
        // creating the new cell inside the table
        var newCell = this._itemsTable.addCell( "100%", index );

        // making the cells occupy the whole table
        this._itemsTable.equalizeCells();

        // filling the cell with the appropriate widgets
        var newCellResource = {
            children : [
                // highlight button
                {
                    type : hw.Button,
                    // item    button    will    be    available    as
                    // someSelector.items[i].itemButton
                    name : "itemButton",
                    buttonType : this.layout.get() == "horizontal" ?
                        "highlightVertical" : "highlightHorizontal",
                    label : label || "",
                    geometry : { top:0, left:0, bottom:0, right:0 }
                }
            ]
        };
        newCell.initWithResource( newCellResource );

        // creating a label property for the cell
        newCell.label = newCell.itemButton.label;

        newCell.value = value || "";

        // adding new item to the items array
        if ( !this._isCorrectIdx( index ) ) {
            // fixing index
            index = this.items.length;
            // adding a cell area at the end
            this.items[ index ] = newCell;
        } else {
            // adding cell area to the index position
            this.items.splice( index, 0, newCell );
        }

        // each item will also has  its index property assigned to its
        // number in the  items[] array, it will be  used by animaiton
        // funciton
        newCell.index = index;

        var theSelector = this;

        // this method will select the item
        newCell._select = function() {
            theSelector.selectedIndex.set( this.index );
        }

        // creating an event that will handle mouse click
        newCell.itemButton.sigPushed.listen( newCell._select, newCell );

        // sizing the selector
        this._applyBulletGeometry();
        // updating indeces
        this._applyIndeces();

        return newCell;
    }


    // Animately moves the selector bullet to the desired item.
    //
    // Argument:
    // - itemNumber is an index of  item that should be covered by the
    //   bullet
    hw.Selector.prototype._moveBulletToItem = function( itemNumber ){
        var offset = itemNumber * this._bulletSize;
        // offset of a bullet when it should be hidden (index is -1)
        var offsetHidden = - this._bulletSize;
        // It may  happen that the  right corner cannot be  reached by
        // the bullet so here is a special workaround
        if ( itemNumber == this.items.length - 1 ) {
            var geom = this.simpleGeometry.get();
            offset =
                this.layout.get() == "horizontal" ? geom.width : geom.height -
                this._bulletSize;
        }
        // select animation type
        if ( itemNumber == -1 ) {
            // hiding the selector away
            offset = offsetHidden; // may differ
            this._bulletMoverProperty.animate( {
                targetValue : offset,
                time : 150,
                style : anime.styles.cspline,
                styleArgs : {
                    type : "end" // flying away
                }
            } );
        } else if (
            // current value
            ( this.layout.get() == "horizontal" ?
              this._bulletFrame.geometry.get().left :
              this._bulletFrame.geometry.get().top ) ==
            offsetHidden ) {
            // showing the selector from the hidden position
            this._bulletMoverProperty.animate( {
                targetValue : offset,
                time : 150,
                style : anime.styles.cspline,
                styleArgs : {
                    type : "start" // flying-in from away
                }
            } );
        } else {
            // ordinary animation,  moving the selector  from one item
            // to another
            this._bulletMoverProperty.animate( {
                targetValue : offset,
                time : 200,
                style : anime.styles.fspline
            } );
        }
    }


    // Animator function which performs bullet animation.
    //
    // Argument:
    // - val is a  selector bullet offset in pixels  measured from the
    //   top in case  of vertical layout and from the  left in case of
    //   horizontal one
    hw.Selector.prototype._bulletMover = function( val ) {
        if ( this.layout.get() == "horizontal" ) {
            // bullet should not exceed selector
            val = Math.crop( val, -this._bulletSize, this.simpleGeometry.get().width - this._bulletSize );
            this._bulletFrame.geometry.set({
                left : Math.round( val )
            });
        } else {
            val = Math.crop( val, -this._bulletSize, this.simpleGeometry.get().height - this._bulletSize );
            this._bulletFrame.geometry.set({
                top : Math.round( val )
            });
        }

    }


    // Updates  actual bullet  representation geometry  and  also some
    // attributes  used   by  _bulletMover()  method.   Subscribed  to
    // simpleGeometry change and also called by _applyLayout() method
    hw.Selector.prototype._applyBulletGeometry = function() {
        var geom = this.simpleGeometry.get();
        var size = (this.layout.get() == "horizontal") ? geom.width : geom.height;
        this._bulletSize = Math.round( (this.items.length > 0) ? size / this.items.length : 0 );
        this._bulletSize_2 = this._bulletSize / 2;
        var offset = this.selectedIndex.get() * this._bulletSize;
        // It may  happen that the  right corner cannot be  reached by
        // the bullet so here is a special workaround
        if ( this.selectedIndex.get() == this.items.length - 1 ) {
            var geom = this.simpleGeometry.get();
            offset =
                this.layout.get() == "horizontal" ? geom.width : geom.height -
                this._bulletSize;
        }

        // updating  bullet  geometry  (offset  will  be  assigned  in
        // _bulletMover() method)
        if ( this.layout.get() == "horizontal" ) {
            this._bulletFrame.geometry.set( {
                top : 0,
                width : this._bulletSize,
                height : "100%"
            } );
        } else {
            this._bulletFrame.geometry.set( {
                left : 0,
                width : "100%",
                height : this._bulletSize
            } );
        }

        // Updating  animation  property  value,  this will  move  the
        // bullet  to  the  new  position  corresponding  to  the  new
        // geometry/layout.  Here  we  dont  call  _moveBulletToItem()
        // since its  animation time is  not zero, but when  layout is
        // updated we  wish to  move the selector  to the  new correct
        // position instantly.
        this._bulletMoverProperty.animate({
            targetValue : offset,
            time : 0,
            style : anime.styles.leap
        });

    }


    // Moves  the  selector to  the  correct  position. Subscribed  to
    // this.selectedIndex.sigChanged signal.
    hw.Selector.prototype._applySelectedIndex = function() {
        this._moveBulletToItem( this.selectedIndex.get() );
    }


    // Performs   layout  update   applying  layout   change   to  the
    // screen. Subscribed to this.layout.sigChanged signal.
    hw.Selector.prototype._applyLayout = function() {
        var layout = this.layout.get();
        // updating table layout
        this._itemsTable.layout.set( layout );
        // updating bullet highlight
        this.bullet.buttonType.set(
            layout == "vertical" ?
                "highlightHorizontal" :
                "highlightVertical" );
        // updating items highlight
        for ( var i = 0; i < this.items.length; i++ ) {
            this.items[ i ].itemButton.buttonType.set(
                layout == "vertical" ?
                    "highlightHorizontal" :
                    "highlightVertical"
            );
        }

        // updating  bullet geometry  since it  has changed  after the
        // layout change
        this._applyBulletGeometry();
    }


    // Updates items  index, called by  all function which  change the
    // items order.
    hw.Selector.prototype._applyIndeces = function() {
        for ( var i = 0; i < this.items.length; i++ ) {
            this.items[ i ].index = i;
        }
    }


    // Removes a given item from  the selector and moves the bullet to
    // the previous item in case  when removed item is selected and is
    // not the  first item  (with index 0).  If selector has  only one
    // item, it will never be removed.
    //
    // Argument:
    // - index is an item nubmer to remove
    hw.Selector.prototype.removeItem = function( index ) {
        if ( this._isCorrectIdx( index ) &&
             this.items.length != 0  // we cant remove the only element
           ) {
            // removing the item from the this.items[] array
            this.items.splice( index, 1 );
            // removing the cell from the table
            this._itemsTable.removeCell( index );
            // making the cells occupy the whole table
            this._itemsTable.equalizeCells();
            // updating indeces
            this._applyIndeces();

            // changing index  when selected  item index is  more then
            // removed item index (to make it mark the same item)
            if ( selected > index ) {
                this.selectedIndex.set( this.selectedIndex.get()-1 );
            }
            // removing selector in case when removed item is selected
            if ( selected == index ) {
                this.selectedIndex.set( -1 );
            }

            // update bullet
            this._applyBulletGeometry();
        } // otherwise specified index is not correct, doing nothing
    }


    // Switches  two cells  vice versa.  If one  of switched  items is
    // selected, it will  be selected after the switch,  so the bullet
    // will move along with an item.
    //
    // Arguments:
    // - index1 and index2 are numbers of items to swtich
    hw.Selector.prototype.switchItems = function( index1, index2 ) {
        // checking for correct input
        if ( this._isCorrectIdx( index1 ) &&
             this._isCorrectIdx( index2 ) &&
             index1 != index2 ) {
            // switching items
            this._doSwitchItems( index1, index2 );
            // switching table cells
            this._itemsTable.switchCells( index1, index2 );
            // updating indeces
            this._applyIndeces();
            // update bullet
            this._applyBulletGeometry();
        }
    }


    // Moves item to  the new position. If moved  cell is selected, it
    // will  stay selected  after the  move, so  the bullet  will move
    // along with an item.
    //
    // Arguments:
    // - indexFrom is a number of item to move
    // - indexTo is a new index where to move an item
    hw.Selector.prototype.moveItem = function( indexFrom, indexTo ) {
        // checking for correct input
        if ( this._isCorrectIdx( indexFrom ) &&
             this._isCorrectIdx( indexTo ) &&
             indexFrom != indexTo ) {
            // check if we need to add or substract an index
            var inc = ( indexFrom < indexTo ) ? 1 : -1;
            // switching all needed items
            for ( var i = indexFrom; i != indexTo; i += inc ) {
                this._doSwitchItems( i, i + inc );
            }
            // moving table cells
            this._itemsTable.moveCell( indexFrom, indexTo );
            // updating indeces
            this._applyIndeces();
            // update bullet
            this._applyBulletGeometry();
        }
    }


    // Actually switches  the two items located on  index1 and index2,
    // but does not changes the _itemsTable.
    //
    // Used by switchItems() and moveItem() methods.
    //
    // Arguments:
    //  - index1 is a number of a first item to switch
    //  - index2 is a number of a second item to switch
    hw.Selector.prototype._doSwitchItems = function( index1, index2 ) {
        if ( this._isCorrectIdx( index1 ) &&
             this._isCorrectIdx( index2 ) &&
             index1 != index2 ) {
            // caclulating new selected index if needed
            var currentSelected = this.selectedIndex.get();
            var newSelected = currentSelected;
            if ( currentSelected == index1 ) {
                newSelected = index2;
            } else if ( currentSelected == index2 ) {
                newSelected = index1;
            }
            // switching items
            var tmpItem = this.items[ index1 ];
            this.items[ index1 ] = this.items[ index2 ];
            this.items[ index2 ] = tmpItem;
            // assigning new selected  index
            this.selectedIndex.set( newSelected );
        }
    }


}


