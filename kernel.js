/*********************************************************************
  Helios Kernel - javascript module loader

  Licensed under MIT license, see http://github.com/asvd/helios-kernel

  The Module lifecycle is processed by the following methods:
  (assuming you have read the documentation)

  * @function kernel._Module() ('created' state), the Module object
    constructor, called when the module is requested for the first
    time (_getOrCreateModule() method), the module object is pushed to
    the kernel._loadQueue[] list

  * @function load() ('loading' state) called by kernel._loadNext()
    function which fetches the next module from the _loadQueue[] and
    initiates the module source loading

  * @function finalizeLoading() is called after the module was loaded,
    and code inside the module was executed - so all module
    dependences are now known, and module initializer is declared as
    global init() function.  If some of the module's parents are not
    initialized yet, the newly loaded module state is set to 'waiting'
    until the parents are initialized, otherwise the module
    initialization is started

  * @function initialize() ('initializing' state) starts module
    initializer function after all module dependences are initialized.
    After the module is initialized, its state is set to 'ready' and
    module children are notified about it. If some child is in
    'waiting' state, it will probably also go initializing (in case if
    all its other parents are also ready)

  * @function uninitialize() ('uninitializing' state) after the module
    is not needed calls the module uninitialzier, and afterwards the
    module will be destroyed

  * @function destroy() removes all module data and notifies parents
    that they are not needed by the module anymore (so they could go
    uninitialize if they are not used by anything else)

  * @function invalidate() calls the failure callback and destroys the
    module when it could not be loaded (or circular dependence is
    discovered), all children are also recursively invalidated

  Each module keeps a list of statistics-arrays where the module
  should be tracked. When a kernel._Module object is created, there is
  only one such array, kernel._stats, which is returned by the
  kernel.getStats() function.  But if a user requests a statistics for
  a some particular ticket, the personal stats array for that ticket
  is created, and all ticket's modules along with their parents are
  notified about they should participate in that statiscs (addStats()
  method).

*********************************************************************/


if (typeof kernel == 'undefined') {
    kernel = {};
}


// reserved names for the module initalizer and uninitializer
init = null;
uninit = null;

kernel._states = {
    created        : 0,  // initial state, not yet loaded
    loading        : 1,  // being loaded at the moment
    waiting        : 2,  // loaded; waits for the parents to initialize
    initializing   : 3,  // initializer is started, not finished
    ready          : 4,  // loaded, initialized and ready to use
    uninitializing : 5   // uninitializer is started, not yet finished
}



/**
 * @function include() declares a module dependence
 *
 * @param {String} path of the module to include
 */
include = function( path ) {
    var child = kernel._activeModule;
    if (child) {
        path = kernel._getAbsolute( path, child.path );
        if ( child.isSubChild(path) ) {
            kernel._throw( 'Circular dependence: ' + path );
            child.invalidate();
        } else {
            var module = kernel._getOrCreateModule(path);
            module.addChild(child);

            // participating in child's stats
            for ( var i = 0; i < child._statsList.length; i++ ) {
                module.addStats( child._statsList[i] );
            }
        }
    }  // else include() was not called in the module head
}



/**
 * @function kernel.require() notifies the kernel that a set of module
 * with the given paths are requested.  Kernel loads and initializes
 * the modules and their dependences (if the modules have not been
 * loaded yet), and then launches the provided callback
 *
 * @param {Array} paths absolute path to the module source (or an
 * array of such paths)
 * @param {Function} sCb callback to call after all modules are ready
 * @param {Function} fCb callback to call if some of the required
 * modules could not be loaded/initialized (wrong path or circular
 * dependence)
 *
 * @returns {kernel._Ticket} reservation ticket
 */
kernel.require = function( paths, sCb, fCb ) {
    if ( typeof paths == 'string' ) {
        // single module required
        paths = [paths];
    }

    var modules = [];
    for ( var i = 0; i < paths.length; i++ ) {
        modules.push( kernel._getOrCreateModule(paths[i]) );
    }

    return new kernel._Ticket( modules, sCb, fCb );
}



/**
 * @function kernel.release() notifies the kernel that the modules
 * corresponding to the given ticket are not needed anymore
 *
 * @param {kernel._Ticket} ticket to be released
 */
