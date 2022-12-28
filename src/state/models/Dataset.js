import { generateDefaultIndices, generateKeyFromIndices } from "../../libraries/ArrayIndexer";
import { decodeDataset, scaleDataset } from "../../libraries/Data";
import APIDataService from "../../services/APIDataService";

import * as THREE from 'three';
import { Chart2D_FragmentShader, Chart2D_VertexShader } from "../../components/Charts/ChartShaders";
import { throttle } from "../../libraries/Utils";
import Contrast from './Contrast';
import ROIViewer from "../../components/Charts/ROIViewer";

const viewOptions = ['2D View', '3D View', 'Lightbox'];

class Dataset {

    constructor(file, viewport) {
        this.file = file;
        this.metadata = null;
        this.dataset = null; // TODO: Refactor to dataslice 
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
        if (this.viewMode === 'Lightbox') {
            this.key = generateKeyFromIndices(this.metadata.shape, this.indices, [0,1,2]);      
            this.dims = "['Lin','Col','Sli']"; 
        }
        else { // 2D View
            this.key = generateKeyFromIndices(this.metadata.shape, this.indices);
            this.dims = "['Sli','Lin','Col']";
        }
        
        let data = await APIDataService.getFileData(this.file.id, this.key, this.dims);
        if (data.isEncoded) {
            data = decodeDataset({ data: data.data, shape: data.shape, min: data.min, max: data.max, dtype: data.dtype })
        } 

        this.dataset = data;
        this.dataset = scaleDataset({ data: data.data, shape: data.shape, min: data.min, max: data.max, dtype: data.dtype, useContrast:true, contrast: this.contrast })
        this.update++;
    }
}

export default Dataset;