init = function() {
    something = 0;
    for ( var i = 0; i < 100000; i++ ) {
        something += kernel.getStats()[kernel.states.ready];
    }
    test13_2_init = true;

}

uninit = function() {
    test13_2_uninit = true;
}