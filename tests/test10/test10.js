
init = function() {
    test10_uninit = false;
    if ( typeof test10_init == "undefined" ) {
        test10_init = 1;
    } else {
        test10_init++;
    }
}

uninit = function() {
    test10_uninit = true;
}