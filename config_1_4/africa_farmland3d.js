// Called when the user taps at a location. Called on the main thread so don't block.
wviz.events.onTap = function(lon,lat)
{
}

// Called when the user taps and hold on a location.  Called on the main thread.
wviz.events.onPress = function(lon,lat)
{
}

// Called when the app view is first initialized
wviz.events.onStartup = function()
{
    // Background color
    wviz.setBackgroundColor("#FFFFFFFF");
    
    // Name up top
    wviz.setTitle("Legacy SOC Prediction Map");
    
    // Background layer with a map
    backLayer = wviz.addImageTileLayer(
        {
           tileJson: "http://a.tiles.mapbox.com/v3/mousebird.hif7i06e.json",
           minZoom: 0,
           maxZoom: 10,
            drawPriority: 0
        });
    
    // African farmland layer
    farmLayer = wviz.addImageTileLayer(
       {
           tileJson: "https://a.tiles.mapbox.com/v3/geostatistics-visual.i0l5jd7f.json",
           minZoom: 3,
           maxZoom: 6,
            drawPriority: 1
       });
    
    // Call the config routine to set defaults
    wviz.events.onConfig();
}

// Called when the controls are edited and changed.  Called on the main thread
wviz.events.onConfig = function()
{
}

// We need to set the globe or map type here before anything gets run
wviz.settings = {
    "map type":"globe",
    "start":{
        "lon":48,
        "lat":-30,
        "height":1.5,
        "northup": true
    },
    "info url":""
};

// Let the startup routine know we're happy
true;
