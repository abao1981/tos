import {Vector3, Box3, Object3D} from '../../build/three.module.js';

let _box3A = new Box3();

export function removeObject(renderer, scene, mesh){
    if (!mesh) return;
    mesh.geometry.dispose();
    mesh.material.dispose();
    scene.remove( mesh );
    renderer.renderLists.dispose();
}

export function removeObjects(renderer, scene, meshes){
    if (!meshes.length) return;
    for (let mesh of meshes){
        mesh.geometry.dispose();
        mesh.material.dispose();
        scene.remove( mesh );
    }
    renderer.renderLists.dispose();
}

export function computeCameraPosition(box3OrObject){
    var {min, max} = box3OrObject.isBox3
        ? _box3A.copy(box3OrObject)
        : _box3A.setFromObject(box3OrObject);
    let center = new Vector3().copy(min).add(max).divideScalar(2);
    let l = max.distanceTo(min) * 0.618;
    let position = new Vector3().copy(center).addScaledVector(new Vector3(1, -1, 1), l);
    return {
        center, position
    };
}

export function cleanup(_scene, debug = true) {
    THREE.Cache.clear();
    let children = [];
    let others = [];
    _scene.traverse(child => {
        if (child.isMesh) {
            children.push(child);
        }else{
            others.push(child);
        }
    });
    children.forEach(c => {
        _scene.remove(c);
        c.material && c.material.dispose();
        c.geometry && c.geometry.dispose();
    })
    if (debug) {
        console.warn(others)
        console.warn('does not cleanup');
    }
}