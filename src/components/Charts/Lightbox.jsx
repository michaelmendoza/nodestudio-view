import * as THREE from 'three';
import ChartBase from './ChartBase';
import { Chart2D_FragmentShader, Chart2D_VertexShader } from './ChartShaders';

const Lightbox = ({dataset, update}) => {

    const renderDataset = async (dataset, viewport) => {

        dataset = dataset.dataset
        const length = dataset.shape[0]; //4;
        const factor =  Math.ceil(Math.sqrt(dataset.shape[0]));
        const width = 100 / factor;
        const height = 100 / factor;

        for(var i = 0; i < length; i++) {
            const offset = { x: width * (i % factor) - (100 - width) / 2, y: height * Math.floor(i / factor) - (100 - height) / 2 }
            const _length = dataset.shape[1] * dataset.shape[2];
            
            const _dataset = { };
            _dataset.shape = [dataset.shape[1], dataset.shape[2], 1];
            _dataset.data = dataset.data.slice( _length * i, _length * (i+1)); 
            renderDataslice(_dataset, viewport, width, height, offset);
        }
    }

    const renderDataslice = async (dataset, viewport, width, height, offset) => {
        console.log('renderUpdate')

        const data = dataset.data;
        const shape = dataset.shape
        if(shape[2] === undefined) shape[2] = 1;

        const VertexShader = Chart2D_VertexShader;
        const FragmentShader = Chart2D_FragmentShader;

        const planeWidth = width; //50
        const planeHeight = height; //50;

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

        const mesh = new THREE.Mesh( geometry, material );
        mesh.position.x = offset.x;
        mesh.position.y = offset.y;

        viewport.current.scene.add( mesh );
        viewport.current.mesh = mesh;
    }

    return (<ChartBase dataset={dataset} update={update} renderDataset={renderDataset}></ChartBase>)
}

export default Lightbox;