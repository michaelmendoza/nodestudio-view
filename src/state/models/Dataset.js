import { generateDefaultIndices, generateKeyFromIndices } from "../../libraries/ArrayIndexer";
import { decodeDataset, scaleDataset } from "../../libraries/Data";
import APIDataService from "../../services/APIDataService";

import * as THREE from 'three';
import { Chart2D_FragmentShader, Chart2D_VertexShader } from "../../components/Charts/ChartShaders";

class Dataset {

    constructor(file, viewport) {
        this.viewport = viewport;
        this.viewport.current.dataset = this;

        this.file = file;
        this.metadata = null;
        this.dataset = null;
        this.viewMode = '2D View';

        this.indices = [0,0,0];
        this.maxIndices = [1,1,1];

        this.key = '[0,:,:]';
        this.update = 0;
    }

    setViewMode = (viewMode) => {
        this.viewMode = viewMode;
    }

    updateIndex = (index, value) => {
        const _indices = [...this.indices];
        _indices[index] = value;
        this.indices = _indices;
    }

    /** Fetches Metadata from API */
    fetchMetadata = async () => {
        this.metadata = await APIDataService.getFileMetadata(this.file.id);
        this.indices = generateDefaultIndices(this.metadata.shape);
        this.maxIndices = this.metadata.shape.map((value) => value - 1); 
    }

    /** Fetches Dataset from API */
    fetchDataset = async () => {
        if (this.viewMode === 'Lightbox')
            this.key = generateKeyFromIndices(this.metadata.shape, this.indices, [0,1,2]);
        else
            this.key = generateKeyFromIndices(this.metadata.shape, this.indices);
        
        let data = await APIDataService.getFileData(this.file.id, this.key);
        if (data.isEncoded) {
            data = decodeDataset({ data: data.data, shape: data.shape, min: data.min, max: data.max, dtype: data.dtype })
        } 
        this.dataset = scaleDataset({ data: data.data, shape: data.shape, min: data.min, max: data.max, dtype: data.dtype })
        this.update++;
    }

    render = () => {
        if(this.viewMode === '2D View') this.render2D();
        if(this.viewMode === 'Lightbox') this.renderDataset();
    }

    create2DTexture = () => {
        const data = this.dataset.data;
        const shape = this.dataset.shape;
        if(shape[2] === undefined) shape[2] = 1;

        const texture = new THREE.DataArrayTexture( data, shape[0], shape[1], shape[2] );
        texture.format = THREE.RedFormat;
        texture.needsUpdate = true;
        return texture;
    }

    createMaterial = (texture) => {
        const VertexShader = Chart2D_VertexShader;
        const FragmentShader = Chart2D_FragmentShader;

        const planeWidth = 100
        const planeHeight = 100;

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

        return material;
    }

    render2D = () => {
        if (!this.viewport) return;
        console.log('renderUpdate 2D')

        const texture = this.create2DTexture()

        if (this.viewport.current.mesh) {
            this.viewport.current.mesh.material.uniforms[ "diffuse" ].value = texture;
        }
        else {
            const planeWidth = 100
            const planeHeight = 100;
            const material = this.createMaterial(texture);
            const geometry = new THREE.PlaneGeometry( planeWidth, planeHeight );
            const mesh = new THREE.Mesh( geometry, material );
    
            this.viewport.current.scene.add( mesh );
            this.viewport.current.mesh = mesh;            
        }
    }

    renderDataset = async () => {
        if (!this.viewport) return;

        const viewport = this.viewport;
        const dataset = this.dataset;

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
            this.renderDataslice(_dataset, viewport, width, height, offset);
        }
    }

    renderDataslice = async (dataset, viewport, width, height, offset) => {
        console.log('renderUpdate dataslice')

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
        //viewport.current.mesh = mesh;
    }

}

export default Dataset;