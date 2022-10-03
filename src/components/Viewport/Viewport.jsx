import './Viewport.scss';
import { useEffect } from 'react';
import { useAppState, ActionTypes } from '../../state';
import { debounce, throttle } from '../../libraries/Utils';
import ViewportControls from './ViewportControls';
import Chart2D from '../Charts/Chart2D';
import Lightbox from '../Charts/Lightbox';
import Dataset from '../../state/models/Dataset';
import ChartBase from '../Charts/ChartBase';

const Viewport = () => {

    const { state, dispatch } = useAppState();

    useEffect( () => {
        debounce(fetch, 100, 'Viewport-LoadFile');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.activeFile, state.viewMode])

    const fetch = async () => {
        if (!state.activeFile) return;

        const dataset = new Dataset(state.activeFile, state.viewport);
        dataset.setViewMode(state.viewMode);
        await dataset.fetchMetadata();
        await dataset.fetchDataset();
        dataset.render()
        dispatch({ type: ActionTypes.SET_ACTIVE_DATASET, payload: dataset });
    }

    const fetchData = async () => {
        await state.activeDataset.fetchDataset();
        await state.activeDataset.render();
        //dispatch({ type: ActionTypes.SET_ACTIVE_DATASET, payload: state.activeDataset });
    }

    const handleIndexUpdate = async () => {
        throttle(() => fetchData(), 1, 'FetchFileData');
    }
    
    return (
        <div className='viewport'> 
            <ChartBase></ChartBase>
            { state.viewMode === '2D View' ? <ViewportControls onUpdate={handleIndexUpdate}></ViewportControls> : null }
        </div>
    )
}

export default Viewport;