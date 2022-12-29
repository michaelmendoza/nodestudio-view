import './FileInspector.scss';
import { useAppState } from '../../state/AppState';
import Divider from '../Divider/Divider';
import { formatNumber } from '../../libraries/Format';

const FileInspector = () => {
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

export default FileInspector;
