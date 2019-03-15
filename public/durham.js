var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +
  'attribute vec2 a_TexCoords;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform vec3 u_LightColor;\n' +
  'uniform vec3 u_LightDirection;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec2 v_TexCoords;\n' +
  'varying vec3 v_Position;\n' +
  'uniform bool u_isLighting;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Color = a_Color;\n' +
  '  v_TexCoords = a_TexCoords;\n' +
  '  if(u_isLighting)\n' +
  '  {\n' +
  '     vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
  '     float nDotL = max(dot(normal, u_LightDirection), 0.0);\n' +
  '     vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
  '     v_Color = vec4(diffuse, a_Color.a);\n' + '  }\n' +
  '  else\n' +
  '  {\n' +
  '     v_Color = a_Color;\n' +
  '  }\n' +

  '}\n';


var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform bool u_UseTextures;\n' +
  'uniform vec3 u_LightPosition;\n' +
  'uniform vec3 u_AmbientLight;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec4 v_Color;\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoords;\n' +
  'void main() {\n' +
  'if (u_UseTextures) {\n' +
  '     gl_FragColor = texture2D(u_Sampler, v_TexCoords);\n' +
  '  } else {\n' +
  '  gl_FragColor = v_Color;\n' +
  '  }\n' +
  '}\n';


var modelMatrix = new Matrix4();
var viewMatrix = new Matrix4();
var projMatrix = new Matrix4();
var g_normalMatrix = new Matrix4();

var ANGLE_STEP = 3.0; // The increments of rotation angle (degrees)
var g_xAngle = 0.0; // The rotation x angle (degrees)
var g_yAngle = 0.0; // The rotation y angle (degrees)
var original_zoom = 16; //used for zooming in and out 
var zoom_increment = 1; //value by which zooming is increased
var zoom_decrement = 1;
var original_side = 0; //value for moving left and right
var side_increment = 0.5;
var side_decrement = 0.5;
//used for rotating the door
var currentAngle = 5.0;
//used for making the barriers move up and down
var pole_length = 0.90;
var pole_dir = -1.5;
var rotating_door = 3.0;
//used for making the bird moving
var bird_dir = 3.5;
var bird_end = false;
var bird_angle = 2;
var bird_angle_flag = false;


var main = function () {

  var canvas = document.getElementById('webgl');

  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  gl.clearColor(0.75896, 0.85963, 0.9, 1.0);
  gl.enable(gl.DEPTH_TEST);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);




  // Get the storage locations of uniform attributes
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');


  var u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting');

  if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
    !u_ProjMatrix || !u_LightColor || !u_LightDirection ||
    !u_isLighting) {
    console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
    return;
  }
  document.getElementById("now").innerHTML = "Current mode: <b>Morning<b> mode";
  // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  var lightDirection = new Vector3([1, 3.0, 5.0]);
  lightDirection.normalize(); // Normalize
  gl.uniform3fv(u_LightDirection, lightDirection.elements);

  viewMatrix.setLookAt(original_side, 0, original_zoom, 0, 0, -100, 0, 1, 0);
  projMatrix.setPerspective(45, canvas.width / canvas.height, 1, 100);
  // Pass the model, view, and projection matrix to the uniform variable respectively
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

  u_UseTextures = gl.getUniformLocation(gl.program, "u_UseTextures");
  u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');

  //load the textures
  var groundTexture = gl.createTexture();
  groundTexture.image = new Image();
  groundTexture.image.src = 'textures/ground.jpg';
  groundTexture.image.onload = function () {
    loadTexture(gl, groundTexture, gl.TEXTURE1);
  };

  var buildingTexture = gl.createTexture();
  buildingTexture.image = new Image();
  buildingTexture.image.src = 'textures/brick_build1.jpg';
  buildingTexture.image.onload = function () {
    loadTexture(gl, buildingTexture, gl.TEXTURE2);
  };

  var signTexture = gl.createTexture();
  signTexture.image = new Image();
  signTexture.image.src = 'textures/sign.png';
  signTexture.image.onload = function () {
    loadTexture(gl, signTexture, gl.TEXTURE3);
  };

  var otherbuildingTexture = gl.createTexture();
  otherbuildingTexture.image = new Image();
  otherbuildingTexture.image.src = 'textures/brick_build2.jpg';
  otherbuildingTexture.image.onload = function () {
    loadTexture(gl, otherbuildingTexture, gl.TEXTURE4);
  };

  var tick = function () {
    currentAngle = animate(currentAngle); // rotate the door
    move_bird(); //move bird forward and backward
    move_wings(); //flap the wings
    document.onkeydown = function (ev) {
      keydown(ev, gl, u_LightColor, u_LightDirection, u_ViewMatrix);
    };
    drawEnvirnoment(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_UseTextures, currentAngle);
    requestAnimationFrame(tick, canvas);
  };
  tick();
}


function keydown(ev, gl, u_LightColor, u_LightDirection, u_ViewMatrix) {
  switch (ev.keyCode) {
    case 38: // Up arrow key -> the positive rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle + ANGLE_STEP) % 360;
      break;
    case 40: // Down arrow key -> the negative rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle - ANGLE_STEP) % 360;
      break;
    case 37: // Right arrow key -> the positive rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
      break;
    case 39: // Left arrow key -> the negative rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle - ANGLE_STEP) % 360;
      break;
    case 77: // M for Morning
      gl.clearColor(0.75896, 0.85963, 0.9, 1.0);
      gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
      var lightDirection = new Vector3([1, 3.0, 5.0]);
      lightDirection.normalize(); // Normalize
      gl.uniform3fv(u_LightDirection, lightDirection.elements);
      document.getElementById("now").innerHTML = "Current mode: <b>Morning<b> mode";
      break;

    case 78: //N for Night
      gl.clearColor(0.5, 0.5, 0.5, 1.0);
      gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
      var lightDirection = new Vector3([0.5, 5.0, 1.0]);
      lightDirection.normalize(); // Normalize
      gl.uniform3fv(u_LightDirection, lightDirection.elements);
      document.getElementById("now").innerHTML = "Current mode: <b>Night<b> mode";
      break;

    case 83: // w zoom in
      original_zoom = original_zoom + zoom_increment;
      viewMatrix.setLookAt(original_side, 0, original_zoom, 0, 0, -100, 0, 1, 0);
      gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
      break;
    case 65: // a move left
      original_side = original_side + side_increment;
      viewMatrix.setLookAt(original_side, 0, original_zoom, 0, 0, -100, 0, 1, 0);
      gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
      break;
    case 68: // d move right
      original_side = original_side - side_decrement;
      viewMatrix.setLookAt(original_side, 0, original_zoom, 0, 0, -100, 0, 1, 0);
      gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
      break;
    case 87: // s zoom out
      original_zoom = original_zoom - zoom_decrement;
      viewMatrix.setLookAt(original_side, 0, original_zoom, 0, 0, -100, 0, 1, 0);
      gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
      break;
    default:
      return;
  }

}

