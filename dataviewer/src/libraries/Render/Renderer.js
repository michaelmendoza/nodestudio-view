import * as THREE from 'three';
import { Chart2D_VertexShader, Chart2D_FragmentShader_DataTexture, Debug_FragmentShader, ROI_FragmentShader_DataTexture } from "./ChartShaders";

/** DEBUG Flag for ROI Texture */
const DEBUG_ROI_TEXTURE = false;

/** Setup depth, height, and width for a given shape and datasliceKey */
export const getSliceDimensions = (shape, datasliceKey) => {

    let depth, height, width;
    if (shape.length === 2) {
        [depth, height, width] = [0, ...shape];
    } else {
        const dimensions = {
            z: [shape[0], shape[1], shape[2]],
            y: [shape[1], shape[0], shape[2]],
            x: [shape[2], shape[0], shape[1]]
        };
        [depth, height, width] = dimensions[datasliceKey];
    }

    return [ depth, height, width ];
}

/** 
 * Create a DataTexture and Mesh for a given data with height and width for a given meshtype.
 * Creates the texture using THREE.DataTexture, creates the material and a plan mesh using 
 * THREE.PlaneGeometry, and adds the mesh to the scene. Returns the texture for use in updating
 * the texture data.
 */
export const createDataTextureMesh = (data, height, width, meshtype, scene) => {
    const factor = height / width;
    const planeWidth = 100;
    const planeHeight = planeWidth * factor;

    const texture = new THREE.DataTexture(
        data, 
        width, 
        height, 
        THREE.RedFormat,
        THREE.UnsignedByteType
    );
    texture.needsUpdate = true;

    const vertexShader = Chart2D_VertexShader;
    let fragmentShader;
    if (meshtype == 'roi') {
        fragmentShader = ROI_FragmentShader_DataTexture;
        if (DEBUG_ROI_TEXTURE) fragmentShader = Debug_FragmentShader;
    }
    else fragmentShader = Chart2D_FragmentShader_DataTexture;

    const material = new THREE.ShaderMaterial({
        uniforms: {
            diffuse: { value: texture },
            size: { value: new THREE.Vector2(planeWidth, planeHeight) }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        glslVersion: THREE.GLSL3,
        transparent: true,
    });

    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = meshtype;

    scene.children
        .filter(child => child.name === meshtype)
        .forEach(child => scene.remove(child));

    scene.add(mesh);

    return texture
}