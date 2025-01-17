const vertexShaderSource = `
attribute vec4 aPosition;
attribute vec3 aNormal;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
varying vec3 vNormal;

void main() {
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aPosition;
    vNormal = aNormal;
}
`;

const fragmentShaderSource = `
precision mediump float;
varying vec3 vNormal;
uniform vec3 uLightDirection;

void main() {
    float light = max(dot(normalize(vNormal), normalize(uLightDirection)), 0.0);
    gl_FragColor = vec4(vec3(1.0, 0.5, 0.2) * light, 1.0);
}
`;
