import { ROIOptions } from '../../state/models/ROI';
import { createDataTextureMesh, getSliceDimensions } from './Renderer';

export class ROIMaskRenderer {
    constructor(viewport) {
        this.viewport = viewport;
        this.dataset = viewport.dataset;
        this.roi = viewport.dataset.roi;

        [this.depth, this.height, this.width] = getSliceDimensions(this.roi.shape, this.viewport.datasliceKey);
        this.texture = createDataTextureMesh(this.roi.mask, this.height, this.width, 'roi', this.viewport.scene);
    }

    render() {
        const { indices } = this.dataset;
        const { shape } = this.dataset.metadata;
        const { datasliceKey } = this.viewport;
        const is2D = shape.length === 2;

        const sliceIndex = is2D ? 0 : indices[['z', 'y', 'x'].indexOf(datasliceKey)];
        const sliceData = this.getSliceData(sliceIndex, datasliceKey);

        this.updateTexture(sliceData);
    }

    getSliceData(sliceIndex, datasliceKey) {
        const sliceSize = this.width * this.height;
        const sliceData = new Uint8Array(sliceSize);

        if (datasliceKey === 'z' || this.roi.shape.length === 2) {
            sliceData.set(this.roi.mask.subarray(sliceIndex * sliceSize, (sliceIndex + 1) * sliceSize));
        } 
        else {
            for (let j = 0; j < this.height; j++) {
                for (let i = 0; i < this.width; i++) {
                    let index;
                    if (datasliceKey === 'y') index = i + sliceIndex * this.width + j * this.width * this.depth;
                    if (datasliceKey === 'x') index = sliceIndex + i * this.depth + j * this.width * this.depth;
                    sliceData[i + j * this.width] = this.roi.mask[index];
                }
            }
        }

        return sliceData;
    }

    updateTexture(sliceData) {
        this.texture.image.data = sliceData;
        this.texture.image.width = this.width;
        this.texture.image.height = this.height;
        this.texture.needsUpdate = true;
    }

    drawMask(viewport, pixel) {
        const { indices } = this.dataset;
        const { datasliceKey } = viewport;
        const is2D = this.roi.shape.length === 2;
        const depth = is2D ? 0 : indices[['z', 'y', 'x'].indexOf(datasliceKey)];

        const points = this.getPointsToDraw(pixel, depth);
        this.updateROIMask(points);

        this.render();
        return points;
    }

    getPointsToDraw(pixel, depth) {
        const { brush } = ROIOptions;
        const points = [];
        const { datasliceKey } = this.viewport;
        const is2D = this.roi.shape.length === 2;

        const addPoint = (x, y) => {
            // Check if point is outside of bounds
            if (x < 0 && y < 0 && x >= this.width && y >= this.height) { 
                return;
            }
            
            // Get point 
            let point;
            const convert2Dtoto3D = {
                z: { x, y, z: depth },
                y: { x, z: y, y: depth },
                x: { y: x, z: y, x: depth }
            }
            point = convert2Dtoto3D[datasliceKey];
            if (is2D) point = { x, y }

            points.push(point)
        };

        if (brush === 1) {
            addPoint(pixel.x, pixel.y);
        } else {
            // Finds points in a circle around the pixel
            for (let i = 0; i < brush * brush; i++) {
                const db = - Math.floor(brush / 2);
                const x = pixel.x + i % brush + db;
                const y = (pixel.y + Math.floor(i / brush)) + db;
    
                const x2 = (pixel.x - x)*(pixel.x - x)
                const y2 = (pixel.y - y)*(pixel.y - y) 
                const r2 = (brush / 2)*(brush / 2)
                const isCircle = x2 + y2 <= r2
                if (isCircle)
                    addPoint(x, y);
            }
        }

        return points;
    }

    updateROIMask(points) {
        const { mask } = this.roi;
        const value = ROIOptions.useBrush ? 255 : 0;

        points.forEach(point => {
            const index = this.getIndexFromPoint(point);
            if (index !== -1) {
                mask[index] = value;
            }
        });
    }

    getIndexFromPoint(point) {
        const { x, y, z } = point;
        let depth, height, width, dims;

        if (this.roi.shape.length === 2) {
            [height, width] = this.roi.shape;
            if (x >= 0 && x < width && y >= 0 && y < height) {
                return x + y * width;
            }
        } else {
            [depth, height, width, ...dims] = this.roi.shape;
            if (x >= 0 && x < width && 
                y >= 0 && y < height && 
                z >= 0 && z < depth) {
                return x + y * width + z * width * height;
            }
        }
        return -1; // Return -1 if the point is out of bounds
    }
}