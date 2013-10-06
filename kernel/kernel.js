/*********************************************************************
  Helios Kernel 0.9.3 - javascript module loader

  Licensed under MIT license, see http://github.com/asvd/helios-kernel

  The Module lifecycle is processed by the following methods:
  (assuming you have read the documentation)

  * @function kernel.Module() ('created' state), the Module object
    constructor, called when the module is requested for the first
    time (_getOrCreateModule() method), the module object is pushed to
    the kernel._loadQueue[] list

  * @function _load() ('loading' state) called by kernel._loadNext()
    function which fetches the next module from the _loadQueue[] and
    initiates the module source loading

  * @function _finalizeLoading() is called after the module was
    loaded, and code inside the module was executed - so all module
    dependences are now known, and module initializer is declared as
    global init() function.  If some of the module's parents are not
    initialized yet, the newly loaded module state is set to 'waiting'
    until the parents are initialized, otherwise the module
    initialization is started

  * @function _initialize() ('initializing' state) starts module
    initializer function after all module dependences are initialized.
    After the module is initialized, its state is set to 'ready' and
    module children are notified about it. If some child is in
    'waiting' state, it will probably also go initializing (in case if
    all its other parents are also ready)

  * @function _uninitialize() ('uninitializing' state) after the
    module is not needed calls the module uninitialzier, and
    afterwards the module will be destroyed

  * @function _destroy() removes all module data and notifies parents
    that they are not needed by the module anymore (so they could go
    uninitialize if they are not used by anything else)

  * @function _invalidate() calls the failure callback and destroys
    the module when it could not be loaded (or circular dependence is
    discovered).  All children are also recursively invalidated

  Each module keeps a list of statistics-arrays where the module
  should be tracked. When a kernel.Module object is created, there is
  only one such array, kernel._statistics, which is returned by the
  kernel.getStatistics() function.  But if a user requests a
  statistics for a some particular module using getStatistics()
  method, the personal statistics array for that module is created,
  and all module's parents are notified about they should participate
  in that statiscs (_addStats() method).

*********************************************************************/


if (typeof kernel == 'undefined') {
    kernel = {};
}


// reserved names for the module initalizer and uninitializer
init = null;
uninit = null;

kernel.moduleStates = {
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
        if ( child._isSubChild(path) ) {
            kernel._throw( 'Circular dependence: ' + path );
            child._invalidate();
        } else {
            var module = kernel._getOrCreateModule(path);
            module._addChild(child);

            // participating in child's statistics
            for ( var i=0; i < child._statsList.length; i++ ) {
                module._addStats( child._statsList[i] );
            }
        }
    }  // else include() was not called in the module head
};



/**
 * @function kernel.require() notifies the kernel that a module with
 * the given path is requested.  Kernel loads and initializes the
 * module and its dependences (if the module has not been loaded yet),
 * and then launches the provided callback
 *
 * @param {String} path Absolute path to the module source (or an
 * array of such paths)
 * @param {Function} sCb callback to call after all modules are ready
 * @param {Function} fCb callback to call if some of the required
 * modules could not be loaded/initialized (wrong path or circular
 * dependence)
 *
 * @returns {Object} Reservation ticket (or an array of tickets)
 */
kernel.require = function( paths, sCb, fCb ) {
    if ( typeof paths == 'string' ) {
        // single module required
        return kernel.require( [paths], sCb, fCb )[0];
    } else {
        var tickets = [];

        // sCb called after all modules ready
        var singleSCb = null;
        if (sCb) {
            var modulesLeft = paths.length;
            singleSCb = function() {
                modulesLeft--;
                if (!modulesLeft) {
                    sCb();
                }
            };
        }

        // fCb called after single failure
        var failure = false;
        var singleFCb = function( path ) {
            if (!failure) {
                failure = true;
                kernel.release(tickets);
                if (fCb) {
                    fCb(path);
                }
            }
        };

        var module;
        for ( var i = 0; i < paths.length; i++ ) {
            module = kernel._getOrCreateModule( paths[i] );
            tickets.push(
                module._require( singleSCb, singleFCb )
            );
        }

        return tickets;
    }
};



/**
 * @function kernel.release() notifies the kernel that a module
 * corresponding to the given ticket is not required anymore. Ticket
 * object is returned by the kernel.require() function
 *
 * @param {Object} ticket reservation ticket to be released (or an
 * array of tickets)
 */
