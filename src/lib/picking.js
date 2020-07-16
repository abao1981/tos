import * as THREE from '../../build/three.module.js';

export function registerPick(renderer, camera, objects) {
    let pickingScene = new THREE.Scene();
    let pickingTexture = new THREE.WebGLRenderTarget(renderer.domElement.clientWidth, renderer.domElement.clientHeight);
    pickingTexture.texture.minFilter = THREE.LinearFilter;

    let vs3D = `
        attribute vec3 idcolor;
        varying vec3 vidcolor;
        void main(){
            vidcolor = idcolor;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0);
        }`;

    let fs3D = `
        varying vec3 vidcolor;
        void main(void) {
            gl_FragColor = vec4(vidcolor,1.0);
        }`;

    let pickingMaterial = new THREE.ShaderMaterial(
        {
            vertexShader: vs3D,
            fragmentShader: fs3D,
            transparent: false,
            side: THREE.DoubleSide
        });

    let selectionObjects = [];

    for (let i = 0; i < objects.length; i++) {
        let mesh = objects[i];
        let positions = mesh.geometry.attributes["position"].array;
        let idColor = new Float32Array(positions.length);

        let color = new THREE.Color().setHex(mesh.id);

        for (let j = 0; j < positions.length; j += 3) {
            idColor[j] = color.r;
            idColor[j + 1] = color.g;
            idColor[j + 2] = color.b;
        }

        mesh.geometry.addAttribute('idcolor', new THREE.BufferAttribute(idColor, 3));

        let pickingObject = new THREE.Mesh(mesh.geometry, pickingMaterial);

        pickingScene.add(pickingObject);
        selectionObjects[mesh.id] = mesh;
    }

    document.addEventListener('click', _ => {
        renderer.render(pickingScene, camera, pickingTexture);
        let pixelBuffer = new Uint8Array(4);
        renderer.readRenderTargetPixels(pickingTexture, event.pageX, pickingTexture.height - event.pageY, 1, 1, pixelBuffer);
        let id = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | (pixelBuffer[2]);

        if (id > 0) {
            console.log(selectionObjects[id])
            selectionObjects[id].material.transparent = true;
            selectionObjects[id].material.opacity = 0.5;
        } else {
            //it's 0. clicked on an empty space
        }
    });
}