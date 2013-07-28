/*********************************************************************

  cssgeom.js

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

     Defines supplimentary routines  for geometry manipulations widely
     used in helianthus widget rendering engine.


*********************************************************************/

include( "_supply.js" );

init = function() {


    if ( typeof( heliwidgets.engines.helianthus._supply.cssgeom ) == "undefined" ) {
	heliwidgets.engines.helianthus._supply.cssgeom = {};
    }

    var cssgeom = heliwidgets.engines.helianthus._supply.cssgeom;


    // Expands given rectangle by number of px's
    //
    // Arguments:
    // - rect is a {top, left, width, height} struct
    // - size is a number of pixels to expand the rectangle
    cssgeom.expandRect = function( rect, size ) {
	var newrect = js.clone( rect );
	newrect.top -= size;
	newrect.left -= size;
	newrect.width += 2*size;
	newrect.height += 2*size;

	return newrect;
    }

    // Shrinks given  rectangle by number of px's.  Same as expandRect
    // but wice versa.
    //
    // Arguments:
    // - rect is a {top, left, width, height} struct
    // - size is a number of pixels to shrink the rectangle
    cssgeom.shrinkRect = function( rect, size ) {
	return cssgeom.expandRect( rect, -size );
    }

    
    // Moves a given rectangle to the given position
    //
    // Arguments:
    // - rect is a {top, left, width, height} struct
    // - newLeft and newTop are new left and top values
    cssgeom.moveRect = function( rect, newLeft, newTop ) {
	var newrect = js.clone( rect );
	newrect.left = newLeft;
	newrect.top = newTop;

	return newrect;
    }

    
}