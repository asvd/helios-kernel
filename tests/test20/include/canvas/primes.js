/*********************************************************************

  primes.js

  This file is part of canvas extensions library for Helios framework.

 __Copying:___________________________________________________________

     Copyright 2008, 2009 Dmitry Prokashev

     Helios is free software: you can redistribute it and/or modify it
     under the terms of the GNU General Public License as published by
     the Free Software Foundation, either version 3 of the License, or
     (at your option) any later version.

     Helios is  distributed in  the hope that  it will be  useful, but
     WITHOUT  ANY  WARRANTY;  without  even the  implied  warranty  of
     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
     General Public License for more details.

     You should have received a copy of the GNU General Public License
     along with Helios.  If not, see <http://www.gnu.org/licenses/>.


 __Description:_______________________________________________________



 __Objects declared:__________________________________________________



*********************************************************************/

include( "../math/stuff.js" );

init = function() {

    // will keep canvas-related functions and objects
    if ( typeof( canvas ) == "undefined" ) {
	canvas = {}
    }

    // shortcut for better reading of this file
    var cnv = canvas;


    // Creates a rounded rectangular path
    //
    // Arguments:
    // - ctx is a canvas context to use
    // - x1, y1, x2, y2 are rectangle coordinates
    // - roundness is angle roundness in pixels
    // - type  (optional) can  be either  "topleft"  or "bottomright",
    //   allows skipping creating parts of the rectangle
    cnv.roundRect = function( ctx, rect, roundness, type ) {
	// obtaining absolute coordinates
	var x1 = rect.left;
	var y1 = rect.top;
	var x2 = x1 + rect.width;
	var y2 = y1 + rect.height;
	
	// roundness fixes
	var rnd;
	if ( typeof( roundness ) != "undefined" ) {
	    // roundness should be more than one
	    rnd = Math.max( roundness, 0 );

	    // and should not also exceed half of maximum dimension
	    rnd = Math.round( Math.min3(
		rnd,
		( x2 - x1 ) / 2,
		( y2 - y1 ) / 2
	    ));
	}

	// should we create rounded angles at all
	var r = ( rnd > 0 ? true : false );
	
	var pi = Math.PI;
	var pi_2 = Math.PI/2;
	var pi_4 = Math.PI/4;

	ctx.beginPath();

	var sine = rnd / Math.sqrt( 2 );
	if ( typeof( type ) == "undefined" ||
	     type != "bottomright" ) {
	    ctx.moveTo(x1+rnd+0.5-sine,y2-0.5-rnd+sine);
	    if(r) ctx.arc(x1+rnd+0.5,y2-rnd-0.5,rnd,pi_2+pi_4,pi,false);
	    ctx.lineTo(x1+0.5,y1+rnd+0.5);
	    if(r) ctx.arc(rnd+x1+0.5,rnd+y1+0.5,rnd,-pi,-pi_2,false);
	    ctx.lineTo(x2-rnd-0.5,y1+0.5);
	    if(r) ctx.arc(x2-rnd-0.5,y1+rnd+0.5,rnd,-pi_2,-pi_4,false);
	} else {
	    ctx.moveTo(x2-0.5-rnd+sine,y1+rnd+0.5-sine);
	}

	if ( typeof( type ) == "undefined" ||
	     type != "topleft" ) {
	    if(r) ctx.arc(x2-rnd-0.5,y1+rnd+0.5,rnd,-pi_4,0,false);
	    ctx.lineTo(x2-0.5,y2-rnd-0.5);
	    if(r) ctx.arc(x2-rnd-0.5,y2-rnd-0.5,rnd,0,pi_2,false);
	    ctx.lineTo(x1+rnd+0.5,y2-0.5);
	    if(r) ctx.arc(x1+rnd+0.5,y2-rnd-0.5,rnd,pi_2,pi_2+pi_4,false);
	}


    }

    
}
