import './Viewport.scss';
import { useEffect, useRef } from 'react';
import { useAppState, ActionTypes } from '../../state';
import { debounce, throttle } from '../../libraries/Utils';
import ViewportControls from './ViewportControls';
import Dataset from '../../state/models/Dataset';
import ROIViewer from '../Charts/ROIViewer';
import Status from '../../state/models/Status';
import Viewer from '../../state/models/Viewer';
import ContextMenu from '../ContextMenu/ContextMenu';

const Viewport = () => {

    const { state, dispatch } = useAppState();
    const isInit = useRef(false);
    const ref = useRef();

    useEffect(()=>{
        if(isInit.current) return;
        init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect( () => {
        debounce(fetch, 100, 'Viewport-LoadFile');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.activeFile, state.viewMode])

    const init = () => {
        const viewer = new Viewer(ref, dispatch);
        isInit.current = true;
        dispatch({ type: ActionTypes.SET_VIEWPORT, payload: viewer });
    }

    const fetch = async () => {
        if (!state.activeFile) return;

        dispatch({ type: ActionTypes.SET_LOADING_STATUS, payload: new Status({ show: true, message: 'Loading data ...' }) });

        state.viewport.cleanupROIMeshes();
        
        let dataset;
        if (state.datasets[state.activeFile.id]) {
            // Reload dataset and render
            dataset = state.datasets[state.activeFile.id];
            await dataset.init(state.viewMode);
        }
        else {
            // Create a new dataset and render 
            dataset = new Dataset(state.activeFile, state.viewport);
            await dataset.init(state.viewMode);
        }


        dispatch({ type: ActionTypes.SET_ACTIVE_DATASET, payload: dataset });
        dispatch({ type: ActionTypes.UPDATE_DATASETS, payload: dataset });
        dispatch({ type: ActionTypes.SET_LOADING_STATUS, payload: new Status({ show: false}) });
    }

    const fetchData = async () => {
        await state.activeDataset.fetchDataset();
        await state.activeDataset.render();
    }

    const handleIndexUpdate = async () => {
        throttle(() => fetchData(), 50, 'FetchFileData');
    }
    
    const handleKeyDown = (event) => {
        event.preventDefault();
        if (!state.activeDataset) return;

        if (event.key === 'ArrowLeft') {
            state.viewport.decrement_index();
            handleIndexUpdate();
        }
        if (event.key === 'ArrowRight') {
            state.viewport.increment_index();
            handleIndexUpdate();
        }
    }

    const height = (window.innerHeight - 100).toString() + 'px'; 
    return (
        <div className='viewport' tabIndex="0" onKeyDown={handleKeyDown}> 
            <ContextMenu domElement={ref.current}></ContextMenu>

            <div>
                <div className='webgl-viewport' style={{width:'100%', height:height}} ref={ref}>
                </div>
                { /*  <div> u:{ p?.x } v:{ p?.y }</div> */ }
            </div>           

            { state.viewMode === '2D View' ? <ViewportControls onUpdate={handleIndexUpdate}></ViewportControls> : null }
        </div>
    )
}

export default Viewport;