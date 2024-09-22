
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
        this.mean = stats.mean || 0,
        this.size = stats.size || 0,
        this.median = stats.median || 0,
        this.stdDev = stats.stdDev || 0,
        this.min = stats.min || 0,
        this.max = stats.max || 0,
        this.histogram = stats.histogram || defaultHistogram
    }

    update = (stats) => {
        this.size = stats.size;
        this.mean = stats.mean;
        this.median = stats.median;
        this.stdDev = stats.stdDev;
        this.min = stats.min;
        this.max = stats.max;
        this.histogram = stats.histogram;
        console.log(stats);
    }
}