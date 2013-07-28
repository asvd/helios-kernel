/*********************************************************************

  kernel.js

  This file is part of Helios JavaScript framework.

 __Copying:___________________________________________________________

     Copyright 2010 Dmitry Prokashev

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


 __Objects declared:_________________________________________________

 include()  - notifies kernel about currently parsed module dependence
 init()                    - keeps currently parsed module initializer
 uninit()                - keeps currently parsed module uninitializer
 kernel              - contains modules loading and unloading routines
 --kernel public objects: --------------------------------------------
  moduleStates          - a list of possible states of a kernel.Module
  messageTypes          - a list of possible types of a kernel message
  Module                            - type, represents a single module
  Message                          - type, represents a kernel message
 --kernel public functions: ------------------------------------------
  getModules()                   - returns a list of all known modules
  getStatistics()         - returns an array with modules states stats
  getMessages()                    - returns a list of kernel messages
  load()                 - starts module and its dependences including
  unload()          - starts module and its unused dpes uninitializing
 --kernel private objects: -------------------------------------------
  _thread()        - calls a function (method) in an asynchronious way
  _Signal                            - observer pattern implementation
  _modules[]          - a list of all known modules (even unload()'ed)
  _statistics[]              - an array with modules states statistics
  _messages[]                       - a list of helios kernel messages
  _activeModule                              - currently parsed module
  _inlcudeQueue[]           - a list of modules which should be parsed
 --kernel private fucntions: -----------------------------------------
  _getAbsolute()  - converts a relative path of the module to absolute
  _requireModule()                         - performs module including
  _unrequireModule()                 - performs module unintialization
  _parseNext()                                   - module parsing loop

 --kernel.Module public properties: ----------------------------------
  path                                - full path to the module source
  state     - current state of the module (one of kernel.moduleStates)
  children[]                - list of modules which depend on this one
  parents[]        - list of modules which are include()'d by this one
  loadedTimes                - number of time the module was load()'ed
 --kernel.Module public methods: -------------------------------------
  getStatistics()   - same as kernel.getStatistics(), but for a module
 --kernel.Module private properties: ---------------------------------
  _stateChanged    - kernel._Signal object sent on module state change
  _initCallbacks[]  - list of callbacks to launch after initialization
  _uninitCallbacks[]                       - same for uninitialization
  _state                         - shortcut to the kernel.moduleStates
 --kernel.Module private methods: ------------------------------------
  _initializer()                            - module's init() function
  _uninitializer()                        - module's uninit() function
  _addChild()                         - adds a new child to the module
  _subscribe()   - subscribes module to parents' and children' signals
  _getChildrenMaxState()   - returns the maximum state of all children
  _getParentsMinState()     - returns the minimum state of all parents
  _setState()                   - sets a module into the desired state
  _parentsUpdated()       - callback for parents' _stateChanged signal
  _childrenUpdated()     - callback for children' _stateChanged signal
  _startParsing()                - intializes module's parsing process
  _finalizeParsing()  - subscribed to the module's script onload event



 __TODO:______________________________________________________________
 - add statistics (both common and per-modular)

 - describe  in  comments (and  in  API guide)  that  if  a module  is
   unload()'ed before  it has finished load()'ing,  the load callbacks
   are not called (but not vice versa)


*********************************************************************/



// Keeps everything related to the helios kernel
kernel = {}


/********************************************************************\
  kernel._thread (supplimentary routine, not part of the kernel API)
\********************************************************************/

/**
 * @function kernel._thread() will start a function (or a method) in a
 * new "thread" (in an asynchronious way)
 *
 * @argument func is a function to call (or method to apply)
 * @argument obj is an object to which to apply to method (omit or set
 * to null if you need just to call a function)
 *
 * @example:
 *   kernel._thread( myFunction, myObject );
 * will perform the following expression in a new "thread":
 *   myObject.myFunction();
 */
kernel._thread = function( func, obj ) {
    kernel.__threads.push( [ func, obj || null ] );
    window.postMessage( kernel.__startThreadMsg, "*" );
}

// Threading supplimentary routines
kernel.__threads = []; // a list of pending threads
kernel.__startThreadMsg = "helios-kernel-start-thread";
kernel.__startThread = function( event ) {
    if ( event.source == window &&
         event.data == kernel.__startThreadMsg ) {
        if ( kernel.__threads.length > 0 ) {
            var thread = kernel.__threads.shift();
            thread[ 0 ].apply( thread[ 1 ] );
        }
    }
}
window.addEventListener("message", kernel.__startThread, true );



