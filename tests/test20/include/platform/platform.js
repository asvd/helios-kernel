/*********************************************************************

  platform.js

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

     Defines   platform  object  which   will  contain   Platform  API
     implementation objects.  The only object declared  in this source
     is platform namespace object.   All specific Platform API objects
     are defined in their own source files.

     Proposed description of the Platform API follows.

     For the browser version of Helios, Platform is the only library
     which interracts with the browser directly. All other libraries
     should use the Platform library API.

     Clipboard API library (not yet written):
      - contains API for interacting with system clipboard

     Keyboard API (not yet written):
     - contains Signals for the keyboard keypress events

     Components library:
     - contains a set of object  providing API for creating visuals on
       the screen
     - each   component  contain   geometry,  z-index   and  visiblity
       properties
     - each component could be created whether in memory,
     - or could be assigned to some other parent component
     - thus each Component should have appendChild() and removeChild()
       methods
     - each component should also have a remove() method which will
       remove the component from its parent (if there is one), and
       remove the component itself from the memory
     - Components library contains the following components:
     Layer:
     - component for arranging visual objects
     - additionally contains opacity and backgroundColor properties
     rootLayer:
     - object  which corresponds  to the  whole  application (browser)
       window, and provides Layer API.
     Canvas:
     - component for drawing vector graphics on the screen
     - contains getContext() method providing canvas API
     Label:
     - component for drawing short text labels on the screen
     - contains style property with the next slots:
       - fontFamily
       - fontSize
       - fontWeight
       - fontStyle
       - color
       - textAlign
       - verticalAlign
     MouseListener
     - component for listening mouse events
     - contains event signals:
       - sigMouseOver
       - sigMouseOut
       - sigMouseDown
       - sigMouseUp
       - sigClick
     - contains  listenCoordinates()   method  wich  enables  position
       tracking and creates the:
       - mousePosition Property
  

 __Objects declared:__________________________________________________

 platform     - contains platform-dependent API implementation objects

*********************************************************************/

init = function() {
    
    if ( typeof( platform ) == "undefined" ) {
        platform = {};
    }
    
}
