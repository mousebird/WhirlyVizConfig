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

    wviz.addPopup(lon,lat,msg,0.0,0.0036)
}
                                                                                      
// Parse stations data out of XML
var parseStationsFromXML = function(xmlRet)
{
                                                                                      
}
                                                                                      
// Parse station data out of the JSON
var parseStationsFromJSON = function(jsonRet)
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
    
    // Legend on the lower left
    wviz.setLegend("<html><body style=\"background-color=black;font-size:18;text-align:center;\"><b style=\"color:#83D9FD\">Full </b> <b style=\"color:#DCF288\">Half </b> <b style=\"color:#F48380\">Empty</b></body></html>","#000000AA");

    // Bike or walk control
    wviz.addControl(
                    {
                    name: "city",
                    "display name": "Bike Share City",
                    type: "list",
                    "default": "Chicago",
                    "initial index": 0,
                    "values":[
                              "Chicago",
                              "Chattanooga",
                              "SF Bay Area",
                              "New York",
                              "Columbus"
                              ]
                    });
    
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
}

// Mapping from city to feed
var feedLocs = {
    "Chicago":
    {   url: "http://divvybikes.com/stations/json",
        type: "json",
        lon: -87.627778,
        lat: 41.881944,
        height: 0.0012},
    "Chattanooga":
    { url: "http://www.bikechattanooga.com/stations/json",
        type: "json",
        lon: -85.267222,
        lat: 35.045556,
        height: 0.0012},
    "SF Bay Area": { url: "http://bayareabikeshare.com/stations/json",
    type: "json",
    lon: -122.4,
    lat: 37.787,
        height: 0.0012},
    "New York":{ url: "http://citibikenyc.com/stations/json",
    type: "json",
    lon: -74.0059,
    lat: 40.7127,
        height: 0.0012},
    "Columbus":{ url: "http://www.cogobikeshare.com/stations/json",
    type: "json",
    lon: -82.983333,
    lat: 39.983333,
        height: 0.0012}
};

// The visual data for the current stations
var curStations = null;

// Called when the controls are edited and changed.  Called on the main thread
wviz.events.onConfig = function()
{
    var entry = feedLocs[wviz.env.city];
    
    if (curStations != null)
    {
       curStations.remove();
        curStations = null;
    }
    
    if (entry != undefined)
    {
        // Name up top
        wviz.setTitle(wviz.env.city + " Bike Stations");

        wviz.networkFetch(entry.url,
                          function(retData)
                          {
                          
                          if (entry.type == "json")
                          {
                            // Turn this into GeoJSON
                            geojson = parseStationsFromJSON(retData);
                          } else if (entry.type == "xml")
                          {
                            geojson = parseStationsFromXML(retData);
                          }
                          
                          // Display it
                          curStations = wviz.addVectors(geojson,
                                          {
                                          name: "marker style",
                                          type: "vector",
                                          markerSize: "small",
                                          colorRamp:
                                          [ "#83D9FD", "#98FEE6", "#B6F2AE", "#DCF288", "#FDDF84", "#FAB282", "#F48380"],
                                          });
                          
                          wviz.moveTo(entry.lon,entry.lat,entry.height);
                          }
                          );
    }
}

// We need to set the globe or map type here before anything gets run
wviz.settings = {
    "map type": "map2d",
    "start": {
        "lon": -122.4,
        "lat": 37.787,
        "height": 0.0012
    },
    "info url": "",
};

// Let the startup routine know we're happy
true;
