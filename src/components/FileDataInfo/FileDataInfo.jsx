import './FileDataInfo.scss';
import { useAppState } from '../../state/AppState';
import Divider from '../Divider/Divider';
import { formatNumber } from '../../libraries/Format';

const FileDataInfo = () => {
    
    const { state } = useAppState();

    const dims = state?.activeMetadata?.dims;
    const shape = state?.activeMetadata?.shape;
    const min = formatNumber( state?.activeMetadata?.min);
    const max = formatNumber( state?.activeMetadata?.max);
    const isComplex = state?.activeMetadata?.isComplex ? 'Yes' : 'No';

    return (<div className='file-data-info'>
        <label>Metadata</label>
        <Divider></Divider>
        <FileDataInfoItem label={'Dim Count'} info={dims.length}></FileDataInfoItem>
        <FileDataInfoItem label={'Dims'} info={JSON.stringify(dims).replace(/"/g, '')}></FileDataInfoItem>
        <FileDataInfoItem label={'Shape'} info={ JSON.stringify(shape)}></FileDataInfoItem>
        <FileDataInfoItem label={'Min'} info={min}></FileDataInfoItem>
        <FileDataInfoItem label={'Max'} info={max}></FileDataInfoItem>
        <FileDataInfoItem label={'isComplex'} info={isComplex}></FileDataInfoItem>
    </div>)
}

const FileDataInfoItem = ({label, info}) => {
    return (<label className='info-item'> <span>{label}</span> <span>{info}</span> </label>)
}

export default FileDataInfo;