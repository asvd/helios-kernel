/*********************************************************************

  geometry.js

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

     Defines   heliwidgets._supply.geometry   object  which   contains
     supplimentary routines  for geometry calculations  in heliwidgets
     toolkit.

     simplify() function converts a set  of full geometry values for a
     single  dimension (horizontal or  vertical) into  simple geometry
     definition containing number of pixels.


 __Objects declared:__________________________________________________

 heliwidgets._supply.geometry                   - Geometry constructor
 --heliwidgets._supply.geometry public functions: --------------------
 simplify              - converts full into simple geometry definition
// pixelizeArray      - converts an array of values into array of pixels
 pixelize       - converts common geometry value into number of pixels
 --heliwidgets._supply.geometry private functions: -------------------
 _pixelizeOne - converts single geometry element into number of pixels

*********************************************************************/

include( "_supply.js" );

init = function() {

    var geometry = heliwidgets._supply.geometry = {}

    // Simplifies  values  in one  dimension,  i.e.   converts a  full
    // geometry representation given as { left, center, right, width }
    // for horizontal dimension or { top, middle, bottom, height } for
    // vertical  where values may  contain expressions  and percentage
    // values,  to the  simple array  containing  { left, width }  for
    // horizontal or  { top, height  } for vertical  dimensions, where
    // values are integer numbers meaning pixels.
    //
    // Arguments (all except overall are given in a common way and may
    // contain expressions  with "+"  and "-" and  values with  "%" or
    // "px" or nothing):
    //  - start means left or top
    //  - middle means center or middle
    //  - end menas right or bottom
    //  - size means width or height
    //  - overall means parent's width or height (in pixels)
    //
    // Returns an array containing [ start, size ] in pixels
    geometry.simplify = function( start,
                                  middle,
                                  end,
                                  size,
                                  overall ) {

        var result=new Array(2);

        // convert all values to integer pixels
        if ( start != null ) {
            start = geometry.pixelize( start, overall );
        }
        if ( middle != null ) {
            middle = geometry.pixelize( middle, overall );
        }
        if ( end != null ) {
            end = geometry.pixelize( end, overall );
        }
        if ( size != null ) {
            // size should not be negative
            size = Math.max( 0, geometry.pixelize( size, overall ) );
        }

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
    geometry.pixelize = function( value, cto ) {

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
            pixelized += geometry._pixelizeOne( valueParts[ i ], cto );
        }

        // _pixelizeOne() returns float values
        return Math.round( pixelized );
    }


    // Converts any type of geometry value (pixels or percentage) into
    // the floating-point  number of pixels. Floating  point is needed
    // to more percisely round summs of percentage values.
    //
    // Arguments:
    //  - value is  an integer  or a string  consisting of  number and
    //    finishing with "px" or "%"
    //  - cto is a parent's size in pixels in corresponding dimension
    //
    // Returns the floating-point result in pixels.
    //
    // Examples:
    //   _pixelizeOne( 10 ) == 10
    //   _pixelizeOne( 10, whatever ) == 10
    //   _pixelizeOne( "10px", whatever ) == 10
    //   _pixelizeOne( "50%", 300 ) == 150
    //   _pixelizeOne( "50%" ) == null   // error: unknown parent size
    geometry._pixelizeOne = function( value, cto ) {

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


}
