import { camera, scene, renderer } from '../main.js';
import { Vector2, Raycaster, Line, Geometry, LineBasicMaterial, Vector3 } from '../../build/three.module.js';
import { CSS2DRenderer, CSS2DObject } from '../../jsm/renderers/CSS2DRenderer.js';
import { MapControls } from '../../jsm/controls/MapControls.js';
import { removeObjects } from './utils.js';


let _mouse = new Vector2();
let _raycaster = new Raycaster();
let _container, _canvas;

let lastPos = new Vector2();

let lastPoint = undefined;
let lines = [], divs = [];


let enabled = false;
let labelRenderer;


export function enableMeasure() {
    document.addEventListener('mousedown', onDocumentMouseDown);
    document.addEventListener('mouseup', onDocumentMouseUp);
    enabled = true;
    animate();
}

export function disableMeasure() {
    document.removeEventListener('mousedown', onDocumentMouseDown);
    document.removeEventListener('mouseup', onDocumentMouseUp);
    enabled = false;
}

export function registerMeasure({ innerWidth, innerHeight } = window, canvas = document.body) {
    _container = { innerWidth, innerHeight } || window;
    _canvas = canvas;

    labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';

    canvas.appendChild(labelRenderer.domElement);
    labelRenderer.setSize(_container.innerWidth, _container.innerHeight);

    let controls = new MapControls(camera, labelRenderer.domElement);
    controls.target.set(0, 1, 0);
}


export function clear() {
    if (!lines.length) return;
    divs.forEach(div => div.style.display = 'none');
    removeObjects(renderer, scene, lines);
    lines.length = 0;
}


let events = new Map();

export function addEventListener(name, cb) {
    events.set(name, cb);
}

export function removeEventListener(name) {
    if (events.has(name)) events.delete(name);
}


function animate() {
    if (!enabled) return;
    requestAnimationFrame(animate);
    labelRenderer.render(scene, camera);
}

function getIntersect() {
    _raycaster.setFromCamera(_mouse, camera);

    let intersects = _raycaster.intersectObjects(scene.children, true).filter(intersection => intersection.object.visible);
    if (intersects.length > 0) {
        return intersects[0].point;
    }
}

function onDocumentMouseDown(event) {
    //通过鼠标点击的位置计算出raycaster所需要的点的位置，以屏幕中心为原点，值的范围为-1到1.
    lastPos.x = (event.clientX / _container.innerWidth) * 2 - 1;
    lastPos.y = -(event.clientY / _container.innerHeight) * 2 + 1;

    // let [currentMesh, instanceId] = getIntersect();
}

function drawLine(s, e, c) {
    let geometry = new Geometry();
    geometry.vertices.push(s, e);

    let material = new LineBasicMaterial({
        linewidth: 100,
        color: c,
        alphaTest: 1,
        depthTest: false,
        opacity: 2
    });

    return new Line(geometry, material);
}


function drawLines(pStart, pEnd) {
    let start = pStart.clone();
    let end = pEnd.clone();
    if (start.z < end.z) [start, end] = [end, start];
    let z = new Vector3(start.x, start.y, end.z);
    let y = new Vector3(end.x, start.y, end.z);

    let points = [start, z, y, end];
    let colors = [0xff8400, 0x00ff00, 0x0000ff, 0xff0000];
    let output = [];
    for (let k = 3, i = 0; i < 4; k = i++) {
        lines[i] = drawLine(points[k], points[i], colors[i]);
        if (!divs[i]) {
            divs[i] = document.createElement('div');
        }
        divs[i].className = 'label';
        divs[i].style.display = 'block';
        divs[i].style.marginTop = '-1em';
        output[i] = points[k].distanceTo(points[i]);
        divs[i].textContent = output[i].toFixed(2);
        let label = new CSS2DObject(divs[i]);
        let { x, y, z } = new Vector3().copy(points[k]).add(points[i]).divideScalar(2);
        label.position.set(x, y, z);
        lines[i].add(label);
    }

    scene.add(...lines);

    if (events.has('measure')){
        events.get('measure')({
            distance: output[0],
            x: output[2],
            y: output[3],
            z: output[1],
        })
    }

}

function onDocumentMouseUp(event) {
    if (event.button !== 0) return;

    //通过鼠标点击的位置计算出raycaster所需要的点的位置，以屏幕中心为原点，值的范围为-1到1.
    _mouse.x = (event.clientX / _container.innerWidth) * 2 - 1;
    _mouse.y = -(event.clientY / _container.innerHeight) * 2 + 1;

    if (lastPos.distanceTo(_mouse) > 1e-3) return;

    let point = getIntersect();
    if (!lastPoint) {
        clear();
        lastPoint = point;
    } else {
        drawLines(lastPoint, point);
        lastPoint = undefined;
    }
}

