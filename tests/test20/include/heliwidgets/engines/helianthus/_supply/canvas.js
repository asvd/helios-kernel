/*********************************************************************

  canvas.js

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

     Implements some  canvas primitives used  for helianthus rendering
     engine.

 __TODO:______________________________________________________________

Highlight looks  too big for big  sizes, suppose it  should use pixels
instead of relative values at least for the brightest element.

*********************************************************************/

include( "_supply.js" )
include( "../../../../color/Pipe.js" );

init = function() {
    if ( typeof( heliwidgets.engines.helianthus._supply.canvas ) == "undefined" ) {
	heliwidgets.engines.helianthus._supply.canvas = {};
    }

    var canvas = heliwidgets.engines.helianthus._supply.canvas;


    // Draws  a bouble  highlight which  you  can see  on an  ordinary
    // helianthus rendered button.
    //
    // Arguments:
    // - ctx is a drawing context
    // - boundRect is a {top, left, width, height} struct
    // - boundRoundness is a roundness of bounding rectangle
    // - midSize is a size of a bouble related to the bounding height
    canvas.drawHighlight = function( ctx, boundRect, boundRoundness, midSize ) {
	// shortcuts
	var x1 = boundRect.left;
	var y1 = boundRect.top;
	var x2 = x1 + boundRect.width;
	var y2 = y1 + boundRect.height;
	// actual roundness
	var rnd = Math.max( 0, Math.min( boundRoundness, Math.round( boundRect.width/2 ) ) );
	// absolute y-coordinate of the middle line
	var midLine = x1 + Math.round( boundRect.height * ( 1 - midSize ) );

	// painting the figure
	ctx.beginPath();
	ctx.moveTo( x1 + rnd, y2 );
	ctx.bezierCurveTo(
	    x1, y2,
	    x1, midLine,
	    x1 + 2*rnd, midLine );
	ctx.lineTo( x2 - 2*rnd, midLine );
	ctx.bezierCurveTo(
	    x2, midLine,
	    x2, midLine,
	    x2, y1 + rnd);
	ctx.lineTo( x2, y2 - rnd );
	if ( rnd > 0 ) {
	    ctx.arc( x2 - rnd, y2 - rnd, rnd, 0, Math.PI/2, false );
	}
	ctx.lineTo( x1 + rnd, y2);
    }

    // Draws a bouble highlight which you  can see at the top of glass
    // widget.
    //
    // Arguments:
    // - ctx is a drawing context
    // - boundRect is a {top, left, width, height} struct
    // - boundRoundness is a roundness of bounding rectangle
    canvas.drawHighlightTop = function( ctx, boundRect, boundRoundness ) {
	// shortcuts
	var rnd = boundRoundness;
	var left = function( coord ) {
	    return boundRect.left + coord * boundRect.width;
	}
	var top = function( coord ) {
	    return boundRect.top + coord * boundRect.height;
	}

	// painting the figure
	ctx.beginPath();
	ctx.moveTo( left( 0 ) + rnd/3, top( 1 ) - rnd/3 );
	ctx.bezierCurveTo(
	    left( 0 ) + rnd/8, top( 0.6 ),
	    left( 0 ) + rnd/8, top( 0.4 ),
	    left( 0 ) + rnd/3.2, top ( 0 ) + rnd/3.2
	);
	ctx.bezierCurveTo(
	    left( 0.4 ) + 2, top( 0 ) + rnd/8,
	    left( 0.6 ) + 2, top( 0 ) + rnd/8,
	    left( 1 ) - rnd/3, top( 0 ) + rnd/3
	);
	ctx.bezierCurveTo(
	    left( 0.6 ) + 2, top( 0 ) + rnd/8 + 2,
	    left( 0.4 ) + 2, top( 0 ) + rnd/8 + 2,
	    left( 0 ) + rnd/1.5 + 2, top( 0 ) + rnd/1.5 + 2
	);
	ctx.bezierCurveTo(
	    left( 0 ) + rnd/8 + 2, top( 0.4 ) + 2,
	    left( 0 ) + rnd/8 + 2, top( 0.6 ) + 2,
	    left( 0 ) + rnd/3, top( 1 ) - rnd/3 
	);
    }

    // Draws a lamp light seen on button of highlight types
    //
    // Arguments:
    // - ctx is a drawing context
    // - boundRect is a {top, left, width, height} struct
    // - fillStyle is a color to fill with
    // - type is "vertical" or "horizontal"
    canvas.drawLampLight = function( ctx, boundRect, fillStyle, type ) {
	var fillColor = color.getPipe( fillStyle );
	// local functions for coordinate transparency
	var moveTo;
	var lineTo;
	var bezierCurveTo;
	var left;
	var top;
	if ( type == "vertical" ) {
	    left = function( coord ) {
		return boundRect.left + coord * boundRect.width;
	    }
	    top = function( coord ) {
		return boundRect.top + coord * boundRect.height;
	    }
	    moveTo = function( x, y ) {
		return ctx.moveTo( x, y );
	    }
	    lineTo = function( x, y ) {
		return ctx.lineTo( x, y );
	    }
	    bezierCurveTo = function( x1, y1, x2, y2, x3, y3 ) {
		return ctx.bezierCurveTo( x1, y1, x2, y2, x3, y3 );
	    }
	} else {
	    // changing coordinates when layout is horizontal
	    left = function( coord ) {
		return boundRect.top + coord * boundRect.height;
	    }
	    top = function( coord ) {
		return boundRect.left + coord * boundRect.width;
	    }
	    moveTo = function( x, y ) {
		return ctx.moveTo( y, x );
	    }
	    lineTo = function( x, y ) {
		return ctx.lineTo( y, x );
	    }
	    bezierCurveTo = function( x1, y1, x2, y2, x3, y3 ) {
		return ctx.bezierCurveTo( y1, x1, y2, x2, y3, x3 );
	    }
	}
	
	// drawing figure
	// background first
	ctx.fillStyle = fillColor.multAlpha( 0.25 ).getCSS();
	ctx.beginPath();
	moveTo( left( 0 ), top( 0 ) );
	lineTo( left( 1 ), top( 0 ) );
	bezierCurveTo(
	    left( 0.8 ), top( 0.4 ),
	    left( 0.8 ), top( 0.6 ),
	    left( 1 ), top( 1 )
	);
	lineTo( left( 0 ), top( 1 ) );
	bezierCurveTo(
	    left( 0.2 ), top( 0.6 ),
	    left( 0.2 ), top( 0.4 ),
	    left( 0 ), top( 0 )
	);
	ctx.fill();
	// background second
	ctx.fillStyle = fillColor.multAlpha( 0.2 ).getCSS();
	ctx.beginPath();
	moveTo( left( 0 ), top( 0 ) );
	lineTo( left( 1 ), top( 0 ) );
	bezierCurveTo(
	    left( 0.6 ), top( 0.4 ),
	    left( 0.6 ), top( 0.6 ),
	    left( 1 ), top( 1 )
	);
	lineTo( left( 0 ), top( 1 ) );
	bezierCurveTo(
	    left( 0.4 ), top( 0.6 ),
	    left( 0.4 ), top( 0.4 ),
	    left( 0 ), top( 0 )
	);
	ctx.fill();
	// top first light
	ctx.fillStyle = fillColor.multAlpha( 0.9 ).getCSS();
	ctx.beginPath();
	moveTo( left( 0.3 ), top( 0 ) + 1 );
	bezierCurveTo(
//	    left( 0.4 ), top( 0.1 ),
	    left( 0.4 ), top( 0 ) + 2,
//	    left( 0.6 ), top( 0.1 ),
	    left( 0.6 ), top( 0 ) + 2,
	    left( 0.7 ), top( 0 ) + 1
	);
	ctx.fill();
	// top second light
	ctx.fillStyle = fillColor.multAlpha( 0.2 ).getCSS();
	ctx.beginPath();
	moveTo( left( 0.2 ), top( 0 ) + 1 );
	bezierCurveTo(
	    left( 0.4 ), top( 0.3 ),
	    left( 0.6 ), top( 0.3 ),
	    left( 0.8 ), top( 0 ) + 1
	);
	ctx.fill();
	// bottom first light
	ctx.fillStyle = fillColor.multAlpha( 0.9 ).getCSS();
	ctx.beginPath();
	moveTo( left( 0.3 ), top( 1 ) - 1 );
	bezierCurveTo(
//	    left( 0.4 ), top( 0.9 ),
	    left( 0.4 ), top( 1 ) - 2,
//	    left( 0.6 ), top( 0.9 ),
	    left( 0.6 ), top( 1 ) - 2,
	    left( 0.7 ), top( 1 ) - 1
	);
	ctx.fill();
	// bottom second light
	ctx.fillStyle = fillColor.multAlpha( 0.2 ).getCSS();
	ctx.beginPath();
	moveTo( left( 0.2 ), top( 1 ) - 1 );
	bezierCurveTo(
	    left( 0.4 ), top( 0.7 ),
	    left( 0.6 ), top( 0.7 ),
	    left( 0.8 ), top( 1 ) - 1
	);
	ctx.fill();
    }

    
}
