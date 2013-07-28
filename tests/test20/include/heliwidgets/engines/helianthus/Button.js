/*********************************************************************

  Button.js

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

     Defines helianthus engine routines for creating a Button widget.


 __Objects declared:__________________________________________________

 heliwidgets.engines.helianthus.Button  - Button widget implementation
 --heliwidgets.engines.helianthus.Button private properties: ---------
  _normalLayer                - Layer for normal state button graphics
  _mouseHighlightLayer            - Layer for mouse highlight graphics
//_keyboardHighlightLayer      - Layer for keyboard highlight graphics
  _pushedLayer                      - Layer for pushed button graphics
  _disabledLayer                  - Layer for disabled button graphics
  _mouseHighlighterProperty       - mouse highlight animation property
  _pushedProperty                     - button push animation property
  _disablerProperty                - button disable animation property
  _hiderProperty                      - button hide animation property
 --heliwidgets.engines.helianthus.Button public methods: -------------
  create()                          - creates the button on the screen
  destroy()                       - destroies a button from the screen
 --heliwidgets.engines.helianthus.Button private methods: ------------
  _clickHandler()                          - handles mouse click event
  _mouseDownHandler()                       - handles mouse down event
  _mouseUpHandler()                           - handles mouse up event
  _mouseOverHandler()                       - handles mouse over event
  _mouseOutHandler()                         - handles mouse out event
  _applyGeometry()             - applies geometry change to the screen
  _applyPushed()                 - applies push graphics to the button
  _applyMouseHighlighted()          - applies mouse highlight graphics
  _applyUsability()  - applies usability property change to the screen
  _applyLabel()                   - applies label change to the screen
  _mouseHighlighter()              - mouse highlight animator function
//_keyboardHighlighter()        - keyboard highlight animator function
  _pusher()                                 - pusher animator function
  _disabler()                             - disabler animator function
  _hider()                                   - hider animator function
  _drawButton()              - creates a button graphics on the screen
  _clearButton()               - clears button graphic from the screen
  _redraw()                - clears and than draws a button back again

 __TODO:______________________________________________________________

     Implement text measuring (when general Canvas object is done) and
     provide a  theme property for  defining policy of  working around
     too long button labels (crop, resize text or resize button).


*********************************************************************/

include( "helianthus.js" );
include( "../../../canvas/primes.js" );
include( "../../../color/Pipe.js" );
include( "../../../math/stuff.js" );
include( "../../../js/base.js" );
include( "Widget.js" );

include( "../../../anime/Property.js" );
include( "../../../anime/styles/fspline.js" );
include( "../../../anime/styles/line.js" );
include( "../../../anime/styles/cspline.js" );
include( "../../../anime/styles/leap.js" );

include( "_supply/cssgeom.js" );
include( "_supply/canvas.js" );

include( "../../../platform/components/Layer.js" );
include( "../../../platform/components/MouseListener.js" );
include( "../../../platform/components/Canvas.js" );
include( "../../../platform/components/Label.js" );

