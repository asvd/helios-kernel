
/**
 * @fileoverview Core plugin script loaded into the plugin process /
 * thread
 */


environment._site = new _MessagingSite(environment.connection);
environment._initialized = false;
environment._whenConnected = function(){};

environment._site.setOnRemoteUpdate(function(){
    environment.remote = environment._site.getRemote();
});

environment._site.setOnGetInterface(function(){
    if (!environment._initialized) {
        environment._initialized = true;
        environment._whenConnected();
    }
});



/**
 * Sets a function executed after the connection to the environment is
 * estaplished, and the initial interface-exchange messaging is
 * completed
 * 
 * @param {Function} handler to be called upon initialization
 */
environment.setWhenConnected = function(handler) {
    if (environment._initialized) {
        handler();
    } else {
        environment._whenConnected = handler;
    }
}


/**
 * Sets the plugin interface available to the environment
 * 
 * @param {Object} _interface to set
 */
environment.setInterface = function(_interface) {
    environment._site.setInterface(_interface);
}

