/*********************************************************************

  components.js

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

     Defines platform.components namespace object which will contain a
     set of Components objects.

 __Objects declared:__________________________________________________

 platform.components            - Platform Components namespace object

*********************************************************************/

include( "../platform.js" );

init = function() {
    
    if ( typeof( platform.components ) == "undefined" ) {
        platform.components = {};
    }
    
}
