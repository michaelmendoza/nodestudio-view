import * as THREE from 'three';
import { Chart2D_VertexShader, ROI_FragmentShader } from "./ChartShaders";
import { ROIOptions } from '../state/models/ROI';
import { ViewDict } from '../state/models/Viewer';

export const renderROI = (viewport, dataset, viewMode) => {
    if(viewMode === '2D View') render2D(viewport, dataset);
    if(viewMode === '3D View') render2D(viewport, dataset);
    if(viewMode === 'Lightbox') renderLightbox(viewport, dataset);
}

const render2D = (viewport, dataset) => {

    const sliceShape = ({
        z: [dataset.roi.shape[0], dataset.roi.shape[1]],
        x: [dataset.roi.shape[2], dataset.roi.shape[1]],
        y: [dataset.roi.shape[2], dataset.roi.shape[0]]
    }[viewport.datasliceKey]);

    const factor = sliceShape[0] / sliceShape[1];
    const planeWidth = 100
    const planeHeight = planeWidth * factor;
    
    const texture = create2DTexture(dataset.roi.roi, dataset.roi.shape);

    if (viewport.roi_mesh_2D) {
        setDepth(viewport, dataset.indices[0]);
        viewport.roi_mesh_2D.material.uniforms[ "diffuse" ].value = texture;
    }
    else {
        const material = createMaterial( texture, dataset.indices[0], planeWidth, planeHeight );
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

    let depth;
    if(viewMode === '2D View') depth = dataset.indices[0];
    if(viewMode === '3D View') depth = dataset.getSliceDepth(viewport.datasliceKey);
    if(viewMode === 'Lightbox') depth = viewport.pointerTargetROI.depth;
    
    const is2D = dataset.ndim === 2;
    const datasliceKey = is2D ? '2d' : viewport.datasliceKey;

    const value = 255;
    const brush = ROIOptions.brush;
    const height = roi.shape[0];
    const width = roi.shape[1];
    const dx = 1;
    const dy = width;
    const dz = height * width;

    const points = [];

    if(brush === 1) {
        points.push(is2D ? {x: p.x, y: p.y } : {x: p.x, y: p.y, z: depth });
    }
    if(brush >= 2) {
        for (let i = 0; i < brush * brush; i++) {
            const db = - Math.floor(brush / 2);
            const x = p.x + i % brush + db;
            const y = (p.y + Math.floor(i / brush)) + db;

            const x2 = (p.x - x)*(p.x - x)
            const y2 = (p.y - y)*(p.y - y) 
            const r2 = (brush / 2)*(brush / 2)
            const isCircle = x2 + y2 <= r2
            if (isCircle)
                points.push(is2D ? { x, y } : {x: x, y: y, z: depth });
        }
    }

    points.forEach((point) => {

        let index = 0;
        if (datasliceKey === '2d') {
            index = point.x * dx + point.y * dy;
        }
        if (datasliceKey === 'z' || datasliceKey === 'lightbox') {
            index = point.x * dx + point.y * dy + point.z * dz;
        }
        if (datasliceKey === 'x') {
            index = point.x * dx + point.z * dy + point.y * dz;
        }
        if (datasliceKey === 'y') {
            index = point.z * dx + point.x * dy + point.y * dz;
        }

        roi.roi[index] = ROIOptions.useBrush ? value : 0;
    })

    const texture = create2DTexture(roi.roi, roi.shape);
    if(dataset.viewMode === '2D View' ) {
        viewport.roi_mesh_2D.material.uniforms[ "diffuse" ].value = texture;
    }
    if(dataset.viewMode === '3D View') {
        // Update all views
        for (let key in ViewDict){
            const view = ViewDict[key];
            view.roi_mesh_2D.material.uniforms[ "diffuse" ].value = texture;
        }     
    }
    if(dataset.viewMode === 'Lightbox') {
        viewport.roi_mesh_lightbox[depth].material.uniforms[ "diffuse" ].value = texture;
        viewport.roi_mesh_lightbox[depth].material.uniforms[ "depth" ].value = depth;
    }

    return points;
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