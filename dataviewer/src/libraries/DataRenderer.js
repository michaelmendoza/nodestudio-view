import { createDataTextureMesh, getSliceDimensions } from './Render/Renderer';
import { generateKeyFromIndices } from './ArrayIndexer';

export class DatasetRenderer {
    constructor(viewport) {
        this.viewport = viewport;
        this.dataset = viewport.dataset;
        this.init();
    }

    init() {
        [this.depth, this.height, this.width] = getSliceDimensions(this.dataset.metadata.shape, this.viewport.datasliceKey);
        const blankdata = new Uint8Array(this.height * this.width).fill(0);
        this.texture = createDataTextureMesh(blankdata, this.height, this.width, 'dataslice', this.viewport.scene);
    }

    async render () {
        const { datasliceKey } = this.viewport;
        const sliceData = await this.getSliceData(datasliceKey);
        this.updateTexture(sliceData);
    }

    getViewIndices(shape, datasliceKey) {
        let viewIndices;
        if (shape.length === 2) {
            viewIndices = [0, 1];
        }
        else {
            const viewOptions = {
                'z': [1,2],
                'y': [0,2],
                'x': [1,0]
            }
            viewIndices = viewOptions[datasliceKey];
        }
        return viewIndices;
    }

    async getSliceData(datasliceKey) {
        const { indices, shape } = this.dataset;
        const viewIndices = this.getViewIndices(shape, datasliceKey);
        const key = generateKeyFromIndices(shape, indices, viewIndices);
        const sliceData = await this.dataset.fetchDataset(key);
        return sliceData.data;
    }

    updateTexture(sliceData) {
        this.texture.image.data = sliceData;
        this.texture.image.width = this.width;
        this.texture.image.height = this.height;
        this.texture.needsUpdate = true;
    }

}

/*
export const render = (viewport, dataset, viewMode) => {
    if(viewMode === '2D View') render2D(viewport, dataset);
    if(viewMode === '3D View') render2D(viewport, dataset);
    if(viewMode === 'Lightbox') renderLightbox(viewport, dataset);
}

export const updateRender = async (viewport, dataset, viewMode) => {
    const _render = async() => {
        console.log(`fetch - ${dataset.indices}`);
        await dataset.fetchDataset();
        await render(viewport, dataset, viewMode);
    }

    throttle2(() => _render(), 10, 'Dataset-Update');
}

const create2DTexture = (data, shape) => {
    if(shape[2] === undefined) shape[2] = 1;

    const texture = new THREE.DataArrayTexture( data, shape[1], shape[0], shape[2] );
    texture.format = THREE.RedFormat;
    texture.needsUpdate = true;
    return texture;
}

const create2DMaterial = (texture, planeWidth = 100, planeHeight = 100) => {
    const VertexShader = Chart2D_VertexShader;
    const FragmentShader = Chart2D_FragmentShader;

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

const render2D = (viewport, dataset) => {
    if (!viewport) return;
    console.log('renderUpdate 2D')

    // Clear Mesh from Lightbox 
    if(viewport.mesh_lightbox) {
        Object.values(viewport.mesh_lightbox).forEach((mesh) => { 
            viewport.scene.remove(mesh)
        });
        viewport.mesh_lightbox = null;
    }

    const _dataset = dataset.getData(viewport.datasliceKey);
    const texture = create2DTexture(_dataset.data, _dataset.shape);

    const factor = _dataset.shape[0] / _dataset.shape[1];
    const planeWidth = 100
    const planeHeight = planeWidth * factor;
    console.log(`render2d: slice:${viewport.datasliceKey}, factor: ${factor}, planeWidth: ${planeWidth}, planeHeight: ${planeHeight}`);

    if (viewport.mesh_2D) {
        // Update mesh texture 
        viewport.mesh_2D.material.uniforms[ "diffuse" ].value = texture;
    }
    else {
        // Reset camera controls and scale zoom with size of mesh 
        viewport.controls.reset(1 / factor); 
        viewport.grid_helper.scale.set( 1, 1 * factor, 1 );
        viewport.setGridHelper([planeHeight, planeWidth]);

        // Create material, geometry & mesh and add to scene
        const material = create2DMaterial(texture, planeWidth, planeHeight);
        const geometry = new THREE.PlaneGeometry( planeWidth, planeHeight );
        const mesh = new THREE.Mesh( geometry, material );
        mesh.name = 'dataslice';

        viewport.scene.add( mesh );    
        viewport.mesh_2D = mesh;      
    }
}

const renderLightbox = async (viewport, dataset) => {
    if (!viewport) return;

    if(!viewport.mesh_lightbox) viewport.mesh_lightbox = {};

    // Clear Mesh from 2D Render  
    if(viewport.mesh_2D) {
        viewport.scene.remove(viewport.mesh_2D)
        viewport.mesh_2D = null;
    }

    const length = dataset.dataset.shape[0];
    const factor =  Math.ceil(Math.sqrt(length));
    const width = 100 / factor;
    const height = 100 / factor;

    const shape = [...dataset.dataset.shape];
    shape[0] = dataset.dataset.shape[1];
    shape[1] = dataset.dataset.shape[2];
    shape[2] = dataset.dataset.shape[0];
    const texture = create2DTexture(dataset.dataset.data, shape);

    for(var i = 0; i < length; i++) {
        const offset = { x: width * (i % factor) - (100 - width) / 2, y: height * Math.floor(i / factor) - (100 - height) / 2 }

        renderSlice(texture, viewport, width, height, offset, i);
    }
}

const renderSlice = async (texture, viewport, width, height, offset, meshIndex) => {
    console.log('renderUpdate dataslice')
    
    const VertexShader = Chart2D_VertexShader;
    const FragmentShader = Chart2D_FragmentShader;

    const planeWidth = width; //50
    const planeHeight = height; //50;

    if(viewport.mesh_lightbox[meshIndex]) {
        viewport.mesh_lightbox[meshIndex].material.uniforms[ "diffuse" ].value = texture;
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
        viewport.mesh_lightbox[meshIndex] = mesh;
    }
}
    */