/**
 * @fileoverview contains routines loaded by the plugin Worker under
 * web-browser
 */

environment = {};
environment.connection = {};

environment.connection._onMessage = function(){};


/**
 * @function send() sends the given data to the environment site
 * 
 * @param {Object} data to send to the environment
 */
environment.connection.send = function(data) {
    self.postMessage({type: 'message', data: data});
}

/**
 * @function setOnMessage() sets the event handler for the message
 * from the environment
 */
environment.connection.setOnMessage = function(handler) {
    environment.connection._onMessage = handler;
}


/**
 * Event lisener for the plugin message
 */
self.addEventListener('message', function(e){
    switch (e.data.type) {
    case 'import':
        importScript(e.data.url);
        break;

    case 'message':
        environment.connection._onMessage(e.data.data);
        break;
    }
});


/**
 * @function importScript loads and executes the
 * JavaScript file with the given url
 *
 * @param {String} url to load
 */
var importScript = function(url) {
    var error = null;
    try {
        importScripts(url);
    } catch (e) {
        error = e;
    }

    if (error) {
       self.postMessage({type: 'importFailure', url: url});
       throw error;
    } else {
       self.postMessage({type: 'importSuccess', url: url});
    }

}

