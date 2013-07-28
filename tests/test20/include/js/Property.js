/*********************************************************************

  Property.js

  This  file  is  part  of  language  extensions  library  for  Helios
  framework.

 __Copying:___________________________________________________________

     Copyright 2008, 2009, 2010 Dmitry Prokashev

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

     Defines js.Property object  which represents some object property
     (such as widget's visibility,  availability or text field value).
     Property value can be either  an object or a simple type (string,
     number).

     Provides a setter, a getter and a sigChanged signal which is sent
     whenever a value  is actually changed.  If you  try to assign the
     value which equals current one, signal will not be sent.





     If  a Property value  is some  structure, you  can call  a setter
     providing an object argument which consists of some subset of all
     _value  slots, and  in this  case setter  will update  only these
     slots  of the  _value.  If  argument object  has some  slots that
     Property _value  does not have,  these slots will not  be created
     for a Property _value and  the values will not be assigned.  Thus
     you can't add new slots  to Property object value structure using
     setter.

     For now,  Property value cannot be  an Array, Date  or some other
     complicated object.

     Property value  cannot change its type.   If you try  to assign a
     value of  other type using  set(), nothing will happen.   Thus if
     you don't provide initial value  to the constructor, you will get
     a null Property and will not  be able to change Property value in
     the future.  This is okay  for prototype properties. But  you may
     change the type of the slots of the hash-type value.

     Constructor simply assigns its argument to the property value, so
     if this value is an object, and you want to use it somwhere else,
     take  care  of  cloning  it  before providing  as  a  constructor
     argument.

     Getter returns  a pointer to the value itself, so if the value is
     an object and you are going to modify it, take care of cloning it
     after fetching.

     When Property  _value is changed,  the sigChanged signal  is sent
     calling its subscribers with a  single argument - an old property
     value. This old value is cloned before the signal is sent, so you
     may safely modify it.


 __TODO:______________________________________________________________

     If value is  a string, probably all other  assigned values should
     be parsed instead of ignoring.

     Probably make sigChanged be  sent regardless on if newly assigned
     value is  the same  as one which  is already assigned  before. If
     done, remake the description above.

     Probably add support of other complicated property values object,
     such as  Array, Date  or other. If  done, remake  the description
     above.

     Probably  remake the  default behaviour  of  Property constructor
     which  creates  a  null-property  in  case of  no  initial  value
     given.  If done, remake  the description  above. Though,  this is
     still usefull for prototype properties.

     I still cannot  understand, why we should not  change the type of
     the property value,  but can change the type of  the slots of the
     hash-type value. If a reason for that is found, write about it in
     the comment. Suppose,  the behaviour should be the  same for both
     property value type and hash-typed value slot type.

 __Objects declared:__________________________________________________

 js.Property                                    - Property constructor
 --js.Property public properties: ------------------------------------
 sigChanged                   - signal sent whenever _value is changed
 --js.Property private properties: -----------------------------------
 _value                                         - keeps Property value
 --js.Property public methods: ---------------------------------------
 set()   - assigns a new value and sends sigChanged when value differs
 setSilent()            - same as set() but without sending sigChanged
 get()                  - returns the Property value (without copying)
 
*********************************************************************/

include( "js.js" );
include( "Signal.js" );
include( "base.js" );

init = function() {

    // Property constructor.
    //
    // Argument:
    //  - initialValue keeps the value which initializes the Property
    js.Property = function( initialValue ) {
        // do we need to initialize a value?
        if ( !initialValue &&
             // compare  the string  only in  case when  the  value is
             // probably  undefined (but it  may equal  0 and  in this
             // case previous condition is also true)
             typeof( initialValue ) == "undefined" ) {
            // initialValue is not set
            // creating a null Property
            this._value = null;
        } else {
	    // assigning a value
	    this._value = initialValue;
        }

        // sent by setter whenever the _value is actually changed
        this.sigChanged = new js.Signal();
    }


    // Setter, assigns some new value to the Property
    // Sends a sigChanged in case when _value is actually changed
    //
    // Argument:
    //  - newValue is a value to be assigned
    js.Property.prototype.set = function( newValue ) {
        // is value an Object?
        if ( this._value instanceof Object &&
             !( this._value instanceof Function ) ) {
            // _value is an Object, copying each property

            var i;

            // checking if some _value slot changed
            var valueChanged = false;
            for ( i in newValue ) {
                if ( i in this._value && // ignore missing properties
                     this._value[ i ] != newValue[ i ] ) {
                    // property changed
                    valueChanged = true;
                    break;
                }
            }

            if ( valueChanged ) {
		// backing up old value
		var oldValue = js.clone( this._value );

                // assigning values
                for ( i in newValue ) {
                    if ( i in this._value ) {
                        this._value[ i ] = newValue[ i ];
                    }
                }
                // notifying subscribers
                this.sigChanged.send( oldValue );
            }
        } else {
            // _value is not an object (or is a function)
            // simply assigning a value
            if ( this._value != newValue ) {
		var oldValue = this._value;
                this._value = newValue;
                this.sigChanged.send( oldValue );
            }
        }
    }


    // Getter, returns a current Property _value
    js.Property.prototype.get = function() {
        return this._value;
    }


}
