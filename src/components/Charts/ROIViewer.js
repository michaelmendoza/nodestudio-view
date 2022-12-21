import * as THREE from 'three';
import { pixelArrayToBase64 } from '../../libraries/Data';
import { throttle } from '../../libraries/Utils';
import { Chart2D_VertexShader, ROI_FragmentShader } from "./ChartShaders";

const planeWidth = 100;
const planeHeight = 100;

class ROIViewer {
    constructor(viewer) {
        this.viewer = viewer;
        this.roi = null;
        this.mesh = null;
        this.shape  = null; 
        this.useBrush = true; // Is brush or eraser 
        this.brush = 5;
        this.mousedown = false;

        this.init();
        this.render();
    }

    updatePixel = (p) => {
        console.log('update', p)
        const x = p.x;
        const y = p.y;

        const value = 255;
        const brush = this.brush;
        const height = this.shape[0];
        const width = this.shape[1];
        const dz = height * width * this.getDepth();

        if(brush === 1) {
            this.roi[p.x + width * p.y + dz] = this.useBrush ? value : 0;
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
                    this.roi[x + dy + dz] = this.useBrush ? value : 0;
            }
        }

        const texture = this.create2DTexture();
        this.mesh.material.uniforms[ "diffuse" ].value = texture;
    }

    init = () => {
        // Note: Dataset shape -> [depth, height, width] and ROI texture needs -> [hieght, width, depth]
        const shape = this.viewer.dataset.metadata.shape; // i.e. [160, 640, 640]
        this.shape = [...shape];

        if(shape[2] === undefined)  {
            shape[2] = 1;
            return;
        }

        this.shape[0] = shape[1];
        this.shape[1] = shape[2];
        this.shape[2] = shape[0];

        // Initalize ROI layer        
        const length = this.shape[0] * this.shape[1] * this.shape[2]; 
        this.roi = new Uint8Array(length);
    }

    render = () => {
        const texture = this.create2DTexture()
    
        if (this.mesh) {
            this.mesh.material.uniforms[ "diffuse" ].value = texture;
        }
        else {

            const material = this.createMaterial(texture);
            const geometry = new THREE.PlaneGeometry( planeWidth, planeHeight );
            const mesh = new THREE.Mesh( geometry, material );
    
            this.viewer.scene.add( mesh );
            this.mesh = mesh;            
        }
    }

    remove = () => {
        console.log('Remove ROI');
        this.viewer.scene.remove(this.mesh);
    }

    create2DTexture = () => {
        const data = this.roi;
        const shape = this.shape;
        const texture = new THREE.DataArrayTexture( data, shape[0], shape[1], shape[2]);
        texture.format = THREE.RedFormat;
        texture.needsUpdate = true;
        return texture;
    }

    createMaterial = (texture) => {

        const depth = this.viewer.dataset.indices[0];

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

    getDepth = () => {
        if(!this?.mesh?.material?.uniforms[ "depth" ])
            return 0;
        return this.mesh.material.uniforms[ "depth" ].value
    }

    setDepth = (depth) => {
        depth = depth < 0 ? 0 : depth;
        depth = depth > this.shape[2] - 1 ? this.shape[2] - 1 : depth;
        this.mesh.material.uniforms[ "depth" ].value = depth;
    }

    export = async () => {
        const data = this.roi;
        const shape = this.shape;

        const encoded = await pixelArrayToBase64(data);
        return { data: encoded, shape };
    }
}

export default ROIViewer;