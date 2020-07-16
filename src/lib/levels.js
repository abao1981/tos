import { Vector3, Plane } from '../../build/three.module.js'

let url = 'http://10.1.1.200:5555/module';

let levels = [
    {
        "ModuleGroupId": 224,
        "LevelId": 1600648,
        "LevelName": "112",
        "Elevation": -21480,
        "ProjectElevation": -21480
    },
    {
        "ModuleGroupId": 224,
        "LevelId": 329501,
        "LevelName": "建筑-结构底板顶（-2200）",
        "Elevation": -2200,
        "ProjectElevation": -2200
    },
    {
        "ModuleGroupId": 224,
        "LevelId": 311,
        "LevelName": "建筑-站台层（0.00）",
        "Elevation": 0,
        "ProjectElevation": 0
    },
    {
        "ModuleGroupId": 224,
        "LevelId": 1652562,
        "LevelName": "117",
        "Elevation": 740,
        "ProjectElevation": 740
    },
    {
        "ModuleGroupId": 224,
        "LevelId": 329230,
        "LevelName": "建筑-站厅层（5100）",
        "Elevation": 5100,
        "ProjectElevation": 5100
    },
    {
        "ModuleGroupId": 224,
        "LevelId": 1640830,
        "LevelName": "116",
        "Elevation": 7290,
        "ProjectElevation": 7290
    },
    {
        "ModuleGroupId": 224,
        "LevelId": 694,
        "LevelName": "建筑-结构顶板顶（11600）",
        "Elevation": 11600,
        "ProjectElevation": 11600
    },
    {
        "ModuleGroupId": 224,
        "LevelId": 1612955,
        "LevelName": "115",
        "Elevation": 13640,
        "ProjectElevation": 13640
    }
];

let _renderer;

export async function registerLevels(groupId, version) {
    const resp = await fetch(`${url}/getLevels?ModuleGroupId=${groupId}&Version=${version}`);
    const ls = await resp.json();
    levels = [...ls];
}

export function separate(renderer, from = 1640830, to = 694){
    _renderer = renderer;
    let fromLevel = levels.find(level => level.LevelId === from).ProjectElevation / 1000;
    let toLevel;
    if (to === undefined){
        let fromLevelIndex = levels.findIndex(level => level.LevelId === from).ProjectElevation / 1000;
        if (fromLevelIndex === 0) return;
        toLevel = levels[fromLevelIndex - 1].ProjectElevation / 1000;
    }else{
        toLevel = levels.find(level => level.LevelId === to).ProjectElevation / 1000;
    }
    console.log(fromLevel, toLevel)
    renderer.clippingPlanes = [
        new Plane(new Vector3( 0, 0, -1 ), toLevel),
        new Plane(new Vector3( 0, 0, 1 ), -fromLevel),
    ]
}

export function reset(){
    _renderer.clippingPlanes.length = 0;
}
