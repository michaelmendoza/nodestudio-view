import './Slider.scss';
import { useState } from 'react';
import { useEffect } from 'react';

const Slider = ({ value, onChange, onMouseUp, label='', min = 0, max = 100, step = 1, className=''}) => {

    const [_value, setValue] = useState(0);

    useEffect(() => {
        if(value !== undefined) setValue(value);
    }, [value])

    const handleChange = (e) => {
        const value = parseInt(e.target.value);
        setValue(value);
        if(onChange) onChange(value);
    }

    const handleMouseUp = (e) => {
        const value = parseInt(e.target.value);
        setValue(value);
        if (onMouseUp) onMouseUp(value);
    }
    
    return (
        <div className={ 'slider layout-row-center layout-space-between ' + className }>
            { label !== '' ? <label> {label} </label> : null }
            <span className='slider-input flex'>
                <input type="range" name="zoom" 
                    value={_value} 
                    min={min} 
                    max={max}
                    step={step}
                    onMouseUp={handleMouseUp}
                    onChange={handleChange}/>
            </span>
            <label> {_value} </label>
        </div>
    )
}

export default Slider;
