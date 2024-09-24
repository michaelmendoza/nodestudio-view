import * as THREE from 'three';
import { Chart2D_VertexShader, ROI_FragmentShader } from "./ChartShaders";
import { ROIOptions } from '../state/models/ROI';
import { ViewDict } from '../state/models/Viewer';

export class ROIMaskRenderer {
    constructor(viewport) {
        this.roi = viewport.dataset.roi;

        if (this.roi.shape.length === 2) { 
            this.depth = 0;
            this.height = this.roi.shape[0];
            this.width = this.roi.shape[1];
        }
        else if (viewport.datasliceKey === 'z') {
            this.depth = this.roi.shape[0];
            this.height = this.roi.shape[1];
            this.width = this.roi.shape[2];
        }
        else if (viewport.datasliceKey === 'y') {
            this.depth = this.roi.shape[1];
            this.height = this.roi.shape[0];
            this.width = this.roi.shape[2];
        }
        else if (viewport.datasliceKey === 'x') {
            this.depth = this.roi.shape[2];
            this.height = this.roi.shape[0];
            this.width = this.roi.shape[1];
        }

        this.texture = new THREE.DataTexture(this.roi.mask, this.width, this.height, THREE.LuminanceFormat);
        this.texture.needsUpdate = true;

        this.material = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true,
        });

        const factor = this.height / this.width;
        const planeWidth = 100
        const planeHeight = planeWidth * factor;
        const geometry = new THREE.PlaneGeometry( planeWidth, planeHeight );
        const mesh = new THREE.Mesh(geometry, this.material);
        mesh.name = 'roi';

        viewport.scene.add( mesh );
        viewport.roi_mesh_2D = mesh;  
    }

    /** Parse slicekey into z, y, x indices */
    parseSliceKey(sliceKey) {
        const parts = sliceKey.split(',').map(part => part.trim());
        const [z, y, x] = parts.map(part => part === ':' ? null : parseInt(part));
        return [z, y, x];
    }

    /** Render based on slicekey. [z,:,:] -> xy plane, [:,y,:] -> xz plane, [:,:,x] -> yz plane */
    render() {
        const indices = this.viewport.dataset.indices;
        const sliceKeys = {
            '2d': [indices[0], null, null],
            'z': [indices[0], null, null],
            'y': [null, indices[1], null],
            'x': [null, null, indices[2]]
        }
        const sliceKey = sliceKeys[this.viewport.datasliceKey];
        const [z, y, x] = this.parseSliceKey(sliceKey);
        let sliceData;

        if (z !== null) {
            sliceData = new Uint8Array(this.width * this.height);
            for (let i = 0; i < this.width * this.height; i++) {
              sliceData[i] = this.roi.mask[z * this.width * this.height + i];
            }
            this.texture.image.data = sliceData;
            this.texture.image.width = this.width;
            this.texture.image.height = this.height;
          } else if (y !== null) {
            sliceData = new Uint8Array(this.width * this.depth);
            for (let i = 0; i < this.width; i++) {
              for (let j = 0; j < this.depth; j++) {
                sliceData[j * this.width + i] = this.roi.mask[j * this.width * this.height + y * this.width + i];
              }
            }
            this.texture.image.data = sliceData;
            this.texture.image.width = this.width;
            this.texture.image.height = this.depth;
          } else if (x !== null) {
            sliceData = new Uint8Array(this.height * this.depth);
            for (let i = 0; i < this.height; i++) {
              for (let j = 0; j < this.depth; j++) {
                sliceData[j * this.height + i] = this.roi.mask[j * this.width * this.height + i * this.width + x];
              }
            }
            this.texture.image.data = sliceData;
            this.texture.image.width = this.height;
            this.texture.image.height = this.depth;
          }
      
          this.texture.needsUpdate = true;
    }

    drawMask(viewport, pixel) {
        const dataset = viewport.dataset;
        const roi = dataset.roi;
        const indices = dataset.indices;
        console.log('update', pixel)
    
        const depthOptions = {
            'z': indices[0],
            'y': indices[1],
            'x': indices[2]
        }
        const is2D = this.roi.shape.length === 2;
        const depth = is2D ? 0 : depthOptions[viewport.datasliceKey];
            
        const value = 255;
        const brush = ROIOptions.brush;
        const height = this.height
        const width = this.width
        const dx = 1;
        const dy = width;
        const dz = height * width;
    
        let points = [];
    
        // Add point to points array
        if(brush === 1) {
            points.push(is2D ? {x: pixel.x, y: pixel.y } : {x: pixel.x, y: pixel.y, z: depth });
        }
        if(brush >= 2) {
            for (let i = 0; i < brush * brush; i++) {
                const db = - Math.floor(brush / 2);
                const x = pixel.x + i % brush + db;
                const y = (pixel.y + Math.floor(i / brush)) + db;
    
                const x2 = (pixel.x - x)*(pixel.x - x)
                const y2 = (pixel.y - y)*(pixel.y - y) 
                const r2 = (brush / 2)*(brush / 2)
                const isCircle = x2 + y2 <= r2
                if (isCircle)
                    points.push(is2D ? { x, y } : {x: x, y: y, z: depth });
            }
        }
    
        // Filter points that are out of bounds
        points = points.filter((point) => point.x >= 0 && point.y >= 0);
        points = points.filter((point) => point.x < width && point.y < height);
        
        // Add points to ROI
        points.forEach((point) => {
    
            let index = 0;
            if (this.roi.shape.length === 2) {
                index = point.x * dx + point.y * dy;
            }
            else if (datasliceKey === 'z') {
                index = point.x * dx + point.y * dy + point.z * dz;
            }
            else if (datasliceKey === 'x') {
                index = point.x * dx + point.z * dy + point.y * dz;
            }
            else if (datasliceKey === 'y') {
                index = point.z * dx + point.x * dy + point.y * dz;
            }
    
            roi.mask[index] = ROIOptions.useBrush ? value : 0;
        })

        return points;
    }
}

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

    let points = [];

    // Add point to points array
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

    // Filter points that are out of bounds
    points = points.filter((point) => point.x >= 0 && point.y >= 0);
    if (is2D) {
        points = points.filter((point) => point.x < roi.shape[1] && point.y < roi.shape[0]);
    }

    // Add points to ROI
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

        roi.mask[index] = ROIOptions.useBrush ? value : 0;
    })

    // Update texture
    const texture = create2DTexture(roi.mask, roi.shape);
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