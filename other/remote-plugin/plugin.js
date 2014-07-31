
//environment.remote.showHello();
environment.remote.logMessage('Hello!');


var cb = function(result) {
    environment.remote.logMessage('Result is: '+result);
}

environment.remote.cubeEnv(3, cb);



var iface ={
    square     : function(x, cb) { cb(x*x); },
    cube       : function(x, cb) { cb(x*x*x); },
    wait5sec   : function(cb) { setTimeout(cb, 5000); }
};

environment.setInterface(iface);


var init = function() {
    environment.remote.logMessage('Connection established');

    var cb_ = function() {
        environment.remote.logMessage('Multiple messaging test!\n\n');

        var cb = function(result) {
            environment.remote.logMessage('Result is: '+result);
        }

        environment.remote.cubeDelayed(5, cb);
    }

    environment.remote.wait5sec(cb_);
}


environment.setWhenConnected(init);








/*
var _log = function(text) {
    environment._sendMessage({type:'debug',message:text});
};
     


var init = function() {
    environment.API.logMessage('Hello World! I am a plugin just initialized!');
//    debugger;
    var cb = function(result) {
        environment.API.logMessage('PLUGIN RESULT IS: '+result);
    };

    environment.API.cubeEnv(6, cb);
    environment.API.squareEnv(2, cb);

    environment.API.logMessage('Done!');
}



environment.setPluginAPI();


*/