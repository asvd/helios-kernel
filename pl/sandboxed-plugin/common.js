
/**
 * @fileoverview Contains some routines loaded both into the
 * environment and into each plugin
 */



/**
 * @function _ReferenceStore is a special object which stores other
 * objects and provides the references (number) instead, which may be
 * then sent over a json-based communication channel (IPC to another
 * Node.js process or as a message to the Worker). Other side may then
 * provide the reference in the responce message implying the given
 * object should be activated.
 * 
 * Primary usage for the _ReferenceStore is a storage of the
 * callbacks, which therefore makes it possible to initiate a callback
 * execution by the opposite site (which normally cannot directly
 * execute functions over the communication channel).
 * 
 * Each stored object can only be fetched once and is not available
 * for the second time. Each stored object should be fetched, since
 * otherwise it will remain stored forever and will consume memory.
 */
_ReferenceStore = function() {
    this._store = {};    // stored object
    this._indices = [0]; // available indices
}



/**
 * @function _genId() generates the new reference id
 * 
 * @returns {Number} first available id and reserves it
 */
_ReferenceStore.prototype._genId = function() {
    var id;
    if (this._indices.length == 1) {
        id = this._indices[0]++;
    } else {
        id = this._indices.shift();
    }

    return id;
}


/**
 * Releases the given reference id so that it will be available by
 * another object stored
 * 
 * @param {Number} id to release
 */
_ReferenceStore.prototype._releaseId = function(id) {
    for (var i = 0; i < this._indices.length; i++) {
        if (id < this._indices[i]) {
            this._indices.splice(i, 0, id);
            break;
        }

        if (i+1 == this._indices.length) {
            this._indices[i] = id;
        }
    }
}


/**
 * Stores the given object and returns the refernec id instead
 * 
 * @param {Object} obj to store
 * 
 * @returns {Number} reference id of the stored object
 */
_ReferenceStore.prototype.put = function(obj) {
    var id = this._genId();
    this._store[id] = obj;
    return id;
}


/**
 * Retrieves previously stored object and releases its reference id
 * 
 * @param {Number} id of an object to retrieve
 */
_ReferenceStore.prototype.fetch = function(id) {
    var obj = this._store[id];
    this._store[id] = null;
    delete this._store[id];
    this._releaseId(id);
    return obj;
}







/**
 * @function _MessagingSite represents a single site in the
 * communication between the environment and the plugin
 * 
 * @param {Object} connection a special object allowing to send and
 * receive messages from the opposite site (basically it should only
 * provide send() and setOnMessage() methods)
 */
_MessagingSite = function(connection) {
    this._interface = {};
    this._remote = null;
    this._onRemoteUpdate = function(){};
    this._onGetInterface = function(){};
    this._onInterfaceSetAsRemote = function(){};
    this._store = new _ReferenceStore;

    var me = this;
    this._connection = connection;
    this._connection.setOnMessage(
        function(data){ me._processMessage(data); }
    );
}


/**
 * Set a handler to be called when the remote site updates its
 * interface
 * 
 * @param {Function} handler
 */
_MessagingSite.prototype.setOnRemoteUpdate = function(handler) {
    this._onRemoteUpdate = handler;
}


/**
 * Set a handler to be called when received a responce from the remote
 * site reporting that the previously provided interface has been
 * succesfully set as remote for that site
 * 
 * @param {Function} handler
 */
_MessagingSite.prototype.setOnInterfaceSetAsRemote = function(handler) {
    this._onInterfaceSetAsRemote = handler;
}


/**
 * Set a handler to be called when the remote site requests to
 * (re)send the interface. Used to detect an initialzation completion
 * without sending additional request, since in fact 'getInterface'
 * request is only sent by environment at the last step of the plugin
 * initialization
 * 
 * @param {Function} handler
 */
_MessagingSite.prototype.setOnGetInterface = function(handler) {
    this._onGetInterface = handler;
}


/**
 * @returns {Object} set of remote interface methods
 */