kernel.release = function( ticket ) {
    if ( typeof ticket.module != 'undefined' ) {
        // single ticket provided
        ticket.module._release( ticket );
    } else {
        for ( var i = 0; i < ticket.length; i++ ) {
            ticket[i].module._release( ticket[i] );
        }
    }
};



/**
 * @function kernel.getModulesList()
 * @returns {Array} array of the modules known to the kernel
 */
kernel.getModulesList = function() {
    return kernel._modules;
};



/**
 * @function kernel.getModule() searches for a module by its path
 *
 * @param {String} path absolute path of a module to search for
 *
 * @returns {kernel.Module} module object with the path, null if none
 */
kernel.getModule = function( path ) {
    var result = null;
    for ( var i = 0; i < kernel._modules.length; i++ ) {
        if ( kernel._modules[i].path == path ) {
            result = kernel._modules[i];
        }
    }

    return result;
};



/**
 * @function kernel.getStatistics()
 * @returns {Array} statistics array tracking all known modules
 */
kernel.getStatistics = function() {
    return kernel._statistics;
};



/**
 * @type kernel.Module represents a single kernel module. Created by
 * the kernel when the module is requested for the first time using
 * include() or kernel.require() functions
 *
 * @param {String} path path of the newly created module
 *
 * @property path absolute path to the module source
 * @property state state of the module, one of kernel.moduleStates
 * @property children[] keeps the modules which included this module
 * @property parents[] keeps the modules included by this module
 */
kernel.Module = function( path ) {
    this.path = path;
    this.state = this._states.created;
    this.children = [];
    this.parents  = [];
    this._sCallbacks = [];
    this._fCallbacks = [];
    this._tickets = [];
    kernel._modules.push(this);
    kernel._loadQueue.push(this);
    this._statsList = []; // list of statistics where participating
    this._addStats( kernel._statistics );
};

kernel.Module.prototype._states = kernel.moduleStates;  // shortcut



/**
 * @function _load() ('loading' state) loads the module source code,
 * calling the platform-dependent script loading function
 */
kernel.Module.prototype._load = function() {
    this._setState( this._states.loading );

    var me = this;
    var sCb = function() {
        if ( me.state == me._states.loading ) {
            me._finalizeLoading();
        }  // otherwise module could already be invalidated
           // because of the discovered circular dependence
    }
    
    var fCb = function() {
        if ( me.state == me._states.loading ) {
            // loading failure
            me._invalidate();
        }  // otherwise module could already be invalidated
           // because of the discovered circular dependence
    }
    
    kernel._platform.load( this.path, sCb, fCb );
};



/**
 * @function _invalidate() destroys the module and calls _invalidate()
 * for all children. Called when there is a problem with loading the
 * module (or some of the module's parents)
 */
kernel.Module.prototype._invalidate = function() {
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
        kernel._platform.thread( child._invalidate, child );
    }
    
    this._destroy();

    if ( this == kernel._activeModule ) {
        kernel._loadNext();
    }
};



/**
 * @function _finalizeLoading() takes the decision on what to do after
 * the module is loaded; called after the module is loaded
 */
kernel.Module.prototype._finalizeLoading = function() {
    if ( typeof init != 'function' && this.parents.length == 0 ) {
        // no init(), no include()
        kernel._throw( 'Initializer missing: ' + this.path );
        this._invalidate();
    } else {
        this._init = init;
        this._uninit = uninit;

        if (!this._isNeeded()) {
            this._destroy();
        } else if ( this._areParentsReady() ) {
            this._initialize();
        } else {
            this._setState( this._states.waiting );
        }

        kernel._loadNext();
    }
}



/**
 * @function  _initialize()  ('initializing'  state)  performs  module
 * initialization, notifies children and decides what to do next
 */
