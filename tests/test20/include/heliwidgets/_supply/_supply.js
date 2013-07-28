/*********************************************************************

  _supply.js

  This file is part of Helios JavaScript framework.

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

     Defines  heliwidgets._supply  object  which will  contain  supply
     routines for the heliwidgets toolkit.
  

 __Objects declared:__________________________________________________

 heliwidgets._supply       - heliwidgets toolkit supplimentery objects

*********************************************************************/

include( "../heliwidgets.js" );

init = function() {
    
    if ( typeof( heliwidgets._supply ) == "undefined" ) {
        heliwidgets._supply = {};
    }
    
}
