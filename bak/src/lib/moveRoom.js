import {renderer, scene, controls} from '../main.js';
import {Mesh,DoubleSide,Vector3, Plane, MeshBasicMaterial,BoxBufferGeometry, Box3} from '../../build/three.module.js';
import firstP from './firstPerson.js';
import {computeCameraPosition} from './utils.js';

export let quitFirstPersonMode;

export function moveIntoRoom(_min, _max, needAnimate = true){

    let min, max;
    if (Array.isArray(_min)){
        min = new Vector3(..._min);
        max = new Vector3(..._max);
    }else if (_min.isVector3){
        min = _min;
        max = _max;
    }else{
        return;
    }

    quitFirstPersonMode = firstP(controls, 0.3, needAnimate);

    let target = max.clone().add(min).divideScalar(2);
    target.z = min.z + 1.7;
    let pos = new Vector3().copy(target).addScaledVector(new Vector3(1, 0, 0), 0.5);

    controls.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, true);

}

export function moveToRoom(_min, _max, levels = []){

    let min, max;
    if (Array.isArray(_min)){
        min = new Vector3(..._min);
        max = new Vector3(..._max);
    }else if (_min.isVector3){
        min = _min;
        max = _max;
    }else{
        return;
    }

    let {position, center} = computeCameraPosition(new Box3(min, max))

    let {x, y, z} = max.clone().sub(min);

    let geometry = new BoxBufferGeometry( x - 0.01, y - 0.01, z - 0.01 );
    let material = new MeshBasicMaterial( {color: 0xffff00} );
    material.transparent = true;
    material.opacity = 0.3;
    material.side = DoubleSide;
    let cube = new Mesh( geometry, material );

    cube.position.copy(center);
    scene.add( cube );

    renderer.clippingPlanes = [
        new Plane(new Vector3( 0, 0, -1 ), max.z),
    ];

    // let upperLevels = levels.filter(l => l.Elevation >= min.z + 0.5);
    // if (upperLevels.length) {
    //     let low = upperLevels.sort((l, v) => l.Elevation - v.Elevation)[0].Elevation;
    //     renderer.clippingPlanes = [
    //         new Plane(new Vector3( 0, 0, -1 ), low),
    //     ];
    // }

    controls.setLookAt(position.x, position.y, position.z, center.x, center.y, center.z, true);
    // controls.rotate(-Math.PI / 6, Math.PI / 4, true);

    return function(){
        renderer.clippingPlanes.length = 0;
        scene.remove(cube);
        cube.material.dispose();
        cube.geometry.dispose();
    }


}