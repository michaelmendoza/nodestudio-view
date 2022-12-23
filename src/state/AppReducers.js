let counter = 0;
const count = () => counter++;

export const ActionTypes = {
    'NONE': count(),
    'SET_FILES': count(),
    'SET_ACTIVE_FILE': count(),
    'UPDATE_DATASETS': count(),
    'SET_ACTIVE_DATASET': count(),
    'SET_VIEW_MODE': count(),
    'SET_VIEWPORT': count(),
    'SET_LOADING_STATUS': count(),
}

export const AppReducers = (state, action) => {

    switch(action.type) {
        
        // Files
        case ActionTypes.SET_FILES:
            return { ...state, files:action.files}

        // ActiveFile
        case ActionTypes.SET_ACTIVE_FILE:
            return { ...state, activeFile: action.payload }

        // Datasets
        case ActionTypes.UPDATE_DATASETS:
            const dataset = action.payload;
            return { ...state, datasets: { ...state.datasets, [dataset.file.id]:dataset }}

        // Active Dataset 
        case ActionTypes.SET_ACTIVE_DATASET:
            return { ...state, activeDataset: action.payload }

        // View Mode
        case ActionTypes.SET_VIEW_MODE:
            return { ...state, viewMode: action.payload }

        // Viewport
        case ActionTypes.SET_VIEWPORT:
            return { ...state, viewport: action.payload }

        // Status
        case ActionTypes.SET_LOADING_STATUS:
            return { ...state, status: action.payload }

        default:
            return state;
    }
};