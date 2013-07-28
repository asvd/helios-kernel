/*********************************************************************

  Property.js

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

     Defines anime.Property object which should be used to create some
     animation on the  screen. Property operates with single-dimension
     animation (each  frame is  represented with some  integer value).
     Each  Property is  connected  to some  function (animator)  which
     actually  applies newly  calculated value,  and this  function is
     called  each  new   frame.   Property  object  manages  animation
     calculations.

     Property  provides an animate()  method which  should be  used to
     perform an  animation.

     Style function is used for animation calculating.

     Default  animation  FPS (frames  per  second)  value  is kept  in
     anime.fps   property,  it   can  be   globally   redefined  using
     anime.setFPS() function  which will have effect  on newly created
     properties.  Each Property object  also has setFPS() method which
     allows overriding FPS  value for a single Property  only (in case
     you create some heavy animation).

     Property also provides sigFinish()  signal which is sent whenever
     some animation  has reached  its end (but  is not sent  when some
     animation is interrupted by other one).


 __Code example:______________________________________________________

     myAnimation = new anime.Property( animatorFunction, 0 );

     // overriding fps value
     myAnimation.fps.set( 50 ); // default is 40

     // first part of a loop
     myAnimationAttrLoop1 = {
         targetValue : 50,
         time : 500,
         style : anime.styles.sine
     }

     // second part of a loop
     myAnimationAttrLoop2 = {
         targetValue : 50,
         time: 500,
         style : anime.styles.sine,
         nextAttr : myAnimationAttrLoop1
     }

     // myAnimaitonAttrLoop2 is already defined so we can use it
     myAnimationAttrLoop1.nextAttr = myAnimationAttrLoop2;


     // animation before a loop
     myAnimationAttrStart = {
         targetValue : 100, // move from current value to 100
         time : 1000, // perform animation during 1000 msec = 1 sec
         style : anime.styles.fspline,
         nextAttr : myAnimationAttrLoop1,
         styleArgs : {
             preserveTangent : true
         }
     }

     // will start an animaiton sequence
     myAnimation.animate( myAnimationAttrStart );

     // the next lines should be located somwhere else
     // stopping the animation in a eyecandy way
     myAnimationAttrStop = {
         targetValue : 0,
         time : 500,
         style : anime.styles.fspline,
         styleArgs : {
             preserveTangent: true, 
             smoothStart : true,
             smoothEnd : true
         }
     }

     // will animate to the initial position (interrupting a sequence)
     myAnimaiton.animate( myAnimationAttrStop );


 __Objects declared:__________________________________________________

 anime._properties       - globally keeps all anime.Properties objects
 anime.Property   - object for performing single-dimensional animation
 --anime.Property public properties: ---------------------------------
  sigFinish    - js.Signal sent whenever animation has reached its end
  fps                        - js.Property keeping animation fps value
 --anime.Property private properties: --------------------------------
  _id     - keeps Property unique index in the anime._properties array
  _animator                  - keeps animation function or js.Property
  _animatorObj   - keeps an object to which to apply an animator func.
  _state              - current animation state (stopped or animating)
  _frames[]                       - array of animation frames (values)
  _frameNum                    - number of the current animation frame
  _attr                   - struct, keeps current animation attributes
  _delay - delay between two frames in msec (for the current Property)
  _states (static)      - enumerates a list of states for the Property
 --anime.Property public methods: ------------------------------------
  animate()                           - launches the desired animation
 --anime.Property private methods: -----------------------------------
  _updateDelay()                  - recalculates _delay from fps value
  _applyFrame()               - applies each new frame using _animator
  _step()                                - performs one animation step


*********************************************************************/


include( "anime.js" );

include( "../js/Signal.js" );
include( "../js/Property.js" );

