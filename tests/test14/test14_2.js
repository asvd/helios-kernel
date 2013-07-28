init = function() {
    test14_init = true;
    test14_uninit = false;
}

uninit = function() {
    test14_init = false;

    something = 0;
    for ( var i = 0; i < 10000; i++ ) {
        something += kernel.getStatistics()[kernel.moduleStates.ready];
    }

    test14_uninit = true;


}

