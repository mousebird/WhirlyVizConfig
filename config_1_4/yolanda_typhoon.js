// Polluting the global name space with spherical mercator extents
var xMin = -20037508.34;
var yMin = -20037508.34;
var xMax = 20037508.34;
var yMax = 20037508.34;
var xSpan = xMax - xMin;
var ySpan = yMax - yMin;

// Called by the image tile loader on a random thread for every tile we need to load
// We just return the URL
var tileurl = function(x,y,level)
{
}

// Various layers
var baseLayer = null;
var buildLayer = null;
var waterLayer = null;

// Fetch a tile for a given layer
var tileurl = function(x,y,level,baseName,styleName)
{
    num = 1 << level;
    cellX = xSpan / num;
    cellY = ySpan / num;
    tileXmin = xMin + x * cellX;
    tileXmax = xMin + (x + 1.0) * cellX;
    tileYmin = yMin + y * cellY;
    tileYmax = yMin + (y + 1.0) * cellY;
    
    //    console.log(level + ": (" + x + "," + y + ")" + "size: (" + cellX + "," + cellY + ")");
    
    url = "http://yolandadata.org/geoserver/wms?LAYERS=geonode%3A" + baseName + "&FORMAT=image%2Fpng&TRANSPARENT=TRUE&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=" + styleName + "&TILED=true&SRS=EPSG%3A900913&BBOX=" + tileXmin + "," + tileYmin + "," + tileXmax + "," + tileYmax + "&WIDTH=128&HEIGHT=128";
    
//    console.log("url = " + url);
    
    return url;
}

// Called when the app view is first initialized
wviz.events.onStartup = function()
{
    // Background color
    wviz.setBackgroundColor("#FFFFFFFF");
    
    // Name up top
    wviz.setTitle("Yolanda Data");
    
    // Background layer with a map
    baseLayer = wviz.addImageTileLayer(
                                       {
                                       tileURL: "http://c.tile.openstreetmap.org/",
                                       minZoom: 0,
                                       maxZoom: 22,
                                       drawPriority: 0
                                       });
    
    // Call the config routine to set defaults
    wviz.events.onConfig();
}

// Called when the controls are edited and changed.  Called on the main thread
wviz.events.onConfig = function()
{
    // Buildings layer
    buildLayer = wviz.addImageTileLayer(
                                        {
                                        name: "building layer",
                                        flipy: true,
                                        coordSys: "EPSG:3857",
                                        minZoom: 10,
                                        maxZoom: 18,
                                        drawPriority: 12,
//                                        singleLevelLoading: true,
                                        alpha: 1.0,
                                        importanceScale: 0.1,
                                        cache: true,
                                        tileURLFunc:
                                            function(x,y,level)
                                            {
                                                return tileurl(x,y,level,"buildings_osm","buildings_osm")
                                            }
                                        }
                                        );

    // Water layer
    waterLayer = wviz.addImageTileLayer(
                                        {
                                        name: "water layer",
                                        flipy: true,
                                        coordSys: "EPSG:3857",
                                        minZoom: 10,
                                        maxZoom: 16,
                                        drawPriority: 10,
//                                        singleLevelLoading: true,
                                        alpha: 1.0,
                                        importanceScale: 0.1,
                                        cache: true,
                                        tileURLFunc:
                                            function(x,y,level)
                                            {
                                                return tileurl(x,y,level,"project_noah_inundation_storm_surgekml","")
                                            }
                                        }
                                        );
}

// We need to set the globe or map type here before anything gets run
wviz.settings = {
    "map type":"map2d",
    "start":{
        "lon":125,
        "lat":11.25,
        "height":0.005
    },
    "info url":""
};

// Let the startup routine know we're happy
true;
