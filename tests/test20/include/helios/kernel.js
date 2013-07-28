/*********************************************************************

  kernel.js

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

     Contains  heliosKernel  object   which  implements  routines  for
     loading  and  unloading modules.  This  script  is included  from
     index.html, creates kernel objects and then includes main.js.

     Kernel can  be found in one  of several possible  states.  On the
     state it depends what action will be performed after a request to
     load or unload a module has  come.  If kernel is in idle, and the
     include  request have  come,  then kernel  changes  its state  to
     parsing and  starts parsing the  desired module. If kernel  is in
     parsing state  at the  moment when request  has come,  that means
     that the newly  requested module was included in  the head of the
     module  which is currently  being parsed.   That also  means that
     currently parsed module requires  newly requested.  New module is
     created  as a "parent"  of currently  parsed and  thus dependence
     graph  is built.  Modules  are parsed  one by  one, and  when all
     modules  are parsed  and there  are no  new requests,  the kernel
     switches itself to initializing state.  In this state all modules
     are  initialized in order  of dependence.   When all  modules are
     initialized,  kernel checks  whether  there are  new requests  to
     include or  exclude some  module have appeared,  if yes  --- then
     kernel  switches  back to  parsing  and  repeats everything  once
     again.  Otherwise, it switches its state to idle.

     Excluding  works   in  the  similar   way  but  in   the  reverse
     order.  Kernel  can not  load  and  unload  modules at  the  same
     time. If a request to unload a module appeared during the loading
     states, this request is queued and vice versa.

     Each  module  is represented  by  heliosKernel.Module object  and
     keeps  its  full   path,  state,  initializer  and  uninitializer
     functions and lists of all children and parents.

     Module excluding aims to be  safe, meaning that a module will not
     be excluded if there are some children who still require it. When
     a module  is excluded, it also  tries to exclude  all its parents
     (who have  no other children). Module  excluding involves calling
     module uninitializer, if there  is one, excluding module's unused
     parents, and removing the module object.


 __Objects declared:__________________________________________________

 heliosKernel           - implements module loading and initialization
 include()                        - initiates a module loading process
 load()                              - loads a module in a dynamic way
 unload()                          - unloads dynamically loaded module
 init         |
 initialize   |       - these three names are reserved for initializer
 uninitialize |         and uninitializer and should not be overridden


 __TODO:______________________________________________________________

 - Add  support of  tracking an  error  when script  asked to  include
   itself

 - Add support of custom loading indicator

 - Probably  add support  of conditional  module dependences  at least
   depending on the browser

 - Replace ugly tables with layers for IE (or remove IE workarounds)

 - Initialize  all modules  without dependences  in  asynchronious way
   (keep  an array  of uninitialized  modules  and scan  it each  time
   another  module is  initialized trying  to  find a  set of  modules
   without dependences, start its initialization)

 - Probably so large period of 10  msec is reasonable only to find out
   the  unloadable modules,  in this  case activate  it only  in debug
   mode, leaving the delay for non-debug mode a bit smaller.

*********************************************************************/

// Object which assists module loading
heliosKernel = {};


// Configuration begins ----------------------------------------------

// Defines whether an application is  in debug mode (in this mode some
// additional warnings are shown)
//heliosKernel.debugMode = false;
heliosKernel.debugMode = true;


// Defines whether loading process should be shown
heliosKernel.showLoading = true;


// Defines the background color for the loading process
heliosKernel.backgroundColor = "#cad6d9";


// Defines the foreground (text) color for the loading process
heliosKernel.foregroundColor = "#112233";


// Defines the font-family for the loading text
heliosKernel.fontFamily = "sans-serif";


// Defines the font-size for the loading text
heliosKernel.fontSize = "10px";


// "Loading" string
heliosKernel.loadingString = "loading";
//heliosKernel.loadingString = "";  // will hide the string


// "Initializing" string
heliosKernel.initializingString = "initializing";
//heliosKernel.initializingString = "";  // will hide the string


// Timeout (msec) between two checks on whether all modules are parsed
// (don't better use values less than 10, it lags on my machine ;) )
heliosKernel.period = 10;


