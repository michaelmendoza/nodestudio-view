import './FileDataInfo.scss';
import { useAppState } from '../../state/AppState';
import Divider from '../Divider/Divider';
import { formatNumber } from '../../libraries/Format';
import Select from '../Select/Select';
import { ActionTypes } from '../../state';
import Slider from '../Slider/Slider';
import { useState } from 'react';
import APIDataService from '../../services/APIDataService';
import Status from '../../state/models/Status';

const FileDataInfo = () => {
    const { state } = useAppState();

    return (<div className='file-data-info'>
        <FileMetadataInspector></FileMetadataInspector>
        { state.activeDataset ? <ContrastOptions></ContrastOptions> : null }
        <ViewerOptions></ViewerOptions>
        <ROIControls></ROIControls>
    </div>)
}

const ContrastOptions = () => {
    const { state } = useAppState();

    const updateContrastLevel = (value) => {
        state.activeDataset.contrast.level = value;
        state.activeDataset.updateRender();
    }

    const updateContrastWindow = (value) => {
        state.activeDataset.contrast.window = value;
        state.activeDataset.updateRender();
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
    const viewOptions = ['2D View', '3D View', 'Lightbox']

    const handleViewModeUpdate = (mode) => {
        dispatch({ type:ActionTypes.SET_VIEW_MODE, payload: mode })
    }

    return (<div className='viewer-options'>
        <div className='viewer-item'> 
            <label>View</label> <Select options={viewOptions} value={state.viewMode} onChange={handleViewModeUpdate}></Select>  
        </div>
        <Divider></Divider>
    </div>)
}

const FileMetadataInspector = () => {
    const { state } = useAppState();

    const metadata = state?.activeDataset?.metadata;
    const dims = metadata?.dims;
    const shape = metadata?.shape;
    const min = formatNumber( metadata?.min);
    const max = formatNumber( metadata?.max);
    const isComplex = metadata?.isComplex ? 'Yes' : 'No';

    return (<div className='file-metadata-inspector'>
        {
            metadata ? <div>
                <label>Metadata</label>
                <div className='file-metadata-list'>
                    <FileDataInfoItem label={'Dim Count'} info={dims?.length}></FileDataInfoItem>
                    <FileDataInfoItem label={'Dims'} info={JSON.stringify(dims)?.replace(/"/g, '')}></FileDataInfoItem>
                    <FileDataInfoItem label={'Shape'} info={ JSON.stringify(shape)}></FileDataInfoItem>
                    <FileDataInfoItem label={'Min'} info={min}></FileDataInfoItem>
                    <FileDataInfoItem label={'Max'} info={max}></FileDataInfoItem>
                    <FileDataInfoItem label={'isComplex'} info={isComplex}></FileDataInfoItem>
                </div>
                <Divider></Divider>
            </div> : null
        }
    </div>)
}

const FileDataInfoItem = ({label, info}) => {
    return (<label className='info-item'> <span>{label}</span> <span>{info}</span> </label>)
}

const ROIControls = () => {
    const { state, dispatch } = useAppState();
    const brushOptions = ['Brush', 'Erase']
    const [brushType, setBrushType] = useState('Brush');
    const [brushSize, setBrushSize] = useState(5);

    const updateBrushType = (mode) => {
        state.viewport.roi.useBrush = mode === 'Brush';
        setBrushType(mode)
    }

    const updateBrushSize = (value) => {
        state.viewport.roi.brush = value;
        setBrushSize(value);
    }

    const exportROIData = async () => {
        dispatch({ type: ActionTypes.SET_LOADING_STATUS, payload: new Status({ show: true, message: 'Exporting ROI Masks ...' }) });
        const data = await state.viewport.roi.export();
        await APIDataService.exportROIData(data.data, data.shape);
        APIDataService.exportDownload();
        dispatch({ type: ActionTypes.SET_LOADING_STATUS, payload: new Status({ show: false, message: '' }) });
    }

    return (<div className='roi-controls'>
        <label>ROI Controls</label>
        <Select options={brushOptions} value={brushType} onChange={updateBrushType}></Select> 
        <Slider label='Brush Size' value={brushSize} onChange={updateBrushSize} max={50}></Slider> 
        <button className='export-roi button-dark' onClick={exportROIData}> Export ROI </button>
        <Divider></Divider>
    </div>)
}

export default FileDataInfo;