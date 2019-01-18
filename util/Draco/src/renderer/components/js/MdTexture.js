import { Global } from './Global.js';
import * as tableExc from './TableExecute.js';
import * as jimpExc from './JimpExecute';
import * as spawnExc from "./SpawnExecute.js";
import * as fsExc from "./FsExecute.js";

const input_suffix_path = '/TextureInput/object';
const output_suffix_path = '/TextureOutput/object';
const sheet_suffix_path = '/TextureSheet';
const project_sheet_suffix_path = '/resource/assets/preload/sheet';

const object_csv = '/EntityBuildObject.csv';
const varia_csv = '/EntityVaria.csv';
const material_csv = '/EntityMaterial.csv';

const copy_in_suffix_arr = [
    '/settings/resource/object',
    '/settings/resource/object_varia'
];

var _checkBoxValues = [
    "itemIcon",
    "mapcell",
    "material",
    "object",
    "objectDecorate"
]
export function getCheckBoxValues() { return _checkBoxValues; }
export function setCheckBoxValues(value) { _checkBoxValues = value; }

var _checkBoxData = [
    "itemIcon",
    "mapcell",
    "material",
    "object",
    "objectDecorate"
]
export function getCheckBoxData() { return _checkBoxData; }
export function setCheckBoxData(value) { _checkBoxData = value; }

/**
 * 更新svn
 */
export async function updateSvn() {
    await spawnExc.svnUpdate(Global.svnResPath, "更新svn文件成功", "更新svn文件错误");
}

/**
 * 清空纹理
 */
export async function clearTexture() {
    if (_checkBoxData.indexOf("object") == -1) {
        return;
    }

    let inputPath = Global.svnArtPath + input_suffix_path;
    let outputPath = Global.svnArtPath + output_suffix_path;
    try {
        await fsExc.delFiles(inputPath);
        await fsExc.delFiles(outputPath);
        Global.toast('清空纹理成功');
    } catch (error) {
        Global.snack('清空纹理错误', error);
    }
}

/**
 * 拷入纹理
 */
export async function copyTextureIn() {
    if (_checkBoxData.indexOf("object") == -1) {
        return;
    }

    let inputPath = Global.svnArtPath + input_suffix_path;
    try {
        await fsExc.makeDir(inputPath);
        for (const iterator of copy_in_suffix_arr) {
            let copyInPath = Global.svnPath + iterator;
            await fsExc.copyFile(copyInPath, inputPath, true);
        }

        Global.toast('拷入纹理成功');
    } catch (error) {
        Global.snack('拷入纹理错误', error);
    }
}

/**
 * 裁剪纹理
 */
export async function clipTexture() {
    if (_checkBoxData.indexOf("object") == -1) {
        return;
    }

    let input_path = Global.svnArtPath + input_suffix_path;
    let output_path = Global.svnArtPath + output_suffix_path;

    try {
        let object_csv_path = Global.svnCsvPath + object_csv;
        if (Global.objectCells.length == 0) {
            Global.objectCells = await tableExc.getCsvCells(object_csv_path);
        }

        let varia_csv_path = Global.svnCsvPath + varia_csv;
        if (Global.variaCells.length == 0) {
            Global.variaCells = await tableExc.getCsvCells(varia_csv_path);
        }

        let material_csv_path = Global.svnCsvPath + material_csv;
        if (Global.materialCells.length == 0) {
            Global.materialCells = await tableExc.getCsvCells(material_csv_path);
        }

        console.log('--> start clip object texture');
        for (const iterator of Global.objectCells) {
            await jimpExc.jimpPng2(iterator, input_path, output_path);
        }
        console.log('--> clip object texture complete');

        console.log('--> start clip varia texture');
        for (const iterator of Global.variaCells) {
            await jimpExc.jimpPng2(iterator, input_path, output_path);
        }
        console.log('--> clip varia texture complete');

        console.log('--> start clip material texture');
        for (const iterator of Global.materialCells) {
            await jimpExc.jimpPng2(iterator, input_path, output_path);
        }
        console.log('--> clip material texture complete');

        Global.toast('裁剪纹理成功');
    } catch (error) {
        Global.snack('裁剪纹理错误', error);
    }
}

/**
 * 打包纹理
 */
export async function packerTexture() {
    try {
        for (const iterator of _checkBoxData) {
            let inputs = [];
            let output;
            switch (iterator) {
                case 'itemIcon':
                    inputs.push(Global.svnPath + '/settings/resource/item_icon');
                    break;
                case 'mapcell':
                    inputs.push(Global.svnPath + '/settings/resource/mapcell');
                    break;
                case 'material':
                    inputs.push(Global.svnPath + '/settings/resource/material');
                    break;
                case 'object':
                    inputs.push(Global.svnArtPath + output_suffix_path);
                    break;
                case 'objectDecorate':
                    inputs.push(Global.svnPath + '/settings/resource/objectDecorate');
                    break;
                default:
                    break;
            }
            output = Global.svnArtPath + sheet_suffix_path + '/' + iterator;

            let cmdStr = getCmdPackerTexture(inputs, output);
            await spawnExc.runCmd(cmdStr, null, `packer ${inputs} texture success`, `packer ${inputs} texture error`);
        }

        Global.toast('打包纹理成功');
    } catch (error) {
        Global.snack('打包纹理错误', error);
    }
}

/**
 * 拷出纹理
 */
export async function copyTextureOut() {
    let sheet_path = Global.svnArtPath + sheet_suffix_path;
    try {
        for (const iterator of _checkBoxData) {
            let outputPath =
                Global.projPath +
                project_sheet_suffix_path;

            let targetPa = await fsExc.readDir(outputPath);
            for (const element of targetPa) {
                if (element.indexOf(iterator + "-") != -1
                    && (element.indexOf(".png") != -1
                        || element.indexOf(".json") != -1)
                ) {
                    await fsExc.delFile(outputPath + "/" + element);
                }
            }

            let fromPa = await fsExc.readDir(sheet_path);
            for (const element of fromPa) {
                if (
                    element.indexOf(iterator + "-") != -1
                    && (element.indexOf(".png") != -1
                        || element.indexOf(".json") != -1)
                ) {
                    let inputPath = sheet_path + "/" + element;
                    await fsExc.copyFile(inputPath, outputPath);
                }
            }
        }

        Global.toast('拷出纹理成功');
    } catch (error) {
        Global.snack('拷出纹理错误', error);
    }
}

export async function oneForAll() {
    await updateSvn();
    await clearTexture();
    await copyTextureIn();
    await clipTexture();
    await packerTexture();
    await copyTextureOut();
}

function getCmdPackerTexture(inputPaths, outputPath) {
    let cmd =
        'texturePacker' +
        ' --multipack' +
        ' --sheet' +
        ' ' +
        outputPath +
        '-{n}.png' +
        ' --data' +
        ' ' +
        outputPath +
        '-{n}.json' +
        ' --texture-format png' +
        ' --format Egret' +
        ' --max-size 1024' +
        ' --algorithm MaxRects' +
        ' --maxrects-heuristics Best' +
        ' --size-constraints WordAligned' +
        ' --pack-mode Best' +
        ' --shape-padding 1' +
        ' --border-padding 1' +
        ' --trim-mode Trim' +
        ' --disable-rotation' +
        ' --trim-margin 1' +
        ' --opt RGBA8888' +
        ' --scale 1' +
        ' --scale-mode Smooth' +
        ' --alpha-handling KeepTransparentPixels';

    for (const iterator of inputPaths) {
        cmd += ' ' + iterator;
    }

    return cmd;
}