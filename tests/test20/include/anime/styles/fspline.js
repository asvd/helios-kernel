/*********************************************************************

  fspline.js

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

     Defines  anime.styles.fspline() function which  calculates smooth
     fifth-degree  spline  animation.  The  spline  tries  to  connect
     smoothly with both previous and pending animations.

                                    ^
                                    |  _ _ _ _ _ _ _ _ _ _
     If animation funciton was      |  target value          .''''
     called  when  an animated      |                      .'
     object  had  been static,      |                     :      '
     then     the    generated      |                   .'       '
     function looks like this:      |                  .'        '
                                    |                 :          '
                                    |                :           '
                                    |               :            '
                                    |              :             '
                                    |             :              '
                                    |           .'               '
                                    |          .'                '
                                    |        .'                  '
                                           .'                    '
                          init value ....''   ----------------------->
                                     first frame            last frame


     In  case when  previous animation  has not  been finished  at the
     moment when  animation is called, generated  function will depend
     on previous animation:

                                    ^
                                    |
           previous animation       |       generated animation
                                    | _ _ _ _ _ _ _ _ _ _ _ _
      '''''''..                     | target value           ..'''
               ''.                  |                      .'
                  '.                |                     :      '
                    '.              |                    :       '
                      '.            |                   :        '
                        :           |                  :         '
                         '.         |                 :          '
                          '.        |                .'          '
                            :       |               .'           '
                             '.     |               :            '
                              '.    |              :             '
                               '.   |             .'             '
                                '.  |            .'              '
                                 '. | first      :               '
                                   :| frame     :                '
                     init value --> |--------- .' ------------------->
                                    |:        .'            last frame
                                    | :      :
                                    |  '...''

 
 __Style arguments:___________________________________________________

 preserveTangent (true)  - should frames num depend on prev. animation
 preserveSlower (false)    - preserve tangent in case of slower result
 smoothStart (true)     - smoothly connect with the previous animation
 smoothEnd (true)        - smoothly connect with the pending animation


 __Objects declared:__________________________________________________

 anime.styles.fspline()                  - calculates spline animation


 __TODO:______________________________________________________________

 Probably remove parabola calculations into a separate library


*********************************************************************/

include( "styles.js" );

include( "../../math/Matrix.js" );
include( "../../math/Vector.js" );

