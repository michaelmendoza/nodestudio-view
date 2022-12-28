import './Viewport.scss';
import { useEffect, useState, useRef } from 'react';
import { useAppState, ActionTypes } from '../../state';
import { debounce, throttle } from '../../libraries/Utils';
import ViewportControls from './ViewportControls';
import Dataset from '../../state/models/Dataset';
import ROIViewer from '../Charts/ROIViewer';
import Status from '../../state/models/Status';
import Viewer from '../../state/models/Viewer';
import ContextMenu from '../ContextMenu/ContextMenu';
import { render, updateRender } from '../../libraries/DataRenderer';
import { renderROI } from '../../libraries/ROIRenderer';
const Viewport = () => {

    const { state, dispatch } = useAppState();

    useEffect( () => {
        debounce(fetch, 100, 'Viewport-LoadFile');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.activeFile])

    const fetch = async () => {
        if (!state.activeFile) return;
        
        dispatch({ type: ActionTypes.SET_LOADING_STATUS, payload: new Status({ show: true, message: 'Loading data ...' }) });
        
        let dataset;
        if (state.datasets[state.activeFile.id]) {
            // Reload dataset and render
            dataset = state.datasets[state.activeFile.id];
        }
        else {
            // Create a new dataset and render 
            dataset = new Dataset(state.activeFile);
        }
        await dataset.init(state.viewMode);
        console.log("Init Dataset")

        dispatch({ type: ActionTypes.SET_ACTIVE_DATASET, payload: dataset });
        dispatch({ type: ActionTypes.UPDATE_DATASETS, payload: dataset });
        dispatch({ type: ActionTypes.SET_LOADING_STATUS, payload: new Status({ show: false}) });
    }

    return (
        <div className='viewport'> 
            {
                state.viewMode === '3D View' ? <div className='layout-row'>
                    <View id={30} style={ { width: '50%'} }></View>   
                    <div style={ { width: '50%'} }>
                        <View id={31} style={ { height: '50%' } }></View>     
                        <View id={32} style={ { height: '50%' } }></View>
                    </div>
                </div> : <View id={0}></View>
            }
        </div>
    )
}

const View = ({ id, style = {} }) => {
    
    const ref = useRef();
    const { state, dispatch } = useAppState();
    const [ view, setView ] = useState();
    const [ update, setUpdate ] = useState(0);
    const isInit = useRef(false);

    useEffect(()=>{
        if(isInit.current) return;
        init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const renderView = () => {
            if(!view) return;
            if(!state.activeDataset) return;
            view.init_dataset(state.activeDataset);
            view.reset_roi();
            render(view, state.activeDataset, state.viewMode);
            renderROI(view, state.activeDataset, state.viewMode);
        }

        debounce(renderView, 100, `view-${id}-render`);
    }, [state.activeDataset])

    const init = () => {
        const viewer = new Viewer(id, ref, dispatch);
        isInit.current = true;
        setView(viewer);
    }

    const handleIndexUpdate = async () => {
        updateRender(view, state.activeDataset, state.viewMode);
        renderROI(view, state.activeDataset, state.viewMode);
        setUpdate(update+1);
    }

    const handleKeyDown = (event) => {
        event.preventDefault();
        if (!state.activeDataset) return;

        if (event.key === 'ArrowLeft') {
            view.decrement_index();
            handleIndexUpdate();
        }
        if (event.key === 'ArrowRight') {
            view.increment_index();
            handleIndexUpdate();
        }
    }

    const factor = style.height === '50%' ? 0.5 : 1;
    const height = ((window.innerHeight - 100) * factor).toString() + 'px'; 
    return (
        <div className='view' style={style} onKeyDown={handleKeyDown} tabIndex="-1"> 
            <ContextMenu domElement={ref.current}></ContextMenu>

            <div>
                <div className='webgl-viewport' style={{width:'100%', height:height}} ref={ref}>
                </div>
                { /*  <div> u:{ p?.x } v:{ p?.y }</div> */ }
            </div>           

            { state.viewMode === '2D View' ||  state.viewMode === '3D View' ? <ViewportControls view={view} onUpdate={handleIndexUpdate}></ViewportControls> : null }
        </div>
    )

}

export default Viewport;