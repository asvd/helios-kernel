
// custom dialog creation

someDialogAttr = {

    availability : "enabled",
    visibility : "visible"

    children : [
	{
	    type : heliwidgets.Button,
	    name : "myButton1", // when omitted, creates unnamed widget
	    theme : {
		color : "#aabbcc"
	    }
	    // other fields treated as widget states
	    availability : "disabled",
	    geometry : {
		width : 30,
		height : 12,
		top : 10,
		left : 10
	    }
	    title : "click me"
	},
	
	{
	    type : heliwidgets.Area,
	    name : "myArea1", // when omitted, creates unnamed widget
	    theme : {
		color : "#aabbcc"
	    }
	    // other fields treated as widget states
	    availability : "disabled",
	    geometry : {
		width : 30,
		height : 12,
		top : 10,
		left : 10
	    }
	},

	// This is for table
	{
	    type : heliwidgets.Table,
	    name : "myTable1",
	    layout : "horizontal",
	    cells : [
		{
		    name : "myTableCell1",
		    size : 100,
		    children : [
			// bla bla here
		    ]
		}
	    ]
	},

	// Selector
	{
	    type : heliwidgets.Selector,
	    selectedIndex : 0,
	    items : [
		{
		    name : "item1",
		    label : "Hello",
		    // item can also has children
		    children : [
			// something here...
		    ]
		},
		{
		    name : "item2",
		    label : "Hello again"
		}
	    ]
	}

    ]
	
    }
}

