let counter = 0;
const count = () => counter++;

export const ActionTypes = {
    'NONE': count(),
    'SET': count(),
    'SET_FILES': count(),
    'SET_ACTIVE_FILE': count(),
    'UPDATE_DATASETS': count(),
    'SET_ACTIVE_DATASET': count(),
    'SET_ROISTATS': count(),
    'SET_VIEW_MODE': count(),
    'SET_LOADING_STATUS': count(),
}

export const AppReducers = (state, action) => {

    switch(action.type) {
        
        // Can set any state property
        case ActionTypes.SET:
            return { ...state, ...action.payload }

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

        // ROI Stats
        case ActionTypes.SET_ROISTATS:
            return { ...state, roiStats: action.payload }

        // View Mode
        case ActionTypes.SET_VIEW_MODE:
            return { ...state, viewMode: action.payload }

        // Status
        case ActionTypes.SET_LOADING_STATUS:
            return { ...state, status: action.payload }

        default:
            return state;
    }
};