// Timeout (sec)  after which a  warning message is shown  saying that
// the module seems  not able to be parsed, has  no meaning when debug
// mode is off
heliosKernel.notParsedTimeout = 2;


// Timeout (sec) after which a  heliosKernel will stop waiting for the
// unparsable module and start parsing another one
heliosKernel.continueParsingTimeout = 4;


// Configuration ends ------------------------------------------------


// Will keep helios kernel messages when initialized
heliosKernel.messages = "";


// Shows a helios kernel error message (usually called in debug mode)
heliosKernel.logMessage = function( text ) {
    if ( this.debugMode ) {
        var message = "<br/><br/><b>helios kernel message:</b><br/>";
        message += text;
        
        if ( this.initialized ) {
            // sending message to messages
            this.messages += message;
        } else {
            // sending message to the debug layer
            this.debugLayer.innerHTML += message;
        }
    }
}


// set to true when main.js parsing is started
heliosKernel.initialized = false;


// number of periods in notParsedTimeout
heliosKernel.notParsedPeriods = parseInt(
    heliosKernel.notParsedTimeout * 1000 / heliosKernel.period
);


// number of periods in continueParsingTimeout
heliosKernel.continueParsingPeriods = parseInt(
    heliosKernel.continueParsingTimeout * 1000 / heliosKernel.period
);


// Keeps a list of all modules
//
// Associative array:
//  - index is a string which keeps full module path
//  - value is a module object
heliosKernel.modules = {}


// Possible states of a heliosKernel
heliosKernel.states = {
    nothing : 0,        // idle
    parsing : 1,        // some module is parsed
    initializing : 2,   // some module is initialized
    excluding : 3       // excluding modules
}


// Current heliosKernel state
heliosKernel.state = heliosKernel.states.nothing;


// Keeps a module which is currently being parsed
heliosKernel.activeModule = null;


// Keeps an array of created but not yet parsed modules
heliosKernel.newbies = new Array();


// Keeps a stack of modules which should be initialized
// (in order of dependence)
heliosKernel.initStack = new Array();


// List  of  strings  to  be   evalled  or  functions  to  call  after
// initialization
heliosKernel.actionQueue = new Array();


// List of modules scheduled to be loaded,
// keeps arrays of module path and actions to perform after loading
heliosKernel.loadQueue = new Array();


// List of modules scheduled to be unloaded,
// keeps arrays of module path and actions to perform after unloading
heliosKernel.unloadQueue = new Array();


// Counts total number of modules
heliosKernel.modulesNumber = 0;


// Counts number of parsed modules
heliosKernel.parsedModulesNumber = 0;


// Counts number of initialized modules
heliosKernel.initializedModulesNumber = 0;


// Module constructor. Represents some helios module.
//
// Argument:
//  - path_ is an absolute path to the module
heliosKernel.Module = function( path_ ) {
    this.path = path_;
    this.state = this.states.newbie;
    // initializer and uninitializer functions
    this.initializer = null;
    this.uninitializer = null;
    // keeps a number of times the module was asked to be loaded
    this.dynamicCounter = 0;
    // list of modules which should be initialized before this
    this.parents = new Array();
    // list of modules for which this one is parent
    this.children = new Array();
}


// Possible states of a module
heliosKernel.Module.prototype.states = {
    newbie : 0,          // not parsed yet
    parsed : 1,
    waiting : 2,         // waits for parents to be initialized
    initialized : 3
}


// Adds parent module
//
// Argument:
//  - parentModule is a module who should be initialized before
heliosKernel.Module.prototype.addParent = function( parentModule ) {
    this.parents.push( parentModule );
    parentModule.children.push( this );
}


// Removes parent module
//
// Called by heliosKernel.unload()
//
// Argument:
//  - parent is a module to be removed from parents
heliosKernel.Module.prototype.removeParent = function( parent ) {
    var i;

    // removing parentModule from parents
    for ( i = 0; i < this.parents.length; i++ ) {
        if ( this.parents[ i ] == parent ) {
            this.parents.splice( i, 1 );
        }
    }

    // removing this module from parent's children
    for ( i = 0; i < parent.children.length; i++ ) {
        if ( parent.children[ i ] == this ) {
            parent.children.splice( i, 1 );
        }
    }
}

