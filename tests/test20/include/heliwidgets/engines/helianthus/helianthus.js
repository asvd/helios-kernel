/*********************************************************************

  helianthus.js

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

     Performs necessary actions to initialize helianthus engine.  This
     file   creates   an    Engine   instance   with   all   necessary
     routines.  Creates  a fake  rootWidget  object  which  is a  root
     widgets  for  placing  other  widgets  on  it  and  also  defiens
     hwdigets.getRootWidget() function to fetch that area.

 __Objects declared:__________________________________________________

 heliwidgets.engines.helianthus           - default heliwidgets engine
 heliwidgets.engines.helianthus.rootWidget - root widget to host other



*********************************************************************/

include( "../../heliwidgets.js" );
include( "../../Engine.js" );
include( "../../ThemeProperty.js" );
include( "../../Widget.js" );
include( "../../../color/base.js" );
include( "../../../color/Pipe.js" );
include( "../../../color/constants.js" );
include( "../../../platform/components/rootLayer.js" );
include( "../../../platform/components/Layer.js" );
include( "../../../js/base.js" );

init = function() {

    // creating helianthus
    heliwidgets.engines.helianthus = new heliwidgets.Engine();

    // a shorter name for better reading of this file
    var helianthus = heliwidgets.engines.helianthus;

    // Creating a  rootWidget, an initial  root widget where  the user
    // can  host others  widget.  Since  rootWidget is  a  bit special
    // widget in many ways (it  has no parent, its geometry should fit
    // into  the  browser window  and  so on),  it  will  be hacked  a
    // little. We'll make  it looking like an ordinary  widget as much
    // as possible.

    var rootWidget = helianthus.rootWidget = new heliwidgets.Widget();

    var rootLayer = platform.components.rootLayer;

    if ( !rootLayer ) return;
    var geom = rootLayer.geometry.get();

    // rootWidget's layers
    var Layer = platform.components.Layer;
    // third argument is z-index
    rootWidget._layer = new Layer( rootLayer, geom, 0 );
    rootWidget._created = true;

    // hacking the rootWidget.geometry object

    // it should not be possible to set rootWidget's geometry
    rootWidget.geometry.set = function() { return false; }

    // and its getter always returns the rootWidget dimensions
    rootWidget.simpleGeometry.get = function() {
	return rootWidget._layer.geometry.get();
    }

    rootWidget.geometry.get = function() {
        var geom = js.clone( rootWidget._layer.geometry.get() );
        geom.center = geom.right = geom.middle = geom.bottom = null;
        return geom;
    }

    // sigSimpleChanged should be sent whenever browser window resized
    rootWidget.simpleGeometry.sigChanged = rootLayer.geometry.sigChanged;

    // and we have also resize the layer along with the browser
    var applyRootWidgetGeometry = function() {
        rootWidget._layer.geometry.set( rootLayer.geometry.get() );
    }
    rootLayer.geometry.sigChanged.listen( applyRootWidgetGeometry )

    // we should also listen to the theme change in a usual way
    var applyRootWidgetTheme = function() {
	rootWidget._layer.backgroundColor.set(
            rootWidget.getThemeProp( "primaryColor" )
        );
    }
    rootWidget.sigThemeChanged.listen( applyRootWidgetTheme );


    // setting default engine for the rootWidget
    rootWidget.engine = helianthus;

    // creating heliwidgets.getRootWidget() function
    heliwidgets.getRootWidget = function() {
	return heliwidgets.engines.helianthus.rootWidget;
    }


    // Setting engine theme properties -------------------------------

    // Beware  no to create  circular dependences,  they will  hang up
    // everything since there is no check for that

    // primaryColor defines the main color of the widgets
    //
    // defaults to helios kernel background
    helianthus.addThemeProp(
        "primaryColor",
        function() {
            return color.getCSS( "#aabbcc" );
        }
    );


    // darkTheme  defines whether  color theme  calculation algorithms
    // and widget painting algorithms  should work for creating a dark
    // theme. In the  case of dark theme, some  colors are inversed to
    // increase contrast and representation.
    //
    // calculated as true whenever  primaryColor is dark enough, false
    // otherwise
    helianthus.addThemeProp(
        "darkTheme",
        function( arg ) {
            if ( color.getPipe( arg.primaryColor ).getHSL().luminance > 100 ) {
                return false;
            } else {
                return true;
            }
        },
        [ "primaryColor" ]
    );

    // secondaryColor defines  the color of different  active parts of
    // the widget, such as button background
    //
    // defaults to a bit changed primaryColor
    helianthus.addThemeProp(
        "secondaryColor",
        function( arg ) {
	    return color.getPipe( arg.primaryColor ).addHue( -65 ).getCSS();
        },
        [ "primaryColor" ]
    );


    // highlightColor  is  always brighter  than  the secondary  color
    // regardless on whether darkTheme is true.
    //
    // generated value is a primaryColor moved towards white
    helianthus.addThemeProp(
        "highlightColor",
        function( arg ) {
	    if ( arg.darkTheme == true ) {
	        // dark theme
	        var primaryColorHSL = color.getPipe( arg.primaryColor ).getHSL();
	        return color.getPipe( arg.primaryColor ).addHue( -4 ).addLuminance( 120 ).multSaturation(
		    1 / (1.9*(1-primaryColorHSL.luminance/255))
	        ).addSaturation( -24 ).getCSS();
	    } else {
	        // normal theme
	        return color.getPipe( arg.primaryColor ).addHue( -4 ).setSaturation( 70 ).addLuminance( 100 ).getCSS();
	    }
        },
        [ "primaryColor", "darkTheme" ]
    );

    // shadowColor is  always darker than the  primary color regardles
    // on whether darkTheme is true.
    //
    // generated value is a primaryColor on 3/4 closer to the black
    helianthus.addThemeProp(
        "shadowColor",
        function( arg ) {
	    if ( arg.darkTheme == true ) {
	        // dark theme
	        return color.getPipe( arg.primaryColor ).addLuminance( -90 ).addSaturation( -90 ).getCSS();
	    } else {
	        // normal theme
	        return color.getPipe( arg.primaryColor ).addLuminance( -100 ).setSaturation( 60 ).getCSS();
	    }
        },
        [ "primaryColor", "darkTheme" ]
    );


    // cornerRoundness  defines   the  value  of   rounding  different
    // rectangular forms' edges
    //
    // defaults to 2
    helianthus.addThemeProp(
        "cornerRoundness",
        function() {
            return 2;
        }
    );

    // buttonCornerRoundness  defines the  value of  rounding button's
    // rectangle
    //
    // defaults to cornerRoundness
    helianthus.addThemeProp(
        "buttonCornerRoundness",
        function( arg ) {
            return arg.cornerRoundness;
        },
        [ "cornerRoundness" ]
    );

    // frameCornerRoundness  defines  the  value of  rounding  frame's
    // rectangle
    //
    // defaults to cornerRoundness
    helianthus.addThemeProp(
        "frameCornerRoundness",
        function( arg ) {
            return arg.cornerRoundness;
        },
        [ "cornerRoundness" ]
    );


    // buttonInnerBigShadow defines  whether a button has  a big inner
    // shadow
    //
    // defaults to true
    helianthus.addThemeProp(
        "buttonInnerBigShadow",
        function() {
            return true;
        }
    );

    // buttonInnerBigShadowSize defines the  button area size occupied
    // by the shadow, valid values are 0 to 0.5
    //
    // defaults to 0.4
    helianthus.addThemeProp(
        "buttonInnerBigShadowSize",
        function() {
            return 0.4;
        }
    );

    // fontSize
    //
    // defaults to 12
    helianthus.addThemeProp(
        "fontSize",
        function() {
            return 12;
        }
    );

    // fontFamily
    //
    // defaults to sans-serif
    helianthus.addThemeProp(
        "fontFamily",
        function() {
            return "sans-serif";
        }
    );

    // fontWeight
    //
    // defaults to normal
    helianthus.addThemeProp(
        "fontWeight",
        function() {
            return "normal";
        }
    );

    // labelTextAlign
    //
    // defaults to left
    helianthus.addThemeProp(
        "labelTextAlign",
        function() {
	    return "left";
        }
    );


}
