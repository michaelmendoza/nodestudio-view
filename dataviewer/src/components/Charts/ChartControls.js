import { throttle } from '../../libraries/Utils';
import APIDataService from '../../services/APIDataService';
import { ROIOptions, ROIStats } from '../../state/models/ROI';
import { ActionTypes, Dispatch } from '../../state';
import Viewer from '../../state/models/Viewer';

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

export const cache = {
    pixels : {}
}

export const updatePixelCache = (points) => {
    if (points.length === 0) return;

    const is2D = points[0].z === undefined;
    points = points.map((point) => is2D ? [point.y, point.x,] : [point.z, point.y, point.x]);
    points.forEach((point) => { 
        const key = is2D ? point[0]+ ',' + point[1] : point[0] + ',' + point[1] + ',' + point[2];
        cache.pixels[key] = point;
    })
}

export const getPixelCache = () => {
    return Object.values(cache.pixels);
}

export const clearPixelCache = () => {
    cache.pixels = {};
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

    reset = (factor = 1) => {
        this.camera.position.copy( this.position0 );
        this.camera.zoom = this.zoom0 * factor;
        this.state = STATE.NONE;
        this.camera.updateProjectionMatrix();
    };

    onContextMenu = (event) => { 
        event.preventDefault();
    }

    handleMouseDown = (event) => {
        if(!this.viewer.dataset) return;
        if(event.button === 2) return;

        this.state = mousestate.left;
        if (this.state === STATE.ROI) {
            throttle(() => { 
                const pixels = this.viewer.roiMaskRenderer.drawMask(this.viewer, this.viewer.pointerPixel);            
                Viewer.renderROI();
                updatePixelCache(pixels);
            }, 10, 'ROI-Viewer');
        }
    }

    handleMouseUp = async(event) => {
        this.state = STATE.NONE;

        // Send ROI update to dataserver and clear cache
        if (Object.keys(cache.pixels).length > 0) {
            const datasetID = this.viewer.dataset.file.id;
            const indices = getPixelCache();
            const stats = await APIDataService.updateROIMask(datasetID, indices, ROIOptions.useBrush); 
            clearPixelCache();
            Dispatch({ type: ActionTypes.SET_ROISTATS, payload: new ROIStats(stats) });
        }
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
            const pixels = this.viewer.roiMaskRenderer.drawMask(this.viewer, this.viewer.pointerPixel);
            Viewer.renderROI();
            updatePixelCache(pixels);
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