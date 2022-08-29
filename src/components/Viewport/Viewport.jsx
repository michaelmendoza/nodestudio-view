import './Viewport.scss';
import { useEffect, useState } from 'react';
import { useAppState, ActionTypes } from '../../state';
import APIDataService from '../../services/APIDataService';
import { debounce, throttle } from '../../libraries/Utils';
import { decodeDataset, scaleDataset } from '../../libraries/Data';
import { generateDefaultIndices, generateKeyFromIndices } from '../../libraries/ArrayIndexer';
import ViewportControls from './ViewportControls';
import Chart2D from '../Charts/Chart2D';

const Viewport = () => {

    const { state, dispatch } = useAppState();
    const [metadata, setMetadata] = useState(undefined);
    const [dataset, setDataset] = useState(undefined);
    const [indices, setIndices] = useState([0,0,0]);
    const [maxIndices, setMaxIndices] = useState([1,1,1]);

    useEffect( () => {
        debounce(fetch, 100, 'Viewport-LoadFile');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.activeFile])

    const fetchMetadata = async () => {
        if (!state.activeFile) return;
        const metadata = await APIDataService.getFileMetadata(state.activeFile.id);
        setMetadata(metadata);
        dispatch({ type: ActionTypes.SET_ACTIVE_METADATA, payload: metadata })

        const _indices = generateDefaultIndices(metadata.shape);
        setIndices(_indices);

        const max = metadata.shape.map((value) => value - 1); 
        setMaxIndices(max);

        return { shape: metadata.shape, indices:_indices };
    }

    const fetchData = async (_metadata) => {
        if (!state.activeFile) return;
        const key = generateKeyFromIndices(_metadata.shape, _metadata.indices);
        let data = await APIDataService.getFileData(state.activeFile.id, key);
        if (data.isEncoded) {
            data = decodeDataset({ data: data.data, shape: data.shape, min: data.min, max: data.max, dtype: data.dtype })
        } 
        const _dataset = scaleDataset({ data: data.data, shape: data.shape, min: data.min, max: data.max, dtype: data.dtype })
        setDataset(_dataset);
    }

    const fetch = async () => {
        const _metadata = await fetchMetadata();
        await fetchData(_metadata);
    }

    const handleIndexUpdate = async (_indices) => {
        const _metadata =  { shape: metadata.shape, indices:_indices };
        throttle(() => fetchData(_metadata), 1, 'FetchFileData')
    }
    
    return (
        <div className='viewport'> 
            <Chart2D dataset={dataset}></Chart2D>
            <ViewportControls indices={indices} setIndices={setIndices} maxIndices={maxIndices} onUpdate={handleIndexUpdate}></ViewportControls>
        </div>
    )
}

export default Viewport;