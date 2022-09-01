import './FileDataInfo.scss';
import { useAppState } from '../../state/AppState';
import Divider from '../Divider/Divider';
import { formatNumber } from '../../libraries/Format';
import Select from '../Select/Select';
import { useState } from 'react';
import { ActionTypes } from '../../state';

const FileDataInfo = () => {
    
    return (<div className='file-data-info'>
        <ViewerOptions></ViewerOptions>
        <FileMetadataInspector></FileMetadataInspector>
    </div>)
}

const ViewerOptions = () => {
    const { state, dispatch } = useAppState();
    const viewOptions = ['2D View', '3D View', 'Lightbox']

    const handleViewModeUpdate = (mode) => {
        dispatch({ type:ActionTypes.SET_VIEW_MODE, payload: mode })
    }

    return (<div className='viewer-options'>
        <div>Contrast</div>
        <div className='viewer-item'> <label>View</label> <Select options={viewOptions} value={state.viewMode} onChange={handleViewModeUpdate}></Select>  </div>
    </div>)
}

const FileMetadataInspector = () => {
    const { state } = useAppState();

    const dims = state?.activeMetadata?.dims;
    const shape = state?.activeMetadata?.shape;
    const min = formatNumber( state?.activeMetadata?.min);
    const max = formatNumber( state?.activeMetadata?.max);
    const isComplex = state?.activeMetadata?.isComplex ? 'Yes' : 'No';

    return (<div className='file-metadata-inspector'>
        {
            state.activeMetadata ? <div>
                <label>Metadata</label>
                <Divider></Divider>
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

export default FileDataInfo;