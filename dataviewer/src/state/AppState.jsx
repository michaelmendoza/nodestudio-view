import React, { createContext, useReducer, useContext } from 'react';
import { AppReducers } from './AppReducers';
import Status from './models/Status';
import { ROIStats } from './models/ROI';

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

/** AppStore is a singleton object that holds the state and dispatch function */
let appStore = {
    state: initialState,
    dispatch: null,
}

/**
 * AppContext using React Context API
 */
export const AppContext = createContext({
    state: initialState,
    dispatch: () => null,
  });

/**
 * AppState Provider allows consuming components to subscribe to context changes in AppState
 */
export const AppStateProvider = ({ children }) => {
    const [state, dispatch] = useReducer(AppReducers, initialState);

    appStore.state = state;
    appStore.dispatch = dispatch;

    return (
        <AppContext.Provider value={{state, dispatch}}>
            { children }
        </AppContext.Provider>
    );
};

/** AppState Hook */
export const useAppState = () => {
    return useContext(AppContext);
}

/** Retrives AppState */
export const getAppState = () => {
    return appStore.state;
}

/** AppState Dispatcher */
export const Dispatch = (action) => {
    return appStore.dispatch(action);
}

const AppState = { AppStateProvider, AppContext, useAppState, getAppState, Dispatch };
export default AppState;