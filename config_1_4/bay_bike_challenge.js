// We'll store temp values here to clean up the namespace a bit
var baybike = new Object();
baybike.curDisplay = new Array();
baybike.dispStations = null;
baybike.curStations = null;
baybike.controls = new Object();

// Form a query to the server
var MakeServerQuery = function(query)
{
    return "http://ec2-54-186-109-77.us-west-2.compute.amazonaws.com:8888/sql?q=" + query;
}

// Called when the user taps at a location. Called on the main thread so don't block.
wviz.events.onTap = function(lon,lat)
{
    wviz.clearPopups();
}

// Called when the user taps and hold on a location.  Called on the main thread.
wviz.events.onPress = function(lon,lat)
{
}

// Number of days in the database.  We just know this.
var TotalDays = 184;

// User tapped a feature
wviz.events.onSelect = function(lon,lat)
{
    wviz.clearPopups();

    middle = "<b>" + wviz.env.name + "</b>";
    switch (curMode)
    {
        case "live":
            middle += "<br><b style=\"color:#6FCBF5\">" + wviz.env.availBikes + " bikes available</b>";
        break;
        case "history":
            if (historyMode == "empty" || historyMode == "full")
            {
                value = 0.0;
                if (wviz.env.count != undefined)
                    value = wviz.env.count;
                denom = TotalDays;
                switch (wviz.env.dateType)
                {
                    case "Weekday":
                        denom = TotalDays/7.0 * 5.0;
                        break;
                    case "Weekend":
                        denom = TotalDays/7.0 * 2.0;
                        break;
                }
                if (value > 0.0)
                    middle += "<br><b style=\"color:#6FCBF5\">" + (value/denom).toFixed(2) + " minutes per day</b>";
            }
        break;
    }
    msg = "<html><body style=\"color:white;font-size:18;text-align:center;\">" + middle + "</body></html>";
    
    wviz.addPopup(lon,lat,msg,0.0,0.0036)
}

