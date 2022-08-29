import './ViewportControls.scss';
import { range } from '../../libraries/Utils';
import Slider from '../Slider/Slider';

const ViewportControls = ({ indices, setIndices, maxIndices, onUpdate }) => {

    const view = [1, 2];
    let keys = range(0, indices.length);
    keys = keys.filter((i) => i !== view[0] && i !== view[1] && indices[i] > 1);

    const handleIndexUpdate = (index, value) => {
        const _indices = [...indices];
        _indices[index] = value;
        setIndices(_indices);
        onUpdate(_indices);
    }

    return (<div className='viewport-controls'>
        {
            keys.map((key) => <div className='viewport-control-item  layout-row-center'> 
                <div className='label'> {key} </div> 
                <Slider value={indices[key]} onChange={(value) => handleIndexUpdate(key, value)} max={maxIndices[key]}></Slider> 
            </div>)
        }
    </div>)
}

export default ViewportControls;