/*********************************************************************

  Vector.js

     This  file  is  part   of  Math  extentions  library  for  Helios
     JavaScript framework.

 __Copying:___________________________________________________________

     Copyright 2008, 2009 Dmitry Prokashev

     Helios is free software: you can redistribute it and/or modify it
     under the terms of the GNU General Public License as published by
     the Free Software Foundation, either version 3 of the License, or
     (at your option) any later version.

     Helios is distributed in  the hope  that it  will be  useful, but
     WITHOUT  ANY  WARRANTY;  without  even the  implied  warranty  of
     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
     General Public License for more details.

     You should have received a copy of the GNU General Public License
     along with Helios.  If not, see <http://www.gnu.org/licenses/>.


 __Description:_______________________________________________________

     Declares  Math.Vector  object  which  represents  a  mathematical
     vector. The object is  equipped with some usefull methods related
     to vector  algebra. Vector elements  can be fetched easily  as it
     was an array (myVector[i] returns i-th element of a myVector).



 __Objects declared:__________________________________________________

 Math.Vector()                       - an object representing a vector
 Math.Vector::dim                             - keeps vector dimension
 Math.Vector::getLength()          - returns vector geometrical length
 Math.Vector::scale()            - multiplies vector by a given number
 Math.Vector::switchElements()   - switches two elements in the vector
 Math.Vector::clone()     - returns new Vector, a clone of the current
 Math.Vector::add()                                 - sums two vectors
 Math.Vector::demolish()            - fills the vector with NaN values


*********************************************************************/

include( "stuff.js" );

init = function() {


    // Vector  constructor.   You may  initialize  vector either  with
    // another Math.Vector  instance, or with an array  of its values,
    // or providing  a number  of elements in  the vector.   In latter
    // case, it will be initialized with zeroes.
    // 
    // Arguments:
    // - initVal is an array that should initialize vector
    //   (or a vector dimension, or another Math.Vector instance)
    Math.Vector = function( initVal ) {
        var i;
        if ( initVal instanceof Math.Vector ) {
            // initVal is a prototype vector for initialization
            this.dim = initVal.dim;
            for ( i = 0; i < initVal.dim; i++ ) {
                this[ i ] = initVal[ i ];
            }
        } else if ( initVal instanceof Array ) {
            // initVal is an array for vector initialization
            this.dim = initVal.length;
            for ( i = 0; i < initVal.length; i++ ) {
                this[ i ] = initVal[ i ];
            }
        } else {
            // initVal is a dimension number, initializing with zeroes
            this.dim = initVal;
            for ( i = 0; i < initVal.length; i++ ) {
                this[ i ] = 0;
            }
        }
    }

    
    // Calculates and returns vector length
    Math.Vector.prototype.getLength = function() {
        // length squared
        var result2 = 0;
        for ( var i = 0; i < this.dim; i++ ) {
            result2 += Math.sqr( this[ i ] );
        }

        return Math.sqrt( result2 );
    }


    // Multiplies a vector by a given number.
    //
    // Argument:
    // - arg is a multiplier of a vector
    Math.Vector.prototype.scale = function( arg ) {
        for ( var i = 0; i < this.dim; i++ ) {
            this[ i ] *= arg;
        }
    }

    // Switches two elements in the vector.
    //
    // Arguments:
    // - first and seconds are the numbers of elements to switch
    Math.Vector.prototype.switchElements = function( first, second ) {
        var tmpVal = this[ first ];
        this[ first ] = this[ second ];
        this[ second ] = tmpVal;
    }


    // Returns a vector which is a clone of the current
    Math.Vector.prototype.clone = function() {
        // Vector constructor will perform cloning
        return new Math.Vector( this );
    }


    // Adds another vector to the current one
    //
    // Arguments:
    // - vectorToAdd will be added to the current one
    Math.Vector.prototype.add = function( vectorToAdd ) {
        for ( var i = 0; i < this.dim; i++ ) {
            this[ i ] += vectorToAdd[ i ];
        }
    }


    // Fills the vector with NaN values
    Math.Vector.prototype.demolish = function() {
        for ( var i = 0; i < this.dim; i++ ) {
            this[ i ] = NaN;
        }
    }



}
