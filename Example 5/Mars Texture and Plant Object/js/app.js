const canvas = document.getElementById('webglCanvas');

function handleResize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    updateProjectionMatrix();
}
window.addEventListener('resize', handleResize);

canvas.width = canvas.clientWidth || 1200;
canvas.height = canvas.clientHeight || 800;

const gl = canvas.getContext('webgl2');
if (!gl) {
    console.error("WebGL2 not supported.");
}

function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vs = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
const fs = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
    console.error("Program link error:", gl.getProgramInfoLog(program));
}
gl.useProgram(program);


function loadTexture(url) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const placeholder = new Uint8Array([128,128,128,255]);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,placeholder);

    const img = new Image();
    img.onload = ()=>{
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
    };
    img.src = url;
    return tex;
}

function createSolidTexture(r,g,b,a){
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const pixel = new Uint8Array([r,g,b,a]);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
    return tex;
}

const blackTexture   = createSolidTexture(0,0,0,255);
const whiteTexture   = createSolidTexture(255,255,255,255);
const neutralNormal  = createSolidTexture(128,128,255,255);


function createSphere(radius, latBands, lonBands) {
    const positions = [];
    const normals   = [];
    const texcoords = [];
    const indices   = [];

    for(let lat=0; lat<=latBands; lat++){
        const theta = lat*Math.PI/latBands;
        const sinT  = Math.sin(theta);
        const cosT  = Math.cos(theta);

        for(let lon=0; lon<=lonBands; lon++){
            const phi = lon*2.0*Math.PI/lonBands;
            const sinP= Math.sin(phi);
            const cosP= Math.cos(phi);

            const x = cosP * sinT;
            const y = cosT;
            const z = sinP * sinT;
            const u = 1 - (lon / lonBands);
            const v = 1 - (lat / latBands);

            positions.push(radius*x, radius*y, radius*z);
            normals.push(x, y, z);
            texcoords.push(u,v);
        }
    }

    for(let lat=0; lat<latBands; lat++){
        for(let lon=0; lon<lonBands; lon++){
            const first = lat*(lonBands+1)+lon;
            const second= first + lonBands+1;
            indices.push(first, second, first+1);
            indices.push(second, second+1, first+1);
        }
    }

    return { positions, normals, texcoords, indices };
}
const sphere = createSphere(15, 40, 40);

const spherePosBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, spherePosBuf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.positions), gl.STATIC_DRAW);

const sphereNorBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, sphereNorBuf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.normals), gl.STATIC_DRAW);

const sphereTexBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, sphereTexBuf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere.texcoords), gl.STATIC_DRAW);

const sphereIdxBuf = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIdxBuf);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphere.indices), gl.STATIC_DRAW);

const sphereAlbedo    = loadTexture("textures/sand-dunes1_albedo.png");
const sphereNormal    = loadTexture("textures/sand-dunes1_normal-dx.png");
const sphereMetallic  = loadTexture("textures/sand-dunes1_metallic.png");
const sphereRoughness = loadTexture("textures/sand-dunes1_roughness.png");
const sphereAO        = loadTexture("textures/sand-dunes1_ao.png");



let plantVAO        = null;
let plantIndexCount = 0;
let plantDiffuseTex = null;
let plantNormalTex  = null;

const plantModel = mat4.create();

async function loadPlant() {
    const mtlData = await loadMTL('resources/bitki.mtl');
    if(!mtlData){
        console.warn("MTL yok");
        plantDiffuseTex = whiteTexture;
        plantNormalTex  = neutralNormal;
    } else {
        if(mtlData.diffuseMap){
            plantDiffuseTex = loadTexture(mtlData.diffuseMap);
        } else {
            plantDiffuseTex = whiteTexture;
        }
        if(mtlData.normalMap){
            plantNormalTex  = loadTexture(mtlData.normalMap);
        } else {
            plantNormalTex  = neutralNormal;
        }
    }

    const objData = await loadOBJ('resources/bitki.obj');
    if(!objData){
        console.error("No bitki.obj");
        return;
    }

    plantVAO = gl.createVertexArray();
    gl.bindVertexArray(plantVAO);

    let buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objData.positions), gl.STATIC_DRAW);
    let loc = gl.getAttribLocation(program, 'aPosition');
    gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(loc);

    buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objData.normals), gl.STATIC_DRAW);
    loc = gl.getAttribLocation(program, 'aNormal');
    gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(loc);

    buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(objData.texcoords), gl.STATIC_DRAW);
    loc = gl.getAttribLocation(program, 'aTexCoord');
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(loc);

    const iBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(objData.indices), gl.STATIC_DRAW);

    plantIndexCount = objData.indices.length;

    gl.bindVertexArray(null);
}
loadPlant();


const uProjLoc      = gl.getUniformLocation(program, "uProjectionMatrix");
const uViewLoc      = gl.getUniformLocation(program, "uViewMatrix");
const uModelLoc     = gl.getUniformLocation(program, "uModelMatrix");
const uLightDirLoc  = gl.getUniformLocation(program, "uLightDirection");
const uCamPosLoc    = gl.getUniformLocation(program, "uCameraPosition");

const uAlbedoLoc    = gl.getUniformLocation(program, "uAlbedo");
const uNormalLoc    = gl.getUniformLocation(program, "uNormal");
const uMetallicLoc  = gl.getUniformLocation(program, "uMetallic");
const uRoughnessLoc = gl.getUniformLocation(program, "uRoughness");
const uAOLoc        = gl.getUniformLocation(program, "uAmbientOcclusion");


