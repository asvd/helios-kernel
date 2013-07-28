/*********************************************************************

  Geometry.js

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

     Defines heliwidgets.Geometry object which has a similar interface
     as js.Property,  but is not strictly a  Property. Geometry object
     represents  geometry  of  a  widget.   The main  feature  of  the
     Geometry is  that its setter  takes a complicated  argument which
     may  contain various  types of  geometry  definition.  Geometry's
     getter always returns a simple object which contains left, width,
     top and height properties keeping integer numbers meaning pixels.
     These values should  be used by the widget's  creating methods to
     create a widget on a screen.

     If you need  to know general geometry as it  was defined, you may
     call a special getter, getFull().  But I cannot find a reason for
     doing  this.   To find  out  what  are  various types  of  widget
     geometry definitions, read some  helios manual or comments inside
     the code.

     To  calculate percentage  geometry  definitions, Geometry  object
     needs  to know  about parent's  dimensions. When  some  widget is
     assigned  to  some  parent  widget, Geometry  objects  can  fetch
     parent's geometry property to find out the parent dimensions.

     Same  as  Property object,  Geometry  provides sigChanged  signal
     which   is  sent   whenever  full   geometry   representation  is
     changed. Besides, Geometry  also provides sigSimpleChanged signal
     which is sent whenever simple geometry representation is actually
     changed.
     
     Geometry  object also  includes pixelizeArray  function  which is
     designed  for  external  usage,  not  by  Geometry  objects.   It
     converts  an array  of  common  geometry values  to  an array  of
     pixels.   Those  values  which   contain  number  of  pixels  are
     converted  to integers and  placed in  the returned  array. Those
     values who  contain percentage values are converted  to pixels in
     the next  way: sum  of all result  pixel values should  match cto
     argument,  and  values  corresponding  to  percentage  input  are
     calculated to  be proportional to  the number of  percents given.
     Input  array values  can not  contain additive  expressions. This
     feature is used to generate cell coordinates in the Table widget.


 __Objects declared:__________________________________________________

 heliwidgets.Geometry                           - Geometry constructor
 Geometry::set()                                     - Geometry setter
 Geometry::get()       -getter, returns simple geometry representation
 Geometry::getFull()     -getter, returns full geometry representation
 Geometry::setParentGeometry()     - provides parent widget's geometry
 Geometry::generateValue()  - generates simple geometry representation
 Geometry::pixelizeArray()         - converts geometry array to pixels 


*********************************************************************/

include( "heliwidgets.js" );
include( "../js/Property.js" );
include( "../js/Signal.js" );
include( "../js/base.js" );

