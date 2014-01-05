include("platform-dependent.js");

init = function() {

    var NODEJS = typeof __dirname != 'undefined'
        && typeof process != 'undefined';

    var dir = '/tests';  // web path related to html
    if ( NODEJS ) {
        // absolute path of this source file
        dir = __dirname;

        // prevents from crashing on exceptions
        process.on(
            'uncaughtException',
            function (err) {
                console.log();
                console.error(err);
            }
        );
    }
    
    var testNr = 0;

    var newTest = function( name ) {
        if ( testNr > 0 ) {
            tests.printLine();
        }
        tests.print("Test " + (++testNr) + ": " + name + "... " );
    }

    var check = function( cond ) {
        if ( cond ) {
            tests.printGreen( "PASSED " );
        } else {
            tests.printRed( "FAILED " );
        }
    }

    //   LIST OF TESTS
    //
    // - starting point is at the end of file
    // - each new test separated by 3 newlines
    // - functions do not correspond to tests
    
    var stage01 = function() {
        startTime = new Date().getTime();



        newTest("Dynamically loading a module with a dependence");
        stage01ticket = kernel.require(
            dir + "/test01/test01.js", stage01_1
        );
    }
    var stage01_1 = function() {
        check( test01_1 );
        check( test01_2 );



        newTest("Requesting a module again right after it was released");
        kernel.release(stage01ticket);
        stage01_1ticket = kernel.require(
            dir + "/test01/test01.js", stage01_2
        );
    }
    var stage01_2 = function() {
        check( test01_1 );
        check( test01_2 );



        newTest("Requesting a module shortly after it was released");
        kernel.release(stage01_1ticket);
        setTimeout(stage01_3,10);
    }
    var stage01_3 = function() {
        stage01_3ticket = kernel.require(
            dir + "/test01/test01.js", stage02
        );
    }
    var stage02 = function() {
        check( test01_1 );
        check( test01_2 );
        


        newTest("Releasing ticket with dependence");
        kernel.release( stage01_3ticket );
        setTimeout(stage3, 100);
    }
    var stage3 = function() {
        check( test01_1_uninit );
        setTimeout( stage4, 300 );
    }
    var stage4 = function() {
        check( test01_2_uninit );



        newTest("Up-dir sequence path reslution for the include()");
        stage4ticket = kernel.require( dir + "/test02/test02.js", stage5 );
    }
    var stage5 = function() {
        check( test02_2 );
        kernel.release( stage4ticket );
        setTimeout(stage6, 100);
    }
    var stage6 = function() {



        newTest("Unitializing a module with parents still in use");
        stage6ticket = kernel.require( dir + "/test03/test03_1.js", stage7 );
    }
    var stage7 = function() {
        stage7ticket = kernel.require( dir + "/test03/test03_2.js", stage8 );
    }
    var stage8 = function() {
        kernel.release(stage6ticket);
        setTimeout(stage9, 300);
    }
    var stage9 = function() {
        check( test03_1_uninit );
        check( !test03_common_uninit );



        newTest("Finally releasing dependence");
        kernel.release(stage7ticket);
        setTimeout( stage10, 300 );
    }
    var stage10 = function() {
        check( test03_common_uninit );



        newTest( "Loading several modules at once" );
        stage10ticket = kernel.require(
            [
                dir+"/test04a/module1.js",
                dir+"/test04a/module2.js",
                dir+"/test04a/module3.js",
                dir+"/test04a/module3_dep.js"
            ],
            stage10_3
        );
    }
    var stage10_3 = function() {
        check(
            test04a_module1_initialized == "yes" &&
            test04a_module2_initialized == "yes" &&
            test04a_module2_dep_initialized == "yes" &&
            test04a_module3_initialized == "yes" &&
            test04a_module3_dep_initialized == "yes"
        );



        newTest( "Unloading several modules at once" );
        kernel.release( stage10ticket );
        setTimeout( stage10_4, 100 );
    }
    var stage10_4 = function() {
        check(
            test04a_module1_uninitialized == "yes" &&
            test04a_module2_uninitialized == "yes" &&
            test04a_module3_uninitialized == "yes"
        );
        setTimeout( stage10_5, 1000 );
    }
    var stage10_5 = function() {
        check(
            typeof test04a_module2_dep_uninitialized != "undefined" &&
            test04a_module2_dep_uninitialized == "yes" &&
            test04a_module3_dep_uninitialized == "yes"
        );



        newTest( "Loading several modules with one invalid module" );
        test04a_module1_uninitialized = "no";
        test04a_module1_initialized = "no";
        stage10_6ticket = kernel.require(
            [
                dir+"/test04a/module2.js",
                dir+"/test04a/module1.js",
                dir+"/test04a/noSuchModule.js",
                dir+"/test04a/module3_dep.js",
                dir+"/test04a/module3.js"
            ],
            stage10_7_fail,
            stage10_7_success  // failure callback
        );
    }
    var stage10_7_fail = function() {
        check( false );
        stage10_8();
    }
    var stage10_7_success = function() {
        check( true );
        setTimeout( stage10_7_2, 500 );
    }
    var stage10_7_2 = function() {
        check( test04a_module3_dep_uninitialized == "yes" );
        check( ( test04a_module1_uninitialized == "yes" &&
                 test04a_module1_initialized == "yes" ) ||
               ( test04a_module1_uninitialized == "no" &&
                 test04a_module1_initialized == "no" ) );
        stage10_8();
    }
    var stage10_8 = function() {



        newTest( "Loading several modules with invalid dependence" );
        test04a_module1_uninitialized = "no";
        test04a_module1_initialized = "no";
        stage10_8ticket = kernel.require(
            [
                dir+"/test04a/module1.js",
                dir+"/test04a/module2.js",
                dir+"/test04a/invalid_dep1.js",
                dir+"/test04a/module3_dep.js",
                dir+"/test04a/invalid_dep2.js",
                dir+"/test04a/module3.js"
            ],
            stage10_8_fail,
            stage10_8_success  // failure callback
        );
    }
    var stage10_8_fail = function() {
        check( false );
        setTimeout( stage10_8_2, 500 );
    }
    var stage10_8_success = function() {
        check( true );
        setTimeout( stage10_8_2, 500 );
    }
    var stage10_8_2 = function() {
        check( test04a_module3_dep_uninitialized == "yes" );
        check( ( test04a_module1_uninitialized == "yes" &&
                 test04a_module1_initialized == "yes" ) ||
               ( test04a_module1_uninitialized == "no" &&
                 test04a_module1_initialized == "no" ) );
        stage10_9();
    }
    var stage10_9 = function() {



        newTest( "Releasing tickets with common modules" );
        kernel.release( stage10_6ticket );
        kernel.release( stage10_8ticket );



        newTest( "Statistics: counting number of ready modules after require()" );
        tests.readyNr = kernel.getStats().ready;
        stage10_6ticket = kernel.require( dir + "/test05/test05.js", stage11 );
        check( kernel.getStats().pending );
    }
    var stage11 = function() {
        setTimeout( stage12, 300 );
    }
    var stage12 = function() {
        check( !kernel.getStats().pending );
        var newReadyNr = kernel.getStats().ready;
        check( (newReadyNr - tests.readyNr) == 4 );



        newTest( "Statistics: restoring initial number of ready modules after ticket release" );
        kernel.release( stage10_6ticket );
        setTimeout( stage14a, 3000 );
    }
    var stage14a = function() {
        var newReadyNr = kernel.getStats().ready;
        check( newReadyNr == tests.readyNr );



        newTest("Statistics: checking statistics for a single ticket");
        stage14a_ticket1 = kernel.require( dir + "/test05a/test05a_start1.js", stage14a_1 );
    }
    var stage14a_1 = function() {
        var readynr = kernel.getStats( stage14a_ticket1 ).ready;
        check(readynr == 3);



        newTest("Statistics: ticket with common dependence should not influence the statistics");
        stage14a_ticket2 = kernel.require(
            [
                dir + "/test05a/test05a_start2.js",
                dir + "/test05a/test05a_start2a.js"
            ],
            stage14a_2
        );
    }
    var stage14a_2 = function() {
        var readynr1 = kernel.getStats( stage14a_ticket1 ).ready;
        check(readynr1 == 3);
        var readynr2 = kernel.getStats( stage14a_ticket2 ).ready;
        check(readynr2 == 3);
        kernel.release( stage14a_ticket1 );
        setTimeout( stage14a_3, 300 );
    }
    var stage14a_3 = function() {
        var readynr = kernel.getStats( stage14a_ticket2 ).ready;
        check(readynr == 3);
        kernel.release( stage14a_ticket2 );
        
        
        
        newTest("Releasing ticket in the callback");
        stage14ticket = kernel.require(
            dir+"/test06/test06.js",
            function() {
                kernel.release( stage14ticket );
                setTimeout( stage14_1, 100 );
            }
        );
    }
    var stage14_1 = function() {
        check( test06_uninit );



        newTest("Releasing tickets in the callbacks, reversed order");
        stage14_1ticket = kernel.require(
            dir+"/test06/test06.js",
            function() {
                stage14_1ticket2 = kernel.require(
                    dir+"/test06/test06.js",
                    function() {
                        kernel.release( stage14_1ticket );
                        setTimeout(
                            function() {
                                kernel.release( stage14_1ticket2 );
                                setTimeout( stage14_2, 100 );
                            }, 100
                        );
                    }
                );
            }
        );
    }
    var stage14_2 = function() {
        check( test06_uninit );



        newTest("Moule not unloaded if some of the tickets are not released");
        stage14_2ticket1 = kernel.require(
            dir+"/test07/test07.js",
            function() {
                stage14_2ticket2 = kernel.require(
                    dir+"/test07/test07.js",
                    function() {
                        stage14_2ticket3 = kernel.require(
                            dir+"/test07/test07.js",
                            function() {
                                kernel.release( stage14_2ticket1 );
                                setTimeout( stage15, 300 );
                            }
                        );
                    }
                );
            }
        );
    }
    var stage15 = function() {
        check( test07_init );
        check( !test07_uninit );



        newTest("Module unloaded after all tickets released");
        kernel.release( stage14_2ticket2 );
        kernel.release( stage14_2ticket3 );
        setTimeout( stage15_1, 100 );
    }
    var stage15_1 = function() {
        check( test07_uninit );



        newTest("Requiring and releasing a module simultaneously");
        stage15_1ticket = kernel.require(
            dir+"/test06/test06.js",
            stage15_2
        );
    }
    var stage15_2 = function() {
        check( !test06_uninit );
        stage15_2ticket = kernel.require(
            dir+"/test06/test06.js",
            stage15_3
        );
        kernel.release( stage15_1ticket );
    }
    var stage15_3 = function() {
        check( !test06_uninit );
        setTimeout( stage15_4, 300 );
    }
    var stage15_4 = function() {
        check( !test06_uninit );
        kernel.release( stage15_2ticket );
        setTimeout( stage16, 100 );
    }
    var stage16 = function() {
        check( test06_uninit );

        

        newTest("Loading module with a syntax error");
        stage16ticket = kernel.require(
            dir+"/test08/broken.js",
            stage16_fail,
            stage16_success
        );
    }
    var stage16_fail = function() {
        check(false);
        stage16_1();
    }
    var stage16_success = function() {
        check(true);
        stage16_1();
    }
    var stage16_1 = function() {
        kernel.release(stage16ticket);



        newTest("Loading module with a reference error in initializer");
        test08_valid_initialized = false;
        stage16_1ticket = kernel.require(
            dir+"/test08/broken_init.js",
            stage16_1_fail,
            stage16_1_success
        );
    }
    var stage16_1_fail = function() {
        check( false );
        stage16_2();
    }
    var stage16_1_success = function() {
        check( true );
        setTimeout( stage16_2, 500 );
    }
    var stage16_2 = function() {
        check( !test08_valid_initialized );
        kernel.release(stage16_1ticket);



        newTest("Unloading module with a reference error in uninitializer");
        stage16_2ticket = kernel.require(
            dir+"/test08/broken_uninit.js",
            stage16_3success,
            stage16_3fail
        );
    }
    var stage16_3success = function() {
        check( true );
        stage16_4();
    }
    var stage16_3fail = function() {
        check( false );
        stage16_4();
    }
    var stage16_4 = function() {
        check( test08_valid_initialized );
        check( test08_broken_uninit_initialized );
        kernel.release( stage16_2ticket );
        setTimeout( stage16_5, 500 );
    }
    var stage16_5 = function() {
        check( !test08_valid_initialized );



        newTest("Loading a module twice (should be initialized once)");
        stage16_5ticket1 = kernel.require(
            dir+"/test10/test10.js",
            function() {
                stage16_5ticket2 = kernel.require(
                    dir+"/test10/test10.js",
                    stage17
                )
            }
        );
    }
    var stage17 = function() {
        check( test10_init == 1 );



        newTest("Unloading the module loaded twice");
        kernel.release( stage16_5ticket1 );
        kernel.release( stage16_5ticket2 );
        setTimeout( stage18, 100 );
    }
    var stage18 = function() {
        check( test10_uninit );



        newTest( "Requesting again the module which was just released" );
        stage24ticket1 = kernel.require(
            dir+"/test14/test14_1.js",
            function() {
                kernel.release( stage24ticket1 );
                setTimeout(
                    function() {
                        stage24ticket2 = kernel.require(
                            dir+"/test14/test14_1.js",
                            function() {
                                setTimeout( stage25, 300 );
                            }
                        )
                    }, 10
                )
            }
        );
    }
    var stage25 = function() {
        check( test14_init );
        check( !test14_uninit );
        kernel.release( stage24ticket2 );



        newTest("Releasing a module right after require (should not initialize)");
        test15_init = false;
        stage25ticket = kernel.require( dir + "/test15/test15.js");
        kernel.release( stage25ticket );
        setTimeout( stage26, 300 );
    }
    var stage26 = function() {
        check( !test15_init );



        newTest("Error simulation: include() inside initializer");
        include(dir+"/test15/test15.js");
        setTimeout( stage27, 300 );
    }
    var stage27 = function() {
        check( !test15_init );



        newTest("Error simulation: releasing already released ticket");
        kernel.release( stage25ticket );
        setTimeout( stage27a_1, 300 );
    }
    var stage27a_1 = function() {



        newTest("Error simulation: loading module without includes and initializer");
        stage27a_1ticket = kernel.require(
            dir + "/test16/empty.js",
            stage27a_1_fail,
            stage27a_1_success
        );
    }
    var stage27a_1_fail = function() {
        check( false );
        stage27a_2();
    }
    var stage27a_1_success = function() {
        check( true );
        stage27a_2();
    }
    var stage27a_2 = function() {
        kernel.release( stage27a_1ticket );



        newTest("Loading module with dependences but without initializer");
        test16_dep_init = false;
        stage27a_2ticket = kernel.require(
            dir + "/test16/test16.js",
            stage28
        );
    }
    var stage28 = function() {
        check( test16_dep_init );
        kernel.release(stage27a_2ticket);
        


        // IE7 crashes on circular dependence
        newTest("Error simulation: circular dependence");
        stage28ticket = kernel.require(
            dir + "/test18/test18_1.js",
            stage28_fail,
            stage28_success
        );
    }
    var stage28_fail = function() {
        check( false );
        stage29();
    }
    var stage28_success = function() {
        check( true );
        stage29();
    }
    var stage29 = function() {
        kernel.release( stage28ticket );
        setTimeout( stage30, 100 );
    }
    var stage30 = function() {



        newTest("Error simulation: loading non-existing module");
        stage30ticket = kernel.require(
            dir + "/noSuchPath/noSuchModule.js",
            stage30_fail,
            stage30_success
        );
    }
    var stage30_fail = function() {
        // callback should not be called if module is not working
        check(false);
        stage30_1();
    }
    var stage30_success = function() {
        check(true);
        stage30_1();
    }
    var stage30_1 = function() {
        kernel.release( stage30ticket );



        newTest("Error simulation: loading module with non-existing dependence");
        test19_init = false;
        stage30_1ticket = kernel.require(
            dir + "/test19/test19.js",
            stage31_1_fail,
            stage31_1_success
        );
    }
    var stage31_1_fail = function() {
        // callback should not be called if the module was not initialized
        check(false);
        stage31();
    }
    var stage31_1_success = function() {
        check(true);
        stage31();
    }
    var stage31 = function() {
        check( !test19_init ); // should not init ignoring non-existing dependence
        kernel.release( stage30_1ticket );
        setTimeout( stage31_2, 100 );
    }
    var stage31_2 = function() {
        
        
        
        
        newTest("Remote dependency");
        test19a_check = false;
        helios_remote_dependency_initialized = false;
        helios_remote_module_initialized = false;

        var sCb = function() {
            check(true);
            stage31_3();
        }
        
        var fCb = function() {
            check(false);
            stage31_3();
        }

        stage31_2_ticket = kernel.require(
            dir + "/test19a/test19a.js", sCb, fCb
        );
    }

    var stage31_3 = function() {
        check( test19a_check );
        check( helios_remote_dependency_initialized );
        check( helios_remote_module_initialized );
        kernel.release(stage31_2_ticket);
        
        



        stage32();
    }
    var stage32 = function() {


        
        newTest("Kernel under heavy load");
        stage32ticket = kernel.require(
            dir + "/test20/main.js", stage33
        );
        tests.updatePerStats(stage32ticket);
    }
    var stage33 = function() {
        check( true );
        kernel.release( stage32ticket );
        setTimeout( stage34, 100 );
    }
    var stage34 = function() {
        check( true );
        tests.updatePerStats();

        var time = (new Date().getTime()) - startTime;
        tests.printLine();
        tests.print( " Total time: " + time );
        tests.printLine();

   }



    // starting point
    setTimeout( stage01, 300 );
}

