import * as THREE from 'three';
import ChartControls from '../../components/Charts/ChartControls';
import { ROIMaskRenderer } from '../../libraries/Render/ROIRenderer';
import { debounce } from '../../libraries/Utils';
import { GridHelper } from '../../libraries/MeshFactory';
import { DatasetRenderer } from '../../libraries/Render/DataRenderer';

const raycaster = new THREE.Raycaster();

export const ViewDict = {}; 

class Viewer {

    constructor(id, ref, dispatch, datasliceKey = 'z') {
        this.id = id;
        ViewDict[id] = this;

        this.ref = ref;
        this.dispatch = dispatch;

        this.datasliceKey = datasliceKey;
        this.dataset = null;
        this.mesh_2D = null;
        this.mesh_lightbox = null;
        this.roi_mesh_2D = null;
        this.roi_mesh_lightbox = {};
        this.grid_helper = null;

        this.roiMaskRenderer = null;

        this.init();

        this.animate();
        window.addEventListener('pointermove', this.handlePointerMove.bind(this));
        window.addEventListener('resize', () => debounce(this.handleResize.bind(this), 100, 'viewport-resize-'+this.id));
    }
    
    /** Render ROI masks for all views */
    static renderROI = () => {
        for (let key in ViewDict){
            const view = ViewDict[key];
            if (view.roiMaskRenderer) view.roiMaskRenderer.render();
        }
    }

    init = () => {
        this.frustumSize = 100;
        const width = this.ref.current.offsetWidth;
        const height = this.ref.current.offsetHeight;
        const aspect = width / height;
        this.camera = new THREE.OrthographicCamera( this.frustumSize * aspect / - 2,  this.frustumSize * aspect / 2,  this.frustumSize / 2,  this.frustumSize / - 2, 1, 1000 )
        this.camera.position.z = 10;
        
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setSize( width, height );
        this.ref.current.appendChild( this.renderer.domElement );

        this.pointer = null;
        this.controls = new ChartControls( this, this.camera, this.renderer.domElement);

        this.setGridHelper([100, 100]);
    }

    init_dataset = (dataset) => {
        this.dataset = dataset;
        this.datasetRenderer = new DatasetRenderer(this);
        this.roiMaskRenderer = new ROIMaskRenderer(this);
        this.controls.reset();
    }

    /** Renders dataset and ROI mask */
    render = async() => {
        if (this.datasetRenderer) await this.datasetRenderer.render();
        if (this.roiMaskRenderer) this.roiMaskRenderer.render();
    }

    animate = () => {
        requestAnimationFrame( this.animate );
        this.raycast();
        this.renderer.render( this.scene, this.camera );
    }

    increment_index = (index = 0) => {
        if (!this.dataset) return;
        const value = this.dataset.indices[index];
        const max_value = this.dataset.maxIndices[index];
        const inc_value = value + 1 > max_value ? max_value : value + 1;
        this.dataset.updateIndex(index, inc_value);
    }

    decrement_index = (index = 0) => {
        if (!this.dataset) return;
        const value = this.dataset.indices[index];
        const dec_value = value - 1 < 0 ? 0 : value - 1;
        this.dataset.updateIndex(index, dec_value);
    }

    raycast = () => {
        if (!this.pointer) return;
        if (!this.dataset) return;
        if (!this.dataset?.metadata?.shape) return;
        this.pointerPixel = new THREE.Vector2();
        
        raycaster.setFromCamera( this.pointer, this.camera );
        // calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects( this.scene.children );
        if (intersects.length === 0) return;

        let pointerUV = null;
        for ( let i = 0; i < intersects.length; i ++ ) {
            if(intersects[i].uv) {
                pointerUV = intersects[i].uv

                if (intersects[i]?.object?.name === 'roi') 
                    this.pointerTargetROI = intersects[i].object
            }
        }

        if (!pointerUV) return;

        // Get pointer pixel (x, y)
        const sliceShape = this.dataset.getSliceShape(this.datasliceKey);
        const sizeX = sliceShape[1]; 
        const sizeY = sliceShape[0];
        this.pointerPixel.x = Math.floor(pointerUV.x * sizeX);
        this.pointerPixel.y = sizeY - Math.floor(pointerUV.y * sizeY) - 1;

        // Get pixel value
        const { x, y } = this.pointerPixel;
        const dataset = this.dataset.getDataSlice(this.datasliceKey);
        const data = dataset.unscaledData;
        const index = x + y * sizeX;
        const value = data[index];
        const max = this.dataset.metadata.max;
        const min = this.dataset.metadata.min;
        const resolution = dataset.max;
        let org_value = value * (max - min) / resolution + min;
        if (this.dataset.file.type === 'dicom')
            org_value = Math.round(org_value);

        this.pointerPixel.value = org_value;
    }    

    handleResize = () => {
        var width = this.ref.current.clientWidth;
        var height = this.ref.current.clientHeight; 
        var aspect = width / height;
        console.log(`Resized to: ${width}, ${height}, ${aspect}`);

        // Update aspect ratio
        const camera = this.camera;
        camera.left = this.frustumSize * aspect / - 2;
        camera.right = this.frustumSize * aspect / 2;
        camera.top = this.frustumSize / 2;
        camera.bottom = this.frustumSize / - 2;
        camera.updateProjectionMatrix();

        // Update renderer
        this.renderer.setSize( width, height );
    }

    handlePointerMove = (event) => {
        if(!this.ref.current) return;

        var width = this.ref.current.clientWidth;
        var height = this.ref.current.clientHeight;
        var rect = this.ref.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const pointer = new THREE.Vector2();
        pointer.x = ( x / width ) * 2 - 1;
        pointer.y = - (( y / height ) * 2 - 1);

        this.pointer = pointer;
    }

    /** Adds a grid helper mesh to view scene. Updates if already exisits */
    setGridHelper = (size = [100, 100], divisions = 1) => {
        if (this.grid_helper) {
            this.scene.remove(this.grid_helper);
        }

        const gridHelper = new GridHelper( size, divisions );
        gridHelper.name = 'grid';
        gridHelper.rotation.x = Math.PI / 2;
        gridHelper.position.z = 1;
        this.scene.add( gridHelper );
        this.grid_helper = gridHelper;
    }
}

export default Viewer;