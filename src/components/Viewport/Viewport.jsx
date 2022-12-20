import './Viewport.scss';
import { useEffect } from 'react';
import { useAppState, ActionTypes } from '../../state';
import { debounce, throttle } from '../../libraries/Utils';
import ViewportControls from './ViewportControls';
import Dataset from '../../state/models/Dataset';
import ChartBase from '../Charts/ChartBase';
import ROIViewer from '../Charts/ROIViewer';

const Viewport = () => {

    const { state, dispatch } = useAppState();

    useEffect( () => {
        debounce(fetch, 100, 'Viewport-LoadFile');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.activeFile, state.viewMode])

    const fetch = async () => {
        if (!state.activeFile) return;

        dispatch({ type: ActionTypes.SET_LOADING_STATUS, payload: { show: true, message: 'Loading data ...' } });

        const dataset = new Dataset(state.activeFile, state.viewport);
        dataset.setViewMode(state.viewMode);
        await dataset.fetchMetadata();
        await dataset.fetchDataset();
        dataset.render()

        if(!state.viewport.roi)        
            state.viewport.roi = new ROIViewer(state.viewport);
        dispatch({ type: ActionTypes.SET_ACTIVE_DATASET, payload: dataset });

        dispatch({ type: ActionTypes.SET_LOADING_STATUS, payload: { show: false, message: '' } });

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

    return (
        <div className='viewport' tabIndex="0" onKeyDown={handleKeyDown}> 
            <ChartBase></ChartBase>
            { state.viewMode === '2D View' ? <ViewportControls onUpdate={handleIndexUpdate}></ViewportControls> : null }
        </div>
    )
}

export default Viewport;