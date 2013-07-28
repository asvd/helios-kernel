/*********************************************************************

  line.js

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

                                    ^
     Defines anime.styles.line()    |  _ _ _ _ _ _ _ _ _ _ _ _ _  
     function  which  calculates    |  target value             .'
     simple   linear   animation    |                         .' '
     which   represents  uniform    |                       .'   '
     change  of  the value  from    |                     .'     '
     the  start   value  to  the    |                   .'       '
     target one within the given    |                 .'         '
     number of frames.              |               .'           '    
                                    |             .'             '    
                                    |           .'               '    
                                    |         .'                 '    
                                    |       .'                   '    
                                    |     .'                     '    
                                    |   .'                       '    
                                      .'                         '    
                          init value ' ------------------------------>
                                     first frame            last frame


 __Style arguments:___________________________________________________

 preserveTangent (true)  - should frames num depend on prev. animation
 preserveSlower (false)    - preserve tangent in case of slower result


 __Objects declared:__________________________________________________

 anime.styles.line()                     - calculates linear animation


*********************************************************************/

include( "styles.js" );

init = function() {

    // Calculates simple linear  animation representing uniform change
    // of the value from the start  value to the target one within the
    // given number  of frames.
    //
    // Arguments:
    //  - startValue is a value from where an animation starts
    //  - targetValue is a value where an animation should finish
    //  - frameNum is a proposed number of frames
    //  - styleArgs object keeps additional style related arguments:
    //     - preserveTangent (true by default) will make a function to
    //       ignore the framesNum and  calculate them according to the
    //       previous animaiton tangent
    //     - preserveSlower (false by default) will make a function to
    //       preserve  tangent even in case when  calculated number of
    //       frames is more than proposed
    //  - prop is an object which tracks the animation
    // 
    anime.styles.line = function( startValue,
                                  targetValue,
                                  framesNum,
                                  styleArgs,
                                  prop ) {
        // FIRST, calculate actual number of frames
        var preserveTangent = true;
        var preserveSlower = false;
        if ( typeof ( styleArgs ) != "undefined" &&
             styleArgs != null ) {
            if ( typeof ( styleArgs.preserveTangent ) != "undefined" ) {
                preserveTangent = styleArgs.preserveTangent;
            }

            if ( typeof ( styleArgs.preserveSlower ) != "undefined" ) {
                preserveSlower = styleArgs.preserveSlower;
            }
        }

        var actualFramesNum = framesNum;

        if ( preserveTangent &&
             ( prop._state == prop._states.animating &&
               // last frame is treated as animation is finished
               prop._frameNum < prop._frames.length - 1 ) ) {
            var oldMidSpeed =
                ( prop._frames[ prop._frameNum ] -
                  prop._frames[ 0 ] ) / prop._frameNum;
            var newFramesNum =
                Math.abs(
                    Math.round(
                        ( targetValue - startValue ) / oldMidSpeed
                    )
                );
            if ( ( newFramesNum < actualFramesNum ) || preserveSlower ) {
                actualFramesNum = newFramesNum;
            }
        }

        // now, actualFramesNum keeps the number of frames we should use

        // SECOND, caclulate the animation frames
        var result = new Array( actualFramesNum + 1 );

        // value difference between two frames
        var diff =
            ( targetValue - startValue ) / actualFramesNum;

        result[ 0 ] = startValue;
        result[ actualFramesNum ] = targetValue;

        for ( var i = 1; i < actualFramesNum; i++ ) {
            result[ i ] = result[ i - 1 ] + diff;
        }

        return result;
        
    }


}