kernel.release = function( ticket ) {
    ticket._release();
}



/**
 * @function kernel.getStats() returns the statistics for the given
 * reservation ticket, or for the whole kernel if no ticket provided
 * 
 * @param {kernel._Ticket} ticket which to get statistics for
 * 
 * @returns {Array} statistics array
 */
kernel.getStats = function( ticket ) {
    var nativeStats = ticket ? ticket._getStats() : kernel._stats

    var total = 0;
    for ( var i in kernel._states ) {
        total += nativeStats[ kernel._states[i] ];
    }

    // modules which are created or loading may reveal new dependences
    var pending = nativeStats[ kernel._states.created ] ||
                  nativeStats[ kernel._states.loading ];

    return {
        total : total,
        ready : nativeStats[ kernel._states.ready ],
        pending : pending
    };
}



/**
 * @type kernel._Module represents a single kernel module. Created by
 * the kernel when the module is requested for the first time using
 * include() or kernel.require() functions
 *
 * @param {String} path path of the newly created module
 *
 * @property path absolute path to the module source
 * @property state state of the module, one of kernel._states
 * @property children[] keeps the modules which included this module
 * @property parents[] keeps the modules included by this module
 */
kernel._Module = function( path ) {
    this.path = path;
    this.state = kernel._states.created;
    this.children = [];
    this.parents  = [];
    this._sCallbacks = [];
    this._fCallbacks = [];
    this._tickets = [];
    kernel._modules.push(this);
    kernel._loadQueue.push(this);
    this._statsList = []; // list of statistics where participating
    this.addStats( kernel._stats );
}



/**
 * @function load() ('loading' state) loads the module source code by
 * calling the platform-dependent script loading function
 */
kernel._Module.prototype.load = function() {
    this.setState( kernel._states.loading );

    var me = this;
    var sCb = function() {
        if ( me.state == kernel._states.loading ) {
            me.finalizeLoading();
        }  // otherwise module could already be invalidated
           // because of the discovered circular dependence
    }
    
    var fCb = function() {
        if ( me.state == kernel._states.loading ) {
            // loading failure
            me.invalidate();
        }  // otherwise module could already be invalidated
           // because of the discovered circular dependence
    }
    
    kernel._platform.load( this.path, sCb, fCb );
}



/**
 * @function invalidate() destroys the module and calls invalidate()
 * for all children. Called when there is a problem with loading the
 * module (or some of the module's parents)
 */
kernel._Module.prototype.invalidate = function() {
    if ( this.state == null ) {
        // already invalidated for some other reason
        return;
    }

    while ( this._fCallbacks.length > 0 ) {
        // broken callbacks should not break the call stack
        kernel._platform.thread( this._fCallbacks.shift() );
    }

    var child;
    for ( var i = 0; i < this.children.length; i++ ) {
        child = this.children[i];
        // thread prevents the call stack growth
        kernel._platform.thread( child.invalidate, child );
    }

    this.destroy();

    if ( this == kernel._activeModule ) {
        kernel._loadNext();
    }
}



/**
 * @function finalizeLoading() takes the decision on what to do after
 * the module is loaded
 */
kernel._Module.prototype.finalizeLoading = function() {
    if ( typeof init != 'function' && this.parents.length == 0 ) {
        // no init(), no include()
        kernel._throw( 'Initializer missing: ' + this.path );
        this.invalidate();
    } else {
        this._init = init;
        this._uninit = uninit;

        if (!this.isNeeded()) {
            this.destroy();
        } else if ( this.areParentsReady() ) {
            this.initialize();
        } else {
            this.setState( kernel._states.waiting );
        }

        kernel._loadNext();
    }
}



/**
 * @function  initialize()  ('initializing'  state)  performs  module
 * initialization, notifies children and decides what to do next
 */
