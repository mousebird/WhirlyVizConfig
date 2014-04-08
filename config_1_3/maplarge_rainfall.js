

// Called by the image tile loader on a random thread for every tile we need to load
// We just return the URL
var tileurl = function(x,y,level)
{
    url = "http://1api.maplarge.com/Tile/Tile?layer=geo~poly~" + wviz.env.spatialGroup + "|data~Rain~RainInches~avg&x=" + x + "&y=" + y + "&z=" + level + "&filter=&shader=method~interval|colors~LightBlue-128/Blue-128,Blue-128/128-21-6-122,128-21-6-122/128-21-6-40,128-21-6-40/Black-128|ranges~0/0.3,0.3/0.6,0.6/1.2,1.2/3|dropShadow~true|count~300|size~14";
    
    return url;
}

// Overlay layer for the rainfall layer
var rainLayer = null

// Start or restart the bank data layer
var resetRainLayer = function()
{
    // Tear down the old transportion layer
    if (rainLayer)
        rainLayer.remove();
    
    // Transportation overly with an active tile URL callback
    rainLayer = wviz.addImageTileLayer(
                                        {
                                        name: "rainfall layer",
                                        cache: true,
                                        flipy: false,
                                       alpha: 1.0,
                                        coordSys: "EPSG:3857",
                                        minZoom: 0,
                                        maxZoom: 10,
                                        drawPriority: 10,
                                        tileURLFunc: tileurl
                                        });
}

// Note: No reason to make these global
var curLon = 0.0;
var curLat = 0.0;

// Called when the tap query's network function returns
var popup_display = function(jsonp_ret)
{
    wviz.clearPopups();
    wviz.eval("myVar = " + jsonp_ret);

    showVal = myVar.subTotals.RainInches.avg;
    
    if (showVal != undefined)
    {
        msg = "<html><body style=\"color:white;font-size:18;text-align:center;\"><b>" + showVal.toFixed(3) + " in" + "</b></body></html>"
        
        wviz.addPopup(curLon,curLat,msg);
    }
}

// Called when the user taps at a location. Called on the main thread so don't block.
wviz.events.onTap = function(lon,lat)
{
    curLon = lon;
    curLat = lat;
    
    url = "http://0api.maplarge.com/Tile/Click?lat=" + lat + "&lng=" + lon +"&layer=geo~poly~" + wviz.env.spatialGroup + "%7Cdata~Rain~RainInches~avg&z=5&rowIndex=2493&filter=";
    
    // Go fetch that URL and call popup_display with the results
    wviz.networkFetch(url,popup_display);
}

// Called by the app after it's done basic initialization
wviz.events.onStartup = function()
{
    // Background color
    wviz.setBackgroundColor("#FFFFFFFF");
    
    // Name up top
    wviz.setTitle("Maplarge: Precipitation");
    
    // Background layer with a map
    backLayer = wviz.addImageTileLayer(
                                       {
                                       tileJson: "http://a.tiles.mapbox.com/v3/mousebird.map-icbeeevu.json",
                                       minZoom: 0,
                                       maxZoom: 10,
                                       drawPriority: 0
                                       });
    
    // States, counties, or zip
    wviz.addControl(
        {
            "name":"spatialGroup",
            "display name":"Spatial Groups",
            "type":"list",
            "default":"County",
            "initial index":1,
            "values":[
                      "States2010",
                      "Counties",
                      "zip2010"
                      ]
        });


    // Call the config routine to set defaults
    wviz.events.onConfig();
}

// Called when the controls are edited and changed.  Called on the main thread
wviz.events.onConfig = function()
{
    // Set up the legend based on what we're seeing
    spatial = "";
    switch (wviz.env.spatialGroup)
    {
        case "States2010":
            spatial = "states";
            break;
        case "Counties":
            spatial = "counties";
            break;
        case "zip2010":
            spatial = "zip code";
            break;
    }
    
    msg = "Actual Precipitation in Inches for the 7 days leading up to 2011-12-15.";
    wviz.setLegend("<html><body style=\"background-color=black;font-size:18;text-align:center;\"><b>" + msg + "</b></body></html>");
    
    // Fetch the bank layer and clear any active popups
    resetRainLayer();
    wviz.clearPopups();
}

// Let the app know what basic map or globe we need
wviz.settings = {
    "map type":"map2d",
    "start":{
        "lon":-82.1340,
        "lat":39.7260,
        "height":0.5
    },
    "info url":""
};

// Let the startup routine know we're happy
true;