/********************************************************************\
  kernel._Signal (supplimentary routine, not part of the kernel API)
\********************************************************************/

/**
 * @type kernel._Signal()  implements the observer  pattern. Object of
 * this   type   allows   signal  subscription,   unsubscritpion   and
 * sending.   Signal    is   always   sent    asynchroniously   (using
 * kernel._thread() function).
 *
 * @example:
 *   var mySignal = new kernel._Signal();
 *   var myCallback = function() { alert("calling back!"); }
 *   mySignal.listen( myCallback );
 *   mySignal.send(); // will call myCallback()
 *   mySignal.unlisten( myCallback );
 *   mySignal.send(); // will do nothing
 */
kernel._Signal = function() {
    this._listeners = []; // list of listeners
}

/**
 * @function send() will send a signal which will call all subscripted
 * functions (methods)
 */
kernel._Signal.prototype.send = function() {
    for ( var i = 0; i < this._listeners.length; i++ ) {
        kernel._thread( this._listeners[i][0], this._listeners[i][1] );
    }
}

/**
 * @function listen() will subscribe a function (method along with its
 * object to apply this method to) to the signal.
 *
 * @argument method is a function to call when signal is sent
 * @argument object is an object to apply method to
 */
kernel._Signal.prototype.listen = function( method, object ) {
    this._listeners.push( [ method, object || null ] );
}

/**
 * @function  unlisten() will  unsubscribe  the method  from a  signal
 * (along with  its object). The  arguments should exactly  match ones
 * passed to the listne() method when subscribing.
 *
 * @argument method is a function to unsubscribe
 * @argument object is an object to unsubscribe
 */
kernel._Signal.prototype.unlisten = function( method, object ) {
    for ( var i = 0; i < this._listeners.length; i++) {
        if ( this._listeners[i][0] == method &&
             this._listeners[i][1] == object ) {
                 break;
        }
    }
    this._listeners.splice( i, 1 );
}



/********************************************************************\
  Helios kernel public API
\********************************************************************/

/**
 * @function include() notifies kernel about some module requires some
 * other one.
 */
include = function( path ) {
    if ( kernel._activeModule ) {
        kernel._requireModule(
            kernel._getAbsolute( path ),
            kernel._activeModule,
            null
        );
    } // TODO add error handling
}


/**
 * These two  functions are reserved  and should be defined  as module
 * initializer and uninitializer.
 *
 * @function  init() is a  name of  an initializer  of a  module; this
 * function  is called  when the  module  is loaded  (parsed) and  all
 * modules which  it depends  on are loaded  and parsed  (their init()
 * function finished).
 *
 * @function uninit()  is a name of  an initializer of  a module; this
 * function is  called when the module  is not needed  anymore and all
 * his  dependant  modules  are  uninitialized (uninit()  function  is
 * called for them all).
 */
init = function(){};
uninit = function(){};


/**
 * @object kernel.moduleStates keeps a  list of the possible states of
 * a module
 */
kernel.moduleStates = {
    created        : 0, // not parsed yet
    including      : 1, // being parsed at the moment
    idle           : 2, // uninitialized and not used
    uninitializing : 3, // uninitializer is started, not finished
    waiting        : 4, // parsed; waits for parents to initialize
    initializing   : 5, // initializer is started, not finished
    ready          : 6  // parsed, initialized and ready to use
}


/**
 * @object  kernel.messageTypes keeps a  list of  types of  the kernel
 * messages
 */
kernel.messageTypes = {
    info    : 0,
    warning : 1,
    error   : 2
}


/**
 *  @function  kernel.getModules()  returns a  list  of known  modules
 * (stored in  kernel._modules) (including uninitialized  and thus not
 * used).
 */
kernel.getModules = function() {
    return kernel._modules;
}


/**
 * @function kernel.getStatistics() returns a statistics array (stored
 * in kernel._statistics) which contains  a numbers of modules in each
 * state.
 */
kernel.getStatistics = function() {
    return kernel._statistics;
}


/**
 * @function  kernel.getMessages() returns a  list of  kernel messages
 * (stored in kernel._messages)
 */
kernel.getMessages = function() {
    return kernel._messages;
}


