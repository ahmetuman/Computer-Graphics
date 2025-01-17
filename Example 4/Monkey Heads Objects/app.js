function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Error compiling shader:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Error linking program:", gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    return program;
}

(async function main() {
    document.addEventListener("DOMContentLoaded", async () => {
        const gl = initializeWebGL();
        if (!gl) return;

        const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
        gl.useProgram(program);

        const monkeyModel = await loadOBJ('monkey_head.obj');

        const buffers = initializeBuffers(gl, monkeyModel);

        const aPosition = gl.getAttribLocation(program, 'aPosition');
        gl.enableVertexAttribArray(aPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positionBuffer);
        gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

        const uModelMatrix = gl.getUniformLocation(program, 'uModelMatrix');
        const uViewMatrix = gl.getUniformLocation(program, 'uViewMatrix');
        const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');

        const camera = {
            eye: [0, 2, 10],
            center: [0, 0, 0],
            up: [0, 1, 0],
            fovy: Math.PI / 4,
            aspect: gl.canvas.width / gl.canvas.height,
            zNear: 0.1,
            zFar: 100.0,
        };

        const projectionMatrix = createPerspectiveMatrix(camera.fovy, camera.aspect, camera.zNear, camera.zFar);
        const viewMatrix = createLookAtMatrix(camera.eye, camera.center, camera.up);

        gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(uViewMatrix, false, viewMatrix);

        window.addEventListener("resize", () => {
            gl.canvas.width = window.innerWidth;
            gl.canvas.height = window.innerHeight;
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            camera.aspect = gl.canvas.width / gl.canvas.height;
            const newProjectionMatrix = createPerspectiveMatrix(camera.fovy, camera.aspect, camera.zNear, camera.zFar);
            gl.uniformMatrix4fv(uProjectionMatrix, false, newProjectionMatrix);
        });


        let mouseDown = false;
        let lastX, lastY;
        let activeButton = null;

        gl.canvas.addEventListener("mousedown", (e) => {
            mouseDown = true;
            lastX = e.clientX;
            lastY = e.clientY;
            activeButton = e.button;
        });

        gl.canvas.addEventListener("mouseup", () => {
            mouseDown = false;
        });

        let theta = Math.atan2(camera.eye[2] - camera.center[2], camera.eye[0] - camera.center[0]);
        let phi = Math.acos((camera.eye[1] - camera.center[1]) / vec3Length(subtractVectors(camera.eye, camera.center)));
        const radius = vec3Length(subtractVectors(camera.eye, camera.center));

        gl.canvas.addEventListener("mousemove", (e) => {
            if (!mouseDown) return;

            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;

            if (activeButton === 0) {
                const rotationSpeed = 0.005;

                theta -= dx * rotationSpeed; // Horizontal
                phi -= dy * rotationSpeed;   // Vertical

                const epsilon = 0.1;
                phi = Math.max(epsilon, Math.min(Math.PI - epsilon, phi));

                // Convert spherical coordinates back to Cartesian
                camera.eye = [
                    camera.center[0] + radius * Math.sin(phi) * Math.cos(theta),
                    camera.center[1] + radius * Math.cos(phi),
                    camera.center[2] + radius * Math.sin(phi) * Math.sin(theta),
                ];

                const newViewMatrix = createLookAtMatrix(camera.eye, camera.center, camera.up);
                gl.uniformMatrix4fv(uViewMatrix, false, newViewMatrix);
            }
        });



        let scaleDirection = 1;
        let rotationAngle = 0;
        let verticalOffset = 0;
        let upDirection = 1;

        const modelMatrices = [
            createTranslationMatrix(-2, 0, 0),
            createTranslationMatrix(0, 0, 0),
            createTranslationMatrix(2, 0, 0),
        ];

        function animate(deltaTime) {
            const scaleFactor = 1 + Math.sin(deltaTime * 0.0005) * 0.3;
            const leftMatrix = multiplyMatrices(createTranslationMatrix(-2, 0, 0), createScalingMatrix(scaleFactor, scaleFactor, scaleFactor));
            modelMatrices[0] = leftMatrix;

            rotationAngle += deltaTime * 0.000002;
            const middleMatrix = multiplyMatrices(createTranslationMatrix(0, 0, 0), createRotationYMatrix(rotationAngle));
            modelMatrices[1] = middleMatrix;

            verticalOffset += upDirection * deltaTime * 0.000003;
            if (verticalOffset > 1 || verticalOffset < -1) {
                upDirection *= -1; // Reverse direction
            }
            const rightMatrix = createTranslationMatrix(2, verticalOffset, 0);
            modelMatrices[2] = rightMatrix;
        }

        function render(currentTime) {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            animate(currentTime);

            modelMatrices.forEach((matrix) => {
                gl.uniformMatrix4fv(uModelMatrix, false, matrix);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
                gl.drawElements(gl.TRIANGLES, monkeyModel.indices.length, gl.UNSIGNED_SHORT, 0);
            });

            requestAnimationFrame(render);
        }

        render(0);
    });
})();
