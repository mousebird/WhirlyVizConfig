// Keep the image layers around
var imageTest = new Object();
imageTest.backLayer = null;
imageTest.ovlLayer = null;

// Weather vertex and fragment shaders
var weatherVertexShader =
"struct directional_light {" +
"  vec3 direction;" +
"  vec3 halfplane;\n" +
"  vec4 ambient;\n" +
"  vec4 diffuse;\n" +
"  vec4 specular;\n" +
"  float viewdepend;\n" +
"};\n" +
"\n" +
"struct material_properties {\n" +
"  vec4 ambient;\n" +
"  vec4 diffuse;\n" +
"  vec4 specular;\n" +
"  float specular_exponent;\n" +
"};\n" +
"\n" +
"uniform mat4  u_mvpMatrix;                   \n" +
"uniform float u_fade;                        \n" +
"uniform int u_numLights;                      \n" +
"uniform directional_light light[8];                     \n" +
"uniform material_properties material;       \n" +
"uniform float u_interp;" +
"\n" +
"attribute vec3 a_position;                  \n" +
"attribute vec2 a_texCoord0;                  \n" +
"attribute vec2 a_texCoord1;                  \n" +
"attribute vec4 a_color;                     \n" +
"attribute vec3 a_normal;                    \n" +
"\n" +
"varying vec2 v_texCoord0;                    \n" +
"varying vec2 v_texCoord1;                    \n" +
"varying vec4 v_color;                       \n" +
"\n" +
"void main()                                 \n" +
"{                                           \n" +
"   v_texCoord0 = a_texCoord0;                 \n" +
"   v_texCoord1 = a_texCoord1;                 \n" +
"   v_color = vec4(0.0,0.0,0.0,0.0);         \n" +
"   if (u_numLights > 0)                     \n" +
"   {\n" +
"     vec4 ambient = vec4(0.0,0.0,0.0,0.0);         \n" +
"     vec4 diffuse = vec4(0.0,0.0,0.0,0.0);         \n" +
"     for (int ii=0;ii<8;ii++)                 \n" +
"     {\n" +
"        if (ii>=u_numLights)                  \n" +
"           break;                             \n" +
"        vec3 adjNorm = light[ii].viewdepend > 0.0 ? normalize((u_mvpMatrix * vec4(a_normal.xyz, 0.0)).xyz) : a_normal.xzy;\n" +
"        float ndotl;\n" +
"        ndotl = max(0.0, dot(adjNorm, light[ii].direction));\n" +
"        ambient += light[ii].ambient;\n" +
"        diffuse += ndotl * light[ii].diffuse;\n" +
"     }\n" +
"     v_color = vec4(ambient.xyz * material.ambient.xyz * a_color.xyz + diffuse.xyz * a_color.xyz,a_color.a) * u_fade;\n" +
"   } else {\n" +
"     v_color = a_color * u_fade;\n" +
"   }\n" +
"\n" +
"   gl_Position = u_mvpMatrix * vec4(a_position,1.0);  \n" +
"}                                           \n"

var weatherFragmentShaderRegular =
"precision mediump float;" +
"" +
"uniform sampler2D s_baseMap0;" +
"uniform sampler2D s_baseMap1;" +
"uniform float u_interp;" +
"" +
"varying vec2      v_texCoord0;" +
"varying vec2      v_texCoord1;" +
"varying vec4      v_color;" +
"" +
"void main()" +
"{" +
"  vec4 baseColor0 = texture2D(s_baseMap0, v_texCoord0);" +
"  vec4 baseColor1 = texture2D(s_baseMap1, v_texCoord1);" +
"  gl_FragColor = v_color * mix(vec4(baseColor0.a,baseColor0.a,baseColor0.a,baseColor0.a),vec4(baseColor1.a,baseColor1.a,baseColor1.a,baseColor1.a),u_interp);" +
"}"

var weatherFragmentShaderCompressed =
"precision mediump float;" +
"" +
"uniform sampler2D s_baseMap0;" +
"uniform sampler2D s_baseMap1;" +
"uniform float u_interp;" +
"" +
"varying vec2      v_texCoord0;" +
"varying vec2      v_texCoord1;" +
"varying vec4      v_color;" +
"" +
"void main()" +
"{" +
"  vec4 baseColor0 = texture2D(s_baseMap0, v_texCoord0);" +
"  vec4 baseColor1 = texture2D(s_baseMap1, v_texCoord1);" +
"  gl_FragColor = v_color * mix(vec4(baseColor0.r,baseColor0.r,baseColor0.r,baseColor0.r),vec4(baseColor1.r,baseColor1.r,baseColor1.r,baseColor1.r),u_interp);" +
"}"

