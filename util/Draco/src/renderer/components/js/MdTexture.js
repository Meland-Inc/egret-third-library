import { Global } from './Global.js';
import * as tableExc from './TableExecute.js';
import * as jimpExc from './JimpExecute';
import * as spawnExc from "./SpawnExecute.js";
import * as fsExc from "./FsExecute.js";
import * as util from "./Util.js";

const input_suffix_path = '/TextureInput/texture';
const ground_output_suffix_path = '/TextureOutput/ground';
const floor_output_suffix_path = '/TextureOutput/floor';
const object_output_suffix_path = '/TextureOutput/object';
const multi_output_suffix_path = '/TextureOutput/multi';

const ground_2d_output_suffix_path = '/TextureOutput/ground2d';
const object_2d_output_suffix_path = '/TextureOutput/object2d';

const sheet_suffix_path = '/TextureSheet';
const project_sheet_suffix_path = '/resource/assets/preload/sheet';

const entity_csv = '/Entity.csv';
const object_csv = '/EntityBuildObject.csv';
const varia_csv = '/EntityVaria.csv';
const material_csv = '/EntityMaterial.csv';
const object_state_csv = '/ObjectState.csv';

const copy_in_suffix_arr = [
    '/versionRes/trunk/settings/resource/mapcell',
    '/versionRes/trunk/settings/resource/material',
    '/versionRes/trunk/settings/resource/object',
    '/versionRes/trunk/settings/resource/object_varia'
];

const itemIconSfx = "itemIcon";
const avatarIconSfx = "avatarIcon";
const groundSfx = "ground";
const floorSfx = "floor";
const objectSfx = "object";
const objectDecorateSfx = "objectDecorate";
const multiPictureSfx = "multiPicture";
const AnimationSfx = "Animation";
const ground2dSfx = "ground2d";
const object2dSfx = "object2d";

const sheetSfxArr = [
    itemIconSfx,
    avatarIconSfx,
];

const objectType = {
    ObjectTypeUnknown: 0,
    ObjectTypeGear: 1,
    ObjectTypePlaceholder2: 2,
    ObjectTypeConsume: 3,
    ObjectTypeMaterial: 4,
    ObjectTypeConstruction: 5,
    ObjectTypePlaceholder6: 6,
    ObjectTypeGround: 7,
    ObjectTypeResource: 8,
    ObjectTypeCurrency: 9,
    ObjectTypeFloor: 10,
    ObjectTypeWall: 11,
    ObjectTypeWindow: 12,
    ObjectTypePlayerAreaFlag: 13,
    ObjectTypeBox: 14,
    ObjectTypeFormula: 15,
    ObjectTypeVoid: 16,
    ObjectTypeSurface: 17
}

var _checkBoxValues = [itemIconSfx, avatarIconSfx, groundSfx, floorSfx, objectSfx, objectDecorateSfx, multiPictureSfx, AnimationSfx, ground2dSfx, object2dSfx];
export function getCheckBoxValues() { return _checkBoxValues; }
export function setCheckBoxValues(value) { _checkBoxValues = value; }

var _checkBoxData = [itemIconSfx, avatarIconSfx, groundSfx, floorSfx, objectSfx, objectDecorateSfx, multiPictureSfx, AnimationSfx, ground2dSfx, object2dSfx];
export function getCheckBoxData() { return _checkBoxData; }
export function setCheckBoxData(value) { _checkBoxData = value; }

var _sheetMode = false;
export function getSheetMode() { return _sheetMode; }
export function setSheetMode(value) { _sheetMode = value; }

/**
 * 更新svn
 */
export async function updateSvn() {
    await spawnExc.svnUpdate(Global.svnCsvPath, "更新svn配置成功", "更新svn配置错误");
    await spawnExc.svnUpdate(Global.svnResPath, "更新svn资源文件成功", "更新svn资源文件错误");
}

/** 检测资源是否重复 */
export async function checkTextureRepeat() {
    util.checkFileRepeat(Global.svnResPath,
        () => {
            Global.toast('检测纹理完毕');
        },
        (reason) => {
            Global.snack(reason);
        });
}

/**
 * 清空纹理
 */
