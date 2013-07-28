/*********************************************************************

   Pipe.js

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

     Defines color.Pipe object which represents a color and provides a
     set of methods for easy color manipulation.

     The object is  called Pipe because all its  methods do not modify
     the object itself,  instead providing a clone of  the object with
     some property modified. So you can use expressions like:

       myPipe.setHue(100).setGreen(200).setAlpha(0.5).getCSS();

     - this  will return  the  CSS string  representing the  resulting
     modified color.

     Pipe object keeps color representation in its .rgb property which
     is a {red, green, blue} structure.


 __Root objects declared:_____________________________________________

 color.getPipe()         - creates and returns initialized Pipe object
 color.Pipe                              - object representing a color
 ---Pipe object methods: ---------------------------------------------
 Pipe::clone()         - returns a new Pipe object cloning the current
 Pipe::getCSS() - returns a string containing CSS color representation
 Pipe::getRGB()           - returns an RGB color struct representation
 Pipe::getHSL()           - returns an HSL color struct representation
 Pipe::setRGB()           - assignes some given RGB value to the color
 Pipe::setRed()                  - assignes the value of a red channel
 Pipe::setGreen()              - assignes the value of a green channel
 Pipe::setBlue()                - assignes the value of a blue channel
 Pipe::setAlpha()              - assignes the value of a alpha channel
 Pipe::multAlpha()           - multiplies the value of a alpha channel
 Pipe::setHSL()           - assignes some given HSL value to the color
 Pipe::setHue()                  - assignes the value of a hue channel
 Pipe::setSaturation()    - assignes the value of a saturation channel
 Pipe::setLuminance()      - assignes the value of a luminance channel
 Pipe::addHue()                   - adds some value to the hue channel
 Pipe::addSaturation()     - adds some value to the saturation channel
 Pipe::addLuminance()       - adds some value to the luminance channel
 Pipe::multSaturation()      - multiplies the saturation by some value
 Pipe::multLuminance()        - multiplies the luminance by some value
 Pipe::blendWith()    - mixes the color with another one in given rate


*********************************************************************/

include( "base.js" );

