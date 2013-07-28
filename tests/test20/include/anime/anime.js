/*********************************************************************

  anime.js

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

     Defines anime object  which contains anime library implementation
     objects.
  

 __Objects declared:__________________________________________________

 anime                         - contains anime library implementation
 anime.fps       - js.Property, default fps for newly anime.Properties
 anime._delay         - delay between the two animation frames in msec


*********************************************************************/

include( "../js/Property.js" );

init = function() {
    
    if ( typeof( anime ) == "undefined" ) {
        anime = {};
    }
    
    // Defines the  default FPS (frames per second)  value.  All newly
    // created  anime.Property instances  will have  their FPS  set to
    // this value.
    anime.fps = new js.Property( 40 );

    // Delay between two frames in msec, depends on fps
    anime._delay = Math.round( 1000 / anime.fps.get() );

    // updating delay on fps change
    anime.fps.sigChanged.listen( function() {
        anime._delay = Math.round( 1000 / anime.fps.get() );
    } );


}
