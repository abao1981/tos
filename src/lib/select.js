import { SelectionBox } from '../../jsm/interactive/SelectionBox.js';
import { SelectionHelper } from '../../jsm/interactive/SelectionHelper.js';
import * as THREE from '../../build/three.module.js'

let _mouse = new THREE.Vector2();
let _raycaster = new THREE.Raycaster();
let lastPos = new THREE.Vector2();
let _camera, _canvas, _scene;

let selectionBox, helper;
let startDrag = false;


//通过鼠标点击的位置计算出raycaster所需要的点的位置，以屏幕中心为原点，值的范围为-1到1.
function getScreenPos(event) {
    let rect = _canvas.getBoundingClientRect(),
    x = event.clientX - rect.left,
    y = event.clientY - rect.top;

    return [x / _canvas.clientWidth * 2 - 1, -y / _canvas.clientHeight * 2 + 1, 0.5];
}

function onDocumentMouseDown(event) {
    helper.enabled = this.boxSelectEnabled;
    if (!this.enabled) return;
    if (event.button !== 0) return;
    startDrag = true;

    let [x, y, z] = getScreenPos(event);
    lastPos.set(x, y);
    selectionBox.startPoint.set(x, y, z);
}

export function changeEmissive(color) {
    return function (object, indices = null) {
        let _indices = indices || object.userData.instanceIds;
        if (_indices && _indices.length) {
            for (let instanceId of _indices) {
                color.toArray(object.geometry.attributes.instanceEmissive.array, instanceId * 3);
            }
            object.geometry.attributes.instanceEmissive.needsUpdate = true;
        } else {
            if (object.material.emissive) object.material.emissive.set(color);
        }
    }
}

function onDocumentMouseMove() {
    if (!startDrag || !this.boxSelectEnabled || !this.enabled) return;
}

function onDocumentMouseUp(event) {
    if (!this.enabled) return;
    if (event.button !== 0) return;
    startDrag = false;

    let [x, y, z] = getScreenPos(event);
    _mouse.set(x, y);
    for (let name of this.unselectMap.keys()) {
        this.unselectMap.get(name)(this.selected);
    }
    // this.selected.forEach(changeEmissive(this.defaultColor));

    this.clicked = false;
    if (_mouse.distanceTo(lastPos) > 0.01 && this.boxSelectEnabled) {
        selectionBox.endPoint.set(x, y, z);
        selectionBox.select();
        this.selected = selectionBox.collection.filter(object => getFilter(object, this.topmost));
        this.point = this.selected[0].geometry.boundingSphere.center;
        this.clicked = true;
    } else {
        let currentMesh = getIntersect(this.topmost);
        if (currentMesh) {
            // TODO: 图钉点选
            if (currentMesh.type === 'Sprite') {
                if (this.spriteHandler) this.spriteHandler(currentMesh);
                return;
            }
            if (event.ctrlKey) { // add
                let existed = this.selected.find(obj => obj.uuid === currentMesh.uuid);
                if (existed && existed.userData.instanceIds) {
                    if (!existed.userData.instanceIds.some(i => i === currentMesh.userData.instanceId)) {
                        existed.userData.instanceIds.push(currentMesh.userData.instanceId);
                    }
                } else {
                    if (currentMesh.userData.instanceId !== undefined) currentMesh.userData.instanceIds = [currentMesh.userData.instanceId];
                    this.selected.push(currentMesh);
                }
                this.point = currentMesh.userData.point;
                this.clicked = true;
            } else if (event.shiftKey) {
                let existedIndex = this.selected.findIndex(obj => obj.uuid === currentMesh.uuid);
                if (existedIndex >= 0) {
                    let existed = this.selected[existedIndex];
                    if (!existed.userData.instanceIds) {
                        this.selected.splice(existedIndex, 1);
                    } else {
                        let idx = existed.userData.instanceIds.findIndex(i => i === currentMesh.userData.instanceId);
                        if (idx >= 0) {
                            existed.userData.instanceIds.splice(idx, 1);
                            if (existed.userData.instanceIds.length === 0) {
                                this.selected.splice(existedIndex, 1);
                            }
                        }
                    }
                }
            } else {
                if (currentMesh.userData.instanceId !== undefined) currentMesh.userData.instanceIds = [currentMesh.userData.instanceId];
                this.selected = [currentMesh];
                this.point = currentMesh.userData.point;
                this.clicked = true;
            }
        } else {
            if (this.autoClear)
                this.selected.length = 0;
        }
    }

    if (this.selected.length){
        for (let name of this.selectMap.keys()) {
            this.selectMap.get(name)(this);
        }
    }
}

