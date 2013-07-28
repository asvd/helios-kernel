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

    var statsOK = function() {
        var stats = kernel.getStatistics();
        var mods = kernel.getModulesList();
        var realStats = [];
        for ( var i in kernel.moduleStates ) {
            realStats[ kernel.moduleStates[ i ] ] = 0;
        }
        for ( i = 0; i < mods.length; i++ ) {
            realStats[ mods[i].state ]++;
        }
        for ( i = 0; i < stats.length; i++ ){
            if ( stats[i] != realStats[i] ) {
                return false;
            }
        }

        return true;
    }



    //   LIST OF TESTS
    //
    // - starting point is at the end of file
    // - each new test separated by 3 newlines
    // - functions do not correspond to tests
    
    var stage01 = function() {
        startTime = new Date().getTime();



        newTest("require()'ing module");
        stage01ticket = kernel.require(
            dir + "/test01/test01.js", stage02
        );
    }
    var stage02 = function() {
        check( test01_1 );
        check( typeof( stage01ticket.module ) != "undefined" );
        var mod =  kernel.getModule( dir + "/test01/test01.js");
        check( stage01ticket.module === mod );



        newTest("Initializing dependences");
        check( test01_2 );
        
        

        newTest("Dependence stored in module's parents[] array");
        var test01mod = kernel.getModule( dir + "/test01/test01.js");
        var parentFound = false;
        for ( var i = 0; i < test01mod.parents.length; i++ ) {
            if ( test01mod.parents[i].path == dir+"/test01/test01_2.js") {
                parentFound = true;
                break;
            }
        }
        check( parentFound );



        newTest("Module stored in dependence's children[] array");
        var test01_2mod = kernel.getModule( dir + "/test01/test01_2.js");
        var childFound = false;
        for (i = 0; i < test01_2mod.children.length; i++) {
            if (test01_2mod.children[i].path == dir+"/test01/test01.js") {
                childFound = true;
                break;
            }
        }
        check( childFound );



        newTest("Releasing ticket");
        kernel.release( stage01ticket );
        setTimeout(stage3, 100);
    }
    var stage3 = function() {
        check( test01_1_uninit );



        newTest( "Dependence aslo unloaded" );
        setTimeout( stage4, 300 );
    }
    var stage4 = function() {
        check( test01_2_uninit );



        newTest("Up-dir sequence in the include() argument");
        stage4ticket = kernel.require( dir + "/test02/test02.js", stage5 );
    }
    var stage5 = function() {
        check( test02_2 );
        kernel.release( stage4ticket );
        setTimeout(stage6, 100);
    }
    var stage6 = function() {



        newTest("Module uninitialized but parents are still used");
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



        newTest( "Preserve uninitialization of still used parent" );
        check( !test03_common_uninit );



        newTest("Unloading dependence with uninitialized children");
        kernel.release(stage7ticket);
        setTimeout( stage10, 300 );
    }
    var stage10 = function() {
        check( test03_common_uninit );



        newTest( "Loading several modules at once" );
        stage10tickets = kernel.require(
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
        kernel.release(
            // all except the module3_dep.js
            stage10tickets.slice(0,-1)
        );
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
            test04a_module3_dep_uninitialized == "no"
        );
        kernel.release( stage10tickets[3] );
        setTimeout( stage10_6, 100 );
    }
    var stage10_6 = function() {
        check( test04a_module3_dep_uninitialized == "yes" );



        newTest( "Loading several modules at once with one invalid module" );
        test04a_module1_uninitialized = "no";
        test04a_module1_initialized = "no";
        stage10_6tickets = kernel.require(
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
        check(
            ( kernel.getModule( dir+"/test04a/module1.js" ) == null ) &&
            ( kernel.getModule( dir+"/test04a/module2.js" ) == null ) &&
            ( kernel.getModule( dir+"/test04a/module3.js" ) == null ) &&
            ( kernel.getModule( dir+"/test04a/module3_dep.js" ) == null ) &&
            ( kernel.getModule( dir+"/test04a/noSuchModule.js" ) == null )
        );
        stage10_8();
    }
    var stage10_8 = function() {



        newTest( "Loading several modules with invalid dependences" );
        test04a_module1_uninitialized = "no";
        test04a_module1_initialized = "no";
        stage10_8tickets = kernel.require(
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
        check(
            ( kernel.getModule( dir+"/test04a/module1.js" ) == null ) &&
            ( kernel.getModule( dir+"/test04a/module2.js" ) == null ) &&
            ( kernel.getModule( dir+"/test04a/module3.js" ) == null ) &&
            ( kernel.getModule( dir+"/test04a/module3_dep.js" ) == null ) &&
            ( kernel.getModule( dir+"/test04a/invalid_dep1.js" ) == null ) &&
            ( kernel.getModule( dir+"/test04b/invalid_dep2.js" ) == null )
        );
        stage10_9();
    }
    var stage10_9 = function() {



        newTest( "Releasing released tickets" );
        kernel.release( stage10_6tickets );
        kernel.release( stage10_8tickets );



        newTest( "Stats ready modules counter" );
        tests.readyNr = kernel.getStatistics()[ kernel.moduleStates.ready ];
        stage10_6ticket = kernel.require( dir + "/test05/test05.js", stage11 );
    }
    var stage11 = function() {
        setTimeout( stage12, 300 );
    }
    var stage12 = function() {
        var newReadyNr = kernel.getStatistics()[ kernel.moduleStates.ready ];
        check( (newReadyNr - tests.readyNr) == 4 );



        newTest( "Stats ready modules counter (after unloading)" );
        kernel.release( stage10_6ticket );
        setTimeout( stage14, 3000 );
    }
    var stage14 = function() {
        var newReadyNr = kernel.getStatistics()[ kernel.moduleStates.ready ];
        check( newReadyNr == tests.readyNr );



        newTest("Uninitializing before calling a callback, 1 time");
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



        newTest("Uninitializing before calling a callback, 2 times");
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



        newTest("Preserving module loaded more than once from being unloaded");
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
        check( ! test07_uninit );
        check( statsOK() );



        newTest("Module unloading after all tickets released");
        kernel.release( stage14_2ticket2 );
        kernel.release( stage14_2ticket3 );
        setTimeout( stage15_1, 100 );
    }
    var stage15_1 = function() {
        check( test07_uninit );
        check( statsOK() );



        newTest("Requiring module simultaneously with the release");
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

        

        newTest("Loading broken module");
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



        newTest("Loading module with a broken initializer");
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
        check( kernel.getModule( dir+"/test08/valid.js" ) == null );
        kernel.release(stage16_1ticket);



        newTest( "Uninitializing a module with a broken uninitializer" );
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
        check( kernel.getModule( dir+"/test08/valid.js" ) == null );
        check( kernel.getModule( dir+"/test08/broken_uninit.js" ) == null );



        newTest("Preventing loading of a module twice");
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
        check( statsOK() );



        newTest("Unloading loaded twice");
        kernel.release( [ stage16_5ticket1, stage16_5ticket2 ] );
        setTimeout( stage18, 100 );
    }
    var stage18 = function() {
        var mod = kernel.getModule(dir+"/test10/test10.js")
        check( test10_uninit );
        check( mod === null);



        newTest("kernel.getModule() function");
        stage18ticket = kernel.require( dir + "/test10/test10.js", stage19);
    }
    var stage19 = function() {
        var mod = kernel.getModule(dir+"/test10/test10.js");
        check( mod.state == kernel.moduleStates.ready);
        kernel.release( stage18ticket );
        setTimeout( stage20, 500 );
    }
    var stage20 = function() {
        var mod = kernel.getModule(dir+"/test10/test10.js");
        check( mod === null);



        newTest( "Module idled on demand before dependence initialized" );
        test12_2_uninit = false;
        test12_2_init = false;
        test12_1_uninit = false;
        stage20ticket = kernel.require( dir + "/test12/test12_1.js");
        setTimeout( stage21, 10 );
    }
    var stage21 = function() {
        kernel.release( stage20ticket );
        setTimeout( stage22, 100 );
    }
    var stage22 = function() {
        check( !test12_1_uninit ); // test12_1 not unloaded (it was not loaded)
        check( !test12_2_init ); // test12_2 not yet initialized



        newTest( "Dependence not yet unloaded" );
        check( !test12_2_uninit ); // test12_2_uninit not yet started
        check( statsOK() );



        newTest( "Uninitialize module if it is not needed after init" );
        test13_2_uninit = false;
        test13_2_init = false;
        stage22ticket = kernel.require( dir+"/test13/test13_1.js");
        setTimeout( stage23, 1000 ); // maybe tune the delay, it should be called after init of test13_2  started
    }
    var stage23 = function() {
        kernel.release( stage22ticket );
        setTimeout( stage24, 100 );
    }
    var stage24 = function() {
        check( test13_2_init );
        check( statsOK() );



        newTest( "Loading back once again needed module after uninit()" );
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
        check( statsOK() );
        kernel.release( stage24ticket2 );



        newTest("Not initializing never used module");
        test15_init = false;
        stage25ticket = kernel.require( dir + "/test15/test15.js");
        kernel.release( stage25ticket );
        setTimeout( stage26, 300 );
    }
    var stage26 = function() {
        check( !test15_init );
        check( statsOK() );



        newTest("Error simulation: include() inside the code");
        include(dir+"/test15/test15.js");
        setTimeout( stage27, 300 );
    }
    var stage27 = function() {
        check( kernel.getModule(dir+"/test15/test15.js") === null );
        check( !test15_init );



        newTest("Error simulation: releasing already released ticket");
        kernel.release( stage25ticket );
        setTimeout( stage28, 300 );
    }
    var stage28 = function() {
        check( statsOK() );



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
        check( statsOK() );
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



        newTest("Error simulation: loading non-existing dependence");
        test19_init = false;
        stage30_1ticket = kernel.require(
            dir + "/test19/test19.js",
            stage31_1_fail,
            stage31_1_success
        );
    }
    var stage31_1_fail = function() {
        // callback should not be called if module is not working
        check(false);
        stage31();
    }
    var stage31_1_success = function() {
        check(true);
        stage31();
    }
    var stage31 = function() {
        check( !test19_init ); // should not init ignoring non-existing dependence
        check( statsOK() );
        kernel.release( stage30_1ticket );
        setTimeout( stage32, 100 );
    }
    var stage32 = function() {


        
        newTest("Kernel under heavy load");
        stage32ticket = kernel.require(
            dir + "/test20/main.js", stage33
        );
        tests.updatePerStats();
    }
    var stage33 = function() {
        check( true );
        var total = kernel.getModulesList().length;
        tests.print( "[" + total + " modules total] " );
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