// Starts module parsing by creating a <script> element
heliosKernel.Module.prototype.parse = function() {
    // start parsing
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = this.path;
    document.getElementsByTagName('head').item(0).appendChild(script);
}


// Initializes module if not initialized yet
heliosKernel.Module.prototype.initialize = function() {
    this.initializer();
    this.state = this.states.initialized;

    // removing the initializer since we don't need it anymore
    this.initializer = null;
}


// Statically includes a module.
//
// Argument:
//  - path is a relative or absolute (starting with "http://") path to
//    the .js file containing the module source
heliosKernel.include = function( path ) {
    // static include is only allowed in parsing state
    if ( this.state == this.states.parsing ) {
        // this is the normal situation, including
        this.doInclude( path );
    } else {
        // module was tried to be included from the function, ignoring
        this.logMessage("Module '" + path + "' was tried to be " +
                        "included statically from inside the " +
                        "function, ignored.");
    }
}

// Dynamically loads  a module.  Including  is performed in  case when
// helios kernel is in idle, otherwise including is scheduled.
//
// Arguments:
//  - path is  a relative  to the main.js  or absolute  (starting with
//    "http://") path to the .js file containing the module source
//  - action is  either a string to  eval or a function  to call after
//    module is loaded
heliosKernel.load = function( path, action ) {
    // dynamic loading should be performed from the idle state
    if ( this.state == this.states.nothing ) {
        // adding action to actionQueue
        this.actionQueue.push( action );
        // loading a module
        this.doInclude( path );
    } else {
        // adding a module to the queue
        this.loadQueue.push( [ path, action ] );
    }
}


// Dynamically unloads  a module. Excluding is performed  in case when
// helios kernel is in idle, otherwise excluding is scheduled.
//
// Arguments:
//  - path is  a relative  to the main.js  or absolute  (starting with
//    "http://") path to the .js file containing the module source
//  - action is  either a string to  eval or a function  to call after
//    module is unloaded
heliosKernel.unload = function( path, action ) {
    // dynamic unloading should be performed from the idle state
    if ( this.state == this.states.nothing ) {
        // adding action to actionQueue
        this.actionQueue.push( action );
        // loading a module
        this.doExclude( path );
    } else {
        // adding a module to the queue
        this.unloadQueue.push( [ path, action ] );
    }
}


// Actually performes module including.
//
// Argument:
//  - path is a relative or absolute (starting with "http://") path to
//    the .js file containing the module source
heliosKernel.doInclude = function( path ) {
    // calculating absolute path to the module without filename
    var fullPath = this.getFullPath( path );
    
    // checking the state of the heliosKernel
    switch ( this.state ) {
    case this.states.nothing:
        // heliosKernel is in idle, module was included dynamically
        // checking if module was already included
        if ( typeof( this.modules[ fullPath ] ) == "undefined" ) {
            // module was not included, starting module parsing

            // creating a module
            this.modules[ fullPath ] = new this.Module( fullPath );
            // short name
            var thisModule = this.modules[ fullPath ];
            // adding the module to the list of not parsed modules
            this.newbies.push( thisModule );
            // increasing counter
            this.modulesNumber++;
            // changing heliosKernel state
            this.state = this.states.parsing;
            // setting current parsing module
            this.activeModule = thisModule;
            // starting module parsing
            thisModule.parse();
            // start waiting until a module will be parsed
            setTimeout( "heliosKernel.waitUntilModuleParsed()", 0 );
            return;
        } else {
            // else module  was already parsed  and initialized (since
            // heliosKernel    is   in   idle),    increasing   module
            // dynamicCounter
            this.modules[ fullPath ].dynamicCounter++;
            // performing scheduled actions
            this.state = this.states.nothing;
            setTimeout( "heliosKernel.performQueuedActions()", 0 );
            return;
        }
        break;
    case this.states.parsing:
        // heliosKernel  is   parsing  some  other   module  and  thus
        // currentModule  was  included   by  some  other  module  who
        // requires this one
        if ( typeof( this.modules[ fullPath ] ) == "undefined" ) {
            // module was not included  yet, creating it and adding to
            // the newbies

            // creating a module
            this.modules[ fullPath ] = new this.Module( fullPath );
            // adding the module to the list of not parsed modules
            this.newbies.push( this.modules[ fullPath ] );
            // increasing counter
            this.modulesNumber++;
        } // else the  module has been  already created and  placed in
          // the newbies, nothing to do

        // updating dependences
        // (activeModule module requires this one)
        this.activeModule.addParent( this.modules[ fullPath ] );
    }
    
}


