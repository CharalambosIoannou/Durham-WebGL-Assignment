var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +
  'attribute vec2 a_TexCoords;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +    // Model matrix
  'uniform mat4 u_NormalMatrix;\n' +   // Transformation matrix of the normal
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec2 v_TexCoords;\n' +
  'varying vec3 v_Position;\n' +
  'uniform bool u_isLighting;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
     // Calculate the vertex position in the world coordinate
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Color = a_Color;\n' + 
  '  v_TexCoords = a_TexCoords;\n' +
  '  if(u_isLighting)\n' + 
  '  {\n' +
  '     vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);\n' +
  '     float nDotL = max(dot(normal, u_LightDirection), 0.0);\n' +
        // Calculate the color due to diffuse reflection
  '     vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
  '     v_Color = vec4(diffuse, a_Color.a);\n' +  '  }\n' +
  '  else\n' +
  '  {\n' +
  '     v_Color = a_Color;\n' +
  '  }\n' + 

  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform bool u_UseTextures;\n' +    // Texture enable/disable flag    // Light color
  'uniform vec3 u_LightPosition;\n' +  // Position of the light source
  'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
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


var modelMatrix = new Matrix4(); // The model matrix
var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

var ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
var g_xAngle = 0.0;    // The rotation x angle (degrees)
var g_yAngle = 0.0;    // The rotation y angle (degrees)
var original_zoom=16;
var zoom_increment=1;
var zoom_decrement=1;
var original_side=0;
var side_increment=0.5;
var side_decrement=0.5;




function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set clear color and enable hidden surface removal
  gl.clearColor( 0.74902, 0.847059, 0.9, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Get the storage locations of uniform attributes
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');

  // Trigger using lighting or not
  var u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting'); 

  if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
      !u_ProjMatrix || !u_LightColor || !u_LightDirection ||
      !u_isLighting ) { 
    console.log('Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
    return;
  }

  // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  var lightDirection = new Vector3([0.5, 3.0, 4.0]);
  lightDirection.normalize();     // Normalize
  gl.uniform3fv(u_LightDirection, lightDirection.elements);

  // Calculate the view matrix and the projection matrix
  viewMatrix.setLookAt(original_side, 0, original_zoom, 0, 0, -100, 0, 1, 0);
  projMatrix.setPerspective(45, canvas.width/canvas.height, 1, 100);
  // Pass the model, view, and projection matrix to the uniform variable respectively
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

  var u_UseTextures = gl.getUniformLocation(gl.program, "u_UseTextures");
  if (!u_UseTextures) { 
    console.log('Failed to get the storage location for texture map enable flag');
    return;
  }

  document.onkeydown = function(ev){
    keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_UseTextures,u_LightColor,u_LightDirection,u_ViewMatrix);
  };

  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_UseTextures);
}

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_UseTextures,u_LightColor,u_LightDirection,u_ViewMatrix) {
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
    /*case 83: // Sunset
    gl.uniform3f(u_LightColor, 1.0, 1.0, 0.0);
    lightDirection = new Vector3([-2, 3.0, 0.7]);
    lightDirection.normalize();     // Normalize
    gl.uniform3fv(u_LightDirection, lightDirection.elements);
    break;*/
    case 32: // Night
    gl.clearColor( 68/255, 50/255, 50/255, 1.0);
    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    lightDirection = new Vector3([-2, 3.0, 0.7]);
    lightDirection.normalize();     // Normalize
    gl.uniform3fv(u_LightDirection, lightDirection.elements);
    break;
  case 83: // w zoom in
    original_zoom= original_zoom + zoom_increment;
    viewMatrix.setLookAt(original_side, 0, original_zoom, 0, 0, -100, 0, 1, 0);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    break;
  case 65: // a move left
  original_side= original_side + side_increment;
    viewMatrix.setLookAt(original_side, 0, original_zoom, 0, 0, -100, 0, 1, 0);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  break;
  case 68: // d move right
  original_side= original_side - side_decrement;
    viewMatrix.setLookAt(original_side, 0, original_zoom, 0, 0, -100, 0, 1, 0);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  break;
  case 87: // s zoom out
    original_zoom= original_zoom - zoom_decrement;
    viewMatrix.setLookAt(original_side, 0, original_zoom, 0, 0, -100, 0, 1, 0);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  break;
    default: return; // Skip drawing at no effective action
  }

  // Draw the scene
  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_UseTextures);
}


