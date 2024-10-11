import * as THREE from 'three';
import { createDataTextureMesh, getSliceDimensions } from './Renderer';
import { generateKeyFromIndices } from '../ArrayIndexer';
import { getViewIndices } from '../../state/models/Dataset';

export class LightboxRenderer {
    constructor(viewport) {
        this.viewport = viewport;
        this.dataset = viewport.dataset;
        this.roi = viewport.dataset.roi;
        this.datasetTextures = [];
        this.roiTextures = [];
        this.init();
    }

    init() {
        const [depth, height, width] = getSliceDimensions(this.dataset.metadata.shape, 'z');
        this.depth = depth;
        this.height = height;
        this.width = width;

        const gridSize = Math.ceil(Math.sqrt(this.depth));
        this.gridSize = gridSize;

        const planeWidth = 100 / gridSize;
        const planeHeight = planeWidth * (this.height / this.width);

        for (let i = 0; i < this.depth; i++) {
            const blankdata = new Uint8Array(this.height * this.width).fill(0);
            
            // Dataset texture
            const datasetTexture = createDataTextureMesh(blankdata, this.height, this.width, `dataslice-${i}`, this.viewport.scene);
            this.datasetTextures.push(datasetTexture);

            // ROI texture
            const roiTexture = createDataTextureMesh(blankdata, this.height, this.width, `roi-${i}`, this.viewport.scene);
            this.roiTextures.push(roiTexture);

            // Position the meshes
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            const x = (col - (gridSize - 1) / 2) * planeWidth;
            const y = ((gridSize - 1) / 2 - row) * planeHeight;

            const datasetMesh = this.viewport.scene.getObjectByName(`dataslice-${i}`);
            const roiMesh = this.viewport.scene.getObjectByName(`roi-${i}`);

            datasetMesh.position.set(x, y, 0);
            roiMesh.position.set(x, y, 0.01); // Slightly in front of the dataset mesh
        }
    }

    async render() {
        const { indices } = this.dataset;
        const { shape } = this.dataset.metadata;
        const viewIndices = getViewIndices(shape, 'z');

        for (let i = 0; i < this.depth; i++) {
            const tempIndices = [...indices];
            tempIndices[0] = i;
            const key = generateKeyFromIndices(shape, tempIndices, viewIndices);
            
            // Render dataset slice
            const sliceData = await this.getSliceData(key);
            this.updateTexture(this.datasetTextures[i], sliceData);

            // Render ROI slice
            const roiSliceData = this.getROISliceData(i);
            this.updateTexture(this.roiTextures[i], roiSliceData);
        }
    }

    async getSliceData(key) {
        const sliceData = await this.dataset.fetchDataset(key);
        return sliceData.data;
    }

    getROISliceData(sliceIndex) {
        const sliceSize = this.width * this.height;
        const sliceData = new Uint8Array(sliceSize);
        sliceData.set(this.roi.mask.subarray(sliceIndex * sliceSize, (sliceIndex + 1) * sliceSize));
        return sliceData;
    }

    updateTexture(texture, sliceData) {
        texture.image.data = sliceData;
        texture.image.width = this.width;
        texture.image.height = this.height;
        texture.needsUpdate = true;
    }
}