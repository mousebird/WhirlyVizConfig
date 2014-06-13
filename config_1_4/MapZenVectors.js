var baseLayer = null;

// Called when the user taps at a location. Called on the main thread so don't block.
wviz.events.onTap = function(lon,lat)
{
}

// Called when the user taps and hold on a location.  Called on the main thread.
wviz.events.onPress = function(lon,lat)
{
}

// Called when a config value changes
var queryChanged = function()
{
    if (baseLayer)
    {
        baseLayer.remove();
        baseLayer = null;
    }
    
    var tileJson = "";
    var config = "";
    switch (wviz.env.mapType)
    {
        case "MapZen Streets":
            tileJson = "http://mousebird.github.io/WhirlyVizConfig/config_1_4/mapzen-streets.json";
            config = "https://raw.githubusercontent.com/trailbehind/tm2-projects/master/topomap.tm2/project.xml";
            wviz.setTitle("Mapzen Streets");
        break;
    }
    
    // Add a set of Mapnik vector tiles
    baseLayer = wviz.addVectorMapnikLayer(
                              {
                              "tileJson": tileJson,
                              "config": config,
                              minZoom: 0,
                              maxZoom: 14
                              }
                              );
}

// Called when the app view is first initialized
wviz.events.onStartup = function()
{
    // Background color
    wviz.setBackgroundColor("#FFFFFFFF");
    
    // Name up top
    wviz.setTitle("MapBox Vector Tiles");
    
    // Overlay type selector
    wviz.addControl(
                    {
                    name: "mapType",
                    "display name": "Map Source",
                    type: "list",
                    "default": "Mapzen Streets",
                    "initial index": 0,
                    "values":[
                              "MapBox Streets",
                              ],
                    changeFunc: queryChanged
                    });
    
    queryChanged();
}

// Called when the controls are edited and changed.  Called on the main thread
wviz.events.onConfig = function()
{
}

// We need to set the globe or map type here before anything gets run
wviz.settings = {
    "map type":"map2d",
    "start":{
        "lon":-0.1275,
        "lat":51.507222,
        "height":1.5,
        "northup": true
    },
    "info url":""
};

// Let the startup routine know we're happy
true;
