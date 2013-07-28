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

     Defines heliwidgets.Widget object which represents some widget on
     the screen.  Widget  keeps its parent widget in  its parent slot,
     and all  children in its children[]  array slot. There  is also a
     slot called  _widgetType which is  a string containing a  name of
     the constructor and is used to call engine routines.

     Widget  has  a  number  of  properties related  to  its  geometry
     (geometry,     simpleGeometry,      maxOffset,     offset     and
     minimalDimensions),   usability   (usability,  availability   and
     visibility)  and also  zIndex and  opacity properties  related to
     Widget representation.

     For   manipulating  widget   tree   structure,  Widget   provides
     appendChild() and  removeChild() methods. You may  first create a
     new Widget  without appending it  to parent widget,  but whenever
     you append it to some existing and created parent, the new Widget
     will be created on the  screen with all its children recursively.
     Such creation  is preformed by _create() private  method which is
     called by appendChild() if needed.  _create() method calls engine
     routines  for creating a  widget on  the screen.   Thus _create()
     method  should  be  called  from  derived  from  Widget  objects'
     _create(), in case when they redefine the method.

     Opposite to  appendChild() method is  removeChild(), and opposite
     to  creation is  _destroy()  method which  performs  what do  you
     suspect.

     Widget's   initWithResource()  method   should  be   usefull  for
     initialization  widget  with a  given  structure. This  structure
     format  is described separately  in the  manual.  It  may contain
     widget's Properties  and init values and also  a theme properties
     custom values.  This  structure may also contain a  list of child
     widgets, in this case they will  all be created.  You may use the
     structure to design  a custom dialog, and after  that create your
     custom widget which will  represent that dialog. Also, instead of
     calling initWithResource(), you may  provide the structure to the
     Widget constructor, and it will call this method itself.

     Usability-related properties  are instances of  js.Property. They
     are  called  availability  (with  possible  values  "enabled"  or
     "disabled"),  visibility ("visible"  or  "hidden") and  usability
     ("enabled",  "disabled"  or   "hidden").   Outter  events  should
     interract with the first two  of them, while the latter usability
     Property  is  used to  represent  actual  widget usability  which
     depends on  both visibility and  availability and also  on parent
     widget's  usability  (i.e.   if  parent's  usability  is  set  to
     "hidden" and  this widget's  visibility is "visible",  the widget
     should  be hidden  anyway, so  the usability  Property  takes the
     "hidden" value too).  Thus if you want to  change widget's state,
     you should  set() availability and  visibility properties values,
     and  whenever you  want  to  know the  actual  widget state  (for
     representing  on  the screen),  you  should  get() its  usability
     property, since Widget whoose  visibility is set to "visible" and
     availability  is set to  "enabled" may  still have  its usability
     property set to  "disabled" or even "hidden" in  case when parent
     widget is "disabled" or hidden.

     Widget's  _applyUsability()  private  method is  called  whenever
     there is  a suspicion that  usability should be updated  (in case
     when  parent  widget's   usability  changed,  or  visibility  and
     availability  Properties got  some new  values).  This  method is
     subscribed (from the constructor) to the corresponding sigChanged
     signals.

     Widget's geometry property  represents its geometry relatively to
     the  parent  widget.   More   strictly,  there  are  two  general
     properties, geometry and simpleGeometry.  First one, geometry, is
     designed  for  external  usage   and  should  be  set()  whenever
     programmer  decides to change  (or initialze)  widget's geometry.
     This  is a  hash-property, and  contains 8  fields  available for
     geometry definition,  4 for each  dimension, which are :  { left,
     center, right,  width, top, middle, bottom, height  }.  To define
     the geometry, programmer should choose any two for each dimension
     and  such  assignment  will  unambiguously  define  the  widget's
     geometry. This  property allows using different  handy values for
     defining the  geometry. Numbers are  allowed, and they  will mean
     pixels. You may also assign some string values, which may contain
     "px" suffix, which will also  mean pixels, "%" suffix, which will
     mean that current attribute should be calculated according to the
     parent's geometry, and you  may even use simple expressions, such
     as "50%-20px"  which means that  some attribute should be  set to
     50% of parent's width or height minus 20 pixels.

     When  geometry   is  set(),  simpleGeometry   property  value  is
     regenerated. It contains  more simplified geometry representation
     with only  four fields,  two for each  dimension: {  left, width,
     top,  height  },  each   containing  an  integer  number  meaning
     pixels.  This property is  used by  widget drawing  routines when
     they need to know widget's  geometry in pixels to create a widget
     on the screen.

     "width" and  "height" slots of  the geometry property  also allow
     special value  "auto", which  means that width  or height  of the
     widget will be set to the minimal number of pixels allowing it to
     fit all children widgets hosted  on this widget. Note that if you
     use "auto", only those  children will be counted, whoose geometry
     in  the corresponding  dimension  is  set in  pixels  but not  in
     percent.  Horizontal  and   vertical  dimensions  are  completely
     independent which  means that  you may use  "auto" for  width and
     some predefined value for "height" or vice versa.

     Widget's  minimalDimensions js.Property  can be  used  to spicify
     widget's minimal width and height. This property keeps as a value
     a  simple hash  with  width and  height  slots. It  is used  when
     calculating maxOffset (which will make the scrollable area always
     not less  than the one defined in  minimalDimensions, read below)
     and when  calculating width and height  of a widget  in case when
     they were set  to "auto" during the geometry  assignment (in this
     case  the actual width  and height  of the  widget will  never be
     smaller  than  the  values  defined  in  minimalDimensions,  even
     despite  it will  probably  more  than enough  to  fit all  child
     widgets).

     To calculate width and height in  case when the values are set to
     "auto",  Widget keeps a  special private  _fixedMinimals property
     which contains minimal dimensions in  the { width, height } hash,
     needed to fit all children  widgets whoose geometry is defined in
     pixels.

     There is also an offset property which value is a hash containing
     { left, top  } slots. This property sets the  same offset for all
     children  widgets hosted  on the  Widget. It  should be  used for
     scrolling  implementation, in case  when widget's  dimensions are
     not enough  to fit all  hosted children.  This property  does not
     change simpleGeometry, and should  be used by engine to represent
     the  widget,  i.e.   when  simpleGeometry.get().left  ==  10  and
     parent.offset.get().left  == 20,  engine should  create  a widget
     with its  left coordinate set to  30. This property  can take any
     unlimited values, but if  needed programmer can always know, what
     are the maximal offset needed to fit all widgets. For this reason
     there is maxOffset property which keeps a number of pixels needed
     to offset the content to  fit it all.  Note, that maxOffset keeps
     positive values, and to scroll to the top or to the left you must
     assing  some negative  values  to the  offset  property, and  the
     rightmost  border  of the  inner  content  will  be reached  when
     offset.left is set  to -maxOffset.get().left.  To track maxOffset
     there is  private _minimals property  which contains a  number of
     pixels needed to fit all child widgets. It is very similar to the
     _fixedMinimals property  described above, with  exception that it
     counts all  child widgets and  not only those whoose  geometry is
     defined in pixels.

     The getEngine()  method returns  an  engine object which  will be
     used to  render a  widget. For internal  usage, though it  may be
     usefull to find out the engine used for rendering.

     Two methods, get- and  setThemeProp() are setters and getters for
     some  theme  property.   Setter  automatically  recalculates  all
     dependent  theme properties. clearThemeProp()  is used  to remove
     custom theme  property value. setThemeProps()  sets several theme
     properties   within   a   single   call.   _regenerateThemeProp()
     calculates the new value of dependent theme properties.


 __Objects declared:__________________________________________________

 heliwidgets.Widget             - represents an element of widget-tree
 --heliwidgets.Widget public properties: -----------------------------
  parent                            - parent widget who hosts this one
  children[]                                 - hosted children widgets
  simpleGeometry     - widget's simplified geometry for representation
  geometry             - widget's full geometry as defined by the user
  minimalDimensions                - minimal widget's width and height
  maxOffset               - maximal allowed offset to fit all children
  offset                         - current offset of the child widgets
  availability                   - defines whether a widget is enabled
  visibility                     - defines whether a widget is visible
  usability                         - represents widget's actual state
  zIndex                    - js.Property, keeps z-index of the widget
  opacity                           - js.Property, keeps opacity value
  sigThemeChanged           - sent whenever theme structure is changed
 --heliwidgets.Widget private properties: ----------------------------
  _widgetType             - string, equals the widget constructor name
  _fixedMinimals   - dimensions needed to fit all pixel-sized children
  _minimals            - minimal dimensions needed to fit all children
  _theme             - keeps redefined theme properties for the widget
  _themeExpl           - mask of explicitly redefined theme properties
  _created   - flag defining whether a widget is created on the screen
 --heliwidgets.Widget public methods: --------------------------------
  appendChild()                   - adds a child widget to the current
  removeChild()              - removes a child widget from the current
  initWithResource()        - initializes widget states and subwidgets
  getEngine()         - returns an engine which should render a widget
  getThemeProp()              - returns a value of some theme property
  setThemeProp()                 - sets a value of some theme property
  setThemeProps()                      - sets several theme properties
  clearThemeProp()             - clears a value of some theme property
 --heliwidgets.Widget private methods: -------------------------------
  _create()                           - creates a widget on the screen
  _destroy()                       - destroys a widget from the screen
  _updateMinimals()        - recalculates _minimals and _fixedMinimals
  _updateMaxOffset()                          - recalculates maxOffset
  _updateGeometry()        - calculates simple geometry representation
  _applyUsability()            - checks if usability should be updated
  _initWithCustomResource()     - widget-specific resource initializer
  _regenerateThemeProp()           - recalculates theme property value


 __TODO:______________________________________________________________

 Probably add support for tab-order sequence

 Implement support of widgets' initial (default) dimensions
 (in resource)