kernel._Module.prototype.initialize = function() {
    this.setState( kernel._states.initializing );

    // gives time for statistics meters to update
    kernel._platform.thread(
        function() {
            if (this._init) {
                try {
                    this._init();
                } catch(e) {
                    this.invalidate();
                    kernel._throw(e);
                }
            }

            // init() is not cleared at this point, since it will
            // probably be needed after the module was initialized,
            // but then requested agan

            if ( this.state != null ) {
                if ( !this.isNeeded() ) {
                    this.uninitialize();
                } else {
                    this.setState( kernel._states.ready );
                    while ( this._sCallbacks.length>0 ) {
                        ( this._sCallbacks.shift() )();
                    }

                    // initializing children
                    for ( var i = 0; i < this.children.length; i++ ) {
                        if ( this.children[i].state == kernel._states.waiting &&
                             this.children[i].areParentsReady() ) {
                            this.children[i].initialize();
                        }
                    }
                }
            }  // otherwise the module was invalidated 
        },
        this
    );
}



/**
 * @function uninitialize()  ('uninitializing' state) performs module
 * uninitialization, then destroys the module
 * 
 * The module is not invalidated in case of uninitializer failure,
 * since the module is going to be destroyed anyway. If the module
 * will be needed again after uninitializer failure, the initializer
 * will simply be relaunched without invalidation, because otherwise
 * the module would only work once - which is not clear and not
 * reasonable
 */
kernel._Module.prototype.uninitialize = function() {
    this.setState( kernel._states.uninitializing );

    // gives time for statistics meters to update
    kernel._platform.thread(
        function() {
            // will be performed even if uninitializer is broken
            kernel._platform.thread(
                function() {
                    if ( this.isNeeded() ) {
                        this.initialize();
                    } else {
                        this.destroy();
                    }
                },
                this
            );

            if ( this._uninit != null ) {
                this._uninit();
            }
        },
        this
    );
}



/**
 * @function destroy() clears module data, starts uninitialization of
 * the parents which are not needed anymore
 */
kernel._Module.prototype.destroy = function() {
    this.setState(null);

    // cloning the parents since removeChild could change the list
    var i, parents = [];
    for ( i = 0; i < this.parents.length; i++ ) {
        parents[i] = this.parents[i];
    }
    
    for ( i = 0; i < parents.length; i++ ) {
        parents[i].removeChild(this);
    }

    // uncounting module in all statistics
    for ( i = 0; i < this._statsList.length; i++ ) {
        this._statsList[i][this.state]--;
    }

    // removing the module from the global list
    for ( i = 0; i < kernel._modules.length; i++ ) {
        if ( kernel._modules[i]==this ) {
            kernel._modules.splice(i,1);
            break;
        }
    }

    this._init = null;
    this._uninit = null;
    this._statsList = null;
    this._sCallbacks = null;
    this._fCallbacks = null;
}



/**
 * @function _addChisld() links two modules with a relational
 * dependences
 * 
 * @param {Module} child to link with
 */
kernel._Module.prototype.addChild = function( child ) {
    this.children.push(child);
    child.parents.push(this);
}



/**
 * @function removeChild() unlinks the module with its child, starts
 * module unloading/destruction if it is not needed anymore
 * 
 * @param {Module} child to unlink with
 */
kernel._Module.prototype.removeChild = function( child ) {
    for ( var i = 0; i < this.children.length; i++ ) {
        if ( this.children[i] == child ) {
            this.children.splice(i,1);
            break;
        }
    }

    for ( i = 0; i < child.parents.length; i++ ) {
        if ( child.parents[i] == this ) {
            child.parents.splice(i,1);
            break;
        }
    }

    if ( !this.isNeeded() ) {
        if ( this.state == kernel._states.waiting ) {
            // thread prevents call stack growth
            kernel._platform.thread( this.destroy, this );
        } else if ( this.state == kernel._states.ready ) {
            this.uninitialize();
        }
    }
}



/**
 * @function addStats() recursively adds the given statistics to the
 * _statsList of this and all parent modules.  From this point, the
 * module and its parents will be counted in the mentioned statistics
 *
 * @param {Array} stats array where a module should be counted
 */
kernel._Module.prototype.addStats = function( stats ) {
    for ( var i = 0; i < this._statsList.length; i++ ) {
        if ( this._statsList[i] == stats ) {
            return; // already counted in given statistics
        }
    }

    this._statsList.push(stats);
    stats[this.state]++;

    for ( i = 0; i < this.parents.length; i++ ) {
        this.parents[i].addStats(stats);
    }
}



/**
 * @function removeStats() checks if the module is counted in given
 * statistics, and uncounts in it. Used when some ticket with counted
 * satistics was released, and the module is not needed to participate
 * in it anymore
 * 
 * @param {Array} stats to stop participating in
 */
