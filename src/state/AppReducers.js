let counter = 0;
const count = () => counter++;

export const ActionTypes = {
    'SET_FILES': count(),
    'SET_ACTIVE_FILE': count(),
    'SET_ACTIVE_METADATA': count()
}

export const AppReducers = (state, action) => {

    switch(action.type) {
        
        // Files
        case ActionTypes.SET_FILES:
            return { ...state, files:action.files}

        // ActiveFile
        case ActionTypes.SET_ACTIVE_FILE:
            return { ...state, activeFile: action.payload }

        // Active Metadata 
        case ActionTypes.SET_ACTIVE_METADATA:
            return { ...state, activeMetadata: action.payload }

        default:
            return state;
    }
};