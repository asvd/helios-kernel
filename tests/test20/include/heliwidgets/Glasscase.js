/*********************************************************************

  Glasscase.js

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

     Defines heliwidgets.Glasscase widget  which is a rectangular area
     covered with a  glass designed to represent some  data which user
     can not interract with directly.

 __Objects declared:__________________________________________________

 heliwidgets.Glasscase                  - Glasscase widget constructor

*********************************************************************/

include( "heliwidgets.js" );
include( "Frame.js" );


init = function() {

    // keeps heliwidgets routines
    // a shorter name for better reading of this file
    var hw = heliwidgets;


    var glasscaseResource = {
	children: [
	    {
		type : hw.Frame,
		frameType : "glass",
                zIndex : 1,
		geometry: { left: 0, top: 0, right: 0, bottom: 0 }
	    }
	]
    }

    // Glasscase constructor
    //
    // Argument:
    // - initStruc (opt.) is a structure to initialize widget with
    hw.Glasscase = function( initStruct ) {
	hw.Frame.call( this, glasscaseResource );
        this.frameType.set( "lower" );
	this.initWithResource( initStruct );
    }
    hw.Glasscase.prototype = new hw.Frame();

    
}
