import './FileDataInfo.scss';
import { useAppState } from '../../state/AppState';
import Divider from '../Divider/Divider';
import { formatNumber } from '../../libraries/Format';
import Select from '../Select/Select';
import { ActionTypes } from '../../state';
import Slider from '../Slider/Slider';
import { useState } from 'react';

const FileDataInfo = () => {
    
    return (<div className='file-data-info'>
        <ViewerOptions></ViewerOptions>
        <Divider></Divider>

        <FileMetadataInspector></FileMetadataInspector>
        <Divider></Divider>

        <ROIControls></ROIControls>
        <Divider></Divider>
    </div>)
}

const ViewerOptions = () => {
    const { state, dispatch } = useAppState();
    const viewOptions = ['2D View', '3D View', 'Lightbox']
    const [constrast, setContrast] = useState(2048);

    const handleViewModeUpdate = (mode) => {
        dispatch({ type:ActionTypes.SET_VIEW_MODE, payload: mode })
    }

    return (<div className='viewer-options'>
        <div className='viewer-item'> <label>View</label> <Select options={viewOptions} value={state.viewMode} onChange={handleViewModeUpdate}></Select>  </div>
        <Divider></Divider>

        <div>Contrast</div>
        <Slider value={constrast} onChange={(value) => { setContrast(value) }} max={4096}></Slider> 
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
                <FileDataInfoItem label={'Dim Count'} info={dims?.length}></FileDataInfoItem>
                <FileDataInfoItem label={'Dims'} info={JSON.stringify(dims)?.replace(/"/g, '')}></FileDataInfoItem>
                <FileDataInfoItem label={'Shape'} info={ JSON.stringify(shape)}></FileDataInfoItem>
                <FileDataInfoItem label={'Min'} info={min}></FileDataInfoItem>
                <FileDataInfoItem label={'Max'} info={max}></FileDataInfoItem>
                <FileDataInfoItem label={'isComplex'} info={isComplex}></FileDataInfoItem>
            </div> : null
        }
    </div>)
}

const FileDataInfoItem = ({label, info}) => {
    return (<label className='info-item'> <span>{label}</span> <span>{info}</span> </label>)
}

const ROIControls = () => {
    const { state } = useAppState();
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

    return (<div className='roi-controls'>
        <label>ROI Controls</label>
        <Select options={brushOptions} value={brushType} onChange={updateBrushType}></Select> 
        <Slider value={brushSize} onChange={updateBrushSize} max={50}></Slider> 
    </div>)
}

export default FileDataInfo;