kernel._Module.prototype.removeStats = function( stats ) {
    for ( var i = 0; i < this._statsList.length; i++ ) {
        if ( this._statsList[i] == stats ) {
            this._statsList.splice(i,1);
            break;
        }
    }

    // parenst will be handled by calling this method for each module
}



/**
 * @function setState() sets the module state to the given value,
 * updates the statistics arrays the module is participated in
 *
 * @param {Number} state new state of the module
 */
kernel._Module.prototype.setState = function( state ) {
    var oldState = this.state;
    this.state = state;

    for ( var i = 0; i < this._statsList.length; i++ ) {
        this._statsList[i][oldState]--;
        this._statsList[i][this.state]++;
    }
}



/**
 * @function isSubChild() recursively checks if at least one of
 * module's (sub)children has the given path. Used to find out
 * the circular dependences
 *
 * @param {String} path path to check for being a (sub)child
 *
 * @returns {Boolean} true if there is a (sub)child having the given
 * path, false otherwise
 */
kernel._Module.prototype.isSubChild = function( path ) {
    for ( var i = 0; i < this.children.length; i++ ) {
        if ( this.children[i].path == path ||
             this.children[i].isSubChild(path) ) {
             return true;
        }
    }

    return false;
}



/**
 * @function isNeeded() reports whether the module is still needed
 * (included by some other module which is still in use, or required
 * with a ticket which was not released yet)
 *
 * @returns {Boolean} true if the module is used, false otherwise
 */
kernel._Module.prototype.isNeeded = function() {
    return this._tickets.length > 0 || this.children.length > 0;
}



/**
 * @function areParentsReady() reports whether all of the module's
 * parents are initialized
 *
 * @returns {Boolean} true if all parents are initialized, false
 * otherwise
 */
kernel._Module.prototype.areParentsReady = function() {
    for ( var i = 0; i < this.parents.length; i++ ) {
        if ( this.parents[i].state != kernel._states.ready ) {
            return false;
        }
    }
    return true;
}



/**
 * @function require() tells a module that it was required by some
 * ticket and thus could not be uninitialized until the ticket is
 * released
 * 
 * @param {kernel._Ticket} ticket which required a module
 * @param {Function} sCb to call after the module is ready
 * @param {Function} fCb to call upon failure
 */
kernel._Module.prototype.require = function( ticket, sCb, fCb ) {
    this._tickets.push(ticket);

    if ( this.state == kernel._states.ready ) {
        if (sCb) {
            // broken callbacks should not break the call stack
            kernel._platform.thread(sCb);
        }
    } else {
        if (sCb) {
            this._sCallbacks.push(sCb);
        }

        if (fCb) {
            this._fCallbacks.push(fCb);
        }
    }
}



/**
 * @function release() is called when the module is not needed anymore
 * for the given ticket
 *
 * @param {kernel._Ticket} ticket which does not need the module
 */
kernel._Module.prototype.release = function( ticket ) {
    for ( var i = 0; i < this._tickets.length; i++ ) {
        if ( this._tickets[i] == ticket ) {
            this._tickets.splice(i,1);
            break;
        }
    }

    if ( !this.isNeeded() ) {
        if ( this.state == kernel._states.waiting ) {
            this.destroy();
        } else if ( this.state == kernel._states.ready ) {
            this.uninitialize();
        }
    }
}



/**
 * @type kernel._Ticket represents a single act of a module loading by
 * a kernel.require() function. Instance of this object is returned by
 * kernel.require()
 * 
 * @param {Array} modules list of kernel._Modules for a ticket
 * @param {Function} sCb to call when all modules are ready
 * @param {Function} fCb to call upon failure
 */
kernel._Ticket = function( modules, sCb, fCb ) {
    this._modules = modules;
    this._sCb = sCb || null;
    this._fCb = fCb || null;
    this._load();
}



/**
 * @function _load() loads all ticket modules
 */