// Uninitialzies and removes a module if it has no dependent children.
//
// Argument:
//  - path is  a relative  to the main.js  or absolute  (starting with
//    "http://") path to the .js file containing the module source
heliosKernel.doExclude = function( path ) {
    // checking if the module exists
    if ( typeof( this.modules[ path ] ) != "undefined" ) {
        // module exists

        // a shorter name
        var thisModule = this.modules[ path ];

        // flag defining whether current module is the first
        var firstModule = false;
        
        // checking the state
        if ( this.state == this.states.nothing ) {
            // this module was asked to be unloaded
            // checking if module dynamically loaded
            if ( thisModule.dynamicCounter > 0 ) {
                // decrease a counter
                thisModule.dynamicCounter--;        
            } else {
                // module was not loaded dynamically
                this.logMessage( "Attempt to exclude a module which" +
                                 " was not dynamically loaded: '" +
                                 thisModule.path + "'.");
            }

            // changing the state
            this.state = this.states.excluding;

            firstModule = true;
        } // else doExclude was called by itself and we do not need to
          // decrease the counter

        // excluding module only in case when it is not used
        if ( thisModule.dynamicCounter == 0 &&
             thisModule.children.length == 0 ) {
            var i;
            
            // excluding the module
            if ( thisModule.uninitializer != null ) {
                thisModule.uninitializer();
                this.uninitializer = null;
            }
            
            // recursively excluding all parents
            for ( i = 0; i < thisModule.parents.length; i++ ) {
                var currentParent = thisModule.parents[ i ];
                thisModule.removeParent( currentParent );
                this.doExclude( currentParent.path );
            }
            
            // removing module object itself
            delete this.modules[ path ];
            // decreasing module counters
            this.modulesNumber--;
            this.initializedModulesNumber--;
        } // else can't unload, some other module depends on this

        // if current module is first, go to the next stage
        if ( firstModule ) {
            // jump to actions
            this.state = this.states.nothing;
            setTimeout( "heliosKernel.performQueuedActions()", 0 );
            return;
        }
    } else {
        // there is no such module
        this.logMessage(
            "Attempt to unload unexisting module: " + path
        );

        // if state is  idle, the function is called  for a first time
        // (not  from itself) and  we have  to perform  queued actions
        // anyway
        if ( this.state == this.states.nothing ) {
            setTimeout( "heliosKernel.performQueuedActions()", 0 );
            return;
        }
    }

}


// Counts a  number of times  a single module  is waited to  be parsed
// (to report if a module seems not to exist in debug mode)
heliosKernel.loadingWaitCount = 0;


// initializer name for a module without uninitializer
init = false;
// initializer and uninitalizer for unloadable modules
initialize = false;
uninitialize = false;


