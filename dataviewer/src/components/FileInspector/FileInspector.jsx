import './FileInspector.scss';
import { useAppState } from '../../state/AppState';
import Divider from '../Divider/Divider';
import { formatNumber } from '../../libraries/Format';

const FileInspector = () => {
    return (<div className='file-inspector'>
        <FileDataInspector></FileDataInspector>
        <FileMetadataInspector></FileMetadataInspector>
    </div>)
}

const FileDataInspector = () => {

    const { state } = useAppState();
    const file = state.activeFile;

    return (<div>
        {
            file ? <div className='file-data-inspector'>
                <label>File</label>
                <FileDataInfoItem label={'Name'} info={file.name}></FileDataInfoItem>
                <FileDataInfoItemSmallText label={'ID'} info={file.id}></FileDataInfoItemSmallText>
                <FileDataInfoItem label={'Type'} info={file.type}></FileDataInfoItem>
            </div> : null
        }
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

const FileDataInfoItemSmallText = ({label, info}) => {
    return (<label className='info-item'> <span>{label}</span> <span className='info-small-text'>{info}</span> </label>)
}

export default FileInspector;