init = function() {

    // color namespace is defined in base.js


    // Pipe object constructor.
    //
    // Argument:
    // - initialValue (optional) is an initial value for the color, it
    //   can be  in any type  (another Pipe object,  string containing
    //   color  code in  either HTML  or  CSS format,  or a  structure
    //   keeping  color in  either  RGB or  HSL representation).  When
    //   argument omitted, creates the default black opaque color).
    color.Pipe = function( initialValue ) {
	// filling the initial value
        this.rgba = color.getRGB( initialValue );
    }


    // Simply clones the pipe
    color.Pipe.prototype.clone = function() {
	return color.Pipe( this );
    }

    
    // Returns a string containing CSS color representation
    color.Pipe.prototype.getCSS = function() {
	return color.getCSS( this );
    }

    
    // Returns an RGB struct color representation
    color.Pipe.prototype.getRGB = function() {
	return color.getRGB( this );
    }

    
    // Returns an HSL struct color representation
    color.Pipe.prototype.getHSL = function() {
	return color.getHSL( this );
    }

    
    // Returns  a new  color.Pipe  object initialized  with given  RGB
    // value.
    //
    // Argument:
    // - arg is a {red, green, blue, alpha} struct
    color.Pipe.prototype.setRGB = function( arg ) {
	return new color.Pipe( arg );
    }

    
    // Returns a new color.Pipe object with red channel set to desired
    // value and other channels taken from the current color.
    //
    // Argument:
    // - arg is a desired red channel value
    color.Pipe.prototype.setRed = function( arg ) {
	var result = new color.Pipe( this );
	result.rgba.red = color.limitChannel( arg );
	return result;
    }

    
    // Returns  a new  color.Pipe  object with  green  channel set  to
    // desired value and other channels taken from the current color.
    //
    // Argument:
    // - arg is a desired green channel value
    color.Pipe.prototype.setGreen = function( arg ) {
	var result = new color.Pipe( this );
	result.rgba.green = color.limitChannel( arg );
	return result;
    }

    
    // Returns  a  new color.Pipe  object  with  blue  channel set  to
    // desired value and other channels taken from the current color.
    //
    // Argument:
    // - arg is a desired blue channel value
    color.Pipe.prototype.setBlue = function( arg ) {
	var result = new color.Pipe( this );
	result.rgba.blue = color.limitChannel( arg );
	return result;
    }


    // Returns  a new  color.Pipe  object with  alpha  channel set  to
    // desired value and other channels taken from the current color.
    //
    // Argument:
    // - arg is a desired alpha channel value
    color.Pipe.prototype.setAlpha = function( arg ) {
	var result = new color.Pipe( this );
	result.rgba.alpha = color.limitAlphaChannel( arg );
	return result;
    }

    
    // Returns a  new color.Pipe object with  alpha channel multiplied
    // to  desired value  and other  channels taken  from  the current
    // color.
    //
    // Argument:
    // - arg is a desired alpha channel multiplicator
    color.Pipe.prototype.multAlpha = function( arg ) {
	var result = new color.Pipe( this );
	var oldAlpha;
	if ( typeof( result.rgba.alpha ) == "undefined" ) {
	    oldAlpha = 1;
	} else {
	    oldAlpha = result.rgba.alpha;
	}
	result.rgba.alpha = color.limitAlphaChannel( arg * oldAlpha );
	return result;
    }

    
    // Returns  a new  color.Pipe  object initialized  with given  HSL
    // value.
    //
    // Argument:
    // - arg is a {hue, saturation, luminance, alpha} struct
    color.Pipe.prototype.setHSL = function( arg ) {
	return new color.Pipe( arg );
    }

    
    // Returns a  new color.Pipe  object with its  hue set  to desired
    // value and other HSL channels taken from the current color.
    //
    // Argument:
    // - arg is a desired hue value
    color.Pipe.prototype.setHue = function( arg ) {
	var hsl = color.getHSL( this );
	var hue = parseInt( arg );
	// switching the value until we get between 0 and 255
	while ( hue > color.channelMax ) { hue -= color.channelMax; }
	while ( hue < 0 ) { hue += color.channelMax; }
	hsl.hue = hue;
	return new color.Pipe( hsl );
    }


    // Returns  a new  color.Pipe object  with its  saturation  set to
    // desired  value and other  HSL channels  taken from  the current
    // color.
    //
    // Argument:
    // - arg is a desired saturation value
    color.Pipe.prototype.setSaturation = function( arg ) {
	var hsl = color.getHSL( this );
	hsl.saturation = color.limitChannel( arg );
	return new color.Pipe( hsl );
    }


    // Returns  a new  color.Pipe  object with  its  luminance set  to
    // desired  value and other  HSL channels  taken from  the current
    // color.
    //
    // Argument:
    // - arg is a desired luminance value
    color.Pipe.prototype.setLuminance = function( arg ) {
	var hsl = color.getHSL( this );
	hsl.luminance = color.limitChannel( arg );
	return new color.Pipe( hsl );
    }


    // Returns  a  new color.Pipe object whoose hue  value is obtained
    // by adding provided value with the hue value.
    //
    // Argument:
    // - arg is a number to add to the current hue value
    color.Pipe.prototype.addHue = function( arg ) {
	var hsl = color.getHSL( this );
	return this.setHue( hsl.hue + arg );
    }


    // Returns  a  new  color.Pipe object  whoose saturation  value is
    // obtained by adding provided value with the saturation value.
    //
    // Argument:
    // - arg is a number to add to the current saturation value
    color.Pipe.prototype.addSaturation = function( arg ) {
	var hsl = color.getHSL( this );
	return this.setSaturation( hsl.saturation + arg );
    }


    // Returns  a  new  color.Pipe  object whoose  luminance value  is
    // obtained by adding provided value with the luminance value.
    //
    // Argument:
    // - arg is a number to add to the current luminance value
    color.Pipe.prototype.addLuminance = function( arg ) {
	var hsl = color.getHSL( this );
	return this.setLuminance( hsl.luminance + arg );
    }

    
    // Returns  a  new  color.Pipe object  whoose saturation  value is
    // obtained  by  multiplying provided  value  with the  saturation
    // value.
    //
    // Argument:
    // - arg is a number to add to the current saturation value
    color.Pipe.prototype.multSaturation = function( arg ) {
	var hsl = color.getHSL( this );
	return this.setSaturation( hsl.saturation * arg );
    }

    
    // Returns  a  new  color.Pipe  object whoose  luminance value  is
    // obtained  by  multiplying  provided  value with  the  luminance
    // value.
    //
    // Argument:
    // - arg is a number to add to the current luminance value
    color.Pipe.prototype.multLuminance = function( arg ) {
	var hsl = color.getHSL( this );
	return this.setLuminance( hsl.luminance * arg );
    }


    // Blends the color Pipe with another color provided in any format
    //
    // - secondColor is a color to  blend with current provided in any
    //   form (struct or string or Pipe)
    // - rate defines how  close is result to the  secondColor and how
    //   far from the current color, when omitted defaults to 0.5
    color.Pipe.prototype.blendWith = function( secondColor, rate ) {
	return new color.Pipe( color.blendRGB( this, secondColor, rate ) );
    }

    // Creates initialized color.Pipe object instance.
    //
    // Argument:
    // - initialValue (optional) is an initial value for the color, it
    //   can be  in any type  (another Pipe object,  string containing
    //   color  code in  either HTML  or  CSS format,  or a  structure
    //   keeping  color in  either  RGB or  HSL representation).  When
    //   argument omitted, creates the default black opaque color).
    color.getPipe = function( initialValue ) {
	return new color.Pipe( initialValue );
    }


}