function cubes(gl,colour) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([ 
    0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
    0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
    0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
    0.5,-0.5,-0.5, -0.5,-0.5,-0.5, -0.5, 0.5,-0.5, 0.5, 0.5,-0.5 // v4-v7-v6-v5 back
  ]);

  if (colour == 'grey'){
  var colors = new Float32Array([    // Colors
    0.5019,0.5019,0.5019,   0.5019,0.5019,0.5019,   0.5019,0.5019,0.5019,   0.5019,0.5019,0.5019,    // v0-v1-v2-v3 front
    0.5019,0.5019,0.5019,   0.5019,0.5019,0.5019,   0.5019,0.5019,0.5019,   0.5019,0.5019,0.5019,    // v0-v3-v4-v5 right
    0.5019,0.5019,0.5019,   0.5019,0.5019,0.5019,   0.5019,0.5019,0.5019,   0.5019,0.5019,0.5019,    // v0-v5-v6-v1 up
    0.5019,0.5019,0.5019,   0.5019,0.5019,0.5019,   0.5019,0.5019,0.5019,   0.5019,0.5019,0.5019,    // v1-v6-v7-v2 left
    0.5019,0.5019,0.5019,   0.5019,0.5019,0.5019,   0.5019,0.5019,0.5019,   0.5019,0.5019,0.5019,    // v7-v4-v3-v2 down
    0.5019,0.5019,0.5019,   0.5019,0.5019,0.5019,   0.5019,0.5019,0.5019,   0.5019,0.5019,0.5019,　 // v4-v7-v6-v5 back
 ]);
  }

  if (colour == 'black'){
    var colors = new Float32Array([    // Colors
      0,0,0,    0,0,0,    0,0,0,   0,0,0,    // v0-v1-v2-v3 front
      0,0,0,    0,0,0,    0,0,0,   0,0,0,    // v0-v3-v4-v5 right
      0,0,0,    0,0,0,    0,0,0,   0,0,0,    // v0-v5-v6-v1 up
      0,0,0,    0,0,0,    0,0,0,   0,0,0,    // v1-v6-v7-v2 left
      0,0,0,    0,0,0,    0,0,0,   0,0,0,    // v7-v4-v3-v2 down
      0,0,0,    0,0,0,    0,0,0,   0,0,0,　 // v4-v7-v6-v5 back
   ]);
    }

  if (colour == 'sienna'){
    var colors = new Float32Array([    // Colors
      0.627450,0.32156,0.17647,   0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647,   // v0-v1-v2-v3 front
      0.627450,0.32156,0.17647,   0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647,   // v0-v3-v4-v5 right
      0.627450,0.32156,0.17647,   0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647,   // v0-v5-v6-v1 up
      0.627450,0.32156,0.17647,   0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647,   // v1-v6-v7-v2 left
      0.627450,0.32156,0.17647,   0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647,   // v7-v4-v3-v2 down
      0.627450,0.32156,0.17647,   0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647,　 // v4-v7-v6-v5 back
   ]);
    }

  if (colour == 'peru'){
    var colors = new Float32Array([    // Colors
      0.803921,0.52156,0.247058,   0.803921,0.52156,0.247058, 0.803921,0.52156,0.247058, 0.803921,0.52156,0.247058,   // v0-v1-v2-v3 front
      0.803921,0.52156,0.247058,   0.803921,0.52156,0.247058, 0.803921,0.52156,0.247058, 0.803921,0.52156,0.247058,   // v0-v3-v4-v5 right
      0.803921,0.52156,0.247058,   0.803921,0.52156,0.247058, 0.803921,0.52156,0.247058, 0.803921,0.52156,0.247058,   // v0-v5-v6-v1 up
      0.803921,0.52156,0.247058,   0.803921,0.52156,0.247058, 0.803921,0.52156,0.247058, 0.803921,0.52156,0.247058,   // v1-v6-v7-v2 left
      0.803921,0.52156,0.247058,   0.803921,0.52156,0.247058, 0.803921,0.52156,0.247058, 0.803921,0.52156,0.247058,   // v7-v4-v3-v2 down
      0.803921,0.52156,0.247058,   0.803921,0.52156,0.247058, 0.803921,0.52156,0.247058, 0.803921,0.52156,0.247058,　 // v4-v7-v6-v5 back
    ]);
    }

  if (colour == 'blue'){
    var colors = new Float32Array([    // Colors
      1,1,1,   0.6784313,0.847058,0.901960, 1,1,1, 0.6784313,0.847058,0.901960,  // v0-v1-v2-v3 front
      0.6784313,0.847058,0.901960,   0.6784313,0.847058,0.901960, 0.6784313,0.847058,0.901960, 0.6784313,0.847058,0.901960,  // v0-v3-v4-v5 right
      0.6784313,0.847058,0.901960,   0.6784313,0.847058,0.901960, 0.6784313,0.847058,0.901960, 0.6784313,0.847058,0.901960,  // v0-v5-v6-v1 up
      0.6784313,0.847058,0.901960,   0.6784313,0.847058,0.901960, 0.6784313,0.847058,0.901960, 0.6784313,0.847058,0.901960,  // v1-v6-v7-v2 left
      0.6784313,0.847058,0.901960,   0.6784313,0.847058,0.901960, 0.6784313,0.847058,0.901960, 0.6784313,0.847058,0.901960,  // v7-v4-v3-v2 down
      0.6784313,0.847058,0.901960,   0.6784313,0.847058,0.901960, 0.6784313,0.847058,0.901960, 0.6784313,0.847058,0.901960,　 // v4-v7-v6-v5 back
    ]);
    }

  if (colour == 'door'){
    var colors = new Float32Array([    // Colors
      0.529411,0.807843,0.980392,   0.529411,0.807843,0.980392, 1,1,1, 1,1,1,  // v0-v1-v2-v3 front
      0.529411,0.807843,0.980392,   0.529411,0.807843,0.980392, 0.529411,0.807843,0.980392, 0.529411,0.807843,0.980392,  // v0-v3-v4-v5 right
      0.529411,0.807843,0.980392,   0.529411,0.807843,0.980392, 0.529411,0.807843,0.980392, 0.529411,0.807843,0.980392,  // v0-v5-v6-v1 up
      0.529411,0.807843,0.980392,   0.529411,0.807843,0.980392, 0.529411,0.807843,0.980392, 0.529411,0.807843,0.980392,  // v1-v6-v7-v2 left
      0.529411,0.807843,0.980392,   0.529411,0.807843,0.980392, 0.529411,0.807843,0.980392, 0.529411,0.807843,0.980392,  // v7-v4-v3-v2 down
      0.529411,0.807843,0.980392,   0.529411,0.807843,0.980392, 0.529411,0.807843,0.980392, 0.529411,0.807843,0.980392,　 // v4-v7-v6-v5 back
    ]);
    }
  if (colour == 'white'){
    var colors = new Float32Array([    // Colors
      0.2117647,0.2117647,0.2117647,  0.2117647,0.2117647,0.2117647, 0.2117647,0.2117647,0.2117647, 0.2117647,0.2117647,0.2117647,  // v0-v1-v2-v3 front
      0.2117647,0.2117647,0.2117647,  0.2117647,0.2117647,0.2117647, 0.2117647,0.2117647,0.2117647, 0.2117647,0.2117647,0.2117647,   // v0-v3-v4-v5 right
      0.2117647,0.2117647,0.2117647,  0.2117647,0.2117647,0.2117647, 0.2117647,0.2117647,0.2117647, 0.2117647,0.2117647,0.2117647,   // v0-v5-v6-v1 up
      0.2117647,0.2117647,0.2117647,  0.2117647,0.2117647,0.2117647, 0.2117647,0.2117647,0.2117647, 0.2117647,0.2117647,0.2117647,   // v1-v6-v7-v2 left
      0.2117647,0.2117647,0.2117647,  0.2117647,0.2117647,0.2117647, 0.2117647,0.2117647,0.2117647, 0.2117647,0.2117647,0.2117647,   // v7-v4-v3-v2 down
      0.2117647,0.2117647,0.2117647,  0.2117647,0.2117647,0.2117647, 0.2117647,0.2117647,0.2117647, 0.2117647,0.2117647,0.2117647, 　 // v4-v7-v6-v5 back
    ]);
    }

  if (colour == 'lime'){
    var colors = new Float32Array([    // Colors
      0,1,0,  0,1,0, 0,1,0, 0,1,0,  // v0-v1-v2-v3 front
      0,1,0,  0,1,0, 0,1,0, 0,1,0,   // v0-v3-v4-v5 right
      0,1,0,  0,1,0, 0,1,0, 0,1,0,   // v0-v5-v6-v1 up
      0,1,0,  0,1,0, 0,1,0, 0,1,0,   // v1-v6-v7-v2 left
      0,1,0,  0,1,0, 0,1,0, 0,1,0,   // v7-v4-v3-v2 down
      0,1,0,  0,1,0, 0,1,0, 0,1,0, 　 // v4-v7-v6-v5 back
    ]);
    }

  if (colour == 'green'){
    var colors = new Float32Array([    // Colors
      0, 0.50196, 0,  0, 0.50196, 0,0, 0.50196, 0,  0, 0.50196, 0, // v0-v1-v2-v3 front
      0, 0.50196, 0,  0, 0.50196, 0,0, 0.50196, 0,  0, 0.50196, 0,  // v0-v3-v4-v5 right
      0, 0.50196, 0,  0, 0.50196, 0,0, 0.50196, 0,  0, 0.50196, 0,  // v0-v5-v6-v1 up
      0, 0.50196, 0,  0, 0.50196, 0,0, 0.50196, 0,  0, 0.50196, 0,  // v1-v6-v7-v2 left
      0, 0.50196, 0,  0, 0.50196, 0,0, 0.50196, 0,  0, 0.50196, 0,  // v7-v4-v3-v2 down
      0, 0.50196, 0,  0, 0.50196, 0,0, 0.50196, 0,  0, 0.50196, 0,　 // v4-v7-v6-v5 back
    ]);
    }

  if (colour == 'light_yellow'){
    var colors = new Float32Array([    // Colors
      1, 1, 0.8784313,  1, 1, 0.8784313,   1, 1, 0.8784313,  1, 1, 0.8784313, // v0-v1-v2-v3 front
      1, 1, 0.8784313,  1, 1, 0.8784313,   1, 1, 0.8784313,  1, 1, 0.8784313,  // v0-v3-v4-v5 right
      1, 1, 0.8784313,  1, 1, 0.8784313,   1, 1, 0.8784313,  1, 1, 0.8784313,  // v0-v5-v6-v1 up
      1, 1, 0.8784313,  1, 1, 0.8784313,   1, 1, 0.8784313,  1, 1, 0.8784313,  // v1-v6-v7-v2 left
      1, 1, 0.8784313,  1, 1, 0.8784313,   1, 1, 0.8784313,  1, 1, 0.8784313,  // v7-v4-v3-v2 down
      1, 1, 0.8784313,  1, 1, 0.8784313,   1, 1, 0.8784313,  1, 1, 0.8784313,　 // v4-v7-v6-v5 back
    ]);
    }

  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
