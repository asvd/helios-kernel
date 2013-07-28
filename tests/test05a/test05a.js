include("test05a_1.js", "test05a_2.js","test05a_3.js");

init = function() {
    test05a_okay = ( test05a_1_initialized && test05a_2_initialized && test05a_3_initialized );
}
