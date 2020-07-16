import { scene } from '../main.js';
import { Color, Box3, FileLoader, InstancedMesh, Matrix4, Geometry, BufferGeometry, InstancedBufferGeometry, InstancedBufferAttribute, Vector3, Shape, LineCurve3, ExtrudeGeometry, MeshPhongMaterial, Mesh } from '../../build/three.module.js';
import { GLTFLoader } from '../../jsm/loaders/GLTFLoader.js';
import { changeEmissive } from './select.js';

let url = 'http://ip3.tztos.cn:5555/module';
let onAfterMeshLoad = mesh => {
    if (mesh.material.opacity < 1)
        mesh.material.transparent = true;
};
let elementFilter = () => true;
const getUrl = (groupId, version) => file => `${url}/downloadModel3/${groupId}/${version}/${file}`;
let loader = new GLTFLoader();
let fileLoader = new FileLoader();
let diffMap = new Map();

// 逾期： 红色置顶
// 已完成
// 进行中： 蓝色置顶
// 未开始： 半透明

//逾期未结束 = PatternDelay | PatternComplete
//逾期未开始 = PatternDelay | PatternNotStarted
//逾期
export const PatternDelay = 1;
//已完成
export const PatternComplete = 2;
//进行中
export const PatternProcessing = 4;
//未开始
export const PatternNotStarted = 8;

function setStyle(object, pattern) {
    let changeDelay = changeEmissive(new Color(1, 0, 0));
    let changeProcessing = changeEmissive(new Color(0, 0, 1));
    switch (pattern) {
        case PatternDelay: {
            changeDelay(object);
            object.material.userData.opacity = object.material.opacity;
            object.material.alphaTest = 1;
            object.material.depthTest = false;
            object.material.opacity = 1;
            break;
        }
        case PatternComplete: {
            break;
        }
        case PatternProcessing: {
            changeProcessing(object);
            break;
        }
        case PatternNotStarted: {
            object.material.userData.opacity = object.material.opacity;
            object.material.userData.transparent = object.material.transparent;
            object.material.transparent = true;
            object.material.opacity = 0.2;
            break;
        }
    }
}

function resetStyle(object){
    let reset = changeEmissive(new Color(0, 0, 0));
    reset(object);
    if (object.userData.opacity){
        object.material.opacity = object.material.userData.opacity;
    }
    if (object.userData.transparent){
        object.material.transparent = object.material.userData.transparent;
    }else{
        object.material.transparent = false;
    }
    object.material.alphaTest = 0;
    object.material.depthTest = true;
}


export let maxBoundingBox = new Box3();

export function init(options) {
    let _default = { url: 'http://ip3.tztos.cn:5555/module', onAfterMeshLoad: () => { }, elementFilter: () => true };
    url = options.url || _default.url;
    if (typeof options.onAfterMeshLoad === "function") {
        let old = onAfterMeshLoad;
        onAfterMeshLoad = mesh => {
            old(mesh);
            options.onAfterMeshLoad(mesh);
        }
    }
    if (typeof options.elementFilter === "function")
        elementFilter = options.elementFilter;
}
// let scene;

function loadCylinder(groupId, version, file, lod = 16) {
    return new Promise((resolve, reject) => {
        fileLoader.load(getUrl(groupId, version)(file), info => {
            let circles = JSON.parse(info);
            for (let {
                ElementIds,
                Diameter,
                Points,
                Colors
            } of circles) {
                let totalGeometry = new Geometry();
                let colors = Colors.map(data => {
                    const buffer = atob(data);
                    let r = buffer.charCodeAt(0);
                    let g = buffer.charCodeAt(1);
                    let b = buffer.charCodeAt(2);
                    return (r << 16) | (g << 8) | b;
                });

                for (let i = 0; i < ElementIds.length; i++) {
                    let startP = new Vector3(...Points[i * 2]);
                    let endP = new Vector3(...Points[i * 2 + 1]);
                    let shape = new Shape().absarc(0, 0, Diameter / 2, 0, Math.PI * 2, true);
                    let path = new LineCurve3(endP, startP);
                    let _lod = lod in [1, 2, 3, 4, 5] ? lod : 4;

                    let extrudeSettings = {
                        curveSegments: 2 ** _lod,
                        steps: 2,
                        bevelEnabled: false,
                        extrudePath: path
                    };
                    let geometry = new ExtrudeGeometry(shape, extrudeSettings);
                    let mesh = new Mesh(geometry, new MeshPhongMaterial({
                        color: colors[i]
                    }));
                    totalGeometry.mergeMesh(mesh);
                    mesh.name = ElementIds[i];
                    if (!elementFilter(mesh)) continue;
                    scene.add(mesh);
                    onAfterMeshLoad(mesh);
                }
            }
            resolve('done');
        }, null, reject)
    })
}


