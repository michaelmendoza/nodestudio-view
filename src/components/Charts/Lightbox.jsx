import * as THREE from 'three';
import ChartBase from './ChartBase';
import { Chart2D_FragmentShader, Chart2D_VertexShader } from './ChartShaders';

const Lightbox = ({dataset}) => {

    const renderDataset = async (dataset, viewport) => {

        const length = 4;
        const width = 100 / 2;
        const height = 100 / 2;

        for(var i = 0; i < length; i++) {
            const offset = { x: width * (i % 2) - width / 2, y: height * Math.floor(i / 2) - height / 2 }
            renderDataslice(dataset, viewport, offset);
        }
    }

    const renderDataslice = async (dataset, viewport, offset) => {
        console.log('renderUpdate')

        const data = dataset.data;
        const shape = dataset.shape
        if(shape[2] === undefined) shape[2] = 1;

        const VertexShader = Chart2D_VertexShader;
        const FragmentShader = Chart2D_FragmentShader;

        const planeWidth = 50
        const planeHeight = 50;

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

    return (<ChartBase dataset={dataset} renderDataset={renderDataset}></ChartBase>)
}

export default Lightbox;