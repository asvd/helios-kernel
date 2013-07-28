/*********************************************************************

  cspline.js

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

     Defines  anime.styles.cspline() function which  calculates smooth
     third-degree polynomial animation. This  type of animation can be
     of two different types (defined by "type" style argument).

                                       ^                        
     When type is set  to  "start",    | _ _ _ _ _ _ _ _        
     generated   function  smoothly    | target          ...''''''''' 
     connects  with  the  following    | value        .''       
     animation (or smoothly stops):    |            .'              ' 
                                       |          .'                ' 
     This  type   of  animation  is    |        .'                  ' 
     proposed to be used as a first    |       .'                   ' 
     animation in a sequence, or in    |      :                     ' 
     case   when  some   object  is    |     :                      ' 
     flying-in     from    somwhere    |    :                       ' 
     (probably,   outside   of  the    |   :                        ' 
     screen).                          |  :                         ' 
                                         .'                         ' 
                                        .'                          ' 
                                        :                           ' 
                            init value :  --------------------------->
                                       first frame         last frame 

     ^                         
     | _ _ _ _ _ _ _ _ _ _ _ _ _ _      When animation  type is set to
     | target value              .'     "end",    generated   function
     |                           :'     behaves  in  opposite way:  it
     |                          : '     smothly   connects   with  the
     |                         .' '     preceeding animation, if there
     |                        .'  '     is one  (otherwise it smoothly
     |                       .'   '     starts),   and  finally  comes
     |                       :    '     into the desired value.       
     |                     .'     '                                   
     |                    .'      '     This  type   of  animation  is
     |                   .'       '     proposed  to be used  when you
     |                 .'         '     need to  finish some animation
     |                .'          '     sequence  and/or  finally hide
     | init        .''            '     the  object  somwhere  outside
     | value    ..'               '     the screen.                   
      ......''''    ---------------> 
         first frame         last frame

     Notice that free  tail of the generated function  (which is start
     tail in  case of  "start" animation type  and end tail  for "end"
     type),  is generated from  the given  boundary conditions  on the
     opposite  tail. Thus the  animation will  look like  the animated
     object should probably continue its movement after animation, but
     it is proposed to be already hidden for the user. That means that
     cspline animation will probably  be suitable for some object that
     flies away  and flies from  somwhere (from outside the  screen or
     some  visible area).   If you  need to  create an  animation that
     should simply move that object to some new position and then stop
     it,  you should  better use  fspline animation  style  which will
     smoothly stop the animated object.


 __Style arguments:___________________________________________________

 preserveTangent (true)  - should frames num depend on prev. animation
 preserveSlower (false)    - preserve tangent in case of slower result
 type ("start") ("start" or "end") defines animation type (read above)
 smoothTail (true)               - smooth the "opposite" function tail
 autoSmoothBothTails ("true")       - switches to fspline if necessary
  

 __Objects declared:__________________________________________________

 anime.styles.cspline()                  - calculates spline animation


 __TODO:______________________________________________________________

 Probably remove parabola calculations into a separate library.


*********************************************************************/


include( "styles.js" );

include( "../../math/Matrix.js" );
include( "../../math/Vector.js" );
include( "fspline.js" );

