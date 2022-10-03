import * as THREE from 'three';
import ChartBase from './ChartBase';
import { Chart2D_FragmentShader, Chart2D_VertexShader } from './ChartShaders';

const Chart2D = ({dataset, update}) => {

    const renderDataset = async (dataset, viewport) => {
        console.log('renderUpdate')

        const data = dataset.dataset.data;
        const shape = dataset.dataset.shape;
        if(shape[2] === undefined) shape[2] = 1;

        const VertexShader = Chart2D_VertexShader;
        const FragmentShader = Chart2D_FragmentShader;

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

        const mesh = new THREE.Mesh( geometry, material );

        viewport.current.scene.add( mesh );
        viewport.current.mesh = mesh;
    }

    return (<div>
        <div> {update} </div>
        <ChartBase dataset={dataset} update={update} renderDataset={renderDataset}></ChartBase>
    </div>)
}

export default Chart2D;