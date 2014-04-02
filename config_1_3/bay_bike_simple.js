// We'll store temp values here to clean up the namespace a bit
baybike = new Object();

// Called when the user taps at a location. Called on the main thread so don't block.
wviz.events.onTap = function(lon,lat)
{
    wviz.clearPopups();
}

// Called when the user taps and hold on a location.  Called on the main thread.
wviz.events.onPress = function(lon,lat)
{
}

// User tapped a feature
wviz.events.onSelect = function(lon,lat)
{
    wviz.clearPopups();
    
    msg = "<html><body style=\"color:white;font-size:18;text-align:center;\"><b>" + wviz.env.name + "</b><br><b style=\"color:#6FCBF5\">" + wviz.env.availBikes + " bikes available</b></body></html>"

    wviz.addPopup(lon,lat,msg)
}

// Parse station data out of the JSON
var parseStations = function(jsonRet)
{
    wviz.eval("myRet = " + jsonRet);
    stationList = myRet.stationBeanList;
    
    var features = new Array();
    
    // Work through the stations
    for (ii = 0; ii < myRet.stationBeanList.length; ii++)
    {
        entry = myRet.stationBeanList[ii];

        // Make up some GeoJSON
        feat = new Object();
        feat.type = "Feature";
        feat.id = entry.id;
        feat.properties = new Object();
        feat.properties.name = entry.stationName;
        feat.properties.availDocs = entry.availableDocks;
        feat.properties.availBikes = entry.availableBikes;
        avail = entry.availableDocks/entry.totalDocks;
        feat.properties.colorRamp = avail;
        feat.geometry = new Object();
        feat.geometry.type = "Point";
        feat.geometry.coordinates = new Array();
        feat.geometry.coordinates[0] = entry.longitude;
        feat.geometry.coordinates[1] = entry.latitude;
        
        features.push(feat);
        
//        console.log("pos = (" + lon + "," + lat + ")" + " name = " + name + " docs = " + availDocks + " bikes = " + availBikes);
    }
    
    // GeoJSON wrapper
    var geojson = new Object();
    geojson.type = "FeatureCollection";
    geojson.features = features;

    return geojson;
}

// Called when the app view is first initialized
wviz.events.onStartup = function()
{
    // Background color
    wviz.setBackgroundColor("#82CAFAFF");
    
    // Name up top
    wviz.setTitle("Bay Area Bike Stations");

    // Legend on the lower left
    wviz.setLegend("<html><body style=\"background-color=black;font-size:18;text-align:center;\"><b style=\"color:#83D9FD\">Full </b> <b style=\"color:#DCF288\">Half </b> <b style=\"color:#F48380\">Empty</b></body></html>","#000000AA");

    
    // Background layer with a map
    backLayer = wviz.addImageTileLayer(
                                       {
                                       tileJson: "http://a.tiles.mapbox.com/v3/mousebird.map-icbeeevu.json",
                                       minZoom: 0,
                                       maxZoom: 22,
                                       drawPriority: 0
                                       });
    
    // Call the config routine to set defaults
    wviz.events.onConfig();

    wviz.networkFetch("http://www.bayareabikeshare.com/stations/json",
                      function(retJson)
                      {
                        // Turn this into GeoJSON
                        geojson = parseStations(retJson);
                      
                      console.log("Stations parsed");
                      
                        // Display it
                        wviz.addVectors(geojson,
                                        {
                                        name: "marker style",
                                        type: "vector",
                                        markerSize: "small",
                                        colorRamp:
                                        [ "#83D9FD", "#98FEE6", "#B6F2AE", "#DCF288", "#FDDF84", "#FAB282", "#F48380"],
                                        });
                      }
                      );
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
    "map type": "map2d",
    "start": {
        "lon": -122.4,
        "lat": 37.787,
        "height": 0.0012
    },
    "info url": "http://mousebird.github.io/WhirlyVizConfig/config_1_2/electionmap1980_2008.html",
};

// Let the startup routine know we're happy
true;
