// Keep the image layers around
var imageTest = new Object();
imageTest.backLayer = null;
imageTest.ovlLayer = null;

// Layers available from GIBS
nasaLayers =
[{
 name: "Mapbox Satellite",
 url: "http://a.tiles.mapbox.com/v3/examples.map-zyt2v9k2.json",
 base: true
 },
 { name: "MODIS/Terra TrueColor",
 url: "http://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_CorrectedReflectance_TrueColor/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg",
 minzoom: 1,
 maxzoom: 9,
 tileMatrixSet: "GoogleMapsCompatible_Level9",
 base: true,
 overlay: false,
 minTime: "2012-05-08",
 maxTime: "2014-07-15"
 },
 { name: "VIIRS_CityLights_2012",
 url: "http://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg",
 minzoom: 1,
 maxzoom: 8,
 tileMatrixSet: "GoogleMapsCompatible_Level8",
 base: true,
 overlay: false,
 minTime: "2012-05-08",
 maxTime: "2014-07-15"
 },
 { name: "Aerosol Optical Depth",
 url: "http://map1.vis.earthdata.nasa.gov/wmts-webmerc/OMI_Aerosol_Optical_Depth/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png",
 minzoom: 1,
 maxzoom: 6,
 tileMatrixSet: "GoogleMapsCompatible_Level6",
 base: false,
 overlay: true,
 minTime: "2012-05-08",
 maxTime: "2014-07-15"
 },
 { name: "Land Surface Temp - Day",
 url: "http://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_Land_Surface_Temp_Day/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png",
 minzoom: 1,
 maxzoom: 7,
 tileMatrixSet: "GoogleMapsCompatible_Level7",
 base: false,
 overlay: true,
 minTime: "2012-05-08",
 maxTime: "2014-07-15"
 },
 { name: "Chlorophyll_A",
 url: "http://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_Chlorophyll_A/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png",
 minzoom: 1,
 maxzoom: 7,
 tileMatrixSet: "GoogleMapsCompatible_Level7",
 base: false,
 overlay: true,
 minTime: "2012-05-08",
 maxTime: "2014-07-15"
 },
 { name: "AIRS_Precipitation_Day",
 url: "http://map1.vis.earthdata.nasa.gov/wmts-webmerc/AIRS_Precipitation_Day/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png",
 minzoom: 1,
 maxzoom: 6,
 tileMatrixSet: "GoogleMapsCompatible_Level6",
 base: false,
 overlay: true,
 minTime: "2012-05-08",
 maxTime: "2014-07-15"
 }
// { name: "AIRS_Dust_Score",
// url: "http://map1.vis.earthdata.nasa.gov/wmts-webmerc/AIRS_Dust_Score/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png",
// minzoom: 1,
// maxzoom: 6,
// tileMatrixSet: "GoogleMapsCompatible_Level6",
// base: false,
// overlay: true,
// minTime: "2012-05-08",
// maxTime: "2014-07-15"
// }
// { name: "Daily Freeze/Thaw",
// url: "http://map1.vis.earthdata.nasa.gov/wmts-webmerc/MEaSUREs_Daily_Landscape_Freeze_Thaw_AMSRE/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png",
// minzoom: 0,
// maxzoom: 6,
// tileMatrixSet: "GoogleMapsCompatible_Level6",
// base: false,
// overlay: true,
// minTime: "2012-05-08",
// maxTime: "2014-07-15"
// }
 ];

// Called when the user taps at a location. Called on the main thread so don't block.
wviz.events.onTap = function(lon,lat)
{
}

// Called when the user taps and hold on a location.  Called on the main thread.
wviz.events.onPress = function(lon,lat)
{
}

// Current base and overlay layers
var baseLayer = null;
var ovlLayer = null;
var curTime = new String("2014-07-14");

// Tile URL function for base layer
var baseurl = function(x,y,level)
{
    url = baseLayer.url.replace("{Time}",curTime).replace("{TileMatrixSet}",baseLayer.tileMatrixSet).replace("{TileMatrix}",level).replace("{TileRow}",y).replace("{TileCol}",x);
    
    return url;
}

// Tile URL function for overlay layer
var overlayurl = function(x,y,level)
{
    url = ovlLayer.url.replace("{Time}",curTime).replace("{TileMatrixSet}",ovlLayer.tileMatrixSet).replace("{TileMatrix}",level).replace("{TileRow}",y).replace("{TileCol}",x);
    
    return url;
}

