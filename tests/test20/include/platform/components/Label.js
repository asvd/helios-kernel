/*********************************************************************

  Label.js

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

     Defines  platform.components.Label component  which  represents a
     simple text  on the  screen.  Label is  inherited from  the Layer
     component, and  thus it provides all Layer's  properties, such as
     opacity and  backgroundColor.  Additionally, Label  contains text
     property which keeps Label's text value, and style porperty which
     is a structure with the following slots:
       - fontFamily
       - fontSize
       - fontWeight
       - fontStyle
       - color
       - textAlign
       - verticalAlign

     Allowed values  and meaning of these style  properties equals the
     ones for CSS.


 __Objects declared:__________________________________________________

 platform.components.Label              - simple rectangular component
 --platform.components.Label member public properties: ---------------
  style              - js.Property containing Label's style properties
  text                     - js.Property containing Label's text value
 --platform.components.Label member private methods: -----------------
  _applyStyle()                   - applies style change to the screen
  _applyText()                     - applies text change to the screen

*********************************************************************/

include( "Layer.js" );
include( "../../js/Property.js" );

init = function() {

    // shortcut alias
    var cs = platform.components;


    // Label constructor, creates a Layer and adds a styled text.
    //
    // Arguments:
    //  - parent is some other component who will host current one
    //  - geom contains initial geometry struc
    //  - zIndex is initial z-index value
    //  - visibility is initial visibility ("hidden" or "visible")
    //  - opacity is initial opacity value
    //  - backgroundColor is initial background color
    //  - text is a string with the label text
    //  - style is object keeping initial style values
    cs.Label = function( parent,
                         geom,
                         zIndex,
                         visibility,
                         opacity,
                         backgroundColor,
                         text,
                         style ) {
        // creating a DIV element and assigining its basic properties
        cs.Layer.call( this,
                       parent,
                       geom,
                       zIndex,
                       visibility,
                       opacity,
                       backgroundColor );

        // storing the text property
        var actualText = "";
        if ( typeof( text ) != "undefined" &&
             text != null ) {
            // converting everything to string
            actualText = "" + text;
        }
        this.text = new js.Property( actualText );

        // updating the text on property change
        this.text.sigChanged.listen( this._applyText, this );

        // initially setting the text label
        this._applyText();

        // this will prevent text selection for IE
        this._element.onselectstart = function() { return false; }

        // By default, we disable the text cursor.
        // TODO some API to  control this behaviour should be probably
        // provided.
        this._element.style.cursor = "default";

        // initializing the style
        var actualStyle = {
            fontFamily : "sans-serif",
            fontSize : "12px",
            fontWeight : "normal",
            fontStyle : "normal",
            color : "rgb(0,0,0)",
            textAlign : "left",
            verticalAlign : "top"
        };

        if ( typeof( style ) != "undefined" &&
             style != null ) {
            for ( var i in style ) {
                if ( typeof( actualStyle[ i ] ) != "undefined" ) {
                    actualStyle[ i ] = style[ i ];
                }
            }
        }

        this.style = new js.Property( actualStyle );

        // handling style change
        this.style.sigChanged.listen( this._applyStyle, this );

        // initailizing the style
        this._applyStyle();

    }
    cs.Label.prototype = new cs.Layer();


    // Applies style change to the screen
    cs.Label.prototype._applyStyle = function( oldStyle ) {
        var newStyle = this.style.get();
        for ( var i in newStyle ) {
            if ( typeof( oldStyle ) == "undefined" ||
                 newStyle[ i ] != oldStyle[ i ] ) {
                this._element.style[ i ] = newStyle[ i ];
            }
        }
    }


    // Applies Label text change to the screen
    cs.Label.prototype._applyText = function() {
        this._element.innerHTML = this.text.get();
    }


}
