
export const Chart2D_VertexShader = `
uniform vec2 size;
out vec2 vUv;

void main() {

    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    // Convert position.xy to 1.0-0.0

    vUv.xy = position.xy / size + 0.5;
    vUv.y = 1.0 - vUv.y; // original data is upside down

}`;

export const Chart2D_FragmentShader = `
precision highp float;
precision highp int;
precision highp sampler2DArray;

uniform sampler2DArray diffuse;
in vec2 vUv;
uniform int depth;

out vec4 outColor;

void main() {

    vec4 color = texture( diffuse, vec3( vUv, depth ) );

    // lighten a bit
    outColor = vec4( color.rrr * 1.5, 1.0 );

}
`;

export const ROI_FragmentShader_DataArrayTexture = `
precision highp float;
precision highp int;
precision highp sampler2DArray;

uniform sampler2DArray diffuse;
in vec2 vUv;
uniform int depth;

out vec4 outColor;

void main() {
    vec4 color = texture( diffuse, vec3( vUv, depth ) );

    if (color.r > 0.0) {
        outColor = vec4( 255, 0, 0, 0.4 );
    }
    else {
        outColor = vec4( 0, 0, 0, 0 );
    }
}
`;

export const ROI_FragmentShader_DataTexture = `
precision highp float;
precision highp int;

uniform sampler2D diffuse;
in vec2 vUv;

out vec4 outColor;

void main() {
    vec4 color = texture(diffuse, vUv);

    if (color.r > 0.0) {
        outColor = vec4(1.0, 0.0, 0.0, 0.4);  // Red with 40% opacity
    } else {
        outColor = vec4(0.0, 0.0, 0.0, 0.0);  // Transparent
    }
}
`

export const Debug_FragmentShader = `
precision highp float;
precision highp int;

uniform sampler2D diffuse;
in vec2 vUv;

out vec4 outColor;
void main() {
    outColor = vec4(vUv.x, vUv.y, 0.0, 0.5);
}
`;