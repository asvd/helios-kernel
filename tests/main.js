include("lighttest.js");

init = function() {
    var dir = typeof __dirname != 'undefined' ? __dirname : '';

    lighttest.start({

        'Dynamically loading and unloading a module with a dependency':
        function() {
            var ticket1, ticket2;

            test01_1 = false;
            test01_2 = false;

            var stage1 = function() {
                // is module loaded successfully?
                lighttest.check( test01_1 && test01_2 );

                kernel.release(ticket1);
                setTimeout( stage2, 10 );
            }

            var stage2 = function() {
                // requiring a module again shortly after release
                ticket2 = kernel.require( dir+"/test01/test01.js", stage3 );
            }

            var stage3 = function() {
                lighttest.check( test01_1 && test01_2 );

                // finally releasing the module
                test01_1_uninit = false;
                test01_2_uninit = false;
                kernel.release(ticket2);
                setTimeout( stage4, 100 );
            }

            var stage4 = function() {
                lighttest.check( test01_1_uninit );
                setTimeout( stage5, 300 );
            }

            var stage5 = function() {
                lighttest.check( test01_2_uninit );
                lighttest.done();
            }

            ticket1 = kernel.require( dir+"/test01/test01.js", stage1 );
        },
                      
                      
                      
        'Up-dir sequence path reslution for the include()':
        function() {
            var cb = function() {
                lighttest.check( test02_2 );
                kernel.release(ticket);
                lighttest.done();
             }

             var ticket = kernel.require( dir+"/test02/test02.js", cb )
        },


                      
        'Unitializing a module with parents still in use':
        function() {
            var ticket1, ticket2;
            var stage1 = function() {
                ticket2 = kernel.require( dir + "/test03/test03_2.js", stage2 );
            }

            var stage2 = function() {
                kernel.release(ticket1);
                setTimeout(stage3, 300);
            }

            var stage3 = function() {
                lighttest.check( test03_1_uninit );
                lighttest.check( !test03_common_uninit );

                // finally releasing the module
                kernel.release(ticket2);
                setTimeout( stage4, 100 );
            }

            var stage4 = function() {
                // check if a module actually released
                lighttest.check( test03_common_uninit );
                lighttest.done();
            }

            ticket1 = kernel.require( dir + "/test03/test03_1.js", stage1 );
        },


                      
        'Loading and unloading several modules at once':
        function() {
            var stage1 = function() {
                lighttest.check(
                    test04a_module1_initialized == "yes" &&
                    test04a_module2_initialized == "yes" &&
                    test04a_module2_dep_initialized == "yes" &&
                    test04a_module3_initialized == "yes" &&
                    test04a_module3_dep_initialized == "yes"
                );

                kernel.release(ticket);

                setTimeout( stage2, 100 );
            }

            var stage2 = function() {
                lighttest.check(
                    test04a_module1_uninitialized == "yes" &&
                    test04a_module2_uninitialized == "yes" &&
                    test04a_module3_uninitialized == "yes"
                );

                setTimeout( stage3, 1000 );
            }

            var stage3 = function() {
                lighttest.check(
                    typeof test04a_module2_dep_uninitialized != "undefined" &&
                    test04a_module2_dep_uninitialized == "yes" &&
                    test04a_module3_dep_uninitialized == "yes"
                );

                lighttest.done();
            }

            var ticket = kernel.require(
                [
                    dir+"/test04a/module1.js",
                    dir+"/test04a/module2.js",
                    dir+"/test04a/module3.js",
                    dir+"/test04a/module3_dep.js"
                ],
                stage1
            );
        },


                      
        'Loading a list with invalid module / dependency':
        function() {
            var ticket1, ticket2;

            var sCb1 = function() {
                // require() should fail
                lighttest.check(false);
                setTimeout(stage2, 500);
            }

            var fCb1 = function() {
                lighttest.check(true);
                setTimeout(stage2, 500);
            }

            var stage2 = function() {
                lighttest.check( test04a_module3_dep_uninitialized == "yes" );
                lighttest.check( ( test04a_module1_uninitialized == "yes" &&
                         test04a_module1_initialized == "yes" ) ||
                       ( test04a_module1_uninitialized == "no" &&
                         test04a_module1_initialized == "no" ) );
                
                // loading a list with invalid dependency
                test04a_module1_uninitialized = "no";
                test04a_module1_initialized = "no";

                ticket2 = kernel.require(
                    [
                        dir+"/test04a/module1.js",
                        dir+"/test04a/module2.js",
                        dir+"/test04a/invalid_dep1.js",
                        dir+"/test04a/module3_dep.js",
                        dir+"/test04a/invalid_dep2.js",
                        dir+"/test04a/module3.js"
                    ],
                    sCb2, fCb2
                );
            }

            var sCb2 = function() {
                lighttest.check(false);
                setTimeout(stage3, 500);
            }

            var fCb2 = function() {
                lighttest.check(true);
                setTimeout(stage3, 500);
            }

            var stage3 = function() {
                lighttest.check( test04a_module3_dep_uninitialized == "yes" );
                lighttest.check( ( test04a_module1_uninitialized == "yes" &&
                         test04a_module1_initialized == "yes" ) ||
                       ( test04a_module1_uninitialized == "no" &&
                         test04a_module1_initialized == "no" ) );

                // releasing the broken tickets
                kernel.release( ticket1 );
                kernel.release( ticket2 );
                lighttest.done();
            }


            // loading a list with invalid module
            ticket1 = kernel.require(
                [
                    dir+"/test04a/module2.js",
                    dir+"/test04a/module1.js",
                    dir+"/test04a/noSuchModule.js",
                    dir+"/test04a/module3_dep.js",
                    dir+"/test04a/module3.js"
                ],
                sCb1, fCb1
            );
        },
                      

        'Statistics: global modules count':
        function() {
            var readyNr = kernel.getStats().ready;

            var stage1 = function() {
                setTimeout(stage2,300);
            }

            var stage2 = function() {
                lighttest.check( !kernel.getStats().pending );
                var newReadyNr = kernel.getStats().ready;
                lighttest.check( newReadyNr - readyNr == 4 );

                // releasing ticket and counting again
                kernel.release(ticket);
                setTimeout(stage3,3000);
            }

            var stage3 = function() {
                var newReadyNr = kernel.getStats().ready;
                lighttest.check( newReadyNr == readyNr );
                lighttest.done();
            }

            var ticket = kernel.require( dir + "/test05/test05.js", stage1 );
            lighttest.check( kernel.getStats().pending );
        },


        'Statistics: ticket modules count':
        function() {
            var ticket1, ticket2;
            var stage1 = function() {
                lighttest.check(kernel.getStats(ticket1).ready == 3);

                // ticket with common dependence should not influence the statistics
                ticket2 = kernel.require(
                    [
                        dir + "/test05a/test05a_start2.js",
                        dir + "/test05a/test05a_start2a.js"
                    ],
                    stage2
                );
            }

            var stage2 = function() {
                lighttest.check( kernel.getStats(ticket1).ready == 3 );
                lighttest.check( kernel.getStats(ticket2).ready == 3 );
                kernel.release(ticket1);
                setTimeout( stage3, 300 );
            }

            var stage3 = function() {
                lighttest.check( kernel.getStats(ticket2).ready == 3);
                kernel.release(ticket2);
                lighttest.done();
            }

            ticket1 = kernel.require( dir + "/test05a/test05a_start1.js", stage1 );
        },


        'Quickly requiring and releasing tickets':
        function() {
            var ticket1, ticket2, ticket3, ticket4, ticket5;

            var stage1 = function() {
                kernel.release(ticket1);
                setTimeout(stage2, 100);
            }

            var stage2 = function() {
                lighttest.check(test06_uninit);

                // two tickets, will be released in reversed order
                ticket2 = kernel.require( dir+"/test06/test06.js", stage3 );
            }

            var stage3 = function() {
                ticket3 = kernel.require( dir+"/test06/test06.js", stage4 );
            }

            var stage4 = function() {
                kernel.release( ticket2 );
                setTimeout( stage5, 100 );
            }

            var stage5 = function() {
                kernel.release( ticket3 );
                setTimeout( stage6, 100 );
            }

            var stage6 = function() {
                lighttest.check( test06_uninit );

                ticket4 = kernel.require( dir+"/test06/test06.js", stage7 );
            }

            var stage7 = function() {
                lighttest.check( !test06_uninit );

                // requiring and releasing sumltaniously
                ticket5 = kernel.require( dir+"/test06/test06.js", stage8 );
                kernel.release(ticket4);
            }

            var stage8 = function() {
                lighttest.check( !test06_uninit );
                setTimeout(stage9, 300);
            }

            var stage9 = function() {
                lighttest.check( !test06_uninit );
                kernel.release( ticket5 );
                setTimeout(stage10, 100); 
            }

            var stage10 = function() {
                lighttest.check( test06_uninit );
                lighttest.done();
            }

            ticket1 = kernel.require( dir+"/test06/test06.js", stage1 );
        },


        'Prevent module unload until all related tickets are released':
        function() {
            var ticket1, ticket2, ticket3;

            var stage1 = function() {
                ticket2 = kernel.require( dir+"/test07/test07.js", stage2 );
            }

            var stage2 = function() {
                ticket3 = kernel.require( dir+"/test07/test07.js", stage3 );
            }

            var stage3 = function() {
                kernel.release(ticket1);
                setTimeout(stage4, 300);
            }

            var stage4 = function() {
                lighttest.check( test07_init );
                lighttest.check( !test07_uninit );

                // finally unloading all the tickets
                kernel.release(ticket2);
                kernel.release(ticket3);
                setTimeout(stage5, 100);
            }

            var stage5 = function() {
                lighttest.check( test07_uninit );
                lighttest.done();
            }
            
            ticket1 = kernel.require( dir+"/test07/test07.js", stage1 );
        },


        'Loading module with syntax error':
        function() {
            var sCb = function() {
                // broken module sholud fail
                lighttest.check(false);
                stage2();
            }

            var fCb = function() {
                lighttest.check(true);
                stage2();
            }

            var stage2 = function() {
                kernel.release(ticket);
                lighttest.done();
            }

            var ticket = kernel.require( dir+"/test08/broken.js", sCb, fCb );
        },


        'Loading modules with reference errors':
        function() {
            var ticket1, ticket2;

            var stage1 = function() {
                // module with a reference error in initializer
                test08_valid_initialized = false;
                ticket1 = kernel.require(
                    dir+"/test08/broken_init.js", stage1Success, stage1Failure
                );
            }

            var stage1Success = function() {
                // broken module sholud fail
                lighttest.check(false);
                stage2();
            }

            var stage1Failure = function() {
                lighttest.check(true);
                setTimeout( stage2, 500 );
            }

            var stage2 = function() {
                lighttest.check( !test08_valid_initialized );
                kernel.release(ticket1);

                // reference error in uninitializer
                ticket2 = kernel.require(
                    dir+"/test08/broken_uninit.js", stage2Success, stage2Failure
                );
            }

            var stage2Success = function() {
                // should load fine
                lighttest.check(true);
                stage3();
            }

            var stage2Failure = function() {
                lighttest.check(false);
                stage3();
            }

            var stage3 = function() {
                lighttest.check( test08_valid_initialized );
                lighttest.check( test08_broken_uninit_initialized );
                kernel.release( ticket2 );
                setTimeout( stage4, 500 );
            }

            var stage4 = function() {
                lighttest.check(!test08_valid_initialized);
                lighttest.done();
            }

            stage1();
        },


        'Loading a module twice':
        function() {
            var ticket1, ticket2;

            var stage1 = function() {
                ticket2 = kernel.require( dir+"/test10/test10.js", stage2 );
            }

            var stage2 = function() {
                lighttest.check( test10_init == 1 );

                kernel.release( ticket1 );
                kernel.release( ticket2 );
                setTimeout( stage3, 100 );
            }

            var stage3 = function() {
                lighttest.check( test10_uninit );
                lighttest.done();
            }

            ticket1 = kernel.require( dir+"/test10/test10.js", stage1 );
        },


        'Requesting a module again shortly after release':
        function() {
            var ticket1, ticket2;

            var stage1 = function() {
                kernel.release( ticket1 );
                setTimeout( stage2, 10 );
            }

            var stage2 = function() {
                ticket2 = kernel.require( dir+"/test14/test14_1.js", stage3 );
            }

            var stage3 = function() {
                setTimeout( stage4, 300 );
            }

            var stage4 = function() {
                lighttest.check( test14_init );
                lighttest.check( !test14_uninit );
                debugger;
                kernel.release( ticket2 );
                setTimeout( lighttest.done, 300 );
            }

            ticket1 = kernel.require( dir+"/test14/test14_1.js", stage1 );
        },


        'Releasing a ticket right after require':
        function() {
            var ticket;

            var stage1 = function() {
                test15_init = false;
                ticket = kernel.require( dir + "/test15/test15.js" );
                kernel.release(ticket);
                setTimeout( stage2, 300 );
            }

            var stage2 = function() {
                // initializer should not run
                lighttest.check( !test15_init );
                lighttest.done();
            }

            stage1();
        },


        'Error simulation: loading module without includes and initializer':
        function() {
            var sCb = function() {
                lighttest.check(false);
                kernel.release(ticket);
                lighttest.done();
            }

            var fCb = function() {
                lighttest.check( true );
                kernel.release(ticket);
                lighttest.done();
            }

            var ticket = kernel.require( dir + "/test16/empty.js", sCb, fCb );
        },


        'Releasing already released ticket':
        function() {
            var stage1 = function() {
                lighttest.check( test17_uninit_count == 0 );
                kernel.release(ticket);
                setTimeout( stage2, 300 );
            }

            var stage2 = function() {
                lighttest.check( test17_uninit_count == 1 );

                kernel.release(ticket);
                setTimeout( stage3, 300 );
            }

            var stage3 = function() {
                // uninitializer should not run again
                lighttest.check( test17_uninit_count == 1 );
                lighttest.done();
            }

            var ticket = kernel.require( dir+'/test17/test17.js', stage1 );
        },


        'Loading module with dependences but without initializer':
        function() {
            test16_dep_init = false;

            var cb = function() {
                lighttest.check( test16_dep_init );
                kernel.release(ticket);
                lighttest.done();
            }

            var ticket = kernel.require( dir + "/test16/test16.js", cb );
        },


        'Error simulation: circular dependence':
        function() {
            var sCb = function() {
                lighttest.check(false);
                kernel.release(ticket);
                lighttest.done();
            }

            var fCb = function() {
                lighttest.check(true);
                kernel.release(ticket);
                lighttest.done();
            }
            
            var ticket = kernel.require( dir + "/test18/test18_1.js", sCb, fCb );
        },


        'Error simulation: loading non-existing module':
        function() {
            var sCb = function() {
                lighttest.check(false);
                kernel.release(ticket);
                lighttest.done();
            }

            var fCb = function() {
                lighttest.check(true);
                kernel.release(ticket);
                lighttest.done();
            }
            
            var ticket = kernel.require( dir + "/noSuchPath/noSuchModule.js", sCb, fCb );
        },


        'Error simulation: loading module with non-existing dependence':
        function() {
            test19_init = false;

            var sCb = function() {
                lighttest.check(false);
                stage1();
            }

            var fCb = function() {
                lighttest.check(true);
                stage1();
            }

            var stage1 = function() {
                // should not init ignoring non-existing dependence
                lighttest.check(!test19_init);
                kernel.release(ticket);
                lighttest.done();
            }

            var ticket = kernel.require( dir + "/test19/test19.js", sCb, fCb );
        },


        'Remote dependency':
        function() {
            test19a_check = false;
            helios_remote_dependency_initialized = false;
            helios_remote_module_initialized = false;

            var sCb = function() {
                lighttest.check(true);
                stage1();
            }
            
            var fCb = function() {
                lighttest.check(false);
                stage1();
            }

            var stage1 = function() {
                lighttest.check( test19a_check );
                lighttest.check( helios_remote_dependency_initialized );
                lighttest.check( helios_remote_module_initialized );

                kernel.release(ticket);
                lighttest.done();
            }

            var ticket = kernel.require( dir + "/test19a/test19a.js", sCb, fCb );
        },


        'Unexisting remote dependency':
        function() {
            test19b_init = false;
            var sCb = function() {
                lighttest.check(false);
                stage1();
            }
            
            var fCb = function() {
                lighttest.check(true);
                stage1();
            }

            var stage1 = function() {
                // initializer should not run
                lighttest.check( !test19b_init );

                kernel.release(ticket);
                lighttest.done();
            }

            var ticket = kernel.require( dir + "/test19b/test19b.js", sCb, fCb );
        },


        'Kernel under heavy load':
        function() {
            var stage1 = function() {
                lighttest.check(true);
                kernel.release(ticket);
                setTimeout(stage2, 100);
            }

            var stage2 = function() {
                lighttest.check(true);
                lighttest.done();
            }

            var ticket = kernel.require( dir + "/test20/main.js", stage1 );
        }
     });


}