init = function() {

    // a shorter name for better reading of this file
    var hw = heliwidgets;


    // Geometry constructor.
    //
    hw.Geometry = function() {
	// js.Property constructor  does nothing usefull for us,  so we dont
	// call it from here
        
        // keeps simple geometry representation needed for creating  a
        // widget on the screen
        this.value = {
            left   : 0,
            width  : 30,
            top    : 0,
            height : 30
        };

        // keeps widget's full geometry representation
        this.fullGeometry = {
            left   : 0,
            center : null,
            right  : null,
            width  : 30,

            top    : 0,
            middle : null,
            bottom : null,
            height : 30
        }

	// keeps minimal widget geometry,
	// width and height will never understate theese values
	this.minimals = {
	    width  : 0,
	    height : 0
	}

	// keeps parent's geometry object
	this.parentGeometry = null;

	// sent whenever full geometry changed
	this.sigChanged = new js.Signal();
	// sent whenever actual geometry changed
	this.sigSimpleChanged = new js.Signal();
    }
    // will  make Geometry  a  descedant of  js.Property,  though all  Property
    // fields are redefined
    hw.Geometry.prototype = new js.Property();


    // Setter,  stores  new  geometry  into fullGeometry,  then  calls
    // generateValue()  method which calculates  simple representation
    // and  sends sigChanged  if the  new full  representation differs
    // from the previous one.
    //
    // Argument:
    //  - newGeometry is a common definition of a new geomtery value
    hw.Geometry.prototype.set = function( newGeometry ) {
        var i;
	var props = [ "width", "left", "right", "center",
	    "height", "top", "bottom", "middle" ];

	// backup full geometry
	var oldGeometry = js.clone( this.fullGeometry );

	// replacing fullGeometry with new values
	for ( i = 0; i < props.length; i++ ) {
	    this.fullGeometry[ props[i] ] = newGeometry[ props[i] ];
	}

	// newGeometry  may contain unfull  specification, we  need to
	// regenerate missing values

	// FIRST, checking horizontal coordinates
	props = [ "width", "left", "right", "center" ];
	var definedCounter = 0;
	for ( i = 0; i < props.length; i++ ) {
	    if ( this.fullGeometry[ props[ i ] ] != null ) {
		definedCounter++;
	    }
	}

	if ( definedCounter < 2 ) {
	    // few items specified, filling missing from old values
	    for ( i = 0; i < props.length; i++ ) {
		if ( this.fullGeometry[ props[i] ] == null &&
		     oldGeometry[ props[i] ] != null ) {
		    this.fullGeometry[ props[i] ] = oldGeometry[ props[i] ];
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
		if ( this.fullGeometry[ props[i] ] != null ) {
		    this.fullGeometry[ props[i] ] = null;
		    definedCounter--;
		}
		// checking if we have enough properties
		if ( definedCounter == 2 ) {
		    break;
		}
	    }
	    
	}
	
	// SECOND, checking vertical coordinates
	props = [ "height", "top", "bottom", "middle" ];
	definedCounter = 0;
	for ( i = 0; i < props.length; i++ ) {
	    if ( this.fullGeometry[ props[ i ] ] != null ) {
		definedCounter++;
	    }
	}

	if ( definedCounter < 2 ) {
	    // few items specified, filling missing from old values
	    for ( i = 0; i < props.length; i++ ) {
		if ( this.fullGeometry[ props[i] ] == null &&
		     oldGeometry[ props[i] ] != null ) {
		    this.fullGeometry[ props[i] ] = oldGeometry[ props[i] ];
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
		if ( this.fullGeometry[ props[i] ] != null ) {
		    this.fullGeometry[ props[i] ] = null;
		    definedCounter--;
		}
		// checking if we have enough properties
		if ( definedCounter == 2 ) {
		    break;
		}
	    }
	    
	}

	// now fullGoemetry has 4 values, 2 for each dimension

	// finally, lets check if our geometry representation changed
	props = [ "width", "left", "right", "center",
		  "height", "top", "bottom", "middle" ];
	var changed = false;

	for ( i = 0; i < props.length; i++ ) {
	    if ( this.fullGeometry[ props[i] ] != oldGeometry[ props[i] ] ) {
		changed = true;
		break;
	    }
	}

	if ( changed ) {
	    // geometry changed, notifying subscribers
            this.sigChanged.send();
	    
            // generating simple representation
	    if ( this.parentGeometry != null ) {
		this.generateValue();
	    } // cannot generate until there is no parent
	}

    }

    
    // Getter, returns a simple representation of the geometry
    hw.Geometry.prototype.get = function() {
        var result = {};

        // cloning the value object
        for ( var i in this.value ) {
            result[ i ] = this.value[ i ];
        }

        return result;
    }


    // Getter, returns a full geometry representation
    hw.Geometry.prototype.getFull = function() {
        var result = {};

        // cloning the value object
        for ( var i in this.fullGeometry ) {
            result[ i ] = this.fullGeometry[ i ];
        }

        return result;
    }


    // Assgins  a  parent's  geometry  object.  Should  be  called  by
    // Widget's _create() method.
    //
    // Argument:
    // - parentGeometry should point to a parent widget's geometry
    hw.Geometry.prototype.setParentGeometry = function( parentGeometry ) {
	this.parentGeometry = parentGeometry;
	// regenerating simple geometry representation
	if ( this.parentGeometry != null ) {
	    this.generateValue();
	}
    }

    
    // Setter  for minimal width  and height  values. Assigns  the new
    // minimals and recalculates the geometry if needed.
    //
    // Argument:
    // - minimals  keeps a  structure  with new  minimal width  and/or
    //   height values
    hw.Geometry.prototype.setMinimals = function( newMinimals ) {

	// assigning provided values
	if ( typeof ( newMinimals.width ) != "undefined" ) {
	    this.minimals.width = newMinimals.width;
	}

	if ( typeof ( newMinimals.height ) != "undefined" ) {
	    this.minimals.height = newMinimals.height;
	}

	// updating  the  geometry  (even  in case  minimals  are  not
	// understated - in this case the widget may become smaller)
	if ( this.parentGeometry != null ) {
	    this.generateValue();
	}
    }


    // Generates simple  geometry representation from  given full one.
    // Sends   sigSimpleChanged   in   case   when   simple   geometry
    // representation actually changed. May  also be called when it is
    // suspicion that parent dimensions has been changed.
    hw.Geometry.prototype.generateValue = function() {
        // checking parent dimensions
        var parentGeometry = this.parentGeometry.get();
        
        // calculating simple representation

        // vertical
        var horizontals = this._simplify(
            this.fullGeometry.left,
            this.fullGeometry.center,
            this.fullGeometry.right,
            this.fullGeometry.width,
            parentGeometry.width
        );

        // horizontal
        var verticals = this._simplify(
            this.fullGeometry.top,
            this.fullGeometry.middle,
            this.fullGeometry.bottom,
            this.fullGeometry.height,
            parentGeometry.height
        );

        // is anything actually changed?
        if ( ( this.value.left   != horizontals[ 0 ] ) ||
             ( this.value.width  != horizontals[ 1 ] ) ||
             ( this.value.top    != verticals[ 0 ]   ) ||
             ( this.value.height != verticals[ 1 ]   ) ) {
	    
	    // storing old changes for the signal
	    var oldGeom = js.clone( this.value );
	    
            // applying changes
            this.value.left   = horizontals[ 0 ];
            this.value.width  = horizontals[ 1 ];
            this.value.top    = verticals[ 0 ];
            this.value.height = verticals[ 1 ];

	    // notifying subscribers
	    this.sigSimpleChanged.send( oldGeom );
        }
    }


    
    // Simplifies values in one dimension
    //
    // Arguments (given  in a common  way and may  contain expressions
    // with "+" and "-" and values with "%" or "px"):
    //  - start means left or top
    //  - middle means center or middle
    //  - end menas right or bottom
    //  - size means width or height
    //  - minSize keeps the minimal value for size
    //  - overall means parent's width or height
    //
    // Returns an array containing [ start, size ] in pixels
    hw.Geometry.prototype._simplify = function( start,
                                                middle,
                                                end,
                                                size,
						minSize,
                                                overall ) {

        var result=new Array(2);

        // convert all values to integer pixels
        if ( start != null ) {
            start = this._pixelize( start, overall );
        }
        if ( middle != null ) {
            middle = this._pixelize( middle, overall );
        }
        if ( end != null ) {
            end = this._pixelize( end, overall );
        }
        if ( size != null ) {
            // size should not be negative
            size = Math.max( 0, this._pixelize( size, overall ) );
        }

/*
// TODO: remove this commented block if everything works fine
// THIS IS NOT NEEDED SINCE SETTER GENERATES 2 ATTRS FOR EACH DIMENSION
        // check if we have at least two attributes defined
        var definedCounter = 0;
        for ( var i=0; i<4; i++ ) {
            if ( arguments[ i ] != null) {
                definedCounter++;
            }
        }

        // if there is not enough attributes, generate it
        if ( definedCounter == 0 ) {
            // all attributes are set to null
            // assigning some random/default values
            start=0;
            size=30;
        } else if ( definedCounter == 1 ) {
            // only one attribute is set...
            if ( size == null ) {
                // ...and it is not size
                size=30;
            } else {
                // ...and it is size
                start=0;
            }
        }
        // now we have enough (>=2) attributes
*/

        // calculating simple representation
        if ( ( start != null  ) && ( size!=null ) ) {
            result[ 0 ] = start;
            result[ 1 ] = size;
        } else if ( ( end != null ) && ( size != null ) ) {
            result[ 0 ] = overall - end - size;
            result[ 1 ] = size;
        } else if ( ( middle != null ) && ( size != null ) ) {
            var parentCenter = Math.round( parseFloat( overall / 2 ) );
            var thisCenter = Math.round( parseFloat( size / 2 ) );
            result[ 0 ] = parentCenter + middle - thisCenter;
            result[ 1 ] = size;
        //next three cases for null size
        } else if ( ( start != null ) && ( end != null ) ) {
            result[ 0 ] = start;
            // size should not be negative
            result[ 1 ] = Math.max( 0, ( overall - start - end ) );
        } else if ( ( start != null ) && ( middle != null ) ) {
            var parentCenter = Math.round( parseFloat( overall / 2 ) );
            result[ 0 ] = start;
            // size should not be negative
            result[ 1 ] = Math.max( 0, 2 * ( parentCenter + middle - start ) );
        } else {
            // middle and end are not null
            var parentCenter = Math.round( parseFloat( overall / 2 ) );
            size = Math.max( 0, 2 * ( parentCenter - middle - end ) );
            result[ 0 ] = overall - end - size;
            result[ 1 ] = size;
        }

	// finally check if we have understated the minimal allowed value
	result[ 1 ] = Math.max( minSize, result[ 1 ] );

        return result;
    }

    // Converts common  geometry value into number  of pixels.  Splits
    // the additive  expression, calls _pixelizeOne for each  part and
    // returns the sum.
    //
    // Used by _simplify() method.
    //
    // Arguments:
    //  - value is a common geometry expression
    //  - cto is a number of parent's size in corresponding dimension
    hw.Geometry.prototype._pixelize = function( value, cto ) {

        // converting to string
        var val = "" + value;

        // adding + before each -
        // this will allow "10%-10px" instead of "10%+-10px"
        val = val.replace( /-/g , "+-" );

        // keeps an array of substrings divided by "+"
        var valueParts = val.split("+");

        // keeps the result
        var pixelized = 0;

        // calculating the result
        for ( var i = 0; i < valueParts.length; i++ ) {
            pixelized += this._pixelizeOne( valueParts[ i ], cto );
        }

        // _pixelizeOne() returns float values
        return Math.round( pixelized );
    }


    // Converts any type of geometry value (pixels or percentage) into
    // the floating-point number of pixels.
    //
    // TODO should it return integer values insted of float?
    //
    // Arguments:
    //  - value is  an integer  or a string  consisting of  number and
    //    finishing with "px" or "%"
    //  - cto is a parent's size in pixels in corresponding dimension
    //
    // Returns the floating-point result in pixels.
    //
    // Examples:
    //   _pixelize( 10 ) == 10
    //   _pixelize( 10, whatever ) == 10
    //   _pixelize( "10px", whatever ) == 10
    //   _pixelize( "50%", 300 ) == 150
    //   _pixelize( "50%" ) == null   // error: unknown parent size
    hw.Geometry.prototype._pixelizeOne = function( value, cto ) {

        // checking if value is empty
        if ( value == "" ) {
            return 0;
        }

        // checking the last character
        switch ( value.charAt( value.length - 1 ) ) {
        case "x" :
            // assuming that the string ends with "px"
            // just removing the "px" from the tail
            return parseFloat( value.substring( 0, value.length - 2 ) );
        case "%" :
            // the value is percentage
            if ( typeof( cto ) == "undefined" || cto == null ) {
                // cant calculate percentage with no parent size value
                return null;
            } else {
                // converting percentage to the number of pixels
                var percentage = parseFloat( value.substring( 0, value.length - 1 ) );
                return ( cto * percentage / 100 );
            }
        default:
            // assuming that the value is just a number of pixels
            return parseFloat( value );
        }
    }

    
    // (for external usage)
    // Converts  an array  of common  geometry values  to an  array of
    // values in pixels.
    //
    // Arguments:
    //  - input is  an Array of values  each of which is a number or a
    //    string consisting of number and finishing with "px" or "%"
    //  - cto is a parent's size in pixels in corresponding dimension
    hw.Geometry.prototype.pixelizeArray = function( input, cto ) {
        
        // parent dimension must be set
        if ( typeof( cto ) == "undefined" ) {
            return null;
        }

        var i;
        var result = new Array();

        // array of flags (whether value is percentage/false or pixels/true)
        var pixelMask = new Array();

        // for each size in array
        for ( i = 0; i < input.length; i++ ) {
            // converting to string
            var val = "" + input[ i ];

            // checking if value is empty
            if ( val == "" ) {
                // assuming that value is 0px
                result[ i ] = 0;
                pixelMask[ i ] = true;
            } else {
                // checking the last character
                switch ( val.charAt( val.length - 1 ) ) {
                case "x" :
                    // assuming that the string ends with "px"
                    // setting the pixel flag
                    pixelMask[ i ] = true;
                    // removing the "px" from the tail
                    result[ i ] = parseFloat( val.substring( 0, val.length - 2 ) );
                    break;
                case "%" :
                    // the value is percentage
                    // setting the percentage flag
                    pixelMask[ i ] = false;
                    // removing the "%" from the tail
                    result[ i ] = parseFloat( val.substring( 0, val.length - 1 ) );
                    break;
                default:
                    // assuming that the value is just a number of pixels
                    // setting the pixel flag
                    pixelMask[ i ] = true;
                    result[ i ] = parseFloat( val );
                }
            }
        }

        // at this point result[] contains a set of floating-point values,
        // and pixelMask[] defines whether each value is percentage or
        // a number of pixels

        // counting the total number of pixels and percents,
        // and number of percent values
        var totalPixels = 0;
        var totalPercents = 0;
        var percentValues = 0;
        for ( i = 0; i < result.length; i++ ) {
            if ( pixelMask[ i ] ) {
                // result[ i ] keeps pixels value
                totalPixels += result[ i ];
            } else {
                // result[ i ] keeps percents
                totalPercents += result[ i ];
                percentValues++;
            }
        }

        // keeps a number of pixels left for percentage fields
        var freePixels = cto - totalPixels;

        // if total number of pixels is more than cto,
        // than percentage values should be set to 0 px
        if ( freePixels <= 0 ) {
            for ( i = 0; i < result.length; i++ ) {
                if ( !pixelMask[ i ] ) {
                    result[ i ] = 0;
                    // converting mask to px
                    // (to prevent worrying the values anymore)
                    pixelMask[ i ] = true;
                }
            }
        }

        // keeps a coefficient for percentage multiplying
        var percentFactor = 100 / totalPercents;

        // converting all percentages to actual pixels
        for ( i = 0; i < result.length; i++ ) {
            // if percentage
            if ( !pixelMask[ i ] ) {
                // normalizing percentage
                var normalized = result[ i ] * percentFactor;
                // percentage string
                var perString = "" + normalized + "%";
                // actual value in pixels
                result[ i ] = hw.Geometry.prototype._pixelizeOne( perString, freePixels );
            }
        }

        // converting all values to the closest integers
        for ( i = 0; i < result.length; i++ ) {
            result[ i ] = Math.round( result[ i ] );
        }

        // counting the total number of pixels
        var newTotal = 0;
        for ( i = 0; i < result.length; i++ ) {
            newTotal += result[ i ];
        }

        // rounding probably caused change of total pixels number
        var diff = Math.round( cto ) - newTotal;
	// if yes, we need to distribute free pixels among percentages
        if ( diff != 0 ) {
            // do we have percentage values at all?
            if ( percentValues != 0 ) {
                // yes, adding pixels to each percentage value
            
                // integer number of pixels to be added to each
                // percentage value (may be negative)
                var addToEach = Math.floor( diff / percentValues );

                // adding pixels to each percentage value
                for ( i = 0; i < result.length; i++ ) {
                    if ( !pixelMask[ i ] ) {
                        result[ i ] += addToEach;
                    }
                }

                // resulting difference
                diff -= percentValues * addToEach;

                if ( diff > 0 ) {
                    // diff is less than percentValues
                    // adding pixel for first values
                    for ( i = 0; i < diff; i++ ) {
                        result[ i ]++;
                    }
                } else if ( diff < 0 ) {
                    // ( -diff ) is less than percentValues
                    // substracting pixel from the first values
                    for ( i = 0; i < -diff; i++ ) {
                        result[ i ]--;
                    }
                } // else all done
                
            } // else all values are pixels, we dont modify them
	    
        }
            
        return result;
    }


    
}
