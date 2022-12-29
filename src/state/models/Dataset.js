import { generateDefaultIndices, generateKeyFromIndices } from "../../libraries/ArrayIndexer";
import { decodeDataset, scaleDataset } from "../../libraries/Data";
import APIDataService from "../../services/APIDataService";
import Contrast from './Contrast';
import ROIViewer from "../../components/Charts/ROIViewer";

export const VIEW_OPTIONS = ['2D View', '3D View', 'Lightbox'];

class Dataset {

    constructor(file, viewport) {
        this.file = file;
        this.metadata = null;
        this.dataset = null; // TODO: Refactor to dataslice 
        this.dataslices = {
            x: null,
            y: null,
            z: null,
            lightbox: null
        }
        this.viewMode = '2D View';

        this.indices = [0,0,0];
        this.maxIndices = [1,1,1];

        this.key = '[0,:,:]';
        this.dims = "['Sli','Lin','Col']";
        this.update = 0;

        this.contrast = new Contrast();
        this.roi = null;
    }

    /** Initalize dataset with metadata */
    init = async (viewMode) => {
        this.setViewMode(viewMode);
        await this.fetchMetadata();
        await this.fetchDataset();
        this.roi = new ROIViewer(this);
    }

    getData = (viewKey = 'z') => {
        if (this.viewMode === '2D View') return this.dataset;
        if (this.viewMode === '3D View') return this.dataslices[viewKey]
        if (this.viewMode === 'Lightbox') return this.dataslices.lightbox;
    }

    setViewMode = (viewMode) => {
        this.viewMode = viewMode;
    }

    updateIndex = (index, value) => {
        const _indices = [...this.indices];
        _indices[index] = value;
        this.indices = _indices;
    }

    /** Fetches Metadata from API */
    fetchMetadata = async () => {
        this.metadata = await APIDataService.getFileMetadata(this.file.id);
        this.indices = generateDefaultIndices(this.metadata.shape);
        this.maxIndices = this.metadata.shape.map((value) => value - 1);
    }

    /** Fetches Dataset from API */
    fetchDataset = async () => {
        const fetch = async (sliceKey) => {
            let data = await APIDataService.getFileData(this.file.id, sliceKey, this.dims);
            if (data.isEncoded) {
                data = decodeDataset({ data: data.data, shape: data.shape, min: data.min, max: data.max, dtype: data.dtype })
            } 
    
            return scaleDataset({ data: data.data, shape: data.shape, min: data.min, max: data.max, dtype: data.dtype, useContrast:true, contrast: this.contrast })
        }

        if (this.viewMode === 'Lightbox') {
            this.key = generateKeyFromIndices(this.metadata.shape, this.indices, [0,1,2]);      
            this.dims = "['Lin','Col','Sli']"; 
            this.dataset = await fetch(this.key);
            this.dataslices.lightbox = this.dataset;
        }
        else if (this.viewMode === '3D View') {
            const key0 = generateKeyFromIndices(this.metadata.shape, this.indices, [1, 2]);
            const key1 = generateKeyFromIndices(this.metadata.shape, this.indices, [0, 2]);
            const key2 = generateKeyFromIndices(this.metadata.shape, this.indices, [0, 1]);
            this.dims = "['Lin','Col','Sli']"; 
            
            this.dataslices.z = await fetch(key0);
            this.dataslices.x = await fetch(key1);
            this.dataslices.y = await fetch(key2);
        }
        else { // 2D View
            this.key = generateKeyFromIndices(this.metadata.shape, this.indices);
            this.dims = "['Sli','Lin','Col']";
            this.dataset = await fetch(this.key);
        }
        
        this.update++;
    }
}

export default Dataset;