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
        } else {
            for (let i = 0; i < this.width; i++) {
                for (let j = 0; j < this.depth; j++) {
                    const srcIndex = datasliceKey === 'y'
                        ? j * this.width * this.height + sliceIndex * this.width + i
                        : j * this.width * this.height + i * this.width + sliceIndex;
                    sliceData[j * this.width + i] = this.roi.mask[srcIndex];
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
        const { brush, useBrush } = ROIOptions;
        const points = [];
        const { datasliceKey } = this.viewport;
        const is2D = this.roi.shape.length === 2;

        const addPoint = (x, y) => {1   
            if (x < 0 && y < 0) { 
                return;
            }
            
            if (is2D && x < this.width && y < this.height) {
                points.push({ x, y });
                return;
            }

            let point;
            switch (datasliceKey) {
                case 'z':
                    if (x < this.width && y < this.height) {
                        point = { x, y, z: depth };
                    }
                    break;
                case 'y':
                    if (x < this.width && y < this.depth) {
                        point = { x, z: y, y: depth };
                    }
                    break;
                case 'x':
                    if (x < this.height && y < this.depth) {
                        point = { y: x, z: y, x: depth };
                    }
                    break;
            }
            if (point) points.push(point);  
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
        if (this.roi.shape.length === 2) {
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                return x + y * this.width;
            }
        } else {
            if (x >= 0 && x < this.width && 
                y >= 0 && y < this.height && 
                z >= 0 && z < this.depth) {
                return x + y * this.width + z * this.width * this.height;
            }
        }
        return -1; // Return -1 if the point is out of bounds
    }
}