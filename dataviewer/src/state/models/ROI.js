
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