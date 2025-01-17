function drawBuffer(gl, program, buffer, color, drawMode, vertexCount, rotationMatrix) {
    gl.useProgram(program);

    const uColorLocation = gl.getUniformLocation(program, 'u_color');
    gl.uniform4f(uColorLocation, ...color);

    const uRotationMatrix = gl.getUniformLocation(program, 'u_rotationMatrix');
    gl.uniformMatrix4fv(uRotationMatrix, false, rotationMatrix);

    gl.enableVertexAttribArray(gl.getAttribLocation(program, "a_position"));
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.position);
    gl.vertexAttribPointer(gl.getAttribLocation(program, "a_position"), 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(drawMode, 0, vertexCount);
}

//draw bufferlari kullanarak fabrici cizdir falan bisiler

function calculateRotationMatrix(angle) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    return new Float32Array([
        cosA, -sinA, 0, 0,
        sinA, cosA, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}

//cos ve sin degistirip bida dene

function calculateQuadraticBezierPoints(p0, p1, p2, numPoints) {
    let points = [];
    for (let i = 0; i <= numPoints; i++) {
        let t = i / numPoints;
        let x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
        let y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
        points.push([x, y]);
    }
    return points;
}

function windingOrder(polygon) {
    let area = 0;
    for (let i = 0; i < polygon.length; i++) {
        const [x1, y1] = polygon[i];
        const [x2, y2] = polygon[(i + 1) % polygon.length];
        area += (x1 * y2 - x2 * y1);
    }
    return area / 2;
}

function ensureWindingOrder(polygon) {
    if (windingOrder(polygon) < 0) {
        polygon.reverse();
    }
    return polygon;
}

function triangulate(polygon) {
    const triangles = [];
    let vertices = ensureWindingOrder([...polygon]);

    while (vertices.length > 3) {
        let earFound = false;
        for (let i = 0; i < vertices.length; i++) {
            const prevIndex = (i - 1 + vertices.length) % vertices.length;
            const nextIndex = (i + 1) % vertices.length;

            const prevVertex = vertices[prevIndex];
            const vertex = vertices[i];
            const nextVertex = vertices[nextIndex];

            const vector1 = [vertex[0] - prevVertex[0], vertex[1] - prevVertex[1]];
            const vector2 = [nextVertex[0] - vertex[0], nextVertex[1] - vertex[1]];
            const angle = getInternalAngle(vector1, vector2);

            if (angle >= Math.PI) continue;

            const triangle = [prevVertex, vertex, nextVertex];
            if (!isAnyPointInside(triangle, vertices)) {
                triangles.push(triangle);
                vertices.splice(i, 1);
                earFound = true;
                break;
            }
        }

        if (!earFound) break;
    }

    if (vertices.length === 3) {
        triangles.push([vertices[0], vertices[1], vertices[2]]);
    }

    return triangles;
}

function getInternalAngle(vector1, vector2) {
    const dotProduct = vector1[0] * vector2[0] + vector1[1] * vector2[1];
    const magnitude1 = Math.sqrt(vector1[0] ** 2 + vector1[1] ** 2);
    const magnitude2 = Math.sqrt(vector2[0] ** 2 + vector2[1] ** 2);
    return Math.acos(dotProduct / (magnitude1 * magnitude2));
}

function isPointInsideTriangle(triangle, point) {
    const [a, b, c] = triangle;
    const area = 0.5 * (-b[1] * c[0] + a[1] * (-b[0] + c[0]) + a[0] * (b[1] - c[1]) + b[0] * c[1]);
    const s = 1 / (2 * area) * (a[1] * c[0] - a[0] * c[1] + (c[1] - a[1]) * point[0] + (a[0] - c[0]) * point[1]);
    const t = 1 / (2 * area) * (a[0] * b[1] - a[1] * b[0] + (a[1] - b[1]) * point[0] + (b[0] - a[0]) * point[1]);
    const u = 1 - s - t;
    return s > 0 && t > 0 && u > 0;
}

function isAnyPointInside(triangle, points) {
    return points.some(point => !triangle.includes(point) && isPointInsideTriangle(triangle, point));
}
