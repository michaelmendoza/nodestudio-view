import { generateDefaultIndices, generateKeyFromIndices } from "../../libraries/ArrayIndexer";
import { decodeDataset, scaleDataset } from "../../libraries/Data";
import APIDataService from "../../services/APIDataService";
import Contrast from './Contrast';
import ROIViewer from "./ROIViewer";

export const VIEW_OPTIONS = ['2D View', '3D View', 'Lightbox'];

/** Get viewIndices for a given shape anddatasliceKey */
export const getViewIndices = (shape, datasliceKey) => {
    let viewIndices;
    if (shape.length === 2) {
        viewIndices = [0, 1];
    }
    else {
        const viewOptions = {
            'z': [1,2],
            'y': [0,2],
            'x': [1,0]
        }
        viewIndices = viewOptions[datasliceKey];
    }
    return viewIndices;
}

export class Dataset {

    constructor(file) {
        this.file = file; // TODO: Refactor and combine file and metadata into one object
        this.metadata = null;
        //this.dataset = null; // TODO: Refactor to dataslice 
        this.datacache = {} // Cache holds data slices by key i.e. '[:,40,:]'
        //this.dataslices = {
        //    x: null,
        //    y: null,
        //    z: null,
        //    lightbox: null
        //}
        this.viewMode = '2D View';

        this.ndim = 0;
        this.shape = [];
        this.indices = []
        this.maxIndices = []
        this.viewIndices = [0, 1];
        
        this.key = generateKeyFromIndices(this.shape, this.indices, this.viewIndices);
        this.dims = file.dims
        this.update = 0;

        this.contrast = new Contrast();
        this.roi = null;
        this.views = [] // Viewport viewers reference to this dataset
    }

    /** Initalize dataset with metadata */
    init = async (viewMode) => {
        this.setViewMode(viewMode);
        await this.fetchMetadata();
        this.roi = new ROIViewer(this);
        await this.roi.fetchROI();
    }

    getDataSlice = (datasliceKey) => {
        const viewIndices = getViewIndices(this.metadata.shape, datasliceKey);
        const sliceKey = generateKeyFromIndices(this.metadata.shape, this.indices, viewIndices);
        const dataSlice = this.datacache[sliceKey];
        return dataSlice
    }

    /*
    getData = (viewKey = 'z') => {
        if (this.viewMode === '2D View') return this.dataset;
        if (this.viewMode === '3D View') return this.dataslices[viewKey]
        if (this.viewMode === 'Lightbox') return this.dataslices.lightbox;
    }
    */
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
        this.ndim = this.metadata.shape.length;
        this.shape = this.metadata.shape;
        this.indices = generateDefaultIndices(this.shape);
        this.maxIndices = this.metadata.shape.map((value) => value - 1);
        this.viewIndices = this.indices.length === 2 ? [0, 1] : [1, 2];
    }

    /** Fetches Dataset from API */
    fetchDataset = async (sliceKey) => {
        const fetch = async (sliceKey) => {
            // Fetch data from API
            let data = await APIDataService.getFileData(this.file.id, sliceKey);
            if (data.isEncoded) {
                data = decodeDataset({ ...data })
            } 
    
            return scaleDataset({ ...data, contrast: this.contrast })
        }

        let dataset;
        // Check cache for sliceKey
        if (this.datacache[sliceKey]) {
            dataset = this.datacache[sliceKey];

            // If contrast has changed, re-scale dataset 
            if (dataset.contrast.level !== this.contrast.level || dataset.contrast.window !== this.contrast.window) {
                dataset = scaleDataset({ ...dataset, data: dataset.unscaledData, contrast: this.contrast })
                this.datacache[sliceKey] = dataset;
            }
        }
        else {
            // If not in cache, fetch and cache
            dataset = await fetch(sliceKey);
            this.datacache[sliceKey] = dataset;
        }

        this.update++;
        return dataset;

        /*
        let dataset;
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
            //this.dims = "['Sli','Lin','Col']";
            if (this.datacache[this.key]) {
                dataset = this.datacache[this.key];
            }
            else {
                dataset = await fetch(this.key);
                this.dataslices.z = dataset;
                this.datacache[this.key] = dataset;
            }
        }
        */
    }
}

export default Dataset;