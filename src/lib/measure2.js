// 测量
class MeasureFunc {
    constructor(_mainScene, _mainCamera, _domElementRoot, _animations) {
        this.MainScene = _mainScene;
        this.MainCamera = _mainCamera;
        let domElement = (_domElementRoot !== undefined) ? _domElementRoot : document;
        let labelRenderer = null;
        let start = new THREE.Vector3(0, 0, 0);
        let end = new THREE.Vector3(0, 0, 0);
        let y = new THREE.Vector3(0, 0, 0);
        let yz = new THREE.Vector3(0, 0, 0);
        let lines = [];
        let balls = [];
        let measureDistanceArray = [];
        let measureHTMLLabels = [];
        let hitPos = new THREE.Vector3(0, 0, 0);
        let intersection = null;
        let ModelScaleFactor = 1000;
        let MeasureDataEvent = new CustomEvent('MeasureDataEventCallBack', {
            detail: {
                distance: null,
                distance_X: null,
                distance_Y: null,
                distance_Z: null,
            }
        });
        let scope = this;
        let MeasureIsOn = false;
        scope.OpenAndClose = function (_isOpen) {
            MeasureIsOn = _isOpen;
            if (MeasureIsOn) {
                CreatelabelRenderer();
                //CSS2DRendererRender();
                _animations.push(CSS2DRendererRender);
                //  window.addEventListener('tzrenderingModel',CSS2DRendererRender, false);
            }
            else {
                SignOutDestroyObjectAndReset();
            }
        };
        scope.StartMeasureFunction = function (vector3_point) {
            if (MeasureIsOn) {
                // if (_intersection&&(_intersection.name===("MeasureBall(Start)") || _intersection.name===("MeasureBall(End)")))
                // 	return;
                hitPos = vector3_point;
                SetBalls(vector3_point);
            }
            else {
                console.log("未调用IsOpenMeasureFunctionAndInit函数进行初始化");
            }
        };
        scope.CloseMeasure = function () {
            MeasureIsOn = false;
            SignOutDestroyObjectAndReset();
        };
        function SetBalls(vector3_point) {
            if (!start.equals(new THREE.Vector3(0, 0, 0)) && !end.equals(new THREE.Vector3(0, 0, 0))) {
                start = new THREE.Vector3(0, 0, 0);
                end = new THREE.Vector3(0, 0, 0);
                y = new THREE.Vector3(0, 0, 0);
                yz = new THREE.Vector3(0, 0, 0);
                ResetLinesPointLabel();
                return;
            }
            if (start.equals(new THREE.Vector3(0, 0, 0)) && end.equals(new THREE.Vector3(0, 0, 0))) {
                start = hitPos;
                //lineSizeStart = Vector3.Distance(start, _mainCamera.transform.position) / 50;
                balls[0] = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), new THREE.MeshBasicMaterial({ color: 0xFF0000 }));
                balls[0].name = "MeasureBall(Start)";
                balls[0].position.set(start.x, start.y, start.z);
                balls[0].scale.set(1, 1, 1);
                balls[0].material.alphaTest = 1;
                balls[0].material.depthTest = false;
                balls[0].material.opacity = 2;
                scope.MainScene.add(balls[0]);
            }
            else if (!start.equals(new THREE.Vector3(0, 0, 0)) && end.equals(new THREE.Vector3(0, 0, 0))) {
                //画线
                end = hitPos;
                y = new THREE.Vector3(start.x, end.y, start.z);
                yz = new THREE.Vector3(start.x, end.y, end.z);
                lines[0] = drawLine(start, end, new THREE.Color(1, 0.51765, 0)); //橙色两点间距
                lines[1] = drawLine(start, y, new THREE.Color(0, 1, 0)); //绿Y
                lines[2] = drawLine(y, yz, new THREE.Color(0, 0, 1)); //蓝Z
                lines[3] = drawLine(yz, end, new THREE.Color(1, 0, 0)); //红X
                for (let t = 0; t < lines.length; t++) {
                    if (lines[t]) {
                        lines[t].material.alphaTest = 1;
                        lines[t].material.depthTest = false;
                        lines[t].material.opacity = 2;
                        scope.MainScene.add(lines[t]);
                    }
                }
                //	画标记球点
                balls[1] = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), new THREE.MeshBasicMaterial({ color: 0xFF0000 }));
                balls[1].name = "MeasureBall(End)";
                balls[1].position.set(end.x, end.y, end.z);
                balls[1].scale.set(1, 1, 1);
                balls[1].material.alphaTest = 1;
                balls[1].material.depthTest = false;
                balls[1].material.opacity = 2;
                scope.MainScene.add(balls[1]);
                AddResultLabel();
                if (measureDistanceArray.length === 4) {
                    MeasureDataEvent.detail.distance = measureDistanceArray[0];
                    MeasureDataEvent.detail.distance_X = measureDistanceArray[3];
                    MeasureDataEvent.detail.distance_Y = measureDistanceArray[1];
                    MeasureDataEvent.detail.distance_Z = measureDistanceArray[2];
                    window.dispatchEvent(MeasureDataEvent);
                }
            }
        }
        function AddResultLabel() {
            let element = domElement === document ? domElement.body : domElement;
            measureDistanceArray.length = 0;
            let testDiv = document.getElementById('CSS2D_Div');
            if (!testDiv) {
                testDiv = document.createElement("div");
                testDiv.id = "CSS2D_Div";
                element.appendChild(testDiv);
            }
            //两点间距 橙色
            if (lines[0]) {
                let distance0 = (start.distanceTo(end) * ModelScaleFactor).toFixed(2);
                let div_Mid = document.createElement("div");
                div_Mid.className = "Measure_label";
                div_Mid.textContent = distance0.toString();
                div_Mid.style.marginTop = "-1em";
                div_Mid.style.color = "#ff8800";
                //div_Mid.style.color="#FF0000";
                testDiv.appendChild(div_Mid);
                measureHTMLLabels.push(div_Mid);
                let _css2dLabel = new THREE.CSS2DObject(div_Mid);
                let pos0 = new THREE.Vector3();
                pos0.addVectors(start, end).multiplyScalar(1 / 2);
                _css2dLabel.position.set(pos0.x, pos0.y, pos0.z);
                lines[0].add(_css2dLabel); // Color.red;
                measureDistanceArray.push(distance0.toString());
            }
            //Y 绿
            if (lines[1]) {
                let distance1 = (start.distanceTo(y) * ModelScaleFactor).toFixed(2);
                let div_1 = document.createElement("div");
                div_1.className = "Measure_label";
                div_1.textContent = distance1.toString();
                div_1.style.marginTop = "-1em";
                div_1.style.color = "#00FF00";
                testDiv.appendChild(div_1);
                measureHTMLLabels.push(div_1);
                let _css2dLabel1 = new THREE.CSS2DObject(div_1);
                let pos1 = new THREE.Vector3();
                pos1.addVectors(start, y).multiplyScalar(1 / 2);
                _css2dLabel1.position.set(pos1.x, pos1.y, pos1.z);
                lines[1].add(_css2dLabel1);
                measureDistanceArray.push(distance1.toString());
            }
            //蓝Z
            if (lines[2]) {
                let distance2 = (y.distanceTo(yz) * ModelScaleFactor).toFixed(2);
                let div_Y = document.createElement("div");
                div_Y.className = "Measure_label";
                div_Y.textContent = distance2.toString();
                div_Y.style.marginTop = "-1em";
                div_Y.style.color = "#0000FF";
                testDiv.appendChild(div_Y);
                measureHTMLLabels.push(div_Y);
                let _css2dLabel2 = new THREE.CSS2DObject(div_Y);
                let pos2 = new THREE.Vector3();
                pos2.addVectors(y, yz).multiplyScalar(1 / 2);
                _css2dLabel2.position.set(pos2.x, pos2.y, pos2.z);
                lines[2].add(_css2dLabel2);
                measureDistanceArray.push(distance2.toString());
            }
            //红X
            if (lines[3]) {
                let distance3 = (yz.distanceTo(end) * ModelScaleFactor).toFixed(2);
                let div_3 = document.createElement("div");
                div_3.className = "Measure_label";
                div_3.textContent = distance3.toString();
                div_3.style.marginTop = "-1em";
                div_3.style.color = "#FF0000";
                testDiv.appendChild(div_3);
                measureHTMLLabels.push(div_3);
                let _css2dLabel3 = new THREE.CSS2DObject(div_3);
                let pos3 = new THREE.Vector3();
                pos3.addVectors(yz, end).multiplyScalar(1 / 2);
                _css2dLabel3.position.set(pos3.x, pos3.y, pos3.z);
                lines[3].add(_css2dLabel3);
                measureDistanceArray.push(distance3.toString());
            }
        }
        function ResetLinesPointLabel() {
            for (let i = (lines.length - 1); i >= 0; i--) {
                if (lines[i]) {
                    scope.MainScene.remove(lines[i]);
                }
            }
            for (let j = (balls.length - 1); j >= 0; j--) {
                if (balls[j]) {
                    scope.MainScene.remove(balls[j]);
                }
            }
            for (let m = (measureHTMLLabels.length - 1); m >= 0; m--) {
                if (measureHTMLLabels[m]) {
                    measureHTMLLabels[m].parentElement.removeChild(measureHTMLLabels[m]);
                }
            }
            let css2d_Div = document.getElementById('CSS2D_Div');
            if (css2d_Div) {
                css2d_Div.parentElement.removeChild(css2d_Div);
            }
            measureHTMLLabels.length = 0;
            lines.length = 0;
            balls.length = 0;
            measureDistanceArray.length = 0;
            // this. measureHTMLLabels=[];
            // this.lines=[];
            // this.balls=[];
            // this.measureDistanceArray=[];
            // var measureLabels = document.getElementsByClassName('Measure_label');
            // for(var m=(measureLabels.length-1); m>=0; m--)
            // {
            //     measureLabels[m].parentElement.removeChild( measureLabels[m]);
            // }
            //var el = document.getElementById('demo');
            // var childs = el.childNodes;
            //
            // for(var i = childs .length - 1; i >= 0; i--) {
            //
            //     el.removeChild(childs[i]);
            //
            // }
        }
        function SignOutDestroyObjectAndReset() {
            if (labelRenderer) {
                let element = domElement === document ? domElement.body : domElement;
                if (element) {
                    element.removeChild(labelRenderer.domElement);
                }
                labelRenderer = null;
            }
            ResetLinesPointLabel();
            start = new THREE.Vector3(0, 0, 0);
            end = new THREE.Vector3(0, 0, 0);
            y = new THREE.Vector3(0, 0, 0);
            yz = new THREE.Vector3(0, 0, 0);
            _animations = removeArray(_animations, CSS2DRendererRender);
            //  window.removeEventListener('tzrenderingModel',CSS2DRendererRender);
        }
        function CreatelabelRenderer() {
            if (!labelRenderer) {
                let element = domElement === document ? domElement.body : domElement;
                labelRenderer = new THREE.CSS2DRenderer();
                labelRenderer.setSize(element.clientWidth, element.clientHeight);
                labelRenderer.domElement.style.position = "absolute";
                labelRenderer.domElement.style.top = 0;
                labelRenderer.domElement.style.pointerEvents = 'none';
                element.appendChild(labelRenderer.domElement);
            }
        }
        function CSS2DRendererRender() {
            if (MeasureIsOn && labelRenderer) {
                if (labelRenderer && scope.MainScene && scope.MainCamera) {
                    labelRenderer.render(scope.MainScene, scope.MainCamera);
                }
            }
            //方法一
            // if(MeasureIsOn &&labelRenderer){
            //     requestAnimationFrame(CSS2DRendererRender.bind(scope));
            //     if(labelRenderer&&scope.MainScene&&scope.MainCamera){
            // 		labelRenderer.render(scope.MainScene,scope.MainCamera);
            //     }
            // }
        }
    }
}

