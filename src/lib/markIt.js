import { Vector3, SpriteMaterial, Sprite, TextureLoader } from '../../build/three.module.js';
import CameraControls from '../../../jsm/controls/camera-controls.module.js';

let scene;

export let textures = {};
let textureLoader = new TextureLoader();
textureLoader.load('../../images/发起图钉.svg', texture => {
    console.log(texture)
    textures.creating = texture
});
textureLoader.load('../../images/进行中.svg', texture => textures.processing = texture);
textureLoader.load('../../images/已超期.svg', texture => textures.expired = texture);
textureLoader.load('../../images/已完成.svg', texture => textures.complete = texture);
textureLoader.load('../../images/已终止.svg', texture => textures.aborted = texture);


export class Pin {
    constructor(_scene, _camera, _controls, _selector) {
        scene = _scene;
        // camera = _camera;
        this.controls = _controls;
        this.pin = undefined;
        this.selector = _selector;
    }

    fromJson(json) {
        let { target, point, position, zoom, type, name } = json;
        if (!target) {
            console.error('target needed in fromJSON');
            return;
        }
        if (!point) {
            console.error('point needed in fromJSON');
            return;
        }
        if (!position) {
            console.error('position needed in fromJSON');
            return;
        }
        if (!type) {
            console.error('type needed in fromJSON');
            return;
        }

        let pinCreator = this;
        pinCreator.target = target.clone();
        pinCreator.point = point.clone();
        pinCreator.position = position.clone();
        pinCreator.zoom = zoom;
        let material = new SpriteMaterial({ map: textures[type] });
        material.userData.type = type;
        material.sizeAttenuation = false;
        material.depthWrite = false;
        material.depthTest = false;
        pinCreator.type = type;
        pinCreator.pin = new Sprite(material);//为材料贴图
        pinCreator.pin.scale.set(0.02, 0.02, 0.001);
        pinCreator.pin.position.copy(pinCreator.point);
        pinCreator.pin.name = name;
        scene.add(pinCreator.pin);
    }


    changeType(type) {
        let texture = textures[type];
        if (!texture) {
            console.error(`type ${type} not exist`);
            return;
        }
        this.pin.material.map = texture;
        this.type = type;
    }

    start() {
        this.stopped = false;
        this.pin = undefined;
        this.selector.addSelectEventListener('pin', () => {
            if (this.pin) {
                this.pin.position.copy(this.selector.point);
                return;
            }
    
            let material = new SpriteMaterial({ map: textures.processing });
            material.userData.type = "processing";
            material.sizeAttenuation = false;
            material.depthWrite = false;
            material.depthTest = false;
            this.type = "processing";
            this.pin = new Sprite(material);//为材料贴图
            this.pin.scale.set(0.02, 0.02, 0.001);
            this.pin.position.copy(this.selector.point);
            this.pin.name = 'func_pin_temp';
            this.controls.getTarget(this.pin.userData.target = new Vector3());
            this.target = this.pin.userData.target.clone();
            this.controls.getPosition(this.pin.userData.position = new Vector3());
            this.position = this.pin.userData.position.clone();
            this.pin.userData.zoom = this.controls._zoom;
            this.zoom = this.pin.userData.zoom;
            scene.add(this.pin);
            console.log(this.pin.userData)
    
            if (this.onPinAdded)
                this.onPinAdded(this);
        })
    }

    stop(cb) {
        this.selector.removeSelectEventListener('pin');
        this.stopped = true;
        if (cb) cb(this);
    }

    cancel() {
        if (this.stopped || !this.pin) return;
        this.stopped = true;
        scene.remove(this.pin);
        this.pin.material.dispose();
        this.pin = undefined;
    }

    reset(enableTransition = true) {
        Pin.reset(this.controls, this.pin, enableTransition);
    }

}


let _reset = controls => (pin, enableTransition = true) => {
    let obj;
    if (pin instanceof Pin) {
        obj = pin.pin;
    } else if (pin.type && pin.type === 'Sprite') {
        obj = pin;
    } else {
        return;
    }
    if (controls instanceof CameraControls) {
        let { position: { x: px, y: py, z: pz }, target: { x: tx, y: ty, z: tz }, zoom } = obj.userData;
        controls.setLookAt(px, py, pz, tx, ty, tz, enableTransition);
        controls.zoomTo(zoom, enableTransition);
    }
}

Object.defineProperty(Pin, 'reset', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: (controls, pin, enableTransition = true) => {
        if (pin) {
            return _reset(controls)(pin, enableTransition);
        } else {
            return _reset(controls);
        }
    }
});
