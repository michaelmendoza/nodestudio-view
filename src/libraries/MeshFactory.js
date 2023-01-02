import * as THREE from 'three';
import { isNumber } from './Utils';

export class GridHelper extends THREE.LineSegments {

	constructor( size = [10, 10], divisions = 10, color1 = 0x444444, color2 = 0x888888 ) {

        if (isNumber(size)) {
            size = [size, size];
        }

		color1 = new THREE.Color( color1 );
		color2 = new THREE.Color( color2 );

		const center = divisions / 2;
		const step = [size[0] / divisions, size[1] / divisions];
        const halfSize = [size[0] / 2, size[1] / 2]

		const vertices = [], colors = [];

        let k = [- halfSize[0], - halfSize[1]]

		for ( let i = 0, j = 0; i <= divisions; i ++ ) {

			vertices.push( - halfSize[1], 0, k[0], halfSize[1], 0, k[0] );
			vertices.push( k[1], 0, - halfSize[0], k[1], 0, halfSize[0] );

			const color = i === center ? color1 : color2;

			color.toArray( colors, j ); j += 3;
			color.toArray( colors, j ); j += 3;
			color.toArray( colors, j ); j += 3;
			color.toArray( colors, j ); j += 3;

            k[0] = k[0] + step[0];
            k[1] = k[1] + step[1];
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
		geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

		const material = new THREE.LineBasicMaterial( { vertexColors: true, toneMapped: false } );

		super( geometry, material );

		this.type = 'GridHelper';

	}

	dispose() {

		this.geometry.dispose();
		this.material.dispose();

	}

}