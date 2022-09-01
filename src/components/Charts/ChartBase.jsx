import './Chart2D.scss';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls" 
import { debounce } from '../../libraries/Utils';

var camera, scene, renderer;
var geometry, material, mesh;
  
const ChartBase = ({ dataset, renderDataset }) => {
    const ref = useRef();
    const controls = useRef();
    const viewport = useRef({ isInit: false });
    const frustumSize = 100;

    useEffect(()=>{
        if(viewport.current.isInit) return;

        init();
        animate();
        window.addEventListener('resize', () => debounce(handleResize, 100, 'Chart2D-resize'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    
    useEffect(() => {
        if(dataset) debounce(() => renderDataset(dataset, viewport), 100, `ChartBase-${viewport.current.id}` ) ;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataset])

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
        viewport.current.mesh = mesh;
        mesh.position.set(0, 0, 0);
        scene.add( mesh );
        
        const size = 100;
        const divisions = 16;
        const gridHelper = new THREE.GridHelper( size, divisions );
        gridHelper.rotation.x = Math.PI / 2;
        gridHelper.position.z = 1;
        scene.add( gridHelper );

        renderer = new THREE.WebGLRenderer( { antialias: true } );
        viewport.current.renderer = renderer;
        renderer.setSize( ref.current.offsetWidth, ref.current.offsetHeight );
        ref.current.appendChild( renderer.domElement );

        controls.current = new OrbitControls( camera, renderer.domElement );
        controls.current.update();

        viewport.current.isInit = true;
        viewport.current.id = crypto.randomUUID();
    }
    
    const updateDepth = (value) => {
        if(viewport.current.mesh)
            viewport.current.mesh.material.uniforms[ "depth" ].value = value;
    }

    const animate = () => {
        requestAnimationFrame( animate );
        if(controls.current) controls.current.update();
        renderer.render( scene, camera );
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

    return (<div className='chart-2d'>
            <div className="viewport-3d" style={{width:'100%', height:'600px'}} ref={ref}></div>
        </div>
    )
}

export default ChartBase;