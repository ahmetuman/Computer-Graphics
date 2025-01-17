function initializeWebGL() {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) {
        console.error("Canvas element with id 'webgl-canvas' not found!");
        return null;
    }

    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.error('WebGL not supported!');
        return null;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);

    return gl;
}

async function loadOBJ(url) {
    const response = await fetch(url);
    const text = await response.text();
    return parseOBJ(text);
}

function parseOBJ(objText) {
    const positions = [];
    const normals = [];
    const indices = [];

    const vertexPositions = [];
    const vertexNormals = [];

    const keywords = {
        v(parts) {
            positions.push(...parts.map(Number));
        },
        vn(parts) {
            normals.push(...parts.map(Number));
        },
        f(parts) {
            const faceVertices = parts.map((part) => {
                const [positionIndex, , normalIndex] = part.split('/').map((idx) => parseInt(idx) - 1);
                vertexPositions.push(...positions.slice(positionIndex * 3, positionIndex * 3 + 3));
                vertexNormals.push(...normals.slice(normalIndex * 3, normalIndex * 3 + 3));
                return vertexPositions.length / 3 - 1;
            });

            for (let i = 1; i < faceVertices.length - 1; i++) {
                indices.push(faceVertices[0], faceVertices[i], faceVertices[i + 1]);
            }
        },
    };

    const lines = objText.split('\n');
    for (const line of lines) {
        const [keyword, ...args] = line.trim().split(/\s+/);
        const handler = keywords[keyword];
        if (handler) {
            handler(args);
        }
    }

    return {
        positions: new Float32Array(vertexPositions),
        normals: new Float32Array(vertexNormals),
        indices: new Uint16Array(indices),
    };
}

function initializeBuffers(gl, modelData) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.positions, gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.normals, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);

    return { positionBuffer, normalBuffer, indexBuffer };
}

function createIdentityMatrix() {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ];
}

function multiplyMatrices(a, b) {
    const result = new Array(16);
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            result[row * 4 + col] = (
                a[row * 4 + 0] * b[0 * 4 + col] +
                a[row * 4 + 1] * b[1 * 4 + col] +
                a[row * 4 + 2] * b[2 * 4 + col] +
                a[row * 4 + 3] * b[3 * 4 + col]
            );
        }
    }
    return result;
}

function createTranslationMatrix(tx, ty, tz) {
    const matrix = createIdentityMatrix();
    matrix[12] = tx;
    matrix[13] = ty;
    matrix[14] = tz;
    return matrix;
}

function createScalingMatrix(sx, sy, sz) {
    const matrix = createIdentityMatrix();
    matrix[0] = sx;
    matrix[5] = sy;
    matrix[10] = sz;
    return matrix;
}

function createRotationYMatrix(angle) {
    const matrix = createIdentityMatrix();
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    matrix[0] = c;
    matrix[2] = -s;
    matrix[8] = s;
    matrix[10] = c;
    return matrix;
}

function createPerspectiveMatrix(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2);
    const rangeInv = 1 / (near - far);

    const matrix = new Array(16).fill(0);
    matrix[0] = f / aspect;
    matrix[5] = f;
    matrix[10] = (near + far) * rangeInv;
    matrix[11] = -1;
    matrix[14] = (2 * near * far) * rangeInv;
    return matrix;
}

function createLookAtMatrix(eye, target, up) {
    const zAxis = normalizeVector(subtractVectors(eye, target));
    const xAxis = normalizeVector(crossProduct(up, zAxis));
    const yAxis = crossProduct(zAxis, xAxis);

    const matrix = createIdentityMatrix();
    matrix[0] = xAxis[0];
    matrix[1] = yAxis[0];
    matrix[2] = zAxis[0];
    matrix[4] = xAxis[1];
    matrix[5] = yAxis[1];
    matrix[6] = zAxis[1];
    matrix[8] = xAxis[2];
    matrix[9] = yAxis[2];
    matrix[10] = zAxis[2];
    matrix[12] = -dotProduct(xAxis, eye);
    matrix[13] = -dotProduct(yAxis, eye);
    matrix[14] = -dotProduct(zAxis, eye);
    return matrix;
}

function subtractVectors(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function crossProduct(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ];
}

function dotProduct(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function normalizeVector(v) {
    const length = Math.sqrt(dotProduct(v, v));
    return v.map((x) => x / length);
}

function vec3Length(v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}