/**
 * @function  kernel.load() performs (asynchroniously)  a load  of the
 * desired module  along with all its  not-loaded-yet dependences, and
 * initializes them  in order of dependence. After  the desired module
 * itself  is loaded  (parsed)  and initialized  (its init()  function
 * finished), the callback() function is started.
 *
 * @argument path  is absolute  (starting from "http://")  or relative
 * path to the module source
 * @argument callback is a function  which is called whenever a module
 * is loaded and initalized
 *
 * @returns the requested module object
 */
kernel.load = function( path, callback ) {
    return kernel._requireModule( path, null, callback );
}


/**
 * @function kernel.undload()  performs an unitialization  of a module
 * in case when  it has no more dependant modules and  a module has an
 * unitializer defined.  After a module is uninitialized, the callback
 * function is called.  If a module was not  initialized, the callback
 * is called anyway.
 *
 * @argument path is absolute or relative path to the module source
 * @argument callback is a function to call when done
 */
kernel.unload = function( path, callback ) {
    kernel._unrequireModule( path, callback )
}



/********************************************************************\
  kernel.Module object
\********************************************************************/

/**
 * @type  kernel.Module represents  a  helios module.   Should not  be
 * initialized from a userspace, instead a module is created when user
 * calls include() or kernel.load() methods.
 *
 *
 * @property path of the module (abs. or related to the main module)
 * @property state of the module, one of the kernel.moduleStates
 * @property children is an array of dependend modules
 * @property parents is an array  of modules which current depends on
 */
kernel.Module = function( path ) {
    this.path = path;
    this.state = this._states.created;
    this.children = [];
    this.parents = [];
    this.loadedTimes = 0;
    this._stateChanged = new kernel._Signal();
    this._initCallbacks = [];
    this._uninitCallbacks = [];
    kernel._modules.push( this );
    kernel._includeQueue.push( this );
    if ( !kernel._activeModule ) {
        kernel._parseNext();
    }
}
kernel.Module.prototype._states = kernel.moduleStates;  // a shortcut


/**
 * @function getStatistics()
 *
 * TODO: implement
 */
kernel.Module.prototype.getStatistics = function() {
}

/**
 * @function  _addChild()  adds  new  connection  between  parent  new
 * module.
 *
 * @argument child is a new module which depends on this
 */
kernel.Module.prototype._addChild = function( child ) {
    this.children.push( child );
    child.parents.push( this );
}


/**
 * @function  _subscribe() makes  module  to listen  its parents'  and
 * children' signals.  After calling  this method, the module actually
 * start   his  "life  in   community"  and   updates  his   state  in
 * correspondance  to  parents'  and  children' states.   Module  also
 * subscribes his parents to his signals (but only in case parents are
 * already parsed).  It also  subscribes on signals of those children,
 * who  have been  parsed in  the past  and have  not  subscribed this
 * module to their signals due to  this module had not yet been parsed
 * itself at the moment of their _subscribe() call.
 */
kernel.Module.prototype._subscribe = function() {
    for ( var i = 0; i < this.parents.length; i++ ) {
        this.parents[ i ]._stateChanged.listen(
            this._parentsUpdated,
            this );
        if ( this.parents[ i ].state > this._states.including ) {
            this._stateChanged.listen(
                this.parents[ i ]._childrenUpdated,
                this.parents[ i ] );
        }
    }

    for ( i = 0; i < this.children.length; i++ ) {
        if ( this.children[ i ].state > this._states.including ) {
            this.children[ i ]._stateChanged.listen(
                this._childrenUpdated,
                this );
        }
    }
}


/**
 * @function _getChildrenMaxState() returns  the maximum of the states
 * of all module's children.  This  is some kind of requirement to the
 * state of  this module: if at  least one child changes  his state to
 * "waiting", the  module has to start initialization  if possible, or
 * otherwise switch to waiting state itself.
 *
 * @returns the maximum of the states of children
 */
kernel.Module.prototype._getChildrenMaxState = function() {
    // if a module was loaded, we always require it
    var state = this.loadedTimes > 0 ?
        this._states.waiting :this._states.created;
    for ( var i = 0; i < this.children.length; i++ ) {
        if ( this.children[ i ].state > state ) {
            state = this.children[ i ].state;
        }
    }
    return state;
}


/**
 * @function _getParentsMinState()  returns the minimum  of the states
 * of  all module's parents.  This is  some kind  of permission  for a
 * module  to its  maximum  state:  the module  can  never exceed  the
 * parent's state, and thus if at  least one of the parents is not yet
 * initialized, the module cannot be initialized.
 *
 * @returns the minimum of the states of parents
 */