kernel._Ticket.prototype._load = function() {
    var me = this;
    var singleSCb = null;
    if (this._sCb) {
        var modulesLeft = this._modules.length;
        singleSCb = function() {
            modulesLeft--;
            if (!modulesLeft) {
                me._sCb();
            }
        };
    }

    // fCb called after single failure
    var failure = false;
    var singleFCb = function( path ) {
        if (!failure) {
            failure = true;
            kernel.release(me);
            if (me._fCb) {
                me._fCb(path);
            }
        }
    };

    for ( var i = 0; i<this._modules.length; i++ ) {
        this._modules[i].require( this, singleSCb, singleFCb );
    }
}



/**
 * @function _release() releases the ticket for all its modules
 */
kernel._Ticket.prototype._release = function() {
    for ( var i = 0; i < this._modules.length; i++ ) {
        this._modules[i].release(this);
    }

    // modules do not need to participate in the statistics anymore
    if ( this._stats ) {
        for ( i = 0; i < kernel._modules.length; i++ ) {
            kernel._modules[i].removeStats( this._stats );
        }
    }
}



/**
 * @function getStats() returns the ticket statistics array
 * (initalizes statistics tracking if needed)
 * 
 * @returns {Array} ticket's statistics array
 */
kernel._Ticket.prototype._getStats = function() {
    if (!this._stats) {
        this._stats = [];
        for ( var i in kernel._states ) {
            this._stats[ kernel._states[i] ] = 0;
        }

        for ( i = 0; i < this._modules.length; i++ ) {
            this._modules[i].addStats( this._stats );
        }
    }

    return this._stats;
}



kernel._modules = [];        // list of all known modules
kernel._activeModule = null; // currently loading module
kernel._loadQueue = [];      // list of modules to be loaded
kernel._stats = [];          // numbers of modules for each state
for ( var i in kernel._states ) {
    kernel._stats[ kernel._states[i] ] = 0;
}



/**
 * @function kernel._getAbsolute() converts the relative path given to
 * the include() to the absolute path (which is either related to the
 * server root, or starts from http:// or https://)
 *
 * @param {String} path of a module as provided to include()
 * @param {String} childPath path of a module performing the include()
 *
 * @returns {String} absolute path of a module
 */
