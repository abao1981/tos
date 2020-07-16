"use strict";
console.warn("THREE.DeviceOrientationControls: As part of the transition to ES6 Modules, the files in 'examples/js' were deprecated in May 2020 (r117) and will be deleted in December 2020 (r124). You can find more information about developing using ES6 Modules in https://threejs.org/docs/index.html#manual/en/introduction/Import-via-modules.");
THREE.DeviceOrientationControls = function (object) {
    var scope = this;
    this.object = object;
    this.object.rotation.reorder('YXZ');
    this.enabled = true;
    this.deviceOrientation = {};
    this.screenOrientation = 0;
    this.alphaOffset = 0;
    var onDeviceOrientationChangeEvent = function (event) {
        scope.deviceOrientation = event;
    };
    var onScreenOrientationChangeEvent = function () {
        scope.screenOrientation = window.orientation || 0;
    };
    var setObjectQuaternion = function () {
        var zee = new THREE.Vector3(0, 0, 1);
        var euler = new THREE.Euler();
        var q0 = new THREE.Quaternion();
        var q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
        return function (quaternion, alpha, beta, gamma, orient) {
            euler.set(beta, alpha, -gamma, 'YXZ');
            quaternion.setFromEuler(euler);
            quaternion.multiply(q1);
            quaternion.multiply(q0.setFromAxisAngle(zee, -orient));
        };
    }();
    this.connect = function () {
        onScreenOrientationChangeEvent();
        if (window.DeviceOrientationEvent !== undefined && typeof window.DeviceOrientationEvent.requestPermission === 'function') {
            window.DeviceOrientationEvent.requestPermission().then(function (response) {
                if (response == 'granted') {
                    window.addEventListener('orientationchange', onScreenOrientationChangeEvent, false);
                    window.addEventListener('deviceorientation', onDeviceOrientationChangeEvent, false);
                }
            }).catch(function (error) {
                console.error('THREE.DeviceOrientationControls: Unable to use DeviceOrientation API:', error);
            });
        }
        else {
            window.addEventListener('orientationchange', onScreenOrientationChangeEvent, false);
            window.addEventListener('deviceorientation', onDeviceOrientationChangeEvent, false);
        }
        scope.enabled = true;
    };
    this.disconnect = function () {
        window.removeEventListener('orientationchange', onScreenOrientationChangeEvent, false);
        window.removeEventListener('deviceorientation', onDeviceOrientationChangeEvent, false);
        scope.enabled = false;
    };
    this.update = function () {
        if (scope.enabled === false)
            return;
        var device = scope.deviceOrientation;
        if (device) {
            var alpha = device.alpha ? THREE.MathUtils.degToRad(device.alpha) + scope.alphaOffset : 0;
            var beta = device.beta ? THREE.MathUtils.degToRad(device.beta) : 0;
            var gamma = device.gamma ? THREE.MathUtils.degToRad(device.gamma) : 0;
            var orient = scope.screenOrientation ? THREE.MathUtils.degToRad(scope.screenOrientation) : 0;
            setObjectQuaternion(scope.object.quaternion, alpha, beta, gamma, orient);
        }
    };
    this.dispose = function () {
        scope.disconnect();
    };
    this.connect();
};
