import { generateDefaultIndices, generateKeyFromIndices } from "../../libraries/ArrayIndexer";
import { decodeDataset, scaleDataset } from "../../libraries/Data";
import APIDataService from "../../services/APIDataService";

import * as THREE from 'three';
import { Chart2D_FragmentShader, Chart2D_VertexShader } from "../../components/Charts/ChartShaders";
import { throttle } from "../../libraries/Utils";
import Contrast from './Contrast';
import ROIViewer from "../../components/Charts/ROIViewer";


class Dataset {

    constructor(file, viewport) {
        this.viewport = viewport;

        this.file = file;
        this.metadata = null;
        this.dataset = null; // TODO: Refactor to dataslice 
        this.viewMode = '2D View';

        this.indices = [0,0,0];
        this.maxIndices = [1,1,1];

        this.key = '[0,:,:]';
        this.dims = "['Sli','Lin','Col']";
        this.update = 0;

        this.contrast = new Contrast();
        this.roi = null;
    }

    init = async (viewMode) => {
        this.viewport.dataset = this;

        // Initalize dataset with data and metadata
        this.setViewMode(viewMode);
        await this.fetchMetadata();
        await this.fetchDataset();
        this.render();

        // Initialize ROI 
        if (this.roi === null) { 
            this.roi = new ROIViewer(this.viewport, this);
        }
        else {
            this.roi.reset();
            this.roi.render();
        }
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
        if (this.viewMode === 'Lightbox') {
            this.key = generateKeyFromIndices(this.metadata.shape, this.indices, [0,1,2]);      
            this.dims = "['Lin','Col','Sli']"; 
        }
        else { // 2D View
            this.key = generateKeyFromIndices(this.metadata.shape, this.indices);
            this.dims = "['Sli','Lin','Col']";
        }
        
        let data = await APIDataService.getFileData(this.file.id, this.key, this.dims);
        if (data.isEncoded) {
            data = decodeDataset({ data: data.data, shape: data.shape, min: data.min, max: data.max, dtype: data.dtype })
        } 

        this.dataset = data;
        this.dataset = scaleDataset({ data: data.data, shape: data.shape, min: data.min, max: data.max, dtype: data.dtype, useContrast:true, contrast: this.contrast })
        this.update++;
    }

    render = () => {
        if(this.viewMode === '2D View') this.render2D();
        if(this.viewMode === 'Lightbox') this.renderLightbox();
    }

    updateRender = async () => {
        const _render = async() => {
            await this.fetchDataset();
            await this.render();
        }

        throttle(() => _render(), 50, 'Dataset-Update');
    }

    create2DTexture = (data = this.dataset.data, shape = this.dataset.shape) => {
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
            Object.values(this.viewport.mesh_lightbox).forEach((mesh) => { 
                this.viewport.scene.remove(mesh)
            });
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

    renderLightbox = async () => {
        if (!this.viewport) return;
        const viewport = this.viewport;
        const dataset = this.dataset;

        if(!this.viewport.mesh_lightbox) this.viewport.mesh_lightbox = {};

        // Clear Mesh from 2D Render  
        if(this.viewport.mesh_2D) {
            this.viewport.scene.remove(this.viewport.mesh_2D)
            this.viewport.mesh_2D = null;
        }

        const length = dataset.shape[0]; //dataset.shape[0]; //4;
        const factor =  Math.ceil(Math.sqrt(length));
        const width = 100 / factor;
        const height = 100 / factor;

        const shape = [...this.dataset.shape]
        shape[0] = this.dataset.shape[1];
        shape[1] = this.dataset.shape[2];
        shape[2] = this.dataset.shape[0];
        const texture = this.create2DTexture(this.dataset.data, shape);

        for(var i = 0; i < length; i++) {
            const offset = { x: width * (i % factor) - (100 - width) / 2, y: height * Math.floor(i / factor) - (100 - height) / 2 }

            //const _length = dataset.shape[1] * dataset.shape[2];
            const _dataset = { };
            //_dataset.shape = [dataset.shape[1], dataset.shape[2], 1];
            //_dataset.data = dataset.data.slice( _length * i, _length * (i+1)); 

            this.renderSlice(texture, _dataset, viewport, width, height, offset, i);
        }
    }

    renderSlice = async (texture, dataset, viewport, width, height, offset, meshIndex) => {
        console.log('renderUpdate dataslice')
        
        //texture = this.create2DTexture(dataset.data, dataset.shape);

        const VertexShader = Chart2D_VertexShader;
        const FragmentShader = Chart2D_FragmentShader;

        const planeWidth = width; //50
        const planeHeight = height; //50;

        if(this.viewport.mesh_lightbox[meshIndex]) {
            this.viewport.mesh_lightbox[meshIndex].material.uniforms[ "diffuse" ].value = texture;
        }
        else {
            const material = new THREE.ShaderMaterial( {
                uniforms: {
                    diffuse: { value: texture },
                    depth: { value: meshIndex },
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