const projectionMatrix = mat4.create();
const viewMatrix       = mat4.create();
const sphereModel      = mat4.create();

let cameraYaw=0, cameraPitch=0, cameraDist=50;
let cameraPanX=0, cameraPanY=0;

function updateProjectionMatrix(){
    const aspect = canvas.width / canvas.height;
    mat4.perspective(projectionMatrix, Math.PI*0.25, aspect, 0.1,200.0);
    gl.uniformMatrix4fv(uProjLoc,false,projectionMatrix);
}

function updateViewMatrix(){
    const xRot=cameraPitch;
    const yRot=cameraYaw;
    const eyeX = cameraPanX + cameraDist*Math.cos(xRot)*Math.sin(yRot);
    const eyeY = cameraPanY + cameraDist*Math.sin(xRot);
    const eyeZ = cameraDist*Math.cos(xRot)*Math.cos(yRot);

    mat4.lookAt(viewMatrix, [eyeX, eyeY, eyeZ], [cameraPanX,cameraPanY,0],[0,1,0]);
    gl.uniformMatrix4fv(uViewLoc,false,viewMatrix);
    gl.uniform3fv(uCamPosLoc,[eyeX,eyeY,eyeZ]);
}

updateProjectionMatrix();
updateViewMatrix();

let mouseDown=false;
let lastX=0, lastY=0;
let mouseButtons=0;

canvas.addEventListener('mousedown',(e)=>{
    mouseDown=true;
    mouseButtons=e.buttons;
    lastX=e.clientX; lastY=e.clientY;
    e.preventDefault();
});
canvas.addEventListener('mousemove',(e)=>{
    if(!mouseDown) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    if((mouseButtons & 1)===1){
        cameraYaw   += dx*0.01;
        cameraPitch += dy*0.01;
        cameraPitch = Math.max(-Math.PI/2+0.1, Math.min(Math.PI/2-0.1, cameraPitch));
    }
    else if((mouseButtons & 4)===4){
        cameraDist += dy*0.2;
        cameraDist = Math.max(2, cameraDist);
    }
    else if((mouseButtons & 2)===2){
        cameraPanX += -dx*0.05;
        cameraPanY +=  dy*0.05;
    }
    updateViewMatrix();
    lastX=e.clientX; lastY=e.clientY;
});
canvas.addEventListener('mouseup',(e)=>{
    mouseDown=false;
    mouseButtons=0;
});
canvas.addEventListener('mouseout',(e)=>{
    mouseDown=false;
    mouseButtons=0;
});


function updateLightDirection() {
    const baseDir = [1,0,0];
    const angle = performance.now()*0.0002;
    let rot = mat4.create();
    mat4.rotateY(rot, rot, angle);
    let dir4 = vec4.fromValues(baseDir[0],baseDir[1],baseDir[2],0);
    vec4.transformMat4(dir4, dir4, rot);
    gl.uniform3fv(uLightDirLoc, [dir4[0], dir4[1], dir4[2]]);
}


function updateObjectRotations() {
    let angle = performance.now() * 0.0005;

    mat4.identity(sphereModel);
    mat4.rotateY(sphereModel, sphereModel, angle);

    mat4.identity(plantModel);
    mat4.rotateY(plantModel, plantModel, angle);
    mat4.translate(plantModel, plantModel, [0,15,0]);
    mat4.scale(plantModel, plantModel, [2,2,2]);
}



function render(){
    gl.clearColor(0.1,0.1,0.1,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(program);

    updateViewMatrix();

    updateLightDirection();

    updateObjectRotations();

    gl.bindBuffer(gl.ARRAY_BUFFER, spherePosBuf);
    let loc = gl.getAttribLocation(program, 'aPosition');
    gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(loc);

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereNorBuf);
    loc = gl.getAttribLocation(program, 'aNormal');
    gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(loc);

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereTexBuf);
    loc = gl.getAttribLocation(program, 'aTexCoord');
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(loc);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereIdxBuf);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sphereAlbedo);
    gl.uniform1i(uAlbedoLoc, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, sphereNormal);
    gl.uniform1i(uNormalLoc, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, sphereMetallic);
    gl.uniform1i(uMetallicLoc, 2);

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, sphereRoughness);
    gl.uniform1i(uRoughnessLoc, 3);

    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, sphereAO);
    gl.uniform1i(uAOLoc, 4);

    gl.uniformMatrix4fv(uModelLoc,false,sphereModel);

    gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);


    if(plantVAO && plantDiffuseTex && plantNormalTex){
        gl.bindVertexArray(plantVAO);

        // Diffuse => Albedo
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, plantDiffuseTex);
        gl.uniform1i(uAlbedoLoc,0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, plantNormalTex);
        gl.uniform1i(uNormalLoc,1);

        // Metallic=0, Rough=1
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, blackTexture);
        gl.uniform1i(uMetallicLoc,2);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, whiteTexture);
        gl.uniform1i(uRoughnessLoc,3);

        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, whiteTexture);
        gl.uniform1i(uAOLoc,4);

        gl.uniformMatrix4fv(uModelLoc,false,plantModel);

        gl.drawElements(gl.TRIANGLES, plantIndexCount, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    requestAnimationFrame(render);
}
render();

handleResize();
