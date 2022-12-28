import * as THREE from 'three';
import { Chart2D_FragmentShader, Chart2D_VertexShader } from "./ChartShaders";
import { throttle } from "./Utils";

export const render = (viewport, dataset, viewMode) => {
    if(viewMode === '2D View') render2D(viewport, dataset);
    if(viewMode === 'Lightbox') renderLightbox(viewport, dataset);
}

export const updateRender = async (viewport, dataset, viewMode) => {
    const _render = async() => {
        await dataset.fetchDataset();
        await render(viewport, dataset, viewMode);
    }

    throttle(() => _render(), 50, 'Dataset-Update');
}

const create2DTexture = (data, shape) => {
    if(shape[2] === undefined) shape[2] = 1;

    const texture = new THREE.DataArrayTexture( data, shape[0], shape[1], shape[2] );
    texture.format = THREE.RedFormat;
    texture.needsUpdate = true;
    return texture;
}

const create2DMaterial = (texture) => {
    const VertexShader = Chart2D_VertexShader;
    const FragmentShader = Chart2D_FragmentShader;

    const planeWidth = 100
    const planeHeight = 100;

    const material = new THREE.ShaderMaterial( {
        uniforms: {
            diffuse: { value: texture },
            depth: { value: 0 },
            size: { value: new THREE.Vector2( planeWidth, planeHeight ) }
        },
        vertexShader: VertexShader,
        fragmentShader: FragmentShader,
        glslVersion: THREE.GLSL3
    } );

    return material;
}

const render2D = (viewport, dataset) => {
    if (!viewport) return;
    console.log('renderUpdate 2D')

    // Clear Mesh from Lightbox 
    if(viewport.mesh_lightbox) {
        Object.values(viewport.mesh_lightbox).forEach((mesh) => { 
            viewport.scene.remove(mesh)
        });
        viewport.mesh_lightbox = null;
    }

    const texture = create2DTexture(dataset.dataset.data, dataset.dataset.shape)

    if (viewport.mesh_2D) {
        viewport.mesh_2D.material.uniforms[ "diffuse" ].value = texture;
    }
    else {
        const planeWidth = 100
        const planeHeight = 100;
        const material = create2DMaterial(texture);
        const geometry = new THREE.PlaneGeometry( planeWidth, planeHeight );
        const mesh = new THREE.Mesh( geometry, material );

        viewport.scene.add( mesh );    
        viewport.mesh_2D = mesh;      
    }
}

const renderLightbox = async (viewport, dataset) => {
    if (!viewport) return;

    if(!viewport.mesh_lightbox) viewport.mesh_lightbox = {};

    // Clear Mesh from 2D Render  
    if(viewport.mesh_2D) {
        viewport.scene.remove(viewport.mesh_2D)
        viewport.mesh_2D = null;
    }

    const length = dataset.dataset.shape[0]; //dataset.shape[0]; //4;
    const factor =  Math.ceil(Math.sqrt(length));
    const width = 100 / factor;
    const height = 100 / factor;

    const shape = [...dataset.dataset.shape];
    shape[0] = dataset.dataset.shape[1];
    shape[1] = dataset.dataset.shape[2];
    shape[2] = dataset.dataset.shape[0];
    const texture = create2DTexture(dataset.dataset.data, shape);

    for(var i = 0; i < length; i++) {
        const offset = { x: width * (i % factor) - (100 - width) / 2, y: height * Math.floor(i / factor) - (100 - height) / 2 }

        renderSlice(texture, viewport, width, height, offset, i);
    }
}

const renderSlice = async (texture, viewport, width, height, offset, meshIndex) => {
    console.log('renderUpdate dataslice')
    
    const VertexShader = Chart2D_VertexShader;
    const FragmentShader = Chart2D_FragmentShader;

    const planeWidth = width; //50
    const planeHeight = height; //50;

    if(viewport.mesh_lightbox[meshIndex]) {
        viewport.mesh_lightbox[meshIndex].material.uniforms[ "diffuse" ].value = texture;
    }
    else {
        const material = new THREE.ShaderMaterial( {
            uniforms: {
                diffuse: { value: texture },
                depth: { value: meshIndex },
                size: { value: new THREE.Vector2( planeWidth, planeHeight ) }
            },
            vertexShader: VertexShader,
            fragmentShader: FragmentShader,
            glslVersion: THREE.GLSL3
        } );

        const geometry = new THREE.PlaneGeometry( planeWidth, planeHeight );

        const mesh = new THREE.Mesh( geometry, material );
        mesh.position.x = offset.x;
        mesh.position.y = offset.y;

        viewport.scene.add( mesh );
        viewport.mesh_lightbox[meshIndex] = mesh;
    }
}