let UIFunMeasure = {
    _sceneMeasure: null,
    _cameraMeasure: null,
    _rootNodeMeasure: null,
    MeasureFuncTool: null,
    _sceneEntity: null,
    Init:function (_sceneEntity, _domElement ){
        this._sceneMeasure = _sceneEntity.scene;
        this._cameraMeasure = _sceneEntity.camera;
        this._rootNodeMeasure = _domElement;
        this._sceneEntity = _sceneEntity;
        let button = document.createElement("div");
        button.setAttribute("id", "modelMeasure-btn");
        button.setAttribute("class", "btn-mainmenu");
        button.innerHTML += "<img src='"+getImg('btn_Measuring_Normal.png')+"'>";
        $("#uiviewer").append(button);
        $("#modelMeasure-btn").click(function(){
            UIFunMeasure.Click();
        });
        let view = '<div id="Measure" class="div-featureview" style="width: 220px;height: 180px;position: absolute;top: 500px;left: 50px;display: none;">'+
            '<label class="label-viewtitle">测量工具</label>' +
            '<img id="Measure-close" class="div-menuview" src="'+getImg('btn_viewpoint_cancel_normal.png')+'" >' +
            '<div style="position: absolute;top: 15%; left:10% ;right: 2%;bottom: 0%;">' +
            '<dl>'+
            '<dt><label class="MeasureLabel"  style="color: #ff9a00; font-size: 15px;line-height: 35px;padding: 0px;">  两点距离:0 </label></dt>' +
            '<dt><label class="MeasureLabel"  style="color: #ff0000; font-size: 15px;line-height: 35px;padding: 0px;">  X:0 </label></dt>' +
            '<dt><label class="MeasureLabel"  style="color: #00ff00; font-size: 15px;line-height: 35px;padding: 0px;">  Y:0 </label></dt>' +
            '<dt><label class="MeasureLabel"  style="color: #000ff0; font-size: 15px;line-height: 35px;padding: 0px;">  Z:0 </label></dt>' +
            '</dl>'+
            '</div>'+
            '</div>';
        $("#menuview").append(view);
        $("#Measure-close").click(function (){
            UIFunMeasure.Click();
        });
    },

    Click:function () {
        this.isOpen = !this.isOpen;
        UITool.MenuStatusChange(document.getElementById("modelMeasure-btn"), "Measure", this.isOpen);
        //打开关闭 测量功能，，打开时需要初始化参数
        if(this.isOpen){
            if(!UIFunMeasure.MeasureFuncTool){
                UIFunMeasure.MeasureFuncTool = new MeasureFunc(
                    UIFunMeasure._sceneMeasure,
                    UIFunMeasure._cameraMeasure,
                    UIFunMeasure._rootNodeMeasure,
                    this._sceneEntity.fixedEvents
                );
            }
            UIFunMeasure.MeasureFuncTool.OpenAndClose(true);
            this._sceneEntity.HandleFlag = false;
        }else{
            UIFunMeasure.MeasureFuncTool.OpenAndClose(false);
            UIFunMeasure.ResetUI();
            this._sceneEntity.HandleFlag = true;
        }
        //事件处理
        UIFunMeasure.EventInit(this.isOpen);
    },

    EventInit:function(_isopen){
        if(_isopen){
            this._sceneEntity.sceneClickEvents.push(UIFunMeasure.ModelSelect);
            // window.addEventListener('tzelementclick',UIFunMeasure.ModelSelect, false);
            window.addEventListener('MeasureDataEventCallBack', UIFunMeasure.RefreshHtmlShow, false);
        }else{
            /*     let s=new Array();*/
            this._sceneEntity.sceneClickEvents = removeArray(this._sceneEntity.sceneClickEvents, UIFunMeasure.ModelSelect);
            window.removeEventListener('MeasureDataEventCallBack', UIFunMeasure.RefreshHtmlShow);
            //  this._sceneEntity.mouseEvents.remove(UIFunMeasure.ModelSelect);
            //  window.removeEventListener('tzelementclick',UIFunMeasure.ModelSelect);
        }
    },

    ModelSelect:function (scene, mouse, event) {
        let point = mouse.worldPoint;
        if(point){
            UIFunMeasure.MeasureFuncTool.StartMeasureFunction(point);
        }
    },

    RefreshHtmlShow:function(event){
        let details = event.detail;
        let childLabel = document.getElementById("Measure").getElementsByClassName("MeasureLabel");
        if(childLabel.length === 4){
            childLabel[0].innerText = "两点距离：" + details.distance;
            childLabel[1].innerText = "X：" + details.distance_X;
            childLabel[2].innerText = "Y：" + details.distance_Y;
            childLabel[3].innerText = "Z：" + details.distance_Z;
        }
    },
    ResetUI:function (){
        let childLabel = document.getElementById("Measure").getElementsByClassName("MeasureLabel");
        if(childLabel.length === 4){
            childLabel[0].innerText = "两点距离：0";
            childLabel[1].innerText = "X：0";
            childLabel[2].innerText = "Y：0";
            childLabel[3].innerText = "Z：0";
        }
    }
};