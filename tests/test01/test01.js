include("test01_2.js");

init = function() {
    test01_1 = true;
    test01_1_uninit = false;
}

uninit = function() {
    test01_1_uninit = true;
}