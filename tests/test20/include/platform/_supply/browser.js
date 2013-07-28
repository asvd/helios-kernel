/*********************************************************************

  browser.js

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

     Defirens    platform._supply.browser     object    which    keeps
     browser-related supplimentary routines.

 __Objects declared:__________________________________________________

 platform._supply.browser keeps browser-related supplimentary routines
 platform._supply.browser.isIE    - keeps true when user agent is MSIE

*********************************************************************/

include( "_supply.js" );

init = function() {

    platform._supply.browser = {}

    platform._supply.browser.isIE = false;
    if ( typeof navigator != 'undefined' ) {
        platform._supply.browser.isIE = (/MSIE/.test(navigator.userAgent) &&
                                         !window.opera );
    }
    

}
