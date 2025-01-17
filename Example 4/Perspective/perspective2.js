var canvas;
var gl;

var pointsArray = [];
var colorsArray = [];

var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(0.0, 0.5, 0.0, 1.0),
];

var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // cyan
    vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
];


var near = 0.3;
var far = 3.0;
var radius = 4.0;
var theta = 0.0;
var phi = 0.0;

var fovy = 45.0; // Field-of-view in Y direction angle (in degrees)
var aspect = 1.0; // Viewport aspect ratio

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

// Function to define the pyramid's faces and assign colors
function colorCube() {
    quad(0, 1, 2, 3, vec4(1.0, 0.0, 1.0, 1.0)); // Magenta

    triangle(0, 1, 4, vec4(1.0, 0.0, 0.0, 1.0)); // Red
    triangle(1, 2, 4, vec4(0.0, 1.0, 0.0, 1.0)); // Green
    triangle(2, 3, 4, vec4(0.0, 0.0, 1.0, 1.0)); // Blue
    triangle(3, 0, 4, vec4(1.0, 1.0, 0.0, 1.0)); // Yellow
}

function triangle(a, b, c, color) {
    pointsArray.push(vertices[a]);
    colorsArray.push(color);
    pointsArray.push(vertices[b]);
    colorsArray.push(color);
    pointsArray.push(vertices[c]);
    colorsArray.push(color);
}

function quad(a, b, c, d, color) {
    pointsArray.push(vertices[a]);
    colorsArray.push(color);
    pointsArray.push(vertices[b]);
    colorsArray.push(color);
    pointsArray.push(vertices[c]);
    colorsArray.push(color);
    pointsArray.push(vertices[a]);
    colorsArray.push(color);
    pointsArray.push(vertices[c]);
    colorsArray.push(color);
    pointsArray.push(vertices[d]);
    colorsArray.push(color);
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);

    aspect = canvas.width / canvas.height;

    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    // Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    colorCube();

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    // Sliders for viewing parameters
    document.getElementById("zFarSlider").onchange = function (event) {
        far = event.target.value;
    };
    document.getElementById("zNearSlider").onchange = function (event) {
        near = event.target.value;
    };
    document.getElementById("radiusSlider").onchange = function (event) {
        radius = event.target.value;
    };
    document.getElementById("thetaSlider").onchange = function (event) {
        theta = event.target.value * Math.PI / 180.0;
    };
    document.getElementById("phiSlider").onchange = function (event) {
        phi = event.target.value * Math.PI / 180.0;
    };
    document.getElementById("aspectSlider").onchange = function (event) {
        aspect = event.target.value;
    };
    document.getElementById("fovSlider").onchange = function (event) {
        fovy = event.target.value;
    };

    document.body.requestPointerLock =
        document.body.requestPointerLock || document.body.mozRequestPointerLock;

    document.addEventListener("mousemove", function (event) {
        if (document.pointerLockElement === canvas) {
            theta += event.movementY * 0.005; // Adjust sensitivity
            phi += event.movementX * 0.005;
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "p") {
            if (document.pointerLockElement === canvas) {
                document.exitPointerLock();
            } else {
                canvas.requestPointerLock();
            }
        }
    });

    render();
};

var render = function () {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(theta)
    );
    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
    requestAnimFrame(render);
};
