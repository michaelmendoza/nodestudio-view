import { isNumber } from "../../libraries/Utils";

export const ROIOptions = {
    useBrush: true, // Is brush or eraser 
    brush: 5
}

export const updateUseBrush = (value) => {
    ROIOptions.useBrush = value;
}

export const updateBrushSize = (value) => {
    ROIOptions.brush = value;
}

const defaultHistogram = Array.from({ length: 20 }, (_, i) => ({ bin: i * 10, value: 0 }))
export class ROIStats {
    constructor(stats) {
        this.mean = stats?.mean || 0,
        this.size = stats?.size || 0,
        this.median = stats?.median || 0,
        this.stdDev = stats?.stdDev || stats?.std_dev  || 0,
        this.min = stats?.min || 0,
        this.max = stats?.max || 0,
        this.histogram = stats?.histogram || defaultHistogram

        if (this.histogram.length > 0) {
            if (Array.isArray(this.histogram[0])) {
                this.histogram = this.histogram[0].map((value, index) => {
                    return { bin: this.histogram[1][index], value }
                })
            }
        }
        console.log(stats);
    }
}