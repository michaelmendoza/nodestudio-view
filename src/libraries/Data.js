
/**
 * Scales data to range of 0 - 255 values. Has the option of using contrast calculations or 
 * just doing a simple scaling between min/max values
 */
export const scaleDataset = ({ data, shape, min, max, useContrast = false, contrast }) => {
    const resolution = 255;
    const length = shape.reduce((a,b) => a * b); //shape[0] * shape[1];
    const uint8Array = new Uint8Array(length);
    for (var i = 0; i < length; i++) {
        const value = data[i];
        const fractional_value = useContrast ? contrast.contrastLUT(value, true) : (value - min) / (max - min); 
        const scaled_value = fractional_value * resolution;
        uint8Array[i] = scaled_value;
    }

    const dataset = { shape, min, max }
    dataset.data = uint8Array;
    dataset.isScaled = true;
    dataset.scalingResolution = 255;
    dataset.unscaledData = data;
    return dataset;
}

export const decodeDataset = ({ data, shape, min, max, dtype }) => {
    const dataset = { shape, min, max }
    dataset.data = base64ToPixelArray({ data, dtype });
    return dataset
}

/** Converts a base64 string to a 8 or 16 bit array */
export const base64ToPixelArray = ({ data, dtype = 'uint16' }) => {
    const rawString = window.atob(data); // data should be base64encoded

    const uint8Array = new Uint8Array(rawString.length);
    for(var i = 0; i < rawString.length; i++) {
        uint8Array[i] = rawString.charCodeAt(i);
    }
    
    const pixelArray = dtype === 'uint16' ? new Uint16Array(uint8Array.buffer) : uint8Array;
    return pixelArray;
}

/** Converts a 8bit array to a base64 string */
export const pixelArrayToBase64 = async (data) => {
    // Use a FileReader to generate a base64 data URI
    const base64url = await new Promise((r) => {
        const reader = new FileReader()
        reader.onload = () => r(reader.result)
        reader.readAsDataURL(new Blob([data]))
    })

    /*
    The result looks like 
    "data:application/octet-stream;base64,<your base64 data>", 
    so we split off the beginning:
    */
    return base64url.split(",", 2)[1]
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