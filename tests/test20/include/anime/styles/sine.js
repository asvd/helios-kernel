/*********************************************************************

  sine.js

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

                                    ^ _ _ _ _ _ _ _ _ _ _ _ _ _ _     
     Defines  anime.styles.sine()   | target value               .''''
     function  which generates an   |                         .''    '
     animtaion  represented  by a   |                       .'       '
     sinusoidal curve.  Generated   |                      :         '
     curve  is  a  half  of  sine   |                    .'          '
     period.                        |                   :            '
                                    |                 .'             '
     This style should be usefull   |                .'              '
     for   creating  some  looped   |               :                '
     animations.                    |             .'                 '
                                    |            .'                  '
                                    |          .'                    '
                                    |         .'                     '
                                    |       .'                       '
                                         ..'                         '
                          init value ...'  -------------------------->
                                    first frame            last frame 

 __Style arguments:___________________________________________________

 None.


 __Objects declared:__________________________________________________

 anime.styles.sine()                 - calculates sinusoidal animation


*********************************************************************/

include( "styles.js" );

init = function() {

    // styles object keeps animation functions
    if ( typeof( anime.styles ) == "undefined" ) {
        anime.styles = {};
    }


    // Calculates sinusiodal animation.
    //
    // Arguments:
    //  - startValue is a value from where an animation starts
    //  - targetValue is a value where an animation should finish
    //  - frameNum is a proposed number of frames
    //  - styleArgs object  keeps additional style  related arguments,
    //    but there is no such for sine(), so this is ignored
    //  - prop is an object which tracks the animation
    anime.styles.sine = function( startValue,
                                  targetValue,
                                  framesNum,
                                  styleArgs,
                                  prop ) {
        var i;

        // Sinusoidal animation is always fixed
        var actualFramesNum = framesNum;

        // there  should  be  at  least one  frame
        if ( actualFramesNum <= 0 ) {
            actualFramesNum = 1;
        }

        // now, actualFramesNum keeps the number of frames we should use

        // generating sine
        var result = new Array( actualFramesNum + 1 );

        // shortcuts
        var pi_t = Math.PI / actualFramesNum;
        var b_a_2 = ( targetValue - startValue ) / 2;

        for ( i = 0; i < actualFramesNum + 1; i++ ) {
            result[ i ] = startValue + b_a_2 * ( 1-Math.cos(pi_t*i) );
        }

        // result now keeps the generated curve
        return result;

    }


}
