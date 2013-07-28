/*********************************************************************

  Signal.js

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

     Defines  js.Signal   object  which  implements   Observer  design
     pattern. It allows calling  subscribed methods whenever send() is
     called.  By convention, Signal instances are named as "sigEvent",
     where  "Event" is a  name of  an event  which occurs  causing the
     signal to be sent (e.g.: button1.sigClicked).

     Signal::listeners  array contains  all  subscribed methods  along
     with the objects to which  these methods should be applied (which
     equal 0 in  case of functions instead of methods),  and a list of
     arguments  that  should be  always  provided  to the  subscripted
     function  (read  above  about  arguments  behaviour).   For  each
     listener, its method is available as mySignal.listeners[i].method
     (where  i equals  listener  index), its  object  is available  as
     mySignal.listeners[i].object.   Each  listener  also  contain  an
     optional      array      of      arguments     (available      as
     mySignal.listeners[i].arguments).

     When  subscribing some  function  to the  Signal, programmer  may
     prefer to give a set of arguments which should always be provided
     to   the   subscripted   function   whenever  Signal   is   sent.
     Signal::listen()  method's first two  arguments should  contain a
     method  and an  object to  subscribe  to the  Signal.  All  other
     arguments  are  stored  to the  mySignal.listeners[i].arguments[]
     array,  and whenever  Signal  is sent,  these  arguments will  be
     provided to the subscripted function.

     Optional  way to  provide  arguments to  the  subscriptors is  to
     send() a  Signal and give it  these arguments. In  this case, all
     arguments provided to Signal::send()  method will be forwarded to
     all subscribers.

     Listener specific arguments (provided to the listen() method when
     subscribing  a function)  have higher  priority to  the arguments
     provided to the send() method.  Thus, if some Signal is sent with
     arguments, and  some listener subscripted to that  Signal has its
     own arguments provided  by subscription, the subscripted function
     will get a set of arguments which will contain first the listener
     specific arguments,  and all arguments provided to  the send() at
     the tail of the arguments list.


 __Root objects declared:_____________________________________________

 js.Signal                         - constructor for the signal object
 Signal::listen()   - subscribes some function or method to the signal
 Signal::unlisten()             - unsubscribes some function or method
 Signal::send()      - sends a signal calling all subscribed functions
 Signal::isSubscribed()        - checks whether function is subscribed


 __TODO:______________________________________________________________

 - Undefined listener should be reported somehow

 - Write about arguments priority in the manual and API

 - Probably  some  debug  output  to  the console  which  will  notify
   programmer that argument of object and method are wrong.

 - Probably  add  support  for  subscribing string  expressions  to be
   evalled

*********************************************************************/

include( "js.js" );
include( "base.js" );

