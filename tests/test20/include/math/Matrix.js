/*********************************************************************

  Matrix.js

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

     Declares  Math.Matrix object  which represents  a two-dimensional
     matrix. The object is  equipped with some usefull methods related
     to matrix  algebra. Matrix elements  can be fetched easily  as it
     was a two-dimensional array (myMatrix[i][j] returns  j-th element
     of i-th row). Matrix  rows (fetched as myMatrix[i]) are instances
     of Math.Vector so you can perform on them all operations declared
     for the  Vector object  (e.g. you can  do myMatrix[i].scale(mult)
     which will multiply i-th row of  a matrix with a mult, or you can
     use scaleRow() instead).


 __Objects declared:__________________________________________________

 Math.Matrix()                       - an object representing a matrix
 Math.Matrix::cols         - keeps the number of columns of the matirx
 Math.Matrix::rows            - keeps the number of rows of the matirx
 Math.Matrix::addVectorToRow()      - adds given vector to desired row
 Math.Matrix::addRowMult()      - adds one (multiplied) row to another
 Math.Matrxi::switchRows()                         - switches two rows
 Math.Matrix::scaleRow()       - multiplies some row by a given number
 Math.Matrix::multiplyByVector() - multiplies the matrix by the vector
 Math.Matrix::solveGauss()       - solves a system of linear equations
 Math.Matrix::clone()     - returns new Matrix, a clone of the current
 Math.Matrix::demolish()          - fills the matrix with NaN elements


*********************************************************************/

include( "Vector.js" );

