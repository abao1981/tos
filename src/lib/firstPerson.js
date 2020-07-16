import CameraControls from '../../jsm/controls/camera-controls.module.js';

export default function(controls, distancePerFrame, useAnimate = true){

    let old = {
        left: controls.mouseButtons.left,
        middle: controls.mouseButtons.middle,
        right: controls.mouseButtons.right,
        wheel: controls.mouseButtons.wheel,
    }

    controls.mouseButtons.left = CameraControls.ACTION[ 'NONE' ]
    controls.mouseButtons.middle = CameraControls.ACTION[ 'NONE' ]
    controls.mouseButtons.right = CameraControls.ACTION[ 'ROTATE' ]
    controls.mouseButtons.wheel = CameraControls.ACTION[ 'NONE' ]

    const controlMap = {
        e: _ => controls.upward(distancePerFrame, useAnimate),
        q: _ => controls.upward(-distancePerFrame, useAnimate),
        w: _ => controls.forward(distancePerFrame, useAnimate),
        s: _ => controls.forward(-distancePerFrame, useAnimate),
        a: _ => controls.rightward(-distancePerFrame, useAnimate),
        d: _ => controls.rightward(distancePerFrame, useAnimate),
    }

    function firstPersonControl(event){
        if (event.shiftKey && controlMap[event.key.toLowerCase()]) controlMap[event.key.toLowerCase()]();
    }

    document.addEventListener('keypress', firstPersonControl);

    return function exit(){
        document.removeEventListener('keypress', firstPersonControl);
        controls.mouseButtons.left = old.left;
        controls.mouseButtons.middle = old.middle;
        controls.mouseButtons.right = old.right;
        controls.mouseButtons.wheel = old.wheel;
    }
}


