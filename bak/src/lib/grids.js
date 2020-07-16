import { Line, Geometry, Color, LineBasicMaterial, Vector3 } from '../../build/three.module.js'

let url = 'http://10.1.1.200:5555/module';

let minZ = 0;

export function setLowLevel(v){
    minZ = v;
}

function drawLine(s, e, c = new Color(1, 0, 0)) {
    let geometry = new Geometry();
    geometry.vertices.push(s, e);

    let material = new LineBasicMaterial({
        linewidth: 100,
        color: c,
    });

    return new Line(geometry, material);
}

export function drawGrids(groupId, version) {
    return fetch(`${url}/getGrids?ModuleGroupId=${groupId}&Version=${version}`).then(resp => resp.json())
        .then(grids => grids.map(({ StartPos: [x1, y1, z1], EndPos: [x2, y2, z2] }) =>
            [new Vector3(x1 / 1000, y1 / 1000, minZ), new Vector3(x2 / 1000, y2 / 1000, minZ)]))
        .then(positions => positions.map(([s, e]) => drawLine(s, e)));
}