kernel.Module.prototype._getParentsMinState = function() {
    var state = this._states.ready;
    for ( var i = 0; i < this.parents.length; i++ ) {
        if ( this.parents[ i ].state < state ) {
            state = this.parents[ i ].state;
        }
    }
    return state;
}


/**
 * @function _setState()  sets the module  state to the  desired value
 * (without checking if it is  allowed by the parent's state) and also
 * actually calls initializer and  uninitializer function in case when
 * the desired state is to initialize or to initialize.
 *
 * @argument state is a desired state for a module
 */
kernel.Module.prototype._setState = function( state ) {
    this.state = state;
    this._stateChanged.send();

    switch ( state ) {
    case this._states.including :
        this._startParsing();
        // other part of the logic is in _finalizeParsing() method
        break;
    case this._states.idle :
        // init callbacks should be cleared here
        // (if they persist, load()'ing was interrupted)
        this._initCallbacks = [];
        break;
    case this._states.uninitializing :
        this._uninitializer();
        // check if the module still not needed
        if ( this._getChildrenMaxState() > this._states.idle ) {
            this._setState( this._states.initializing );
        } else {
            this._setState( this._states.idle );
        }
        break;
    case this._states.initializing :
        this._initializer();
        // check if the module is still needed
        if ( this._getChildrenMaxState() > this._states.idle ) {
            this._setState( this._states.ready );
        } else {
            // ignore callbacks in this case
            this._initCallbacks = [];
            this._setState( this._states.uninitializing );
        }
        break;
    case this._states.ready :
        // calling all needed callbacks
        while ( this._initCallbacks.length > 0 ) {
            ( this._initCallbacks.shift() )();
        }
        break;
    }
}


/**
 * @function  _parentsUpdated() is a  callback for  a state  change of
 * some parent. This  does something usefull only in  case when all of
 * the  parents are  initialized (ready  state)  and in  this case  it
 * starts initialization of the module. Otherwise it does nothing.
 */
kernel.Module.prototype._parentsUpdated = function() {
    switch ( this._getParentsMinState() ) {
    case this._states.ready :
        if ( this.state == this._states.waiting ) {
            this._setState( this._states.initializing );
        }
        break;
    }
}


/**
 * @function _childrenUpdated()  is a callback  for a state  change of
 * some child. If all of the children are in idle state, the module is
 * not needed anymore and it goes for uninitialization itself. If some
 * of the children changed its  state to waiting, the module is needed
 * once  again,   and  its  starts  the   initialization  if  possible
 * (otherwise it goes waiting itself).
 */
kernel.Module.prototype._childrenUpdated = function() {
    switch ( this._getChildrenMaxState() ) {
    case this._states.created:
    case this._states.including:
    case this._states.idle :
        if ( this.state == this._states.waiting ) {
            this._setState( this._states.idle )
        } else if ( this.state == this._states.ready ) {
            this._setState( this._states.uninitializing );
        }
        break;
    case this._states.waiting :
        if ( this.state == this._states.idle ) {
            if ( this._getParentsMinState() == this._states.ready ) {
                this._setState( this._states.initializing );
            } else {
                this._setState( this._states.waiting );
            }
        }
    }
}


/**
 * @function  _startParsing() starts  the module  parsing  process. It
 * actually creates  the <script> element in the  head (which launches
 * parsing process) and  schedules kernel._parseNext() function to the
 * onload event.
 */
kernel.Module.prototype._startParsing = function() {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = this.path;
    script.onload = function() { kernel._activeModule._finalizeParsing(); }
    document.getElementsByTagName("head").item(0).appendChild(script);
}



/**
 * @function _finalizeParsing()  performs a  set of actions  after the
 * module  is parsed.  It  is subscribed  to the  onload event  of the
 * included  script.    This  function  stores   the  initializer  and
 * uninitializer,  subscribes  the module  to  parents' and  children'
 * signal and finds out what to do next (depending on state of parents
 * and children). It also tells kernel about it start parsing the next
 * module (calling the kernel._parseNext function).
 */
kernel.Module.prototype._finalizeParsing = function() {
    this._initializer = init;
    this._uninitializer = uninit;
    kernel._parseNext();
    this._subscribe();
    if ( this._getChildrenMaxState() == this._states.idle ) {
        // module is not needed anymore
        this._setState( this._states.idle );
    } else if ( this._getParentsMinState() == this._states.ready ) {
        // parents are initialized
        this._setState( this._states.initializing );
    } else {
        // parents are not yet initialized
        this._setState( this._states.waiting );
    }
}



