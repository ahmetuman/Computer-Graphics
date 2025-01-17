const vsSource = `
    attribute vec4 a_position;
    uniform mat4 u_rotationMatrix;

    void main() {
        gl_Position = u_rotationMatrix * a_position;
    }
`;

const fsSource = `
    precision mediump float;
    uniform vec4 u_color;
    uniform bool u_dynamicColorMode; 
    uniform vec3 u_dynamicColor;     

    void main() {
        vec4 color = u_dynamicColorMode ? vec4(u_dynamicColor, 1.0) : u_color;
        gl_FragColor = color;
    }
`;