function getFilter(mesh, topmost){
    if (!mesh.visible) return false;
    if (mesh.name.startsWith('func_')) return false;

    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    if (isNaN(topmost) && mesh.geometry.boundingBox.max.z > topmost) {
        return false;
    }

    return true;
}

function getIntersect(topmost = NaN) {
    _raycaster.setFromCamera(_mouse, _camera);

    let allIntersects = _raycaster.intersectObjects(_scene.children, true);
    let sprite = allIntersects.find(intersect => intersect.object.type === 'Sprite');
    if (sprite) return sprite.object;

    let intersects = allIntersects
        .filter(intersection => getFilter(intersection.object, topmost));

    if (intersects.length > 0) {
        let mesh = intersects[0].object;
        mesh.userData.point = intersects[0].point;
        if (mesh.type === 'Mesh' && mesh.count) {
            let intersection = _raycaster.intersectObject(mesh);
            if (intersection.length > 0) {
                mesh.userData.instanceId = intersection[0].instanceId;
                return mesh;
            }
        } else {
            return mesh;
        }
    } else {
        return null;
    }
}

export default class Select {
    constructor(camera, scene, renderer, selectStyle) {
        _camera = camera;
        _scene = scene;
        _canvas = renderer.domElement;
        selectionBox = new SelectionBox(camera, scene);
        helper = new SelectionHelper(selectionBox, renderer, selectStyle);

        helper.enabled = this.boxSelectEnabled = false;
        this.topmost = NaN;
        this.enabled = true;
        this.selected = [];
        this.changedColor = new THREE.Color(0, 0, 1);
        this.defaultColor = new THREE.Color(0, 0, 0);
        this.autoClear = true;
        this.selectMap = new Map();
        this.unselectMap = new Map();
        document.addEventListener('mousedown', onDocumentMouseDown.bind(this));
        document.addEventListener('mousemove', onDocumentMouseMove.bind(this));
        document.addEventListener('mouseup', onDocumentMouseUp.bind(this));

        let self = this;
        this.addUnselectEventListener('default', function() {
            self.selected.forEach(changeEmissive(self.defaultColor));
        })

        this.addSelectEventListener('default', function() {
            self.selected.forEach(changeEmissive(self.changedColor));
        })

    }

    addSpriteEventListener(handler) {
        this.spriteHandler = handler;
    }

    addSelectEventListener(name, handler) {
        if (this.selectMap.has(name)) {
            console.error(`${name} has been registered`);
            return;
        }
        this.selectMap.set(name, handler);
    }

    removeSelectEventListener(name) {
        if (!this.selectMap.has(name)) {
            console.error(`${name} has not been registered yet`);
            return;
        }
        this.selectMap.delete(name);
    }

    addUnselectEventListener(name, handler) {
        if (this.unselectMap.has(name)) {
            console.error(`${name} has been registered`);
            return;
        }
        this.unselectMap.set(name, handler);
    }


    removeUnselectEventListener(name) {
        if (!this.unselectMap.has(name)) {
            console.error(`${name} has not been registered yet`);
            return;
        }
        this.unselectMap.delete(name);
    }

}


