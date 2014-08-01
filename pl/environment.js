var path = 'file:///home/xpostman/projects/code/sandboxed-plugin/plugin.js';

//path = 'http://asvd.github.io/helios-kernel/other/remote-plugin/plugin.js';

var iface = {
    showHello  : function() { alert("HELLO!");},
    logHello   : function() { console.log("HELLO!!"); },
    squareEnv  : function(x, cb) { cb(x*x); },
    cubeEnv    : function(x, cb) { cb(x*x*x) },
    logMessage : function(msg) { console.log('PLUGIN: '+msg); },
    wait5sec   : function(cb) { setTimeout(cb, 5000); },
    cubeDelayed: function(x, cb) {
        var cb1 = function() {
            cb(x*x*x);
        }

        myPlugin.remote.wait5sec(cb1);
    }
};


var myPlugin = new sandbox.Plugin(path, iface);


var init = function() {
    console.log('Connection established');

    var cb = function(result) {
        console.log('ENVIRONMENT: Result is: ' + result);
    }

    myPlugin.remote.square(2,cb);
}

myPlugin.setWhenConnected(init);






myPlugin.setWhenFailed(
    function() {
        debugger;
    }
);




/*

var plugin = new sandbox.Plugin('plugin.js');


plugin.setEnvironmentAPI({
    logMessage : function(msg) { console.log(msg); },
});



plugin.setWhenError(function(reason) {
    console.log('Plugin failed');
    console.log(reason);
});



plugin.setWhenLoaded(function() {
    plugin.API.square(2,cb);

    plugin.release();
});
*/


