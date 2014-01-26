

init = function() {

// /home/xpostman/projects/code/lighttest/github/lighttest/base.js
(function(){{
    lighttest = {};
}})();


// /home/xpostman/projects/code/lighttest/github/lighttest/platform.js
(function(){{
    lighttest._platform = {};
    if (typeof window != 'undefined') {
        // WEB
        var body = document.getElementsByTagName('body').item(0);
        body.style.margin = 0;
        var style1 = {
                backgroundColor: 'rgb(2, 14, 15)',
                width: '100%',
                height: '100%',
                overflow: 'auto',
                position: 'absolute'
            };
        var div1 = document.createElement('div');
        for (var i in style1) {
            div1.style[i] = style1[i];
        }
        body.appendChild(div1);
        var style2 = {
                color: 'rgb(173, 196, 190)',
                paddingLeft: '5px',
                fontFamily: 'monospace',
                fontSize: '8pt',
                overflow: 'auto',
                position: 'absolute'
            };
        var div2 = document.createElement('div');
        for (i in style2) {
            div2.style[i] = style2[i];
        }
        div1.appendChild(div2);
        lighttest._platform.print = function (text) {
            div2.innerHTML += text.replace(/\ /g, '&nbsp;');
        };
        lighttest._platform._printPlain = function (text) {
            div2.innerHTML += text;
        };
        var styleRed = 'text-shadow : 0px 0px 6px #FD4E7F; color: #F13D35;';
        lighttest._platform.printRed = function (text) {
            lighttest._platform._printPlain('<span style="' + styleRed + '">' + text + '</span>');
        };
        var styleGreen = 'text-shadow : 0px 0px 8px #50A39C; color: #56D670;';
        lighttest._platform.printGreen = function (text) {
            lighttest._platform._printPlain('<span style="' + styleGreen + '">' + text + '</span>');
        };
        lighttest._platform.printLine = function () {
            lighttest._platform.print(' <br/>');
        };
        lighttest._platform.exit = function (code) {
        };
    } else {
        // NODEJS
        var red = '\x1B[31m';
        var green = '\x1B[32m';
        var blue = '\x1B[34m';
        var reset = '\x1B[0m';
        lighttest._platform.print = function (val) {
            process.stdout.write(val);
        };
        lighttest._platform.printRed = function (text) {
            lighttest._platform.print(red + text + reset);
        };
        lighttest._platform.printGreen = function (text) {
            lighttest._platform.print(green + text + reset);
        };
        lighttest._platform.printLine = function () {
            console.log();
        };
        lighttest._platform.exit = function (code) {
            process.exit(code);
        };
        // prevents from crashing on exceptions
        process.on('uncaughtException', function (err) {
            console.log();
            console.error(err);
        });
    }
}})();


// /home/xpostman/projects/code/lighttest/github/lighttest/lighttest.js
(function(){{
    /**
     * Runs the given set of tests
     * 
     * @param {Array} tests list of tests to execute
     * @param {Function} callback optional callback to run after the tests
     */
    lighttest.run = function (tests, callback) {
        var testsArr = [];
        for (var label in tests) {
            if (tests.hasOwnProperty(label)) {
                testsArr.push({
                    label: label,
                    run: tests[label]
                });
            }
        }
        lighttest._tests = testsArr;
        lighttest._testsFailed = 0;
        lighttest._currentTestIdx = 0;
        lighttest._callback = callback || null;
        lighttest._next();
    };
    /**
     * Checks the given value against being true, logs the result for
     * the currently running test
     * 
     * @param {Boolean} value to check
     */
    lighttest.check = function (value) {
        if (value) {
            lighttest._platform.printGreen(' PASS');
        } else {
            lighttest._platform.printRed(' FAIL');
            lighttest._currentFailed = true;
        }
    };
    /**
     * Proceeds to the next test
     */
    lighttest._next = function () {
        var idx = lighttest._currentTestIdx;
        if (idx >= lighttest._tests.length) {
            // all tests processed
            lighttest._finalize();
        } else {
            lighttest._platform.printLine();
            lighttest._currentFailed = false;
            var test = lighttest._tests[idx];
            var label = test.label;
            lighttest._platform.print(label + ' ');
            test.run();
        }
    };
    /**
     * Called by the test body when finished, launches the next test
     */
    lighttest.done = function () {
        if (lighttest._currentFailed) {
            lighttest._testsFailed++;
        }
        lighttest._currentTestIdx++;
        // prevent stack growth
        setTimeout(lighttest._next, 10);
    };
    /**
     * Finalizes testing after all tests completed
     */
    lighttest._finalize = function () {
        if (lighttest._callback) {
            lighttest._callback();
        }
        var failed = lighttest._testsFailed;
        var total = lighttest._tests.length;
        lighttest._platform.printLine();
        lighttest._platform.printLine();
        if (failed) {
            lighttest._platform.print(failed + ' of ' + total + ' tests ');
            lighttest._platform.printRed('FAILED');
        } else {
            lighttest._platform.print(total + ' tests ');
            lighttest._platform.printGreen('PASSED');
        }
        lighttest._platform.printLine();
        lighttest._platform.printLine();
        lighttest._platform.exit(failed);
    };
}})();



};




uninit = function() {


};