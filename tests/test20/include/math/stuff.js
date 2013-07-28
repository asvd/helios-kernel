/*********************************************************************

  stuff.js

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

     This  file  extends Math  object  with  several usefull  features
     widely used in Helios.

 __TODO:______________________________________________________________

 Add description for Math.crop() everywhere.

 __Objects declared:__________________________________________________

 Math.sqr()                    - returens the square of a given number
 Math.crop()      - limits a given number to fit into given boundaries
 Math.max3()                    - returns the maximum of three numbers
 Math.min3()                    - returns the minimum of three numbers


*********************************************************************/


init = function() {

    // returns a square of a given number
    Math.sqr = function( arg ) {
	return arg * arg;
    }


    // forces val to be between lower and upper
    Math.crop = function( val, lower, upper ) {
	val = val < lower ? lower : val;
	val = val > upper ? upper : val;
	return val;
    }

    // returns maximum of three numbers
    Math.max3 = function( val1, val2, val3 ) {
	return Math.max( val1, Math.max( val2, val3 ) );
    }

    // returns minimum of three numbers
    Math.min3 = function( val1, val2, val3 ) {
	return Math.min( val1, Math.min( val2, val3 ) );
    }

    
    
}
