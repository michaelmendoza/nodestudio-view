import { pixelArrayToBase64, reshape1DArray, swapArrayAxes, unpackBitPackedBase64 } from '../../libraries/Data';
import APIDataService from '../../services/APIDataService';

class ROIViewer {
    constructor(dataset) {
        this.dataset = dataset;
        this.roi = null;
        this.shape  = null; 
    }

    fetchROI = async () => {
        const data = await APIDataService.getROIMaskSlice(this.dataset.file.id, '[:]');
        let { mask, shape, dtype, packed_shape } = data;
        let maskArray = unpackBitPackedBase64(mask, shape);

        /*
        if (shape.length === 3) {
            // [depth, height, width] --> [height, width, depth]
            const newShape = [1, 2, 0]
            const maskROI = swapArrayAxes(maskArray, shape, newShape);
            maskArray = maskROI.array;
            shape = maskROI.shape;
        }
        */
       
        this.roi = maskArray;
        this.shape = shape;

        // Now you can use the unpacked mask
        console.log('Mask shape:', shape);
        
        // If you need it as a multidimensional array:
        //const reshapedMask = reshape1DArray(unpackedMask, shape);
        //console.log('Reshaped mask:', reshapedMask);
    }

    export = async () => {
        const data = this.roi;
        const shape = this.shape;

        const encoded = await pixelArrayToBase64(data);
        return { data: encoded, shape };
    }
}

export default ROIViewer;