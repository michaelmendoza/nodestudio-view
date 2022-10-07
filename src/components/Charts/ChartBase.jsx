import './Chart2D.scss';
import React, { useEffect, useRef } from 'react';
import { ActionTypes, useAppState } from '../../state';
import Viewer from '../../state/models/Viewer';

const ChartBase = () => {
    const { state, dispatch } = useAppState();
    const isInit = useRef(false);
    const ref = useRef();

    useEffect(()=>{
        if(isInit.current) return;
        init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    
    const init = () => {
        const viewer = new Viewer(ref, dispatch);
        isInit.current = true;
        dispatch({ type: ActionTypes.SET_VIEWPORT, payload: viewer });
    }

    //const p = state?.viewport?.pointerPixel;
    const height = (window.innerHeight - 100).toString() + 'px'; 
    //console.log(height);
    return (<div className='chart-2d'>
            <div className='webgl-viewport' style={{width:'100%', height:height}} ref={ref}>
            </div>
            { /*  <div> u:{ p?.x } v:{ p?.y }</div> */ }
        </div>
    )
}

export default ChartBase;