init = function() {

    // Calculates cspline animation.
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
    //     - type defines  the type of the  generated spline, possible
    //       values are:
    //       - "start" (default)  means that generated  spline will be
    //         smoothly connected with  the pending animation, and its
    //         start  derivatives   will  be  calculated   from  these
    //         conditions, this  type of  animation is proposed  to be
    //         useful  in case  when  it  should be  a  start of  some
    //         animation sequence
    //       - "end"  means  that generated  spline  will be  smoothly
    //         connected  with  the previous  animation,  and its  end
    //         derivatives will  be calculated from  these conditions,
    //         this type of animation is proposed to be useful in case
    //         when it should be an end of some animation sequence
    //     - smoothTail  (true)  will  make  a generated  function  to
    //       smoothly  connect  with the  next  (if type=="start")  or
    //       previous (if  type=="end") animation
    //     - autoSmoothBothTails  (true) will automatically  switch to
    //       fspline in case when  generated animation type is "start"
    //       but  there is  some animation  running (which  means that
    //       most likely both tails should be smoothed)
    //  - prop is an object which tracks the animation
    // 
    anime.styles.cspline = function( startValue,
                                     targetValue,
                                     framesNum,
                                     styleArgs,
                                     prop ) {
        var i, j;
        
        // setting the style arguments
        var preserveTangent = true;
        var preserveSlower = false;
        var type = "start";
        var smoothTail = true;
        var autoSmoothBothTails = true;

        if ( typeof ( styleArgs ) != "undefined" &&
             styleArgs != null ) {
            if ( typeof ( styleArgs.preserveTangent ) != "undefined" ) {
                preserveTangent = styleArgs.preserveTangent;
            }

            if ( typeof ( styleArgs.preserveSlower ) != "undefined" ) {
                preserveSlower = styleArgs.preserveSlower;
            }

            if ( typeof ( styleArgs.type ) != "undefined" ) {
                // all values except "end" treated as "start"
                if ( styleArgs.type == "end" ) {
                    type = "end";
                }
            }

            if ( typeof ( styleArgs.smoothTail ) != "undefined" ) {
                smoothTail = styleArgs.smoothTail;
            }

            if ( typeof ( styleArgs.autoSmoothBothTails ) != "undefined" ) {
                autoSmoothBothTails = styleArgs.autoSmoothBothTails;
            }
        }

        // check if we need to use fspline() instead
        if (
            // if this feature is requested and...
            autoSmoothBothTails &&
            // ... is realy needed
            type == "start" &&
            prop._state == prop._states.animating
           ) {
            // first adapt the styleArgs
            var newStyleArgs = {
                preserveTangent : preserveTangent,
                preserveSlower : preserveSlower,
                smoothStart : true,
                smoothEnd : smoothTail
            }
            
            return anime.styles.fspline( startValue,
                                         targetValue,
                                         framesNum,
                                         newStyleArgs,
                                         prop );
        }


        // now lets go and calculate an animation

        // FIRST, calculate actual number of frames
        var actualFramesNum = framesNum;

        // number of  frames may depend on previous  animation in case
        // when  we  preserve  tangent  (this will  keep  the  average
        // animation speed)
        if (
            // tangent should be really preserved
            preserveTangent &&
            // previous animation is not finished yet
            prop._state == prop._states.animating &&
            // last frame is treated as animation is finished
            prop._frameNum < prop._frames.length - 1 &&
            // prevents division by zero
            prop._frameNum > 0
        ) {
            var oldMidSpeed =
                ( prop._frames[ prop._frameNum ] -
                  prop._frames[ 0 ] ) / prop._frameNum;
            // ignoring just started animation
            if ( Math.abs( oldMidSpeed ) > 0 ) {
                var newFramesNum =
                    Math.abs(
                        Math.round(
                            ( targetValue - startValue ) / oldMidSpeed
                        )
                    );
                // check if we really need to override the frames num
                if (
                    // preserve only for faster animation
                    newFramesNum < actualFramesNum ||
                    // or for any other in case when the flag is set
                    preserveSlower
                ) {
                    actualFramesNum = newFramesNum;
                }
            }
        }

        // finally  there should  be at  least three  frames  (this is
        // required in the calculations below for solving the system)
        if ( actualFramesNum < 3 ) {
            actualFramesNum = 3;
        }

        // now, actualFramesNum keeps the number of frames we should use


        // SECOND, caclulate the boundary conditions

        // frames will be calulated using difference tehnique, and the
        // next vars keep the initial differences
        var f0 = startValue; // value in the begining
        var f1 = 0; // first difference in the begining
        var f2 = 0; // second difference in the begining
        var f3 = 0; // third difference

        // end boundary conditions
        var b0 = targetValue; // value in the end
        var b1 = 0; // first derivative (not difference!) in the end
        var b2 = 0; // second derivative (equals second difference)

        // setting boundary conditions
        
        // smooth with the previous animation
        // simply take difference values of previous animaiton
        // (applies only for type=="end")
        if (
            // applies only to "end" cspline type
            type == "end" &&
            // do we really need to smooth tail
            smoothTail &&
            // there is unfinished animation
            prop._state == prop._states.animating &&
            // ignoring just started previous animation
            prop._frameNum > 1
        ) {

            // recalculating first difference
            f1 = prop._frames[ prop._frameNum ] -
                prop._frames[ prop._frameNum - 1 ];
            // recalculating second difference
            var f1prev = prop._frames[ prop._frameNum - 1 ] -
                prop._frames[ prop._frameNum - 2 ];
            f2 = f1 - f1prev;
        }

        // smooth with the next animation
        // (applies only for type=="start")

        // Here we talk about smoothing between current (the one to be
        // calculated) and the next  (scheduled) animation. We need to
        // calculate the  values of  first and second  derivatives (b1
        // and  b2  variables)  in  the  point  connecting  these  two
        // animations. The algorithm depends  on the type of animation
        // that will  be performed after the current  one.  If pending
        // animation  is  clever enough  (fspline,  cspline), it  will
        // smooth the connecting point before calculating frames.  But
        // we need to find out somehow the values for first and second
        // derivatives  at  the  connecting  point  before  caculating
        // current  animation.  Proposed  algorithm builds  a parabola
        // through the  three points (this animation  start point, the
        // point between this animation and  the next one, and the end
        // point of the next animation).  After that, derivatives from
        // that  parabola's middle  point  are taken.   But for  other
        // algorithms (sine, line) the values of derivatives are fixed
        // and we can simply calculate them.
        
        if ( type == "start" && smoothTail &&
             // and there is scheduled animation
             typeof ( prop._attr.nextAttr ) != "undefined" &&
             prop._attr.nextAttr != "null" ) {
            var nextAttr = prop._attr.nextAttr;
            var nextAttrFramesNum = Math.round( nextAttr.time / prop._delay );
            // checking if next frames num is not zero
            if ( nextAttrFramesNum <= 0 ) {
                nextAttrFramesNum = 1;
            }

            // first lets check if next animation is simple
            if ( typeof( anime.styles.line ) != "undefined" &&
                 nextAttr.style == anime.styles.line ) {
                // next animation is linear, we know about its tangent
                // which makes the first derivative; second derivative
                // equals 0
                var nextAnimRange = nextAttr.targetValue - targetValue;
                b1 = nextAnimRange / nextAttrFramesNum;
            } else if ( typeof( anime.styles.sine ) != "undefined" &&
                        nextAttr.style == anime.styles.sine ) {
                // next animation is sinusoidal
                // first derivative still equals 0, calculating second
                var nextAnimRange = nextAttr.targetValue - targetValue;
                var nextAnimFramesNum2 = nextAttrFramesNum * nextAttrFramesNum;
                var pi2 = Math.PI * Math.PI;
                b2 = nextAnimRange * pi2 / ( 2 * nextAnimFramesNum2 );
            } else {
                // General case
                // Calculating parabola using Gauss method

                // Calculating parabola in  frame-value space. x1 is a
                // frame from  which current animation  is started. x2
                // is a point between  current and next animations. x3
                // is a last frame  of the scheduled animation. y1, y2
                // and y3 are values at the corresponding points.
                var x1 = 0;
                var y1 = startValue;
                var x2 = actualFramesNum;
                var y2 = targetValue;
                var x3 = x2 + nextAttrFramesNum;
                var y3 = nextAttr.targetValue;
                
                // matrix representing our linear system
                var matr = new Math.Matrix(
                    [[ x1*x1, x1, 1 ],
                     [ x2*x2, x2, 1 ],
                     [ x3*x3, x3, 1 ]]
                );
                // vector of free values
                var vect = new Math.Vector( [ y1, y2, y3 ] );
                
                // solving the system
                matr.solveGauss( vect );

                // now vect keeps the coefficients of our parabola

                // first derivative in the midpoint
                // f'(x2) = 2*a*x2 + b
                b1 = 2 * vect[ 0 ] * x2 + vect[ 1 ];

                // second derivative, f''(x2) = 2*a
                b2 = 2 * vect[ 0 ];

            }

        }

        // at this point boundary conditions  are set, thus b0, b1 and
        // b2 keep the midpoint value and derivatives

        // For more detailed of an algorithm see fspline.js. Following
        // comments imply that you have read the ones about fspline.

        // "start" and "end"  types of animation differ in  the way of
        // how  do we  provide the  boundary conditions.   If  type is
        // "start", then boundary conditions  are start and end values
        // of an  animation, and  the two derivatives  at the  end. In
        // this case we have to calculate the values for f1, f2 and f3
        // from known  f0, b0,  b1 and b2,  where b*  is a value  of a
        // function   and  its   differences   in  the   end  of   the
        // animaiton. If animation  type is "end", then f0,  f1 and f2
        // are provided as  boundary conditions and all we  have to do
        // is to calculate the f3 value from known b0 which is the end
        // point of animation sequence.

        // some short variables, degrees of number of frames
        var n = actualFramesNum;
        var n2 = n * n;
        var n3 = n2 * n;

        if ( type == "start" ) {
            // in  this  case  we  have  f0,  b0,  b1  and  b2  given;
            // calculating f1, f2, f3

            f1 = (b2*n2+(b2-4*b1)*n+b2-2*b1-6*f0+6*b0)/(2*n-2);
            f2 = -(2*b2*n2+(b2-6*b1)*n-6*f0+6*b0)/(n2-n);
            f3 = (3*b2*n2-6*b1*n-6*f0+6*b0)/(n3-n);
            
        } else if ( type == "end" ) {
            // in  this  case  we  have  f0,  f1,  f2  and  b0  given;
            // calculating f3

            f3=-(3*f2*n2+(3*f2+6*f1)*n+6*f0-6*b0)/(n3+3*n2+2*n);
        }

        
        // this array will keep arrays of differences,
        // actual result will be in result[0];
        var result = new Array( 4 );

        for ( i = 0; i < 4; i++ ) {
            result[ i ] = new Array( actualFramesNum + 1 );
        }

        // filling the initial values
        result[ 0 ][ 0 ] = f0;
        result[ 1 ][ 0 ] = f1;
        result[ 2 ][ 0 ] = f2;
        result[ 3 ][ 0 ] = f3;

        // starting the caclulations
        // (filling the whole array, frame by frame)
        for( i = 0; i < actualFramesNum; i++ ) {
            // generating next frame
            result[ 3 ][ i + 1 ] = result[ 3 ][ i ];
            // going down through the differences
            for( j = 2; j >= 0; j-- ) {
                result[ j ][ i + 1 ] =
                    result[ j ][ i ] + result[ j + 1 ][ i + 1 ];
            }
        }

        // now all difference are filled

        // result[ 0 ] keeps actual values
        return result[ 0 ];

    }


}