// Waits until an activeModule module is parsed by a browser
heliosKernel.waitUntilModuleParsed = function() {

    // checking if module is already loaded
    var moduleIsLoaded = (
            // for modules without uninitializer
            ( init != false ) ||
            // for unloadable modules
            ( ( initialize != false ) && ( uninitialize != false ) )
        );

    if ( moduleIsLoaded ) {
        // module is loaded

        // clearing a counter
        this.loadingWaitCount = 0;

        // checking whether module is unloadable
        if ( init != false ) {
            // module is not unloadable
            
            // storing initializer
            this.activeModule.initializer = init;
            init = false;
        } else {
            // module is unloadable

            // storing initializer
            this.activeModule.initializer = initialize;
            initialize = false;

            // storing uninitializer
            this.activeModule.uninitializer = uninitialize;
            uninitialize = false;
            
        }

        // changing its state
        this.activeModule.state = this.Module.prototype.states.parsed;
        // increasing a counter
        this.parsedModulesNumber++;

        // updating notification area
        if ( !this.initialized &&
             this.showLoading ) {
            if ( this.debugMode ) {
                this.loadingLayer.innerHTML =
                    "<br/>" +
                    this.loadingString +
                    "<br/>" +
                    this.activeModule.path;
            } else {
                this.loadingLayer.innerHTML =
                    "<br/>" + this.loadingString + "<br/>";
            }
            // animation frames
            var frame = this.parsedModulesNumber % 14;
            var left;
            var width;
            // whether indicator is on the top or on the bottom
            var top = ( frame > 7 ) ? 2 : 1;
            switch ( frame ) {
            case 7: case 0:  left = 0;   width = 0;  break;
            case 6: case 8:  left = 0;   width = 40; break;
            case 5: case 9:  left = 0;   width = 80; break;
            case 4: case 10: left = 40;  width = 80; break;
            case 3: case 11: left = 80;  width = 80; break;
            case 2: case 12: left = 120; width = 80; break;
            case 1: case 13: left = 160; width = 40;
            }
                
            this.bar4.style.left = left + 1;
            this.bar4.style.width = width;
            this.bar4.style.top = top;
                
        }

        // removing module from the newbies array
        for ( var i = 0; i < this.newbies.length; i++ ) {
            if ( this.newbies[ i ] == this.activeModule ) {
                // здесь могла быть Ваша реклама
                this.newbies.splice( i, 1 );
            }
        }

        // telling that there is no modules parsing at the moment
        this.activeModule = null;

        
        // check whether there are some newbie modules to be parsed
        if ( this.newbies.length != 0 ) {
            // yes, start parsing another module
            this.activeModule = this.newbies[ 0 ];
            this.activeModule.parse();
            this.waitUntilModuleParsed();
        } else {
            // no, all modules are parsed, starting initialization
            this.bar4.style.left = 1;
            this.bar4.style.width = 0;
            this.bar4.style.height = 2;
            this.bar4.style.top = 1;
            this.state = this.states.initializing;
            setTimeout( "heliosKernel.waitUntilModuleInitialized()", 0 );
        }
    } else {
        // the module is not yet parsed

        // checking if the module cannot be parsed
        this.loadingWaitCount++;
        
        if ( this.loadingWaitCount == this.notParsedPeriods ) {
            this.logMessage(
                "Module has not been parsed for " +
                this.notParsedTimeout +
                " seconds. Possible reasons are: connection to the " +
                "server was lost or is too slow, module source file" +
                " does not exist, module source file does not conta" +
                "in its initializer function (or in case of unloada" +
                "ble module, does not contain its both initializer " +
                "and uninitializer functions), or there were some J" +
                "S errors while parsing the module (check JS errors" +
                " log). After " +
                (this.continueParsingTimeout-this.notParsedTimeout) +
                " more seconds helios kernel will try to skip parsi" +
                "ng this module and continue parsing others. Failed" +
                " module path: '" +
                this.activeModule.path +
                "'. This module was requested to include in '" +
                ( (this.activeModule.children.length > 0) ?
                  this.activeModule.children[ 0 ].path :
                  "unknown") +
                "'."
            );
        }

        // checking  whether we need  to stop  parsing the  module and
        // continue with others
        if ( this.loadingWaitCount == this.continueParsingPeriods ) {
            this.logMessage(
                " Module parsing was skipped: '" +
                this.activeModule.path + "'."
            );
            // creating an empty initializer for a failed module
            init = function() {}

            // clearing  initializer and  unitializer  (they could  be
            // defined in failed module and this can make troubles)
            initialize = false;
            uninitialize = false;
        }

        // the module is not yet parsed, wait along
        setTimeout( "heliosKernel.waitUntilModuleParsed()", this.period );

    }
    
}


