
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

/** Unpacks the bit-packed base64 string into a uint8 array */
export const unpackBitPackedBase64 = (packedData, originalShape) => {

    // Decode the base64 string to an array of bytes
    const binaryString = atob(packedData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    // Unpack the bits
    const unpacked = new Uint8Array(bytes.length * 8);
    for (let i = 0; i < bytes.length; i++) {
        for (let j = 0; j < 8; j++) {
            unpacked[i * 8 + j] = (bytes[i] & (1 << (7 - j))) ? 1 : 0;
        }
    }

    // Trim the unpacked array to the original shape
    const totalPixels = originalShape.reduce((a, b) => a * b, 1);
    const mask = unpacked.slice(0, totalPixels);

    return mask;
}

/** Reshape the 1D array into the original shape -> [depth][height * width] */
export const reshape1DArray = (array, shape) => {
    const result = [];
    let index = 0;

    const recurse = (dimensions) => {
        if (dimensions.length === 1) {
            return array.slice(index, index += dimensions[0]);
        }
        
        const dim = dimensions[0];
        const rest = dimensions.slice(1);
        const newArray = [];

        for (let i = 0; i < dim; i++) {
            newArray.push(recurse(rest));
        }
        return newArray;
    }

    return recurse(shape);
}

/** Swaps the axes of an array. The new axis order is specified as an array of integers from 0 to 2. */
export const swapArrayAxes = (inputArray, inputShape, newAxisOrder) => {
    // Validate input
    if (inputShape.length !== 3 || newAxisOrder.length !== 3) {
        throw new Error('Input shape and new axis order must be 3-dimensional');
    }
    if (!newAxisOrder.every(axis => axis >= 0 && axis < 3)) {
        throw new Error('New axis order must contain values 0, 1, and 2');
    }
    if (new Set(newAxisOrder).size !== 3) {
        throw new Error('New axis order must contain each of 0, 1, and 2 exactly once');
    }

    const outputShape = newAxisOrder.map(axis => inputShape[axis]);
    const outputArray = new Uint8Array(inputArray.length);

    const [dim0, dim1, dim2] = inputShape;
    const [newDim0, newDim1, newDim2] = outputShape;

    for (let i = 0; i < dim0; i++) {
        for (let j = 0; j < dim1; j++) {
            for (let k = 0; k < dim2; k++) {
                // Calculate input index
                const inputIndex = (i * dim1 * dim2) + (j * dim2) + k;

                // Calculate output index based on new axis order
                const newCoords = [i, j, k];
                const outputIndex = (newCoords[newAxisOrder[0]] * newDim1 * newDim2) +
                                    (newCoords[newAxisOrder[1]] * newDim2) +
                                    newCoords[newAxisOrder[2]];

                // Copy the value
                outputArray[outputIndex] = inputArray[inputIndex];
            }
        }
    }

    return {
        array: outputArray,
        shape: outputShape
    };
}
