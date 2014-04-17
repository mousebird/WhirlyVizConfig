// We'll store temp values here to clean up the namespace a bit
sftransit = new Object();

// Called when the user taps at a location. Called on the main thread so don't block.
wviz.events.onTap = function(lon,lat)
{
    wviz.clearPopups();
}

// Called when the user taps and hold on a location.  Called on the main thread.
wviz.events.onPress = function(lon,lat)
{
}

// We keep track of the fetched resources here
var fetchedRes = 0;

var resourceCheck = function()
{
    // We're fetching
    if (fetchedRes = 3)
    {
        console.log("Got all resources");
    }
}

// Parse the CartoDB return list
var parseList = function(inp)
{
    console.log("List = " + inp);

    
    for (pair in inp.rows)
    {
        console.log("Pair = " + pair);
    }
}

// Called when the app view is first initialized
wviz.events.onStartup = function()
{
    // Background color
    wviz.setBackgroundColor("#82CAFAFF");
    
    // Name up top
    wviz.setTitle("SF Bus Stops");
    
    // Kick off the requests
    fetchedRes = 0;
    wviz.networkFetch("http://mousebird.cartodb.com/api/v2/sql?q=SELECT MIN(timepullout) as value FROM sf_passenger_count_view_table",
                      function(retVal)
                      {
                        sftransit.minDate = new Date(myRet.rows[0].value);
                        fetchedRes++;
                        resourceCheck();
                      });
    wviz.networkFetch("http://mousebird.cartodb.com/api/v2/sql?q=SELECT MAX(timepullout) as value FROM sf_passenger_count_view_table",
                      function(retVal)
                      {
                        sftransit.maxDate = new Date(myRet.rows[0].value);
                        fetchedRes++;
                        resourceCheck();
                      });
    wviz.networkFetch("http://mousebird.cartodb.com/api/v2/sql?q=SELECT distinct route as list_value, route as display_name FROM sf_passenger_count_view_table order by route",
                      function(retVal)
                      {
                        wviz.eval("myVar = " + retVal);
                        sftransit.routeList = parseList(myVar);
                        fetchedRes++;
                        resourceCheck();
                      });
    
    // Call the config routine to set defaults
    wviz.events.onConfig();
}

// Called when the controls are edited and changed.  Called on the main thread
wviz.events.onConfig = function()
{
//    console.log("onConfig: mode = " + wviz.env.transitType + " date = " + wviz.env.Date + " time = " + wviz.env.Time);

    // Legend on the lower left
//    wviz.setLegend("<html><body style=\"background-color=black;font-size:18;text-align:center;\"><b style=\"color:#F48380\">0m</b> <b style=\"color:#FAB282\">10m</b> <b style=\"color:#FDDF84\">15m</b> <b style=\"color:#DCF288\">20m</b> <b style=\"color:#B6F2AE\">30m</b> <b style=\"color:#98FEE6\">40m</b> <b style=\"color:#83D9FD\">50m</b></body></html>","#000000AA");
}

// We need to set the globe or map type here before anything gets run
wviz.settings = {
    "map type": "globe",
    "start": {
        "lon": -122.461,
        "lat": 37.78,
        "height": 0.25,
    },
    "extents": {
        "minlon": -123,
        "minlat": 37.0,
        "maxlon": -122,
        "maxlat": 38.0,
        "minheight": 0.000227609242,
        "maxheight": 0.00334425364,
        "mintilt": 1.21771169,
        "maxtilt": 0.0
    },
    "info url": "http://mousebird.github.io/WhirlyVizConfig/config_1_2/sftransit.html"
};

// Let the startup routine know we're happy
true;
