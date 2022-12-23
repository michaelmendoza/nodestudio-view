import { throttle } from '../../libraries/Utils';

export const STATE = {
    NONE: 0,
    ZOOM: 1,
    PAN: 2,
    ROI: 3
};

const mousestate = { left: STATE.ROI };

export const setMouseState = (state) => {
    mousestate.left = state;
}

class ChartControls {

    constructor(viewer, camera, domElement) {
        this.viewer = viewer;
        this.camera = camera;
        this.domElement = domElement;
		this.domElement.style.touchAction = 'none'; // disable touch scroll

        // Set to false to disable this control
        this.enabled = true;

        // State properties
        this.state = STATE.NONE;

        // Pan properties
        this.sensitivity = 0.2;

        // Zoom properties
        this.enableZoom = true;
        this.zoomSpeed = 1.0;
		this.minZoom = 0;
		this.maxZoom = Infinity;
        this.position0 = this.camera.position.clone();
		this.zoom0 = this.camera.zoom;

        this.domElement.addEventListener( 'contextmenu', this.onContextMenu );
        this.domElement.addEventListener( 'mousedown', this.handleMouseDown );
        this.domElement.addEventListener( 'mouseup', this.handleMouseUp );
        this.domElement.addEventListener( 'mouseleave', this.handleMouseUp );
        this.domElement.addEventListener( 'pointerdown', this.onPointerDown );
		this.domElement.addEventListener( 'pointercancel', this.handleMouseUp );
        this.domElement.addEventListener( 'mousemove', this.onMouseMove );
		this.domElement.addEventListener( 'wheel', this.onMouseWheel.bind(this), { passive: false } );
    }

    reset = () => {
        this.camera.position.copy( this.position0 );
        this.camera.zoom = this.zoom0;
        this.state = STATE.NONE;
    };

    onContextMenu = (event) => { 
        event.preventDefault();
    }

    handleMouseDown = (event) => {
        if(event.button === 2) return;

        this.state = mousestate.left;
        if (this.state === STATE.ROI) {
            throttle(() => this.viewer.dataset.roi.updatePixel(this.viewer.pointerPixel), 10, 'ROI-Viewer');
        }
    }

    handleMouseUp = (event) => {
        this.state = STATE.NONE;
    }

    onPointerDown = () => { 

    }

    onMouseMove = (event) => {
        event.preventDefault();

        if (this.state === STATE.PAN) {
            this.camera.position.x -= this.sensitivity * (1 / this.camera.zoom) * event.movementX;
            this.camera.position.y += this.sensitivity * (1 / this.camera.zoom) * event.movementY;
            this.camera.updateProjectionMatrix();
        }
        if (this.state === STATE.ROI) {
            this.viewer.dataset.roi.updatePixel(this.viewer.pointerPixel);
        }
        if (this.state === STATE.ZOOM) {
            const dz = this.sensitivity * (event.movementY + event.movementX);
            if ( dz < 0 ) {
                this.dollyIn( this.getZoomScale() );
            } else if ( dz > 0 ) {
                this.dollyOut( this.getZoomScale() );
            }
        }
    }

    onMouseWheel = (event) => { 
        event.preventDefault();
        if ( event.deltaY < 0 ) {
            this.dollyIn( this.getZoomScale() );

        } else if ( event.deltaY > 0 ) {
            this.dollyOut( this.getZoomScale() );
        }
    }

    getZoomScale= () => {
        return Math.pow( 0.95, this.zoomSpeed );
    }


    dollyIn = (dollyScale) => {
        if ( this.camera.isOrthographicCamera ) {
            this.camera.zoom = Math.max( this.minZoom, Math.min( this.maxZoom, this.camera.zoom / dollyScale ) );
            this.camera.updateProjectionMatrix();
        }
    }

    dollyOut = (dollyScale) => {
        if ( this.camera.isOrthographicCamera ) {
            this.camera.zoom = Math.max( this.minZoom, Math.min( this.maxZoom, this.camera.zoom * dollyScale ) );
            this.camera.updateProjectionMatrix();
        }
    }
}

export default ChartControls;