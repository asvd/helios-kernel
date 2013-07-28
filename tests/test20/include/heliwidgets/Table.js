/*********************************************************************

  Table.js

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

     Defines heliwidgets.Table  widget which can be used  to create an
     arranged set  of widgets  (table cells). Table  functionallity is
     not like an ordinary HTML table. Actually, heliwidgets Table is a
     single-diemnsional list of cells of a given size. These cells can
     have vertical  or horizontal orientation which is  defined by the
     layout Property.  Its default value is "horizontal" (and the only
     alternative possible value is obviously "vertical"). Table widget
     provides a  set of usefull  methods for managing the  cells order
     and size.

     Table  widget stores  its cells  in  the cells[]  array which  is
     ordered according  to actual cell order. Table  also manages cell
     geometry  which is  stored in  _cellSizes[] array,  each  item of
     which keeps  a size of a  corresponding cell which  can be either
     percent  or pixel  value.  In  case when  percent value  is used,
     cells'  sizes  are  distributed  between  all  percentaged  cells
     proportionnaly to their size  given in percents.  For this reason
     the summ of percents of  all percent sized cell necessarily 100%.
     For  more   details,  see  Geometry.js  and   read  comments  for
     pixelizeArray() method  which is used by Table  widget to convert
     percentage values to the number  of pixels for a given _cellSizes
     array.


 __Objects declared:__________________________________________________

 heliwidgets.Table                                 - Table constructor
 --heliwidgets.Table public properties: ------------------------------
  layout                                   - defines table orientation
  cells[]                      - keeps an array of table cells widgets
 --heliwidgets.Table private properties: -----------------------------
  _cellSizes[]                   - keeps an array of cell sizes values
 --heliwidgets.Table public methods: ---------------------------------
  addCell()       - adds a new table cell with provided index and size
  resizeCell()    - assignes and applies to the screen a new cell size
  equalizeCells()            - sets equal percentage size to all cells
  removeCell()                        - destroys a cell from the table
  switchCells()                        - switches two items vice versa
  moveCell()                  - moves a given cell to the new position
 --heliwidgets.Table private methods: --------------------------------
  _initWithCustomResource()   - parses Table resource (a set of cells)
  _isCorrectIdx() - checks whether an argument is a correct cell index
  _doSwitchCells()                 - actually performs the cell switch
  _applyGeometries()        - applies cells sizes change to the screen

*********************************************************************/

include( "heliwidgets.js" );
include( "Widget.js" );
include( "../js/Property.js" );
include( "../js/Signal.js" );

