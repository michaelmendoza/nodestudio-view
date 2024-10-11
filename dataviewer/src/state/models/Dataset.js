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
        this.metadata = {
            shape: [],
            dims: [],
            min: 0,
            max: 0,
            isComplex: false
        };
        this.datacache = {}; // Cache holds data slices by key i.e. '[:,40,:]'
        this.indices = [];
        this.maxIndices = [];
        this.update = 0;
        this.viewMode = '2D View';

        this.contrast = new Contrast();
        this.roi = null;
    }

    /** Initalize dataset with metadata */
    init = async (viewMode) => {
        this.setViewMode(viewMode);
        await this.fetchMetadata();
        this.roi = new ROIViewer(this);
        await this.roi.fetchROI();
    }

    /** Retieves a data slice for a given datasliceKey from datacache */
    getDataSlice = (datasliceKey) => {
        const viewIndices = getViewIndices(this.metadata.shape, datasliceKey);
        const sliceKey = generateKeyFromIndices(this.metadata.shape, this.indices, viewIndices);
        const dataSlice = this.datacache[sliceKey];
        if (!dataSlice) throw new Error(`Data slice not found: ${sliceKey}`);
        return dataSlice
    }

    getSliceShape = (datasliceKey) => {
        const shape = this.metadata.shape;
        let sliceShape = ({
            z: [shape[1], shape[2]],
            y: [shape[0], shape[2]],
            x: [shape[0], shape[1]],
            lightbox: [shape[1], shape[2]]
        }[datasliceKey]);

        if (shape.length == 2)  {
            sliceShape = [shape[0], shape[1]];
        }

        return sliceShape;
    }

    getSliceDepth = (datasliceKey) => {
        let depth = ({
            z: this.indices[0],
            y: this.indices[2],
            x: this.indices[1],
            lightbox: this.indices[0]
        }[datasliceKey]);

        if (shape.length == 2)  {
            depth = 1
        }

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
    }
}

export default Dataset;