*********************************************************************/

include( "heliwidgets.js" );
include( "_supply/geometry.js" );

include( "../js/Property.js" );
include( "../js/Signal.js" );
include( "../js/base.js" );
include( "ThemeProperty.js" );

init = function() {

    // a shorter name for better reading of this file
    var hw = heliwidgets;


    // Special setter for the geometry object, here we should do a bit
    // more than in ordinary js.Property.prototype.set() funciton. The
    // main  difference  is that  this  customized setter  regenerates
    // missing values  from old ones,  and sets other values  to null,
    // since we need to know  strictly, what attributes should be used
    // for simple representation calculations.
    //
    // Argument:
    //  - newValue is a new geometry to be assigned
    var geometrySet = function( newValue ) {
        var i;
        var props = [ "width", "left", "right", "center",
                      "height", "top", "bottom", "middle" ];
        var oldValue = js.clone( this._value );

        // clearing old geometry
        for ( i = 0; i < props.length; i++ ) {
            this._value[ props[i] ] = null;
        }

        // filling in the new values
        for ( i = 0; i < props.length; i++ ) {
            this._value[ props[i] ] = newValue[ props[i] ];
        }

        // newValue  may  contain  unfull  specification, we  need  to
        // regenerate missing values

        // checking horizontal coordinates
        props = [ "width", "left", "right", "center" ];
        var definedCounter = 0;
        for ( i = 0; i < props.length; i++ ) {
            if ( this._value[ props[ i ] ] != null ) {
                definedCounter++;
            }
        }

        if ( definedCounter < 2 ) {
            // few items specified, filling missing from old values
            for ( i = 0; i < props.length; i++ ) {
                if ( this._value[ props[i] ] == null &&
                     oldValue[ props[i] ] != null ) {
                    this._value[ props[i] ] = oldValue[ props[i] ];
                    definedCounter++;
                }
                // checking if we have enough properties
                if ( definedCounter == 2 ) {
                    break;
                }
            }
        } else if ( definedCounter > 2 ) {
            // too many items werer specified
            // moving backward through priority list
            for ( i = 3; i >=0; i-- ) {
                if ( this._value[ props[i] ] != null ) {
                    this._value[ props[i] ] = null;
                    definedCounter--;
                }
                // checking if we have enough properties
                if ( definedCounter == 2 ) {
                    break;
                }
            }

        }

        // checking vertical coordinates
        props = [ "height", "top", "bottom", "middle" ];
        definedCounter = 0;
        for ( i = 0; i < props.length; i++ ) {
            if ( this._value[ props[ i ] ] != null ) {
                definedCounter++;
            }
        }

        if ( definedCounter < 2 ) {
            // few items specified, filling missing from old values
            for ( i = 0; i < props.length; i++ ) {
                if ( this._value[ props[i] ] == null &&
                     oldValue[ props[i] ] != null ) {
                    this._value[ props[i] ] = oldValue[ props[i] ];
                    definedCounter++;
                }
                // checking if we have enough properties
                if ( definedCounter == 2 ) {
                    break;
                }
            }
        } else if ( definedCounter > 2 ) {
            // too many items werer specified
            // moving backward through priority list
            for ( i = 3; i >=0; i-- ) {
                if ( this._value[ props[i] ] != null ) {
                    this._value[ props[i] ] = null;
                    definedCounter--;
                }
                // checking if we have enough properties
                if ( definedCounter == 2 ) {
                    break;
                }
            }
        }

        // now this._value has 4 values, 2 for each dimension

        // finally, lets check if our geometry representation changed
        props = [ "width", "left", "right", "center",
                  "height", "top", "bottom", "middle" ];
        var changed = false;

        for ( i = 0; i < props.length; i++ ) {
            if ( this._value[ props[i] ] != oldValue[ props[i] ] ) {
                changed = true;
                break;
            }
        }

        if ( changed ) {
            // geometry changed, notifying subscribers
            this.sigChanged.send();
        }

    }


    // Widget constructor
    //
    // Argument:
    // - initStruc (opt.) is a resource to initialize widget with
    hw.Widget = function( initStruc ) {
        // Creating Widget object
        // parent widget
        this.parent = null;
        // keeps a list of child widgets
        this.children = new Array();
        // keeps widget's constructor  name, needed for calling engine
        // routines
        if ( typeof( this._widgetType ) == "undefined" ) {
            this._widgetType = "Widget";
        }

        // Geometry-related stuff
        // keeps simple geometry, do not set() externally
        this.simpleGeometry = new js.Property({
            left   : 0,
            width  : 150,
            top    : 0,
            height : 150
        });
        // keeps full geometry
        this.geometry = new js.Property({
            left   : 0,
            center : null,
            right  : null,
            width  : 150,

            top    : 0,
            middle : null,
            bottom : null,
            height : 150
        });
        // customizing setter
        this.geometry.set = geometrySet;
        // Updating simpleGeometry when geometry changed
        this.geometry.sigChanged.listen( this._updateGeometry, this );
        // Keeps minimal width and height for the widget. These values
        // are used during calculation of _minimals and _fixedMinimals
        // in  case when  width or  height is  set to  "auto"  for the
        // geometry property.
        this.minimalDimensions = new js.Property( { width : 0,
                                                    height : 0 } );
        // Updating minimals when minimalDimensions changed
        this.minimalDimensions.sigChanged.listen( this._updateMinimals,
                                                  this );
        // Keeps minimal  dimensions needed  to fit all  child widgets
        // whoose  geometry is  defined  in pixels.  This  is used  to
        // calculate widget dimensions when its width or height is set
        // to "auto", which should rely only to fixed-defined children
        // (excluding those whoose geometry is defined in percentage).
        this._fixedMinimals = new js.Property( { width : 0,
                                                 height : 0 } );
        // updating geometry when fixedMinimals changed
        this._fixedMinimals.sigChanged.listen( this._updateGeometry,
                                               this );
        // Keeps minimal  dimensions needed to fit  all child widgets,
        // including  those whoose geometry  is defined  in percentage
        // values.  This is  used to  calculate maximal  offset during
        // widget content scrolling
        this._minimals = new js.Property( { width : 0, height : 0 } );
        // Keeps maximal offset  allowed for scrolling widget content,
        // values  are more  than zeroes  in case  when this._minimals
        // exceed this.simpleGeometry dimensions (width and height)
        this.maxOffset = new js.Property( { left : 0, top : 0 } );
        // Updating  maxOffset  whenever  simpleGeometry or  _minimals
        // changed
        this.simpleGeometry.sigChanged.listen( this._updateMaxOffset,
                                               this );
        this._minimals.sigChanged.listen( this._updateMaxOffset,
                                          this );
        // Keeps  current  offset of  all  children  widgets. This  is
        // needed for scrolling implementation.
        this.offset = new js.Property( { left : 0, top : 0 } );

        // Setting usability-related properties
        // "enabled" or "disabled"
        this.availability = new js.Property( "enabled" ),
        // "visible" or "hidden"
        this.visibility = new js.Property( "visible" ),
        // Widget  representation  should   also  depend  on  parent's
        // visibility and  availability Properties, i.e.   if parent's
        // availability is set to  "disabled", this widget should look
        // and behave as  it is disabled too. But  it is reasonable to
        // keep  this.availability property  preserved to  restore the
        // widget's actual  state is changed to  more premissive.  For
        // this reason  there is another one Property  which is called
        // usability.   This  Property   has  three  possible  values,
        // "enabled",  "disabled" and "hidden"  and is  inherited from
        // the parent's usability Property.  Engine's drawing routines
        // should rely  on this usability Property,  while user should
        // interract with availability and visibility Properties.
        this.usability = new js.Property( "enabled" );
        // update usability if visibility or availability changed
        this.visibility.sigChanged.listen( this._applyUsability,
                                           this );
        this.availability.sigChanged.listen( this._applyUsability,
                                             this );
        // Other properties
        this.zIndex = new js.Property( 0 );
        this.opacity = new js.Property( 1 );

        // Theme-related stuff
        // sent whenever  theme changed (which usually  means that the
        // widget needs to be redrawn)
        this.sigThemeChanged = new js.Signal();
        // engine-related  set  of  properties: keeps  all  properties
        // customized   by    setThemeProp()   and   their   generated
        // dependencies; we  will take not  customized properties from
        // parent widget
        this._theme = {};
        // set of  flags for explicitly defined  (not generated) custom
        // properties,  keeps   only  the  properties   customized  by
        // setThemeProp()
        this._themeExpl = {};

        // flag, keeps true when widget is created,
        // false when destroied
        this._created = false;

        // initializing with provided structure
        if ( initStruc ) {
            this.initWithResource( initStruc );
        }

    }

    // Widget creation stuff -----------------------------------------

    // Creates   a   widget  on   the   screen,   also  calls   engine
    // implementation functions for the specific widget
    hw.Widget.prototype._create = function() {
        this._applyUsability();

        // "widget  is  created" flag  is  set  here because  parent's
        // _updateMinimals()  method called  below will  only  rely on
        // created widgets
        this._created = true;

        // Updating parent's  minimals since  there's a new  child. We
        // need  it  before the  widget  is  actually created  because
        // _updateGeometry()  will rely on  parent's minimals  in some
        // cases
        this.parent._updateMinimals();

        // Updating geometry  before the widget is  created to prevent
        // widget  redraw  in   case  when  dimensions  changed  after
        // geometry setting
        this._updateGeometry();

        // Calling  engine  creation routines  which  will create  the
        // widget on the screen
        this.getEngine()[ this._widgetType ].create.call( this );

        // recursively creating children
        for ( var i = 0; i < this.children.length; i++ ) {
            this.children[ i ]._create();
        }

    }


    // Destroies a widget from  the screen, Widget's descedants should
    // also  call  engine implementation  functions  for the  specific
    // widget
    hw.Widget.prototype._destroy = function() {
        // recursively destroying children
        for ( var i = 0; i < this.children.length; i++ ) {
            this.children[ i ]._destroy();
        }

        // widget is destroied
        this._created = false;

        // parent's  minimals should be  probably recalculated  due to
        // child destruction
        this.parent._updateMinimals();

        // calling engine destruction routines
        this.getEngine()[ this._widgetType ].destroy.call( this );

    }


    // Widget tree stuff ---------------------------------------------

    // Adds a child  Widget to the children array.  Note, that a child
    // may be appended at the moment when this widget (parent of a new
    // child) is not yet created. This gives some idea about what code
    // should  be  located  in  appendChild() and  what  in  _create()
    // functions.  Same   applies  to  removeChild()   and  _destroy()
    // methods.
    //
    // Argument:
    //  - newChild is a widget to be added as a child
    hw.Widget.prototype.appendChild = function( newChild ) {
        // adding new child to the array
        this.children.push( newChild );

        // setting its parent
        newChild.parent = this;

        // attaching signals

        // usability handling
        this.usability.sigChanged.listen( newChild._applyUsability,
                                          newChild );

        // theme handling
        this.sigThemeChanged.listen( newChild.sigThemeChanged.send,
                                     newChild.sigThemeChanged );

        // geometry handling
        // when parent's geometry changed, recalculate our
        this.simpleGeometry.sigChanged.listen( newChild._updateGeometry,
                                               newChild );
        // when our geometry changed, recalculate parent's minimals
        newChild.simpleGeometry.sigChanged.listen( this._updateMinimals,
                                                   this );


        // checking if  we should create  a newly added widget  on the
        // screen
        if ( this._created ) {
            newChild._create();
        } // otherwise it will be created by this._create()

    }


    // Removes  a  child  Widget   from  the  children  array,  undoes
    // everything performed by appendChild().
    //
    // Argument:
    //  - child is a widget to be removed
    hw.Widget.prototype.removeChild = function( child ) {
        // checking if we should destroy a widget
        if ( this._created ) {
            child._destroy();
        } // otherwise child has been already destroied by this._destroy()

        // unlistening signals

        // usability handling
        this.usability.sigChanged.unlisten( child._applyUsability, child );

        // theme handling
        this.sigThemeChanged.unlisten( child.sigThemeChanged.send,
                                       child.sigThemeChanged );
        // geometry handling
        // when parent's geometry changed, recalculate our
        this.simpleGeometry.sigChanged.unlisten( child._updateGeometry,
                                                 child );
        // when our geometry changed, recalculate parent's minimals
        child.simpleGeometry.sigChanged.unlisten( this._updateMinimals,
                                                  this );
        // unsetting child's parent
        child.parent = null;

        // removing child from the array
        for ( var i = 0; i < this.children.length; i++ ) {
            if ( child == this.children[ i ] ) {
                this.children.splice( i, 1 );
                break;
            }
        }

    }


    // Geometry stuff ------------------------------------------------

    // Recalculates _minimals and _fixedMinimals.  Update is performed
    // whenever  some  of  child's  simple geometry  changed  or  when
    // minimalDimensions  property changed.  Subscription  to children
    // geometry is performed  by appendChild() method. Subscription to
    // minimalDimensions  is  performed   in  the  Widget  constructor
    // function.
    hw.Widget.prototype._updateMinimals = function() {
        var countChild, childGeom, childSimpleGeom;
        var i, j;
        // will contain the result
        var newFixedMinimals = js.clone( this.minimalDimensions.get() );
        var newMinimals = js.clone( this.minimalDimensions.get() );
        // lists of attributes for horizontal and vertical dimensions
        var horizontals = [ "width", "left", "right", "center" ];
        var verticals = [ "height", "top", "bottom", "middle" ];
        var curWidth, curHeight;
        for ( i = 0; i < this.children.length; i++ ) {
            // when being under destruction,  the child may be already
            // destroied and thus its geometry should not be relied on
            if ( this.children[ i ]._created ) {

                childGeom = this.children[ i ].geometry.get();
                childSimpleGeom = this.children[ i ].simpleGeometry.get();

                // first counting for the horizontal dimension

                // for fixedMinimals,  we count only  those children whose
                // geometry is not defined as percentage
                countChild = true;

                for ( j = 0; j < horizontals.length; j++ ) {
                    if ( ("" + childGeom[ horizontals[ j ] ]).indexOf("%")!=-1 ) {
                        // found percentage, skipping child
                        countChild = false;
                        break;
                    }
                }

                // minimals
                newMinimals.width = Math.max(
                    newMinimals.width,
                    childSimpleGeom.left +
                        childSimpleGeom.width
                );

                // fixedMinimals
                if ( countChild ) {
                    curWidth = 0;
                    for ( j = 0; j < horizontals.length; j++ ) {
                        if ( childGeom[ horizontals[ j ] ] != null ) {
                            if ( horizontals[ j ] == "width" &&
                                 childGeom[ horizontals[ j ] ] == "auto" ) {
                                // for  auto width  we  rely on  generated
                                // value  which  is  based on  subchildren
                                // minimals
                                curWidth += childSimpleGeom.width;
                            } else {
                                // geometry  may contain equation,  but it
                                // does not contain percentage
                                curWidth += heliwidgets._supply.geometry.pixelize( childGeom[ horizontals[ j ] ] );
                            }
                        }
                    }
                    newFixedMinimals.width = Math.max(
                        newFixedMinimals.width,
                        curWidth
                    );
                }

                // second counting for the vertical dimension

                // for fixedMinimals,  we count only  those children whose
                // geometry is not defined as percentage
                countChild = true;

                for ( j = 0; j < verticals.length; j++ ) {
                    if ( ("" + childGeom[ verticals[ j ] ]).indexOf("%")!=-1 ) {
                        // found percentage, skipping child
                        countChild = false;
                        break;
                    }
                }

                // minimals
                newMinimals.height = Math.max(
                    newMinimals.height,
                    childSimpleGeom.top +
                        childSimpleGeom.height
                );

                // fixedMinimals
                if ( countChild ) {
                    curHeight = 0;
                    for ( j = 0; j < verticals.length; j++ ) {
                        if ( childGeom[ verticals[ j ] ] != null ) {
                            if ( verticals[ j ] == "height" &&
                                 childGeom[ verticals[ j ] ] == "auto" ) {
                                // for  auto height  we rely  on generated
                                // value  which  is  based on  subchildren
                                // minimals
                                curHeight += childSimpleGeom.height;
                            } else {
                                // geometry  may contain equation,  but it
                                // does not contain percentage
                                curHeight += heliwidgets._supply.geometry.pixelize( childGeom[ verticals[ j ] ] );
                            }
                        }
                    }
                    newFixedMinimals.height = Math.max(
                        newFixedMinimals.height,
                        curHeight
                    );
                }
            }
        }

        // assigning the new _minimals and _fixedMinimals
        this._fixedMinimals.set( newFixedMinimals );
        this._minimals.set( newMinimals );
    }

    // Updates  maxOffset  property  according  to  simpleGeometry  or
    // _minimals  properties  change. Subscripted  to  changes in  the
    // Widget constructor function.
    hw.Widget.prototype._updateMaxOffset = function() {
        var geom = this.simpleGeometry.get();
        var mins = this._minimals.get();

        var maxOffset = {
            left : Math.max( 0, mins.width - geom.width ),
            top : Math.max( 0, mins.height - geom.height )
        }

        this.maxOffset.set( maxOffset );
    }


    // Calculates  simple   geometry  values  according   to  parent's
    // geometry (in case when some percentage values are given), or to
    // children's geometry  (in case  when width or  height is  set to
    // "auto" and widget should be resized to fit all children).  This
    // method is subscripted to  geometry change, to parent's geometry
    // change and to  _fixedMinimals change.  Subscription to parent's
    // geometry   change  is   performed   by  appendChild()   method.
    // Subscriptions  to  geometry change  and  to the  _fixedMinimals
    // property change are performed by Widget constructor function.
    hw.Widget.prototype._updateGeometry = function() {
        if ( this.parent ) {
            var geom = this.geometry.get(); //full geometry as defined
            var mins = this._fixedMinimals.get();
            var parGeom = this.parent.simpleGeometry.get();

            // width and  height will  depend on resizing  policy.  In
            // case when some of these is set to auto, it should equal
            // the value from _fixedMinimals.
            var width = geom.width == "auto" ? mins.width : geom.width;
            var height = geom.height == "auto" ? mins.height : geom.height;

            // calculating simple representation
            var horizontals = hw._supply.geometry.simplify(
                geom.left,
                geom.center,
                geom.right,
                width,
                parGeom.width
            );

            // calculating simple representation
            var verticals = hw._supply.geometry.simplify(
                geom.top,
                geom.middle,
                geom.bottom,
                height,
                parGeom.height
            );

            // finally assigning the generated geometry
            this.simpleGeometry.set( {
                left : horizontals[ 0 ],
                width : horizontals[ 1 ],
                top : verticals[ 0 ],
                height : verticals[ 1 ]
            } );
        }

    }


    // Resource initialization stuff ---------------------------------

    // Allows   set  all  widget   attributes  providing   a  resource
    // structure.  Can also  be used  to create  a subtree  of widgets
    // listed in resource's children array.
    //
    // Arguments:
    // - resourceStruct contains  a structure describing  a widget
    // - rootObject (opt.)  is an object where  created widgets should
    //   be copied as a properties
    hw.Widget.prototype.initWithResource = function( resourceStruct,
                                                     rootObject ) {

        var res = resourceStruct;
        // addSubtree could be called for the first time from somwhere
        // (in  this  case, rootObject  is  this),  or recursively  by
        // itself providing rootObject argument
        var rootObj = rootObject || this;

        // Will  keep all  other non-parsable  objects. This  could be
        // some js.Property initial values  (in this case they will be
        // set()), or some custom widget initialization structures (in
        // this  case  these  structures   will  be  provided  to  the
        // _initWithCutomResource() method).
        var others = {};
        // scanning each resource entry
        for ( var entry in res ) {
            switch ( entry ) {
            // ignoring name and type, they are handled when creating a widget
            case "type" : case "name" : break;
            // setting a theme if specified
            case "theme" : this.setThemeProps( res.theme ); break;
            // setting child objects
            case "children" :
                var childType, childName, curChildStruc;
                for ( var child = 0; child < res.children.length; child++ ) {
                    curChildStruc = res.children[ child ];
                    if (typeof curChildStruc == "undefined") {continue;}
                    // creating a child widget
                    if ( curChildStruc.type ) {
                        var childWidget = new curChildStruc.type();
                        // creating a property in the rootObj if desired
                        if ( curChildStruc.name &&
                             // denies overriding existing properties
                             !rootObj[ curChildStruc.name ] ) {
                            rootObj[ curChildStruc.name ] = childWidget;
                        }
                        // feeding the whole struct to the child recursively
                        childWidget.initWithResource( curChildStruc, rootObj );
                        this.appendChild( childWidget );
                    } // otherwise user probably forgot to specify a type
                }
                // all children scanned and created
                break;
            // all other fields are treated as widget Properties
            default : others[ entry ] = res[ entry ];
            }
        }

        // now working with other not parsed objects
        for ( var item in others ) {
            // first lets see if there is a property with the name
            if ( typeof( this[ item ] ) != "undefined" &&
                 this[ item ] instanceof js.Property ) {
                // there is such property, setting it
                this[ item ].set( others[ item ] );
            } else {
                // no such property, calling custom widget initializer
                this._initWithCustomResource( item, others[ item ], rootObj );
            }
        }

    }


    // Custom widget resource initializer.  It should be redefined for
    // the widgets  which require this feature. This  method is always
    // called by initWithResource() method  when it founds a structure
    // which cannot  be parsed on  that stage. rootObject  argument is
    // thus always provided, and it could point to this object.
    //
    // Arguments:
    // - name is an identifier of a custom resource
    // - resource is a content, usually a structure
    // - rootObject  is  an  object  which should  have  some  objects
    //   initialized as its properties
    hw.Widget.prototype._initWithCustomResource = function( name,
                                                            resource,
                                                            rootObject ) {
    }


    // Widget properties stuff ---------------------------------------

    // Checks  whether a  widget  needs to  change  its usability  (it
    // depends on  Widget's visibility  and availability, and  also on
    // parent's usability).
    hw.Widget.prototype._applyUsability = function() {
        if ( this.visibility.get() == "hidden" ||
             ( this.parent != null &&
               this.parent.usability.get() == "hidden" ) ) {
            // needs to be hidden
            this.usability.set( "hidden" );
        } else if ( this.availability.get() == "disabled" ||
                    ( this.parent != null &&
                      this.parent.usability.get() == "disabled" ) ) {
            // needs to be disabled
            this.usability.set( "disabled" );
        } else {
            // needs to be visible and enabled
            this.usability.set( "enabled" );
        }
    }


    // Widget engine and theme stuff -----------------------------------

    // Returns an engine object which should render the widget.
    hw.Widget.prototype.getEngine = function() {
        if ( typeof( this.engine ) != "undefined" ) {
            // engine is defined for current widget
            return this.engine;
        } else if ( this.parent != null ) {
            // current widget has a parent, asking him about engine
            return this.parent.getEngine();
        } else if ( typeof window != 'undefined' &&
                    typeof( window.defaultHeliwidgetsEngine ) != "undefined" ) {
            // browser provides its own default heliwidgets engine
            return window.defaultHeliwidgetsEngine;
        } else {
            // fallback to default engine
            return hw.engines.helianthus;
        }
    }


    // Climbs up  through the  widget tree until  a value for  the theme
    // property is found and returns that value.
    //
    // Argument:
    //  - propName is a name of a property to search for
    hw.Widget.prototype.getThemeProp = function( propName ) {
        if ( typeof( this._theme[ propName ] ) != "undefined" ) {
            // property is defined for current widget
            return this._theme[ propName ];
        } else if ( this.parent != null ) {
            // current widget has a parent, asking him about a property
            return this.parent.getThemeProp( propName );
        } else {
            // returning default property value defined in engine
            if ( typeof( this.getEngine().themeDefaults[ propName ] ) != "undefined" ) {
                // engine has a default value for the property
                return this.getEngine().themeDefaults[ propName ];
            } else {
                // probably a property name is incorrect
                return null;
            }
        }
    }


    // Sets theme property and generates all its dependent properties
    // values.
    //
    // Arguments:
    //  - propName is a name of a property which value to change
    //  - newValue is a value to be assigned to the property
    //  - suppressSig will suppress sigThemeChanged send
    //  - suppressExpl will suppress setting of _themeExpl flag for the
    //    property   and  thus   it   will  be   regenerated  by   the
    //    _regenerateThemeProp method
    hw.Widget.prototype.setThemeProp = function( propName,
                                                 newValue,
                                                 suppressSig,
                                                 suppressExpl) {
        // checking whether there is such theme prop at all
        if ( typeof( this.getEngine().themeProperties[ propName ] ) ==
             "undefined" ) {
            // no such property, someone probably mistyped
            return;
        }

        // keeps flag defining whether anything actually changed
        var propChanged = ( typeof( this._themeExpl[ propName ] ) == "undefined" ||
                            this._theme[ propName ] != newValue );

        if ( propChanged ) {
            // we've got some change in the theme

            // assigning a new value
            this._theme[ propName ] = newValue;

            // setting the explicity defined property flag
            if ( typeof( suppressExpl ) == "undefined" ||
                 suppressExpl == false ) {
                this._themeExpl[ propName ] = true;
            }

            // theme property object from the engine theme graph
            var themeProp = this.getEngine().themeProperties[ propName ];

            // updating all dependent theme properties
            for ( var i = 0; i < themeProp.childNames.length; i++ ) {
                this._regenerateThemeProp( themeProp.childNames[ i ] );
            }

            // notifying child widgets about theme change

            // we   have   only   to  regenerate   explicitly   defined
            // properties' dependencies of a child widget
            var child, explProp, subProp; // counters
            var curChild;
            var curPropChildren;
            // for each child...
            for ( child = 0; child < this.children.length; child++ ) {
                curChild = this.children[ child ];
                // ...for each its explicitly defined property...
                for ( explProp in curChild._themeExpl ) {
                    curPropChildren = this.getEngine().themeProperties[ explProp ].children;
                    // ...for each its subproperty...
                    for ( subProp in curPropChildren ) {
                        // ...which is not set explicitly...
                        if ( typeof( curChild._themeExpl[ subProp ] ) == "undefined" ) {
                            // ...regenerating value
                            curChild._regenerateThemeProp( subProp );
                        }
                    }
                }
            }

            // finally sending a signal notifying about theme change
            if ( !suppressSig ) {
                this.sigThemeChanged.send();
            }

        } // else nothing changed and nothing to do

    }


    // Sets several theme  properties and always sends sigThemeChanged
    // signal (even in case when no theme is changed).
    //
    // Argument:
    // - themeProps is a struct keeping theme properties to set
    hw.Widget.prototype.setThemeProps = function( themeProps ) {
        for ( var i in themeProps ) {
            this.setThemeProp( i, themeProps[ i ], true );
        }

        // notifying subscribers about theme change
        this.sigThemeChanged.send();
    }


    // Clears a  property value (which  make it fall back  to default)
    // also cleans  up all  property dependences (regenerates  them if
    // they still have defined parents).
    //
    // Argument:
    //  - propName is a name of a property to clear
    hw.Widget.prototype.clearThemeProp = function( propName ) {

        var i, j;

        // theme property object from the engine theme graph
        var themeProp = this.getEngine().themeProperties[ propName ];

        // checking if property was explicitly set before
        if ( typeof( this._themeExpl[ propName ] ) != "undefined" ) {
            // property was redefined, removing it

            // removing the property itself from the mask
            this._themeExpl[ propName ] = null;
            delete this._themeExpl[ propName ];

            // this will regenerate current property and all its dependent
            // properties
            this._regenerateThemeProp( propName );

            // finally sending a signal notifying about theme change
            this.sigThemeChanged.send();

        } // else there was no such property, exit

    }


    // Recalculates property value from its dependences.
    // Used by clearThemeProp() and setThemeProp().
    //
    // Argument:
    //  - propName is a name of a property to regenerate
    hw.Widget.prototype._regenerateThemeProp = function( propName ) {
        // regenerate only in case when property was not set explicitly
        if ( typeof( this._themeExpl[ propName ] ) == "undefined" ||
             this._themeExpl[ propName ] == null ) {
            // property is not set explicitly

            var i;

            // preserving previous state
            var oldValue = null;
            var wasGenerated = false;
            if ( typeof( this._theme[ propName ] ) != "undefined" ) {
                oldValue = this._theme[ propName ];
                wasGenerated = true;
            }

            var themeProp = this.getEngine().themeProperties[ propName ];
            // checking  if some of  property's parents  are redefined
            // for the current widget
            var parentsRedefined = false;
            for ( i = 0; i < themeProp.parentNames.length; i++ ) {
                if ( typeof( this._theme[ themeProp.parentNames[ i ] ] ) != "undefined" ) {
                    // found redefined parent
                    parentsRedefined = true;
                    break;
                }
            }

            // checking if we really need to regenerate property value
            if ( parentsRedefined ) {
                // collect a values of dependent property values
                var parentValues = {};
                var curParName;
                for ( i = 0; i < themeProp.parentNames.length; i++ ) {
                    // one of the parents
                    curParName = themeProp.parentNames[ i ];
                    // adding a parent theme property value taken from the current widget
                    parentValues[ curParName ] = this.getThemeProp( curParName );
                }

                // assigning generated value
                this._theme[ propName ] = themeProp.generate( parentValues );

            } else {
                // no redefined parents, we must clear the property
                this._theme[ propName ] = null;
                delete this._theme[ propName ];
            }

            // now lets check if something changed
            if (// property was removed
                ( wasGenerated == true &&
                  typeof( this._theme[ propName ] ) == "undefined" ) ||
                // property value changed
                ( wasGenerated == true &&
                  this._theme[ propName ] != oldValue ) ||
                // property has been just generated
                ( wasGenerated == false &&
                  typeof( this._theme[ propName ] ) != "undefined" ) ) {
                // something  really   changed,  calling  regeneration
                // recursively   for   each   dependent   non-explicit
                // property

                var curChildName;
                for ( var child = 0; child < this.getEngine().themeProperties[ propName ].childNames.length; child++ ) {
                    curChildName = this.getEngine().themeProperties[ propName ].childNames[ child ];
                    // regenerate only non-explicit properties
                    if ( typeof( this._themeExpl[ curChildName ] ) == "undefined" ) {
                        this._regenerateThemeProp( curChildName );
                    }
                }
            }

        } // else the property was set explicitly, do not regenerate

    }



}