init = function() {

    
    // Property  constructor.  anime.Property  object represents  some
    // attribute which will be animated on demand.
    //
    // Arguments:
    //  - animator is either a  js.Property instance or a function: in
    //    case  when it is  a js.Property,  the newly  generated value
    //    will be  assigned to it using set()  method; otherwise (when
    //    animator is  a function  which performs an  animation), this
    //    function should take  one argument - a value  of the current
    //    frame, which is provided as floating-point value - so if you
    //    need  integer, you  should call  Math.round()  or parseInt()
    //    inside the animator before applying value to some object
    //  - initVal is an initial value of the property
    //  - animatorObj is an object to which animator should be applied
    //    (in case when it is a function; optional, otherwise animator
    //    will be simply called as an ordinary function)
    anime.Property = function( animator, initVal, animatorObj ) {
        // unique id of the Property,
        // equals index in anime._properties array
        this._id = anime._properties.push( this ) - 1;
        // function or js.Property which applies the animation frame
        this._animator = animator || function() {};
        // object to which animator should be applied
        this._animatorObj = animatorObj || null;
        // current state of the Property
        this._state = this._states.stopped;
        // animation frames (array of values)
        this._frames = [ initVal || 0 ];
        // number of current animation frame (an iterator)
        this._frameNum = 0;
        // current animation attribute
        this._attr = null;
        // will be sent whenever some animation has reached its end
        this.sigFinish = new js.Signal();
        // keeps fps value, defaults to anime.fps value
        this.fps = new js.Property( anime.fps.get() );
        // delay between two frames in msec
        this._delay = anime._delay;
        // updating delay on fps change
        this.fps.sigChanged.listen( this._updateDelay, this );
    }

    
    // Updates _delay on fps change
    anime.Property.prototype._updateDelay = function() {
        this._delay = Math.round( 1000 / this.fps.get() );
    }


    // Possible states of the animation property
    anime.Property.prototype._states = {
        stopped : 0,
        animating : 1
    }


    // Performs animation of the Property.
    //
    // Argument:
    // attr = {
    //   - targetValue is a value where to animate
    //   - time
    //   - style is a function which will perform frames calculation
    //   - styleArgs is an object with optional arguments for the style
    //   - nextAttr is an object containing scheduled animation attr
    // }
    //
    anime.Property.prototype.animate = function( attr ) {
        // storing the animation attribute
        this._attr = attr;

        // calculating the new set of frames
        this._frames = attr.style(
            // start value
            this._frames[ this._frameNum ],
            // end value
            parseFloat( attr.targetValue ),
            // proposed number of frames
            Math.round( attr.time / this._delay ) || 1,
            // additional arguments for the animation
            attr.styleArgs || null,
            // Property itself
            this
        );

        // starting from the begining
        this._frameNum = 0;

        // applying first frame
        this._applyFrame();

        // checking whether animation is in progress
        if ( this._state == this._states.stopped ) {
            // starting animation
            this._state = this._states.animating;
            setTimeout( "anime._properties[" + this._id + "]._step()", this._delay );
        } // otherwise, it will be handled by _step()
    }


    // Calls an animator thus applying current frame
    anime.Property.prototype._applyFrame = function() {
        if ( this._animator instanceof js.Property ) {
            // this.animator is a js.Property, assigning a value
            this._animator.set( this._frames[ this._frameNum ] );
        } else {
            // this.animator is a function, calling it (animatorObj is
            // probably null)
            this._animator.call( this._animatorObj,
                                 this._frames[ this._frameNum ] );
        }
    }

    
    // Performs one animation step and schedules itself if needed
    //
    // Argument:
    //  - id is unique ID of the property to animate
    anime.Property.prototype._step = function() {
        // checking whether animation is finished
        if ( this._frameNum == this._frames.length - 1 ) {
            // end is reached

            // notifying listeners
            this.sigFinish.send();

            // checking  for  the  end   once  again,  since  some  of
            // listeners could perform a new animation
            if ( this._frameNum == this._frames.length - 1 ) {
            // nothing changed
            
                // checking whether there is scheduled animation
                if ( typeof ( this._attr.nextAttr ) != "undefined" &&
                     this._attr.nextAttr != null ) {
                    // switching to the scheduled animation
                    this.animate( this._attr.nextAttr ); // calculate new animation
                } else {
                    // stopping  the animation
                    this._frames = [ this._frames[ this._frameNum ] ];
                    this._frameNum = 0;
                    this._state = this._states.stopped;
                    this._attr = null;
                    // interrupting sequence
                    return;
                }
            }
        }

        // applying next frame
        this._frameNum++;
        this._applyFrame();
        // scheduling next step
        setTimeout( "anime._properties[" + this._id + "]._step()", this._delay );
        
    }


    // Keeps all animation properties
    // Used by _step() method to globally access any animation property
    anime._properties = new Array();


}