init = function() {

    // Matrix  constructor. You  may initialize  matrix either  with a
    // prototype  instance of Math.Matrix,  or with  a two-dimensional
    // array of values for the newly created matrix, or by providing a
    // dimension number  for the matrix.   In latter case,  the square
    // matrix will be created and initialized with zeroes.
    //
    // Arguments:
    // - initVal is an array that should initialize matrix
    //   (or a matrix dimension, or a sample Math.Matrix object)
    Math.Matrix = function( initVal ) {
        var i;

        if ( initVal instanceof Math.Matrix ) {
            // initVal is a Math.Matrix object for initialization
            this.rows = initVal.rows;
            this.cols = initVal.cols;
            for ( i = 0; i < initVal.rows; i++ ) {
                // initializing i-th row
                this[ i ] = new Math.Vector( initVal[ i ] );
            }
        } else if ( initVal instanceof Array ) {
            // initVal is two-dimensional array for initialization
            this.rows = initVal.length;
            this.cols = initVal[ 0 ].length;
            for ( i = 0; i < initVal.length; i++ ) {
                // initializing i-th row
                this[ i ] = new Math.Vector( initVal[ i ] );
            }
        } else {
            // initVal is a dimensions number

            // creating matrix and initializing it with zeroes
            this.rows = initVal;
            this.cols = initVal;
            for ( i = 0; i < initVal; i++ ) {
                this[ i ] = new Math.Vector( initVal );
            }
        }
    }


    // Adds given vector to the row
    //
    // Arguments:
    // - vectorToAdd is a given vector (instance of Math.Vector)
    // - rowNum is a number of a row where to add the vector
    Math.Matrix.prototype.addVectorToRow =
        function( vectorToAdd, rowNum ) {
            this[ rowNum ].add( vectorToAdd );
        }

    
    // Adds one row to another multiplied by a number
    //
    // Arguments:
    // - rowToAdd is a number of a row to add
    // - rowWhereToAdd is a number of a row where to add
    // - multiplier is a multiplier for the rowToAdd before adding
    Math.Matrix.prototype.addRowMult =
        function( rowToAdd, rowWhereToAdd, multiplier ) {
            var rowClone = this[ rowToAdd ].clone();
            rowClone.scale( multiplier );
            this.addVectorToRow( rowClone, rowWhereToAdd );
        }


    // Switches two rows
    //
    // Arguments:
    // - first and second are numbers of two rows to switch
    Math.Matrix.prototype.switchRows = function( first, second ) {
        var tmpRow = this[ first ];
        this[ first ] = this[ second ];
        this[ second ] = tmpRow;
    }


    // Multiplies row by a given number
    //
    // Arguments:
    // - rowNumber is a number of a row to multiply
    // - multiplier is a number by which a row should be multiplied
    Math.Matrix.prototype.scaleRow =
        function( rowNumber, multiplier ) {
            this[ rowNumber ].scale( multiplier );
        }


    // Multiplies matrix  with the  given vector.  Returns  new vector
    // containing a  result.
    //
    // Argument:
    // - multiplier is a vector by which a matrix should be multiplied
    Math.Matrix.prototype.multiplyByVector = function( multiplier ) {
        var i, j;
        var result = new Math.Vector( this.rows );
        
        for ( i = 0; i < this.rows; i++ ) {
            for ( j = 0; j < this.cols; j++ ) {
                result[ i ] += multiplier[ j ] * this[ i ][ j ];
            }
        }

        return result;
    }
    

// TODO fix the "free values" term and other terminology

    // Solves linear algebraic system of equations using Gauss method.
    // Modifies  the matrix  converting it  to the  identity. Modifies
    // freeValuesVector argument making it contain the system solution
    //
    // Argument:
    // - freeValuesVector is a vector containing system free values
    Math.Matrix.prototype.solveGauss = function( freeValuesVector ) {
        var i, j;
        // will keep the current multiplier
        var mult;

        // forward trace
        for ( i = 0; i < this.rows - 1; i++ ) {
            // checking if diagonal element is zero
            if ( this[ i ][ i ] == 0 ) {
                // we  need to  find another  row below  with non-zero
                // element on the i-th place
                var nonZeroFound = false;
                for( j = i+1; j < this.rows; j++ ) {
                    if ( this[ j ][ i ] != 0 ) {
                        nonZeroFound = true;
                        // switching the rows
                        this.switchRows( i, j );
                        // switching elements in the freeValuesVector
                        freeValuesVector.switchElements( i, j );
                        break;
                    }
                }

                if( !nonZeroFound ) {
                    // cant solve along
                    
                    // killing vector  and matrix to  make caller know
                    // about everything is bad

                    this.demolish();
                    freeValuesVector.demolish();

                    // interrupting everything
                    return;
                }
            }

            // zeroing all elements below [i][i]
            for ( j = i+1; j < this.rows; j++ ) {
                mult = -this[ j ][ i ] / this[ i ][ i ];
                this.addRowMult( i, j, mult );
                freeValuesVector[ j ] += freeValuesVector[ i ] * mult;
            }
        }

        // now our matrix is upper-triangular

        // backward trace
        // converting the matrix to the diagonal view
        for ( i = this.rows-1; i > 0; i-- ) {
            // dividing the row to the diagonal value
            mult = 1 / this[ i ][ i ];
            this[ i ].scale( mult );
            freeValuesVector[ i ] *= mult;
            // substracting a row from the previous rows to get zeroes
            for ( j = i-1; j >= 0; j-- ) {
                mult = - this[ j ][ i ];
                this.addRowMult( i, j, mult );
                freeValuesVector[ j ] += freeValuesVector[ i ] * mult;
            }
        }

        
        // and finally lets normalize the first row
        mult = 1 / this[ 0 ][ 0 ];
        this[ 0 ].scale( mult );
        freeValuesVector[ 0 ] *= mult;

        // now we have identity matrix and our vector keeps solutions
    }


    // Returns a Matrix which is a clone of the current
    Math.Matrix.prototype.clone = function() {
        // Matrix constructor will perform cloning
        return new Math.Matrix( this );
    }


    Math.Matrix.prototype.demolish = function() {
        for ( var i = 0; i < this.rows; i++ ) {
            this[ i ].demolish();
        }
    }

    
}
