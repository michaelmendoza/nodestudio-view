import { generateDefaultIndices, generateKeyFromIndices } from "../../libraries/ArrayIndexer";
import { decodeDataset, scaleDataset } from "../../libraries/Data";
import APIDataService from "../../services/APIDataService";

import * as THREE from 'three';
import { Chart2D_FragmentShader, Chart2D_VertexShader } from "../../components/Charts/ChartShaders";
import { throttle } from "../../libraries/Utils";
import Contrast from './Contrast';


class Dataset {

    constructor(file, viewport) {
        this.viewport = viewport;
        this.viewport.dataset = this;

        this.file = file;
        this.metadata = null;
        this.dataset = null;
        this.viewMode = '2D View';

        this.indices = [0,0,0];
        this.maxIndices = [1,1,1];

        this.key = '[0,:,:]';
        this.update = 0;

        this.contrast = new Contrast();
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

        // If not encoded 
        //this.contrast.autoContrastMinMax(this.metadata.min, this.metadata.max);
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

        this.dataset = data;
        this.dataset = scaleDataset({ data: data.data, shape: data.shape, min: data.min, max: data.max, dtype: data.dtype, useContrast:true, contrast: this.contrast })
        this.update++;
    }

    render = () => {
        if(this.viewMode === '2D View') this.render2D();
        if(this.viewMode === 'Lightbox') this.renderDataset();
    }

    updateRender = async () => {
        const _render = async() => {
            await this.fetchDataset();
            await this.render();
        }

        throttle(() => _render(), 50, 'Dataset-Update');
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

        // Clear Mesh from Lightbox 
        if(this.viewport.mesh_lightbox) {
            Object.values(this.viewport.mesh_lightbox).forEach((mesh) => this.viewport.scene.remove(mesh));
            this.viewport.mesh_lightbox = null;
        }

        const texture = this.create2DTexture()

        if (this.viewport.mesh_2D) {
            this.viewport.mesh_2D.material.uniforms[ "diffuse" ].value = texture;
        }
        else {
            const planeWidth = 100
            const planeHeight = 100;
            const material = this.createMaterial(texture);
            const geometry = new THREE.PlaneGeometry( planeWidth, planeHeight );
            const mesh = new THREE.Mesh( geometry, material );
    
            this.viewport.scene.add( mesh );    
            this.viewport.mesh_2D = mesh;      
        }
    }

    renderDataset = async () => {
        if (!this.viewport) return;
        const viewport = this.viewport;
        const dataset = this.dataset;

        if(!this.viewport.mesh_lightbox) this.viewport.mesh_lightbox = {};

        // Clear Mesh from 2D Render  
        if(this.viewport.mesh_2D) {
            this.viewport.scene.remove(this.viewport.mesh_2D)
            this.viewport.mesh_2D = null;
        }

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

            this.renderDataslice(_dataset, viewport, width, height, offset, i);
        }
    }

    renderDataslice = async (dataset, viewport, width, height, offset, meshIndex) => {
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

        if(this.viewport.mesh_lightbox[meshIndex]) {
            this.viewport.mesh_lightbox[meshIndex].material.uniforms[ "diffuse" ].value = texture;
        }
        else {
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
    
            viewport.scene.add( mesh );
            this.viewport.mesh_lightbox[meshIndex] = mesh;
        }
    }

}

export default Dataset;