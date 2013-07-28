/*********************************************************************

  leap.js

  This file is part of Anime library for Helios framework.

 __Copying:___________________________________________________________

     Copyright 2008, 2009 Dmitry Prokashev

     Anime is free software: you  can redistribute it and/or modify it
     under the terms of the GNU General Public License as published by
     the Free Software Foundation, either version 3 of the License, or
     (at your option) any later version.

     Anime  is distributed in  the hope  that it  will be  useful, but
     WITHOUT  ANY  WARRANTY;  without  even the  implied  warranty  of
     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
     General Public License for more details.

     You should have received a copy of the GNU General Public License
     along with Anime.  If not, see <http://www.gnu.org/licenses/>.


 __Description:_______________________________________________________

     Defines  anime.styles.leap()  function  which calculates  trivial
     animation, simple jump to the new value in a single frame.


 __Objects declared:__________________________________________________

 anime.styles.leap()               - calculates trivial jump animation


*********************************************************************/

include( "styles.js" );

init = function() {

    // Calculates trivial  animation which represents  an instant leap
    // to the  desired targetValue.  Ignores all arguments  except the
    // first.
    //
    // Arguments:
    //  - startValue is a value from where a leap should start
    //  - targetValue is a desired value where to leap
    anime.styles.leap = function( startValue, targetValue ) {
        return [ startValue, targetValue ];
    }


    
}
