include( "valid.js" );

init = function() {
    test08_broken_uninit_initialized = true;
}

uninit = function() {
    a.b.c = 0;
}