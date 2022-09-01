import React, { createContext, useReducer, useContext } from 'react';
import { AppReducers } from './AppReducers';

/**
 * Inital state for AppState 
 */
const initialState  = { 
    files: [],
    activeFile: null,
    activeMetadata: null,
    viewMode: '2D View'
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