// Initializes all modules starting from the first.  Initialization is
// not synchronized to give browser some time to update inidicators.
heliosKernel.waitUntilModuleInitialized = function() {
    // check if we need to find another module to initialize
    if ( this.initStack.length == 0 ) {
        // no modules in stack, searching for a module to initialize

        var modulePath = "";
        var foundParsed = false;
        for ( modulePath in this.modules ) {
            if ( this.modules[ modulePath ].state ==
                 this.Module.prototype.states.parsed ) {
                // found parsed but not initialized module
                foundParsed = true;
                break;
            }
        }

        // checking if there are uninitialized modules
        if ( foundParsed ) {
            // found uninitialized module, pushing it to stack
            this.initStack.push( this.modules[ modulePath ] );
            // starting once again
            setTimeout( "heliosKernel.waitUntilModuleInitialized()", 0 );
            return;
        } else {
            // all parsed modules had been initialized

            // checking whether there are some newbie modules
            if ( this.newbies.length != 0 ) {
                // some newbies appeared, switching back to parsing
                this.state = this.states.parsing
                this.activeModule = this.newbies[ 0 ];
                this.activeModule.parse();
                setTimeout( "heliosKernel.waitUntilModuleParsed()", 0 );
                return;         
            } else {
                // all modules are now initialized

                // go to the next stage
                this.state = this.states.nothing;
                setTimeout( "heliosKernel.performQueuedActions()", 0 );
                return;
            }
        }

    } else if ( this.initStack[ this.initStack.length - 1 ].state ==
                this.Module.prototype.states.parsed ) {
        // module in the top on the stack is not initialized

        // searching for not initialized parents
        var currentModule = this.initStack[ this.initStack.length - 1 ];
        var i;
        for ( i = 0; i < currentModule.parents.length; i++ ) {
            if ( currentModule.parents[ i ].state ==
                 currentModule.states.waiting ) {
                // found circular dependence, report if in debug mode
                if ( this.debugMode ) {
                    // will keep a list of circular dependence
                    var circularList = "";
                    var j;
                    var addToList = false;
                    for ( j = 0; j < this.initStack.length; j++ ) {
                        if ( addToList ) {
                            circularList += " -&gt; '" + this.initStack[ j ].path + "'";
                        } else {
                            if ( this.initStack[ j ] == currentModule.parents[ i ] ) {
                                addToList = true;
                                circularList = "'" + this.initStack[ j ].path + "'";
                            }
                        }
                    }
                    circularList += " -&gt; '" + currentModule.parents[ i ].path + "'";

                    this.logMessage(
                        "Circular dependence found and ignored: " +
                        circularList + "."
                    );
                }

                // breaking circular dependence
                currentModule.removeParent( currentModule.parents[ i ] );
                
            } else if ( currentModule.parents[ i ].state ==
                 currentModule.states.parsed ) {
                // found not initialized parent

                // this is for tracking circular dependencies
                currentModule.state = currentModule.states.waiting;
                // adding parent to the stack
                this.initStack.push( currentModule.parents[ i ] );
                // starting once again
                setTimeout( "heliosKernel.waitUntilModuleInitialized()", 0 );
                return;
            }
        }

        // all parents are initialized

        // check whether we need to hide loading message
        if ( currentModule.path == "main.js" ) {

            // setting initialzied flag
            this.initialized = true;
            
            if ( this.showLoading  ) {
                this.loadingLayer.style.visibility = "hidden";
                this.bar1.style.visibility = "hidden";
                // removing loading indicator layers
                var body = document.getElementsByTagName( "body" ).item( 0 );
                body.removeChild( this.loadingLayer );
                body.removeChild( this.bar1 );

            }
            
            // removing debug layer
            if ( this.debugMode ) {
                this.debugLayer.style.visibility = "hidden";
                // copying the contents of debugLayer to the messages
                this.messages = this.debugLayer.innerHTML;
                // removing the layer
                var body = document.getElementsByTagName( "body" ).item( 0 );
                body.removeChild( this.debugLayer );
            }
                
        }
        
        // all parents are initialized, initializing current one
        currentModule.initialize();
        // starting once again
        setTimeout( "heliosKernel.waitUntilModuleInitialized()", 0 );
        return;

    } else if ( this.initStack[ this.initStack.length - 1 ].state ==
                this.Module.prototype.states.waiting ) {
        // some module parent was initialized
        this.initStack[ this.initStack.length - 1 ].state =
            this.Module.prototype.states.parsed;
        // starting once again
        setTimeout( "heliosKernel.waitUntilModuleInitialized()", 0 );
        return;
    } else if ( this.initStack[ this.initStack.length - 1 ].state ==
                this.Module.prototype.states.initialized ) {
        // activeModule is initialized, switching to the next one

        // increasing a number of initializedModules counter
        this.initializedModulesNumber++;

        // updating feedback area
        if ( !this.initialized &&
             this.showLoading ) {
            var percentage = parseInt(
                100 * this.initializedModulesNumber /
                (this.modulesNumber - 1)
            );
            
            if ( this.debugMode ) {
                this.loadingLayer.innerHTML =
                    "[ " + percentage + "% ]<br/>" +
                    this.initializingString + "<br/>" +
                    this.initStack[ this.initStack.length - 1 ].path;
            } else {
                this.loadingLayer.innerHTML =
                    "<br/>" + this.initializingString;
            }

            this.bar4.style.width = 2 * percentage;
        }

        // removing module from the stack
        this.initStack.pop();
        // starting once again
        setTimeout( "heliosKernel.waitUntilModuleInitialized()", 0 );
        return;
    }
}