kernel.Module.prototype._initialize = function() {
    this._setState( this._states.initializing );

    // gives time for statistics meters to update
    kernel._platform.thread(
        function() {
            if (this._init) {
                try {
                    this._init();
                } catch(e) {
                    this._invalidate();
                    kernel._throw(e);
                }
            }

            // init() is not cleared at this point, since it may will
            // be needed after the module was initialized, but then
            // requested agan

            if ( this.state != null ) {
                if ( !this._isNeeded() ) {
                    this._uninitialize();
                } else {
                    this._setState( this._states.ready );
                    while ( this._sCallbacks.length>0 ) {
                        ( this._sCallbacks.shift() )();
                    }

                    // initializing children
                    for ( var i = 0; i < this.children.length; i++ ) {
                        if ( this.children[i].state == this._states.waiting &&
                             this.children[i]._areParentsReady() ) {
                            this.children[i]._initialize();
                        }
                    }
                }
            }  // otherwise the module was invalidated 
        },
        this
    );
};



/**
 * @function _uninitialize()  ('uninitializing' state) performs module
 * uninitialization, then destroys the module
 * 
 * Remark: the module is not invalidated in case of uninitializer
 * failure, since the module is going to be destroyed anyway. If the
 * module will be needed again after uninitializer failure, the
 * initializer will simply be relaunched without invalidation, because
 * otherwise the module would only work once - which is not clear and
 * not reasonable
 */
