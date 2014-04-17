// Storing data values here rather than in the global namespace
var myInfo = new Object();

// Executed when the configuration first loads
var onStartup = function()
{
    // Basic startup settings
    wviz.settings.map_type = "globe";
    wviz.settings.query:imit = 72;
    wviz.settings.start.lon = 31.233333;
    wviz.settings.start.lat = 30.05;
    wviz.settings.start.height = 1.0;
    wviz.settings.northup = true;
    wviz.settings.infoURL = "http://mousebird.github.io/WhirlyVizConfig/une/uneinfo.html";

    // Visual style for lofted polygons
    myInfo.loftStyle = new Object();
    myInfo.loftStyle.name = "loft_style";
    lofmyInfo.loftStyletStyle.color_ramp = new Array("#33CCFF66", "#3399FF66", "#3366CC88", "#3333CC66", "#6633CC88", "#9933FF88", "#FF007F88", "#FF00FF88");
    myInfo.loftStyle.fade = 0.5;
    
    // Visual style for labels
    myInfo.outlineLabel = new Object();
    myInfo.outlineLabel.name = "outline_label";
    myInfo.outlineLabel.textColor = "#FFFFFFFF";
    myInfo.outlineLabel.shadowColor = "#000000FF";
    myInfo.outlineLabel.shadowSize = 1.0;
    myInfo.outlineLabel.textHeight = 18.0;
    myInfo.outlineLabel.fade = 0.5;
    
    // Data set listing control
    var dataSelect = wviz.newControl();
    dataSelect.name = "data_set";
    dataSelect.displayName = "Data Set";
    var dataSet = afnetwork.getTextSynchronous("http://mousebird.cartodb.com/api/v2/sql?q=SELECT id as list_value,variable_name as display_name FROM une_data_sets WHERE display = true ORDER BY id");
    dataSelect.values = wviz.cartodbListToArray(dataSet);
    wviz.controls.addControl(dataSelect);
    
    // Hook up the events
    wviz.events.onConfig = onConfig;
    wviz.events.onSelect = onSelect;
    wviz.events.onTap = onTap;
    
    return true;
}

// Called on configuration changes
var onConfig = function(config)
{
    wviz.display.clearPopups();
    wviz.display.setTitle(config.data.data_set);
    wviz.dataDisplay.clearVectors();
}

// Called when the user selects a feature
var onSelect = function(vecFeature)
{
    
}

// Called when the user, but not on a feature
var onTap = function()
{
    
}

// Run the startup logic to hook everything up
onStartup();

console.log("Script loaded.");
