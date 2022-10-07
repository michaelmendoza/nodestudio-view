import './Chart2D.scss';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls" 
import { datasetToPointCloud } from '../../libraries/Data';
import { phantom_generator } from '../../libraries/Python';
import Slider from '../Slider/Slider';

var camera, scene, renderer;
var geometry, material, mesh;
  
const Chart2D = ({ dataset, drawUpdate }) => {
    const ref = useRef();
    const controls = useRef();
    const viewport = useRef({ isInit: false });
    const boxDict = useRef({});

    useEffect(()=>{
        if(viewport.current.isInit) return;

        init();
        animate();
        //renderTexture();
        //render2();
    }, [])
    
    useEffect(() => {
        console.log('drawUpdate')
        //update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [drawUpdate])

    const render = async () => {
        const dataset = await phantom_generator(64, 64, 2);
        const data = dataset[0]
        const shape = dataset[1]
        const pointCloud = datasetToPointCloud(data, shape);
        console.log(pointCloud.length)

        const xOffset = shape[1] / 2;
        const yOffset = shape[0] / 2;
        pointCloud.forEach((p) => {
            if(boxDict.current[p.x +'-'+ p.y] === undefined) {
                geometry = new THREE.BoxGeometry( 1, 1, 1 );
                //material = new THREE.MeshNormalMaterial();
                const c = p.value / 255
                const color = new THREE.Color( c, c, c );
                const material = new THREE.MeshBasicMaterial( { color } );
                mesh = new THREE.Mesh( geometry, material );
                mesh.position.set(p.x - xOffset, p.y + yOffset, 0);
                viewport.current.scene.add( mesh );
                boxDict.current[p.x +'-'+ p.y] = mesh;
            }
        });
    }

    const render2 = async () => {
        const PARTICLE_SIZE = 3;

        const dataset = await phantom_generator(256, 256, 2);
        const data = dataset[0]
        const shape = dataset[1]
        const pointCloud = datasetToPointCloud(data, shape);
        console.log(pointCloud.length)

        const xOffset = shape[1] / 2;
        const yOffset = shape[0] / 2;
        const vertices = [];
        const colors = [];
        const sizes = []
        for ( let i = 0; i < pointCloud.length; i ++ ) {
            const c = pointCloud[i].value / 255;
            const x = pointCloud[i].x - xOffset;
            const y = pointCloud[i].y + yOffset;
            const z = 0
            vertices.push( x, y, z );
            colors.push( c, c, c );
            sizes.push(PARTICLE_SIZE * 0.5);
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
        geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
        const material = new THREE.PointsMaterial({ size: PARTICLE_SIZE });
        const points = new THREE.Points( geometry, material );

        viewport.current.scene.add( points );        
    }

    const renderTexture = async () => {
        const dataset = await phantom_generator(256, 256, 8);
        const data = dataset[0];
        const shape = dataset[1];
        if(shape[2] === undefined) shape[2] = 1;

        const VertexShader = `
        uniform vec2 size;
        out vec2 vUv;

        void main() {

            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

            // Convert position.xy to 1.0-0.0

            vUv.xy = position.xy / size + 0.5;
            vUv.y = 1.0 - vUv.y; // original data is upside down

        }`;

        const FragmentShader = `
        precision highp float;
        precision highp int;
        precision highp sampler2DArray;

        uniform sampler2DArray diffuse;
        in vec2 vUv;
        uniform int depth;

        out vec4 outColor;

        void main() {

            vec4 color = texture( diffuse, vec3( vUv, depth ) );

            // lighten a bit
            outColor = vec4( color.rrr * 1.5, 1.0 );

        }
        `;

        const planeWidth = 100
        const planeHeight = 100;

        const texture = new THREE.DataArrayTexture( data, shape[0], shape[1], shape[2] );
        texture.format = THREE.RedFormat;
        texture.needsUpdate = true;

        const material = new THREE.ShaderMaterial( {
            uniforms: {
                diffuse: { value: texture },
                depth: { value: 0 },
                size: { value: new THREE.Vector2( planeWidth, planeHeight ) }
            },
            vertexShader: VertexShader,
            fragmentShader: FragmentShader,
            glslVersion: THREE.GLSL3
        } );

        const geometry = new THREE.PlaneGeometry( planeWidth, planeHeight );

        mesh = new THREE.Mesh( geometry, material );

        viewport.current.scene.add( mesh );
        viewport.current.mesh = mesh;
    }

    const init = () => {
        var width = ref.current.clientWidth;
        var height = ref.current.clientHeight;
        var aspect = width / height;
        const frustumSize = 100;

        camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 1000 )
        camera.position.z = 10;

        //camera = new THREE.PerspectiveCamera( 70, width / height, 0.01, 1000 );     
        //camera.position.z = 50;

        scene = new THREE.Scene();
        viewport.current.scene = scene;
        
        geometry = new THREE.BoxGeometry( 1, 1, 1 );
        material = new THREE.MeshNormalMaterial();
        mesh = new THREE.Mesh( geometry, material );
        mesh.position.set(0, 0, 0);
        scene.add( mesh );
        
        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setSize( ref.current.offsetWidth, ref.current.offsetHeight );
        ref.current.appendChild( renderer.domElement );

        controls.current = new OrbitControls( camera, renderer.domElement );
        controls.current.update();

        viewport.current.isInit = true;
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

    return (<div className='chart-2d'>
            <div className="webgl-viewport" style={{width:'100%', height:'600px'}} ref={ref}></div>
            <Slider onChange={updateDepth} max={8}></Slider>
        </div>
    )
}

export default Chart2D;