// Called when the user taps at a location. Called on the main thread so don't block.
wviz.events.onTap = function(lon,lat)
{
}

// Called when the user taps and hold on a location.  Called on the main thread.
wviz.events.onPress = function(lon,lat)
{
}



// Called everything time something changes
var queryChanged = function()
{
    if (imageTest.backLayer)
        imageTest.backLayer.remove();
    if (imageTest.ovlLayer)
        imageTest.ovlLayer.remove();
    
    // Chose the data format
    var internalFormat = "";
    var remoteFormat = "png";
    switch (wviz.env.baseType)
    {
        case "Blank":
            break;
        case "Int RGB":
            internalFormat = "IntRGBA";
            break;
        case "UShort 565":
            internalFormat = "UShort565";
            break;
        case "ETC2 RGB":
            remoteFormat = "pkm";
            internalFormat = "ETC2 RGB8";
            break;
    }
    
    if (internalFormat.length > 0)
        // Background layer with a map
        imageTest.backLayer = wviz.addImageTileLayer(
            {
               tileURL: "http://tilesets.s3-website-us-east-1.amazonaws.com/blue_marble_tiled/",
               format: remoteFormat,
               "internalFormat": internalFormat,
               coordSys: "EPSG:4326",
                flipY: true,
               minZoom: 0,
               maxZoom: 8,
               drawPriority: 0
            }
        );
    
    if (wviz.env.ovlType != "Blank")
    {
        var ovlRemoteFormat = "png";
        var ovlInternalFormat = "";
        var shaderName = "weather shader regular";
        switch (wviz.env.ovlType)
        {
            case "UByteRed":
                ovlInternalFormat = "UByteRed";
                shaderName = "weather shader regular";
                break;
            case "EAC R11":
                ovlRemoteFormat = "pkm";
                ovlInternalFormat = "EAC R11";
                shaderName = "weather shader compressed";
                break;
            case "ETC2 RGB8":
                ovlRemoteFormat = "pkm";
                ovlInternalFormat = "ETC2 RGB8";
                shaderName = "weather shader compressed";
                break;
        }
        imageTest.ovlLayer = wviz.addImageTileLayer(
                {
                    tileURLs: ["http://tilesets.s3-website-us-east-1.amazonaws.com/precip/precip1/",
                           "http://tilesets.s3-website-us-east-1.amazonaws.com/precip/precip2/",
                           "http://tilesets.s3-website-us-east-1.amazonaws.com/precip/precip3/",
                           "http://tilesets.s3-website-us-east-1.amazonaws.com/precip/precip4/",
                           "http://tilesets.s3-website-us-east-1.amazonaws.com/precip/precip5/"],
//                    tileURL: "http://tilesets.s3-website-us-east-1.amazonaws.com/precip/precip1/",
                    format: ovlRemoteFormat,
                    "internalFormat": ovlInternalFormat,
                    connections: 2,
                    animationPeriod: 6.0,
                    handleEdges: false,
                    coverPoles: false,
                    flipY: false,
                    minZoom: 0,
                    maxZoom: 7,
                    drawPriority: 100,
                    shader: shaderName
                }
            );
    }
}

// Called when the app view is first initialized
wviz.events.onStartup = function()
{
    // Background color
    wviz.setBackgroundColor("#FFFFFFFF");
    
    // Name up top
    wviz.setTitle("Image Type Comparison");
    
    // Set up a weather shader
    wviz.addShader(
    {
        name: "weather shader regular",
        vertexShader: weatherVertexShader,
        fragmentShader: weatherFragmentShaderRegular
    });
    // For the compressed version, the data comes in on the Red channel
    wviz.addShader(
    {
        name: "weather shader compressed",
        vertexShader: weatherVertexShader,
        fragmentShader: weatherFragmentShaderCompressed
    });
    
    // Base type selector
    wviz.addControl(
                    {
                    name: "baseType",
                    "display name": "Base Map",
                    type: "list",
                    "default": "Int RGB",
                    "initial index": 1,
                    "values":[
                              "Blank",
                              "Int RGB",
                              "UShort 565",
                              "ETC2 RGB"
                              ],
                    changeFunc: queryChanged
                    });

    // Overlay type selector
    wviz.addControl(
                    {
                    name: "ovlType",
                    "display name": "Weather Overlay",
                    type: "list",
                    "default": "UByteRed",
                    "initial index": 1,
                    "values":[
                              "Blank",
                              "UByteRed",
//                              "EAC R11"
                              "ETC2 RGB8"
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
    "map type":"globe",
    "start":{
        "lon":-122,
        "lat":40,
        "height":1.5,
        "northup": true
    },
    "info url":""
};

// Let the startup routine know we're happy
true;
