import './Chart2D.scss';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls" 
import { debounce } from '../../libraries/Utils';
import { ActionTypes, useAppState } from '../../state';
import ChartControls from './ChartControls';

const raycaster = new THREE.Raycaster();
var camera, scene, renderer;
var geometry, material, mesh;
  
const ChartBase = () => {
    const { dispatch } = useAppState();

    const ref = useRef();
    const controls = useRef();
    const viewport = useRef({ isInit: false });
    const frustumSize = 100;

    useEffect(()=>{
        if(viewport.current.isInit) return;

        init();
        animate();

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('resize', () => debounce(handleResize, 100, 'Chart2D-resize'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    
    /*
    useEffect(() => {
        //if(dataset) debounce(() => renderDataset(dataset, viewport), 100, `ChartBase-${viewport.current.id}` ) ;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [update])
    */

    const init = () => {
        var width = ref.current.clientWidth;
        var height = ref.current.clientHeight;
        var aspect = width / height;

        camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 1000 )
        camera.position.z = 10;
        viewport.current.camera = camera;

        scene = new THREE.Scene();
        viewport.current.scene = scene;
        
        geometry = new THREE.BoxGeometry( 1, 1, 1 );
        material = new THREE.MeshNormalMaterial();
        mesh = new THREE.Mesh( geometry, material );
        mesh.position.set(0, 0, 0);
        scene.add( mesh );
        
        const size = 100;
        const divisions = 13; //16;
        const gridHelper = new THREE.GridHelper( size, divisions );
        gridHelper.rotation.x = Math.PI / 2;
        gridHelper.position.z = 1;
        scene.add( gridHelper );

        renderer = new THREE.WebGLRenderer( { antialias: true } );
        viewport.current.renderer = renderer;
        renderer.setSize( ref.current.offsetWidth, ref.current.offsetHeight );
        ref.current.appendChild( renderer.domElement );

        const controls = new ChartControls( camera, renderer.domElement);
        //controls.current = new OrbitControls( camera, renderer.domElement );
        //controls.current.update();

        viewport.current.isInit = true;
        viewport.current.id = crypto.randomUUID();

        dispatch({ type: ActionTypes.SET_VIEWPORT, payload: viewport });
    }
    
    const updateDepth = (value) => {
        if(viewport.current.mesh)
            viewport.current.mesh.material.uniforms[ "depth" ].value = value;
    }

    const animate = () => {
        requestAnimationFrame( animate );
        if(controls.current) controls.current.update();
        raycast();
        renderer.render( scene, camera );
    }

    const raycast = () => {
        const pointer = viewport.current.pointer;
        if (!pointer) return;

        raycaster.setFromCamera( pointer, camera );
        // calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects( scene.children );
        if (intersects.length === 0) return;

        let pointerUV = null;
        for ( let i = 0; i < intersects.length; i ++ ) {
            if(intersects[i].uv)
                pointerUV = intersects[i].uv
        }

        let pointerPixel = new THREE.Vector2();
        pointerPixel.x = pointerUV.x * viewport.current.dataset.dataset.shape[1];
        pointerPixel.y = pointerUV.y * viewport.current.dataset.dataset.shape[0];

        viewport.current.pointerUV = pointerUV;
        viewport.current.pointerPixel = pointerPixel;
        dispatch({ type: ActionTypes.SET_VIEWPORT, payload: viewport });
    }    

    const handleResize = () => {
        var width = ref.current.clientWidth;
        var height = ref.current.clientHeight;
        var aspect = width / height;
        console.log(`Resized to: ${width}, ${height}, ${aspect}`);

        // Update aspect ratio
        const camera = viewport.current.camera;
        camera.left = frustumSize * aspect / - 2;
        camera.right = frustumSize * aspect / 2;
        camera.top = frustumSize / 2;
        camera.bottom = frustumSize / - 2;
        camera.updateProjectionMatrix();

        // Update renderer
        renderer.setSize( width, height );
    }

    const handlePointerMove = (event) => {
        var width = ref.current.clientWidth;
        var height = ref.current.clientHeight;
        var rect = ref.current.getBoundingClientRect();
        const x = event.pageX - rect.left;
        const y = event.pageY - rect.top;

        const pointer = new THREE.Vector2();
        pointer.x = ( x/ width ) * 2 - 1;
        pointer.y = - ( y / height ) * 2 + 1;

        viewport.current.pointer = pointer;
    }

    const p = viewport?.current?.pointerPixel;

    return (<div className='chart-2d'>
            <div className="viewport-3d" style={{width:'100%', height:'600px'}} ref={ref}></div>
            <div> u:{ p?.x } v:{ p?.y }</div>
        </div>
    )
}

export default ChartBase;