// Parse station data out of the live JSON feed
var parseStationsFromJSON = function(jsonRet)
{
    wviz.eval("myRet = " + jsonRet);
    stationList = myRet.stationBeanList;
    
    // Work through the station list looking for a maximum dock size
    maxTotalDocks = 0;
    for (ii = 0; ii < stationList.length; ii++)
    {
        entry = stationList[ii];
        if (entry.totalDocks > maxTotalDocks)
            maxTotalDocks = entry.totalDocks;
    }
    
    // Work through the stations
    var features = new Array();
    maxHeight = 0.0001;
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
        feat.properties.height0 = entry.availableDocks / maxTotalDocks * maxHeight;
        feat.properties.height1 = entry.availableBikes / maxTotalDocks * maxHeight;
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

// Convert the station list to something displayable
var convertStationsToGeoJSON = function(stations)
{
    var features = new Array();
    
    // Work through the stations
    for (var prop in stations)
    {
        entry = stations[prop];
        
        // Make up some GeoJSON
        feat = new Object();
        feat.type = "Feature";
        feat.id = entry.id;
        feat.properties = new Object();
        feat.properties.name = entry.name;
        feat.geometry = new Object();
        feat.geometry.type = "Point";
        feat.geometry.coordinates = new Array();
        feat.geometry.coordinates[0] = entry.long;
        feat.geometry.coordinates[1] = entry.lat;
        
        features.push(feat);
        
//        console.log("pos = (" + lon + "," + lat + ")" + " name = " + name + " docs = " + availDocks + " bikes = " + availBikes);
    }
    
    // GeoJSON wrapper
    var geojson = new Object();
    geojson.type = "FeatureCollection";
    geojson.features = features;
    
    return geojson;
}

// Parse stations from the Postgres query
var parseStationsFromPostgres = function(data)
{
    wviz.eval("myRet = " + data);
    stationList = myRet.rows;
    
    // Work through the stations
    baybike.stations = new Object();
    for (ii = 0; ii < stationList.length; ii++)
    {
        entry = stationList[ii];
        station_id = entry.station_id;
        if (station_id != undefined && station_id != null)
            baybike.stations[entry.station_id] = entry;
    }
    
//    console.log("Stations = " + JSON.stringify(baybike.stations));
}

// Mode we're in
var curMode = "live";
var historyMode = "full";

// Called when the query control changes value
// We set up the other controls here
var queryChanged = function()
{
//    console.log("Query changed to: " + wviz.env.queryType);
    
    // Clear out the old controls
    if (baybike.controls.subscriberType)
        baybike.controls.subscriberType.remove();
    if (baybike.controls.dateType)
        baybike.controls.dateType.remove();
    if (baybike.controls.timeType)
        baybike.controls.timeType.remove();
    
    if (wviz.env.queryType != "Current Availability")
    {
        if (wviz.env.queryType == "Popular Trips")
        {
            // Who
            baybike.controls.subscriberType =
            wviz.addControl(
                            {
                            name: "subscriberType",
                            "display name": "Users",
                            type: "list",
                            "default": "All",
                            "initial index": 0,
                            "values":[
                                      "All",
                                      "Subscriber",
                                      "Customer"
                                      ]
                            });
        }
        
        // Dates
        baybike.controls.dateType =
        wviz.addControl(
                        {
                        name: "dateType",
                        "display name": "Day Of Week",
                        type: "list",
                        "default": "All",
                        "initial index": 0,
                        "values":[
                                  "All",
                                  "Weekday",
                                  "Weekend"
                                  ]
                        });
        
        // Time of Day
        baybike.controls.timeType =
        wviz.addControl(
                        {
                        name: "timeType",
                        "display name": "Time of Day",
                        type: "list",
                        "default": "All",
                        "initial index": 0,
                        "values":[
                                  "All",
                                  "Morning",
                                  "Afternoon",
                                  "Evening"
                                  ]
                        });
    }
}

// Called when the user selects a new location
locationChanged = function()
{
    switch (wviz.env.locationType)
    {
        case "San Francisco":
            wviz.moveTo(-122.384585,37.748730,0.000253,24.880576,69.211734);
            break;
        case "Redwood City":
            wviz.moveTo(-122.237466,37.464060,0.000211,-15.051821,69.769742);
            break;
        case "Palo Alto":
            wviz.moveTo(-122.168778,37.415223,0.000211,-15.093584,69.769742);
            break;
        case "Mountain View":
            wviz.moveTo(-122.097817,37.356887,0.000340,-15.136688,67.259400);
            break;
        case "San Jose":
            wviz.moveTo(-121.893122,37.304475,0.000274,-2.615929,68.731393);
            break;
    }
}

// Called when the app view is first initialized
wviz.events.onStartup = function()
{
    // Background color
    wviz.setBackgroundColor("#82CAFAFF");
    
    // Background layer with a map
    backLayer = wviz.addImageTileLayer(
                                       {
                                       tileJson: "http://a.tiles.mapbox.com/v3/mousebird.map-icbeeevu.json",
                                       minZoom: 0,
                                       maxZoom: 22,
                                       drawPriority: 0
                                       });

    //// Controls

    // Query
    baybike.controls.queryType =
    wviz.addControl(
                    {
                    name: "queryType",
                    "display name": "Searches",
                    type: "list",
                    "default": "Current Availability",
                    "initial index": 0,
                    "values":[
                              "Current Availability",
                              "Popular Trips",
                              "Empty Stations",
                              "Full Stations"
                              ],
                    changeFunc: queryChanged
                    });
    
    // Location
    baybike.controls.locationType =
    wviz.addControl(
                    {
                    name: "locationType",
                    "display name": "Location",
                    type: "list",
                    "default": "San Francisco",
                    "initial index": 0,
                    "values":[
                              "San Francisco",
                              "Redwood City",
                              "Palo Alto",
                              "Mountain View",
                              "San Jose"
                              ],
                    changeFunc: locationChanged
                    });

    
    // Note: Testing history mode
    curMode = "history";
    
    // Need the station data
    wviz.networkFetch(MakeServerQuery("select * from babs_stations order by station_id;"),
            function(retData)
                  {
                      // Need the station data first thing
                      parseStationsFromPostgres(retData);
                  }
                  );
    
    // Now kick off any queries
    wviz.events.onConfig();
}

// Mapping from city to feed.  Just SF Bay Area for this one.
var feedLocs = {
    "SF Bay Area": { url: "http://bayareabikeshare.com/stations/json",
    type: "json",
    lon: -122.4,
    lat: 37.787,
        height: 0.0012}
};

// Put together a where clause based on the config options
var FormWhereClause = function(useSubscriber,timeField)
{
    var clause = "";
    
    if (useSubscriber)
    {
        // Subscription type
        var user = null;
        switch (wviz.env.subscriberType)
        {
            case "All":
                break;
            case "Subscriber":
                user = "Subscriber";
                break;
            case "Customer":
                user = "Customer";
                break;
        }
        
        if (user != null)
            clause = "subscription_type = '" + user + "'";
    }
    
    // Day of week
    if (wviz.env.dateType != undefined && wviz.env.dateType != "All")
    {
        dow = null;
        if (wviz.env.dateType == "Weekday")
            dow = "(1,2,3,4,5)";
        else
            dow = "(0,6)";
        
        if (clause.length > 0)
            clause += " and ";
        clause += " extract(dow from " + timeField + ") in " + dow + " ";
    }
    
    // Time of day
    if (wviz.env.timeType != undefined && wviz.env.timeType != "All")
    {
        tod = null;
        switch (wviz.env.timeType)
        {
            case "Morning":
                tod = " extract(hour from " + timeField + ") > 5 and extract(hour from " + timeField + ") < 12 ";
                break;
            case "Afternoon":
                tod = " extract(hour from " + timeField + ") > 12 and extract(hour from " + timeField + ") < 15 ";
                break;
            case "Evening":
                tod = " extract(hour from " + timeField + ") > 15 and extract(hour from " + timeField + ") < 19 ";
                break;
        }
        if (clause.length > 0)
            clause += " and ";
        clause += tod;
    }
    
    return clause;
}

// Historical trips
var RunHistoricalTripQuery = function()
{
    // Most popular trips
    whereClause = FormWhereClause(true,"start_date");
    firstPart = "SELECT start_terminal,end_terminal,count(*) as cnt FROM babs_trips where start_terminal is not null and end_terminal is not null and start_terminal != end_terminal";
    secondPart = "group by start_terminal, end_terminal order by cnt desc limit 50";
    var query = null;
    if (whereClause.length > 0)
        query = firstPart + " and " + whereClause + " " + secondPart;
    else
        query = firstPart + " " + secondPart;
    
//    console.log("query = " + query);
    
    wviz.networkFetch(MakeServerQuery(query),
          function(retData)
          {
            // Turn the result into GeoJSON lines
            wviz.eval("myRet = " + retData);
            entryList = myRet.rows;
                      
            // Scale by the max count
            maxCount = entryList[entryList.length-1].cnt;

            // Work through the entries
            var features = new Array();
            for (ii = 0; ii < entryList.length; ii++)
            {
                entry = entryList[ii];
                startTerm = baybike.stations[entry.start_terminal];
                endTerm = baybike.stations[entry.end_terminal];
                if (startTerm != undefined && endTerm != undefined)
                {
                    // Make up some GeoJSON
                    feat = new Object();
                    feat.type = "Feature";
                    feat.properties = new Object();
                    feat.properties.height = 0.0001 * entry.cnt / maxCount;
//                    feat.properties.color =
                    feat.geometry = new Object();
                    feat.geometry.type = "LineString";
                    feat.geometry.coordinates = new Array();
                    feat.geometry.coordinates[0] = new Array(startTerm.long,startTerm.lat);
                    feat.geometry.coordinates[1] = new Array(endTerm.long,endTerm.lat);

                    features.push(feat);
                }
            }
              
            // GeoJSON wrapper
            geojson = new Object();
            geojson.type = "FeatureCollection";
            geojson.features = features;

            // Great circles with height
            baybike.curDisplay.push(wviz.addVectors(geojson,
                                       {
                                       name: "line style",
                                       type: "greatCircle",
                                       height: 0.0001,
                                       subdivisiontype: "static",
                                       subdivisionepsilon: 20,
                                       color: "#82481AFF",
                                       lineWidth: 4.0
                                       }));
          });
}

// Run empty or full station query
var RunStationCapacityQuery = function(field,cylOrder)
{
    firstPart = "select station_id," + field + ",count(*) as cnt from babs_avail where " + field + " = 0"
    secondPart = "group by station_id, " + field + " order by cnt;";
    
    whereClause = FormWhereClause(false,"time");
    if (whereClause.length > 0)
        query = firstPart + " and " + whereClause + " " + secondPart;
    else
        query = firstPart + " " + secondPart;
    
    console.log("query = " + query);
    
    wviz.networkFetch(MakeServerQuery(query),
              function(retData)
              {
                  // Turn the result into GeoJSON points
                  wviz.eval("myRet = " + retData);
                  entryList = myRet.rows;
                  
                  // Scale by the max count
                  maxCount = entryList[entryList.length-1].cnt;
                  
                  // Work through the entries
                  var features = new Array();
                  for (ii = 0; ii < entryList.length; ii++)
                  {
                      entry = entryList[ii];
                      term = baybike.stations[entry.station_id];

                      if (term != undefined && term != null)
                      {
                          // Make up some GeoJSON
                          feat = new Object();
                          feat.type = "Feature";
                          feat.properties = new Object();
                          feat.properties.height0 = 0.0001 * entry.cnt / maxCount;
                          feat.properties.height1 = (0.0001 / term.dockcount) / 4;
                          feat.properties.name = term.name;
                          feat.properties.count = entry.cnt;
                          feat.geometry = new Object();
                          feat.geometry.type = "Point";
                          feat.geometry.coordinates = new Array();
                          feat.geometry.coordinates[0] = term.long;
                          feat.geometry.coordinates[1] = term.lat;
                          
                          features.push(feat);
                      }
                  }

                  // GeoJSON wrapper
                  geojson = new Object();
                  geojson.type = "FeatureCollection";
                  geojson.features = features;

                  // Great circles with height
                  var useColors = null;
                  if (cylOrder)
                      useColors = ["#F56F6FFF","#6FCBF5FF"];
                  else
                      useColors = ["#6FCBF5FF","#F56F6FFF"];
                  baybike.curDisplay.push(wviz.addVectors(geojson,
                                  {
                                  name: "cylinder style",
                                  type: "cylinder",
                                  baseheight: 0.0000005,
                                  radius: 0.000003,
                                  colors: useColors
                                  }));
            });
}

// Called when the controls are edited and changed.  Called on the main thread
wviz.events.onConfig = function()
{
    wviz.clearPopups();

    // Change the mode depending on what they user chose
    switch (wviz.env.queryType)
    {
        case "Current Availability":
            curMode = "live";
            historyMode = null;
            wviz.setTitle("Live Station Data");
            wviz.setLegend("<html><body style=\"background-color=black;font-size:16;color:white;text-align:center;\"> <b>Bikes</b> <b style=\"color:#83D9FD\">available </b> <b>and slots</b> <b style=\"color:#F48380\">empty</b> <b>right now.</b></body></html>","#000000AA");
            break;
        case "Popular Trips":
            curMode = "history";
            historyMode = "trips";
            wviz.setTitle("Top 50 trips");
            break;
        case "Empty Stations":
            curMode = "history";
            historyMode = "empty";
            wviz.setTitle("Empty Stations");
            break;
        case "Full Stations":
            curMode = "history";
            historyMode = "full";
            wviz.setTitle("Full Stations");
            break;
    }
    
    // Clear out the old data
    for (ii = 0;ii < baybike.curDisplay.length; ii++)
    {
        baybike.curDisplay[ii].remove();
    }
    baybike.curDisplay = new Array();
    
    switch (curMode)
    {
        // In live mode we're displaying the JSON feed
        case "live":
            // Get rid of the old display stations
            if (baybike.dispStations != null)
            {
                baybike.dispStations.remove();
                baybike.dispStations = null;
            }
            
            var entry = feedLocs["SF Bay Area"];
            
            if (entry != undefined)
            {
                // Name up top
                wviz.setTitle("Live Stations");
                
                wviz.networkFetch(entry.url,
                      function(retData)
                      {
                          // Turn this into GeoJSON
                          geojson = parseStationsFromJSON(retData);
                          
                          // Great circles with height
                          baybike.curDisplay.push(wviz.addVectors(geojson,
                                                               {
                                                               name: "cylinder style",
                                                               type: "cylinder",
                                                               baseheight: 0.0000005,
                                                               radius: 0.000003,
                                                               "colors": ["#F56F6FFF","#6FCBF5FF"]
                                                               }));
                      }
                );
            }
            break;
        // In historical mode we're hitting the database
        case "history":
            // Make sure we're displaying the stations
            if (baybike.dispStations == null)
            {
                geojson = convertStationsToGeoJSON(baybike.stations);
                
                baybike.dispStations = wviz.addVectors(geojson,
                                {
                                name: "station style",
//                                type: "circle",
//                                color: "#00000077",
//                                radius: 0.0000025,
//                                height: 0.0000005,
//                                selectable: true
                                   type: "cylinder",
                                   baseheight: 0.0000005,
                                   radius: 0.000003,
                                    height: 0.0,
                                   color: "#00000077"
                                });
            }
            
            switch (historyMode)
            {
                case "trips":
                    RunHistoricalTripQuery();
                    var msg = "";
                    
                    switch (wviz.env.subscriberType)
                    {
                        case "All":
                            msg += "By everyone";
                        break;
                        case "Subscriber":
                            msg += "By subscribers";
                        break;
                        case "Customer":
                            msg += "By casual users";
                        break;
                    }
                    switch (wviz.env.dateType)
                    {
                        case "Weekday":
                            msg += " on weekdays";
                            break;
                        case "Weekend":
                            msg += " on the weekend";
                            break;
                    }
                    if (wviz.env.timeType != "All")
                    {
                        if (msg.length > 0)
                            msg += " in the ";
                        else
                            msg += "In the ";
                        switch (wviz.env.timeType)
                        {
                            case "Morning":
                                msg += "morning";
                                break;
                            case "Afternoon":
                                msg += "afternoon";
                                break;
                            case "Evening":
                                msg += "evening";
                                break;
                        }
                    }
                    if (msg.length == 0)
                        msg = "Overall";
                    msg += ".";
                    wviz.setLegend("<html><body style=\"background-color=black;font-size:16;color:white;text-align:center;\"><b>" + msg + "</b></body></html>","#000000AA");
                break;
                case "empty":
                    RunStationCapacityQuery("bikes_available",true);
                    var msg = "Likely to be <b style=\"color:#F48380\">empty</b>";
                    
                    switch (wviz.env.dateType)
                    {
                        case "Weekday":
                            msg += " on weekdays";
                            break;
                        case "Weekend":
                            msg += " on the weekend";
                            break;
                    }
                    if (wviz.env.timeType != "All")
                    {
                        if (msg.length > 0)
                            msg += " in the ";
                        else
                            msg += "In the ";
                        switch (wviz.env.timeType)
                        {
                            case "Morning":
                                msg += "morning";
                                break;
                            case "Afternoon":
                                msg += "afternoon";
                                break;
                            case "Evening":
                                msg += "evening";
                                break;
                        }
                    }
                    if (msg.length == 0)
                        msg = "Overall";
                    msg += ".";
                    wviz.setLegend("<html><body style=\"background-color=black;font-size:16;color:white;text-align:center;\"><b>" + msg + "</b></body></html>","#000000AA");

                    break;
                case "full":
                    RunStationCapacityQuery("docks_available",false);

                    var msg = "Likely to be <b style=\"color:#83D9FD\">full</b>";
                    
                    switch (wviz.env.dateType)
                {
                    case "Weekday":
                        msg += " on weekdays";
                        break;
                    case "Weekend":
                        msg += " on the weekend";
                        break;
                }
                    if (wviz.env.timeType != "All")
                    {
                        if (msg.length > 0)
                            msg += " in the ";
                        else
                            msg += "In the ";
                        switch (wviz.env.timeType)
                        {
                            case "Morning":
                                msg += "morning";
                                break;
                            case "Afternoon":
                                msg += "afternoon";
                                break;
                            case "Evening":
                                msg += "evening";
                                break;
                        }
                    }
                    if (msg.length == 0)
                        msg = "Overall";
                    msg += ".";
                    wviz.setLegend("<html><body style=\"background-color=black;font-size:16;color:white;text-align:center;\"><b>" + msg + "</b></body></html>","#000000AA");
                    break;
            }
            break;
    }
}

// We need to set the globe or map type here before anything gets run
wviz.settings = {
    "map type": "globe",
    "start": {
        "lon": -122.384585,
        "lat": 37.748730,
        "height": 0.000253,
        tilt: 69.211734,
        rot: 24.880576
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
    "info url": "http://mousebird.github.io/WhirlyVizConfig/config_1_4/bay_bike_challenge.html",
};

// Let the startup routine know we're happy
true;
