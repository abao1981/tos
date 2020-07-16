import * as THREE from '../build/three.module.js';
import CameraControls from '../../jsm/controls/camera-controls.module.js';
CameraControls.install({ THREE: THREE });
import Select from './lib/select.js';
import { Pin } from './lib/markIt.js';

export let light, camera, scene, renderer, controls, pinControls, clock, cube, cubeCamera;
export let tempControls;

init();
animate();

function init(container = document.body) {
    scene = new THREE.Scene();
    scene.background = 0x101010;

    clock = new THREE.Clock();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.up.set(0, 0, 1);
    camera.position.set(100, 200, 30);

    renderer = new THREE.WebGLRenderer({
        //增加下面两个属性，可以抗锯齿
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true
    });
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0xffffff, 1);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    let select = new Select(camera, scene, renderer, 'selectBox');
    select.boxSelectEnabled = true;
    select.autoClear = true;


    light = new THREE.DirectionalLight(0xFFFFFF, 1.0, 0);
    light.position.set(100, 100, 200);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    window.addEventListener('resize', onWindowResize, false);
    container.appendChild(renderer.domElement);
    controls = new CameraControls(camera, renderer.domElement);
    controls.dollyToCursor = true;
    controls.minDistance = -1 / 0;
    controls.mouseButtons.left = CameraControls.ACTION['NONE'];
    controls.mouseButtons.middle = CameraControls.ACTION['TRUCK'];
    controls.mouseButtons.right = CameraControls.ACTION['ROTATE'];
    controls.mouseButtons.wheel = CameraControls.ACTION['DOLLY'];
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minPolarAngle = -Math.PI / 2;

    let pinCreator = new Pin(scene, camera, controls, select);
    pinCreator.start();

}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    controls.update(delta);
    renderer.render(scene, camera);
}