kernel._getAbsolute = function( path, childPath ) {
    // concatinating path with the child's path (without the filename)
    // path starting from 'http://' or '/' treated as absolute
    if ( path.substr(0,7).toLowerCase() != 'http://' &&
         path.substr(0,8).toLowerCase() != 'https://'&&
         path.substr(0,1) != '/' ) {
        path = childPath.substr( 0, childPath.lastIndexOf('/')+1 ) + path;
    }

    // resolving (clearing) up-dir sequences such as 'foo/../'
    var newPath = path;
    do {
        path = newPath;
        newPath = path.replace( /[\w\.~]*\/\.\.\//, '' );
    } while ( newPath!=path );

    return path;
}



/**
 * @function kernel._getOrCreateModule() searches for a module with
 * the given path, creates it if there is no such module found, and
 * returns the module object
 *
 * @param {String} path of the module to search for or create
 *
 * @returns {kernel._Module} found or newly created module
 */
kernel._getOrCreateModule = function( path ) {
    var module = null;
    for ( var i = 0; i < kernel._modules.length; i++ ) {
        if ( kernel._modules[i].path == path ) {
            module = kernel._modules[i];
        }
    }

    if (!module) {
        module = new kernel._Module(path);
        if ( !kernel._activeModule ) {
            kernel._loadNext();
        }
    }

    return module;
}



/**
 * @function kernel._loadNext() performs the loop of loading each next
 * pending module (if there is one)
 */
kernel._loadNext = function() {
    init = uninit = null;

    if ( kernel._loadQueue.length > 0 ) {
        // searching for the most demanded module
        var maxModule = kernel._loadQueue[0];
        var maxChildren = maxModule.children.length;
        var maxIdx = 0;
        var current = null;

        for ( var i = 1; i < kernel._loadQueue.length; i++ ) {
            current = kernel._loadQueue[i];
            if ( current.children.length > maxChildren ) {
                maxChildren = current.children.length;
                maxModule = current;
                maxIdx = i;
            }
        }

        kernel._loadQueue.splice(maxIdx,1);
        kernel._activeModule = maxModule;
        kernel._activeModule.load();
    } else {
        kernel._activeModule = null;
    }
}



/**
 * @function kernel._throw() throws the error without dropping the
 * call stack
 * 
 * @param {Object} e exception to throw
 */
kernel._throw = function( e ) {
    kernel._platform.thread( function() { throw e; } );
}



// keeps all platform-dependent stuff
kernel._platform = {};


/**
 * @function kernel._platform.thread() starts a function in a new
 * 'thread' (in an asynchronious way).  Similar to setTimeout(func,0)
 * but a bit faster
 * 
 *  Could be used for:
 * 
 * - preventing the growth of call stack for recursive functions
 *   (which do not return a value, so we do not care how will it work
 *   at the point of calling)
 * 
 * - preventing the call stack to be broken when issuing the
 *   user-provided callback which could potentially be invalid
 *   (try-catch would suppress the error message)
 * 
 * - giving some to update the UI before taking some action (in this
 *   case could be used by loading indicators tracking the statistics)
 * 
 * - making the debugging insanely complicated (which means that
 *   calling this function should be avoided, or at least explained in
 *   a comment)
 *
 * @param {Function} func function to call (or method to apply)
 * @param {Object} obj object to which to apply a method
 * @param {Array} args arguments array forwarded to the func
 *
 * @example:
 *   kernel._platform.thread(
 *       myFunction, myObject, [ arg1, arg2, ... ]
 *   );
 * 
 *   - will perform the following expression in a new 'thread':
 * 
 *   myObject.myFunction( arg1, arg2, ... );
 */
if ( typeof window != 'undefined'
     && typeof window.addEventListener != 'undefined' ) {
    kernel._platform.thread = function( func, obj, args ) {
        kernel._platform._threads.push( [ func, obj||window, args ]);
        window.postMessage( kernel._platform._threadMsg, '*' );
    }

    // Threading supplimentary routines
    kernel._platform._threads = []; // a list of pending threads
    kernel._platform._threadMsg = 'helios-thread-' + (new Date().getTime());
    // starts a thread on event
    kernel._platform._startThread = function( event ) {
        if ( event.source == window &&
             event.data == kernel._platform._threadMsg ) {
            if ( kernel._platform._threads.length > 0 ) {
                var thread = kernel._platform._threads.shift();
                thread[0].apply( thread[1], thread[2] );
            }
        }
    };

    window.addEventListener( 'message', kernel._platform._startThread, true );

} else {
    // fallback version (for ie/node)
    kernel._platform.thread = function( func, obj, args ) {
        setTimeout(
            function() {
                func.apply( obj||null, args||[] );
            }, 10
        );
    };
}



/**
 * @function kernel._platform.load() loads the script with the
 * provided path and executes the code inside that script, then calls
 * the provided callback
 * 
 * @param {String} path of the script to load
 * @param {Function} sCb
 * @param {Function} fCb called after a timeout if module was not loaded
 */
if ( typeof window != 'undefined' ) {
    // WEB
    // common script element cloned each time a new script is needed
    kernel._platform._commonScript = document.createElement('script');

    // time before a module invalidation
    kernel._platform._invalidateTimeout = 4000;

    kernel._platform.load = function( path, sCb, fCb ) {
        if ( path.charAt(0) == '/' ) {
            path = path.substr( 1, path.length-1 );
        }

        var script = kernel._platform._commonScript.cloneNode(false);
        script.src = path;

        var clear = function() {
            clearTimeout(failureTimeout);
            script.onload = null;
            script.onreadystatechange = null;
            script.parentNode.removeChild(script);
        }

        var success = function() {
            clear();
            sCb();
        }

        var failure = function() {
            clear();
            fCb();
        }

        script.onload = success;
        script.onreadystatechange = function() {
            var state = script.readyState;
            if ( state==='loaded' || state==='complete' ) {
                success();
            }
        }

        script.onerror = failure;
        var failureTimeout = setTimeout(
            failure, kernel._platform._invalidateTimeout
        );

        document.body.appendChild(script);
    }

} else {
    // NODEJS
    kernel._platform.load = function( path, sCb, fCb ) {
        try {
            require(path);
            // removing code from the cache:
            // - we only needed to execute the code
            // - we need the code to be executed again on a new load
            delete require.cache[path];
        } catch (e) {
            kernel._platform.thread(fCb);
            kernel._throw(e);
        }

        kernel._platform.thread(sCb);
    }
}

