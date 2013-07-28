/*********************************************************************

  Label.js

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

     Defines helianthus engine routines for creating a Label widget.

 __TODO:______________________________________________________________

It seems that applyGeometry() is  broken: it should resize all custom
layers.

Label  should use  canvas  routines when  canvas  workarounds will  be
implemented (really?? why so?)

Label should change  its geometry along with the  widget, currently it
does not work and the text is cropped after resize


*********************************************************************/

include( "helianthus.js" );
include( "Widget.js" );

include( "../../../anime/Property.js" );
include( "../../../anime/styles/leap.js" );

include( "_supply/cssgeom.js" );

include( "../../../platform/components/Label.js" );
include( "../../../platform/components/Layer.js" );

init = function() {

    var helianthus = heliwidgets.engines.helianthus;
    
    var Label = helianthus.Label = {};
    var Widget = helianthus.Widget;

    Label.create = function() {
	// calling common widget create()
	Widget.create.call( this );

	// geom keeps widget geometry
	var geom = js.clone( this.simpleGeometry.get() );

	// dims is the same as geom but with left and top set to 0
	var dims = helianthus._supply.cssgeom.moveRect( geom, 0, 0 );

	// creating layers which will keep widget graphics
        var csLabel = platform.components.Label;
	this._normalLabel = new csLabel( this._layer, dims );
	this._disabled1Label = new csLabel( this._layer, dims, null, null, 0 );
	this._disabled2Label = new csLabel( this._layer, dims, null, null, 0 );

	// creating a label itself
	Label._drawLabel.call( this );

	// creating animations
	var Prop = anime.Property; // a shortcut
	this._disablerProperty = new Prop( Label._disabler, 0, this );
	this._hiderProperty = new Prop( Label._hider, 0, this );

	// attaching events to signals
	this.sigThemeChanged.listen( Label._redraw, this );

	this.usability.sigChanged.listen( Label._applyUsability, this );
	// updating resized layers' geometry
	this.simpleGeometry.sigChanged.listen( Label._applyGeometry, this );
	// updating label on demand
	this.label.sigChanged.listen( Label._applyLabel, this );
    }


    // Event handlers

    // Resizes all special sized layers on simplGeometry change
    Label._applyGeometry = function() {
        // label geometry
        var geom = this.simpleGeometry.get();

	// check if we need to redraw a widget, this happens when size changed
	if ( geom.width != oldGeom.width ||
	     geom.height != oldGeom.height ) {
	    // dims is the same as geom but with left and top set to 0
	    var dims = helianthus._supply.cssgeom.moveRect( geom, 0, 0 );

            this._normalLabel.geometry.set( dims );
	    this._disabled1Label.geometry.set( dims );
	    this._disabled2Label.geometry.set( dims );
        }
    }


    // Applies usability property change to the screen
    //
    // Comment:  all times  set to  0 due  to there  may be  a  lot of
    // widgets  which their  state simultatniously,  so  animation may
    // look slow
    Label._applyUsability = function( oldValue ) {
	if ( oldValue == "hidden" ) {
	    // label was hidden and now shown
	    this._hiderProperty.animate({
		targetValue: 0,
		time: 0,
		style: anime.styles.leap
	    });
	    // verifying availability
	    if ( this.usability.get() == "disabled" ) {
		// label should be shown disabled
		this._disablerProperty.animate({
		    targetValue: 100,
		    time: 0,
		    style: anime.styles.leap
		});
	    } // else label should be shown normaly enabled
	} else if ( this.usability.get() == "hidden" ) {
	    // label was shown and now hidden
	    this._hiderProperty.animate({
		targetValue: 100,
		time: 0,
		style: anime.styles.leap
	    });
	    // checking whether we need to hide also the disabler
	    if ( oldValue == "disabled" ) {
		// label was disabled and now hidden
		this._disablerProperty.animate({
		    targetValue: 0,
		    time: 0,
		    style: anime.styles.leap
		});
	    } // else it is hidden
	} else if ( oldValue == "disabled" ) {
	    // label was disabled and now enabled
	    this._disablerProperty.animate({
		targetValue: 0,
		time: 0,
		style: anime.styles.leap
	    });
	} else {
	    // label was enabled and now disabled
	    this._disablerProperty.animate({
		targetValue: 100,
		time: 0,
		style: anime.styles.leap
	    });
	}
    }
    

    // Animators

    // Disable animator
    Label._disabler = function( val ) {
	var realOpacity = Math.crop( Math.round(val) / 100, 0, 1 );
	this._disabled1Label.opacity.set( realOpacity );
	this._disabled2Label.opacity.set( realOpacity );
    }


    // Hide animator
    Label._hider = function( val ) {
	// hiding all layers
	// (we do  not hide  lowerLayer, mainLayer and  upperLayer cuz
	// this will break opacity property functionallity and besides
	// the user should be able to create a semi-transparent widget
	// which will operate independently of opacity property)
	var realOpacity = Math.crop( Math.round(100-val) / 100, 0, 1 );
	this._normalLabel.opacity.set( realOpacity );
    }


    // Destroies a  Label from the screen, undoes  everything done by
    // create() method.
    Label.destroy = function() {
	// clearing the label (this will remove canvases)
	Label._clearLabel.call( this );

	// removing layers created by create()
	this._layer.removeChild( this._normalLabel );
	this._layer.removeChild( this._disabled1Label );
	this._layer.removeChild( this._disabled2Label );

	// calling common widget destroy()
	Widget.destroy.call( this );
    }


    // Creates a Label graphic on the screen
    Label._drawLabel = function() {
	// widget dimensions
	var dims = helianthus._supply.cssgeom.moveRect( this.simpleGeometry.get(), 0, 0 );

	// storing necessary properties
	var primaryColor = color.getPipe( this.getThemeProp( "primaryColor" ) );
	var darkTheme = this.getThemeProp( "darkTheme" );
	var highlightColor = color.getPipe( this.getThemeProp( "highlightColor" ) );
	var shadowColor = color.getPipe( this.getThemeProp( "shadowColor" ) );
	var fontSize = this.getThemeProp( "fontSize" );
	var fontWeight = this.getThemeProp( "fontWeight" );
	var fontFamily = this.getThemeProp( "fontFamily" );
	var labelTextAlign = this.getThemeProp( "labelTextAlign" );
	
	// label text
	var label = this.label.get();
	// will place a space in case when no label
	label = label==""?" ":label; // TODO нахуя это нужно??

        // base style for the label component
        var labelStyle = {
            textAlign : labelTextAlign,
            fontSize : fontSize,
            fontWeight : fontWeight,
            fontFamily : fontFamily,
            color : ( ( darkTheme == true ) ?
                      highlightColor.getCSS() :
                      shadowColor.getCSS() )
        }

	// normal state layer
        this._normalLabel.text.set( label );
        this._normalLabel.style.set( labelStyle );
	// disabled state layer
        this._disabled1Label.text.set( label );
        this._disabled1Label.style.set( labelStyle );
	// hides normal text, otherwise looks bad due to antialiasing
        this._disabled1Label.backgroundColor.set( primaryColor.getCSS() );
        this._disabled2Label.text.set( label );
        this._disabled2Label.style.set( labelStyle );

	if ( darkTheme == true ) {
	    // theme is dark
            this._disabled1Label.geometry.set( { left : 0, top : 0 } );
            this._disabled1Label.style.set( {
                color : highlightColor.blendWith( primaryColor, 0.8 ).getCSS()
            } );
            this._disabled2Label.geometry.set( { left : -1, top : -1 } );
            this._disabled2Label.style.set( {
                color : shadowColor.blendWith( primaryColor, 0.7 ).getCSS()
            } );
	} else {
	    // theme is not dark
            this._disabled1Label.geometry.set( { left : 1, top : 1 } );
            this._disabled1Label.style.set( {
                color : highlightColor.blendWith( primaryColor, 0.6 ).getCSS()
            } );
            this._disabled2Label.geometry.set( { left : 0, top : 0 } );
            this._disabled2Label.style.set( {
                color : shadowColor.blendWith( primaryColor, 0.8 ).getCSS()
            } );
	}
    }


    Label._applyLabel = function() {
        var label = this.label.get();
        this._normalLabel.text.set( label );
        this._disabled1Label.text.set( label );
        this._disabled2Label.text.set( label );
    }


    Label._clearLabel = function() {
	// does nothing for Label widget
    }

    Label._redraw = function() {
	// clearing the widget
	Label._clearLabel.call( this );
	// recreating the widget
	Label._drawLabel.call( this );
    }

}

