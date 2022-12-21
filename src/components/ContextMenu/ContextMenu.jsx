import './ContextMenu.scss';
import { useState } from "react";
import { useEffect, useRef } from "react";
import { setMouseState, STATE } from '../Charts/ChartControls';

const ContextMenu = ({domElement}) => {

    const ref = useRef({ init:false, show:false, x: 0, y: 0 });
    const [show, setShow] = useState(false);

    useEffect(() => {
        if(!ref.current.init & domElement !== undefined) {
            ref.current.init = true;
            domElement.addEventListener( 'contextmenu', onContextMenu );
            return () => { 
                domElement.removeEventListener('contextmenu', onContextMenu );
            };
        }
    }, [domElement])

    const onContextMenu = (event) => {
        setShow(!ref.current.show)
        ref.current.show = !ref.current.show;
        ref.current.x = event.clientX;
        ref.current.y = event.clientY;
    }

    const closeMenu = () => {
        setShow(false);
        ref.current.show = false;
    }

    const handleMenuClick = (state) => {
        setShow(false);
        ref.current.show = false;
        setMouseState(state)
    }

    var rect = domElement?.getBoundingClientRect();
    return (<div className="context-menu">
        {
            show ? <div className='context-menu-contents'>
                <div className='context-menu-background' onClick={closeMenu}></div>
                <div className='context-menu-options' style={{ top: ref.current.y - rect.top, left: ref.current.x - rect.left }}>
                    <div className='context-menu-header'> 
                        <label> Left Click Mode </label>
                    </div>
                    <button className="button-dark" onClick={() => handleMenuClick(STATE.ROI)}> ROI </button>
                    <button className="button-dark" onClick={() => handleMenuClick(STATE.PAN)}> Pan </button>
                    <button className="button-dark" onClick={() => handleMenuClick(STATE.ZOOM)}> Zoom </button>
                </div> 
            </div>: null
        }
    </div>)
}

export default ContextMenu;