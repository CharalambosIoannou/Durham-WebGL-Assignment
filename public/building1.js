var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +        // Normal
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightDirection;\n' + // Light direction (in the world coordinate, normalized)
  'varying vec4 v_Color;\n' +
  'uniform bool u_isLighting;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
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
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

  var modelMatrix = new Matrix4(); // The model matrix
var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

var ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
var g_xAngle = 0.0;    // The rotation x angle (degrees)
var g_yAngle = 0.0;    // The rotation y angle (degrees)

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
  viewMatrix.setLookAt(0, 0, 15, 0, 0, -100, 0, 1, 0);
  projMatrix.setPerspective(45, canvas.width/canvas.height, 1, 100);
  // Pass the model, view, and projection matrix to the uniform variable respectively
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);


  document.onkeydown = function(ev){
    keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
  };

  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
}

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {
  switch (ev.keyCode) {
    case 40: // Up arrow key -> the positive rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle + ANGLE_STEP) % 360;
      break;
    case 38: // Down arrow key -> the negative rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle - ANGLE_STEP) % 360;
      break;
    case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
      break;
    case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle - ANGLE_STEP) % 360;
      break;
    default: return; // Skip drawing at no effective action
  }

  // Draw the scene
  draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
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
  
  
      if (colour == 'bird'){
        var colors = new Float32Array([    // Colors
          0.466667, 0.533333, 0.6,  0.466667, 0.533333, 0.6,   0.466667, 0.533333, 0.6,  0.466667, 0.533333, 0.6, // v0-v1-v2-v3 front
          0.466667, 0.533333, 0.6,  0.466667, 0.533333, 0.6,   0.466667, 0.533333, 0.6,  0.466667, 0.533333, 0.6,  // v0-v3-v4-v5 right
          0.466667, 0.533333, 0.6,  0.466667, 0.533333, 0.6,   0.466667, 0.533333, 0.6,  0.466667, 0.533333, 0.6,  // v0-v5-v6-v1 up
          0.466667, 0.533333, 0.6,  0.466667, 0.533333, 0.6,   0.466667, 0.533333, 0.6,  0.466667, 0.533333, 0.6,  // v1-v6-v7-v2 left
          0.466667, 0.533333, 0.6,  0.466667, 0.533333, 0.6,   0.466667, 0.533333, 0.6,  0.466667, 0.533333, 0.6,  // v7-v4-v3-v2 down
          0.466667, 0.533333, 0.6,  0.466667, 0.533333, 0.6,   0.466667, 0.533333, 0.6,  0.466667, 0.533333, 0.6,　 // v4-v7-v6-v5 back
        ]);
        }
  
      if (colour == 'saddle_brown'){
        var colors = new Float32Array([    // Colors
          0.545098, 0.270588, 0.074509,  0.545098, 0.270588, 0.074509,   0.545098, 0.270588, 0.074509,  0.545098, 0.270588, 0.074509, // v0-v1-v2-v3 front
          0.545098, 0.270588, 0.074509,  0.545098, 0.270588, 0.074509,   0.545098, 0.270588, 0.074509,  0.545098, 0.270588, 0.074509,  // v0-v3-v4-v5 right
          0.545098, 0.270588, 0.074509,  0.545098, 0.270588, 0.074509,   0.545098, 0.270588, 0.074509,  0.545098, 0.270588, 0.074509,  // v0-v5-v6-v1 up
          0.545098, 0.270588, 0.074509,  0.545098, 0.270588, 0.074509,   0.545098, 0.270588, 0.074509,  0.545098, 0.270588, 0.074509,  // v1-v6-v7-v2 left
          0.545098, 0.270588, 0.074509,  0.545098, 0.270588, 0.074509,   0.545098, 0.270588, 0.074509,  0.545098, 0.270588, 0.074509,  // v7-v4-v3-v2 down
          0.545098, 0.270588, 0.074509,  0.545098, 0.270588, 0.074509,   0.545098, 0.270588, 0.074509,  0.545098, 0.270588, 0.074509,　 // v4-v7-v6-v5 back
        ]);
        }
  
    if (colour == 'gold'){
      var colors = new Float32Array([    // Colors
        1, 0.745098, 0,  1, 0.745098, 0,   1, 0.745098, 0,  1, 0.745098, 0, // v0-v1-v2-v3 front
        1, 0.745098, 0,  1, 0.745098, 0,   1, 0.745098, 0,  1, 0.745098, 0,  // v0-v3-v4-v5 right
        1, 0.745098, 0,  1, 0.745098, 0,   1, 0.745098, 0,  1, 0.745098, 0,  // v0-v5-v6-v1 up
        1, 0.745098, 0,  1, 0.745098, 0,   1, 0.745098, 0,  1, 0.745098, 0,  // v1-v6-v7-v2 left
        1, 0.745098, 0,  1, 0.745098, 0,   1, 0.745098, 0,  1, 0.745098, 0,  // v7-v4-v3-v2 down
        1, 0.745098, 0,  1, 0.745098, 0,   1, 0.745098, 0,  1, 0.745098, 0,　 // v4-v7-v6-v5 back
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

function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform1i(u_isLighting, false); // Will not apply lighting

  // Set the vertex coordinates and color (for the x, y axes)

  var n = initAxesVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Calculate the view matrix and the projection matrix
  modelMatrix.setTranslate(0, 0, 0);  // No Translation
  // Pass the model matrix to the uniform variable
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Draw x and y axes
  gl.drawArrays(gl.LINES, 0, n);

  gl.uniform1i(u_isLighting, true); // Will apply lighting
  modelMatrix.setTranslate(0, 0, 0);  // Translation (No translation is supported here)
  modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis
  // Set the vertex coordinates and color (for the cube)

  var n = cubes(gl,'grey');
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

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
 modelMatrix.rotate(0,0,1,0);
 modelMatrix.scale(0.79, 1.33, 0.05); // Scale
 drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
 modelMatrix = popMatrix();

 var n = cubes(gl,'door');

 pushMatrix(modelMatrix);
 
 modelMatrix.translate(-2.25, -0.91, -0.75);
 modelMatrix.rotate(0,0,1,0);
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
