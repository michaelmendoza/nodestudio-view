import React, { createContext, useReducer, useContext } from 'react';
import { AppReducers } from './AppReducers';
import Status from './models/Status';

/**
 * Inital state for AppState 
 */
const initialState  = { 
    files: [],
    activeFile: null,
    datasets: {},
    activeDataset: null,
    roiStats: new ROIStats(),
    viewMode: '2D View',
    status: new Status(),
};

/**
 * AppContext using React Context API
 */
const AppContext = createContext({
    state: initialState,
    dispatch: () => null,
  });

/**
 * AppState Provider allows consuming components to subscribe to context changes in AppState
 */
const AppStateProvider = ({ children }) => {
    const [state, dispatch] = useReducer(AppReducers, initialState);

    return (
        <AppContext.Provider value={{state, dispatch}}>
            { children }
        </AppContext.Provider>
    );
};

export const useAppState = () => {
    return useContext(AppState.AppContext);
}

const AppState = { AppStateProvider, AppContext };
export default AppState;