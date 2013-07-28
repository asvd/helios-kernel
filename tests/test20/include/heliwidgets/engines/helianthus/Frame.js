/*********************************************************************

  Frame.js

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

     Defines helianthus engine routines for creating a Frame widget.


 __Objects declared:__________________________________________________

 heliwidgets.engines.helianthus.Frame    - Frame widget implementation
 --heliwidgets.engines.helianthus.Frame private properties: ----------
  _normalLayer                 - Layer for normal state frame graphics
  _disabledLayer                   - Layer for disabled frame graphics
  _disablerProperty                 - frame disable animation property
  _hiderProperty                       - frame hide animation property
 --heliwidgets.engines.helianthus.Frame public methods: --------------
  create()                           - creates the frame on the screen
  destroy()                        - destroies a frame from the screen
 --heliwidgets.engines.helianthus.Frame private methods: -------------
  _applyGeometry()             - applies geometry change to the screen
  _applyUsability()  - applies usability property change to the screen
  _disabler()                             - disabler animator function
  _hider()                                   - hider animator function
  _drawFrame()                - creates a frame graphics on the screen
  _clearFrame()                 - clears frame graphic from the screen
  _varyPrimaryColor()                   - changes primary color a bit
  _redraw()                 - clears and than draws a frame back again

 __TODO:______________________________________________________________

Read TODO for _applyUsability() mehtod, this should be probably moved
to the Widget.js, same apples to the Button implementation.

Investigate on  how to set  verticalAlign for the Label  component and
remove that ugly workaround which alligns a label at the middle of the
button. Same applies to the Label widget.

*********************************************************************/

include( "helianthus.js" );
include( "../../../canvas/primes.js" );
include( "../../../color/base.js" );
include( "../../../color/Pipe.js" );
include( "../../../math/stuff.js" );
include( "Widget.js" );

include( "../../../anime/Property.js" );
include( "../../../anime/styles/fspline.js" );
include( "../../../anime/styles/line.js" );
include( "../../../anime/styles/leap.js" );

include( "../../../platform/components/Layer.js" );
include( "../../../platform/components/Canvas.js" );

include( "_supply/cssgeom.js" );

