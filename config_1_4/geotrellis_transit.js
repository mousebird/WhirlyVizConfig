 // Polluting the global name space with spherical mercator extents
var xMin = -20037508.34;
var yMin = -20037508.34;
var xMax = 20037508.34;
var yMax = 20037508.34;
var xSpan = xMax - xMin;
var ySpan = yMax - yMin;

// Current center of the queries
var centerLon = -75.20896911621094;
var centerLat = 40.024459635387906;

// Where we store parameter data for the tiles
var transitInfo = new Object();

// Called by the image tile loader on a random thread for every tile we need to load
// We just return the URL
var tileurl = function(x,y,level)
{
    num = 1 << level;
    cellX = xSpan / num;
    cellY = ySpan / num;
    tileXmin = xMin + x * cellX;
    tileXmax = xMin + (x + 1.0) * cellX;
    tileYmin = yMin + y * cellY;
    tileYmax = yMin + (y + 1.0) * cellY;
    
//    console.log(level + ": (" + x + "," + y + ")" + "size: (" + cellX + "," + cellY + ")");
    
    url = "http://transit.geotrellis.com/api/travelshed/wms?service=WMS&request=GetMap&version=1.1.1&layers=&styles=&format=image/jpeg&transparent=false&height=256&width=256&latitude=" + centerLat + "&longitude=" + centerLon + "&time=" + transitInfo.time + "&duration=3600&modes=" + transitInfo.mode + "&schedule=" + transitInfo.date + "&direction=departing&breaks=600,900,1200,1800,2400,3000,3600,4500,5400,7200&palette=0xF68481,0xFDB383,0xFEE085,0xDCF288,0xB6F2AE,0x98FEE6,0x83D9FD,0x81A8FC,0x8083F7,0x7F81BD&srs=EPSG:3857&bbox=" + tileXmin + "," + tileYmin + "," + tileXmax + "," + tileYmax;
    
//    console.log("Fetching tile: " + url);
    return url;
}

// Note: No reason to make these global
var curLon = 0.0;
var curLat = 0.0;

// This is the transportation distance layer
var transLayer = null;

var resetTransLayer = function()
{
    // Tear down the old transportion layer
    if (transLayer)
        transLayer.remove();
    
    // Transportation overly with an active tile URL callback
    transLayer = wviz.addImageTileLayer(
                                        {
                                        name: "transit layer",
                                        cache: false,
                                        flipy: true,
                                        coordSys: "EPSG:3857",
                                        minZoom: 10,
                                        maxZoom: 20,
                                        drawPriority: 10,
                                        alpha: 0.75,
                                        tileURLFunc: tileurl
                                        });
}

// Called when the user taps at a location. Called on the main thread so don't block.
wviz.events.onTap = function(lon,lat)
{
}

// Called when the user taps and hold on a location.  Called on the main thread.
wviz.events.onPress = function(lon,lat)
{
    centerLon = lon;
    centerLat = lat;

    // Center changes so reload everything
    resetTransLayer();
}

// Called when the app view is first initialized
wviz.events.onStartup = function()
{
    // Background color
    wviz.setBackgroundColor("#FFFFFFFF");
    
    // Name up top
    wviz.setTitle("GeoTrellis Transit: Philadelphia");
    
    // Legend on the lower left
    wviz.setLegend("<html><body style=\"background-color=black;font-size:18;text-align:center;\"><b style=\"color:#F48380\">0m</b> <b style=\"color:#FAB282\">10m</b> <b style=\"color:#FDDF84\">15m</b> <b style=\"color:#DCF288\">20m</b> <b style=\"color:#B6F2AE\">30m</b> <b style=\"color:#98FEE6\">40m</b> <b style=\"color:#83D9FD\">50m</b></body></html>","#000000AA");

    // Background layer with a map
    backLayer = wviz.addImageTileLayer(
        {
           tileJson: "http://a.tiles.mapbox.com/v3/azavea.map-zbompf85.json",
           minZoom: 0,
           maxZoom: 22,
           drawPriority: 0
        });
    
    // Bike or walk control
    wviz.addControl(
        {
            name: "transitType",
            "display name": "Walk or Bike",
            type: "list",
            "default": "Bike",
            "initial index": 0,
            "values":[
                      "Walk",
                      "Bike"
                      ]
        });
    
    // Regional rail
    wviz.addControl(
                    {
                    name: "regionalRail",
                    "display name": "Regional rail",
                    type: "list",
                    "default": "No",
                    "initial index": 0,
                    "values":[
                              "No",
                              "Yes"
                              ]
                    });

    // Bus & Subway
    wviz.addControl(
                    {
                    name: "busSubway",
                    "display name": "Bus & Subway",
                    type: "list",
                    "default": "No",
                    "initial index": 0,
                    "values":[
                              "No",
                              "Yes"
                              ]
                    });

    // Day of week or weekend control
    wviz.addControl(
        {
            "name":"Date",
            "display name":"Date",
            "type":"list",
            "default":"Bike",
            "initial index":0,
            "values":[
                      "Weekday",
                      "Saturday",
                      "Sunday"
                      ]
        });
    
    // Time of day control
    wviz.addControl(
        {
            "name": "Time",
            "display name": "Departure Time",
            "type": "time",
            "default": "09:00:00",
            "min": "00:00:00",
            "max": "23:30:00"
        });
    
    // Call the config routine to set defaults
    wviz.events.onConfig();
}

// Called when the controls are edited and changed.  Called on the main thread
wviz.events.onConfig = function()
{
//    console.log("onConfig: mode = " + wviz.env.transitType + " date = " + wviz.env.Date + " time = " + wviz.env.Time);
    
    // Pull data out of the config
    transitInfo.mode = null;
    switch (wviz.env.transitType)
    {
        case "Walk":
            transitInfo.mode = "walking";
            break;
        case "Bike":
            transitInfo.mode = "biking";
            break;
    }
    switch (wviz.env.busSubway)
    {
        case "No":
            break;
        case "Yes":
            transitInfo.mode += ",bus";
            break;
    }
    switch (wviz.env.regionalRail)
    {
        case "No":
            break;
        case "Yes":
            transitInfo.mode += ",train";
            break;
    }
    transitInfo.date = null;
    switch (wviz.env.Date)
    {
        case "Weekday":
            transitInfo.date = "weekday";
            break;
        case "Saturday":
            transitInfo.date = "saturday";
            break;
        case "Sunday":
            transitInfo.date = "sunday";
            break;
    }
    vals = wviz.env.Time.split(":");
    transitInfo.time = (vals[0] * 60 + +vals[1]) * 60 + +vals[2];

    // Change or setup the transportation layer
    resetTransLayer();
}

// We need to set the globe or map type here before anything gets run
wviz.settings = {
    "map type":"map2d",
    "start":{
        "lon":-75.20,
        "lat":40.02,
        "height":0.01
    },
    "info url":"http://mousebird.github.io/WhirlyVizConfig/config_1_3/geotrellis_transit.html"
};

// Let the startup routine know we're happy
true;
