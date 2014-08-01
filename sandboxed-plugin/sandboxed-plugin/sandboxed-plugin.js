
/**
 * @fileoverview Main library script, the only one to be loaded by a
 * developer into the application
 */


(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((root.sandbox = {}));
    }     
}(this, function (exports) {
    var platform = {};
    platform._isNode = typeof window == 'undefined';

    
    if (platform._isNode) {

    } else {
        // web-browser

        var script = document.getElementsByTagName('script');
        platform._currentPath = script[ script.length-1 ].src
            .split('?')[0]
            .split('/')
            .slice(0, -1)
            .join('/')+'/';
        

        /**
         * @function platform._load() loads additional script to the
         * current (environment) context and executes the callback
         * 
         * @param {String} path of the script to load
         * @param {Function} cb
         */
        platform._load = function(path, cb) {
            var script = document.createElement('script');
            script.src = path;

            var clear = function() {
                script.onload = null;
                script.onerror = null;
                script.onreadystatechange = null;
                script.parentNode.removeChild(script);
            }

            var success = function() {
                clear();
                cb();
            }

            script.onerror = clear;
            script.onload = success;
            script.onreadystatechange = function() {
                var state = script.readyState;
                if (state==='loaded' || state==='complete') {
                    success();
                }
            }

            document.body.appendChild(script);
        }



        platform._initialized = false;

        platform._origOnload = window.onload || function(){};
        window.onload = function(){
            platform._origOnload();

            var cb = function(){
                platform._initialized = true;
                platform._launchLoaded();
            }

            platform._load(platform._currentPath+'_common.js', cb);
        }

        platform._loadedCbs = [];
        platform._whenLoaded = function(cb) {
            if (platform._initialized) {
                cb();
            } else {
                platform._loadedCbs.push(cb);
            }
        }

        platform._launchLoaded = function() {
            for (var i = 0; i < platform._loadedCbs.length; i++) {
                platform._loadedCbs[i]();
            }
        }


        platform._blobSrc = [
          ' self.addEventListener("message", function(e){          ',
          '     if (e.data.type == "initImport") {                 ',
          '         importScripts(e.data.url);                     ',
          '         self.postMessage({type: "initImportSuccess"}); ',
          '     }                                                  ',
          ' });                                                    '
        ].join('\n');
        
        platform._blobUrl = window.URL.createObjectURL(
            new Blob([platform._blobSrc])
        );
        

        /**
         * @function PlatformPlugin is a browser-based implementation
         * of the platform-dependent part of the plugin object
         * (available to the environment)
         */
        platform.Plugin = function() {
            this._initialized = false;
            this._importCallbacks = {};
            this._messageHandler = function(){};
            this._initHandler = function(){};

            this._worker = new Worker(platform._blobUrl);

            var me = this;
            this._worker.addEventListener('message', function(e) {
//                console.log('<=========');
//                console.log(e.data);
                switch(e.data.type) {
                case 'message':
                    me._messageHandler(e.data.data);
                    break;
                case 'initImportSuccess':
                    platform._whenLoaded(function() {
                        me._initialized = true;
                        me._initHandler();
                    });
                    break;
                case 'importSuccess':
                    me._handleImportSuccess(e.data.url);
                    break;
                case 'importFailure':
                    me._handleImportFailure(e.data.url);
                    break;
                }
            });
            
            this._worker.addEventListener('error', function(e) {
                debugger;
            });
            this._worker.postMessage({
                type: 'initImport',
                url: platform._currentPath + '_pluginWeb.js'
            });
        }



        /**
         * Adds init handler
         * 
         * @param {Function} handler to be called upon init
         */
        platform.Plugin.prototype.setWhenInit = function(handler) {
            if (this._initialized) {
                handler();
            } else {
                this._initHandler = handler;
            }
        }


        /**
         * Adds a handler for a message received from the plugin
         * 
         * @param {Function} handler to call upon a message
         */
        platform.Plugin.prototype.setOnMessage = function(handler) {
            this._messageHandler = handler;
        }



        /**
         * Tells the plugin to import additional scirpt
         * 
         * @param {String} url of a script to import
         * @param {Function} sCb to call upon import completed
         * @param {Function} fCb to call upon import failed
         */
        platform.Plugin.prototype.importScript = function(url, sCb, fCb) {
            var f = function(){};
            this._importCallbacks[url] = {sCb: sCb||f, fCb: fCb||f};
            this._worker.postMessage({type: 'import', url: url});
        }


        /**
         * Sends a message to a plugin
         * 
         * @param {Object} data to send
         */
        platform.Plugin.prototype.send = function(data) {
//            console.log('=========>');
//            console.log(data);
            this._worker.postMessage({type: 'message', data: data});
        }



        /**
         * Handles import succeeded message from the plugin
         * 
         * @param {String} url of a script loaded by the plugin
         */
        platform.Plugin.prototype._handleImportSuccess = function(url) {
            var sCb = this._importCallbacks[url].sCb;
            this._importCallbacks[url] = null;
            delete this._importCallbacks[url];
            sCb();
        }


        /**
         * Handles import failure message from the plugin
         * 
         * @param {String} url of a script loaded by the plugin
         */
        platform.Plugin.prototype._handleImportFailure = function(url) {
            var fCb = this._importCallbacks[url].fCb;
            this._importCallbacks[url] = null;
            delete this._importCallbacks[url];
            fCb();
        }

    }
    
    
    /**
     * Plugin object constructor
     * 
     * @param {String} url of a plugin to load
     * @param {Object} _interface to provide to the plugin
     */
    var Plugin = function(url, _interface) {
        this._url = url;
        this._initialInterface = _interface||{};

        this._whenConnected = function(){};
        this._whenFailed = function(){};
        this._connected = false;
        this._failed = false;
        this.remote = null;

        var me = this;
        this._platformPlugin = new platform.Plugin;
        this._platformPlugin.setWhenInit(function(){
            me._init();
        });
    }
    

    /**
     * @function _init() creates the _MessagingSite for the plugin,
     * and then loads the common routines (_common.js) into the plugin
     * after it is initialized with the platform-dependent stuff
     */
    Plugin.prototype._init = function() {
        this._site = new _MessagingSite(this._platformPlugin);

        var me = this;
        var sCb = function() {
            me._loadCore();
        }

        var fCb = function() {
            me._launchFailed();
        }

        this._platformPlugin.importScript(
            platform._currentPath+'_common.js', sCb, fCb
        );
    }


    /**
     * @function _loadCore() loads the core scirpt into the plugin
     */
    Plugin.prototype._loadCore = function() {
        var me = this;
        var sCb = function() {
            me._sendInterface();
        }

        var fCb = function() {
            me._launchFailed();
        }
                                 
        this._platformPlugin.importScript(
            platform._currentPath+'_pluginCore.js', sCb, fCb
        );
    }
    
    
    /**
     * Sends the initially set interface to the remote site
     */
    Plugin.prototype._sendInterface = function() {
        var me = this;
        this._site.setOnInterfaceSetAsRemote(function() {
            if (!me._connected) {
                me._loadPlugin();
            }
        });

        this._site.setInterface(this._initialInterface);
        this._initialInterface = {};
    }
    
    
    /**
     * Loads the plugin body
     */
    Plugin.prototype._loadPlugin = function() {
        var me = this;
        var sCb = function() {
            me._requestRemote();
        }

        var fCb = function() {
            me._launchFailed();
        }

        this._platformPlugin.importScript(this._url, sCb, fCb);
    }
    
    
    /**
     * Requests the remote interface from the plugin (possibly set in
     * the plugin body)
     */
    Plugin.prototype._requestRemote = function() {
        var me = this;
        this._site.setOnRemoteUpdate(function(){
            me.remote = me._site.getRemote();
            if (!me._connected) {
                me._connected = true;
                me._whenConnected();
            }
        });

        this._site.requestRemote();
    }

    
    
    /**
     * Sets a promise-based callback executed upon error
     * 
     * @param {Function} cb
     */
    Plugin.prototype.setWhenFailed = function(cb) {
        if (this._failed) {
            cb();
        } else {
            this._whenFailed = cb;
        }
    }
     

    
    /**
     * Launches the failed callback (if set)
     */
    Plugin.prototype._launchFailed = function() {
        this._failed = true;
        if (this._whenFailed) {
            this._whenFailed();
        }
    }
    
    
    /**
     * Sets a function executed after the connection to the plugin is
     * estaplished, and the initial interface-exchange messaging is
     * completed
     * 
     * @param {Function} handler to be called upon initialization
     */
    Plugin.prototype.setWhenConnected = function(handler) {
        if (this._connected) {
            handler();
        } else {
            this._whenConnected = handler;
        }
    }
    
    
    
    /**
     * Sets the environment interface available to the plugin
     * 
     * @param {Object} _interface to set
     */
    Plugin.prototype.setInterface = function(_interface) {
        this._site.setInterface(_interface);
    }


    exports.Plugin = Plugin;
  
}));

