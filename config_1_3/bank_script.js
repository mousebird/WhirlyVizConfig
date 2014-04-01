

// Called by the image tile loader on a random thread for every tile we need to load
// We just return the URL
var tileurl = function(x,y,level)
{
    return "http://0api.maplarge.com/Tile/Tile?layer=geo~poly~" + wviz.env.spatialGroup + "|data~BankDeposits2010V2~" + wviz.env.depositScore + "~avg&x=" + x + "&y=" + y + "&z=" + level + "&filter=_MANY_BankDeposits2010V2~reportedsod2011~Greater~0&shader=method~interval|colors~Maroon-200/DarkRed-200,DarkRed-200/Red-128,Red-128/White-128,White-128/Blue-128,Blue-128/DarkBlue-200,DarkBlue-128/Navy-220|ranges~-100/-50,-50/-25,-25/0,0/25,25/50,50/100|count~300";
}

// Overlay layer for the bank data
var bankLayer = null

// Start or restart the bank data layer
var resetBankLayer = function()
{
    // Tear down the old transportion layer
    if (bankLayer)
        bankLayer.remove();
    
    // Transportation overly with an active tile URL callback
    bankLayer = wviz.addImageTileLayer(
                                        {
                                        name: "bank layer",
                                        cache: true,
                                        flipy: false,
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

    valid = false;
    if (wviz.env.depositScore == "depDiff3")
    {
        showVal = myVar.subTotals.depDiff3.avg;
        dist = 3;
        valid = true;
    } else if (wviz.env.depositScore == "depDiff5")
    {
        showVal = myVar.subTotals.depDiff5.avg;
        dist = 5;
        valid = true;
    }
    
    if (valid)
    {
        msg = "<html><body style=\"color:white;font-size:18;text-align:center;\"><b>Within " + dist + " miles: " + showVal + "</b></body></html>"
        
        wviz.addPopup(curLon,curLat,msg);
    }
}

// Called when the user taps at a location. Called on the main thread so don't block.
wviz.events.onTap = function(lon,lat)
{
    curLon = lon;
    curLat = lat;
    
    url = "http://api.maplarge.com/Tile/Click?lat=" + lat + "&lng=" + lon +"&z=4&layer=geo~poly~" + wviz.env.spatialGroup + "%7Cdata~BankDeposits2010V2~" + wviz.env.depositScore + "~avg&filter=_MANY_BankDeposits2010V2~reportedsod2011~Greater~0%7CBankDeposits2010V2~CERT~Equal~3510&shader=method~interval%7Ccolors~Maroon-200/DarkRed-200,DarkRed-200/Red-128,Red-128/White-128,White-128/Blue-128,Blue-128/DarkBlue-200,DarkBlue-128/Navy-220%7Cranges~-100/-50,-50/-25,-25/0,0/25,25/50,50/100%7Ccount~300";
    
    // Go fetch that URL and call popup_display with the results
    wviz.networkFetch(url,popup_display);
}

// Called by the app after it's done basic initialization
wviz.events.onStartup = function()
{
    // Background color
    wviz.setBackgroundColor("#FFFFFFFF");
    
    // Name up top
    wviz.setTitle("MapLarge: Bank Example");
    
    // Background layer with a map
    backLayer = wviz.addImageTileLayer(
                                       {
                                       tileJson: "http://a.tiles.mapbox.com/v3/mousebird.hif7i06e.json",
                                       minZoom: 0,
                                       maxZoom: 10,
                                       drawPriority: 0
                                       });
    
    // 3 or 5 miles
    wviz.addControl(
        {
            "name":"depositScore",
            "display name":"Deposit Score",
            "type":"list",
            "default":"depDiff3",
            "initial index":0,
            "values":[
                      "depDiff3",
                      "depDiff5"
                      ]
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
    deposit = "";
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
    switch (wviz.env.depositScore)
    {
        case "depDiff3":
            deposit = 3;
            break;
        case "depDiff5":
            deposit = 5;
            break;
    }
    
    msg = "Deposits within " + deposit + " miles by " + spatial + ".";
    wviz.setLegend("<html><body style=\"background-color=black;font-size:18;text-align:center;\"><b>" + msg + "</b></body></html>");
    
    // Fetch the bank layer and clear any active popups
    resetBankLayer();
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
