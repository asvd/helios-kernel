/*********************************************************************

  base.js

  This  file  is  part  of  language  extensions  library  for  Helios
  framework.

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

     Defines some general usefull routines.


 __Root objects declared:_____________________________________________

 js.clone()                             - recursively clones an object


 __TODO:______________________________________________________________

 - js.clone() seems to support only structures, not objects


*********************************************************************/

include( "js.js" );

init = function() {

    // Recursively clones a structure and returns the result.
    //
    // Argument:
    //  - source is an object to clone
    js.clone = function( source ) {
	// checking source type
	if ( source instanceof Array ) {
	    // cloning an array
	    var result = [];
	    for ( var i = 0; i < source.length; i++ ) {
		result[ i ] = js.clone( source[ i ] );
	    }
	    return result;
	    
	} else if ( source instanceof Object ) {
	    // cloning a structure
	    var result = {};
	    for ( var i in source ) {
		result[ i ] = js.clone( source[ i ] );
	    }
	    return result;
	    
	} else {
	    // simple type is copied on return
	    return source;
	}
    }


    // Faster equivalent of typeof( smth ) != "undefined" condition.
    //
    // Instead of:
    //  if ( typeof( smth ) != "undefined" )
    // use:
    //  if ( js.isDefined( smth ) )
    js.isDefined = function( arg ) {
        return  ( arg || ( typeof( arg ) != "undefined" ) ) ? true : false;
    }




}
