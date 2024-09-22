import { pixelArrayToBase64 } from '../../libraries/Data';

class ROIViewer {
    constructor(dataset) {
        this.dataset = dataset;
        this.roi = null;
        this.shape  = null; 

        this.init();
    }

    init = () => {
        // Note: Dataset shape -> [depth, height, width] and ROI texture needs -> [hieght, width, depth]
        const shape = this.dataset.metadata.shape; // i.e. [160, 640, 640]
        this.shape = [...shape];
        
        let length;
        if (this.shape.length === 2) {
            length = this.shape[0] * this.shape[1]
        }
        else {
            // [depth, height, width] --> [depth, width, height]
            this.shape[0] = shape[1];
            this.shape[1] = shape[2];
            this.shape[2] = shape[0];
            length = this.shape[0] * this.shape[1] * this.shape[2]; 
        }

        // Initalize ROI layer        
        this.roi = new Uint8Array(length);
    }

    export = async () => {
        const data = this.roi;
        const shape = this.shape;

        const encoded = await pixelArrayToBase64(data);
        return { data: encoded, shape };
    }
}

export default ROIViewer;