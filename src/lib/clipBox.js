import * as THREE from '../../build/three.module.js';
import { DragControls } from '../../jsm/controls/DragControls.js';
import { FBXLoader } from "../../jsm/loaders/FBXLoader.js";

var loader = new FBXLoader();
var resource = "../../models/fbx/Cone.FBX";

var ClipBox = function (scene, camera, renderer) {

    var scope = this;

    scope.ready = false;
    var retry = 10, controls;

    var material = new THREE.MeshPhongMaterial({
        color: 0x0a0a0a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.2
    });

    var corners = [
        new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(),
        new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(),
    ]

    var indices = [
        [0, 1, 2], [0, 2, 3],
        [0, 4, 5], [0, 5, 1],
        [0, 4, 7], [0, 7, 3],
        [6, 7, 4], [6, 4, 5],
        [6, 5, 1], [6, 1, 2],
        [6, 2, 3], [6, 3, 7]
    ];

    var faces = [
        [0, 1, 2, 3],
        [0, 4, 5, 1],
        [0, 4, 7, 3],
        [6, 7, 4, 5],
        [6, 5, 1, 2],
        [6, 2, 3, 7]
    ];

    var dirs = [
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 1),
    ];

    var centerRotations = [
        mesh => mesh.rotateZ(Math.PI / 2),
        mesh => mesh.rotateZ(Math.PI),
        mesh => mesh.rotateX(Math.PI / 2),
        mesh => mesh.rotateZ(-Math.PI / 2),
        mesh => mesh.rotateX(-Math.PI / 2),
        () => { },
    ]

    var planes = dirs.map(n => new THREE.Plane(n.clone().negate(), 0));

    var names = [ClipBox.LEFT, ClipBox.DOWN, ClipBox.NEAR, ClipBox.RIGHT, ClipBox.FAR, ClipBox.UP];


    var geometry = new THREE.Geometry();
    geometry.vertices.push(...corners);
    geometry.faces.push(...indices.map(([a, b, c]) => new THREE.Face3(a, b, c)));
    geometry.computeBoundingSphere();

    scope.boxMesh = new THREE.Mesh(geometry, material);
    scope.boxMesh.visible = false;
    scene.add(scope.boxMesh);

    scope.reset = function () {
        update(scope.min, scope.max);
    }

    scope.setBoundingBox = function (min, max) {
        update(min, max);
    }

    var box = new THREE.Box3();
    var expanding = false;

    scope.startExpand = function () {
        scope.enabled = false;
        expanding = true;
        box.makeEmpty();
    }

    scope.expand = function (mesh) {
        if (!expanding) {
            console.error('cant call expand because startExpand is not called');
            return;
        }
        mesh.material.clippingPlanes = planes;
        box.expandByObject(mesh);
    };

    scope.done = function () {
        if (!expanding) {
            console.error('cant call done because startExpand is not called');
            return;
        }
        expanding = false;
        update(box.min, box.max);
        scope.enabled = true;
    }


    scope.coneGizmo = [];

    scope.enableClip = function () {
        controls.enabled = true;
        scope.boxMesh.visible = true;
        scope.coneGizmo.forEach(obj => obj.visible = true);
        renderer.localClippingEnabled = true;
    }

    scope.disableClip = function () {
        controls.enabled = false;
        scope.boxMesh.visible = false;
        scope.coneGizmo.forEach(obj => obj.visible = false);
        renderer.localClippingEnabled = false;
    }


    scope.lock = function () {
        controls.enabled = false;
        scope.boxMesh.visible = false;
        scope.coneGizmo.forEach(obj => obj.visible = false);
    }

    scope.unlock = function () {
        controls.enabled = true;
        scope.boxMesh.visible = true;
        scope.coneGizmo.forEach(obj => obj.visible = true);
    }

    loader.load(resource, function (group) {
        let object;
        group.traverse(function (child) {
            if (child.isMesh) {
                child.material.emissive = new THREE.Color(1, 1, 1);
                child.material.emissiveIntensity = 1;
                child.material.emissiveMap = child.material.map;
                child.castShadow = true;
                child.receiveShadow = true;
                object = child;
            }
        });
        object.scale.set(0.02, 0.02, 0.02);

        for (let i = 0; i < centerRotations.length; i++) {
            let dummy = object.clone();
            scene.add(dummy);
            dummy.name = `func_drag_${names[i]}`;
            dummy.userData.dir = dirs[i];
            dummy.userData.plane = planes[i];
            dummy.userData.index = names[i];
            dummy.userData.facets = faces[i];
            dummy.visible = false;
            centerRotations[i](dummy);
            scope.coneGizmo.push(dummy);
        }

        controls = new DragControls(scope.coneGizmo, camera, renderer.domElement)
        let pos = new THREE.Vector3();
        controls.addEventListener('dragstart', e => pos.copy(e.object.position));
        controls.addEventListener('drag', e => {
            let movements = [
                obj => {
                    obj.position.y = pos.y;
                    obj.position.z = pos.z;
                    return -(obj.position.x - pos.x);
                },
                obj => {
                    obj.position.x = pos.x;
                    obj.position.z = pos.z;
                    return obj.position.y - pos.y;
                },
                obj => {
                    obj.position.x = pos.x;
                    obj.position.y = pos.y;
                    return -(obj.position.z - pos.z);
                },
                obj => {
                    obj.position.y = pos.y;
                    obj.position.z = pos.z;
                    return obj.position.x - pos.x;
                },
                obj => {
                    obj.position.x = pos.x;
                    obj.position.y = pos.y;
                    return obj.position.z - pos.z;
                },
                obj => {
                    obj.position.x = pos.x;
                    obj.position.z = pos.z;
                    return -(obj.position.y - pos.y);
                },
            ]

            let { index, dir, facets, plane } = e.object.userData;
            let delta = movements[index](e.object);
            plane.constant += delta;
            facets.map(idx => corners[idx]).forEach(vec3 => vec3.addScaledVector(dir, delta));
            geometry.verticesNeedUpdate = true;
            updateConeGizmo();
            pos.copy(e.object.position)
        });
        controls.addEventListener('dragend', () => pos.set(0, 0, 0));
        scope.ready = true;
    }, null, console.error);


    function updateConeGizmo() {
        let centerPoints = faces.map(arr => corners[arr[0]].clone().add(corners[arr[2]]).divideScalar(2));
        scope.coneGizmo.forEach((mesh, idx) => {
            mesh.position.copy(centerPoints[idx]);
            if (mesh.userData.plane) mesh.userData.plane.constant = centerPoints[idx].dot(mesh.userData.dir);
        })
    }

    function update(min, max) {
        let handler;
        if (!scope.ready) {
            retry--;
            if (retry < 0) {
                console.error('resource load error');
                return;
            }
            handler = setTimeout(() => {
                update(min, max)
            }, 500);
            return;
        } else {
            if (!scope.ready) {
                console.error('resource load error');
                return;
            }
            clearTimeout(handler);
        }

        corners[0].copy(min);
        corners[1].copy(min).setY(max.y);
        corners[2].copy(max).setX(min.x);
        corners[3].copy(min).setZ(max.z);
        corners[4].copy(min).setX(max.x);
        corners[5].copy(max).setZ(min.z);
        corners[6].copy(max);
        corners[7].copy(max).setY(min.y);
        geometry.verticesNeedUpdate = true;
        updateConeGizmo();

        scope.min = min;
        scope.max = max;
    }
}


ClipBox.prototype.constructor = ClipBox;

Object.defineProperties(ClipBox, {
    DOWN: {
        get: () => 2
    },
    UP: {
        get: () => 4
    },
    LEFT: {
        get: () => 0
    },
    RIGHT: {
        get: () => 3
    },
    NEAR: {
        get: () => 5
    },
    FAR: {
        get: () => 1
    },
})

Object.defineProperties(ClipBox.prototype, {

    visible: {
        set: function (v) {
            if (!this.ready) return;
            this.boxMesh.visible = v;
            this.coneGizmo.forEach(g => g.visible = v);
        }
    },

});


export { ClipBox };