init = function() {

    var helianthus = heliwidgets.engines.helianthus;
    
    var Frame = helianthus.Frame = {};
    var Widget = helianthus.Widget;

    // Creates  a  Frame  widget  on  the screen  and  attaches  event
    // handlers to corresponding events.
    Frame.create = function() {
	// calling common widget create()
	Widget.create.call( this );

	// geom keeps widget geometry
	var geom = js.clone( this.simpleGeometry.get() );

	// dims is the same as geom but with left and top set to 0
	var dims = helianthus._supply.cssgeom.moveRect( geom, 0, 0 );

	// creating layers which will keep widget graphics
	// ('normal' relates to frame state, 'main' relates to layer)
	var Layer = platform.components.Layer;
	this._normalLayer = new Layer( this._layer, dims );
	this._disabledLayer = new Layer( this._layer, dims, null, null, 0 );

	// updating primaryColor
	Frame._varyPrimaryColor.call( this );
	
	// creating a frame itself
	Frame._drawFrame.call( this );

	// creating animations
	var Prop = anime.Property; // a shortcut
	this._disablerProperty = new Prop( Frame._disabler, 0, this );
	this._hiderProperty = new Prop( Frame._hider, 0, this );

	// attaching events to signals
	this.sigThemeChanged.listen( Frame._redraw, this );
	this.frameType.sigChanged.listen( Frame._redraw, this );
	// updating resized layers' geometry
	this.simpleGeometry.sigChanged.listen( Frame._applyGeometry, this );
	this.usability.sigChanged.listen( Frame._applyUsability, this );
        Frame._applyUsability.call( this, this.usability.get() );
    }


    // Destroies a  Frame from the screen, undoes  everything done by
    // create() method.
    Frame.destroy = function() {
	// clearing the frame (this will remove canvases)
	Frame._clearFrame.call( this );
        
	// removing layers created by create()
        this._layer.removeChild( this._normalLayer );
        this._layer.removeChild( this._disabledLayer );

	// calling common widget destroy()
	Widget.destroy.call( this );
    }



    // Event handlers

    // Resizes all special sized layers on simpleGeometry change
    Frame._applyGeometry = function( oldGeom ) {
	// frame geometry
	var geom = this.simpleGeometry.get();

	// check if we need to redraw a widget, this happens when size changed
	if ( geom.width != oldGeom.width ||
	     geom.height != oldGeom.height ) {
	    // same as geom but with left and top set to 0
	    var dims = helianthus._supply.cssgeom.moveRect( geom, 0, 0 );
            
	    // resizing all layers created by create()
	    this._normalLayer.geometry.set( dims );
	    this._disabledLayer.geometry.set( dims );

	    Frame._redraw.call( this );
	}

    }


    // Applies usability property change to the screen
    //
    // All times set to  0 due to there may be a  lot of widgets which
    // their state simultatniously, so animation may look slow
    //
    // TODO Probably this function  should be launched for all widgets
    // in  helianthus'  Widget.js  since  this equals  (at  least  for
    // Button, but  we should think  about is it really  universal for
    // any low-level engine-implemented  widget (i.e.  does all widget
    // have  hider and  disabler animation  properties). If  yes, than
    // probably these properties should be moved to Widget.js too.
    Frame._applyUsability = function( oldValue ) {
        var updateTime = 100;
	if ( oldValue == this.usability.get() ) {
	    switch( this.usability.get() ) {
	    case "hidden": break; // hidden by default
	    case "disabled":
		this._hiderProperty.animate({
		    targetValue : 0,
		    time: updateTime,
		    style : anime.styles.line
		});
		this._disablerProperty.animate({
		    targetValue : 100,
		    time: updateTime,
		    style : anime.styles.line
		});
		break;
	    case "enabled" :
		this._hiderProperty.animate({
		    targetValue : 0,
		    time: updateTime,
		    style : anime.styles.line
		});
	    }
	} else if ( oldValue == "hidden" ) {
	    // frame was hidden and now shown
	    this._hiderProperty.animate({
		targetValue: 0,
		time: updateTime,
		style: anime.styles.line
	    });
	    // verifying availability
	    if ( this.usability.get() == "disabled" ) {
		// frame should be shown disabled
		this._disablerProperty.animate({
		    targetValue: 100,
		    time: updateTime,
		    style: anime.styles.line
		});
	    } // else frame should be shown normaly enabled
	} else if ( this.usability.get() == "hidden" ) {
	    // frame was shown and now hidden
	    this._hiderProperty.animate({
		targetValue: 100,
		time: updateTime,
		style: anime.styles.line
	    });
	    // checking whether we need to hide also the disabler
	    if ( oldValue == "disabled" ) {
		// frame was disabled and now hidden
		this._disablerProperty.animate({
		    targetValue: 0,
		    time: updateTime,
		    style: anime.styles.line
		});
	    } // else it is hidden
	} else if ( oldValue == "disabled" ) {
	    // frame was disabled and now enabled
	    this._disablerProperty.animate({
		targetValue: 0,
		time: updateTime,
		style: anime.styles.line
	    });
	} else {
	    // frame was enabled and now disabled
	    this._disablerProperty.animate({
		targetValue: 100,
		time: updateTime,
		style: anime.styles.line
	    });
	}
    }
    

    // Animators

    // Disable animator
    Frame._disabler = function( val ) {
	var realOpacity = Math.crop( Math.round(val) / 100, 0, 1 );
	this._disabledLayer.opacity.set( realOpacity );
	this._normalLayer.opacity.set( 1 - realOpacity );
    }


    // Hide animator
    Frame._hider = function( val ) {
	// hiding all layers
	var realOpacity = Math.crop( Math.round(100-val) / 100, 0, 1 );
	this._normalLayer.opacity.set( realOpacity );
    }


    // Creates a Frame graphic on the screen
    Frame._drawFrame = function() {
	// shortcuts
	var expandRect = helianthus._supply.cssgeom.expandRect;
	var shrinkRect = helianthus._supply.cssgeom.shrinkRect;
	var moveRect = helianthus._supply.cssgeom.moveRect;

	// widget dimensions
        var fullDims = moveRect( this.simpleGeometry.get(), 0, 0 );
	// outter area width
        var diff = 1;
        
	var shrinkDims = shrinkRect( fullDims, diff );

	// creating canvases for each layer
        var Canvas = platform.components.Canvas;
	this._normalCanvas = new Canvas( this._normalLayer, fullDims );
	this._disabledCanvas = new Canvas( this._disabledLayer, fullDims );

	// storing necessary properties
	var primaryColor = color.getPipe( this.getThemeProp( "primaryColor" ) );
	var secondaryColor = color.getPipe( this.getThemeProp( "secondaryColor" ) );
	var darkTheme = this.getThemeProp( "darkTheme" );
	var highlightColor = color.getPipe( this.getThemeProp( "highlightColor" ) );
	var shadowColor = color.getPipe( this.getThemeProp( "shadowColor" ) );
	var frameType = this.frameType.get();
	// avoids over-roundness
	var roundness = Math.floor( Math.min3(
	    this.getThemeProp( "frameCornerRoundness" ),
	    ( shrinkDims.height - 1 ) / 2,
	    ( shrinkDims.width - 1 ) / 2
	));

	// outter elements should conform parent's theme
	// storing necessary parent properties
	var par = this.parent;
	var parPrimaryColor = color.getPipe( par.getThemeProp( "primaryColor" ) );
	var parSecondaryColor = color.getPipe( par.getThemeProp( "secondaryColor" ) );
	var parDarkTheme = par.getThemeProp( "darkTheme" );
	var parHighlightColor = color.getPipe( par.getThemeProp( "highlightColor" ) );
	var parShadowColor = color.getPipe( par.getThemeProp( "shadowColor" ) );

        var ctx;

	// Frame  drawing  depends  on  frameType (which  is  "normal",
	// "lower" or "glass"), the code is maintained separately
	if ( frameType == "lower" ) {
	    // frame type is "lower", creating graphics
	
	    // normal state lower canvas
	    // -----------------------------------------------------------
	    // This canvas keeps outter frame shadow/highlight and uses
	    // parent's  theme   properties
	    ctx = this._normalCanvas.getContext('2d');
	    if ( parDarkTheme == true ) {
		// parent is dark
		// outter glow
		ctx.strokeStyle =
                    parHighlightColor.
                    blendWith( parPrimaryColor, 0.6 ).
                    getCSS();
		canvas.roundRect( ctx, fullDims, roundness + 1 );
		ctx.stroke();
	    } else {
		// parent theme is not dark
		// outter light
		ctx.strokeStyle =
                    parHighlightColor.
                    setAlpha( 0.36 ).
                    getCSS();
		canvas.roundRect( ctx, fullDims, roundness + 1 );
		ctx.stroke();
	    }
	    
	    // normal state main canvas
	    // -----------------------------------------------------------
	    // Keeps ordinary frame graphics in a normal state
	    if ( darkTheme == true ) {
		// theme is dark
		// frame fill and inner shadow0
		ctx.strokeStyle = shadowColor.setAlpha( 0.8 ).getCSS();
		ctx.fillStyle = primaryColor.getCSS();
		canvas.roundRect( ctx, shrinkDims, roundness );
		ctx.fill();
		ctx.stroke();
		// inner shadow1
		ctx.strokeStyle = shadowColor.setAlpha( 0.4 ).getCSS();
		ctx.fillStyle = primaryColor.getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness-1 );
		ctx.stroke();
		// inner shadow2
		ctx.strokeStyle = shadowColor.setAlpha( 0.15 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 2 ), roundness-2 );
		ctx.stroke();
		// inner shadow3
		ctx.strokeStyle = shadowColor.setAlpha( 0.05 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 3 ), roundness-3 );
		ctx.stroke();
		// inner small shadow
		ctx.strokeStyle = shadowColor.setAlpha( 0.08 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness-1, "topleft" );
		ctx.stroke();
	    } else {
		// normal theme
		// frame border
		ctx.strokeStyle = shadowColor.setAlpha( 0.9 ).getCSS();
		ctx.fillStyle = primaryColor.getCSS();
		canvas.roundRect( ctx, shrinkDims, roundness );
		ctx.fill();
		ctx.stroke();
		// inner shadow1
		ctx.strokeStyle = shadowColor.setAlpha( 0.2 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness-1 );
		ctx.fill();
		ctx.stroke();
		// inner shadow2
		ctx.strokeStyle = shadowColor.setAlpha( 0.06 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 2 ), roundness-2 );
		ctx.stroke();
		// inner shadow3
		ctx.strokeStyle = shadowColor.setAlpha( 0.03 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 3 ), roundness-3 );
		ctx.stroke();
		// inner small shadow
		ctx.strokeStyle = shadowColor.setAlpha( 0.075 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness-1, "topleft" );
		ctx.stroke();
	    }

	    // disabled state lower canvas
	    // -----------------------------------------------------------
	    ctx = this._disabledCanvas.getContext('2d');
	    if ( parDarkTheme ) {
		// parent theme is dark
		// outter highlight
		ctx.strokeStyle = parHighlightColor.setAlpha( 0.09 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( fullDims, 0 ), roundness + 1 );
		ctx.stroke();
	    } else {
		// parent theme is not dark
		// outter highlight
		ctx.strokeStyle = parHighlightColor.setAlpha( 0.18 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( fullDims, 0 ), roundness + 1, "bottomright" );
		ctx.stroke();
	    }
	    
	    // disabled state main canvas
	    // -----------------------------------------------------------
	    if ( darkTheme ) {
		// theme is dark
		// frame fill and inner shadow0
		ctx.strokeStyle = shadowColor.blendWith( primaryColor, 0.5 ).getCSS();
		ctx.fillStyle = primaryColor.getCSS();
		canvas.roundRect( ctx, shrinkDims, roundness );
		ctx.fill();
		ctx.stroke();
		// inner shadow1
		ctx.strokeStyle = shadowColor.setAlpha( 0.25 ).getCSS();
		ctx.fillStyle = primaryColor.getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness-1 );
		ctx.stroke();
		// inner shadow2
		ctx.strokeStyle = shadowColor.setAlpha( 0.08 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 2 ), roundness-2 );
		ctx.stroke();
		// inner shadow3
		ctx.strokeStyle = shadowColor.setAlpha( 0.03 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 3 ), roundness-3 );
		ctx.stroke();
		// inner small shadow
		ctx.strokeStyle = shadowColor.setAlpha( 0.05 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness-1, "topleft" );
		ctx.stroke();
	    } else {
		// normal theme
		// frame border
		ctx.strokeStyle = shadowColor.blendWith( primaryColor, 0.7 ).getCSS();
		ctx.fillStyle = primaryColor.getCSS();
		canvas.roundRect( ctx, shrinkDims, roundness );
		ctx.fill();
		ctx.stroke();
		// inner shadow1
		ctx.strokeStyle = shadowColor.setAlpha( 0.06 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness-1 );
		ctx.fill();
		ctx.stroke();
		// inner shadow2
		ctx.strokeStyle = shadowColor.setAlpha( 0.02 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 2 ), roundness-2 );
		ctx.stroke();
		// inner shadow3
		ctx.strokeStyle = shadowColor.setAlpha( 0.01 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 3 ), roundness-3 );
		ctx.stroke();
		// inner small shadow
		ctx.strokeStyle = shadowColor.setAlpha( 0.025 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness-1, "topleft" );
		ctx.stroke();
	    }
	    
	} else if ( frameType == "glass" ) {
	    // frame type is "glass", creating graphics
	
	    // normal state main canvas
	    // -----------------------------------------------------------
	    // Keeps ordinary frame graphics in a normal state
	    ctx = this._normalCanvas.getContext('2d');
	    if ( darkTheme == true ) {
		// theme is dark
		// frame border (inner shadow) and fill
		ctx.strokeStyle = shadowColor.setAlpha( 0.4 ).getCSS();
		ctx.fillStyle = secondaryColor.setAlpha( 0.27 ).addLuminance( 40 ).addSaturation( 80 ).getCSS();
		canvas.roundRect( ctx, shrinkDims, roundness );
		ctx.fill();
		ctx.stroke();
		// inner big shadow
		ctx.fillStyle = shadowColor.setAlpha( 0.08 ).getCSS();
		helianthus._supply.canvas.drawHighlight(
		    ctx,
		    shrinkRect( shrinkDims, 2 ),
		    roundness + 2,
		    0.5
		);
		ctx.fill();
		// top big light
		ctx.fillStyle = highlightColor.setAlpha( 0.08 ).getCSS();
		helianthus._supply.canvas.drawHighlightTop(
		    ctx,
		    shrinkRect( shrinkDims, 3 ),
		    roundness + 3
		);
		ctx.fill();
		// inner light
		ctx.strokeStyle = highlightColor.setAlpha( 0.3 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness-1 );
		ctx.stroke();
		// inner small shadow
		ctx.strokeStyle = shadowColor.setAlpha( 0.03 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness-1, "bottomright" ); 
		ctx.stroke();
	    } else {
		// normal theme
		// frame border
		ctx.strokeStyle = shadowColor.addSaturation( 50 ).setAlpha( 0.5 ).getCSS();
		ctx.fillStyle = secondaryColor.addSaturation( 100 ).setAlpha( 0.4 ).getCSS();
		canvas.roundRect( ctx, shrinkDims, roundness );
		ctx.fill();
		ctx.stroke();
		// inner big shadow
		ctx.fillStyle = shadowColor.setAlpha( 0.05 ).getCSS();
		helianthus._supply.canvas.drawHighlight(
		    ctx,
		    shrinkRect( shrinkDims, 2 ),
		    roundness + 2,
		    0.5
		);
		ctx.fill();
		// top big light
		ctx.fillStyle = highlightColor.setAlpha( 0.15 ).getCSS();
		helianthus._supply.canvas.drawHighlightTop(
		    ctx,
		    shrinkRect( shrinkDims, 3 ),
		    roundness + 3
		);
		ctx.fill();
		// inner light
		ctx.strokeStyle = highlightColor.setAlpha( 0.6 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness-1);
		ctx.stroke();
		// inner small shadow
		ctx.strokeStyle = shadowColor.setAlpha( 0.08 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness-1, "bottomright" );
		ctx.stroke();
	    }

	    // disabled state lower canvas
	    // -----------------------------------------------------------
	    // empty for glass Frame
	    
	    // disabled state main canvas
	    // -----------------------------------------------------------
	    ctx = this._disabledCanvas.getContext('2d');
	    if ( darkTheme ) {
		// theme is dark
		ctx.strokeStyle = primaryColor.setAlpha( 0.3 ).getCSS();
		ctx.fillStyle = primaryColor.setAlpha( 0.3 ).getCSS();
		canvas.roundRect( ctx, shrinkDims, roundness );
		ctx.fill();
		ctx.stroke();
	    } else {
		// theme is not dark
		ctx.strokeStyle = primaryColor.setAlpha( 0.3 ).getCSS();
		ctx.fillStyle = primaryColor.setAlpha( 0.3 ).getCSS();
		canvas.roundRect( ctx, shrinkDims, roundness );
		ctx.fill();
		ctx.stroke();
	    }
	} else {
	    // frame type is "default", creating graphics
	
	    // normal state lower canvas
	    // -----------------------------------------------------------
	    // This canvas keeps outter frame shadow/highlight and uses
	    // parent's  style   properties
	    ctx = this._normalCanvas.getContext('2d');
	    if ( parDarkTheme == true ) {
		// parent is dark
		// outter glow
		ctx.strokeStyle = parHighlightColor.blendWith( parPrimaryColor, 0.6 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( fullDims, 0 ), roundness + 1 );
		ctx.stroke();
	    } else {
		// parent theme is not dark
		// outter shadow
		ctx.strokeStyle = parShadowColor.setAlpha( 0.1 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( fullDims, 0 ), roundness + 1 );
		ctx.stroke();
		// outter-down shadow
		ctx.strokeStyle = parShadowColor.setAlpha( 0.1 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( fullDims, 0 ), roundness + 1, "bottomright" );
		ctx.stroke();
	    }
	    
	    // normal state main canvas
	    // -----------------------------------------------------------
	    // Keeps ordinary frame graphics in a normal state
	    if ( darkTheme == true ) {
		// theme is dark
		// frame border (inner shadow) and fill
		ctx.strokeStyle = shadowColor.setAlpha( 0.45 ).getCSS();
		ctx.fillStyle = primaryColor.getCSS();
		canvas.roundRect( ctx, shrinkDims, roundness );
		ctx.fill();
		ctx.stroke();
		// inner light
		ctx.strokeStyle = highlightColor.setAlpha( 0.2 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness-1 );
		ctx.stroke();
		// inner small shadow
		ctx.strokeStyle = shadowColor.setAlpha( 0.08 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness-1, "bottomright" ); 
		ctx.stroke();
	    } else {
		// normal theme
		// frame border
		ctx.strokeStyle = shadowColor.getCSS();
		ctx.fillStyle = primaryColor.getCSS();
		canvas.roundRect( ctx, shrinkDims, roundness );
		ctx.fill();
		ctx.stroke();
		// inner light
		ctx.strokeStyle = highlightColor.setAlpha( 0.6 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness-1);
		ctx.stroke();
		// inner small shadow
		ctx.strokeStyle = shadowColor.setAlpha( 0.08 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness-1, "bottomright" );
		ctx.stroke();
	    }

	    // disabled state lower canvas
	    // -----------------------------------------------------------
	    ctx = this._disabledCanvas.getContext('2d');
	    if ( parDarkTheme ) {
		// parent theme is dark
		// outter highlight
		ctx.strokeStyle = parHighlightColor.setAlpha( 0.09 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( fullDims, 0 ), roundness + 1 );
		ctx.stroke();
	    } else {
		// parent theme is not dark
		// outter highlight
		ctx.strokeStyle = parHighlightColor.setAlpha( 0.3 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( fullDims, 0), roundness + 1, "bottomright" );
		ctx.stroke();
	    }
	    
	    // disabled state main canvas
	    // -----------------------------------------------------------
	    if ( darkTheme ) {
		// theme is dark
		ctx.strokeStyle = primaryColor.getCSS();
		ctx.fillStyle = primaryColor.setAlpha( 0.6 ).getCSS();
		canvas.roundRect( ctx, shrinkDims, roundness );
		ctx.fill();
		ctx.stroke();
		// creating border
		ctx.strokeStyle = shadowColor.blendWith(primaryColor,0.9).getCSS();
		canvas.roundRect( ctx, shrinkDims, roundness );
		ctx.stroke();
		// clearing inner highlight
		ctx.strokeStyle = primaryColor.getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness - 1 );
		ctx.stroke();
		// recreating inner highlight
		ctx.strokeStyle = highlightColor.setAlpha( 0.12 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness - 1 );
		ctx.stroke();
	    } else {
		// theme is not dark
		ctx.strokeStyle = primaryColor.getCSS();
		ctx.fillStyle = primaryColor.setAlpha( 0.6 ).getCSS();
		canvas.roundRect( ctx, shrinkDims, roundness );
		ctx.fill();
		ctx.stroke();
		// creating border
		ctx.strokeStyle = shadowColor.blendWith(primaryColor,0.8).getCSS();
		canvas.roundRect( ctx, shrinkDims, roundness );
		ctx.stroke();
		// clearing inner highlight
		ctx.strokeStyle = primaryColor.getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness - 1 );
		ctx.stroke();
		// recreating inner highlight
		ctx.strokeStyle = highlightColor.setAlpha( 0.3 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness - 1, "topleft" );
		ctx.stroke();
	    }
	}

    }


    // Clears frame graphic from the screen
    Frame._clearFrame = function() {
	// removing canvases
	this._normalCanvas.remove();
	this._disabledCanvas.remove();
    }

    
    // Changes primary color  a bit, so each deeper  frame looks a bit
    // saturated
    Frame._varyPrimaryColor = function() {
	// modifying frame primary color if it is not redefined
	if ( typeof( this._themeExpl.primaryColor ) == "undefined" ) {
	    // clearing previously redefined primaryColor
	    this._regenerateThemeProp( "primaryColor" );
	    var primaryColor = color.getPipe( this.getThemeProp( "primaryColor" ) );
	    var secondaryColor = color.getPipe( this.getThemeProp( "secondaryColor" ) );
	    var darkTheme = this.getThemeProp( "darkTheme" );
	    var frameType = this.frameType.get();
	    var newPrimaryColor = "";

	    // for lower frame its color is a bit lighter
	    if ( frameType == "lower" ) {
		if ( darkTheme ) {
		    // theme is dark
		    newPrimaryColor =
                        primaryColor.
                        blendWith( secondaryColor, 0.06 ).
                        addLuminance(18).
                        addSaturation(2).
                        getCSS();
		} else {
		    // theme is not dark
		    newPrimaryColor =
                        primaryColor.
                        blendWith( secondaryColor, 0.06 ).
                        addLuminance( 13 ).
                        addSaturation(4).
                        getCSS();
		}
	    } else {
		if ( darkTheme ) {
		    // theme is dark
		    newPrimaryColor =
                        primaryColor.
                        blendWith( secondaryColor, 0.06 ).
                        addLuminance(10).
                        getCSS();
		} else {
		    // theme is not dark
		    newPrimaryColor =
                        primaryColor.
                        blendWith( secondaryColor, 0.06 ).
                        addLuminance(5).
                        addSaturation(5).
                        getCSS();
		}
	    }
	    
	    this._theme.primaryColor = newPrimaryColor;
	}
    }


    // Clears the frame from the screen and then draws it again
    Frame._redraw = function() {
	// updating primaryColor
	Frame._varyPrimaryColor.call( this );
	// clearing the widget
	Frame._clearFrame.call( this );
	// recreating the widget
	Frame._drawFrame.call( this );
    }

}