_MessagingSite.prototype.getRemote = function() {
    return this._remote;
}


/**
 * Sets the interface of this site making it available to the remote
 * site by sending a message with a set of methods names
 * 
 * @param {Object} _interface to set
 */
_MessagingSite.prototype.setInterface = function(_interface) {
    this._interface = _interface;
    this._sendInterface();
}


/**
 * Sends the actual interface to the remote site upon it was updated
 * or by a special request of the remote site
 */
_MessagingSite.prototype._sendInterface = function() {
    var names = [];
    for (var name in this._interface) {
        if (this._interface.hasOwnProperty(name)) {
            names.push(name);
        }
    }

    this._connection.send({type:'setInterface', api: names});
}


/**
 * Handles a message from the remote site
 */
_MessagingSite.prototype._processMessage = function(data) {
     switch(data.type) {
     case 'method':
         var method = this._interface[data.name];
         var args = this._unwrap(data.args);
         method.apply(null, args);
         break;
     case 'callback':
         var method = this._store.fetch(data.id)[data.num];
         var args = this._unwrap(data.args);
         method.apply(null, args);
         break;
     case 'setInterface':
         this._setRemote(data.api);
         break;
     case 'getInterface':
         this._sendInterface();
         this._onGetInterface();
         break;
     case 'interfaceSetAsRemote':
         this._onInterfaceSetAsRemote();
         break;
     }
}


/**
 * Sends a requests to the remote site asking it to provide its
 * current interface
 */
_MessagingSite.prototype.requestRemote = function() {
    this._connection.send({type:'getInterface'});
}


/**
 * Sets the new remote interface provided by the other site
 * 
 * @param {Array} names list of function names
 */
_MessagingSite.prototype._setRemote = function(names) {
    this._remote = {};
    var i, name, me = this;
    for (i = 0; i < names.length; i++) {
        name = names[i];
        this._remote[name] =
            (function(name) {
                 return function() {
                     me._connection.send({
                         type: 'method',
                         name: name,
                         args: me._wrap(arguments)
                     });
                 };
            })(name);
    }

    this._onRemoteUpdate();
    this._reportRemoteSet();
}


/**
 * Sends a responce reporting that interface just provided by the
 * remote site was sucessfully set by this site as remote
 */
_MessagingSite.prototype._reportRemoteSet = function() {
    this._connection.send({type:'interfaceSetAsRemote'});
}


/**
 * Prepares the provided set of remote method arguments for sending to
 * the remote site, replaces all the callbacks with identifiers
 * 
 * @param {Array} args to wrap 
 * 
 * @returns {Array} wrapped arguments
 */
_MessagingSite.prototype._wrap = function(args) {
    var wrapped = [];
    var callbacks = {};
    var callbacksPresent = false;
    for (var i = 0; i < args.length; i++) {
        if (typeof args[i] == 'function') {
            callbacks[i] = args[i];
            wrapped[i] = {type: 'callback', num : i};
            callbacksPresent = true;
        } else {
            wrapped[i] = {type: 'argument', value : args[i]};
        }
    }

    var result = {args: wrapped};

    if (callbacksPresent) {
        result.callbackId = this._store.put(callbacks);
    }

    return result;
}


/**
 * Unwraps the set of arguments delivered from the remote site,
 * replaces all callback identifiers with a function which will
 * initiate sending that callback identifier back to other site
 * 
 * @param {Object} args to unwrap
 * 
 * @returns {Array} unwrapped args
 */
_MessagingSite.prototype._unwrap = function(args) {
    var result = [];
    var i, arg, cb, me = this;
    for (i = 0; i < args.args.length; i++) {
        arg = args.args[i];
        if (arg.type == 'argument') {
            result.push(arg.value);
        } else {
            cb = (function(i) {
                return function() {
                    me._connection.send({
                        type : 'callback',
                        id   : args.callbackId,
                        num  : i,
                        args : me._wrap(arguments)
                    });
                }
            })(i);

            result.push(cb);
        }
    }

    return result;
}
 