0.0, 0.0,-1.0, 0.0, 0.0,-1.0, 0.0, 0.0,-1.0, 0.0, 0.0,-1.0 // v4-v7-v6-v5 back
  ]);

  var texCoords = new Float32Array([
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
    0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
    1.0, 0.0,    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v5-v6-v1 up
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
    0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,  // v7-v4-v3-v2 down
    0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
  ]);



  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
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


function cylinder(gl,colour) {

  var vertices = new Float32Array([ 
    0, 1, -1, 0, 1, 1, 0.19509, 0.980785, 1
    , 0.19509, 0.980785, -1, 0.19509, 0.980785, -1, 0.19509, 0.980785, 1
    , 0.382683, 0.92388, 1, 0.382683, 0.92388, -1, 0.382683, 0.92388, -1
    , 0.382683, 0.92388, 1, 0.55557, 0.83147, 1, 0.55557, 0.83147, -1
    , 0.55557, 0.83147, -1, 0.55557, 0.83147, 1, 0.707107, 0.707107, 1
    , 0.707107, 0.707107, -1, 0.707107, 0.707107, -1, 0.707107, 0.707107, 1
    , 0.83147, 0.55557, 1, 0.83147, 0.55557, -1, 0.83147, 0.55557, -1
    , 0.83147, 0.55557, 1, 0.92388, 0.382683, 1, 0.92388, 0.382683, -1
    , 0.92388, 0.382683, -1, 0.92388, 0.382683, 1, 0.980785, 0.19509, 1
    , 0.980785, 0.19509, -1, 0.980785, 0.19509, -1, 0.980785, 0.19509, 1
    , 1, 7.54979e-008, 1, 1, 7.54979e-008, -1, 1, 7.54979e-008, -1, 1, 
    7.54979e-008, 1, 0.980785, -0.19509, 1, 0.980785, -0.19509, -1, 0.980785, -0.19509, -1
    , 0.980785, -0.19509, 1, 0.92388, -0.382683, 1, 0.92388, -0.382683, -1, 0.92388, -0.382683, 
    -1, 0.92388, -0.382683, 1, 0.83147, -0.55557, 1, 0.83147, -0.55557, -1, 0.83147
    , -0.55557, -1, 0.83147, -0.55557, 1, 0.707107, -0.707107, 1, 0.707107, -0.707107,
    -1, 0.707107, -0.707107, -1, 0.707107, -0.707107, 1, 0.55557, -0.83147, 1, 0.55557
    , -0.83147, -1, 0.55557, -0.83147, -1, 0.55557, -0.83147, 1, 0.382683, -0.92388, 1, 0.382683,
    -0.92388, -1, 0.382683, -0.92388, -1, 0.382683, -0.92388, 1, 0.19509, -0.980785, 1, 0.19509, 
    -0.980785, -1, 0.19509, -0.980785, -1, 0.19509, -0.980785, 1, -3.25841e-007, -1, 1, -3.25841e-007
    , -1, -1, -3.25841e-007, -1, -1, -3.25841e-007, -1, 1, -0.195091, -0.980785, 1, -0.195091, -0.980785,
    -1, -0.195091, -0.980785, -1, -0.195091, -0.980785, 1, -0.382684, -0.923879, 1, -0.382684, -0.923879, 
    -1, -0.382684, -0.923879, -1, -0.382684, -0.923879, 1, -0.555571, -0.831469, 1, -0.555571, -0.831469,
    -1, -0.555571, -0.831469, -1    , -0.555571, -0.831469, 1, -0.707107, -0.707106, 1, -0.707107,
    -0.707106, -1, -0.707107, -0.707106, -1, -0.707107, -0.707106, 1, -0.83147, -0.55557, 1, -0.83147,
    -0.55557, -1, -0.83147, -0.55557, -1, -0.83147, -0.55557, 1, -0.92388, -0.382683, 1, -0.92388, -0.382683,
    -1, -0.92388, -0.382683, -1, -0.92388, -0.382683, 1, -0.980785, -0.195089, 1, -0.980785, -0.195089, -1
    , -0.980785, -0.195089, -1, -0.980785, -0.195089, 1, -1, 9.65599e-007, 1, -1, 9.65599e-007, -1, -1, 9.65599e-007,
    -1, -1, 9.65599e-007, 1, -0.980785, 0.195091, 1, -0.980785, 0.195091, -1, -0.980785, 0.195091, -1, -0.980785,
    0.195091, 1, -0.923879, 0.382684, 1, -0.923879, 0.382684, -1, -0.923879, 0.382684, -1, -0.923879, 0.382684, 1,
    -0.831469, 0.555571, 1, -0.831469, 0.555571, -1, -0.831469, 0.555571, -1, -0.831469, 0.555571, 1, -0.707106, 0.707108
    , 1, -0.707106, 0.707108, -1, -0.707106, 0.707108, -1, -0.707106, 0.707108, 1, -0.555569, 0.83147, 1, -0.555569, 0.83147,
    -1, -0.555569, 0.83147, -1, -0.555569, 0.83147, 1, -0.382682, 0.92388, 1, -0.382682, 0.92388, -1, 0.19509, 0.980785, 1, 
    0, 1, 1, -0.195089, 0.980786, 1, -0.382682, 0.92388, 1, -0.555569, 0.83147, 1, -0.707106, 0.707108, 1, -0.831469, 0.555571,
    1, -0.923879, 0.382684, 1, -0.980785, 0.195091, 1, -1, 9.65599e-007, 1, -0.980785, -0.195089, 1, -0.92388, -0.382683,
    1, -0.83147, -0.55557, 1, -0.707107, -0.707106, 1, -0.555571, -0.831469, 1, -0.382684, -0.923879, 1, -0.195091,
    -0.980785, 1, -3.25841e-007, -1, 1, 0.19509, -0.980785, 1, 0.382683, -0.92388, 1, 0.55557, -0.83147, 
    1, 0.707107, -0.707107, 1, 0.83147, -0.55557, 1, 0.92388, -0.382683, 1, 0.980785, -0.19509,1, 1, 
    7.54979e-008, 1, 0.980785, 0.19509, 1, 0.92388, 0.382683, 1, 0.83147, 0.55557, 1, 0.707107, 0.707107,
    1, 0.55557, 0.83147, 1, 0.382683, 0.92388, 1, -0.382682, 0.92388, -1, -0.382682, 0.92388, 1, -0.195089,
    0.980786, 1, -0.195089, 0.980786, -1, -0.195089, 0.980786, -1, -0.195089, 0.980786, 1, 0, 1, 1, 0, 1,
    -1, 0, 1, -1, 0.19509, 0.980785, -1, 0.382683, 0.92388, -1, 0.55557, 0.83147, -1, 0.707107, 0.707107,
    -1, 0.83147, 0.55557, -1, 0.92388, 0.382683, -1, 0.980785, 0.19509, -1, 1, 7.54979e-008, -1, 0.980785,
    -0.19509, -1, 0.92388, -0.382683, -1, 0.83147, -0.55557, -1, 0.707107, -0.707107, -1, 0.55557, -0.83147,
    -1, 0.382683, -0.92388, -1, 0.19509, -0.980785, -1, -3.25841e-007, -1, -1, -0.195091, -0.980785, -1,
    -0.382684, -0.923879, -1, -0.555571, -0.831469, -1, -0.707107, -0.707106, -1, -0.83147, -0.55557,
    -1, -0.92388, -0.382683, -1, -0.980785, -0.195089, -1, -1, 9.65599e-007, -1,
    -0.980785, 0.195091, -1, -0.923879, 0.382684, -1, -0.831469, 0.555571, -1, -0.707106, 
    0.707108, -1, -0.555569, 0.83147, -1, -0.382682, 0.92388, -1, -0.195089, 0.980786, -1
  ]);

  if (colour == 'black'){
  var colors = new Float32Array([    // Colors
    0,0,0,   0,0,0,   0,0,0,   0,0,0,    // v0-v1-v2-v3 front
    0,0,0,   0,0,0,   0,0,0,   0,0,0,    // v0-v3-v4-v5 right
    0,0,0,   0,0,0,   0,0,0,   0,0,0,    // v0-v5-v6-v1 up
    0,0,0,   0,0,0,   0,0,0,   0,0,0,    // v1-v6-v7-v2 left
    0,0,0,   0,0,0,   0,0,0,   0,0,0,    // v7-v4-v3-v2 down
    0,0,0,   0,0,0,   0,0,0,   0,0,0,　 // v4-v7-v6-v5 back
 ]);

}

if (colour == 'sienna'){
  var colors = new Float32Array([    // Colors
    0.627450,0.32156,0.17647,   0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647,   // v0-v1-v2-v3 front
      0.627450,0.32156,0.17647,   0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647,   // v0-v3-v4-v5 right
      0.627450,0.32156,0.17647,   0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647,   // v0-v5-v6-v1 up
      0.627450,0.32156,0.17647,   0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647,   // v1-v6-v7-v2 left
      0.627450,0.32156,0.17647,   0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647,   // v7-v4-v3-v2 down
      0.627450,0.32156,0.17647,   0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647, 0.627450,0.32156,0.17647,　 // v4-v7-v6-v5 back
 ]);

}


  var normals = new Float32Array([    // Normal
    0.0980173, 0.995185, 0, 0.0980173, 0.995185, 0, 0.0980173, 0.995185, 0, 0.0980173, 0.995185, 0, 0.290285, 0.95694, 0, 0.290285, 0.95694, 0, 0.290285, 0.95694, 0, 0.290285, 0.95694, 0, 0.471397, 0.881921, 0, 0.471397
    , 0.881921, 0, 0.471397, 0.881921, 0, 0.471397, 0.881921, 0, 0.634393, 0.77301, 0, 0.634393, 0.77301, 0, 0.634393, 0.77301
    , 0, 0.634393, 0.77301, 0, 0.77301, 0.634393, 0, 0.77301, 0.634393, 0, 0.77301, 0.634393, 0, 0.77301, 0.634393, 0, 0.881921, 0.471397, 0, 0.881921, 0.471397, 0, 0.881921
    , 0.471397, 0, 0.881921, 0.471397, 0, 0.95694, 0.290285, 0, 0.95694, 0.290285, 0, 0.95694, 0.290285, 0, 0.95694, 0.290285, 0, 0.995185, 0.0980173, 0, 0.995185, 0.0980173
    , 0, 0.995185, 0.0980173, 0, 0.995185, 0.0980173, 0, 0.995185, -0.098017, 0, 0.995185, -0.098017, 0, 0.995185, -0.098017, 0, 0.995185, -0.098017, 0, 0.95694, -0.290285, 0, 0.95694, -0.290285
    , 0, 0.95694, -0.290285, 0, 0.95694, -0.290285, 0, 0.881921, -0.471396, 0, 0.881921, -0.471396, 0, 0.881921, -0.471396, 0, 0.881921, -0.471396, 0, 0.77301, -0.634393, 0, 0.77301, -0.634393, 0, 0.77301, -0.634393, 0
    , 0.77301, -0.634393, 0, 0.634393, -0.77301, 0, 0.634393, -0.77301, 0, 0.634393, -0.77301, 0, 0.634393, -0.77301, 0, 0.471397, -0.881921, 0, 0.471397, -0.881921, 0, 0.471397, -0.881921, 0, 0.471397, -0.881921, 0, 0.290284, -0.95694, 0, 0.290284, -0.95694, 0, 0.290284, -0.95694
    , 0, 0.290284, -0.95694, 0, 0.0980169, -0.995185, 0, 0.0980169, -0.995185, 0, 0.0980169, -0.995185, 0, 0.0980169, -0.995185, 0, -0.0980176, -0.995185, 0, -0.0980176, -0.995185, 0, -0.0980176, -0.995185, 0, -0.0980176
    , -0.995185, 0, -0.290285, -0.95694, 0, -0.290285, -0.95694, 0, -0.290285, -0.95694, 0, -0.290285, -0.95694, 0, -0.471397, -0.881921, 0, -0.471397, -0.881921, 0, -0.471397, -0.881921, 0, -0.471397, -0.881921
    , 0, -0.634394, -0.77301, 0, -0.634394, -0.77301, 0, -0.634394, -0.77301, 0, -0.634394, -0.77301, 0, -0.773011, -0.634393, 0, -0.773011, -0.634393, 0, -0.773011, -0.634393, 0, -0.773011
    , -0.634393, 0, -0.881922, -0.471396, 0, -0.881922, -0.471396, 0, -0.881922, -0.471396, 0, -0.881922, -0.471396, 0, -0.956941, -0.290284, 0, -0.956941, -0.290284, 0, -0.956941, -0.290284, 0
    , -0.956941, -0.290284, 0, -0.995185, -0.0980163, 0, -0.995185, -0.0980163, 0, -0.995185, -0.0980163, 0, -0.995185, -0.0980163, 0, -0.995185, 0.0980182, 0, -0.995185, 0.0980182, 0, -0.995185
    , 0.0980182, 0, -0.995185, 0.0980182, 0, -0.95694, 0.290286, 0, -0.95694, 0.290286, 0, -0.95694, 0.290286, 0, -0.95694, 0.290286, 0, -0.881921, 0.471398, 0
    , -0.881921, 0.471398, 0, -0.881921, 0.471398, 0, -0.881921, 0.471398, 0, -0.77301, 0.634394, 0, -0.77301, 0.634394, 0, -0.77301, 0.634394, 0, -0.77301
    , 0.634394, 0, -0.634392, 0.773011, 0, -0.634392, 0.773011, 0, -0.634392, 0.773011, 0, -0.634392, 0.773011, 0, -0.471395, 0.881922, 0, -0.471395, 0.881922
    , 0, -0.471395, 0.881922, 0, -0.471395, 0.881922, 0, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0
    , 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008
    , 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1
    , -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0
    , 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -6.68332e-008, 0, 1, -0.290283, 0.956941, 0, -0.290283, 0.956941, 0, -0.290283
    , 0.956941, 0, -0.290283, 0.956941, 0, -0.0980165, 0.995185, 0, -0.0980165, 0.995185, 0, -0.0980165, 0.995185, 0, -0.0980165, 0.995185, 0, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008
    , 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008
    , 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1
    , 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1
    , 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1, 5.72856e-008, 0, -1
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23,     // back
    24,25,26,  24,26,27,
    28,29,30,  28, 30, 31,
    32,33,34,  32, 34, 35,
    36,37,38,  36, 38, 39,
    40,41,42,  40, 42, 43,
    44,45,46,  44, 46, 47,
    48,49,50,  48, 50, 51,
    52,53,54,  52, 54, 55,
    56,57,58,  56, 58, 59,
    60,61,62,  60, 62, 63,
    64,65,66,  64, 66, 67,
    68,69,70,  68, 70, 71,
    72,73,74,  72, 74, 75,
    76,77,78,  76, 78, 79,
    80,81,82,  80, 82, 83,
    84,85,86,  84, 86, 87,
    88,89,90,  88, 90, 91,
    92,93,94,  92, 94, 95,
    96,97,98,  96, 98, 99,
    100,101,102,  100, 102, 103,
    104,105,106,  104, 106, 107,
    108,109,110,  108, 110, 111,
    112,113,114,  112, 114, 115,
    116,117,118,  116, 118, 119,
    151,120,121,  151, 121, 122,
    151,122,123,  151, 123, 124,
    151,124,125,  151, 125, 126,
    151,126,127,  151, 127, 128,
    151,128,129,  151, 129, 130,
    151,130,131,  151, 131, 132,
    151,132,133,  151, 133, 134,
    151,134,135,  151, 135, 136,
    151,136,137,  151, 137, 138,
    151,138,139,  151, 139, 140,
    151,140,141,  151, 141, 142,
    151,142,143,  151, 143, 144,
    151,144,145,  151, 145, 146,
    151,146,147,  151, 147, 148,
    151,148,149,  149, 150, 151,
    152,153,154,  152, 154, 155,
    156,157,158,  156, 158, 159,
    191,160,161,  191, 161, 162,
    191,162,163,  191, 163, 164,
    191,164,165,  191, 165, 166,
    191,166,167,  191, 167, 168,
    191,168,169,  191, 169, 170,
    191,170,171,  191, 171, 172,
    191,172,173,  191, 173, 174,
    191,174,175,  191, 175, 176,
    191,176,177,  191, 177, 178,
    191,178,179,  191, 179, 180,
    191,180,181,  191, 181, 182,
    191,182,183,  191, 183, 184,
    191,184,185,  191, 185, 186,
    191,186,187,  191, 187, 188,
    191,188,189,  189, 190, 191
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

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
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    var vertices = new Float32Array([   // Coordinates
      0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
      0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
      0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
     -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
     -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
      0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
   ]);
  
  
   var colors = new Float32Array([    // Colors
     0, 1, 0,   0, 1, 0,   0, 1, 0,  0, 1, 0,     // v0-v1-v2-v3 front
     0, 1, 0,   0, 1, 0,   0, 1, 0,  0, 1, 0,     // v0-v3-v4-v5 right
     0, 1, 0,   0, 1, 0,   0, 1, 0,  0, 1, 0,     // v0-v5-v6-v1 up
     0, 1, 0,   0, 1, 0,   0, 1, 0,  0, 1, 0,     // v1-v6-v7-v2 left
     0, 1, 0,   0, 1, 0,   0, 1, 0,  0, 1, 0,     // v7-v4-v3-v2 down
     0, 1, 0,   0, 1, 0,   0, 1, 0,  0, 1, 0　    // v4-v7-v6-v5 back
  ]);
  
  var texCoords = new Float32Array([
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
    0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
    1.0, 0.0,    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v5-v6-v1 up
    1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
    0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,  // v7-v4-v3-v2 down
    0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
  ]);


   var normals = new Float32Array([    // Normal
     0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
     1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
     0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
     0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
     0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
   ]);
  
  
   // Indices of the vertices
   var indices = new Uint8Array([
      0, 1, 2,   0, 2, 3,    // front
      4, 5, 6,   4, 6, 7,    // right
      8, 9,10,   8,10,11,    // up
     12,13,14,  12,14,15,    // left
     16,17,18,  16,18,19,    // down
     20,21,22,  20,22,23     // back
  ]);
  
  
    // Indices of the vertices
  
  
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
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
    -0.5, -0.5, 0.0,
    0.5, -0.5, 0.0,
    0.0,  0.5, 0.0, 
  ]);


  var colors = new Float32Array([    // Colors
  0.5019,0.5019,0.5019,
  0.5019,0.5019,0.5019,
  0.5019,0.5019,0.5019,

  
]);

var texCoords = new Float32Array([
  1.0, 1.0,    0.0, 1.0,   0.0, 0.0,    // v0-v1-v2-v3 front
  0.0, 0.0,    1.0, 0.0,   1.0, 1.0,    // v7-v4-v3-v2 down
  0.0, 0.0,    1.0, 0.0,   1.0, 1.0,    // v4-v7-v6-v5 back
]);


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,    // v0-v1-v2-v3 front
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,    // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,    // v4-v7-v6-v5 back
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
  0, 1, 2,   


]);


  // Indices of the vertices


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