init = function() {


    // Calculates fspline animation.
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
    //     - smoothStart  (true)  will make  a  generated function  to
    //       smoothly connect with the previous animation
    //     - smoothEnd  (true)  will  make  a  generated  function  to
    //       smoothly connect with the pending animation
    //  - prop is an object which tracks the animation
    // 
    anime.styles.fspline = function( startValue,
                                     targetValue,
                                     framesNum,
                                     styleArgs,
                                     prop ) {
        var i, j;
        
        // setting the style arguments
        var preserveTangent = true;
        var preserveSlower = false;
        var smoothStart = true;
        var smoothEnd = true;
        if ( typeof ( styleArgs ) != "undefined" &&
             styleArgs != null ) {
            if ( typeof ( styleArgs.preserveTangent ) != "undefined" ) {
                preserveTangent = styleArgs.preserveTangent;
            }

            if ( typeof ( styleArgs.preserveSlower ) != "undefined" ) {
                preserveSlower = styleArgs.preserveSlower;
            }

            if ( typeof ( styleArgs.smoothStart ) != "undefined" ) {
                smoothStart = styleArgs.smoothStart;
            }

            if ( typeof ( styleArgs.smoothEnd ) != "undefined" ) {
                smoothEnd = styleArgs.smoothEnd;
            }
        }

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
            if ( oldMidSpeed > 0 ) {
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

        // finally  there should  be  at least  five  frames (this  is
        // required in the calculations below for solving the system)
        if ( actualFramesNum < 5 ) {
            actualFramesNum = 5;
        }

        // now, actualFramesNum keeps the number of frames we should use


        // SECOND, caclulate the boundary conditions

        // frames will be calulated using difference tehnique, and the
        // next vars keep the initial differences; first three of them
        // (f0, f1 and f2) will make the start boundary conditions
        var f0 = startValue; // value in the begining
        var f1 = 0; // first difference in the begining
        var f2 = 0; // second difference in the begining
        var f3 = 0; // etc...
        var f4 = 0;
        var f5 = 0;

        // end boundary conditions
        var b0 = targetValue; // value in the end
        var b1 = 0; // first derivative (not difference!) in the end
        var b2 = 0; // second derivative (equals second difference)

        // setting boundary conditions
        
        // smooth with the previous animation
        // simply take difference values of previous animaiton
        if (
            // do we really need to smooth start tail
            smoothStart &&
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
        
        if ( smoothEnd &&
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

        // we need to calculate f3, f4 and f5 from given b0, b1 and b2

        // A set  of formulae below is  a solution of  a linear system
        // for our  problem, it was calculated with  Maxima system and
        // seems to work fine

        // Short explanation of a  problem.
        // (sory  for the  awful  comment,  have no  time to  create a
        // full-featured article on the topic)
        //
        // Since we  are using difference-based  teсhnique here, while
        // calculating a  polynomial of fifth degree, we  need to know
        // the  initial values of  a differences  in the  start point.
        // These values are f0, f1, f2, f3, f4 and f5.  First three of
        // them (f0, f1 and f2) were taken from the previous animation
        // to smoothly connect with the previous function up to second
        // derivative. Other values should be generated from the known
        // end-point boundary conditions  which are represented by b0,
        // b1 and b2.  If we  denote q-th difference in the p-th point
        // (frame) as f(p,q), then its value expressed with f0, .., f5
        // will look like this:
        //
        // f(p,q) = sum( binomial( i-q+p-1, i-q )*f(0,i) , i, q, 5 )
        //
        // (this  is a  notation of  Maxima system,  sum(  expr(i), i,
        // i_start, i_end ) means that  the given expr is summed while
        // i  runs  through  i_start  to  i_end;  and  binomial  means
        // binomial coefficient)
        //
        // Thus the equations for f3, f4 and f5 are:
        //
        // b0 = f( n, 0 );
        // b1 = ( f( n, 1 ) + f( n+1, 1 ) ) / 2;
        // b2 = f( n+1, 2 );
        //
        // where expression for f(p,q) is given above, b0, b1, b2, f0,
        // f1 and  f2 are considered known.  Solving  the system we'll
        // get the equations presented below.

        // some short variables, degrees of number of frames
        var n = actualFramesNum;
        var n2 = n * n;
        var n3 = n2 * n;
        var n4 = n3 * n;
        var n5 = n4 * n;

        f3 = -( ( 9 * f2 -
                  3 * b2 ) * n2 +
                ( -9 * f2 -
                  9 * b2 +
                  36 * f1 +
                  24 * b1 ) * n -
                18 * b2 -
                36 * f1 +
                36 * b1 +
                60 * f0 -
                60 * b0
              ) / (
                  n3 - n
              );
        
        f4 = ( ( 36 * f2 -
                 24 * b2 ) * n2 +
               ( -36 * f2 -
                 60 * b2 +
                 192 * f1 +
                 168 * b1 ) * n -
               96 * b2 -
               192 * f1 +
               192 * b1 +
               360 * f0 -
               360 * b0
             ) / (
                 n4 +
                 2 * n3 -
                 n2 -
                 2 * n
             );
        
        f5 = -( ( 60 * f2 -
                  60 * b2 ) * n2 +
                ( -60 * f2 -
                  120 * b2 +
                  360 * f1 +
                  360 * b1 ) * n -
                180 * b2 -
                360 * f1 +
                360 * b1 +
                720 * f0 -
                720 * b0
              ) / (
                  n5 +
                  5 * n4 +
                  5 * n3 -
                  5 * n2 -
                  6 * n
              );
        
        // this array will keep arrays of differences,
        // actual result will be in result[0];
        var result = new Array( 6 );

        for ( i = 0; i < 6; i++ ) {
            result[ i ] = new Array( actualFramesNum + 1 );
        }

        // filling the initial values
        result[ 0 ][ 0 ] = f0;
        result[ 1 ][ 0 ] = f1;
        result[ 2 ][ 0 ] = f2;
        result[ 3 ][ 0 ] = f3;
        result[ 4 ][ 0 ] = f4;
        result[ 5 ][ 0 ] = f5;

        // starting the caclulations
        // (filling the whole array, frame by frame)
        for( i = 0; i < actualFramesNum; i++ ) {
            // generating next frame
            result[ 5 ][ i + 1 ] = result[ 5 ][ i ];
            // going down through the differences
            for( j = 4; j >= 0; j-- ) {
                result[ j ][ i + 1 ] =
                    result[ j ][ i ] + result[ j + 1 ][ i + 1 ];
            }
        }

        // now all difference are filled

        // result[ 0 ] keeps actual values
        return result[ 0 ];

    }


}
