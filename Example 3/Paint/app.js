const canvas = document.getElementById("webglCanvas");
const gl = canvas.getContext("webgl");

if (!gl) {
    console.error("WebGL not supported!");
}

gl.clearColor(1.0, 1.0, 1.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

// Drawing state
let isDrawing = false;
let drawModeActive = false;
let points = [];
let currentColor = [0.0, 0.0, 0.0, 1.0];
let offset = [0.0, 0.0]; // x and y
let rotationAngle = 0.0;
let scale = 1.0;
let isFilled = false;

const vertexShaderSource = `
attribute vec2 a_position;
uniform vec2 u_offset;
uniform float u_rotation;
uniform float u_scale;
void main() {
    // Rotation matrix
    float cosTheta = cos(u_rotation);
    float sinTheta = sin(u_rotation);
    mat2 rotationMatrix = mat2(
        cosTheta, -sinTheta,
        sinTheta, cosTheta
    );

    // Scale and rotate
    vec2 scaledPosition = a_position * u_scale;
    vec2 rotatedPosition = rotationMatrix * scaledPosition;

    // Apply translation
    gl_Position = vec4(rotatedPosition + u_offset, 0.0, 1.0);
}`;

const fragmentShaderSource = `
precision mediump float;
uniform vec4 u_color;
void main() {
    gl_FragColor = u_color;
}`;

function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
}

const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
const colorUniformLocation = gl.getUniformLocation(program, "u_color");
const offsetUniformLocation = gl.getUniformLocation(program, "u_offset");
const rotationUniformLocation = gl.getUniformLocation(program, "u_rotation");
const scaleUniformLocation = gl.getUniformLocation(program, "u_scale");

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

gl.useProgram(program);
gl.uniform4f(colorUniformLocation, ...currentColor);
gl.uniform2f(offsetUniformLocation, ...offset);
gl.uniform1f(rotationUniformLocation, rotationAngle);
gl.uniform1f(scaleUniformLocation, scale);

function addPoint(e) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / canvas.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / canvas.height) * 2 - 1);

    points.push(x, y);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    redrawScene();
}

function redrawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (isFilled) {
        gl.uniform4f(colorUniformLocation, ...currentColor);
        gl.uniform2f(offsetUniformLocation, ...offset);
        gl.uniform1f(rotationUniformLocation, rotationAngle);
        gl.uniform1f(scaleUniformLocation, scale);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, points.length / 2);
    }

    // Render dis cizgi
    gl.uniform4f(colorUniformLocation, ...currentColor);
    gl.uniform2f(offsetUniformLocation, ...offset);
    gl.uniform1f(rotationUniformLocation, rotationAngle);
    gl.uniform1f(scaleUniformLocation, scale);
    gl.drawArrays(gl.LINE_STRIP, 0, points.length / 2);
}

document.getElementById("drawButton").addEventListener("click", () => {
    drawModeActive = !drawModeActive;
    if (!drawModeActive) {
        isDrawing = false;
    }
});

canvas.addEventListener("mousedown", (e) => {
    if (!drawModeActive) return;
    isDrawing = true;
    addPoint(e);
});

canvas.addEventListener("mouseup", () => isDrawing = false);
canvas.addEventListener("mousemove", (e) => {
    if (!isDrawing || !drawModeActive) return;
    addPoint(e);
});

document.getElementById("colorPicker").addEventListener("input", (e) => {
    const hexColor = e.target.value;
    currentColor = [
        parseInt(hexColor.slice(1, 3), 16) / 255,
        parseInt(hexColor.slice(3, 5), 16) / 255,
        parseInt(hexColor.slice(5, 7), 16) / 255,
        1.0,
    ];
    redrawScene();
});

document.getElementById("moveUpButton").addEventListener("click", () => {
    offset[1] += 0.1;
    redrawScene();
});

document.getElementById("moveDownButton").addEventListener("click", () => {
    offset[1] -= 0.1;
    redrawScene();
});

document.getElementById("moveLeftButton").addEventListener("click", () => {
    offset[0] -= 0.1;
    redrawScene();
});

document.getElementById("moveRightButton").addEventListener("click", () => {
    offset[0] += 0.1;
    redrawScene();
});

document.getElementById("rotateClockwiseButton").addEventListener("click", () => {
    rotationAngle -= Math.PI / 18; // 10 derece
    redrawScene();
});

document.getElementById("rotateCounterClockwiseButton").addEventListener("click", () => {
    rotationAngle += Math.PI / 18; // 10 derece
    redrawScene();
});

document.getElementById("scaleSlider").addEventListener("input", (e) => {
    scale = parseFloat(e.target.value);
    redrawScene();
});

document.getElementById("fillButton").addEventListener("click", () => {
    if (points.length < 3) {
        alert("You need at least 3 points to fill the shape!");
        return;
    }
    isFilled = true;
    redrawScene();
});

document.getElementById("clearButton").addEventListener("click", () => {
    points = [];
    isFilled = false;
    offset = [0.0, 0.0];
    rotationAngle = 0.0;
    scale = 1.0;

    gl.clear(gl.COLOR_BUFFER_BIT);
});