function initAxesVertexBuffers(gl) {

  var verticesColors = new Float32Array([
    // Vertex coordinates and color (for axes)
    -20.0,  0.0,   0.0,  1.0,  1.0,  1.0,  // (x,y,z), (r,g,b) 
      20.0,  0.0,   0.0,  1.0,  1.0,  1.0,
      0.0,  20.0,   0.0,  1.0,  1.0,  1.0, 
      0.0, -20.0,   0.0,  1.0,  1.0,  1.0,
      0.0,   0.0, -20.0,  1.0,  1.0,  1.0, 
      0.0,   0.0,  20.0,  1.0,  1.0,  1.0 
  ]);
  var n = 6;

  // Create a buffer object
  var vertexColorBuffer = gl.createBuffer();  
  if (!vertexColorBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  //Get the storage location of a_Position, assign and enable buffer
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

  // Get the storage location of a_Position, assign buffer and enable
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return n;
}

var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}

function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, u_UseTextures) {

  
    var GrassTexture = gl.createTexture()
  if(!GrassTexture)
  {
    console.log('Failed to create the texture object');
    return false;
  }

  var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
   if (!u_Sampler) {
     console.log('Failed to get the storage location of u_Sampler');
     return false;
   }

  GrassTexture.image = new Image();
  if(!GrassTexture.image)
  {
    console.log('Failed to create the image object');
    return false;
  }

  var GrassTexture1 = gl.createTexture()
  if(!GrassTexture1)
  {
    console.log('Failed to create the texture object');
    return false;
  }

  var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
   if (!u_Sampler) {
     console.log('Failed to get the storage location of u_Sampler');
     return false;
   }

  GrassTexture1.image = new Image();
  if(!GrassTexture1.image)
  {
    console.log('Failed to create the image object');
    return false;
  }

 
  
  GrassTexture.image.onload = function() {
    gl.uniform1i(u_UseTextures, false);
      // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  // Set the vertex coordinates and color (for the x, y axes)


  // Calculate the view matrix and the projection matrix
  modelMatrix.setTranslate(0, 0, 0);  // No Translation
  // Pass the model matrix to the uniform variable
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);



  gl.uniform1i(u_isLighting, true); // Will apply lighting

    // Rotate, and then translate
    //modelMatrix.setTranslate(0, 0, 0);  // Translation (No translation is supported here)
    modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
    modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
       // CREATE THE GROUND
       gl.uniform1i(u_UseTextures, true);
  var n = ground(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  //Ground
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, -2, 0);
    modelMatrix.scale(11.5, 0.05, 8); 
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, GrassTexture, u_Sampler, u_UseTextures)
    modelMatrix = popMatrix();

    gl.uniform1i(u_UseTextures, false);

     // CREATING ALL THE WALLS
  var n = cubes(gl,'grey');
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  /*Start of building 1 */

  
  var n = cubes(gl,'grey');
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  //Base of building 1 (big one)
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, -1.8 , -2);
  modelMatrix.scale(9.3, 0.4, 4); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
  //First step from top
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.07, -1.75, 0.2);
  modelMatrix.scale(1, 0.09, 0.5); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Second step from top
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.07, -1.84, 0.2);
  modelMatrix.scale(1, 0.09, 0.7); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Third step
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.07, -1.93, 0.2);
  modelMatrix.scale(1, 0.09, 0.9); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Left wall 
  pushMatrix(modelMatrix);
  modelMatrix.translate(-5.69, 0.9, -2.4);
  modelMatrix.scale(0.08, 5, 3.2); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Back wall
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.1, 0.9, -3.96);
  modelMatrix.scale(9.2, 5, 0.08); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Right wall
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.53, 0.9, -2.4);
  modelMatrix.scale(0.08, 5, 3.2); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Front wall 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-5.53, 0.9, -0.8);
  modelMatrix.scale(0.4, 5, 0.08); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Front wall 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.19, 0.9, -0.8);
  modelMatrix.scale(0.5, 5, 0.08); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Front wall 3
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.90, 0.9, -0.8);
  modelMatrix.scale(0.5, 5, 0.08); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Front wall 4
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.61, 0.9, -0.8);
  modelMatrix.scale(0.5, 5, 0.08); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Front wall 5
  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.32, 0.9, -0.8);
  modelMatrix.scale(0.5, 5, 0.08); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Front wall 6
  pushMatrix(modelMatrix);
  modelMatrix.translate(0.97, 0.9, -0.8);
  modelMatrix.scale(0.5, 5, 0.08); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Front wall 7
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.25, 0.9, -0.8);
  modelMatrix.scale(0.5, 5, 0.08); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Front wall 8
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.37, 0.9, -0.8);
  modelMatrix.scale(0.4, 5, 0.08); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

 //Roof Back part
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 4.18, -3.17);
  modelMatrix.rotate(90,0,0,1);
  modelMatrix.rotate(45,0,1,0);
  modelMatrix.scale(0.06, 9.3, 2.26); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Roof Front part
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 4.18, -1.57);
  modelMatrix.rotate(90,0,0,1);
  modelMatrix.rotate(45,0,-1,0);
  modelMatrix.scale(0.06, 9.3, 2.26); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Chimney left
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 4.18, -1.57);
  modelMatrix.scale(0.5, 1, 1); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();


  var n = triangle(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  //Cover Sides of roof
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.58 ,4.15 , -2.37);
  modelMatrix.rotate(90,0,1,0);  
  modelMatrix.scale(3.29, 1.74, 2.6); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-5.73 ,4.15 , -2.37);
  modelMatrix.rotate(180,0,1,0); 
  modelMatrix.rotate(90,0,1,0);  
  modelMatrix.scale(3.29, 1.74, 2.6); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cylinder(gl,'black');

  //cyl 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 4.85, -1.9);
  modelMatrix.scale(0.1, 0.3, 0.1); // Scale
  modelMatrix.rotate(90,1,0,0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix(); 

  //cyl 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 4.85, -1.65);
  modelMatrix.scale(0.1, 0.3, 0.1); // Scale
  modelMatrix.rotate(90,1,0,0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix(); 

  //cyl 3
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 4.85, -1.40);
  modelMatrix.scale(0.1, 0.3, 0.1); // Scale
  modelMatrix.rotate(90,1,0,0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix(); 

  //cyl 4
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 4.85, -1.17);
  modelMatrix.scale(0.1, 0.3, 0.1); // Scale
  modelMatrix.rotate(90,1,0,0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix(); 

  
var n = cubes(gl,'grey');

  //Chimney right
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.08, 4.18, -1.57);
  modelMatrix.scale(0.5, 1, 1); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cylinder(gl,'black');

  //cyl 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.08, 4.85, -1.9);
  modelMatrix.scale(0.1, 0.3, 0.1); // Scale
  modelMatrix.rotate(90,1,0,0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix(); 

  //cyl 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.08, 4.85, -1.65);
  modelMatrix.scale(0.1, 0.3, 0.1); // Scale
  modelMatrix.rotate(90,1,0,0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix(); 

  //cyl 3
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.08, 4.85, -1.40);
  modelMatrix.scale(0.1, 0.3, 0.1); // Scale
  modelMatrix.rotate(90,1,0,0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix(); 

  //cyl 4
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.08, 4.85, -1.17);
  modelMatrix.scale(0.1, 0.3, 0.1); // Scale
  modelMatrix.rotate(90,1,0,0);
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix(); 


  var n = cubes(gl,'grey');

  //Cover upper part of roof
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 4.97, -2.37);
  modelMatrix.rotate(90,0,0,1);
  modelMatrix.scale(0.06, 9.3, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Gap between windows 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 3.17, -0.79);
  modelMatrix.scale(9.03, 0.5, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Gap between windows 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 1.6, -0.79);
  modelMatrix.scale(9.03, 0.5, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Gap between windows 3
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.08, 0, -0.79);
  modelMatrix.scale(9.03, 0.5, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl,'blue');
  //window starting top right and move to the left
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.82, 2.34, -0.75);
  modelMatrix.scale(0.78, 1.2, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1.61, 2.34, -0.75);
  modelMatrix.scale(0.78, 1.2, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0.32, 2.34, -0.75);
  modelMatrix.scale(0.79, 1.2, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.97, 2.34, -0.75);
  modelMatrix.scale(0.79, 1.2, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.25, 2.34, -0.75);
  modelMatrix.scale(0.79, 1.2, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.54, 2.34, -0.75);
  modelMatrix.scale(0.79, 1.2, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.88, 2.34, -0.75);
  modelMatrix.scale(0.87, 1.2, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Second row

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.82, 0.8, -0.75);
  modelMatrix.scale(0.78, 1.2, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1.61, 0.8, -0.75);
  modelMatrix.scale(0.78, 1.2, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0.32, 0.8, -0.75);
  modelMatrix.scale(0.79, 1.2, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.97, 0.8, -0.75);
  modelMatrix.scale(0.79, 1.2, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.25, 0.8, -0.75);
  modelMatrix.scale(0.79, 1.2, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.54, 0.8, -0.75);
  modelMatrix.scale(0.79, 1.2, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.88, 0.8, -0.75);
  modelMatrix.scale(0.87, 1.2, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Third row

  pushMatrix(modelMatrix);
  modelMatrix.translate(2.82, -0.91, -0.75);
  modelMatrix.scale(0.78, 1.33, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(1.61, -0.91, -0.75);
  modelMatrix.scale(0.78, 1.33, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(0.32, -0.91, -0.75);
  modelMatrix.scale(0.79, 1.33, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.97, -0.91, -0.75);
  modelMatrix.scale(0.79, 1.33, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl,'door');

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.25, -0.91, -0.75);
  modelMatrix.scale(0.79, 1.33, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl,'white');

  //Left frame

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.68, -0.91, -0.70);
  modelMatrix.scale(0.1, 1.33, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.8, -0.91, -0.70);
  modelMatrix.scale(0.1, 1.33, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.24, -0.2, -0.70);
  modelMatrix.scale(1, 0.1, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl,'blue');

  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.54, -0.91, -0.75);
  modelMatrix.scale(0.79, 1.33, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.88, -0.91, -0.75);
  modelMatrix.scale(0.87, 1.33, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  var n = cubes(gl,'black');

  //pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-5.65, -1.3, -0.03);
  modelMatrix.scale(0.1, 0.7, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.65, -1.3, -0.03);
  modelMatrix.scale(0.1, 0.7, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-5.15, -1.37, -0.03);
  modelMatrix.rotate(90,0,0,1);
  modelMatrix.scale(0.05, 0.87, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-5.15, -1.17, -0.03);
  modelMatrix.rotate(90,0,0,1);
  modelMatrix.scale(0.05, 0.87, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  
  //pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.65, -1.3, -0.03);
  modelMatrix.scale(0.1, 0.7, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.15, -1.37, -0.03);
  modelMatrix.rotate(90,0,0,1);
  modelMatrix.scale(0.05, 0.87, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-4.15, -1.17, -0.03);
  modelMatrix.rotate(90,0,0,1);
  modelMatrix.scale(0.05, 0.87, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-2.65, -1.3, -0.03);
  modelMatrix.scale(0.1, 0.7, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.15, -1.37, -0.03);
  modelMatrix.rotate(90,0,0,1);
  modelMatrix.scale(0.05, 0.87, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-3.15, -1.17, -0.03);
  modelMatrix.rotate(90,0,0,1);
  modelMatrix.scale(0.05, 0.87, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();


  /////////////////////////////////////////

  //pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.5, -1.3, -0.03);
  modelMatrix.scale(0.1, 0.7, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-0.5, -1.3, -0.03);
  modelMatrix.scale(0.1, 0.7, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1, -1.37, -0.03);
  modelMatrix.rotate(90,0,0,1);
  modelMatrix.scale(0.05, 0.89, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1, -1.17, -0.03);
  modelMatrix.rotate(90,0,0,1);
  modelMatrix.scale(0.05, 0.89, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  
  //pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(0.5, -1.3, -0.03);
  modelMatrix.scale(0.1, 0.7, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(0, -1.37, -0.03);
  modelMatrix.rotate(90,0,0,1);
  modelMatrix.scale(0.05, 0.89, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(0, -1.17, -0.03);
  modelMatrix.rotate(90,0,0,1);
  modelMatrix.scale(0.05, 0.89, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(1.5, -1.3, -0.03);
  modelMatrix.scale(0.1, 0.7, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(1, -1.37, -0.03);
  modelMatrix.rotate(90,0,0,1);
  modelMatrix.scale(0.05, 0.89, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(1, -1.17, -0.03);
  modelMatrix.rotate(90,0,0,1);
  modelMatrix.scale(0.05, 0.89, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

   //pole 2
   pushMatrix(modelMatrix);
   modelMatrix.translate(2.5, -1.3, -0.03);
   modelMatrix.scale(0.1, 0.7, 0.05); // Scale
   drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
   modelMatrix = popMatrix();
 
   //horizontal pole 1
   pushMatrix(modelMatrix);
   modelMatrix.translate(2, -1.37, -0.03);
   modelMatrix.rotate(90,0,0,1);
   modelMatrix.scale(0.05, 0.89, 0.05); // Scale
   drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
   modelMatrix = popMatrix();
 
   //horizontal pole 2
   pushMatrix(modelMatrix);
   modelMatrix.translate(2, -1.17, -0.03);
   modelMatrix.rotate(90,0,0,1);
   modelMatrix.scale(0.05, 0.89, 0.05); // Scale
   drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
   modelMatrix = popMatrix();

    //pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.5, -1.3, -0.03);
  modelMatrix.scale(0.1, 0.7, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(3, -1.37, -0.03);
  modelMatrix.rotate(90,0,0,1);
  modelMatrix.scale(0.05, 0.89, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //horizontal pole 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(3, -1.17, -0.03);
  modelMatrix.rotate(90,0,0,1);
  modelMatrix.scale(0.05, 0.89, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

    //pole 2
    pushMatrix(modelMatrix);
    modelMatrix.translate(-1.59, -1.6, 0.7);
    modelMatrix.scale(0.1, 0.7, 0.05); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    //pole 2
    pushMatrix(modelMatrix);
    modelMatrix.translate(-2.59, -1.6, 0.7);
    modelMatrix.scale(0.1, 0.7, 0.05); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();

    //diagonal pole 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(-1.54, -1.38, 0.36);
  modelMatrix.rotate(90,0,1,0);
  modelMatrix.rotate(120,0,0,1);
  modelMatrix.scale(0.05, 0.81, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

    //diagonal pole 2
    pushMatrix(modelMatrix);
    modelMatrix.translate(-2.6, -1.38, 0.36);
    modelMatrix.rotate(90,0,1,0);
    modelMatrix.rotate(120,0,0,1);
    modelMatrix.scale(0.05, 0.81, 0.05); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
    modelMatrix = popMatrix();


  

        
    /*Start of building 2 */



    var n = cubes(gl,'grey');
  //Base of building 2 (small one)
  pushMatrix(modelMatrix);
  modelMatrix.translate(4.65, -1.93 , -0.98);
  modelMatrix.scale(2.1, 0.1, 6); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Left horizontal wall of building 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.7, -0.35 , -0.98);
  modelMatrix.scale(0.08, 0.9, 6); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Left vertical wall 1 of building 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.7, -0.9 , 0.7);
  modelMatrix.scale(0.08, 2, 0.5); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Left vertical wall 2 of building 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.7, -0.9 , 1.9);
  modelMatrix.scale(0.08, 2, 0.2); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Left vertical wall 3 of building 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.7, -0.9 , -2.27);
  modelMatrix.scale(0.08, 2, 3.45); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Right wall of building 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(5.66, -0.9 , -0.98);
  modelMatrix.scale(0.08, 2, 6); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //Back wall of building 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(4.65, -0.9 , -3.95);
  modelMatrix.scale(2, 2, 0.08); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

   //Front wall of building 2
   pushMatrix(modelMatrix);
   modelMatrix.translate(4.65, -0.9 , 1.98);
   modelMatrix.scale(2, 2, 0.08); // Scale
   drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
   modelMatrix = popMatrix();

  //Roof left part
  pushMatrix(modelMatrix);
  modelMatrix.translate(4.20, 0.69 , -0.98);
  modelMatrix.rotate(140,0,0,1);
  modelMatrix.scale(0.08, 1.55, 6); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();  

  //Windows on roof
  pushMatrix(modelMatrix);
  modelMatrix.translate(4.20, 0.69 , 0.5);
  modelMatrix.scale(0.8, 1, 2); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();  

  var n = cubes(gl,'blue');

  //Windows on roof
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.95, 0.75, 1.25);
  modelMatrix.rotate(-90,0,1,0);
  modelMatrix.scale(0.4, 0.7, 0.4); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(3.95, 0.75, 0.75);
  modelMatrix.rotate(-90,0,1,0);
  modelMatrix.scale(0.4, 0.7, 0.4); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(3.95, 0.75, 0.25);
  modelMatrix.rotate(-90,0,1,0);
  modelMatrix.scale(0.4, 0.7, 0.4); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(3.95, 0.75, -0.25);
  modelMatrix.rotate(-90,0,1,0);
  modelMatrix.scale(0.4, 0.7, 0.4); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();



  var n = cubes(gl,'grey');
  //Roof right part
  pushMatrix(modelMatrix);
  modelMatrix.translate(5.16, 0.69 , -0.98);
  modelMatrix.rotate(-140,0,0,1);
  modelMatrix.scale(0.08, 1.55, 6); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix(); 

  var n = triangle(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  pushMatrix(modelMatrix);
  modelMatrix.translate(4.68 ,0.62 , 2.03);
  modelMatrix.scale(2.06, 1.3, 1.9); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  pushMatrix(modelMatrix);
  modelMatrix.translate(4.68 ,0.62 , -3.98);
  modelMatrix.rotate(180,0,1,0);  
  modelMatrix.scale(2.06, 1.3, 1.9); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  
  var n = cubes(gl,'blue');
  
  //window 1
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.64, -1.34, 1.35);
  modelMatrix.scale(0.05, 1.2, 0.8); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //window 2
  pushMatrix(modelMatrix);
  modelMatrix.translate(3.64, -1.34, -0.08);
  
  modelMatrix.scale(0.05, 1.2, 0.9); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //window 3
  pushMatrix(modelMatrix);
  modelMatrix.translate(4.7, -1.37, 2);
  modelMatrix.scale(0.79, 1.2, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();


  var n = cubes(gl,'grey');

 //Sign
 pushMatrix(modelMatrix);
 modelMatrix.translate(-4, -1.5 , 1.5);
 modelMatrix.scale(1, 1, 0.5); // Scale
 drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
 modelMatrix = popMatrix(); 

 var n = cylinder(gl,'black');
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  //pole 1
  pushMatrix(modelMatrix);
 modelMatrix.translate(-2.8, -1.5 , 2.2); 
 modelMatrix.scale(0.1, 0.5, 0.1); // Scale
 modelMatrix.rotate(90,1,0,0);
 drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
 modelMatrix = popMatrix(); 

 //pole 2
 pushMatrix(modelMatrix);
 modelMatrix.translate(-2.8, -1.5 , 3); 
 modelMatrix.scale(0.1, 0.5, 0.1); // Scale
 modelMatrix.rotate(90,1,0,0);
 drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
 modelMatrix = popMatrix(); 

 //pole 3
 pushMatrix(modelMatrix);
 modelMatrix.translate(-2.8, -1.5 , 3.8); 
 modelMatrix.scale(0.1, 0.5, 0.1); // Scale
 modelMatrix.rotate(90,1,0,0);
 drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
 modelMatrix = popMatrix(); 

 var n = cubes(gl,'sienna');

 //tree trunk
 pushMatrix(modelMatrix);
 modelMatrix.translate(2.5, -1.6 , 1.2); 
 modelMatrix.scale(0.08, 0.8, 0.1); // Scale
 modelMatrix.rotate(90,1,0,0);
 drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
 modelMatrix = popMatrix(); 

 var n = cubes(gl,'peru');
 if (n < 0) {
   console.log('Failed to set the vertex information');
   return;
 }

 //tree leaf 1
 pushMatrix(modelMatrix);
 modelMatrix.translate(2.2, -1.2, 1.2);
 modelMatrix.rotate(45,0,0,1);
 modelMatrix.scale(0.04, 0.7, 0.05); // Scale
 drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
 modelMatrix = popMatrix();

 //tree leaf 2
 pushMatrix(modelMatrix);
 modelMatrix.translate(2.8, -1.2, 1.2);
 modelMatrix.rotate(180,0,1,0);
 modelMatrix.rotate(45,0,0,1);
 modelMatrix.scale(0.04, 0.7, 0.05); // Scale
 drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
 modelMatrix = popMatrix();

  //tree leaf 3
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.5, -1.2, 0.86);
  modelMatrix.rotate(275,0,1,0);
  modelMatrix.rotate(45,0,0,1);
  modelMatrix.scale(0.04, 0.7, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //tree leaf 4
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.5, -1.2, 1.6);
  modelMatrix.rotate(90,0,1,0);
  modelMatrix.rotate(45,0,0,1);
  modelMatrix.scale(0.04, 0.7, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //tree leaf 5
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.65, -1.2, 1.55);
  modelMatrix.rotate(120,0,1,0);
  modelMatrix.rotate(45,0,0,1);
  modelMatrix.scale(0.04, 0.7, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //tree leaf 6
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.35, -1.2, 1.10);  
  modelMatrix.rotate(200,0,1,0);
  modelMatrix.rotate(120,0,1,0);
  modelMatrix.rotate(45,0,0,1);
  modelMatrix.scale(0.04, 0.7, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //tree leaf 7
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.63, -1.2, 1);  
  modelMatrix.rotate(120,0,1,0);
  modelMatrix.rotate(120,0,1,0);
  modelMatrix.rotate(45,0,0,1);
  modelMatrix.scale(0.04, 0.7, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  //tree leaf 8
  pushMatrix(modelMatrix);
  modelMatrix.translate(2.33, -1.2, 1.5);  
  modelMatrix.rotate(180,0,1,0);
  modelMatrix.rotate(120,0,1,0);
  modelMatrix.rotate(120,0,1,0);
  modelMatrix.rotate(45,0,0,1);
  modelMatrix.scale(0.04, 0.7, 0.05); // Scale
  drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

var n = cubes(gl,'lime');

pushMatrix(modelMatrix);
modelMatrix.translate(-4.6, -1.93, 0.45);  
modelMatrix.scale(1.5, 0.05, 0.8); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

var n = cubes(gl,'green');

pushMatrix(modelMatrix);
modelMatrix.translate(-4.6, -1.75, 0.45);  
modelMatrix.scale(1.5, 0.3, 0.8); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

var n = cubes(gl,'light_yellow');

//flower
pushMatrix(modelMatrix);
modelMatrix.translate(-5.2, -1.4, 0.5);
modelMatrix.rotate(45,0,0,1);
modelMatrix.scale(0.06, 0.7, 0.06); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//flower
pushMatrix(modelMatrix);
modelMatrix.translate(-5.2, -1.4, 0.2);
modelMatrix.rotate(45,0,0,1);
modelMatrix.scale(0.06, 0.7, 0.06); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//flower
pushMatrix(modelMatrix);
modelMatrix.translate(-4.9, -1.4, 0.2);
modelMatrix.rotate(45,0,0,1);
modelMatrix.scale(0.06, 0.7, 0.06); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//flower
pushMatrix(modelMatrix);
modelMatrix.translate(-4.5, -1.4, 0.2);
modelMatrix.rotate(45,0,0,1);
modelMatrix.scale(0.06, 0.7, 0.06); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();








var n = cubes(gl,'lime');

pushMatrix(modelMatrix);
modelMatrix.translate(-3.2, -1.93, 0.45);  
modelMatrix.scale(1, 0.05, 0.8); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

var n = cubes(gl,'green');

pushMatrix(modelMatrix);
modelMatrix.translate(-3.2, -1.75, 0.45);  
modelMatrix.scale(1, 0.3, 0.8); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

var n = cubes(gl,'light_yellow');

//flower
pushMatrix(modelMatrix);
modelMatrix.translate(-3.7, -1.4, 0.5);
modelMatrix.rotate(45,0,0,1);
modelMatrix.scale(0.06, 0.7, 0.06); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//flower
pushMatrix(modelMatrix);
modelMatrix.translate(-3.1, -1.4, 0.2);
modelMatrix.rotate(45,0,0,1);
modelMatrix.scale(0.06, 0.7, 0.06); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//flower
pushMatrix(modelMatrix);
modelMatrix.translate(-3.25, -1.4, 0.35);
modelMatrix.rotate(45,0,0,1);
modelMatrix.scale(0.06, 0.7, 0.06); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();

//flower
pushMatrix(modelMatrix);
modelMatrix.translate(-3.3, -1.4, 0.2);
modelMatrix.rotate(45,0,0,1);
modelMatrix.scale(0.06, 0.7, 0.06); // Scale
drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
modelMatrix = popMatrix();



  }

  GrassTexture.image.src = 'textures/pavement.jpg';
  GrassTexture1.image.src = 'textures/pavement.jpg';



 

 

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

function loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, texture, u_Sampler, u_UseTextures) {
  pushMatrix(modelMatrix);
    // Pass the model matrix to the uniform variable
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

    gl.activeTexture(gl.TEXTURE0);

    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Assign u_Sampler to TEXTURE0
    gl.uniform1i(u_Sampler, 0);

    // Enable texture mapping
    gl.uniform1i(u_UseTextures, true);

    // Draw the textured cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);


  modelMatrix = popMatrix();
}


