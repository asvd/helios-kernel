/*********************************************************************

  ThemeProperty.js

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

     Defines  heliwidgets.ThemeProperty object  which  represents some
     property of the  engine theme.  It keeps all  its dependences and
     all properties who  depend on it. It also  keep its default value
     and  a method  to  regenerate  its value  from  the given  parent
     properties.


 __Objects declared:__________________________________________________

 heliwidgets.ThemeProperty       - represents an engine theme property
 ThemeProperty::setParents()       - sets a list of parents properties


*********************************************************************/

include( "heliwidgets.js" );

init = function() {

    // a shorter name for better reading of this file
    var hw = heliwidgets;


    // ThemeProperty constructor
    //
    // Argument:
    //  - name is a name of the property, equals the object name
    //  - engine is an engine whoose theme property is the object
    //  - generate (opt.) is a value recalculation function
    //  - parents (opt.) is an array of strings with parent names
    hw.ThemeProperty = function( name,
                                 engine,
                                 generate,
                                 parents ) {

	this.name = name;
	this.engine = engine;

        // list of names of properties on which this one depends
        this.parentNames = new Array();

        // setting parents if provided
        if ( parents ) {
            this.setParents( parents );
        }

        // list of names of properties which depend on this one
        this.childNames = new Array();

        // should be redefined for instances
        // argument is an object with parent properties values
        // returns generated value
        this.generate = generate || function(){ return null; }

    }


    // Adds a list of parents to the current property
    //
    // Argument:
    //  - parents is an array of strings each containing parent name
    hw.ThemeProperty.prototype.setParents = function( parents ) {
	for ( var i = 0; i < parents.length; i++ ) {

	    // adding parent to the list of parents
	    this.parentNames.push( parents[ i ] );

	    // adding this to the parent's list of children
	    this.engine.themeProperties[ parents[ i ] ].childNames.push( this.name );

	}
    }


    
}
