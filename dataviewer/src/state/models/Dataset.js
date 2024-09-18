import { generateDefaultIndices, generateKeyFromIndices } from "../../libraries/ArrayIndexer";
import { decodeDataset, scaleDataset } from "../../libraries/Data";
import APIDataService from "../../services/APIDataService";
import Contrast from './Contrast';
import ROIViewer from "./ROIViewer";

export const VIEW_OPTIONS = ['2D View', '3D View', 'Lightbox'];

class Dataset {

    constructor(file) {
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

        this.shape = file.shape;
        this.ndim = this.shape.length;
        this.indices = this.shape?.map(s => Math.floor(s / 2));
        this.maxIndices = this.shape.map(s => s - 1);
        this.viewIndices = this.indices.length === 2 ? [0, 1] : [1, 2];
        
        this.key = generateKeyFromIndices(this.shape, this.indices, this.viewIndices);
        this.dims = file.dims
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

    getSliceShape = (datasliceKey) => {
        const sliceShape = ({
            z: [this.metadata.shape[1], this.metadata.shape[2]],
            x: [this.metadata.shape[0], this.metadata.shape[1]],
            y: [this.metadata.shape[0], this.metadata.shape[2]],
            lightbox: [this.metadata.shape[1], this.metadata.shape[2]], 
            '2d': [this.metadata.shape[0], this.metadata.shape[1]]
        }[datasliceKey]);

        return sliceShape;
    }

    getSliceDepth = (datasliceKey) => {
        const depth = ({
            z: this.indices[0],
            y: this.indices[2],
            x: this.indices[1],
            lightbox: this.indices[0],
            '2d': 1
        }[datasliceKey]);

        return depth;
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
            this.key = generateKeyFromIndices(this.metadata.shape, this.indices, this.viewIndices);
            this.dims = "['Sli','Lin','Col']";
            this.dataset = await fetch(this.key);
            this.dataslices.z = this.dataset;
        }
        
        this.update++;
    }
}

export default Dataset;