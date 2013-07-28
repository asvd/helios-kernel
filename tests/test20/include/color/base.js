/*********************************************************************

  base.js

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

     Defines simple routines for color manipulation.


 __Root objects declared:_____________________________________________

 color                              - object contianing color routines
 ---color namespace static functions: --------------------------------
  limitChannel()            - crops the value to fit between 0 and 255
  limitAlphaChannel()         - crops the value to fit between 0 and 1
  str2RGB()                     - converts color string into RGB struc
  str2HSL()                     - converts color string into HSL struc
  RGB2str()             - converts color RGB struc into a color string
  HSL2str()             - converts color HSL struc into a color string
  getCSS()           - returns CSS color representation from given any
  getRGB()           - returns RGB struc representation from given any
  getHSL()           - returns HSL struc representation from given any
  blend()                       - blends two colours with a given rate
  RGB2HSL()                        - converts RGB struct to HSL struct
  HSL2RGB()                        - converts HSL struct to RGB struct


 __TODO:______________________________________________________________

 - Probably add function for generating gradients
 - Add support of short HTML color notation ("#ABC")


*********************************************************************/

include( "../math/stuff.js" );
include( "../js/base.js" );

init = function() {

    // the namespace will keep color-related fucntions
    color = {};

    // statically keeps the maximum value for the channel
    color.channelMax = 255;
    color.channelAlphaMax = 1;


    // Checks and corrects color channel  value (to palce it between 0
    // and color.channelMax).
    //
    // Returns corrected value.
    //
    // Argument:
    //  - value is a color intensity to be corrected
    color.limitChannel = function( value ) {
        return Math.crop( parseInt( value ), 0, color.channelMax );
    }


    // Same as limitChannel but for alpha channel
    //
    // Argumnet:
    //  - value is a value of alpha channel to be corrected
    color.limitAlphaChannel = function( value ) {
	return Math.crop( parseFloat( value ), 0, color.channelAlphaMax );
    }
    
    
    // Converts  string  containing color  specified  whether in  HTML
    // format  ("#AABBCC")  or  in  CSS format  ("rgb(50,100,150)"  or
    // "rgba(50,100,150,0.5)")  to the struct  containing a  field for
    // each channel in RGB space.
    //
    // Argument:
    //  - str is a string containing a color specification
    color.str2RGB = function(){return{red:0,green:0,blue:0}}
    
    
    color.str2RGB_ = function( str ) {
        var result = {};

        // check whether format is HTML or CSS
        if ( str[ 0 ] == "#" ) {
            // parse "#AABBCC" string

            // exctracting each channel
            var red   = str.substring( 1, 3 );
            var green = str.substring( 3, 5 );
            var blue  = str.substring( 5, 7 );
            
            // converting hexademical string to integer
            result.red = parseInt( "0x" + red );
            result.green = parseInt( "0x" + green );
            result.blue = parseInt( "0x" + blue );

        } else if ( str.substring( 0, 4 ) == "rgba" ) {
            // parsing 'rgba(r,g,b,a)' string

            // removing rubish from head and tail
            var colors = str.substring( 5, str.length - 1 );
            
            // splitting channels
            var colorsArr = colors.split(",");

            result.red = color.limitChannel( colorsArr[ 0 ] );
            result.green = color.limitChannel( colorsArr[ 1 ] );
            result.blue = color.limitChannel( colorsArr[ 2 ] );
            result.alpha = parseFloat( colorsArr[ 3 ] );
        } else if ( str.substring( 0, 4 ) == "rgb(" ) {
            // parsing 'rgb(r,g,b)' string

            // removing rubish from head and tail
            var colors = str.substring( 4, str.length - 1 );
            
            // splitting channels
            var colorsArr = colors.split(",");

            result.red = color.limitChannel( colorsArr[ 0 ] );
            result.green = color.limitChannel( colorsArr[ 1 ] );
            result.blue = color.limitChannel( colorsArr[ 2 ] );
        }

        return result;
    }


    // Converts  string  containing color  specified  whether in  HTML
    // format  ("#AABBCC")  or  in  CSS format  ("rgb(50,100,150)"  or
    // "rgba(50,100,150,0.5)")  to the struct  containing a  field for
    // each channel in HSL space.
    //
    // Argument:
    //  - str is a string containing a color specification
    color.str2HSL = function( str ) {
        return color.RGB2HSL( color.str2RGB( str ) );
    }



    // Converts a color  struct with channel values in  RGB space into
    // the  string  containing  the  color  specified  in  CSS  format
    // ("rgb(50,100,150)"   or   "rgba(50,100,150,0.5)",  depends   on
    // whether alpha  is defined) so it  can be assigned  to the theme
    // properties.
    //
    // Argument:
    //  - col is a struct {red, green, blue, alpha}
    color.RGB2str = function( col ) {
        if ( typeof ( col.alpha ) == "undefined" ||
	     col.alpha == 1) {
	    // color  specified without  alpha channel  (or  the alpha
	    // channel equals  1, this is usefull since  at the moment
	    // Opera can not render text with rgba color specified)
            return ( "rgb(" +
		     col.red + "," +
                     col.green + "," +
                     col.blue + ")" );
        } else {
            // color specified with the alpha channel
            return ( "rgba(" +
		     col.red + "," +
                     col.green + "," +
                     col.blue + "," +
                     col.alpha + ")" );
        }
    }

    // Converts a color  struct with channel values in  RGB space into
    // the  string  containing  the  color  specified  in  CSS  format
    // ("rgb(50,100,150)"   or   "rgba(50,100,150,0.5)",  depends   on
    // whether alpha  is defined) so it  can be assigned  to the theme
    // properties.
    //
    // Argument:
    //  - col is a struct {hue, saturation, luminance, alpha}
    color.HSL2str = function( col ) {
        return color.RGB2str( color.HSL2RGB( col ) );
    }


    // Returns CSS color string representation from given any.
    //
    // Argument:
    // - arg is a color in any format
    color.getCSS = function( arg ) {
	if ( color.Pipe &&
	     arg instanceof color.Pipe ) {
	    // color.Pipe instance provided
	    return color.getCSS( arg.rgba );
        } else if ( typeof( arg.red ) != "undefined" ) {
            // RGB struc provided
            return color.RGB2str( arg );
        } else if ( typeof( arg.hue ) != "undefined" ) {
            // HSL struc provided
            return color.HSL2str( arg );
        } else {
            // string provided
            return color.RGB2str( color.str2RGB( arg ) );
        }
    }

    
    // Returns color RGB struc representation from given any.
    //
    // Argument:
    // - arg is a color in any format
    color.getRGB = function( arg ) {
	if ( !arg ) {
	    // arg is not provided, generating default value
	    // (black opaque)
	    return { red: 0, green: 0, blue: 0, alpha : 0 };
	} else if ( color.Pipe  &&
	            arg instanceof color.Pipe ) {
	    // color.Pipe instance provided
	    return js.clone( arg.rgba );
        } else if ( typeof( arg.red ) != "undefined" ) {
            // RGB struc provided
            return arg;
        } else if ( typeof( arg.hue ) != "undefined" ) {
            // HSL struc provided
            return color.HSL2RGB( arg );
        } else {
            // string provided
            return color.str2RGB( arg );
       }
    }


    // Returns color HSL struc representation from given any.
    //
    // Argument:
    // - arg is a color in any format
    color.getHSL = function( arg ) {
	if ( color.Pipe &&
	     arg instanceof color.Pipe ) {
	    // color.Pipe instance provided
	    return color.getHSL( arg.rgba );
        } else if ( typeof( arg.red ) != "undefined" ) {
            // RGB struc provided
            return color.RGB2HSL( arg );
        } else if ( typeof( arg.hue ) != "undefined" ) {
            // HSL struc provided
            return arg;
        } else {
            // string provided
            return color.str2HSL( arg );
        }
    }


    // Blends  two given  RGB colors  in  a linear  way.  Returns  the
    // resulted RGB struct.
    //
    // Arguments:
    // - color1 and  color2 are  two colors to  blend provided  in any
    //   form (struct or string or Pipe)
    // - rate defines  how close is result  to the color2  and how far
    //   from the color1, when omitted defaults to 0.5
    color.blendRGB = function( color1, color2, rate ) {
        var col1 = color.getRGB( color1 );
        var col2 = color.getRGB( color2 );

        var rat;
        if ( typeof( rate ) == "undefined" ) {
            rat = 0.5;
        } else {
            rat = rate;
        }

        var result = {};

        result.red = col1.red + Math.round( ( col2.red - col1.red ) * rat );
        result.green = col1.green + Math.round( ( col2.green - col1.green ) * rat );
        result.blue = col1.blue + Math.round( ( col2.blue - col1.blue ) * rat );

	// checking if we need to blend alpha channel
	if ( typeof( col1.alpha ) != "unedfined" ||
	     typeof( col2.alpha ) != "undefined" ) {
	    
	    if ( typeof( col1.alpha ) == "undefined" ) {
		col1.alpha = 1.0;
	    }
	    
	    if ( typeof( col2.alpha ) == "undefined" ) {
		col2.alpha = 1.0;
	    }
	    
            result.alpha = col1.alpha + ( col2.alpha - col1.alpha ) * rat;
	}

        return result;
    }


    // Blends  two given  RGB colors  in  a linear  way.  Returns  the
    // resulted color in CSS string.
    //
    // Arguments:
    // - color1 and  color2 are  two colors to  blend provided  in any
    //   form (struct or string or Pipe)
    // - rate defines  how close is result  to the color2  and how far
    //   from the color1, when omitted defaults to 0.5
    color.blend = function( color1, color2, rate ) {
	return color.getCSS( color.blend( color1, color2, rate ) );
    }



    // Converts RGB to HSL color representation
    //
    // Argument:
    // - arg  is a  {red,  green, blue}  struct  which may  optionally
    //   contain alpha  property (in this  case this property  will be
    //   copied to returned alpha property)
    var h_6 = color.channelMax / 6;  // tmp static variable, hue range / 6
    color.RGB2HSL = function( arg ) {
        // shortcuts
        var r = arg.red;
        var g = arg.green;
        var b = arg.blue;
        
        // number of color permutation
        // (after sorting color channels)
        // 0 = bgr
        // 1 = brg
        // 2 = rbg
        // 3 = rgb
        // 4 = grb
        // 5 = gbr
        var permutation;

        // calcualting permutation
             if ( b <= g && g <= r ) permutation = 0;
        else if ( b <= r && r <= g ) permutation = 1;
        else if ( r <= b && b <= g ) permutation = 2;
        else if ( r <= g && g <= b ) permutation = 3;
        else if ( g <= r && r <= b ) permutation = 4;
        else                         permutation = 5;

        // sorting color channels
        var min = r;
        var mid = g;
        var max = b;
        var tmp;
        if ( min > mid ) { tmp = min; min = mid; mid = tmp; }
        if ( mid > max ) { tmp = mid; mid = max; max = tmp; }
        if ( min > mid ) { tmp = min; min = mid; mid = tmp; }

        // hue
        var H;

        if ( max == min ) {
            H = 0;
        } else {
            // direction depends on permutation
            if ( permutation == 0 ||
                 permutation == 2 ||
                 permutation == 4 ) {
                H = Math.round(
                    h_6 * (
                        ( mid - min ) / ( max - min ) + permutation
                    )
                );
            } else {
                H = Math.round(
                    h_6 * (
                        ( max - mid ) / ( max - min ) + permutation
                    )
                );
            }
        }

        // luminance
        var L = Math.round( ( max + min ) / 2 );

        // saturation
        var S;
	if ( L == 0 ) {
	    S = 0;
	} else if ( L < 128 ) {
            S = Math.round( color.channelMax * ( L - min ) / L );
        } else {
	    if ( color.channelMax == L ) {
		S = 0;
	    } else {
		S = Math.round( color.channelMax * ( max - L ) / ( color.channelMax - L ) );
	    }
        }

        if ( typeof( arg.alpha ) == "undefined" ) {
            return {
                hue : H,
                saturation : S,
                luminance : L
            };
        } else {
            return {
                hue : H,
                saturation : S,
                luminance : L,
                alpha : arg.alpha
            };
        }
    }

    
    // Converts HSL to RGB color representation
    //
    // Argument:
    // - arg  is  a  {hue,  saturation, luminance}  struct  which  may
    //   optionally contain alpha property (in this case this property
    //   will be copied to returned alpha property)
    color.HSL2RGB = function( arg ) {
        // shortcuts
        var h = arg.hue;
        var s = arg.saturation;
        var l = arg.luminance;
        
        // number of color permutation
        // (after sorting color channels)
        // 0 = bgr
        // 1 = brg
        // 2 = rbg
        // 3 = rgb
        // 4 = grb
        // 5 = gbr
        var permutation = Math.floor( h / h_6 );

        // this happens when h == color.channelMax
        if ( permutation == 6 ) {
            permutation = 0;
            h = 0;
        }

        // normalized difference between min and mid
        var hue_part = ( h - permutation * h_6 ) / h_6;

        // half of range between max and min color channels
        var mrange;
        if ( l < 128 ) {
            mrange = l * s / color.channelMax;
        } else {
            mrange = (color.channelMax - l) * s / color.channelMax;
        }

        // sorted color channels
        min = Math.round( l - mrange  );
        max = Math.round( mrange + l );
        if ( permutation == 0 ||
             permutation == 2 ||
             permutation == 4 ) {
            mid = Math.round( min + hue_part * mrange * 2 );
        } else {
            mid = Math.round( max - hue_part * mrange * 2 );
        };

        // unsorting color channels
        var R;
        var G;
        var B;
        switch ( permutation ) {
        case 0 : B = min; G = mid; R = max; break;
        case 1 : B = min; R = mid; G = max; break;
        case 2 : R = min; B = mid; G = max; break;
        case 3 : R = min; G = mid; B = max; break;
        case 4 : G = min; R = mid; B = max; break;
        case 5 : G = min; B = mid; R = max;
        }

        if ( typeof( arg.alpha ) == "undefined" ) {
            return {
                red: R,
                green : G,
                blue : B
            };
        } else {
            return {
                red : R,
                green : G,
                blue : B,
                alpha : arg.alpha
            };
        }
        
    }



}