// Performs actions listed in actionQueue
heliosKernel.performQueuedActions = function() {
    // check if there are some modules to load
    if ( this.loadQueue.length > 0 ) {
        // loading the first module from the queue
        this.load.apply( this, this.loadQueue.pop() );
        // after load finish, we'll be back here again
        return;
    }

    // check if there are some modules to unload
    if ( this.unloadQueue.length > 0 ) {
        // unloading the first module from the queue
        this.unload.apply( this, this.unloadQueue.pop() );
        // after unload finish, we'll be back here again
        return;
    }

    // performing actions

    // copying action list since it can be modified in to actions
    var actionList = new Array();
    while ( this.actionQueue.length > 0 ) {
        actionList.push( this.actionQueue.shift() );
    }
    
    for ( var i = 0; i < actionList.length; i++ ) {
        if ( actionList[ i ] instanceof Function ) {
            // action is a function to call
            actionList[ i ]();
        } else {
            // action is a string to eval
            eval( actionList[ i ] );
        }
    }

}

                 
// Calculates module absolute path from given relative
//
// Argument:
//  - modulePath is a string containing relative path
heliosKernel.getFullPath = function( modulePath ) {
    if ( modulePath.substr( 0, 7 ) == "http://" ) {
        // path starting with "http://" is treated as an absolute
        return modulePath;

    } else if ( this.activeModule == null ) {
        // no modules are parsed at  the moment, so there is no module
        // who  included this  one (relative  to which  the  path is),
        // considering that modulePath is absolute
        return modulePath;
        
    } else {
        // composing absolute path using child module path
        var activePath = this.activeModule.path;
        // removing filename
        activePath = activePath.substr( 0, activePath.lastIndexOf("/") + 1 );
        // adding activeModule path in the begining
        modulePath = activePath + modulePath;

        // cleaning sequences such as "foobar/../"
        var newPath = modulePath;
        do {
            modulePath = newPath;
            // removing one parent directory sequence
            newPath = modulePath.replace( /[\w\.~]*\/\.\.\//, "" );
        } while ( newPath != modulePath );

        // now modulePath contains absolute path
        return modulePath;
    }        
}


// Waits until <body> element is loaded and finally loads main.js.
heliosKernel.waitUntilBodyLoaded = function() {
    if ( typeof( document.getElementsByTagName('body').item(0) ) == "undefined"  ||
         document.getElementsByTagName('body').item(0) == null) {
        setTimeout("heliosKernel.waitUntilBodyLoaded()", this.period );
    } else {
        // body is loaded, starting everything
        
        // creating the loading feedback layer if needed
        if ( this.showLoading ) {
            var body = document.getElementsByTagName( "body" ).item( 0 );
            body.style.backgroundColor = this.backgroundColor;
            // text loader
            this.loadingLayer = document.createElement( "div" );
            this.loadingLayer.style.position = "absolute";
            this.loadingLayer.style.left = 0;
            this.loadingLayer.style.top = 0;
            this.loadingLayer.style.width = "100%";
            this.loadingLayer.style.height = 30;
            this.loadingLayer.style.textAlign = "center";
            this.loadingLayer.style.color = this.foregroundColor;
            this.loadingLayer.style.fontFamily = this.fontFamily;
            this.loadingLayer.style.fontSize = this.fontSize;
            this.loadingLayer.innerHTML = "<br/>" + this.loadingString;
            body.appendChild( this.loadingLayer );

            // bar
            this.bar1 = document.createElement( "div" );
            this.bar1.style.position = "absolute";
            this.bar1.style.left = 0;
            this.bar1.style.top = 50;
            this.bar1.style.width = "100%"
            this.bar1.style.height = 6;
            this.bar1.style.textAlign = "center";
            body.appendChild( this.bar1 );

            this.bar1.innerHTML = "<table cellspacing=0 cellpadding=0 border=0 width=100% height=6><tr><td width=50%><table cellspacing=0 cellpadding=0 border=0 width=1 height=1><tr><td></td></tr></table></td><td width=204><table cellspacing=0 cellpadding=0 border=0 width=204 height=6><tr><td><div id='heliosKernelBar1'></div></td></tr></table></td><td width=50%><table cellspacing=0 cellpadding=0 border=0 width=1 height=1><tr><td></td></tr></table></td></tr></table>"

            this.bar2 = document.createElement( "div" );
            this.bar2.style.position = "absolute";
            this.bar2.style.top = 0;
            this.bar2.style.width = 204;
            this.bar2.style.height = 6;
            this.bar2.style.backgroundColor = this.foregroundColor;
            document.getElementById("heliosKernelBar1").appendChild( this.bar2 );

            this.bar3 = document.createElement( "div" );
            this.bar3.style.position = "absolute";
            this.bar3.style.top = 1;
            this.bar3.style.left = 1;
            this.bar3.style.width = 202;
            this.bar3.style.height = 4;
            this.bar3.style.textAlign = "center";
            this.bar3.style.backgroundColor = this.backgroundColor;
            this.bar2.appendChild( this.bar3 );
            
            this.bar4 = document.createElement( "div" );
            this.bar4.style.position = "absolute";
            this.bar4.style.top = 1;
            this.bar4.style.left = 1;
            this.bar4.style.width = 0;
            this.bar4.style.height = 1;
            this.bar4.style.textAlign = "center";
            this.bar4.style.backgroundColor = this.foregroundColor;
            // this  is needed  for ie,  otherwise the  layer  will be
            // stretched vertically
            this.bar4.innerHTML = '<div></div>';
            
            this.bar3.appendChild( this.bar4 );
            
        }

        // creating debug notification area
        if ( this.debugMode ) {
            var body = document.getElementsByTagName( "body" ).item( 0 );
            body.style.textAlign = "center";
            this.debugLayer = document.createElement( "div" );
            this.debugLayer.style.position = "absolute";
            this.debugLayer.style.top = 60;
            this.debugLayer.style.width = "50%";
            this.debugLayer.style.textAlign = "left";
            this.debugLayer.style.color = this.foregroundColor;
            this.debugLayer.style.fontFamily = this.fontFamily;
            this.debugLayer.style.fontSize = this.fontSize;
            this.debugLayer.innerHTML = "";
            body.appendChild( this.debugLayer );
            
        }

        // including everything starting from main.js
        load("main.js");
    }
}

    
// Shortcut to heliosKernel.include(). Statically includes a module.
//
// Argument:
//  - path is a relative or absolute (starting with "http://") path to
//    the .js file containing the module source
function include( path ) {
    heliosKernel.include( path );
}


// Shortcut to heliosKernel.load(). Dynamically includes a module.
//
// Arguments:
//  - path is a relative or absolute (starting with "http://") path to
//    the .js file containing the module source
//  - action is  either a string to  eval or a function  to call after
//    module is loaded
function load( path, action ) {
    heliosKernel.load( path, action );
}


// Shortcut  to heliosKernel.unload().   Uninitialzies  and removes  a
// module if it has no  dependent children, and finally calls unload()
// for each unused parent of the module.
//
// Arguments:
//  - path is  a relative  to the main.js  or absolute  (starting with
//    "http://") path to the .js file containing the module source
//  - action is  either a string to  eval or a function  to call after
//    module is unloaded
function unload( path, action ) {
    heliosKernel.unload( path, action );
}


// entering point
heliosKernel.waitUntilBodyLoaded();
