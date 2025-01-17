"use strict";

var canvas;
var gl;

var theta = 0.0;
var thetaLoc;
var speed = 0.05;
var direction = 1;
var colors = [
    vec4(Math.random(), Math.random(), Math.random(), 1.0),
    vec4(Math.random(), Math.random(), Math.random(), 1.0),
    vec4(Math.random(), Math.random(), Math.random(), 1.0),
    vec4(Math.random(), Math.random(), Math.random(), 1.0)
];

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext("webgl2");
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vertices = [
        vec2(0, 1),
        vec2(-1, 0),
        vec2(1, 0),
        vec2(0, -1)
    ];

    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var colorBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    thetaLoc = gl.getUniformLocation(program, "theta");

    document.getElementById("toggle_button").onclick = toggle;
    document.getElementById("speed_up_button").onclick = function() { adjustSpeed(0.02); };
    document.getElementById("slow_down_button").onclick = function() { adjustSpeed(-0.02); };
    document.getElementById("color_button").onclick = change_color;

    render();

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT);

        theta += speed * direction;
        gl.uniform1f(thetaLoc, theta);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(render);
    }
};

function toggle() {
    if (direction === 1) {
        direction = -1;
    } else {
        direction = 1;
    }
}

function adjustSpeed(adding) {
    speed = Math.max(0.02, speed + adding);
}

function change_color() {
    colors = [
        vec4(Math.random(), Math.random(), Math.random(), 1.0),
        vec4(Math.random(), Math.random(), Math.random(), 1.0),
        vec4(Math.random(), Math.random(), Math.random(), 1.0),
        vec4(Math.random(), Math.random(), Math.random(), 1.0)
    ];

    var colorBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
}
