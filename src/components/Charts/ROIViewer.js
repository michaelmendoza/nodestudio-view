import * as THREE from 'three';
import { throttle } from '../../libraries/Utils';
import { Chart2D_VertexShader, ROI_FragmentShader } from "./ChartShaders";

const planeWidth = 100;
const planeHeight = 100;

class ROIViewer {
    constructor(viewer) {
        this.viewer = viewer;
        this.roi = null;
        this.mesh = null;
        this.shape  = viewer.dataset.dataset.shape; //viewer.dataset.metadata.shape;
        this.useBrush = true; // Is brush or eraser 
        this.brush = 5;
        this.mousedown = false;

        this.init();
        this.render();

        this.viewer.ref.current.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.viewer.ref.current.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.viewer.ref.current.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.viewer.ref.current.addEventListener('mouseleave', this.handleMouseUp.bind(this));
        this.viewer.ref.current.addEventListener('pointercancel', this.handleMouseUp.bind(this));
    }

    handleMouseDown = (event) => {
        console.log('ROI Activate')
        this.mousedown = true;
        this.updatePixel(this.viewer.pointerPixel);
    }

    handleMouseMove = (event) => {
        if (this.mousedown)
         throttle(() => this.updatePixel(this.viewer.pointerPixel), 10, 'ROI-Viewer');
    }

    handleMouseUp = (event) => {
        console.log('ROI Deactivate');
        this.mousedown = false;
    }

    updatePixel = (p) => {
        const x = p.x;
        const y = p.y;
        console.log(x + y * this.shape[1]);

        const value = 255;
        const brush = this.brush;
        const width = this.shape[1];
        if(brush === 1) {
            this.roi[width * p.y + p.x] = value;
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
                    this.roi[x + dy] = this.useBrush ? value : 0;
            }
        }

        const texture = this.create2DTexture();
        this.mesh.material.uniforms[ "diffuse" ].value = texture;
    }

    init = () => {
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

    create2DTexture = () => {
        const data = this.roi;
        const shape = this.shape;
        if(shape[2] === undefined) shape[2] = 1;

        const texture = new THREE.DataArrayTexture( data, shape[0], shape[1], shape[2] );
        texture.format = THREE.RedFormat;
        texture.needsUpdate = true;
        return texture;
    }

    createMaterial = (texture) => {

        const material = new THREE.ShaderMaterial( {
            uniforms: {
                diffuse: { value: texture },
                depth: { value: 0 },
                size: { value: new THREE.Vector2( planeWidth, planeHeight ) }
            },
            vertexShader: Chart2D_VertexShader,
            fragmentShader: ROI_FragmentShader,
            glslVersion: THREE.GLSL3
        } );
        material.transparent = true;
        return material;
    }

}

export default ROIViewer;