function cubes(gl, colour) {

  var vertices = new Float32Array([
    0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, // v0-v1-v2-v3 front
    0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, // v0-v3-v4-v5 right
    0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, // v1-v6-v7-v2 left
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, // v7-v4-v3-v2 down
    0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5 // v4-v7-v6-v5 back
  ]);

  if (colour == 'grey') {
    var colors = new Float32Array([ // Colors
      0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, // v0-v1-v2-v3 front
      0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, // v0-v3-v4-v5 right
      0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, // v0-v5-v6-v1 up
      0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, // v1-v6-v7-v2 left
      0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, // v7-v4-v3-v2 down
      0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, // v4-v7-v6-v5 back
    ]);
  }

  if (colour == 'base_colour') {
    var colors = new Float32Array([ // Colors
      0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, // v0-v1-v2-v3 front
      0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, // v0-v3-v4-v5 right
      0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, // v0-v5-v6-v1 up
      0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, // v1-v6-v7-v2 left
      0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, // v7-v4-v3-v2 down
      0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.360784, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, // v4-v7-v6-v5 back
    ]);
  }

  if (colour == 'roof_colour') {
    var colors = new Float32Array([ // Colors
      0.1490196, 0.3019607, 0, 0.1490196, 0.3019607, 0, 0.1490196, 0.3019607, 0, 0.1490196, 0.3019607, 0,
      0.1490196, 0.3019607, 0, 0.1490196, 0.3019607, 0, 0.1490196, 0.3019607, 0, 0.1490196, 0.3019607, 0, // v0-v3-v4-v5 right
      0.1490196, 0.3019607, 0, 0.1490196, 0.3019607, 0, 0.1490196, 0.3019607, 0, 0.1490196, 0.3019607, 0, // v0-v5-v6-v1 up
      0.1490196, 0.3019607, 0, 0.1490196, 0.3019607, 0, 0.1490196, 0.3019607, 0, 0.1490196, 0.3019607, 0,
      0.1490196, 0.3019607, 0, 0.1490196, 0.3019607, 0, 0.1490196, 0.3019607, 0, 0.1490196, 0.3019607, 0, // v7-v4-v3-v2 down
      0.1490196, 0.3019607, 0, 0.1490196, 0.3019607, 0, 0.1490196, 0.3019607, 0, 0.1490196, 0.3019607, 0,
    ]);
  }

  if (colour == 'black') {
    var colors = new Float32Array([ // Colors
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // v0-v1-v2-v3 front
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // v0-v3-v4-v5 right
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // v0-v5-v6-v1 up
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // v1-v6-v7-v2 left
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // v7-v4-v3-v2 down
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // v4-v7-v6-v5 back
    ]);
  }

  if (colour == 'sienna') {
    var colors = new Float32Array([ // Colors
      0.627450, 0.32156, 0.17647, 0.627450, 0.32156, 0.17647, 0.627450, 0.32156, 0.17647, 0.627450, 0.32156, 0.17647, // v0-v1-v2-v3 front
      0.627450, 0.32156, 0.17647, 0.627450, 0.32156, 0.17647, 0.627450, 0.32156, 0.17647, 0.627450, 0.32156, 0.17647, // v0-v3-v4-v5 right
      0.627450, 0.32156, 0.17647, 0.627450, 0.32156, 0.17647, 0.627450, 0.32156, 0.17647, 0.627450, 0.32156, 0.17647, // v0-v5-v6-v1 up
      0.627450, 0.32156, 0.17647, 0.627450, 0.32156, 0.17647, 0.627450, 0.32156, 0.17647, 0.627450, 0.32156, 0.17647, // v1-v6-v7-v2 left
      0.627450, 0.32156, 0.17647, 0.627450, 0.32156, 0.17647, 0.627450, 0.32156, 0.17647, 0.627450, 0.32156, 0.17647, // v7-v4-v3-v2 down
      0.627450, 0.32156, 0.17647, 0.627450, 0.32156, 0.17647, 0.627450, 0.32156, 0.17647, 0.627450, 0.32156, 0.17647, // v4-v7-v6-v5 back
    ]);
  }

  if (colour == 'peru') {
    var colors = new Float32Array([ // Colors
      0.803921, 0.52156, 0.247058, 0.803921, 0.52156, 0.247058, 0.803921, 0.52156, 0.247058, 0.803921, 0.52156, 0.247058, // v0-v1-v2-v3 front
      0.803921, 0.52156, 0.247058, 0.803921, 0.52156, 0.247058, 0.803921, 0.52156, 0.247058, 0.803921, 0.52156, 0.247058, // v0-v3-v4-v5 right
      0.803921, 0.52156, 0.247058, 0.803921, 0.52156, 0.247058, 0.803921, 0.52156, 0.247058, 0.803921, 0.52156, 0.247058, // v0-v5-v6-v1 up
      0.803921, 0.52156, 0.247058, 0.803921, 0.52156, 0.247058, 0.803921, 0.52156, 0.247058, 0.803921, 0.52156, 0.247058, // v1-v6-v7-v2 left
      0.803921, 0.52156, 0.247058, 0.803921, 0.52156, 0.247058, 0.803921, 0.52156, 0.247058, 0.803921, 0.52156, 0.247058, // v7-v4-v3-v2 down
      0.803921, 0.52156, 0.247058, 0.803921, 0.52156, 0.247058, 0.803921, 0.52156, 0.247058, 0.803921, 0.52156, 0.247058, // v4-v7-v6-v5 back
    ]);
  }

  if (colour == 'blue') {
    var colors = new Float32Array([ // Colors
      1, 1, 1, 0.6784313, 0.847058, 0.901960, 1, 1, 1, 0.6784313, 0.847058, 0.901960, // v0-v1-v2-v3 front
      0.6784313, 0.847058, 0.901960, 0.6784313, 0.847058, 0.901960, 0.6784313, 0.847058, 0.901960, 0.6784313, 0.847058, 0.901960, // v0-v3-v4-v5 right
      0.6784313, 0.847058, 0.901960, 0.6784313, 0.847058, 0.901960, 0.6784313, 0.847058, 0.901960, 0.6784313, 0.847058, 0.901960, // v0-v5-v6-v1 up
      0.6784313, 0.847058, 0.901960, 0.6784313, 0.847058, 0.901960, 0.6784313, 0.847058, 0.901960, 0.6784313, 0.847058, 0.901960, // v1-v6-v7-v2 left
      0.6784313, 0.847058, 0.901960, 0.6784313, 0.847058, 0.901960, 0.6784313, 0.847058, 0.901960, 0.6784313, 0.847058, 0.901960, // v7-v4-v3-v2 down
      0.6784313, 0.847058, 0.901960, 0.6784313, 0.847058, 0.901960, 0.6784313, 0.847058, 0.901960, 0.6784313, 0.847058, 0.901960, // v4-v7-v6-v5 back
    ]);
  }

  if (colour == 'door') {
    var colors = new Float32Array([ // Colors
      0.529411, 0.807843, 0.980392, 0.529411, 0.807843, 0.980392, 1, 1, 1, 1, 1, 1, // v0-v1-v2-v3 front
      0.529411, 0.807843, 0.980392, 0.529411, 0.807843, 0.980392, 0.529411, 0.807843, 0.980392, 0.529411, 0.807843, 0.980392, // v0-v3-v4-v5 right
      0.529411, 0.807843, 0.980392, 0.529411, 0.807843, 0.980392, 0.529411, 0.807843, 0.980392, 0.529411, 0.807843, 0.980392, // v0-v5-v6-v1 up
      0.529411, 0.807843, 0.980392, 0.529411, 0.807843, 0.980392, 0.529411, 0.807843, 0.980392, 0.529411, 0.807843, 0.980392, // v1-v6-v7-v2 left
      0.529411, 0.807843, 0.980392, 0.529411, 0.807843, 0.980392, 0.529411, 0.807843, 0.980392, 0.529411, 0.807843, 0.980392, // v7-v4-v3-v2 down
      0.529411, 0.807843, 0.980392, 0.529411, 0.807843, 0.980392, 0.529411, 0.807843, 0.980392, 0.529411, 0.807843, 0.980392, // v4-v7-v6-v5 back
    ]);
  }
  if (colour == 'white') {
    var colors = new Float32Array([ // Colors
      0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, // v0-v1-v2-v3 front
      0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, // v0-v3-v4-v5 right
      0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, // v0-v5-v6-v1 up
      0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, // v1-v6-v7-v2 left
      0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, // v7-v4-v3-v2 down
      0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, 0.2117647, // v4-v7-v6-v5 back
    ]);
  }

  if (colour == 'lime') {
    var colors = new Float32Array([ // Colors
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, // v0-v1-v2-v3 front
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, // v0-v3-v4-v5 right
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, // v0-v5-v6-v1 up
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, // v1-v6-v7-v2 left
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, // v7-v4-v3-v2 down
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, // v4-v7-v6-v5 back
    ]);
  }

  if (colour == 'green') {
    var colors = new Float32Array([ // Colors
      0, 0.50196, 0, 0, 0.50196, 0, 0, 0.50196, 0, 0, 0.50196, 0, // v0-v1-v2-v3 front
      0, 0.50196, 0, 0, 0.50196, 0, 0, 0.50196, 0, 0, 0.50196, 0, // v0-v3-v4-v5 right
      0, 0.50196, 0, 0, 0.50196, 0, 0, 0.50196, 0, 0, 0.50196, 0, // v0-v5-v6-v1 up
      0, 0.50196, 0, 0, 0.50196, 0, 0, 0.50196, 0, 0, 0.50196, 0, // v1-v6-v7-v2 left
      0, 0.50196, 0, 0, 0.50196, 0, 0, 0.50196, 0, 0, 0.50196, 0, // v7-v4-v3-v2 down
      0, 0.50196, 0, 0, 0.50196, 0, 0, 0.50196, 0, 0, 0.50196, 0, // v4-v7-v6-v5 back
    ]);
  }

  if (colour == 'light_yellow') {
    var colors = new Float32Array([ // Colors
      1, 1, 0.8784313, 1, 1, 0.8784313, 1, 1, 0.8784313, 1, 1, 0.8784313, // v0-v1-v2-v3 front
      1, 1, 0.8784313, 1, 1, 0.8784313, 1, 1, 0.8784313, 1, 1, 0.8784313, // v0-v3-v4-v5 right
      1, 1, 0.8784313, 1, 1, 0.8784313, 1, 1, 0.8784313, 1, 1, 0.8784313, // v0-v5-v6-v1 up
      1, 1, 0.8784313, 1, 1, 0.8784313, 1, 1, 0.8784313, 1, 1, 0.8784313, // v1-v6-v7-v2 left
      1, 1, 0.8784313, 1, 1, 0.8784313, 1, 1, 0.8784313, 1, 1, 0.8784313, // v7-v4-v3-v2 down
      1, 1, 0.8784313, 1, 1, 0.8784313, 1, 1, 0.8784313, 1, 1, 0.8784313, // v4-v7-v6-v5 back
    ]);
  }


  if (colour == 'bird') {
    var colors = new Float32Array([ // Colors
      0.466667, 0.533333, 0.6, 0.466667, 0.533333, 0.6, 0.466667, 0.533333, 0.6, 0.466667, 0.533333, 0.6, // v0-v1-v2-v3 front
      0.466667, 0.533333, 0.6, 0.466667, 0.533333, 0.6, 0.466667, 0.533333, 0.6, 0.466667, 0.533333, 0.6, // v0-v3-v4-v5 right
      0.466667, 0.533333, 0.6, 0.466667, 0.533333, 0.6, 0.466667, 0.533333, 0.6, 0.466667, 0.533333, 0.6, // v0-v5-v6-v1 up
      0.466667, 0.533333, 0.6, 0.466667, 0.533333, 0.6, 0.466667, 0.533333, 0.6, 0.466667, 0.533333, 0.6, // v1-v6-v7-v2 left
      0.466667, 0.533333, 0.6, 0.466667, 0.533333, 0.6, 0.466667, 0.533333, 0.6, 0.466667, 0.533333, 0.6, // v7-v4-v3-v2 down
      0.466667, 0.533333, 0.6, 0.466667, 0.533333, 0.6, 0.466667, 0.533333, 0.6, 0.466667, 0.533333, 0.6, // v4-v7-v6-v5 back
    ]);
  }

  if (colour == 'saddle_brown') {
    var colors = new Float32Array([ // Colors
      0.545098, 0.270588, 0.074509, 0.545098, 0.270588, 0.074509, 0.545098, 0.270588, 0.074509, 0.545098, 0.270588, 0.074509, // v0-v1-v2-v3 front
      0.545098, 0.270588, 0.074509, 0.545098, 0.270588, 0.074509, 0.545098, 0.270588, 0.074509, 0.545098, 0.270588, 0.074509, // v0-v3-v4-v5 right
      0.545098, 0.270588, 0.074509, 0.545098, 0.270588, 0.074509, 0.545098, 0.270588, 0.074509, 0.545098, 0.270588, 0.074509, // v0-v5-v6-v1 up
      0.545098, 0.270588, 0.074509, 0.545098, 0.270588, 0.074509, 0.545098, 0.270588, 0.074509, 0.545098, 0.270588, 0.074509, // v1-v6-v7-v2 left
      0.545098, 0.270588, 0.074509, 0.545098, 0.270588, 0.074509, 0.545098, 0.270588, 0.074509, 0.545098, 0.270588, 0.074509, // v7-v4-v3-v2 down
      0.545098, 0.270588, 0.074509, 0.545098, 0.270588, 0.074509, 0.545098, 0.270588, 0.074509, 0.545098, 0.270588, 0.074509, // v4-v7-v6-v5 back
    ]);
  }

  if (colour == 'gold') {
    var colors = new Float32Array([ // Colors
      1, 0.745098, 0, 1, 0.745098, 0, 1, 0.745098, 0, 1, 0.745098, 0, // v0-v1-v2-v3 front
      1, 0.745098, 0, 1, 0.745098, 0, 1, 0.745098, 0, 1, 0.745098, 0, // v0-v3-v4-v5 right
      1, 0.745098, 0, 1, 0.745098, 0, 1, 0.745098, 0, 1, 0.745098, 0, // v0-v5-v6-v1 up
      1, 0.745098, 0, 1, 0.745098, 0, 1, 0.745098, 0, 1, 0.745098, 0, // v1-v6-v7-v2 left
      1, 0.745098, 0, 1, 0.745098, 0, 1, 0.745098, 0, 1, 0.745098, 0, // v7-v4-v3-v2 down
      1, 0.745098, 0, 1, 0.745098, 0, 1, 0.745098, 0, 1, 0.745098, 0, // v4-v7-v6-v5 back
    ]);
  }

  var normals = new Float32Array([ // Normal
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // v0-v1-v2-v3 front
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // v0-v3-v4-v5 right
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, // v7-v4-v3-v2 down
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0 // v4-v7-v6-v5 back
  ]);

  var texCoords = new Float32Array([
    1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v0-v1-v2-v3 front
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, // v0-v3-v4-v5 right
    1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, // v0-v5-v6-v1 up
    1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v1-v6-v7-v2 left
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, // v7-v4-v3-v2 down
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0 // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
    0, 1, 2, 0, 2, 3, // front
    4, 5, 6, 4, 6, 7, // right
    8, 9, 10, 8, 10, 11, // up
    12, 13, 14, 12, 14, 15, // left
    16, 17, 18, 16, 18, 19, // down
    20, 21, 22, 20, 22, 23 // back
  ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function sign_cube(gl, colour) {
  var vertices = new Float32Array([
    0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, // v0-v1-v2-v3 front
    0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, // v0-v3-v4-v5 right
    0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, // v1-v6-v7-v2 left
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, // v7-v4-v3-v2 down
    0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5 // v4-v7-v6-v5 back
  ]);

  if (colour == 'grey') {
    var colors = new Float32Array([ // Colors
      0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, // v0-v1-v2-v3 front
      0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, // v0-v3-v4-v5 right
      0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, // v0-v5-v6-v1 up
      0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, // v1-v6-v7-v2 left
      0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, // v7-v4-v3-v2 down
      0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, 0.5019, // v4-v7-v6-v5 back
    ]);
  }


  var normals = new Float32Array([ // Normal
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // v0-v1-v2-v3 front
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // v0-v3-v4-v5 right
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, // v7-v4-v3-v2 down
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0 // v4-v7-v6-v5 back
  ]);

  var texCoords = new Float32Array([
    1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v0-v1-v2-v3 front
    0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, // v0-v3-v4-v5 right
    0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, // v0-v5-v6-v1 up
    0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, // v1-v6-v7-v2 left
    0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, // v7-v4-v3-v2 down
    0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0 // v4-v7-v6-v5 back
  ]);



  // Indices of the vertices
  var indices = new Uint8Array([
    0, 1, 2, 0, 2, 3, // front
    4, 5, 6, 4, 6, 7, // right
    8, 9, 10, 8, 10, 11, // up
    12, 13, 14, 12, 14, 15, // left
    16, 17, 18, 16, 18, 19, // down
    20, 21, 22, 20, 22, 23 // back
  ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}



function ground(gl) {

  var vertices = new Float32Array([ // Coordinates
    0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, // v0-v1-v2-v3 front
    0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, // v0-v3-v4-v5 right
    0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, // v1-v6-v7-v2 left
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, // v7-v4-v3-v2 down
    0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5 // v4-v7-v6-v5 back
  ]);


  var colors = new Float32Array([ // Colors
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, // v0-v1-v2-v3 front
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, // v0-v3-v4-v5 right
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, // v0-v5-v6-v1 up
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, // v1-v6-v7-v2 left
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, // v7-v4-v3-v2 down
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0 // v4-v7-v6-v5 back
  ]);

  var texCoords = new Float32Array([
    1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0, // v0-v1-v2-v3 front
    1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, // v0-v3-v4-v5 right
    1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, // v0-v5-v6-v1 up
    0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, // v1-v6-v7-v2 left
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, // v7-v4-v3-v2 down
    1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0 // v4-v7-v6-v5 back
  ]);


  var normals = new Float32Array([ // Normal
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // v0-v1-v2-v3 front
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // v0-v3-v4-v5 right
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, // v7-v4-v3-v2 down
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0 // v4-v7-v6-v5 back
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
    0, 1, 2, 0, 2, 3, // front
    4, 5, 6, 4, 6, 7, // right
    8, 9, 10, 8, 10, 11, // up
    12, 13, 14, 12, 14, 15, // left
    16, 17, 18, 16, 18, 19, // down
    20, 21, 22, 20, 22, 23 // back
  ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2, gl.FLOAT)) return -1;


  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function triangle(gl) {

  var vertices = new Float32Array([ // Coordinates
    -0.5, -0.5, 0.0,
    0.5, -0.5, 0.0,
    0.0, 0.5, 0.0,
  ]);


  var colors = new Float32Array([ // Colors
    0.5019, 0.5019, 0.5019,
    0.5019, 0.5019, 0.5019,
    0.5019, 0.5019, 0.5019,


  ]);

  var texCoords = new Float32Array([
    1.0, 1.0, 0.0, 1.0, 0.0, 0.0, // v0-v1-v2-v3 front
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, // v7-v4-v3-v2 down
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, // v4-v7-v6-v5 back
  ]);


  var normals = new Float32Array([ // Normal
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // v0-v1-v2-v3 front
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, // v7-v4-v3-v2 down
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, // v4-v7-v6-v5 back
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
    0, 1, 2,
  ]);

  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, 2, gl.FLOAT)) return -1;

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);



  return indices.length;
}


function initArrayBuffer (gl, attribute, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}


var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}

function drawEnvirnoment(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_UseTextures, currentAngle) {
  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniform1i(u_isLighting, true); // Will not apply lighting
  gl.uniform1i(u_UseTextures, false);
  modelMatrix.setTranslate(0, 0, 0); // Translation (No translation is supported here)
  modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis

  /* Ground */
  var n = ground(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  gl.activeTexture(gl.TEXTURE1);
  gl.uniform1i(u_Sampler, 1);
  gl.uniform1i(u_UseTextures, true);
  pushMatrix(modelMatrix);
  modelMatrix.translate(0, -2, 0);
  modelMatrix.scale(11.5, 0.05, 8);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  gl.uniform1i(u_UseTextures, false);
  modelMatrix = popMatrix();

  gl.uniform1i(u_UseTextures, false);

  var n = sign_cube(gl, 'grey');
  //Sign
  gl.activeTexture(gl.TEXTURE3);
  gl.uniform1i(u_Sampler, 3);
  gl.uniform1i(u_UseTextures, true);
  pushMatrix(modelMatrix);
  modelMatrix.translate(-4, -1.5, 1.5);
  modelMatrix.scale(1, 1, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  gl.uniform1i(u_UseTextures, false);
  modelMatrix = popMatrix();

  /* Start of building 1 */

  var n = cubes(gl, 'base_colour');
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, -1.8, -2);
  modelMatrix.scale(9.3, 0.4, 4);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl, 'grey');

  gl.uniform1i(u_UseTextures, false);
  //First step from top
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.07, -1.75, 0.2);
  modelMatrix.scale(1, 0.09, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Second step from top
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.07, -1.84, 0.2);
  modelMatrix.scale(1, 0.09, 0.7);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Third step
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.07, -1.93, 0.2);
  modelMatrix.scale(1, 0.09, 0.9);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  gl.uniform1i(u_UseTextures, true);

  //Left wall 
  gl.activeTexture(gl.TEXTURE2);
  gl.uniform1i(u_Sampler, 2);
  gl.uniform1i(u_UseTextures, true);
  pushMatrix(modelMatrix);
  modelMatrix.translate(-5.69, 0.9, -2.4);
  modelMatrix.scale(0.08, 5, 3.2);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Back wall
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.1, 0.9, -3.96);
  modelMatrix.scale(9.2, 5, 0.08);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Right wall
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.53, 0.9, -2.4);
  modelMatrix.scale(0.08, 5, 3.2);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Front wall 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-5.53, 0.9, -0.8);
  modelMatrix.scale(0.4, 5, 0.08);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Front wall 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.19, 0.9, -0.8);
  modelMatrix.scale(0.5, 5, 0.08);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Front wall 3
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.90, 0.9, -0.8);
  modelMatrix.scale(0.5, 5, 0.08);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Front wall 4
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.61, 0.9, -0.8);
  modelMatrix.scale(0.5, 5, 0.08);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Front wall 5
  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.32, 0.9, -0.8);
  modelMatrix.scale(0.5, 5, 0.08);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Front wall 6
  pushMatrix(modelMatrix);
  modelMatrix.translate(0.97, 0.9, -0.8);
  modelMatrix.scale(0.5, 5, 0.08);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Front wall 7
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.25, 0.9, -0.8);
  modelMatrix.scale(0.5, 5, 0.08);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Front wall 8
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.37, 0.9, -0.8);
  modelMatrix.scale(0.4, 5, 0.08);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Roof Back part
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 4.18, -3.17);
  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.rotate(45, 0, 1, 0);
  modelMatrix.scale(0.06, 9.3, 2.26);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Roof Front part
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 4.18, -1.57);
  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.rotate(45, 0, -1, 0);
  modelMatrix.scale(0.06, 9.3, 2.26);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  gl.uniform1i(u_UseTextures, false);

 


  var n = cubes(gl, 'saddle_brown');

  //Chimney right
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.08, 4.18, -1.57);
  modelMatrix.scale(0.5, 1, 1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl, 'black');

  //cyl 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.08, 4.85, -1.9);
  modelMatrix.scale(0.3, 0.3, 0.1);
  modelMatrix.rotate(90, 1, 0, 0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //cyl 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.08, 4.85, -1.65);
  modelMatrix.scale(0.3, 0.3, 0.1);
  modelMatrix.rotate(90, 1, 0, 0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //cyl 3
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.08, 4.85, -1.40);
  modelMatrix.scale(0.3, 0.3, 0.1);
  modelMatrix.rotate(90, 1, 0, 0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //cyl 4
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.08, 4.85, -1.17);
  modelMatrix.scale(0.3, 0.3, 0.1);
  modelMatrix.rotate(90, 1, 0, 0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl, 'saddle_brown');

  //Chimney left
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 4.18, -1.57);
  modelMatrix.scale(0.5, 1, 1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl, 'black');

  //cyl 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 4.85, -1.9);
  modelMatrix.scale(0.3, 0.3, 0.1);
  modelMatrix.rotate(90, 1, 0, 0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //cyl 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 4.85, -1.65);
  modelMatrix.scale(0.3, 0.3, 0.1);
  modelMatrix.rotate(90, 1, 0, 0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //cyl 3
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 4.85, -1.40);
  modelMatrix.scale(0.3, 0.3, 0.1);
  modelMatrix.rotate(90, 1, 0, 0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //cyl 4
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 4.85, -1.17);
  modelMatrix.scale(0.3, 0.3, 0.1);
  modelMatrix.rotate(90, 1, 0, 0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl, 'blue');
  //window starting top right and move to the left
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.82, 2.34, -0.75);
  modelMatrix.scale(0.78, 1.2, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1.61, 2.34, -0.75);
  modelMatrix.scale(0.78, 1.2, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0.32, 2.34, -0.75);
  modelMatrix.scale(0.79, 1.2, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.97, 2.34, -0.75);
  modelMatrix.scale(0.79, 1.2, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.25, 2.34, -0.75);
  modelMatrix.scale(0.79, 1.2, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.54, 2.34, -0.75);
  modelMatrix.scale(0.79, 1.2, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.88, 2.34, -0.75);
  modelMatrix.scale(0.87, 1.2, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Second row

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.82, 0.8, -0.75);
  modelMatrix.scale(0.78, 1.2, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1.61, 0.8, -0.75);
  modelMatrix.scale(0.78, 1.2, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0.32, 0.8, -0.75);
  modelMatrix.scale(0.79, 1.2, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.97, 0.8, -0.75);
  modelMatrix.scale(0.79, 1.2, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.25, 0.8, -0.75);
  modelMatrix.scale(0.79, 1.2, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.54, 0.8, -0.75);
  modelMatrix.scale(0.79, 1.2, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.88, 0.8, -0.75);
  modelMatrix.scale(0.87, 1.2, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Third row

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.82, -0.91, -0.75);
  modelMatrix.scale(0.78, 1.33, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1.61, -0.91, -0.75);
  modelMatrix.scale(0.78, 1.33, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0.32, -0.91, -0.75);
  modelMatrix.scale(0.79, 1.33, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.97, -0.91, -0.75);
  modelMatrix.rotate(0, 0, 1, 0);
  modelMatrix.scale(0.79, 1.33, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl, 'door');

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.25, -0.91, -0.75);
  modelMatrix.rotate(currentAngle, 0, 1, 0);
  modelMatrix.scale(0.79, 1.33, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl, 'white');

  //Left frame

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.68, -0.91, -0.70);
  modelMatrix.scale(0.1, 1.33, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.8, -0.91, -0.70);
  modelMatrix.scale(0.1, 1.33, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.24, -0.2, -0.70);
  modelMatrix.scale(1, 0.1, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl, 'blue');

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.54, -0.91, -0.75);
  modelMatrix.scale(0.79, 1.33, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.88, -0.91, -0.75);
  modelMatrix.scale(0.87, 1.33, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl, 'black');

  //pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-5.65, -1.3, -0.03);
  modelMatrix.scale(0.1, 0.7, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.65, -1.3, -0.03);
  modelMatrix.scale(0.1, 0.7, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-5.15, -1.37, -0.03);
  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.scale(0.05, 0.87, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-5.15, -1.17, -0.03);
  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.scale(0.05, 0.87, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.65, -1.3, -0.03);
  modelMatrix.scale(0.1, 0.7, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.15, -1.37, -0.03);
  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.scale(0.05, 0.87, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.15, -1.17, -0.03);
  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.scale(0.05, 0.87, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.65, -1.3, -0.03);
  modelMatrix.scale(0.1, 0.7, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.15, -1.37, -0.03);
  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.scale(0.05, 0.87, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.15, -1.17, -0.03);
  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.scale(0.05, 0.87, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5, -1.3, -0.03);
  modelMatrix.scale(0.1, 0.7, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.5, -1.3, -0.03);
  modelMatrix.scale(0.1, 0.7, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1, -1.37, -0.03);
  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.scale(0.05, 0.89, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1, -1.17, -0.03);
  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.scale(0.05, 0.89, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();


  //pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(0.5, -1.3, -0.03);
  modelMatrix.scale(0.1, 0.7, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(0, -1.37, -0.03);
  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.scale(0.05, 0.89, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(0, -1.17, -0.03);
  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.scale(0.05, 0.89, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5, -1.3, -0.03);
  modelMatrix.scale(0.1, 0.7, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(1, -1.37, -0.03);
  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.scale(0.05, 0.89, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(1, -1.17, -0.03);
  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.scale(0.05, 0.89, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.5, -1.3, -0.03);
  modelMatrix.scale(0.1, 0.7, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(2, -1.37, -0.03);
  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.scale(0.05, 0.89, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(2, -1.17, -0.03);
  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.scale(0.05, 0.89, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.5, -1.3, -0.03);
  modelMatrix.scale(0.1, 0.7, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(3, -1.37, -0.03);
  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.scale(0.05, 0.89, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(3, -1.17, -0.03);
  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.scale(0.05, 0.89, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.59, -1.6, 0.7);
  modelMatrix.scale(0.1, 0.7, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.59, -1.6, 0.7);
  modelMatrix.scale(0.1, 0.7, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //diagonal pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.54, -1.38, 0.36);
  modelMatrix.rotate(90, 0, 1, 0);
  modelMatrix.rotate(120, 0, 0, 1);
  modelMatrix.scale(0.05, 0.81, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //diagonal pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.6, -1.38, 0.36);
  modelMatrix.rotate(90, 0, 1, 0);
  modelMatrix.rotate(120, 0, 0, 1);
  modelMatrix.scale(0.05, 0.81, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = triangle(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  gl.uniform1i(u_UseTextures, true);

  //Cover Sides of roof
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.58, 4.15, -2.37);
  modelMatrix.rotate(90, 0, 1, 0);
  modelMatrix.scale(3.29, 1.74, 2.6);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-5.73, 4.15, -2.37);
  modelMatrix.rotate(180, 0, 1, 0);
  modelMatrix.rotate(90, 0, 1, 0);
  modelMatrix.scale(3.29, 1.74, 2.6);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl, 'grey');

  //Cover upper part of roof
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 4.97, -2.37);
  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.scale(0.06, 9.3, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Gap between windows 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 3.17, -0.79);
  modelMatrix.scale(9.03, 0.5, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Gap between windows 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 1.6, -0.79);
  modelMatrix.scale(9.03, 0.5, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Gap between windows 3
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 0, -0.79);
  modelMatrix.scale(9.03, 0.5, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  gl.uniform1i(u_UseTextures, false);


  /*Start of building 2 */


  var n = cubes(gl, 'grey');
  //Base of building 2 (small one)
  gl.activeTexture(gl.TEXTURE4);
  gl.uniform1i(u_Sampler, 4);
  gl.uniform1i(u_UseTextures, true);
  pushMatrix(modelMatrix);
  modelMatrix.translate(4.65, -1.93, -0.98);
  modelMatrix.scale(2.1, 0.1, 6);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Left horizontal wall of building 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.7, -0.35, -0.98);
  modelMatrix.scale(0.08, 0.9, 6);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Left vertical wall 1 of building 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.7, -0.9, 0.7);
  modelMatrix.scale(0.08, 2, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Left vertical wall 2 of building 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.7, -0.9, 1.9);
  modelMatrix.scale(0.08, 2, 0.2);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Left vertical wall 3 of building 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.7, -0.9, -2.27);
  modelMatrix.scale(0.08, 2, 3.45);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Right wall of building 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(5.66, -0.9, -0.98);
  modelMatrix.scale(0.08, 2, 6);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Back wall of building 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(4.65, -0.9, -3.95);
  modelMatrix.scale(2, 2, 0.08);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Front wall of building 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(4.65, -0.9, 1.98);
  modelMatrix.scale(2, 2, 0.08);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  gl.uniform1i(u_UseTextures, false);

  var n = cubes(gl, 'roof_colour');
  //Roof left part
  pushMatrix(modelMatrix);
  modelMatrix.translate(4.20, 0.69, -0.98);
  modelMatrix.rotate(140, 0, 0, 1);
  modelMatrix.scale(0.08, 1.55, 6);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl, 'grey');
  //Large cube on roof
  pushMatrix(modelMatrix);
  modelMatrix.translate(4.20, 0.69, 0.5);
  modelMatrix.scale(0.8, 1, 2);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();


  var n = cubes(gl, 'blue');

  //Windows on roof
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.95, 0.75, 1.25);
  modelMatrix.rotate(-90, 0, 1, 0);
  modelMatrix.scale(0.4, 0.7, 0.4);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(3.95, 0.75, 0.75);
  modelMatrix.rotate(-90, 0, 1, 0);
  modelMatrix.scale(0.4, 0.7, 0.4);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(3.95, 0.75, 0.25);
  modelMatrix.rotate(-90, 0, 1, 0);
  modelMatrix.scale(0.4, 0.7, 0.4);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(3.95, 0.75, -0.25);
  modelMatrix.rotate(-90, 0, 1, 0);
  modelMatrix.scale(0.4, 0.7, 0.4);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  gl.uniform1i(u_UseTextures, false);
  var n = cubes(gl, 'roof_colour');

  //Roof right part
  pushMatrix(modelMatrix);
  modelMatrix.translate(5.16, 0.69, -0.98);
  modelMatrix.rotate(-140, 0, 0, 1);
  modelMatrix.scale(0.08, 1.55, 6);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  gl.uniform1i(u_UseTextures, true);
  var n = triangle(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
  modelMatrix.translate(4.68, 0.62, 2.03);
  modelMatrix.scale(2.06, 1.3, 1.9);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(4.68, 0.62, -3.98);
  modelMatrix.rotate(180, 0, 1, 0);
  modelMatrix.scale(2.06, 1.3, 1.9);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  gl.uniform1i(u_UseTextures, false);

  var n = cubes(gl, 'blue');

  //window 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.64, -1.34, 1.35);
  modelMatrix.scale(0.05, 1.2, 0.8);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //window 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.64, -1.34, -0.08);
  modelMatrix.scale(0.05, 1.2, 0.9);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //window 3
  pushMatrix(modelMatrix);
  modelMatrix.translate(4.7, -1.37, 2);
  modelMatrix.scale(0.79, 1.2, 0.05);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl, 'black');
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  //pole 1
  pushMatrix(modelMatrix);
  if (pole_length > 0.91) {
    pole_dir = -0.9;
    pole_length = 0.91;
    barrier_end = false;

  }
  if (pole_length <= 0.02 ) {
    pole_dir = -2.3;
    pole_length = 0;
    barrier_end = true;
  }

  modelMatrix.translate(-2.8, pole_dir, 2.3);
  modelMatrix.scale(0.2, pole_length, 0.2);
  //modelMatrix.rotate(90, 1, 0, 0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.8, pole_dir, 3.0);
  modelMatrix.scale(0.2, pole_length, 0.2);
  //modelMatrix.rotate(90, 1, 0, 0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //pole 3
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.8, pole_dir, 3.8);
  modelMatrix.scale(0.2, pole_length, 0.2);
  //modelMatrix.rotate(90, 1, 0, 0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl, 'sienna');

  //tree trunk
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.48, -1.52, 1.2);
  modelMatrix.scale(0.1, 1, 0.1);
  modelMatrix.rotate(90, 1, 0, 0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl, 'peru');

  //tree leaf 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.30, -1.2, 1.2);
  modelMatrix.rotate(90, 1, 1, 0);
  modelMatrix.scale(0.1, 0.1, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //tree leaf 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.3, -1.55, 1.30);
  modelMatrix.rotate(30, 1, 1, 0);
  modelMatrix.rotate(90, 1, 1, 0);
  modelMatrix.scale(0.1, 0.1, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();


  //tree leaf 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.6, -1.55, 1.25);
  modelMatrix.rotate(200, 1, 0, 1);
  modelMatrix.rotate(120, 1, 1, 0);
  modelMatrix.rotate(90, 1, 1, 0);
  modelMatrix.scale(0.1, 0.1, 0.4);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //tree leaf 3
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.73, -1.2, 1.15);
  modelMatrix.rotate(180, 0, 1, 0);
  modelMatrix.rotate(90, 1, 1, 0);
  modelMatrix.scale(0.1, 0.1, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //tree leaf 4
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.42, -1.25, 1.29);
  modelMatrix.rotate(50, 0, 1, 0);
  modelMatrix.rotate(90, 1, 1, 0);
  modelMatrix.scale(0.1, 0.1, 0.4);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //tree leaf 5
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.47, -1.2, 1.05);
  modelMatrix.rotate(270, 0, 1, 0);
  modelMatrix.rotate(90, 1, 1, 0);
  modelMatrix.scale(0.1, 0.1, 0.4);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();


  var n = cubes(gl, 'bird');
  if (bird_dir > 3) {
    bird_end = false;
  }
  if (bird_dir <= 0) {
    bird_end = true;
  }

  if (bird_angle > 50) {
    bird_angle_flag = false;
    bird_angle = 50;
  }
  if (bird_angle < -50) {
    bird_angle_flag = true;
    bird_angle = -50;
  }


  //bird body
  pushMatrix(modelMatrix);
  modelMatrix.translate(-5, 2, bird_dir);
  modelMatrix.scale(0.5, 0.5, 0.5);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //bird head
  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.99, 2.35, bird_dir + 0.35);
  modelMatrix.scale(0.3, 0.30, 0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //bird feather 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.7, 2, bird_dir);
  modelMatrix.rotate(bird_angle, 0, 0, 1);
  modelMatrix.scale(0.3, 0.02, 0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //bird feather 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-5.3, 2, bird_dir);
  modelMatrix.rotate(90, 0, 1, 0);
  modelMatrix.rotate(bird_angle, 1, 0, 0);
  modelMatrix.scale(0.3, 0.02, 0.3);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl, 'gold');
  //mouth
  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.97, 2.25, bird_dir + 0.55);
  modelMatrix.scale(0.2, 0.05, 0.1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //mouth
  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.97, 2.35, bird_dir + 0.55);
  modelMatrix.rotate(bird_angle, 1, 0, 0);
  modelMatrix.scale(0.2, 0.05, 0.1);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl, 'sienna');

  pushMatrix(modelMatrix);
  modelMatrix.translate(-5.15 - 0.01, 1.69, bird_dir);
  modelMatrix.rotate(90, 1, 0, 0);
  modelMatrix.scale(0.1, 0.1, 0.13);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.85 - 0.01, 1.69, bird_dir);
  modelMatrix.rotate(90, 1, 0, 0);
  modelMatrix.scale(0.1, 0.1, 0.13);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  gl.uniform1i(u_UseTextures, true);

}

function drawbox(gl, u_ModelMatrix, u_NormalMatrix, n) {
  pushMatrix(modelMatrix);

    // Pass the model matrix to the uniform variable
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

  modelMatrix = popMatrix();
}


function loadTexture(gl, texture, texNumb) {
  gl.activeTexture(texNumb);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
}

var g_last = Date.now();

function animate(angle) {
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (rotating_door * elapsed) / 1000.0;
  return newAngle %= 360;
}


function up() {
  rotating_door += 10;
}

function down() {
  rotating_door -= 10;
}


function forward_bird() {
  bird_dir += 0.3;
}

function backward_bird() {
  bird_dir -= 0.3;
}

function rotate_bird_up() {
  bird_angle += 10;
}

function rotate_bird_down() {
  bird_angle -= 10;
}

function move_wings() {
  if (bird_angle_flag == true) {
    rotate_bird_up();
  } else {
    rotate_bird_down();
  }
}


function move_bird() {
  if (bird_end == true) {
    forward_bird();
  } else {
    backward_bird();
  }
}