export async function clearTexture() {
    if (!checkHasObject()) {
        return;
    }

    let inputPath = Global.svnArtPath + input_suffix_path;
    let objPath = Global.svnArtPath + object_output_suffix_path;
    let groundPath = Global.svnArtPath + ground_output_suffix_path;
    let floorPath = Global.svnArtPath + floor_output_suffix_path;
    const obj2dPath = Global.svnArtPath + object_2d_output_suffix_path;
    const ground2dPath = Global.svnArtPath + ground_2d_output_suffix_path;
    try {
        await fsExc.delFiles(inputPath);
        await fsExc.delFiles(objPath);
        await fsExc.delFiles(groundPath);
        await fsExc.delFiles(floorPath);
        await fsExc.delFiles(obj2dPath);
        await fsExc.delFiles(ground2dPath);
        Global.toast('清空纹理成功');
    } catch (error) {
        Global.snack('清空纹理错误', error);
    }
}

/**
 * 拷入纹理
 */
export async function copyTextureIn() {
    if (!checkHasObject()) {
        return;
    }

    let inputPath = Global.svnArtPath + input_suffix_path;
    try {
        await fsExc.makeDir(inputPath);
        for (const iterator of copy_in_suffix_arr) {
            let copyInPath = Global.svnPath + iterator;
            let copyFunc = async (fromPath, toPath) => {
                let isDirectory = await fsExc.isDirectory(fromPath)
                if (isDirectory) {
                    let fromPa = await fsExc.readDir(fromPath);
                    for (const element of fromPa) {
                        await copyFunc(fromPath + "/" + element, toPath);
                    }
                } else {
                    await fsExc.copyFile(fromPath, toPath);
                }
            }
            await copyFunc(copyInPath, inputPath);
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
    if (!checkHasObject()) {
        return;
    }

    let input_path = Global.svnArtPath + input_suffix_path;

    try {
        let entity_csv_path = Global.svnCsvPath + entity_csv;
        // if (Global.entityCells.length == 0) {
        Global.entityCells = await tableExc.getCsvCells(entity_csv_path);
        // }

        let object_csv_path = Global.svnCsvPath + object_csv;
        // if (Global.objectCells.length == 0) {
        Global.objectCells = await tableExc.getCsvCells(object_csv_path);
        // }

        let varia_csv_path = Global.svnCsvPath + varia_csv;
        // if (Global.variaCells.length == 0) {
        Global.variaCells = await tableExc.getCsvCells(varia_csv_path);
        // }

        let material_csv_path = Global.svnCsvPath + material_csv;
        // if (Global.materialCells.length == 0) {
        Global.materialCells = await tableExc.getCsvCells(material_csv_path);
        // }

        let objectStateCsvPath = Global.svnCsvPath + object_state_csv;
        // if (Global.objectStateCells.length == 0) {
        Global.objectStateCells = await tableExc.getCsvCells(objectStateCsvPath);
        // }

        let getOutPath = (iterator) => {
            let outPath;

            if (iterator.isMultiPicture) {
                outPath = Global.svnArtPath + multi_output_suffix_path;
            } else if (iterator.type === objectType.ObjectTypeGround) {
                outPath = Global.svnArtPath + ground_output_suffix_path;
                // FIXME: 现在地表太多没用的资源了, 暂时先不打成图集
                // } else if (iterator.type === objectType.ObjectTypeSurface) {
                //     outPath = Global.svnArtPath + surface_output_suffix_path;
            } else if (iterator.type === objectType.ObjectTypeFloor) {
                outPath = Global.svnArtPath + floor_output_suffix_path;
            } else {
                outPath = Global.svnArtPath + object_output_suffix_path;
            }

            return outPath;
        }

        let get2dOutPath = (iterator) => {
            let outPath;
            if (iterator.type === objectType.ObjectTypeGround) {
                outPath = Global.svnArtPath + ground_2d_output_suffix_path;
                // } else if (iterator.type === objectType.ObjectTypeFloor) {
                //     outPath = Global.svnArtPath + floor_2d_output_suffix_path;
            } else {
                outPath = Global.svnArtPath + object_2d_output_suffix_path;
            }

            return outPath;
        }

        console.log('--> start clip entity texture');
        for (const iterator of Global.entityCells) {
            let outPath = getOutPath(iterator)
            await jimpExc.jimpCell(1, iterator, iterator.texture, input_path, outPath);

            if (iterator.rectTexture) {
                let outPath2d = get2dOutPath(iterator);
                await jimpExc.jimp2dCell(1, iterator, iterator.rectTexture, input_path, outPath2d);
            }
        }
        console.log('-->  clip entity texture complete');

        console.log('--> start clip object texture');
        for (const iterator of Global.objectCells) {
            let outPath = getOutPath(iterator)
            await jimpExc.jimpCell(1, iterator, iterator.texture, input_path, outPath);
            if (iterator.rectTexture) {
                let outPath2d = get2dOutPath(iterator);
                await jimpExc.jimp2dCell(1, iterator, iterator.rectTexture, input_path, outPath2d);
            }
        }
        console.log('--> clip object texture complete');

        console.log('--> start clip varia texture');
        for (const iterator of Global.variaCells) {
            let outPath = getOutPath(iterator)
            await jimpExc.jimpCell(2, iterator, iterator.texture, input_path, outPath);
        }
        console.log('--> clip varia texture complete');

        console.log('--> start clip material texture');
        for (const iterator of Global.materialCells) {
            let outPath = getOutPath(iterator)
            await jimpExc.jimpCell(3, iterator, iterator.texture, input_path, outPath);
        }
        console.log('--> clip material texture complete');

        console.log('--> start clip objectState texture');
        for (const iterator of Global.objectStateCells) {
            let cell = Global.entityCells.find(value => value.id === iterator.objectId);

            if (!cell) {
                cell = Global.objectCells.find(value => value.id === iterator.objectId);
            }
            if (!cell) {
                cell = Global.variaCells.find(value => value.id === iterator.objectId);
            }
            if (!cell) {
                cell = Global.materialCells.find(value => value.id === iterator.objectId);
            }

            if (!cell) {
                // console.error(`找不到配置${iterator.objectId}`);
                //TODO:以后要添加生物的判断
                continue;
            }

            if (iterator.texture) {
                let outPath = getOutPath(cell)
                await jimpExc.jimpCell(3, cell, [iterator.texture], input_path, outPath);
            }

            if (iterator.rectTexture) {
                let outPath2d = get2dOutPath(cell);
                await jimpExc.jimp2dCell(1, cell, [iterator.rectTexture], input_path, outPath2d);

            }
        }
        console.log('--> clip material objectState complete');

        Global.toast('裁剪纹理成功');
    } catch (error) {
        Global.snack('裁剪纹理错误', error);
    }
}

function checkHasObject() {
    if (_checkBoxData.indexOf(objectSfx) == -1
        && _checkBoxData.indexOf(groundSfx) == -1
        && _checkBoxData.indexOf(object2dSfx) == -1
        && _checkBoxData.indexOf(ground2dSfx) == -1) {
        return false;
    }

    return true;
}

/**
 * 打包纹理
 */
export async function packerTexture() {
    try {
        for (const iterator of _checkBoxData) {
            if (_sheetMode || sheetSfxArr.indexOf(iterator) != -1) {
                let inputs = [];
                let output = Global.svnArtPath + sheet_suffix_path + '/' + iterator;
                switch (iterator) {
                    case groundSfx:
                        inputs.push(Global.svnArtPath + ground_output_suffix_path);
                        break;
                    // case surfaceSfx:
                    //     inputs.push(Global.svnArtPath + surface_output_suffix_path);
                    //     break;
                    case floorSfx:
                        inputs.push(Global.svnArtPath + floor_output_suffix_path);
                        break;
                    case objectSfx:
                        inputs.push(Global.svnArtPath + object_output_suffix_path);
                        break;
                    // case multiPictureSfx:
                    // inputs.push(Global.svnPath + multi_output_suffix_path);
                    // break;
                    case itemIconSfx:
                        inputs.push(Global.svnPath + '/versionRes/trunk/settings/resource/item_icon');
                        break;
                    // case materialSfx:
                    //     inputs.push(Global.svnPath + '/versionRes/trunk/settings/resource/material');
                    //     break;
                    case objectDecorateSfx:
                        inputs.push(Global.svnPath + '/versionRes/trunk/settings/resource/objectDecorate');
                        break;
                    case avatarIconSfx:
                        inputs.push(Global.svnPath + '/versionRes/trunk/settings/resource/other_icon/avatar_icon');
                        break;
                    case ground2dSfx:
                        inputs.push(Global.svnArtPath + ground_2d_output_suffix_path);
                        break;
                    case object2dSfx:
                        inputs.push(Global.svnArtPath + object_2d_output_suffix_path);
                        break;
                    default:
                        break;
                }

                let cmdStr = getCmdPackerTexture(inputs, output);
                await spawnExc.runCmd(cmdStr, null, `packer ${inputs} texture success`, `packer ${inputs} texture error`);
            }
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
    let inputPath;
    let outputPath;

    try {
        for (const iterator of _checkBoxData) {
            console.log(`iterator:${iterator}`);
            let needDelPath = Global.projPath + project_sheet_suffix_path;       //需要删除的路径
            let textureOutPath = `${Global.projPath}/resource/assets/texture/map/${iterator}`;
            if ((_sheetMode || sheetSfxArr.indexOf(iterator) != -1)
                && iterator != multiPictureSfx) {
                //纹理集
                inputPath = Global.svnArtPath + sheet_suffix_path;
                if (iterator == avatarIconSfx) {
                    //如果是头像 放到注册纹理集中
                    outputPath = needDelPath = Global.projPath + '/resource/assets/preload/regSheet';
                } else {
                    outputPath = needDelPath;
                }
            } else {
                switch (iterator) {
                    case objectSfx:
                        //object 用裁剪后的单个纹理
                        inputPath = Global.svnArtPath + object_output_suffix_path;
                        break;
                    case multiPictureSfx:
                        //multi 超多格物品裁剪后的纹理
                        inputPath = Global.svnArtPath + multi_output_suffix_path;
                        break;
                    case groundSfx:
                        inputPath = Global.svnArtPath + ground_output_suffix_path;
                        break;
                    case floorSfx:
                        inputPath = Global.svnArtPath + floor_output_suffix_path;
                        break;
                    case object2dSfx:
                        //object 2d 用裁剪后的单个纹理
                        inputPath = Global.svnArtPath + object_2d_output_suffix_path;
                        break;
                    case ground2dSfx:
                        inputPath = Global.svnArtPath + ground_2d_output_suffix_path;
                        break;
                    default:
                        inputPath = `${Global.svnPath}/versionRes/trunk/settings/resource/${iterator}`;
                        break;
                }

                if (iterator === AnimationSfx) {
                    outputPath = needDelPath = `${Global.projPath}/resource/async`;
                } else {
                    outputPath = textureOutPath;
                }
            }

            //删除纹理
            if (needDelPath) {
                if (iterator === AnimationSfx) {
                    fsExc.delFiles(needDelPath);
                } else {
                    let targetPa = await fsExc.readDir(needDelPath);
                    for (const element of targetPa) {
                        if (element.indexOf(iterator + "-") != -1
                            && (element.indexOf(".png") != -1
                                || element.indexOf(".json") != -1)
                        ) {
                            await fsExc.delFile(needDelPath + "/" + element);
                        }
                    }
                }
            }

            if (await fsExc.exists(textureOutPath)) {
                await fsExc.delFolder(textureOutPath);
            }

            if (_sheetMode || sheetSfxArr.indexOf(iterator) != -1) {
                let fromPa = await fsExc.readDir(inputPath);
                for (const element of fromPa) {
                    if (element.indexOf(iterator + "-") != -1
                        && (element.indexOf(".png") != -1
                            || element.indexOf(".json") != -1)) {
                        await fsExc.copyFile(inputPath + "/" + element, outputPath);
                    }
                }
            } else {
                let fromPa = await fsExc.readDir(inputPath);
                for (const element of fromPa) {
                    const elementInputPath = `${inputPath}/${element}`;
                    let elementOutPath = outputPath;
                    let elementOutputDir = elementOutPath;
                    if (iterator === AnimationSfx) {
                        elementOutPath = outputPath + `/${element}/`;
                        elementOutputDir = elementOutPath.substring(0, elementOutPath.lastIndexOf("/"));
                    }
                    await fsExc.makeDir(elementOutputDir);
                    await fsExc.copyFile(elementInputPath, elementOutPath, true);
                }
            }
        }

        Global.toast('拷出纹理成功');
    } catch (error) {
        Global.snack('拷出纹理错误', error);
    }
}

// export async function oneForAll() {
//     await updateSvn();
//     await clearTexture();
//     await copyTextureIn();
//     await clipTexture();
//     await packerTexture();
//     await copyTextureOut();
// }

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
