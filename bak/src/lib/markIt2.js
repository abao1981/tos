import {FBXLoader} from '../../jsm/loaders/FBXLoader.js';
import {DragControls} from '../../jsm/controls/DragControls.js';
import {Raycaster, Vector2, Geometry, Mesh} from '../../build/three.module.js';

let controller, mainControl;

let redUri = 'http://122.144.221.129/group2/M00/00/00/epDdgl72-6yAY_9VABCg2ppFepA964.fbx';
let greenUri = 'http://122.144.221.129/group2/M00/00/00/epDdgl72-OiAb2rrABB4v9qGrbE740.FBX';
let greenAlarm, redAlarm;

let loader = new FBXLoader();
loader.load( greenUri, function ( object ) {
    let geometry = new Geometry();
    let materials = [], i = 0;
    object.traverse( function ( child ) {
        if (child.isMesh){
            // child.geometry.center();
            child.geometry.rotateY(Math.PI);
            child.updateWorldMatrix();
            geometry.merge(new Geometry().fromBufferGeometry(child.geometry), child.matrixWorld, i++);
            materials.push(child.material);
        }
    } );
    greenAlarm = new Mesh(geometry, materials);
    greenAlarm.name = `func_alarm_1_${greenAlarm.uuid}`;
} );
loader.load( redUri, function ( object ) {
    let geometry = new Geometry();
    let materials = [], i = 0;
    object.traverse( function ( child ) {
        if (child.isMesh){
            // child.geometry.center();
            child.geometry.rotateY(Math.PI);
            child.updateWorldMatrix();
            geometry.merge(new Geometry().fromBufferGeometry(child.geometry), child.matrixWorld, i++);
            materials.push(child.material);
        }
    } );
    redAlarm = new Mesh(geometry, materials);
    redAlarm.name = `func_alarm_0_${redAlarm.uuid}`;
} );

let target = [];

let scene, camera;
let onAdd = undefined;
let raycaster = new Raycaster();

export function registerEmergency(_scene, _camera, container, controls) {
    mainControl = controls;
    scene = _scene;
    camera = _camera;
    controller = new DragControls(target, camera, container);
    // controller.transformGroup = true;
    controller.enabled = false;
}

export function enableEmergency() {
    controller.enabled = true;
    mainControl.enablePan = false;
    document.addEventListener('click', addDefaultEmergency);
    document.addEventListener('dblclick', replaceAlarm);
}

export function disableEmergency() {
    controller.enabled = false;
    mainControl.enablePan = true;
}

function addDefaultEmergency({ clientX, clientY }) {
    addEmergency(0, {clientX, clientY});
}

function replaceAlarm({ clientX, clientY }){
    controller.enabled = false;
    //通过鼠标点击的位置计算出raycaster所需要的点的位置，以屏幕中心为原点，值的范围为-1到1.
    let mouse = new Vector2();
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    // 通过鼠标点的位置和当前相机的矩阵计算出raycaster
    raycaster.setFromCamera(mouse, camera);

    // 获取raycaster直线和所有模型相交的数组集合
    let intersects = raycaster.intersectObjects(scene.children, false).filter(inter => inter.object.visible);
    if (intersects.length <= 0) return;

    changeColor(intersects[0].object);
    controller.enabled = true;
}

function disposeElement(obj){
    if (Array.isArray(obj.material)){
        obj.material.forEach(m => m.dispose());
    }else{
        obj.material.dispose();
    }
    obj.geometry.dispose();
}

function replaceTarget(original, obj){
    let deleteIndex = target.findIndex(o => o.uuid === original.uuid);
    target.splice(deleteIndex, 1);
    target.push(obj);
}

function changeColor(obj){
    if (obj.name.startsWith('func_alarm_0')){
        let alarm = greenAlarm.clone();
        alarm.name = `func_alarm_1_${alarm.uuid}`;
        alarm.applyMatrix4(obj.matrix)
        scene.remove(obj);
        scene.add(alarm);
        replaceTarget(obj, alarm);
        disposeElement(obj);
    }else if (obj.name.startsWith('func_alarm_1')){
        let alarm = redAlarm.clone();
        alarm.name = `func_alarm_0_${alarm.uuid}`;
        alarm.applyMatrix4(obj.matrix)
        scene.remove(obj);
        scene.add(alarm);
        replaceTarget(obj, alarm);
        disposeElement(obj);
    }else{
        return false;
    }
    return true;
}

export function addEmergency(level, { clientX, clientY }) {

    //通过鼠标点击的位置计算出raycaster所需要的点的位置，以屏幕中心为原点，值的范围为-1到1.
    let mouse = new Vector2();
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    // 通过鼠标点的位置和当前相机的矩阵计算出raycaster
    raycaster.setFromCamera(mouse, camera);

    // 获取raycaster直线和所有模型相交的数组集合
    let intersects = raycaster.intersectObjects(scene.children, false).filter(inter => inter.object.visible);
    if (intersects.length <= 0) return;

    let alarm = (level === 0 ? redAlarm : greenAlarm).clone();
    alarm.name = `func_alarm_${level}_${alarm.uuid}`;
    console.log(alarm);

    let { x, y, z } = intersects[0].point.clone().add(intersects[0].face.normal.clone().multiplyScalar(0.1));
    alarm.position.set(x, y, z);
    alarm.lookAt(intersects[0].point);

    scene.add(alarm);
    target.push(alarm);
    console.log(target);
    if (onAdd) {
        onAdd(alarm);
    }
    document.removeEventListener('click', addDefaultEmergency);
}

export function addEventListener(fn) {
    onAdd = fn;
}