init = function() {

    
    // Signal constructor
    js.Signal = function() {
        // list of subscripted functions
        this.listeners = new Array();
    }


    // Sends a signal (applies all subscriber's methods)
    // Arguments are forwared to the listeners.
    js.Signal.prototype.send = function() {
        var i;

        // cloning because we cannot concat() with arguments
        var args = new Array();
        for ( i = 0; i < arguments.length; i++ ) {
            args[ i ] = arguments[ i ];
        }
        
        // calling each subscripted function
        for ( i = 0; i < this.listeners.length; i++ ) {
            this.listeners[ i ].method.apply(
                this.listeners[ i ].object,
                // arguments provided  during subscription have higher
                // priority than arguments provided to send()
                this.listeners[ i ].arguments.concat( args )
            );
        }
    }


    // Finds the provided listener  in the listeners[] array, returnes
    // its index or null in case when listener is not in the array.
    //
    // Argument:
    //  - listener  is an  array  with object,  method an  arguments[]
    //    slots
    js.Signal.prototype.getListenerIdx = function( listener ) {
        var idx = null;

        var arg; // used as arguments counter
        // searching through listeners[]
        for ( var i = 0; i < this.listeners.length; i++ ) {
            if ( this.listeners[ i ].method == listener.method &&
                 this.listeners[ i ].object == listener.object ) {
                // found  one   with  the  same   object  and  method,
                
                // comparing arguments
                for ( arg = 0; arg < listener.arguments.length; arg++ ) {
                    if ( typeof( this.listeners[ i ].arguments[ arg ] ) == "undefined" ||
                         this.listeners[ i ].arguments[ arg ] != listener.arguments[ i ] ) {
                        // argument does not match, continuing
                        continue;
                    }
                }

                // vice-versa
                for ( arg = 0; arg < this.listeners[ i ].arguments.length; arg++ ) {
                    if ( typeof( listener.arguments[ arg ] ) == "undefined" ||
                         this.listeners[ i ].arguments[ arg ] != listener.arguments[ i ] ) {
                        // argument does not match, continuing
                        continue;
                    }
                }

                // at  this point,  if  continue was  not issued,  all
                // arguments  match  and thus  we  found  the  desired
                // listener
                idx = i;
                break;
            }
        }

        return idx;
    }


    // Generates a new listener struct from arguments usually provided
    // to listen() and unlisten() methods.
    //
    // Arguments:
    //  - method is some  method or a static function  which should be
    //    called whenever signal is sent
    //  - object is an  object for which the desired  method should be
    //    called,  may equal  null or  be  ommited in  case of  static
    //    function
    //  - all other argumetns are treated as a listener arguments
    js.Signal.prototype.createListener = function( method, object ) {

        var newListener = {
            object : object || null,
            method : method,
            arguments : new Array()
        }

        // attaching provided arguments
        if ( arguments.length > 2 ) {
            // running through extra arguments
            for ( var i = 2; i < arguments.length; i++ ) {
                // adding argument as a listener argument
                newListener.arguments.push( arguments[ i ] );
            }
        }

        return newListener;

    }


    // Connects some function to the signal.
    //
    // Arguments:
    //  - method is some  method or a static function  which should be
    //    called whenever signal is sent
    //  - object is an  object for which the desired  method should be
    //    called,  may equal  null or  be  ommited in  case of  static
    //    function
    //  - all other argumetns are treated as a listener arguments
    js.Signal.prototype.listen = function( method, object ) {
        // generating a listener from given arguments
        var newListener = this.createListener.apply( this, arguments );

        // checking  if generated  newListener already  exists  in the
        // listeners array
        if ( this.getListenerIdx( newListener ) != null ) {
            // listener already exists, do not subscribe twice
            return;
        }
        
        // adding new listener to the array
        this.listeners.push( newListener );

    }

    
    // Removes a function from the listeners. Arguments should equal
    // the ones given to subscribe().
    //
    // Arguments:
    //  - method is some  method or a static function  which should be
    //    removed from the subscription
    //  - object is an  object for which the desired  method should be
    //    unsubscribed may equal null or  be ommited in case of static
    //    function
    //  - all other argumetns are treated as a listener arguments
    js.Signal.prototype.unlisten = function( method, object ) {
        // generating a listener from given arguments
        var listener = this.createListener.apply( this, arguments );

        // checking if the listener exists in the listeners[] array
        var idx = this.getListenerIdx( listener );

        // removing a listener if there is one
        if ( idx != null ) {
            this.listeners.splice( idx, 1 );
        }

    }


    // Returns  true whenever  given  function (or  object method)  is
    // subscribed, false otherwise
    //
    // Arguments:
    //  - method is some  method or a static function  which should be
    //    checked whether it is subscribed to the signal
    //  - object is an  object for which the desired  method should be
    //    called,  may equal  null or  be  omitted in  case of  static
    //    function
    js.Signal.prototype.isSubscribed = function( method, object ) {
        // generating a listener from given arguments
        var listener = this.createListener.apply( this, arguments );

        // checking if the listener exists in the listeners[] array
        var idx = this.getListenerIdx( listener );

        return ( idx != null );
    }


    
}
