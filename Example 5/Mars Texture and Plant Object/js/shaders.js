const vertexShaderSource = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;

out vec3 vPosition;
out vec3 vNormal;
out vec2 vTexCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
    vec4 worldPos = uModelMatrix * vec4(aPosition, 1.0);
    vPosition = worldPos.xyz;
    vNormal = mat3(uModelMatrix) * aNormal;
    vTexCoord = aTexCoord;

    gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}`;

const fragmentShaderSource = `#version 300 es
precision highp float;

in vec3 vPosition;
in vec3 vNormal;
in vec2 vTexCoord;

out vec4 fragColor;

uniform sampler2D uAlbedo;
uniform sampler2D uNormal;
uniform sampler2D uMetallic;
uniform sampler2D uRoughness;
uniform sampler2D uAmbientOcclusion;

uniform vec3 uLightDirection;   
uniform vec3 uCameraPosition;

vec3 calculateLighting(vec3 albedo, vec3 normal, float metallic, float roughness, float ao) {
    //L = -uLightDirection
    vec3 N = normalize(normal);
    vec3 V = normalize(uCameraPosition - vPosition);
    vec3 L = normalize(-uLightDirection);
    vec3 H = normalize(V + L);

    float NdotH = max(dot(N, H), 0.0);
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float VdotH = max(dot(V, H), 0.0);

    //Blinn-Phong seyi
    float NDF = pow(NdotH, (1.0 - roughness) * 256.0 + 2.0);
    float G   = min(1.0, 2.0 * NdotV * NdotL / (VdotH + 1e-5));

    float F0      = 0.04;
    float fresnel = pow(1.0 - VdotH, 5.0);
    vec3  F       = mix(vec3(F0), albedo, fresnel);

    vec3 kS = F;
    vec3 kD = (vec3(1.0) - kS) * (1.0 - metallic);

    vec3 numerator = NDF * G * F;
    float denom    = 4.0 * NdotV * NdotL + 1e-5;
    vec3 specular  = numerator / denom;

    //Lambertian formulu
    vec3 diffuse = kD * albedo * NdotL;

    //0.05le carpmayi dene isik cok belli olmadi
    vec3 ambient = albedo * ao;

    return ambient + diffuse + specular;
}

void main() {
    vec3 albedo     = texture(uAlbedo, vTexCoord).rgb;
    vec3 normalMap  = texture(uNormal, vTexCoord).rgb;
    float metallic  = texture(uMetallic, vTexCoord).r;
    float roughness = texture(uRoughness, vTexCoord).r;
    float ao        = texture(uAmbientOcclusion, vTexCoord).r;

    vec3 N = normalize(normalMap * 2.0 - 1.0);

    albedo = pow(albedo, vec3(2.2));

    vec3 color = calculateLighting(albedo, N, metallic, roughness, ao);

    color = pow(color, vec3(1.0 / 2.2));
    fragColor = vec4(color, 1.0);
}`;