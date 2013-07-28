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

     Defines heliwidgets.engines.helianthus._supply  object which will
     contain  supply  routines  for  the helianthus  widget  rendering
     engine.
  

 __Objects declared:__________________________________________________

 heliwidgets.engines.helianthus._supply        - supplimentery objects

*********************************************************************/

include( "../helianthus.js" );

init = function() {
    
    if ( typeof( heliwidgets.engines.helianthus._supply ) == "undefined" ) {
        heliwidgets.engines.helianthus._supply = {};
    }
    
}