init = function() {

    var helianthus = heliwidgets.engines.helianthus;

    var Button = helianthus.Button = {};
    var Widget = helianthus.Widget;

    // Creates  a  Button widget  on  the  screen  and attaches  event
    // handlers to corresponding events.
    Button.create = function() {
	// calling common widget create()
        // (the main  component is MouseListener because  we are going
        // to handle mouse events for the button)
	Widget.create.call( this, platform.components.MouseListener );

	// geom keeps widget geometry
	var geom = js.clone( this.simpleGeometry.get() );

	// dims is the same as geom but with left and top set to 0
	var dims = helianthus._supply.cssgeom.moveRect( geom, 0, 0 );

	// creating layers which will keep widget graphics
	// (for each button state)
	var Layer = platform.components.Layer;
	this._normalLayer = new Layer( this._layer, dims, 0 );
	this._mouseHighlightLayer = new Layer( this._layer, dims, 1, null, 0 );
//	this._keyboardHighlightLayer = new Layer( this._layer, dims, 2, null, 0 );
	this._pushedLayer = new Layer( this._layer, dims, 3, null, 0 );
	this._disabledLayer = new Layer( this._layer, dims, 4, null, 0 );

        // listening to the mouse events
	this._layer.sigMouseDown.listen( Button._mouseDownHandler, this );
	this._layer.sigMouseUp.listen( Button._mouseUpHandler, this );
	this._layer.sigMouseOver.listen( Button._mouseOverHandler, this );
	this._layer.sigMouseOut.listen( Button._mouseOutHandler, this );
	this._layer.sigClick.listen( Button._clickHandler, this ); 
        
	// creating a button itself
	Button._drawButton.call( this );

	// creating animations
	var Prop = anime.Property; // a shortcut
	this._mouseHighlighterProperty = new Prop( Button._mouseHighlighter, 0, this );
//	this._keyboardHighlighterProperty = new Prop( Button._keyboardHighlighter, 0, this );
	this._pusherProperty = new Prop( Button._pusher, 0, this );
	this._disablerProperty = new Prop( Button._disabler, 0, this );
	this._hiderProperty = new Prop( Button._hider, 100, this );

	// attaching events to signals
	this.sigThemeChanged.listen( Button._redraw, this );
	this.buttonType.sigChanged.listen( Button._redraw, this );
        this.label.sigChanged.listen( Button._applyLabel, this );
	// updating resized layers' geometry
	this.simpleGeometry.sigChanged.listen( Button._applyGeometry, this );
	this.pushed.sigChanged.listen( Button._applyPushed, this );
	this.mouseHighlighted.sigChanged.listen( Button._applyMouseHighlighted, this );
	this.usability.sigChanged.listen( Button._applyUsability, this );
	Button._applyUsability.call( this, this.usability.get() );
    }


    // Destroies a  Button from the screen, undoes  everything done by
    // create() method.
    Button.destroy = function() {
	// clearing the button (this will remove canvases)
	Button._clearButton.call( this );

	// removing layers created by create()
	this._layer.removeChild( this._normalLayer );
	this._layer.removeChild( this._mouseHighlightLayer );
//	this._layer.removeChild( this._keyboardHighlightLayer );
	this._layer.removeChild( this._pushedLayer );
	this._layer.removeChild( this._disabledLayer );

	// calling common widget destroy()
	Widget.destroy.call( this );
    }



    // Event handlers

    Button._clickHandler = function() {
	if ( this.usability.get() == "enabled" ) {
	    this.sigPushed.send();
	}
    }

    Button._mouseDownHandler = function() {
	if ( this.usability.get() == "enabled" ) {
	    this.pushed.set( true );
	}
    }
    
    Button._mouseUpHandler = function() {
	if ( this.usability.get() == "enabled" ) {
	    this.pushed.set( false );
	}
    }
    
    Button._mouseOverHandler = function() {
	if ( this.usability.get() == "enabled" ) {
	    this.mouseHighlighted.set( true );
	}
    }
    
    Button._mouseOutHandler = function() {
	// unhighlighting the button even if it is disabled
	// (or should we check usability here too?)
	this.mouseHighlighted.set( false );
    }

    
    // Resizes all special sized layers on geometry change
    Button._applyGeometry = function( oldGeom ) {
	// button geometry
	var geom = this.simpleGeometry.get();
	// check if we need to redraw a widget, this happens when size changed
	if ( geom.width != oldGeom.width ||
	     geom.height != oldGeom.height ) {
	    // same as geom but with left and top set to 0
	    var dims = helianthus._supply.cssgeom.moveRect( geom, 0, 0 );
	    
	    // resizing all layers created by create()
	    this._normalLayer.geometry.set( dims );
	    this._mouseHighlightLayer.geometry.set( dims );
//	    this._keyboardHighlightLayer.geometry.set( dims );
	    this._pushedLayer.geometry.set( dims );
	    this._disabledLayer.geometry.set( dims );

	    Button._redraw.call( this );
	}
    }


    // Applies push property change to the screen
    Button._applyPushed = function() {
	if ( this.pushed.get() == true ) {
	    // pushing button
	    this._pusherProperty.animate({
		targetValue: 100,
		time: 0,
		// mouse click should look instant so we use leap here
		style: anime.styles.leap
	    });
	} else {
	    // unpushing button
	    this._pusherProperty.animate({
		targetValue: 0,
		time: 200,
		style: anime.styles.fspline
	    });
	}
    }


    // Applies mouse highlight to the screen
    Button._applyMouseHighlighted = function() {
	if ( this.mouseHighlighted.get() == true ) {
	    this._mouseHighlighterProperty.animate({
		targetValue: 100,
		time: 300,
		style: anime.styles.fspline
	    });
	} else {
	    this._mouseHighlighterProperty.animate({
		targetValue: 0,
		time: 300,
		style: anime.styles.fspline
	    });
	}
    }


    // Applies usability property change to the screen
    //
    // All times set to  0 due to there may be a  lot of widgets which
    // their state simultatniously, so animation may look slow
    Button._applyUsability = function( oldValue ) {
        var updateTime = 100;
	if ( oldValue == this.usability.get() ) {
	    switch( this.usability.get() ) {
	    case "hidden": break; // buttons are hidden by default
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
	    // button was hidden and now shown
	    this._hiderProperty.animate({
		targetValue: 0,
		time: updateTime,
		style: anime.styles.line
	    });
	    // verifying availability
	    if ( this.usability.get() == "disabled" ) {
		// button should be shown disabled
		this._disablerProperty.animate({
		    targetValue: 100,
		    time: updateTime,
		    style: anime.styles.line
		});
	    } // else button should be shown normaly enabled
	} else if ( this.usability.get() == "hidden" ) {
	    // button was shown and now hidden
	    this._hiderProperty.animate({
		targetValue: 100,
		time: updateTime,
		style: anime.styles.line
	    });
	    // checking whether we need to hide also the disabler
	    if ( oldValue == "disabled" ) {
		// button was disabled and now hidden
		this._disablerProperty.animate({
		    targetValue: 0,
		    time: updateTime,
		    style: anime.styles.line
		});
	    } // else it is hidden
	} else if ( oldValue == "disabled" ) {
	    // button was disabled and now enabled
	    this._disablerProperty.animate({
		targetValue: 0,
		time: updateTime,
		style: anime.styles.line
	    });
	} else {
	    // button was enabled and now disabled
	    this._disablerProperty.animate({
		targetValue: 100,
		time: updateTime,
		style: anime.styles.line
	    });
	}
    }


    Button._applyLabel = function() {
        var label = this.label.get();
        this._normalLabel.text.set( label );
        this._pushedLabel.text.set( label );
        this._disabled1Label.text.set( label );
        this._disabled2Label.text.set( label );
    }

    
    // Animators

    // Mouse highlight animator
    Button._mouseHighlighter = function( val ) {
	var opcy = Math.crop( Math.round(val) / 100, 0, 1 );
	this._mouseHighlightLayer.opacity.set( opcy );
    }


/*    // Keyboard highlight animator
    Button._keyboardHighlighter = function( val ) {
	var opcy = Math.crop( Math.round(val) / 100, 0, 1 );
	this._keyboardHighlightLayer.opacity.set( opcy );
    }*/


    // Push animator
    Button._pusher = function( val ) {
	var realOpacity = Math.crop( Math.round(val) / 100, 0, 1 );
	this._pushedLayer.opacity.set( realOpacity );
        this._normalLayer.opacity.set( 1 - realOpacity );
    }


    // Disable animator
    Button._disabler = function( val ) {
	var realOpacity = Math.crop( Math.round(val) / 100, 0, 1 );
	this._disabledLayer.opacity.set( realOpacity );
        this._normalLayer.opacity.set( 1 - realOpacity );
    }


    // Hide animator
    Button._hider = function( val ) {
	// hiding all layers
	var realOpacity = Math.crop( Math.round(100-val) / 100, 0, 1 );
	this._normalLayer.opacity.set( realOpacity );
    }


    // Creates a Button graphic on the screen
    Button._drawButton = function() {
	// shortcuts
	var expandRect = helianthus._supply.cssgeom.expandRect;
	var shrinkRect = helianthus._supply.cssgeom.shrinkRect;
	var moveRect = helianthus._supply.cssgeom.moveRect;
	
	// widget dimensions
        var fullDims = moveRect( this.simpleGeometry.get(), 0, 0 );
        
        // Several pixels (usually 1) are reserved for painting outter
        // elements,  such as shadow  or light,  which should  rely on
        // parent widget's colors
        var diff = 1;
        
	var shrinkDims = shrinkRect( fullDims, diff );

	// creating canvases for each layer
	var Canvas = platform.components.Canvas;
	this._normalCanvas = new Canvas( this._normalLayer, fullDims );
	this._mouseHighlightCanvas = new Canvas( this._mouseHighlightLayer, fullDims );
//        this._keyboardHighlightCanvas = new Canvas( this._keyboardHihglightLayer, fullDims );
	this._pushedCanvas = new Canvas( this._pushedLayer, fullDims );
	this._disabledCanvas = new Canvas( this._disabledLayer, fullDims );

	// creating layers which will host button title
        var Label = platform.components.Label;
        this._normalLabel = new Label( this._normalLayer, fullDims );
        this._pushedLabel = new Label( this._pushedLayer, fullDims );
        this._disabled1Label = new Label( this._disabledLayer, fullDims );
        this._disabled2Label = new Label( this._disabledLayer, fullDims );

	// storing necessary properties
	var darkTheme = this.getThemeProp( "darkTheme" );
	var primaryColor = color.getPipe( this.getThemeProp( "primaryColor" ) );
	var secondaryColor = color.getPipe( this.getThemeProp( "secondaryColor" ) );
	var highlightColor = color.getPipe( this.getThemeProp( "highlightColor" ) );
	var shadowColor = color.getPipe( this.getThemeProp( "shadowColor" ) );
	var fontSize = this.getThemeProp( "fontSize" );
	var fontFamily = this.getThemeProp( "fontFamily" );
	// avoids over-roundness
	var roundness = Math.floor( Math.min(
	    this.getThemeProp( "buttonCornerRoundness" ),
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

	var buttonType = this.buttonType.get();

	// button label
	var label = this.label.get();
	// will place a space in case when no label
        // TODO do we need this?
	label = label==""?" ":label;

        var ctx;

	//Button  drawing depends  on buttonType  (which  is "normal",
	//"highlightVertical"  or "highlightHorizontal"), the  code is
	//maintained separately
	if ( buttonType == "highlightVertical" ||
	     buttonType == "highlightHorizontal" ) {
	    // button type is "highlight..."
	    var type = buttonType == "highlightVertical" ? "vertical" : "horizontal";

	    // mouse highlight canvas
	    // -----------------------------------------------------------
	    // Keeps ordinary button graphics in a normal state
	    ctx = this._mouseHighlightCanvas.getContext('2d');
	    if ( darkTheme == true ) {
		// dark theme
		helianthus._supply.canvas.drawLampLight(
                    ctx,
                    shrinkDims,
                    highlightColor.
                        blendWith( secondaryColor, 0.2 ).
                        addSaturation( 50 ).
                        setAlpha( 0.25 ).
                        getCSS(),
                    type );
	    } else {
		// normal theme
		helianthus._supply.canvas.drawLampLight(
                    ctx,
                    shrinkDims,
                    highlightColor.
                        blendWith( secondaryColor, 0.2 ).
                        addSaturation( 50 ).
                        setAlpha( 0.4 ).
                        getCSS(),
                    type );
	    }
	    
	    // normal state text layer
	    // -----------------------------------------------------------
            this._normalLabel.geometry.set( {
		top:(shrinkDims.height-fontSize)/2 - 1,
		left:0
            } );
	    this._normalLabel.style.set( {
		textAlign:"center",
		verticalAlign:"middle",
		fontSize: fontSize,
		fontFamily: fontFamily,
		color: darkTheme ?
                    highlightColor.getCSS() :
                    shadowColor.getCSS()
	    } );
            this._normalLabel.text.set( label );

	    // disabled text
	    this._disabled1Label.geometry.set( {
		top:(shrinkDims.height-fontSize)/2 - 1 + (darkTheme?0:1),
		left: darkTheme ? 0 : 1
            } );
            this._disabled1Label.style.set( {
		textAlign:"center",
		verticalAlign:"middle",
		fontSize: fontSize,
		fontFamily: fontFamily,
		color:
                    highlightColor.
                    blendWith( primaryColor, darkTheme ? 0.75 : 0.6 ).
                    getCSS()
	    } );
            this._disabled1Label.text.set( label );
            
	    this._disabled2Label.geometry.set( {
		top:(shrinkDims.height-fontSize)/2 - 1 - (darkTheme?1:0),
		left: darkTheme?-1:0
            } );
            this._disabled2Label.style.set( {
		textAlign:"center",
		verticalAlign:"middle",
		fontSize: fontSize,
		fontFamily: fontFamily,
		color:
                    shadowColor.
                    blendWith( primaryColor, darkTheme ? 0.95 : 0.8 ).
                    getCSS()
	    } );
            this._disabled2Label.text.set( label );
	    
	    // pushed state main canvas
	    // -----------------------------------------------------------
	    ctx = this._pushedCanvas.getContext('2d');
	    if ( darkTheme == true ) {
		// dark theme
		helianthus._supply.canvas.drawLampLight(
                    ctx,
                    shrinkDims,
                    highlightColor.
                        blendWith( secondaryColor, 0.2 ).
                        addSaturation( 50 ).
                        setAlpha( 0.2 ).
                        getCSS(),
                    type );
	    } else {
		// normal theme
		helianthus._supply.canvas.drawLampLight(
                    ctx,
                    shrinkDims,
                    highlightColor.
                        blendWith( secondaryColor, 0.2 ).
                        addSaturation( 50 ).
                        setAlpha( 0.3 ).
                        getCSS(),
                    type );
	    }
	    
	    // pushed state text layer
	    // -----------------------------------------------------------
            this._pushedLabel.geometry.set( {
		top:(shrinkDims.height-fontSize)/2 - 1,
		left:0
            } );
	    this._pushedLabel.style.set( {
		textAlign:"center",
		verticalAlign:"middle",
		fontSize: fontSize,
		fontFamily: fontFamily,
		color: darkTheme ?
                    highlightColor.getCSS() :
                    shadowColor.getCSS()
	    } );
            this._pushedLabel.text.set( label );

	} else {
	    // buttonType is "normal"
	    
	    // outter shadow/highlight
	    ctx = this._normalCanvas.getContext('2d');
	    if ( parDarkTheme == true ) {
		// parent is dark
		// outter glow
		ctx.strokeStyle =
                    parHighlightColor.
                    blendWith( parPrimaryColor, 0.5 ).
                    getCSS();
		canvas.roundRect( ctx, fullDims, roundness + 1 );
		ctx.stroke();
	    } else {
		// parent theme is not dark
		// outter shadow
		ctx.strokeStyle =
                    parShadowColor.
                    setAlpha( 0.15 ).
                    getCSS();
		canvas.roundRect( ctx, fullDims, roundness + 1 );
		ctx.stroke();
		// outter-down shadow
		ctx.strokeStyle =
                    parShadowColor.
                    setAlpha( 0.15 ).
                    getCSS();
		canvas.roundRect( ctx, fullDims, roundness + 1, "bottomright" );
		ctx.stroke();
	    }
	    
	    // normal button graphics
	    if ( darkTheme == true ) {
		// theme is dark
		// button border (inner shadow) and fill
		ctx.strokeStyle =
                    shadowColor.
                    setAlpha( 0.45 ).
                    getCSS();
		ctx.fillStyle =
                    primaryColor.
                    blendWith( secondaryColor, 0.1 ).
                    addLuminance(20).
                    getCSS();
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
		// inner big shadow
		if ( this.getThemeProp( "buttonInnerBigShadow" ) == true ) {
		    ctx.fillStyle = shadowColor.setAlpha( 0.08 ).getCSS();
		    helianthus._supply.canvas.drawHighlight(
			ctx,                   // context
			shrinkRect( shrinkDims, 1 ), // bounding rectangle
			roundness - 1,         // bounding roundness
			this.getThemeProp("buttonInnerBigShadowSize") // midline
		    );
		    ctx.fill();
		}
	    } else {
		// normal theme
		// button border and fill
		ctx.strokeStyle = shadowColor.getCSS();
		ctx.fillStyle =
                    primaryColor.
                    blendWith( secondaryColor, 0.1 ).
                    addLuminance(10).
                    addSaturation(15).
                    getCSS();
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
		// inner big shadow
		if ( this.getThemeProp( "buttonInnerBigShadow" ) == true ) {
		    ctx.fillStyle = shadowColor.setAlpha( 0.07 ).getCSS();
		    helianthus._supply.canvas.drawHighlight(
			ctx,                   // context
			shrinkRect( shrinkDims, 1 ), // bounding rectangle
			roundness - 1,         // bounding roundness
			this.getThemeProp("buttonInnerBigShadowSize") // midline
		    );
		    ctx.fill();
		}
	    }

	    // normal state text layer
	    // -----------------------------------------------------------
	    this._normalLabel.geometry.set( {
		top:(shrinkDims.height-fontSize)/2 - 1,
		left:0
            } );
            this._normalLabel.style.set( {
		textAlign:"center",
		verticalAlign:"middle",
		fontSize: fontSize,
		fontFamily: fontFamily,
		color: darkTheme ? highlightColor.getCSS() : shadowColor.getCSS()
	    } );
            this._normalLabel.text.set( label );

	    // mouse highlight state normal canvas
	    // -----------------------------------------------------------
	    ctx = this._mouseHighlightCanvas.getContext('2d');
	    // highlight opacity should depend on primary color luminance
	    var primHSL = primaryColor.getHSL();
	    var opcyVal = 0.15 * (1 + Math.max( 0, (primHSL.luminance / 255) - 0.5 ) );
	    ctx.fillStyle = highlightColor.setAlpha( Math.min( 1, opcyVal ) ).getCSS();
	    canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness-1);
	    ctx.fill();

	    // pushed canvas
	    // -----------------------------------------------------------
	    ctx = this._pushedCanvas.getContext('2d');
	    if ( parDarkTheme == true ) {
		// parent theme is dark, same as for unpushed state
		// outter glow
		ctx.strokeStyle = parHighlightColor.blendWith( parPrimaryColor, 0.7 ).getCSS();
		canvas.roundRect( ctx, fullDims, roundness + 1 );
		ctx.stroke();
	    } else {
		// parent theme is not dark
		// outter light
		ctx.strokeStyle = parHighlightColor.setAlpha( 0.3 ).getCSS();
		canvas.roundRect( ctx, fullDims, roundness + 1 );
		ctx.stroke();
	    }

	    if ( darkTheme == true ) {
		// dark theme
		// button fill and inner shadow
		ctx.fillStyle =
                    primaryColor.
                    blendWith( secondaryColor, 0.1 ).
                    addLuminance(20).
                    blendWith( shadowColor, 0.06 ).
                    getCSS();
		ctx.strokeStyle = shadowColor.setAlpha( 0.1 ).getCSS();
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
		ctx.strokeStyle = shadowColor.setAlpha( 0.04 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness-1, "topleft" );
		ctx.stroke();
		// inner big shadow
		if ( this.getThemeProp( "buttonInnerBigShadow" ) == true ) {
		    ctx.fillStyle = shadowColor.setAlpha( 0.07 ).getCSS();
		    helianthus._supply.canvas.drawHighlight(
			ctx,                   // context
			shrinkRect( shrinkDims, 1 ), // bounding rectangle
			roundness - 1,         // bounding roundness
			this.getThemeProp("buttonInnerBigShadowSize")-(1/shrinkDims.height) // midline
		    );
		    ctx.fill();
		}
		// text
		this._pushedLabel.geometry.set( {
		    top: (shrinkDims.height-fontSize)/2 - 1 + 1,
		    left: 1
                } );
                this._pushedLabel.style.set( {
		    textAlign:"center",
		    verticalAlign:"middle",
		    fontSize: fontSize,
		    fontFamily: fontFamily,
		    color: darkTheme ?
			highlightColor.blendWith( primaryColor, 0.35 ).getCSS() :
			shadowColor.blendWith( primaryColor, 0.25 ).getCSS()
		} );
                this._pushedLabel.text.set( label );
	    } else {
		// normal theme
		// button border
		ctx.strokeStyle = shadowColor.getCSS();
		ctx.fillStyle =
                    primaryColor.
                    blendWith( secondaryColor, 0.1 ).
                    addLuminance(10).
                    addSaturation(15).
                    blendWith( shadowColor, 0.1 ).
                    getCSS();
		canvas.roundRect( ctx, shrinkDims, roundness );
		ctx.fill();
		ctx.stroke();
		// inner shadow
		ctx.strokeStyle = shadowColor.setAlpha( 0.4 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness-1);
		ctx.stroke();
		// inner shadow2
		ctx.strokeStyle = shadowColor.setAlpha( 0.08 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 2 ), roundness-2);
		ctx.stroke();
		// inner small shadow
		ctx.strokeStyle = shadowColor.setAlpha( 0.2 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( shrinkDims, 1 ), roundness-1);
		// inner big shadow
		if ( this.getThemeProp( "buttonInnerBigShadow" ) == true ) {
		    ctx.fillStyle = shadowColor.setAlpha( 0.07 ).getCSS();
		    helianthus._supply.canvas.drawHighlight(
			ctx,                   // context
			shrinkRect( shrinkDims, 1 ), // bounding rectangle
			roundness - 1,         // bounding roundness
			this.getThemeProp("buttonInnerBigShadowSize")-(1/shrinkDims.height) // midline
		    );
		    ctx.fill();
		}
		// text
		this._pushedLabel.geometry.set( {
		    top: (shrinkDims.height-fontSize)/2 - 1 + 1,
		    left: 1
                } );
                this._pushedLabel.style.set( {
		    textAlign:"center",
		    verticalAlign:"middle",
		    fontSize: fontSize,
		    fontFamily: fontFamily,
		    color: darkTheme ? highlightColor.getCSS() : shadowColor.getCSS()
		} );
                this._pushedLabel.text.set( label );
	    }

	    // disabled state canvas
	    // -----------------------------------------------------------
	    ctx = this._disabledCanvas.getContext('2d');
	    if ( parDarkTheme ) {
		// parent theme is dark
		// this will remove outter shadow and glow
		ctx.strokeStyle = parPrimaryColor.getCSS();
		canvas.roundRect( ctx, fullDims, roundness + 1 );
		ctx.stroke();
		// outter highlight
		ctx.strokeStyle = parHighlightColor.setAlpha( 0.2 ).getCSS();
		canvas.roundRect( ctx, fullDims, roundness + 1 );
		ctx.stroke();
	    } else {
		// parent theme is not dark
		// this will remove outter shadow and glow
		ctx.strokeStyle = parPrimaryColor.getCSS();
		canvas.roundRect( ctx, fullDims, roundness + diff );
		ctx.stroke();
		canvas.roundRect( ctx, shrinkRect( fullDims, diff - 1 ), roundness + diff - 2 );
		ctx.stroke();
		// outter highlight
		ctx.strokeStyle = parHighlightColor.setAlpha( 0.3 ).getCSS();
		canvas.roundRect( ctx, shrinkRect( fullDims, diff - 1 ), roundness + diff-2, "bottomright" );
		ctx.stroke();
	    }

	    if ( darkTheme ) {
		// theme is dark
		ctx.strokeStyle = primaryColor.getCSS();
		ctx.fillStyle = primaryColor.blendWith( secondaryColor, 0.04 ).addLuminance(7).getCSS();
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
		ctx.strokeStyle = highlightColor.setAlpha( 0.24 ).getCSS();
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

	    // disabled text
	    this._disabled1Label.geometry.set( {
		top:(shrinkDims.height-fontSize)/2 - 1 + (darkTheme?0:1),
		left: darkTheme?0:1
            } );
            this._disabled1Label.style.set( {
		textAlign:"center",
		verticalAlign:"middle",
		fontSize: fontSize,
		fontFamily: fontFamily,
		color: highlightColor.blendWith( primaryColor, darkTheme ? 0.75 : 0.6 ).getCSS()
	    } );
            this._disabled1Label.text.set( label );
            
	    this._disabled2Label.geometry.set( {
		top:(shrinkDims.height-fontSize)/2 - 1 - (darkTheme?1:0),
		left: darkTheme?-1:0
            } );
            this._disabled2Label.style.set( {
		textAlign:"center",
		verticalAlign:"middle",
		fontSize: fontSize,
		fontFamily: fontFamily,
		color: shadowColor.blendWith( primaryColor, darkTheme ? 0.95 : 0.8 ).getCSS()
	    } );
            this._disabled2Label.text.set( label ) ;
	}
    }

    // Clears button graphic from the screen
    Button._clearButton = function() {
	// removing canvases
	this._normalCanvas.remove();
	this._mouseHighlightCanvas.remove();
//	this._keyboardHighlightCanvas.remove();
	this._pushedCanvas.remove();
	this._disabledCanvas.remove();

	// removing text layers
	this._normalLabel.remove();
	this._pushedLabel.remove();
	this._disabled1Label.remove();
	this._disabled2Label.remove();
    }


    // Clears the button from the screen and then draws it again
    Button._redraw = function() {
	// clearing the widget
	Button._clearButton.call( this );
	// recreating the widget
	Button._drawButton.call( this );
    }


}
