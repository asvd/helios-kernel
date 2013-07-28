include( "include/heliwidgets/engines/helianthus/init.js" );
include( "Calculator/Calculator.js" );

init = function() {

//    var rootWidget = heliwidgets.getRootWidget();

//   rootWidget.setThemeProp( "primaryColor", "#bac6c9" );

    // uncomment this line to reskin the application in dark indigo
//    rootWidget.setThemeProp( "primaryColor", "#112233" );

//    rootWidget.setThemeProp( "primaryColor", "#304047" );
//    rootWidget.setThemeProp( "secondaryColor", "#334455" );

    // Now lets create a calculator widget itself
    myCalculator = new Calculator();


    // If you  change its  "cornerRoundness" theme property,  you will
    // get a calculator with rounded buttons and other elements.
//    myCalculator.setThemeProp( "cornerRoundness", 20 );


    myCalculator.geometry.set({
	middle: 0,
	center: 0,
	width: 180,
	height: 300
    });

//    rootWidget.appendChild( myCalculator );



//    myCalculator.availability.set( "disabled" );


//   myCalculator.baseSelector.items[ 1 ].availability.set( "disabled" );

//    myCalculator.baseSelector.items[ 2 ].index.set( 3 );

}

