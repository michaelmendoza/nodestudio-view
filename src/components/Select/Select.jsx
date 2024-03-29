
import { useState } from 'react';
import './Select.scss';

const Select = ({options, value=undefined, onChange, placeholder='Select ...', className=''}) => {
    const [show, setShow] = useState(false);
    const [_value, setValue] = useState(value);
    const onBlur = () => { setTimeout(() => { setShow(false) }, 250)}

    const handleClick = () => {
        setShow(!show)
    }

    const handleOptionSelect = (option) => {
        setValue(option);
        onChange(option);
        setShow(false);
    }

    return (
        <div className={'select ' + className }>
            <button className={'select-button ' + (show ? 'show':'')} onClick={handleClick} onBlur={onBlur}> { _value ? _value : placeholder } </button>
            {
                show ? <div className='layout-column select-options'>
                    { options.map((option)=><button className='select-option' key={option} onClick={(e)=>handleOptionSelect(option)}>{option}</button>)}
                </div> : null
            }
        </div>
    )
}

export default Select