init = function() {

    // keeps heliwidgets routines
    // a shorter name for better reading of this file
    var hw = heliwidgets;


    // Table constructor.
    //
    // Argument:
    // - initStruc is a structure to initialize widget with
    hw.Table = function( initStruc ) {
        // particular  widget  type properties  should  be created  before
        // parent  constructor is  called  (because constructor  calls
        // initWithResource() which may assing properties)

        // table layout, "horizontal" or "vertical"
        this.layout = new js.Property( "horizontal" );

        // keeps an array of cells
        this.cells = new Array();

        // keeps cells' sizes
        // used by _applyGeometries()
        this._cellSizes = new Array();

        // calling parent constructor
        hw.Widget.call( this, initStruc );

        // connecting events to signals
        this.simpleGeometry.sigChanged.listen( this._applyGeometries, this );
        this.layout.sigChanged.listen( this._applyGeometries, this );
    }
    hw.Table.prototype = new hw.Widget();


    // Custom resource initializer. Parses a set of cells resource.
    //
    // Arguments:
    // - name should equal "cells" for Table
    // - resource is an array of cells
    // - rootObject  is  an  object  which should  have  some  objects
    //   initialized as its properties
    hw.Table.prototype._initWithCustomResource = function( name,
                                                           resource,
                                                           rootObject ) {
        // checking the name of the resource provided
        switch ( name ) {
        case "cells" :
            // initializing array of cells
            var newCell; // currently created cell
            var size; // current cell size
            var cellName; // current cell name
            // for each cell
            for ( var cell in resource ) {
                // unsetting cellName
                cellName = null;
                // setting the size
                if ( typeof ( resource[ cell ].size ) == "undefined" ) {
                    size = "100%";
                } else {
                    size = resource[ cell ].size;
                    // removing the size from the structure to prevent
                    // discouraging cell initializer
                    resource[ cell ].size = null;
                    delete resource[ cell ].size;
                }
                // specially checking if there is a cell name provided
                if ( typeof ( resource[ cell ].name ) != "undefined" ) {
                    cellName = resource[ cell ].name;
                    // removing  name from  the  structure to  prevent
                    // discouraging cell initializer
                    resource[ cell ].name = null;
                    delete resource[ cell ].name;
                }
                // creating a cell itself
                newCell = this.addCell( size );
                // assigning to the rootObject if needed
                if ( cellName != null &&
                     // denies overriding existing properties
                     typeof( rootObject[ cellName ] ) == "undefined" ) {
                    rootObject[ cellName ] = newCell;
                }
                // recursively initializing the cell contents
                newCell.initWithResource( resource[ cell ], rootObject );
            }
            break;
        default : break; // unkown resource name, skipping
        }
    }


    // Returns  true  when index  is between 0  and this.cells.length,
    // false otherwise
    hw.Table.prototype._isCorrectIdx = function( index ) {
        return ( typeof( index ) != "undefined" &&
                 index != null &&
                 index >= 0 &&
                 index < this.cells.length );
    }


    // Adds a cell to the 'index' position or to the end (in case when
    // index is not specified, or it is out of range).
    //
    // Returns the created cell.
    //
    // Arguments:
    //  - size is a size of created cell in pixels or percents
    //  - index is a number where to place created cell
    //  - initStruct is an initialization structure of child widgets
    hw.Table.prototype.addCell = function( size, index, initStruct ) {
        // creating the new cell widget itself
        var newCell = new hw.Widget();
        // and adding it to the Table
        this.appendChild( newCell );
        // inserting the cell to the correct position into arrays
        if ( !this._isCorrectIdx( index ) ) {
            // fixing index
            var index = this.cells.length;
            // adding a cell area at the end
            this.cells[ index ] = newCell;
            // adding size to the sizes array
            this._cellSizes[ index ] = size || "100%";
        } else {
            // adding cell area to the index position
            this.cells.splice( index, 0, newCell );
            // addign size to the sizes array
            this._cellSizes.splice( index, 0, size || "100%" );
        }

        // updating cells' geometries
        this._applyGeometries();

        // creating children if provided
        if ( initStruct ) {
            newCell.initWithResource( initStruct );
        }
        
        // returning the crreated cell
        return newCell;
    }


    // Resizes cell number 'index' to the newSize
    //
    // Arguments:
    //  - index is a number of cell to be resized
    //  - newSize is a size to assign to that cell
    hw.Table.prototype.resizeCell = function( index, newSize ) {
        if ( this._isCorrectIdx( index ) ) {
            this._cellSizes[ index ] = newSize;
            this._applyGeometries();
        } // else index is outside
    }


    // Sets sizes of all cells to equal percentage values
    hw.Table.prototype.equalizeCells = function() {
        var cellSize = 100 / this.cells.length;
        var lastCellSize = 100 - ( cellSize * (this.cells.length - 1));
        for ( var i = 0; i < this.cells.length - 1; i++ ) {
            this._cellSizes[ i ] = "" + cellSize + "%";
        }

        this._cellSizes[ i ] = "" + lastCellSize + "%";

        this._applyGeometries();
    }


    // Removes cell with given index
    //
    // Argument:
    //  - index is a number of a cell to be removed
    hw.Table.prototype.removeCell = function( index ) {
        if ( this._isCorrectIdx( index ) ) {
            // removing the cell and all its subwidgets
            this.removeChild( this.cells[ index ] );
            // removing the cell from the array
            this.cells.splice( index, 1 );
            // removing cell size from the _cellSizes
            this._cellSizes.splice( index, 1 );
            // finally update other cell's geometries
            this._applyGeometries();
        } // else index is outside
    }


    // Switches cells located on index1 and index2
    //
    // Arguments:
    //  - index1 is a number of a first cell to switch
    //  - index2 is a number of a second cell to switch
    hw.Table.prototype.switchCells = function( index1, index2 ) {
        // switching the cells
        if ( this._doSwitchCells( index1, index2 ) ) {
            this._applyGeometries();
        }
    }


    // Moves cell located on 'index1' to the place numbered 'index2'
    //
    // Arguments:
    //  - indexFrom is a number of a cell to move
    //  - indexTo is a destination number where to move the cell
    hw.Table.prototype.moveCell = function( indexFrom, indexTo ) {
        // normalizing indeces
        if ( indexFrom >= this.cells.length ) {
            indexFrom = this.cells.length - 1;
        }
        if ( indexTo >= this.cells.length ) {
            indexTo = this.cells.length - 1;
        }

        // applying changes
        if ( indexFrom != indexTo ) {
            // do we need to add or substract an index?
            var inc = ( indexFrom < indexTo ) ? 1 : -1;

            for ( var i = indexFrom; i != indexTo; i += inc ) {
                this._doSwitchCells( i, i + inc );
            }

            this._applyGeometries();
        }
    }


    // Actually switches  the cells located on index1  and index2, but
    // don't performs update of the geometry.
    //
    // Returns boolean flag whether cells were actually switched.
    //
    // Used by switchCells() and moveCell() methods.
    //
    // Arguments:
    //  - index1 is a number of a first cell to switch
    //  - index2 is a number of a second cell to switch
    hw.Table.prototype._doSwitchCells = function( index1, index2 ) {
        // normalizing indeces
        if ( !this._isCorrectIdx( index1 ) ) {
            index1 = this.cells.length - 1;
        }
        if ( !this._isCorrectIdx( index2 ) ) {
            index2 = this.cells.length - 1;
        }

        // applying changes
        if ( index1 != index2 ) {
            // switching cells
            var tmpCell = this.cells[ index1 ];
            this.cells[ index1 ] = this.cells[ index2 ];
            this.cells[ index2 ] = tmpCell;
            // switching sizes
            var tmpSize = this._cellSizes[ index1 ];
            this._cellSizes[ index1 ] = this._cellSizes[ index2 ];
            this._cellSizes[ index2 ] = tmpSize;

            return true;
        } else {
            // no need to switch, indeces are equal
            return false;
        }
    }
    

    // Converts  this._cellSizes  to actual  cells'  sizes  in pxs  and
    // assignes these values to the cell widgets' geometry states.
    hw.Table.prototype._applyGeometries = function() {
        // algorithm for  both layouts  is the same,  we just  need to
        // redefine some terms

        if ( this.layout.get() == "horizontal" ) {
            var start = "left";
            var size = "width";
            var otherstart = "top";
            var otherend = "bottom";
        } else {
            var start = "top";
            var size = "height";
            var otherstart = "left";
            var otherend = "right";
        }

        // current offset of the cell
        var currentStart = "0px";
        // current cell geometry
        var currentGeom = {};
        currentGeom[ otherstart ] = 0;
        currentGeom[ otherend ] = 0;
        var currentSize;
        // disallow percentages for auto size since we do not know
        // table size until we setup all cells
        var disallowPercentages = ( this.geometry.get()[ size ] == "auto" );

        for ( var i = 0; i < this._cellSizes.length; i++ ) {
            currentSize = this._cellSizes[ i ];

            if ( disallowPercentages &&
                 currentSize instanceof String &&
                 currentSize.indexOf( "%" ) != -1 ) {
                currentSize = "0px";
            }
            currentGeom[ start ] = currentStart;
            currentGeom[ size ] = currentSize;

            this.cells[ i ].geometry.set( currentGeom );

            currentStart += "+" + currentSize;
        }

    }


}
