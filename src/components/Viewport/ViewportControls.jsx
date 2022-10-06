import './ViewportControls.scss';
import { range } from '../../libraries/Utils';
import Slider from '../Slider/Slider';
import { useAppState } from '../../state';

const ViewportControls = ({ onUpdate }) => {
    const { state } = useAppState();
    const indices = state.activeDataset ? state.activeDataset.indices : [0,0,0];
    const maxIndices = state.activeDataset ? state.activeDataset.maxIndices : [1,1,1];

    const view = [1, 2];
    let keys = range(0, indices.length);
    keys = keys.filter((i) => i !== view[0] && i !== view[1] && indices[i] > 1);

    const handleIndexUpdate = (index, value) => {
        console.log(index, value);
        state.activeDataset.updateIndex(index, value);
        if (index === 0)
            state.viewport.roi.setDepth(value);
        onUpdate();
    }

    return (<div className='viewport-controls'>
        {
            keys.map((key) => <div key={key} className='viewport-control-item  layout-row-center'> 
                <div className='label'> {key} </div> 
                <Slider value={indices[key]} onChange={(value) => handleIndexUpdate(key, value)} max={maxIndices[key]}></Slider> 
            </div>)
        }
    </div>)
}

export default ViewportControls;