/*********************************************************************

  Engine.js

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

     Defines    heliwidgets.Engine   object    which    keeps   widget
     representation routines.

     Engine object also keeps  a themeProperties which contain a graph
     of theme properties used when widgets are created.


 __Objects declared:__________________________________________________

 heliwidgets.engines                   - an object which keeps engines
 heliwidgets.Engine                               - Engine constructor
 --heliwidgets.Engine public properties: -----------------------------
  themeProperties                  - keeps a graph of theme properties
  themeDefaults         - a set of default values for theme properties
 --heliwidgets.Engine public methods: --------------------------------
  addThemeProp()                  - adds a theme property to the graph

*********************************************************************/

include( "heliwidgets.js" );
include( "ThemeProperty.js" );

init = function() {

    // a shorter name for better reading of this file
    var hw = heliwidgets;


    // Engine constructor, does nothing =)
    hw.Engine = function() {
	// keeps a graph of ThemeProperties for the Engine
	this.themeProperties = {};
        // will keep default values of theme properties
        this.themeDefaults = {};

    }

    // Adds a theme property to the themeProperties and returns it.
    //
    // Argument:
    // - name is a string containing a name of the created property
    // - generate  is  a  function  which recalculates  the  value  by
    //   provided parent values
    // - parents is array of strings with parents names
    hw.Engine.prototype.addThemeProp = function( name, generate, parents ) {
	var newProperty = this.themeProperties[ name ] =
	    new hw.ThemeProperty( name, this, generate, parents );
        
        // generating default value for the property
        var defaultValues = {};
        if ( typeof( parents ) != "undefined" ) {
            for ( var i = 0; i < parents.length; i++ ) {
                defaultValues[ parents[ i ] ] = this.themeDefaults[ parents[ i ] ];
            }
        }
        this.themeDefaults[ name ] = newProperty.generate( defaultValues );
    }

    
    // An object which keeps engines
    hw.engines = {}

    
}