function loadSharedMesh(groupId, version, info, mesh) {
    return new Promise((resolve, reject) => {
        let getFile = getUrl(groupId, version);
        fileLoader.load(getFile(info), info => {
            let infos = JSON.parse(info);
            loader.load(getFile(mesh), function (gltf) {
                // let mergedMeshes = mergeElements(gltf.scene.children);

                for (let child of [...gltf.scene.children]) {
                    if (!elementFilter(child)) continue;
                    if (infos[child.name]) {
                        let list = infos[child.name];
                        let instGeometry = new InstancedBufferGeometry();
                        BufferGeometry.prototype.copy.call(instGeometry, child.geometry);

                        let material = child.material.clone();
                        material.vertexColors = true;
                        material.onBeforeCompile = shader => {
                            shader.vertexShader = `
                            attribute vec3 instanceEmissive;
                            varying vec3 vInstanceEmissive;
                            ${
                                shader.vertexShader.replace(
                                    `#include <color_vertex>`,
                                    `#include <color_vertex>
                                vInstanceEmissive = instanceEmissive;`
                                )}
                            `
                            shader.fragmentShader = `
                            varying vec3 vInstanceEmissive;
                            ${
                                shader.fragmentShader.replace(
                                    'vec3 totalEmissiveRadiance = emissive;',
                                    'vec3 totalEmissiveRadiance = vInstanceEmissive;'
                                )}
                            `
                        }
                        // let geometry = child.geometry.clone();
                        const colorArray = Float32Array.from(new Array(list.length).fill().flatMap(() => material.color.toArray()))
                        instGeometry.setAttribute('color', new InstancedBufferAttribute(colorArray, 3));
                        const instanceEmissiveArray = Float32Array.from(new Array(list.length).fill().flatMap(() => [0, 0, 0]));
                        const emissiveAttribute = new InstancedBufferAttribute(instanceEmissiveArray, 3, true)
                        emissiveAttribute.dynamic = true
                        instGeometry.setAttribute('instanceEmissive', emissiveAttribute);

                        let instancedMesh = new InstancedMesh(instGeometry, material, list.length);
                        instancedMesh.name = child.name;
                        for (let i = 0; i < list.length; i++) {
                            let m = new Matrix4();
                            instancedMesh.setMatrixAt(i, m.fromArray(list[i].Matrix))
                        }
                        Object.assign(instancedMesh.userData, child.userData);
                        instancedMesh.userData.Ids = list.map(item => item.Name);
                        scene.add(instancedMesh);
                        onAfterMeshLoad(instancedMesh);
                    } else {
                        console.error(child.name, 'not found');
                    }
                }
                resolve('loaded');
            }, null, reject);
        }, null, reject);
    })

}

function loadMesh(groupId, version, mesh) {

    return new Promise((resolve, reject) => {
        let getFile = getUrl(groupId, version);
        loader.load(getFile(mesh), function (gltf) {
            for (let mesh of [...gltf.scene.children].filter(elementFilter)) {
                // mesh.material.color.copy(new THREE.Color(0, 0, 1));
                scene.add(mesh);
                onAfterMeshLoad(mesh);
            }
            resolve('loaded');
        }, null, reject);
    })
}


export async function loadModel(groupId, callback = console.log) {
    let { data: domains, message, status } = await fetch(`${url}/getLatestDomains?ModuleGroupId=${groupId}`).then(resp => resp.json());
    if (status !== 1) {
        console.error(message);
        return;
    }

    let allModelInfos = await fetch(`${url}/getDownloadFileInfo?ModuleGroupId=${groupId}`).then(resp => resp.json());

    let modelInfos = allModelInfos.filter(info =>
        domains.some(({ Version, DomainName }) => info.DomainName === DomainName && info.Version === Version)
    );

    return modelInfos.reduce((acc, { DomainName, NormalFile, SharedMeshFile, SharedMeshInfo, CylinderInfo, Version }) => acc.then(() => {
        let tasks = [];
        if (SharedMeshInfo && SharedMeshFile) {
            tasks.push(loadSharedMesh(groupId, Version, SharedMeshInfo, SharedMeshFile));
        }
        if (NormalFile) {
            tasks.push(loadMesh(groupId, Version, NormalFile));
        }
        if (CylinderInfo) {
            tasks.push(loadCylinder(groupId, Version, CylinderInfo));
        }
        return Promise.all(tasks).then(() => callback(DomainName)).catch(console.error);
    }), Promise.resolve());

}


export async function loadModelDiff(groupId, { domain, beforeVersion, afterVersion }) {
    diffMap.clear();
    let diff = [[], [], []];
    let tree = await fetch(`${url}/diffFromGltf`, {
        method: "post",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "ModuleGroupId": groupId,
            "DomainName": domain,
            "beforeVersion": beforeVersion,
            "afterVersion": afterVersion
        })
    }).then(resp => resp.json());

    if (tree.status === 0) {
        console.error(tree.message);
        return;
    }

    for (let node of tree.data) {
        diff[node.ChangeType] = [...diff[node.ChangeType], ...node.ElementIds.split(/[,|]/)].filter(i => i.length);
    }

    let allModelInfos = await fetch(`${url}/getDownloadFileInfo?ModuleGroupId=${groupId}`).then(resp => resp.json());

    let modelInfos = allModelInfos.filter(info => info.DomainName === domain);
    let { NormalFile, SharedMeshFile, SharedMeshInfo, CylinderInfo, Version } = modelInfos[0];

    if (SharedMeshInfo && SharedMeshFile) {
        loadSharedMesh(groupId, Version, SharedMeshInfo, SharedMeshFile);
    }
    if (NormalFile) {
        loadMesh(groupId, Version, NormalFile);
    }
    if (CylinderInfo) {
        loadCylinder(groupId, Version, CylinderInfo);
    }

    scene.traverse(mesh => {
        if (!mesh.isMesh) return;
        if (diff[0].some(name => name === mesh.name)) {
            diffMap.set(mesh.uuid, mesh.material.color.clone())
            mesh.material.color.set(0xff0000);
        } else if (diff[1].some(name => name === mesh.name)) {
            diffMap.set(mesh.uuid, mesh.material.color.clone())
            mesh.material.color.set(0x00ff00);
        } else if (diff[2].some(name => name === mesh.name)) {
            diffMap.set(mesh.uuid, mesh.material.color.clone())
            mesh.material.color.set(0x00ff00);
        } else {
            mesh.material.transparent = true;
            mesh.material.opacity = 0.3;
        }
    });

}

export function loadModelStage(scene, groupId, cb) {
    let allMesh = [];
    fetch(`${url}/getSchedule/${groupId}`)
        .then(resp => resp.json())
        .then(({ status, message, data }) => status === 0 ? Promise.reject(message) : data)
        .then(({ processing, complete, delay }) => {
            scene.traverse(mesh => {
                if (!mesh.isMesh) return;
                allMesh.push(allMesh);
            });

            allMesh
                .filter(mesh => processing.some(({ name }) => name === mesh.name))
                .forEach(mesh => setStyle(mesh, PatternProcessing));

            allMesh
                .filter(mesh => delay.some(({ name }) => name === mesh.name))
                .forEach(mesh => setStyle(mesh, PatternDelay));

            allMesh
                .filter(mesh => ![...delay, ...processing, ...complete].some(({ name }) => name === mesh.name))
                .forEach(mesh => setStyle(mesh, PatternNotStarted));
        })
        .then(() => {
            if (cb) cb();
        });

    return function reset() {
        allMesh.forEach(resetStyle);
    }
}


