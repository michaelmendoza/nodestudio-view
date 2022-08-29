
    export const generateDefaultIndices = (shape) => {
        if (shape === [] || !shape) return [];
        return shape?.map(s => Math.floor(s / 2));
    }

    export const generateKeyFromIndices = (shape, indices, xIndex=1, yIndex=2) => {
        if (shape === [] || !shape) return '';

        let key = '[';
        indices.forEach((value, i) => { 
            if (i === xIndex || i === yIndex) key += ':';
            else key += value.toString();
            if (i < indices.length -1 ) key += ',';
        })
        key += ']';

        return key;
    }