/********************************************************************\
  kernel.Message object
\********************************************************************/

kernel.Message = function() {
}


/********************************************************************\
  Helios kernel private stuff
\********************************************************************/
kernel._modules = []; // known modules list, including uninitialized
kernel._statistics = [ 0, 0, 0, 0, 0, 0, 0 ]; // mods Nr in each state
kernel._messages = []; // kernel messages list
kernel._activeModule = null; // module which is parsed at the moment
kernel._includeQueue = [];  // list of modules to be included


kernel._getAbsolute = function( path ) {
    if ( path.substr( 0, 7 ) != "http://" ) {
        var activePath = kernel._activeModule.path;
        path = activePath.substr( 0, activePath.lastIndexOf("/") + 1 )
            + path;
    } // path starting from http:// treated as absolute

    // clearing sequences such as "foobar/../"
    var newPath = path;
    do {
        path = newPath;
        newPath = path.replace( /[\w\.~]*\/\.\.\//, "" );
    } while ( newPath != path );

    return path;
}



/**
 * @function  kernel._requireModule()  is  a  generalized  version  of
 * include() and kernel.load() functions.
 *
 * @argument path (absolute) to the module source
 * @argument child  is a module who  include()'d this one  (or null if
 * module was load()'ed)
 * @argument callback is a function to call after initialization
 *
 * @returns created or existing module with the corresponding path
 */
kernel._requireModule = function( path, child, callback ) {
    var module = null;
    // searching if a module is already known
    for ( var i = 0; i < kernel._modules.length; i++ ) {
        if ( path == kernel._modules[ i ].path ) {
            module = kernel._modules[ i ];
            break;
        }
    }

    if ( module == null ) {
        // module have not been created yet, creating
        module = new kernel.Module( path );
    }

    if ( child ) {
        // TODO check for circual dependences here
        module._addChild( child );
    } else {
        module.loadedTimes++;
    }

    if ( callback ) {
        module._initCallbacks.push( callback );
    }

    if ( module.state >= module._states.idle ) {
        module._childrenUpdated();
    }

    // if nothing changed we need to call the callback
    if ( module.state == module._states.ready ) {
        while ( module._initCallbacks.length > 0 ) {
            ( module._initCallbacks.shift() )();
        }
    }

    return module;
}

/**
 * @function kernel._unrequireModule() makes know that a module is not
 * required   anymore   (usually   decreases   loadedTimes   counter),
 * initializes a module (if it is possible) and calls a callback.
 *
 * @argument path (absolute) to the module source
 * @argument callback is a function to call after initialization
 *
 * @returns created or existing module with the corresponding path
 */
kernel._unrequireModule = function( path, callback ) {
    var module = null;
    // searching if a module is already known
    for ( var i = 0; i < kernel._modules.length; i++ ) {
        if ( path == kernel._modules[ i ].path ) {
            module = kernel._modules[ i ];
            break;
        }
    }

    if ( module == null ) {
        // TODO add error handling here
        return;
    }

    if ( callback ) {
        module._uninitCallbacks.push( callback );
    }

    if ( module.loadedTimes > 0 ) {
        module.loadedTimes--;
    } else {
        module.loadedTimes = 0;
        // TODO add error handling here
    }

    if ( module.state >= module._states.idle ) {
        module._childrenUpdated();
    }

    // calling uninit callbacks (in any case)
    while ( module._uninitCallbacks.length > 0 ) {
        ( module._uninitCallbacks.shift() )();
    }
}


/**
 * @function  kernel._parseNext() performs  the loop  of  parsing each
 * next   module.     It   is   called   by    the   parsed   module's
 * _finalizeParsing() method.  This  function checks whether there are
 * more  modules  to parse,  if  yes -  starts  parsing  for the  next
 * scheduled module.
 */
kernel._parseNext = function() {
    init = uninit = function(){}; // clearing (un)initializer
    kernel._activeModule = kernel._includeQueue.pop() || null;
    if ( kernel._activeModule ) {
        kernel._activeModule._setState( kernel.moduleStates.including );
    }
}


// starting point
window.onload = function() {
    var body = document.getElementsByTagName( "body" ).item(0);
    kernel.load("main.js");
}

