import * as THREE from 'three';
import { pixelArrayToBase64 } from './Data';
import { throttle } from './Utils';
import { Chart2D_VertexShader, ROI_FragmentShader } from "./ChartShaders";
import { ROIOptions } from '../state/models/ROI';

export const renderROI = (viewport, dataset, viewMode) => {
    if(viewMode === '2D View') render2D(viewport, dataset);
    if(viewMode === '3D View') render2D(viewport, dataset);
    if(viewMode === 'Lightbox') renderLightbox(viewport, dataset);
}

const render2D = (viewport, dataset) => {

    const planeWidth = 100;
    const planeHeight = 100;
    const texture = create2DTexture(dataset.roi.roi, dataset.roi.shape);

    if (viewport.roi_mesh_2D) {
        setDepth(viewport, dataset.indices[0]);
        viewport.roi_mesh_2D.material.uniforms[ "diffuse" ].value = texture;
    }
    else {
        const material = createMaterial(texture, dataset.indices[0]);
        const geometry = new THREE.PlaneGeometry( planeWidth, planeHeight );
        const mesh = new THREE.Mesh( geometry, material );
        mesh.name = 'roi';

        viewport.scene.add( mesh );
        viewport.roi_mesh_2D = mesh;            
    }
}

const renderLightbox = (viewport, dataset) => {
    const length = dataset.roi.shape[2]; // Depth
    const factor =  Math.ceil(Math.sqrt(length));
    const width = 100 / factor;
    const height = 100 / factor;

    const texture = create2DTexture(dataset.roi.roi, dataset.roi.shape);

    for(var i = 0; i < length; i++) {
        const offset = { x: width * (i % factor) - (100 - width) / 2, y: height * Math.floor(i / factor) - (100 - height) / 2 };

        renderSlice(viewport, texture, width, height, offset, i);
    }
}

const renderSlice = (viewport, texture, planeWidth, planeHeight, planeOffset, index) => {    
    if (viewport.roi_mesh_lightbox[index]) {
        viewport.roi_mesh_lightbox[index].material.uniforms[ "diffuse" ].value = texture;
    }
    else {
        const material = createMaterial(texture, index, planeWidth, planeHeight);
        const geometry = new THREE.PlaneGeometry( planeWidth, planeHeight );
        const mesh = new THREE.Mesh( geometry, material );
        mesh.position.x = planeOffset.x;
        mesh.position.y = planeOffset.y;
        mesh.name = `roi`
        mesh.depth = index;

        viewport.scene.add( mesh );
        viewport.roi_mesh_lightbox[index] = mesh;            
    }
}

export const updatePixel = (viewport, dataset, viewMode, p) => {
    const roi = dataset.roi;

    console.log('update', p)
    const x = p.x;
    const y = p.y;

    let depth;
    if(viewMode === '2D View') depth = dataset.indices[0];
    if(viewMode === '3D View') depth = dataset.indices[0];
    if(viewMode === 'Lightbox') depth = viewport.pointerTargetROI.depth;

    const value = 255;
    const brush = ROIOptions.brush;
    const height = roi.shape[0];
    const width = roi.shape[1];
    const dz = height * width * depth;

    if(brush === 1) {
        roi.roi[p.x + width * p.y + dz] = ROIOptions.useBrush ? value : 0;
    }
    if(brush >= 2) {
        for (let i = 0; i < brush * brush; i++) {
            const db = - Math.floor(brush / 2);
            const x = p.x + i % brush + db;
            const y = (p.y + Math.floor(i / brush)) + db;
            const dy = width * y;

            const x2 = (p.x - x)*(p.x - x)
            const y2 = (p.y - y)*(p.y - y) 
            const r2 = (brush / 2)*(brush / 2)
            const isCircle = x2 + y2 <= r2
            if (isCircle)
                roi.roi[x + dy + dz] = ROIOptions.useBrush ? value : 0;
        }
    }

    const texture = create2DTexture(roi.roi, roi.shape);
    if(dataset.viewMode === '2D View') {
        viewport.roi_mesh_2D.material.uniforms[ "diffuse" ].value = texture;
    }
    if(dataset.viewMode === '3D View') {
        viewport.roi_mesh_2D.material.uniforms[ "diffuse" ].value = texture;
    }
    if(dataset.viewMode === 'Lightbox') {
        viewport.roi_mesh_lightbox[depth].material.uniforms[ "diffuse" ].value = texture;
        viewport.roi_mesh_lightbox[depth].material.uniforms[ "depth" ].value = depth;
    }
}

const create2DTexture = (data, shape) => {
    const texture = new THREE.DataArrayTexture( data, shape[0], shape[1], shape[2]);
    texture.format = THREE.RedFormat;
    texture.needsUpdate = true;
    return texture;
}

const createMaterial = (texture, depth, planeWidth = 100, planeHeight = 100) => {

    const material = new THREE.ShaderMaterial( {
        uniforms: {
            diffuse: { value: texture },
            depth: { value: depth },
            size: { value: new THREE.Vector2( planeWidth, planeHeight ) }
        },
        vertexShader: Chart2D_VertexShader,
        fragmentShader: ROI_FragmentShader,
        glslVersion: THREE.GLSL3
    } );
    material.transparent = true;
    return material;
}

export const setDepth = (viewport, depth) => {
    viewport.roi_mesh_2D.material.uniforms[ "depth" ].value = depth;
}