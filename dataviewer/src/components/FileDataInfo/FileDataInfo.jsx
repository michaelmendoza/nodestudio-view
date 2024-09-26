import './FileDataInfo.scss';
import { useAppState } from '../../state/AppState';
import Divider from '../Divider/Divider';
import Select from '../Select/Select';
import { ActionTypes } from '../../state';
import Slider from '../Slider/Slider';
import { useState } from 'react';
import APIDataService from '../../services/APIDataService';
import Status from '../../state/models/Status';
import { ViewDict } from '../../state/models/Viewer';
import { updateUseBrush, updateBrushSize } from '../../state/models/ROI';

const FileDataInfo = () => {
    const { state } = useAppState();

    return (<div className='file-data-info'>
        <ViewerOptions></ViewerOptions>
        { state.activeDataset && state.viewMode !== 'Lightbox' ? <ContrastOptions></ContrastOptions> : null }
        <ROIControls></ROIControls>
        { state.activeDataset?.file?.type === 'raw data' ? <FileDataControl></FileDataControl> : null }
    </div>)
}

const ContrastOptions = () => {
    const { state } = useAppState();

    const updateRender = async () => {
        for (let key in ViewDict){
            const view = ViewDict[key];
            if (view.datasetRenderer) view.datasetRenderer.render();
        } 
    }

    const updateContrastLevel = async (value) => {
        state.activeDataset.contrast.level = value;
        updateRender();   
    }

    const updateContrastWindow = async (value) => {
        state.activeDataset.contrast.window = value;
        updateRender();  
    }

    return (<div className='viewer-options'>
        <label>Contrast</label>
        <Slider label='Level' value={state.activeDataset.contrast.level} onChange={updateContrastLevel} max={4096}></Slider> 
        <Slider label='Window' value={state.activeDataset.contrast.window} onChange={updateContrastWindow} max={4096}></Slider> 
        <Divider></Divider>
    </div>)
}

const ViewerOptions = () => {
    const { state, dispatch } = useAppState();
    const viewOptions = ['2D View', '3D View'] //;, 'Lightbox']

    const updateRender = async (viewMode) => {
        if(!state.activeDataset) return;

        state.activeDataset.setViewMode(viewMode);
        
        for (let key in ViewDict){
            const view = ViewDict[key];
            view.init_dataset(state.activeDataset);
            view.render();
        } 
    }

    const handleViewModeUpdate = async (mode) => {
        dispatch({ type:ActionTypes.SET_VIEW_MODE, payload: mode });

        dispatch({ type: ActionTypes.SET_LOADING_STATUS, payload: new Status({ show: true, message: 'Loading data ...' }) });
        await updateRender(mode);
        dispatch({ type: ActionTypes.SET_LOADING_STATUS, payload: new Status({ show: false}) });
    }

    return (<div className='viewer-options'>
        <div className='viewer-item'> 
            <label>View</label> <Select options={viewOptions} value={state.viewMode} onChange={handleViewModeUpdate}></Select>  
        </div>
        <Divider></Divider>
    </div>)
}

const ROIControls = () => {
    const { state, dispatch } = useAppState();
    const brushOptions = ['Brush', 'Erase']
    const [brushType, setBrushType] = useState('Brush');
    const [brushSize, setBrushSize] = useState(5);

    const updateBrushType = (mode) => {
        updateUseBrush(mode === 'Brush');
        setBrushType(mode);
    }

    const updateBrushSizeValue = (value) => {
        updateBrushSize(value);
        setBrushSize(value);
    }

    const exportROIData = async () => {
        dispatch({ type: ActionTypes.SET_LOADING_STATUS, payload: new Status({ show: true, message: 'Exporting ROI Masks ...' }) });
        const data = await state.activeDataset.roi.export();
        //await APIDataService.exportROIData(data.data, data.shape);
        //APIDataService.exportDownload();
        APIDataService.exportSegmentedData(state.activeDataset.file.id, 'test.npy');
        dispatch({ type: ActionTypes.SET_LOADING_STATUS, payload: new Status({ show: false, message: '' }) });
    }

    return (<div className='roi-controls'>
        <label>ROI</label>
        <Select options={brushOptions} value={brushType} onChange={updateBrushType}></Select> 
        <Slider label='Brush Size' value={brushSize} onChange={updateBrushSizeValue} max={50}></Slider> 
        <button className='export-roi button-dark' onClick={exportROIData}> Export ROI </button>
        <Divider></Divider>
    </div>)
}

const Checkbox = ({ label, value, onChange }) => {
    return (
      <label className='checkbox layout-row-center layout-space-between'>
        <span> {label} </span>
        <span> <input type="checkbox" checked={value} onChange={onChange}/> </span>
      </label>
    );
  };

const FileDataControl = () => {
    const { state, dispatch } = useAppState();
    const imageOptions = ['image', 'k-Space']
    const [imageMode, setImageMode] = useState('image');
    const [doChaAverage, setDoChaAverage] = useState(true);
    const [doAveAverage, setDoAveAverage] = useState(true);

    const updateImageOption = (mode) => {
        setImageMode(mode);
    }

    const reloadData = async () => {
        const options =  { datatype: imageMode, doChaAverage, doChaSOSAverage:false, doAveAverage };
        const file = state.activeFile;
        dispatch({ type: ActionTypes.SET_LOADING_STATUS, payload: new Status({ show: true, message: 'Load DataFile ...'}) });
        await APIDataService.addFiles(file.path, file.name, file.id, options);
        dispatch({ type: ActionTypes.SET_LOADING_STATUS, payload: new Status({show: false}) });
        dispatch({ type:ActionTypes.SET_ACTIVE_FILE, payload: { ...state.activeFile } })
    }

    return (<div>
        <label>FileData</label>
        <Select options={imageOptions} value={imageMode} onChange={updateImageOption}></Select>
        <div> <Checkbox label={'Average Channel: Cha'} value={doChaAverage} onChange={() => { setDoChaAverage(!doChaAverage) }}></Checkbox> </div>
        <div> <Checkbox label={'Average Channel: Ave'} value={doAveAverage} onChange={() => { setDoAveAverage(!doAveAverage) }}></Checkbox> </div>
        <button className='button-dark' onClick={reloadData}> Reload Data </button>
        <Divider></Divider>
    </div>)
}

export default FileDataInfo;