// Called everything time something changes
var queryChanged = function()
{
    // Convert date to a useable form
    lastTime = curTime;
    var curDate = new Date(wviz.env.date);
    month = (curDate.getMonth()+1).toString();
    day = curDate.getDate().toString();
    curTime = curDate.getFullYear().toString() + "-";
    if (month.length < 2)
        curTime += "0";
    curTime += month + "-";
    if (day.length < 2)
        curTime += "0";
    curTime += day;

    // See if the date changed
    var dateChanged = false;
    if (curTime != lastTime)
        dateChanged = true;

    // Look for the layer definitions
    newBaseLayer = null;
    newOvlLayer = null;
    for (ii=0;ii<nasaLayers.length;ii++)
    {
        entry = nasaLayers[ii];
        if (wviz.env.baseMap == entry.name)
            newBaseLayer = entry;
        if (wviz.env.ovlMap == entry.name)
            newOvlLayer = entry;
    }
    
    if ((baseLayer != newBaseLayer) || (dateChanged && baseLayer.name != "Mapbox Satellite"))
    {
        if (imageTest.backLayer)
            imageTest.backLayer.remove();
        baseLayer = newBaseLayer;
        
        if (baseLayer.name == "Mapbox Satellite")
        {
            imageTest.backLayer = wviz.addImageTileLayer(
                                                         {
                                                         name: baseLayer.name,
                                                         tileJson: "http://a.tiles.mapbox.com/v3/mousebird.iph79199.json",
                                                         maxzoom: 10,
                                                         handleEdges: true,
                                                         drawPriority: 1000
                                                        }
            );
        } else {
            // Base layer
            imageTest.backLayer = wviz.addImageTileLayer(
            {
                                   name: baseLayer.name+curTime,
                                   cache: true,
                                   flipY: false,
                                   coordSys: "EPSG:3857",
                    tileURLFunc: baseurl,
                   minzoom: baseLayer.minzoom,
                   maxzoom: baseLayer.maxzoom,
                    drawPriority: 1000,
                    handleEdges: true
            });
        }
    }
    
    if ((ovlLayer != newOvlLayer) || dateChanged)
    {
        if (imageTest.ovlLayer)
            imageTest.ovlLayer.remove();
        ovlLayer = newOvlLayer;
        
        // Overlay layer
        if (ovlLayer)
            imageTest.ovlLayer = wviz.addImageTileLayer(
                                                         {
                                                         name: ovlLayer.name+curTime,
                                                         cache: true,
                                                         flipY: false,
                                                         coordSys: "EPSG:3857",
                                                         tileURLFunc: overlayurl,
                                                         minzoom: ovlLayer.minzoom,
                                                        maxzoom: ovlLayer.maxzoom,
                                                        drawPriority: 2000,
                                                        handleEdges: false,
                                                        alpha: 0.5
                                                         });
    }
    
    // Legend on the lower left
    var legendText = baseLayer.name;
    if (ovlLayer)
    {
        legendText += " + " + ovlLayer.name;
    }
    wviz.setLegend("<html><body style=\"background-color=black;font-size:18;text-align:center;\"><b style=\"color:#FFFFFF\">" + legendText + "</b></body></html>","#000000AA");
}

// Called when the app view is first initialized
wviz.events.onStartup = function()
{
    // Background color
    wviz.setBackgroundColor("#E0E0E0FF");
    
    // Name up top
    wviz.setTitle("NASA GIBS Browser");
    
    // Country outlines
    wviz.networkFetch("http://mousebird.github.io/WhirlyVizConfig/geojson/ne_110m_admin_0_map_units.json",
                      function(jsonRet)
                      {
                        wviz.eval("myRet = " + jsonRet);
                        wviz.addVectors(myRet,
                                        {
                                        name: "basic style",
                                        type: "vector",
                                        color: "#CCCCCC",
                                        });
                      });
    
    // Make a list of base layers
    var baseLayers = new Array();
    var ovlLayers = new Array();
    ovlLayers.push("None");
    for (ii=0;ii<nasaLayers.length;ii++)
    {
        entry = nasaLayers[ii];

        if (entry.base)
            baseLayers.push(entry.name);
        if (entry.overlay)
            ovlLayers.push(entry.name);
    }
    
    // Base type selector
    if (baseLayers.length > 0)
        wviz.addControl(
                        {
                        name: "baseMap",
                        "display name": "Base",
                        type: "list",
                        "default": baseLayers[1],
                        "initial index": 1,
                        "values": baseLayers,
                        changeFunc: queryChanged
                        });

    // Overlay type selector
    if (ovlLayers.length > 0)
        wviz.addControl(
                        {
                        name: "ovlMap",
                        "display name": "Overlay",
                        type: "list",
                        "default": ovlLayers[0],
                        "initial index": 0,
                        "values": ovlLayers,
                        changeFunc: queryChanged
                        });
    
    // Date control
    wviz.addControl(
    {
                    name: "date",
                    "display name": "Date",
                    type: "date",
                    "default": "2014-07-14",
                    min: "2012-05-08",
                    max: "2014-07-15",
                    changeFunc: queryChanged
    })
    
    queryChanged();
}

// Called when the controls are edited and changed.  Called on the main thread
wviz.events.onConfig = function()
{
}

// We need to set the globe or map type here before anything gets run
wviz.settings = {
    "map type":"globe",
    "northup": true,
    "start":{
        "lon":-122,
        "lat":40,
        "height":1.5
    },
    "info url":""
};

// Let the startup routine know we're happy
true;