kernel.Module.prototype._uninitialize = function() {
    this._setState( this._states.uninitializing );

    // gives time for statistics meters to update
    kernel._platform.thread(
        function() {
            // will be performed even if uninitializer is broken
            kernel._platform.thread(
                function() {
                    if ( this._isNeeded() ) {
                        this._initialize();
                    } else {
                        this._destroy();
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
};



/**
 * @function _destroy() clears module data, starts uninitialization of
 * the parents which are not needed anymore
 */
kernel.Module.prototype._destroy = function() {
    this._setState( null );

    // cloning the parents since _removeChild could change the list
    var i, parents = [];
    for ( i = 0; i < this.parents.length; i++ ) {
        parents[i] = this.parents[i];
    }
    
    for ( i = 0; i < parents.length; i++ ) {
        parents[i]._removeChild(this);
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
};



/**
 * @function _addChisld() links two modules with a relational
 * dependences
 * 
 * @param {Module} child to link with
 */
kernel.Module.prototype._addChild = function( child ) {
    this.children.push(child);
    child.parents.push(this);
}



/**
 * @function _removeChild() unlinks the module with its child, starts
 * module unloading/destruction if it is not needed anymore
 * 
 * @param {Module} child to unlink with
 */
kernel.Module.prototype._removeChild = function( child ) {
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

    if ( !this._isNeeded() ) {
        if ( this.state == this._states.waiting ) {
            // thread prevents call stack growth
            kernel._platform.thread( this._destroy, this );
        } else if ( this.state == this._states.ready ) {
            this._uninitialize();
        }
    }
}



/**
 * @function getStatistics() returns the module statistics
 * array (initializes statistics tracking if needed)
 *
 * @returns {Array} module's statistics array
 */
kernel.Module.prototype.getStatistics = function() {
    if ( typeof this._statistics == 'undefined' ) {
        this._statistics = [];
        for ( var i in this._states ) {
            this._statistics[ this._states[i] ] = 0;
        }

        this._addStats( this._statistics );
    }

    return this._statistics;
};



/**
 * @function _addStats() recursively adds a new statistics to the
 * _statsList of this and all parent modules.  From this point, the
 * module and its parents will be counted in the mentioned statistics
 *
 * @param {Array} statistics array where a module should be counted
 */
kernel.Module.prototype._addStats = function( statistics ) {
    for ( var i = 0; i < this._statsList.length; i++ ) {
        if ( this._statsList[i] == statistics ) {
            return; // already counted in given statistics
        }
    }

    this._statsList.push(statistics);
    statistics[this.state]++;

    for ( i = 0; i < this.parents.length; i++ ) {
        this.parents[i]._addStats(statistics);
    }
};



/**
 * @function _setState() sets the module state to the given value,
 * updates the statistics arrays the module is participatde in
 *
 * @param {Number} state new state of the module
 */
kernel.Module.prototype._setState = function( state ) {
    var oldState = this.state;
    this.state = state;

    for ( var i = 0; i < this._statsList.length; i++ ) {
        this._statsList[i][oldState]--;
        this._statsList[i][this.state]++;
    }
};



/**
 * @function _isSubChild() recursively checks if at least one of
 * module's (sub)children has the given path. Used to find out
 * the circular dependences
 *
 * @param {String} path path to check for being a (sub)child
 *
 * @returns {Boolean} true if there is a (sub)child having the given
 * path, false otherwise
 */
kernel.Module.prototype._isSubChild = function( path ) {
    for ( var i = 0; i < this.children.length; i++ ) {
        if ( this.children[i].path == path ||
             this.children[i]._isSubChild(path) ) {
             return true;
        }
    }

    return false;
};



/**
 * @function _isNeeded() reports whether the module is still needed
 * (included by some other module which is still in use, or required
 * with a ticket which has not yet been released)
 *
 * @returns {Boolean} true if the module is used, false otherwise
 */
kernel.Module.prototype._isNeeded = function() {
    return this._tickets.length > 0 || this.children.length > 0;
};



/**
 * @function _areParentsReady() reports whether all of the module's
 * parents are initialized and thus ready to use
 *
 * @returns {Boolean} true if all parents are initialized, false
 * otherwise
 */
kernel.Module.prototype._areParentsReady = function() {
    for ( var i = 0; i < this.parents.length; i++ ) {
        if ( this.parents[i].state != this._states.ready ) {
            return false;
        }
    }
    return true;
};



/**
 * @function _require() tells a module that it was required and thus
 * could not be uninitialized until it is released, generates module
 * reservation ticket; calls the callback after the module is ready
 *
 * @param {Function} sCb callback to call after the module is ready
 * @param {Function} fCb callback to call if the module has failed
 *
 * @returns {Object} module reservation ticket
 */
kernel.Module.prototype._require = function( sCb, fCb ) {
    var ticket = { module:this };
    this._tickets.push(ticket);

    if ( this.state == this._states.ready ) {
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

    return ticket;
};



/**
 * @function _release() removes the given ticket and unloads the
 * module if it is not needed anymore
 *
 * @param {Object} ticket module reservation ticket to release
 */
kernel.Module.prototype._release = function( ticket ) {
    for ( var i = 0; i < this._tickets.length; i++ ) {
        if ( this._tickets[i] == ticket ) {
            this._tickets.splice(i,1);
            break;
        }
    }

    if ( !this._isNeeded() ) {
        if ( this.state == this._states.waiting ) {
            this._destroy();
        } else if ( this.state == this._states.ready ) {
            this._uninitialize();
        }
    }
};



kernel._modules = [];        // list of all known modules
kernel._activeModule = null; // currently loading module
kernel._loadQueue = [];      // list of modules to be loaded
kernel._statistics = [];     // keeps number of modules for each state
for ( var i in kernel.moduleStates ) {
    kernel._statistics[ kernel.moduleStates[i] ] = 0;
}



/**
 * @function kernel._getAbsolute() converts the relative path given to
 * the include() to the absolute  path (which is either related to the
 * path of main.js module or starts from http:// or https://)
 *
 * @param {String} path of a module as gives to include()
 * @param {String} childPath path of a module performing the include()
 *
 * @returns {String} absolute path of a module
 */
kernel._getAbsolute = function( path, childPath ) {
    // concatinating path with the child's path (without the filename)
    // path starting from 'http://' or 'https://' treated as absolute
    if ( path.substr(0,7).toLowerCase() != 'http://' &&
         path.substr(0,8).toLowerCase() != 'https://' ) {
        path = childPath.substr( 0, childPath.lastIndexOf('/')+1 ) + path;
    }

    // resolving (clearing) up-dir sequences such as 'foo/../'
    var newPath = path;
    do {
        path = newPath;
        newPath = path.replace( /[\w\.~]*\/\.\.\//, '' );
    } while ( newPath!=path );

    return path;
};



/**
 * @function kernel._getOrCreateModule() searches for a module with
 * the given path, creates it if there is no such module found, and
 * returns the module
 *
 * @param {String} path of the module to search for or create
 *
 * @returns {kernel.Module} found or newly created module
 */
kernel._getOrCreateModule = function( path ) {
    var module = kernel.getModule(path);
    if (!module) {
        module = new kernel.Module(path);
        if ( !kernel._activeModule ) {
            kernel._loadNext();
        }
    }

    return module;
};



/**
 * @function kernel._loadNext() performs the loop of loading each next
 * pending module (if there is one)
 */
kernel._loadNext = function() {
    init = uninit = null;
    kernel._activeModule = kernel._loadQueue.pop() || null;
    if ( kernel._activeModule ) {
        kernel._activeModule._load();
    }
};



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

