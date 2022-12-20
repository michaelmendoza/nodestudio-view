import * as THREE from 'three';
import ChartControls from '../../components/Charts/ChartControls';
import { debounce } from '../../libraries/Utils';
import { ActionTypes } from '../AppReducers';

const raycaster = new THREE.Raycaster();

class Viewer {

    constructor(ref, dispatch) {
        this.id = crypto.randomUUID();
        this.ref = ref;
        this.dispatch = dispatch;

        this.dataset = null;
        this.mesh = null;
        this.roi = null;

        this.init();

        this.animate();
        window.addEventListener('pointermove', this.handlePointerMove.bind(this));
        window.addEventListener('resize', () => debounce(this.handleResize.bind(this), 100, 'viewport-resize-'+this.id));
    }
    
    init = () => {
        this.frustumSize = 100;
        const width = this.ref.current.offsetWidth;
        const height = this.ref.current.offsetHeight;
        const aspect = width / height;
        this.camera = new THREE.OrthographicCamera( this.frustumSize * aspect / - 2,  this.frustumSize * aspect / 2,  this.frustumSize / 2,  this.frustumSize / - 2, 1, 1000 )
        this.camera.position.z = 10;
        
        this.scene = new THREE.Scene();

        const size = 100;
        const divisions = 1;
        const gridHelper = new THREE.GridHelper( size, divisions );
        gridHelper.rotation.x = Math.PI / 2;
        gridHelper.position.z = 1;
        this.scene.add( gridHelper );

        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setSize( width, height );
        this.ref.current.appendChild( this.renderer.domElement );

        this.pointer = null;
        this.controls = new ChartControls( this.camera, this.renderer.domElement);
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
        this.roi.setDepth(inc_value);
    }

    decrement_index = (index = 0) => {
        if (!this.dataset) return;
        const value = this.dataset.indices[index];
        const dec_value = value - 1 < 0 ? 0 : value - 1;
        this.dataset.updateIndex(index, dec_value);
        this.roi.setDepth(dec_value);
    }

    raycast = () => {
        if (!this.pointer) return;
        if (!this.dataset) return;

        raycaster.setFromCamera( this.pointer, this.camera );
        // calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects( this.scene.children );
        if (intersects.length === 0) return;

        let pointerUV = null;
        for ( let i = 0; i < intersects.length; i ++ ) {
            if(intersects[i].uv)
                pointerUV = intersects[i].uv
        }

        if (!pointerUV) return;

        let pointerPixel = new THREE.Vector2();
        pointerPixel.x = pointerUV.x * this.dataset.dataset.shape[1];
        pointerPixel.y = pointerUV.y * this.dataset.dataset.shape[0];

        this.pointerUV = pointerUV;
        this.pointerPixel = pointerPixel;
        this.pointerPixel.x = Math.floor(pointerPixel.x);
        this.pointerPixel.y = this.dataset.dataset.shape[0] - Math.floor(pointerPixel.y) - 1; 

        if (this.dispatch)
            this.dispatch({ type: ActionTypes.SET_VIEWPORT, payload: this });
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
}

export default Viewer;