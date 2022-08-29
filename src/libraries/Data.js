
export const scaleDataset = ({ data, shape, min, max }) => {
    // Fix min/max scaling 
    const resolution = 255;
    const length = shape[0] * shape[1];
    const uint8Array = new Uint8Array(length);
    for (var i = 0; i < length; i++) {
        const value = data[i];
        const scaled_value = (value - min) * resolution / (max - min)
        uint8Array[i] = scaled_value;
    }

    const dataset = { shape, min, max }
    dataset.data = uint8Array;
    dataset.isScaled = true;
    return dataset;
}

export const decodeDataset = ({ data, shape, min, max, dtype }) => {
    const dataset = { shape, min, max }
    dataset.data = base64ToPixelArray({ data, dtype });
    return dataset
}

export const base64ToPixelArray = ({ data, dtype = 'uint16' }) => {
    const rawString = window.atob(data); // data should be base64encoded

    const uint8Array = new Uint8Array(rawString.length);
    for(var i = 0; i < rawString.length; i++) {
        uint8Array[i] = rawString.charCodeAt(i);
    }
    
    const pixelArray = dtype === 'uint16' ? new Uint16Array(uint8Array.buffer) : uint8Array;
    return pixelArray;
}

export const datasetToPointCloud = (pixelArray, shape) => {

    const width = shape[1];
    const height = shape[0];

    const pointCloud = [];
    for (var i = 0; i < width * height; i++) {
        const value = pixelArray[i];
        if(value !== 0) {
            const x = i % width;
            const y = -Math.floor(i / width);
            pointCloud.push({value, x, y});
        }
    }

    return pointCloud;
}