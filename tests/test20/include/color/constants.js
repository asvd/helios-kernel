/*********************************************************************

  constants.js

  This file is part of color library for Helios JavaScript framework.

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

     Defines commonly used color constants.


 __Root objects declared:_____________________________________________



 __TODO:______________________________________________________________

 Create description above


*********************************************************************/


init = function() {

    // the namespace will keep color-related fucntions
    if ( typeof( color ) == "undefined" ) {
	color = {};
    }

    color.blackOpaque = "rgba(0,0,0,0)";

}
