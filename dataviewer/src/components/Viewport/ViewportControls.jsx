import './ViewportControls.scss';
import { range } from '../../libraries/Utils';
import Slider from '../Slider/Slider';
import { useAppState } from '../../state';

const ViewportControls = ({ view, onUpdate, datasliceKey = 'z' }) => {
    const { state } = useAppState();
    const indices = state.activeDataset ? state.activeDataset.indices : [0,0,0];
    const maxIndices = state.activeDataset ? state.activeDataset.maxIndices : [1,1,1];

    let viewIndices;
    if (view?.dataset?.ndim === 2) {
        viewIndices = [0, 1];
    }
    else if (datasliceKey === 'x') {
        viewIndices = [0, 2];
    }
    else if (datasliceKey === 'y') {
        viewIndices = [0, 1];
    }
    else { // datasliceKey == 'z'
        viewIndices = [1, 2];
    }
    let keys = range(0, indices.length);
    keys = keys.filter((i) => i !== viewIndices[0] && i !== viewIndices[1] &&  maxIndices[i] > 0);

    const handleIndexUpdate = (index, value) => {
        console.log(index, value);
        state.activeDataset.updateIndex(index, value);
        onUpdate();
    }

    const dims = state?.activeDataset?.metadata?.dims;
    return (<div className='viewport-controls'>
        {
            keys?.map((key) => { 
                const label = dims ? dims[key] : '';
                const value = indices ? indices[key] : 0;
                const max = maxIndices ? maxIndices[key] : 1;
                return <div key={key} className='viewport-control-item  layout-row-center'> 
                <Slider label={label} value={value} onChange={(value) => handleIndexUpdate(key, value)} max={max}></Slider> 
            </div>})
        }
    </div>)
}

export default ViewportControls;