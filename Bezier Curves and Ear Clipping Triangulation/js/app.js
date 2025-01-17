"use strict";

main();

function main() {
    const canvas = document.querySelector("#glCanvas");
    const gl = canvas.getContext("webgl");

    if (!gl) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const program = initShaderProgram(gl, vsSource, fsSource);

    const boru_positions = [0, 0.5, 0.1, 0.5, 0, -0.7, 0.1, -0.7];
    const boru_buffer = initBuffer(gl, boru_positions);
    drawBuffer(gl, program, boru_buffer, [0.0, 0.0, 1.0, 1.0], gl.TRIANGLE_STRIP, boru_positions.length / 2);

    const p0_pointy = [0, 0.5];
    const p1_pointy = [0.05, 0.55];
    const p2_pointy = [0.1, 0.5];

    const positions_pointy = calculateQuadraticBezierPoints(p0_pointy, p1_pointy, p2_pointy, 100);

    const vertices_pointy = [...positions_pointy];

    const triangles_pointy = triangulate(vertices_pointy);

    triangles_pointy.forEach(triangle => {
        const positions = triangle.flat();
        const buffer = initBuffer(gl, positions);
        drawBuffer(gl, program, buffer, [0.0, 0.0, 1.0, 1.0], gl.TRIANGLES, positions.length / 2);
    });

    const p0_fabric_top = [-0.7, 0];
    const p1_fabric_top = [0.05, 0.80];
    const p2_fabric_top = [0.8, 0];

    const positions_fabric_top = calculateQuadraticBezierPoints(p0_fabric_top, p1_fabric_top, p2_fabric_top, 100);


    const p0_fabric1 = [-0.7, 0];
    const p1_fabric1 = [-0.45, 0.20];
    const p2_fabric1 = [-0.2, 0];

    const positions_fabric1 = calculateQuadraticBezierPoints(p0_fabric1, p1_fabric1, p2_fabric1, 100);

    const p0_fabric2 = [-0.2, 0];
    const p1_fabric2 = [0.05, 0.20];
    const p2_fabric2 = [0.3, 0];

    const positions_fabric2 = calculateQuadraticBezierPoints(p0_fabric2, p1_fabric2, p2_fabric2, 100);

    const p0_fabric3 = [0.3, 0];
    const p1_fabric3 = [0.55, 0.20];
    const p2_fabric3 = [0.8, 0];

    const positions_fabric3 = calculateQuadraticBezierPoints(p0_fabric3, p1_fabric3, p2_fabric3, 100);

    const vertices_fabric = [
        ...positions_fabric3.reverse(),
        ...positions_fabric2.reverse(),
        ...positions_fabric1.reverse(),
        ...positions_fabric_top
    ];
    const triangles_fabric = triangulate(vertices_fabric);

    triangles_fabric.forEach(triangle => {
        const positions = triangle.flat();
        const buffer = initBuffer(gl, positions);
        drawBuffer(gl, program, buffer, [1.0, 1.0, 0.0, 1.0], gl.TRIANGLES, positions.length / 2);
    });

    const p0_handle_small = [-0.2, -0.7];
    const p1_handle_small = [-0.1, -0.8];
    const p2_handle_small = [0, -0.7];

    const positions_handle_small = calculateQuadraticBezierPoints(p0_handle_small, p1_handle_small, p2_handle_small, 100);

    const p0_handle_big = [-0.3, -0.7];
    const p1_handle_big = [-0.1, -1];
    const p2_handle_big = [0.1, -0.7];

    const positions_handle_big = calculateQuadraticBezierPoints(p0_handle_big, p1_handle_big, p2_handle_big, 100);

    const line1 = [positions_handle_small[positions_handle_small.length - 1], positions_handle_big[0]];
    const line2 = [positions_handle_big[positions_handle_big.length - 1], positions_handle_small[0]];

    const vertices = [...positions_handle_small, ...line1, ...positions_handle_big.reverse(), ...line2];
    const triangles = triangulate(vertices);

    triangles.forEach(triangle => {
        const positions = triangle.flat();
        const buffer = initBuffer(gl, positions);
        drawBuffer(gl, program, buffer, [0.0, 0.0, 1.0, 1.0], gl.TRIANGLES, positions.length / 2);
    });
}

