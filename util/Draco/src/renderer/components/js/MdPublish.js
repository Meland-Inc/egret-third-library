import { Global } from './Global.js';
import * as spawnExc from './SpawnExecute.js';
import * as fsExc from './FsExecute';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { load } from 'protobufjs';


const releaseSuffix = '/bin-release/web/';
const thmFileSuffix = 'resource/default.thm.json';
const defaultResSuffix = 'resource/default.res.json';
const mapDataResSuffix = 'resource/mapData.res.json';
const asyncResSuffix = 'resource/async.res.json';
const indieResSuffix = 'resource/indie.res.json';

//resource里的文件
const assetsSfx = "assets";
const asyncSfx = "async";
const indieSfx = "indie";
const loaderSfx = "loader";

const assets_suffix_path = '/resource/assets';
const async_suffix_path = '/resource/async';
const indie_suffix_path = '/resource/indie';
const loader_suffix_path = '/resource/loader';
// const assetsPath = Global.projPath + assets_suffix_path;
// const asyncPath = Global.projPath + async_suffix_path;
// const indiePath = Global.projPath + indie_suffix_path;
// const loaderPath = Global.projPath + loader_suffix_path;

var _checkBoxValues = [assetsSfx, asyncSfx, indieSfx, loaderSfx];
export function getCheckBoxValue() { return _checkBoxValues; }
export function setCheckBoxValue(value) { _checkBoxValues = value; }

export var svnPublishPath = Global.svnPath + '/client/publish';

var projNewVersionPath = Global.projPath + releaseSuffix + newVersion;

var releaseVersion;
export function getReleaseVersion() { return releaseVersion; }
export function setReleaseVersion(value) { releaseVersion = value; }

var displayVersion;
export function getDisplayVersion() { return displayVersion; }
export function setDisplayVersion(value) { displayVersion = value; }

var versionType;
export function getVersionType() { return versionType; }
export function setVersionType(value) { versionType = value; }

var cdnPath;
export function getCdnPath() { return cdnPath; }
export function setCdnPath(value) { cdnPath = value; }

var newVersion;
export function getNewVersion() { return newVersion; }
export function setNewVersion(value) {
    newVersion = value;
    projNewVersionPath = Global.projPath + releaseSuffix + newVersion;
}

var oldVersion;
export function getOldVersion() { return oldVersion; }
export function setOldVersion(value) { oldVersion = value; }

var checkBoxData = [];
export function getCheckBoxData() { return checkBoxData; }
export function setCheckBoxData(value) { checkBoxData = value; }

var needCover = true;
export function setNeedCover(value) { needCover = value; }
export function getNeedCover() { return needCover; }

export const versionTypes = ['强制更新', '选择更新', '静态更新'];
export const checkBoxValues = ['安卓', '苹果', '微信'];

export async function publishProject() {
    if (!releaseVersion) {
        Global.snack('请先设置发布版本号');
        return;
    }

    if (!displayVersion) {
        Global.snack('请先设置显示版本号');
        return;
    }

    if (!versionType) {
        Global.snack('请先选择版本更新类型');
        return;
    }

    if (needCover) {
        await checkClearRelease(releaseVersion);
    }

    try {
        let cmdStr = 'egret publish --version ' + releaseVersion;
        await spawnExc.runCmd(cmdStr, Global.projPath, 'null', '发布当前项目错误');
    } catch (error) {
        Global.snack('发布当前项目错误', error);
    }

    let content = JSON.stringify({
        gameVersion: releaseVersion,
        displayVersion: displayVersion,
        tag: false,
        versionType: versionTypes.indexOf(versionType),
        cdnPath: cdnPath
    });

    await fsExc.makeDir(Global.projPath + releaseSuffix);

    let versionPath = Global.projPath + releaseSuffix + releaseVersion + '/version.json';
    let releasePath = Global.projPath + releaseSuffix + releaseVersion;
    try {
        await fsExc.writeFile(versionPath, content);
        await clearNcopyResource(releasePath);
        Global.toast('发布当前项目成功');
        newVersion = releaseVersion;
    } catch (error) {
        Global.snack('写入版本文件错误', error);
    }
}

export async function mergeVersion() {
    if (!newVersion) {
        Global.snack('请先选择新版本号');
        return;
    }
    if (oldVersion
        && parseInt(oldVersion) >= parseInt(newVersion)) {
        Global.snack('新版本号应该比旧版本号大');
        return;
    }

    if (!svnPublishPath) {
        Global.snack('请在设置选项中设置发布目录');
        return;
    }

    if (needCover) {
        await checkClearVersion(newVersion);
    } else {
        if (await checkExistVersion(newVersion)) {
            let b = await Global.showAlert(`${newVersion} version already exists,overwrite?`);
            if (!b) {
                console.log("--> alert cancelled");
                return;
            }

            await Global.waitTime(100);
            await checkClearVersion(newVersion);
        }
    }

    try {
        let versionListContent = await fsExc.readFile(svnPublishPath + '/versionList.json');
        let versionList = JSON.parse(versionListContent);
        if (versionList.versionList.indexOf(newVersion) == -1) {
            versionList.versionList.push(newVersion);
            versionListContent = JSON.stringify(versionList);
        }

        if (oldVersion && oldVersion != '0') {
            versionList.versionList = versionList.versionList.sort((a, b) => {
                return a <= b ? -1 : 1;
            });
            for (const iterator of versionList.versionList) {
                if (parseInt(oldVersion) < parseInt(iterator)
                    && parseInt(iterator) < parseInt(newVersion)) {
                    await mergeSingleVersion(newVersion, iterator, false);
                }
            }

            await mergeSingleVersion(newVersion, oldVersion, true);
        } else {
            await mergeSingleVersion(newVersion, null, true);
        }

        await fsExc.writeFile(svnPublishPath + '/versionList.json', versionListContent);

        Global.toast('比较新旧成功');
    } catch (error) {
        Global.snack('比较新旧错误', error);
    }
}

async function mergeSingleVersion(newVersion, oldVersion, isRelease) {
    console.log(`--> start merge version v${oldVersion}s-v${newVersion}s`);
    let svnWebRlsPath;
    let svnCdnRlsPath;
    if (isRelease) {
        svnWebRlsPath = `${svnPublishPath}/web/release_v${newVersion}s`;
        svnCdnRlsPath = `${svnPublishPath}/cdn/release_v${newVersion}s`;
    }

    let svnWebPatchPath;
    let svnCdnPatchPath;
    let oldSvnWebRlsPath;
    let oldSvnCdnRlsPath;
    if (oldVersion) {
        svnWebPatchPath = `${svnPublishPath}/web/patch_v${oldVersion}s-v${newVersion}s`;
        svnCdnPatchPath = `${svnPublishPath}/cdn/patch_v${oldVersion}s-v${newVersion}s`;
        oldSvnWebRlsPath = `${svnPublishPath}/web/release_v${oldVersion}s`;
        oldSvnCdnRlsPath = `${svnPublishPath}/cdn/release_v${oldVersion}s`;
        let webExists = await fsExc.exists(oldSvnWebRlsPath);
        if (!webExists) {
            console.error(`--> web version ${oldSvnWebRlsPath} dose not exist`);
            return;
        }
        let cdnExists = await fsExc.exists(oldSvnCdnRlsPath);
        if (!cdnExists) {
            console.error(`--> cdn version ${oldSvnCdnRlsPath} dose not exist`);
            return;
        }
    } else {
        svnWebPatchPath = `${svnPublishPath}/web/patch_v${newVersion}s`;
        svnCdnPatchPath = `${svnPublishPath}/cdn/patch_v${newVersion}s`;
    }

    newVersion = newVersion.replace(new RegExp('[.]', 'g'), '-');
    if (oldVersion) {
        oldVersion = oldVersion.replace(new RegExp('[.]', 'g'), '-');
    }
    try {
        if (svnWebRlsPath) {
            await fsExc.makeDir(svnWebRlsPath);
        }
        if (svnCdnRlsPath) {
            await fsExc.makeDir(svnCdnRlsPath);
        }
        await fsExc.makeDir(svnWebPatchPath);
        await fsExc.makeDir(svnCdnPatchPath);

        //不用比较,直接拷贝的
        if (svnWebRlsPath) {
            await copyFileCheckDir('index.html', svnWebRlsPath);
        }
        await copyFileCheckDir('index.html', svnWebPatchPath);

        if (svnWebRlsPath) {
            await copyFileCheckDir('manifest.json', svnWebRlsPath);
        }
        await copyFileCheckDir('manifest.json', svnWebPatchPath);

        let versionContent = await fsExc.readFile(projNewVersionPath + '/version.json');
        let versionObj = JSON.parse(versionContent);
        versionObj.tag = true;
        versionContent = JSON.stringify(versionObj);

        if (svnWebRlsPath) {
            await fsExc.writeFile(svnWebRlsPath + '/version.json', versionContent);
        }
        await fsExc.writeFile(svnWebPatchPath + '/version.json', versionContent);

        if (svnWebRlsPath) {
            await folderCopyFile(projNewVersionPath + '/js', svnWebRlsPath + '/js');
        }
        await folderCopyFile(projNewVersionPath + '/js', svnWebPatchPath + '/js');

        if (svnCdnRlsPath) {
            await fsExc.makeDir(svnCdnRlsPath + '/resource');
        }
        await fsExc.makeDir(svnCdnPatchPath + '/resource');

        if (svnCdnRlsPath) {
            await folderCopyFile(projNewVersionPath + '/resource/loader', svnCdnRlsPath + '/resource/loader');
        }
        await folderCopyFile(projNewVersionPath + '/resource/loader', svnCdnPatchPath + '/resource/loader');

        //不存在旧版本,所有的都用最新的版本
        if (!oldVersion) {
            //default.thm.json
            if (svnCdnRlsPath) {
                await copyFileCheckDir(thmFileSuffix, svnCdnRlsPath, newVersion);
            }
            await copyFileCheckDir(thmFileSuffix, svnCdnPatchPath, newVersion);

            //default.res.json
            await resFileHandle(defaultResSuffix, newVersion, svnCdnRlsPath, svnCdnPatchPath);

            //mapData.res.json
            await resFileHandle(mapDataResSuffix, newVersion, svnCdnRlsPath, svnCdnPatchPath);

            //async.res.json
            await resFileHandle(asyncResSuffix, newVersion, svnCdnRlsPath, svnCdnPatchPath);

            //indie.res.json
            await resFileHandle(indieResSuffix, newVersion, svnCdnRlsPath, svnCdnPatchPath);
        } else {
            //default.thm.json
            let oldThmPath = 'resource/default.thm' + '_v' + oldVersion + '.json';
            await mergeFileInVersion(oldThmPath, thmFileSuffix, svnCdnRlsPath, svnCdnPatchPath, oldVersion, newVersion, oldSvnCdnRlsPath);

            //default.res.json
            await resFileHandle(defaultResSuffix, newVersion, svnCdnRlsPath, svnCdnPatchPath, oldVersion, oldSvnCdnRlsPath);

            //mapData.res.json
            await resFileHandle(mapDataResSuffix, newVersion, svnCdnRlsPath, svnCdnPatchPath, oldVersion, oldSvnCdnRlsPath);

            //async.res.json
            await resFileHandle(asyncResSuffix, newVersion, svnCdnRlsPath, svnCdnPatchPath, oldVersion, oldSvnCdnRlsPath);

            //indie.res.json
            await resFileHandle(indieResSuffix, newVersion, svnCdnRlsPath, svnCdnPatchPath, oldVersion, oldSvnCdnRlsPath);
        }
        console.log(`--> merge success version v${oldVersion}s-v${newVersion}s`);
    } catch (error) {
        Global.snack(`比较版本 v${oldVersion}s-v${newVersion}s 错误`, error);
    }
}

//拷贝目录中的文件,遍历拷贝,不存在文件夹就创建
async function folderCopyFile(fromPath, targetPath, version) {
    try {
        await fsExc.makeDir(targetPath);
        let files = await fsExc.readDir(fromPath);

        for (const file of files) {
            let fromPathName = path.join(fromPath, file);
            let targetPathName = path.join(targetPath, file);
            if (await fsExc.isDirectory(fromPathName)) {
                await folderCopyFile(fromPathName, targetPathName);
            } else {
                await copyFile(fromPathName, targetPathName, version);
            }
        }
    } catch (error) {
        Global.snack(`拷贝 ${fromPath} 到 ${targetPath} 错误`, error);
    }
}

//拷贝文件,不存在的目录会自动创建,如果存在版本号,会给拷贝后的文件添加版本号
async function copyFileCheckDir(fileName, targetPath, version, fromPath) {
    if (!fromPath) {
        fromPath = projNewVersionPath;
    }

    let fileNameArr = fileName.split('/');
    let checkPath = '';
    for (let i = 0; i < fileNameArr.length; i++) {
        if (i != fileNameArr.length - 1) {
            checkPath += fileNameArr[i] + '/';
            let filePath = fromPath + '/' + checkPath;

            if (await fsExc.exists(filePath)) {
                if (await fsExc.isDirectory(filePath)) {
                    await fsExc.makeDir(targetPath + '/' + checkPath);
                }
            } else {
                console.error(`--> folder ${filePath} dose not exist`);
                return;
            }
        }
    }

    await copyFile(fromPath + '/' + fileName, targetPath + '/' + fileName, version);
}

/**
 * 检查版本是否存在
 * @param {*} version 
 */
export async function checkExistVersion(version) {
    let versionListContent = await fsExc.readFile(svnPublishPath + '/versionList.json');
    let versionList = JSON.parse(versionListContent);
    let index = versionList.versionList.indexOf(version);
    return index != -1;
}

export async function checkClearRelease(version) {
    let releasePath = `${Global.projPath}/bin-release/web/${version}`;
    if (await fsExc.exists(releasePath)) {
        await fsExc.delFolder(releasePath);
    }
}

/**
 * 检查版本,如果存在版本,那么清空;
 * @param {*} version 
 */
export async function checkClearVersion(version) {
    let versionListContent = await fsExc.readFile(svnPublishPath + '/versionList.json');
    let versionList = JSON.parse(versionListContent);
    let index = versionList.versionList.indexOf(version);
    if (index != -1) {
        console.log(`--> old version ${version} exist, start clear.`);
        try {
            versionList.versionList.splice(index, 1);
            versionListContent = JSON.stringify(versionList);
            await fsExc.writeFile(svnPublishPath + '/versionList.json', versionListContent);

            let cdnPa = await fsExc.readDir(Global.svnPublishPath + '/cdn');
            for (let i = 0; i < cdnPa.length; i++) {
                const element = cdnPa[i];
                if (element.indexOf(`v${version}s`) != -1) {
                    await fsExc.delFolder(Global.svnPublishPath + '/cdn/' + element);
                }
            }

            let webPa = await fsExc.readDir(Global.svnPublishPath + '/web');
            for (let i = 0; i < webPa.length; i++) {
                const element = webPa[i];
                if (element.indexOf(`v${version}s`) != -1) {
                    await fsExc.delFolder(Global.svnPublishPath + '/web/' + element);
                }
            }
            console.log(`--> clear version ${version} success`);
        } catch (error) {
            Global.snack(`清除旧版本 ${version} 错误`, error);
        }
    }
}

// //拷贝文件
// async function copyFile(filePath, targetPath, version) {
//     try {
//         if (version) {
//             let targetPathArr = targetPath.split('/');
//             let fileName = targetPathArr[targetPathArr.length - 1];
//             if (fileName.indexOf('_v' + version) == -1) {
//                 targetPath = addVersionToPath(targetPath, version);
//             } else {
//                 console.log('targetPath:' + targetPath + '---fileName:' + fileName);
//             }
//         }

//         let exists = await fsExc.exists(filePath);
//         if (exists) {
//             let content = await fsExc.readFile(filePath);
//             await fsExc.writeFile(targetPath, content);
//         }
//     } catch (error) {
//         Global.snack(`copy ${filePath} to ${targetPath}`, error);
//     }
// }

/**
 * 拷贝文件,如果带有版本号,会把拷贝的文件名添加版本号
 * @param {*} filePath 
 * @param {*} targetPath 
 * @param {*} version 
 */
function copyFile(filePath, targetPath, version) {
    return new Promise((resolve, reject) => {
        try {
            if (version) {
                let targetPathArr = targetPath.split("/");
                let fileName = targetPathArr[targetPathArr.length - 1];
                if (fileName.indexOf("_v" + version) == -1) {
                    targetPath = addVersionToPath(targetPath, version);
                } else {
                    console.log(`--> targetPath:${targetPath} fileName:${fileName}`);
                }
            }

            fs.exists(filePath, exists => {
                if (exists) {
                    fs.readFile(filePath, (readError, data) => {
                        if (readError) {
                            console.error(readError);
                            reject();
                        } else {
                            fs.writeFile(targetPath, data, writeError => {
                                if (writeError) {
                                    console.error(writeError);
                                    reject();
                                } else {
                                    resolve();
                                }
                            });
                        }
                    });
                } else {
                    console.log(`--> file ${filePath} dose not exist`);
                    resolve();
                }
            });
        } catch (error) {
            Global.snack(`拷贝 ${fromPath} 到 ${targetPath} 错误`, error);
            reject();
        }
    });
}

//添加版本号到路径
function addVersionToPath(targetPath, version) {
    let returnPath = targetPath;
    if (version) {
        let targetPathArr = targetPath.split('.');
        let suffix = targetPathArr[targetPathArr.length - 1];
        let prefix = '';
        for (let i = 0; i < targetPathArr.length; i++) {
            const element = targetPathArr[i];
            if (i < targetPathArr.length - 2) {
                prefix += element + '.';
            } else if (i < targetPathArr.length - 1) {
                prefix += element;
            } else {
                //reserve
            }
        }
        returnPath = prefix + '_v' + version + '.' + suffix;
    }

    return returnPath;
}

//根据两个版本比较文件
async function mergeFileInVersion(oldFileSuffix, newFileSuffix, svnCdnRlsPath, svnCdnPatchPath, oldVersion, newVersion, oldSvnCdnRlsPath) {
    let newFileExist = await fsExc.exists(projNewVersionPath + '/' + newFileSuffix);
    let oldFileExist = await fsExc.exists(oldSvnCdnRlsPath + '/' + oldFileSuffix);
    if (!newFileExist) {
        console.log(`--> new version v${oldVersion}s-v${newVersion}s delete file ${projNewVersionPath}/${newFileSuffix}`);
        return false;
    }

    if (!oldFileExist) {
        console.log(`--> new version v${oldVersion}s-v${newVersion}s add file ${projNewVersionPath}/${newFileSuffix}`);
        // return false;
    }

    let fileEqual = false;
    if (oldFileExist) {
        fileEqual = await mergeFileByMd5(oldSvnCdnRlsPath + '/' + oldFileSuffix, projNewVersionPath + '/' + newFileSuffix);
    }

    if (fileEqual) {
        if (svnCdnRlsPath) {
            //相等,拷贝旧的文件到新目录
            await fsExc.makeDir(svnCdnRlsPath + '/' + fsExc.getFileFolder(oldFileSuffix));
            await copyFile(oldSvnCdnRlsPath + '/' + oldFileSuffix, svnCdnRlsPath + '/' + oldFileSuffix);
        }
    } else {
        if (svnCdnRlsPath) {
            await copyFileCheckDir(newFileSuffix, svnCdnRlsPath, newVersion);
        }
        await copyFileCheckDir(newFileSuffix, svnCdnPatchPath, newVersion);
    }
    return fileEqual;
}

//比较两个文件的MD5
async function mergeFileByMd5(oldFilePath, newFilePath) {
    let oldFile = await fsExc.readFile(oldFilePath);
    let newFile = await fsExc.readFile(newFilePath);
    const oldFileMd5 = crypto
        .createHash('md5')
        .update(oldFile)
        .digest('hex');
    const newFileMd5 = crypto
        .createHash('md5')
        .update(newFile)
        .digest('hex');

    return oldFileMd5 == newFileMd5;
}
//根据res配置文件,添加版本号到文件和配置中
async function resFileHandle(resFilePath, newVersion, releasePath, patchPath, oldVersion, oldVersionPath) {
    let useNew = false;
    let newResContent = await fsExc.readFile(projNewVersionPath + '/' + resFilePath);
    let newResObj = JSON.parse(newResContent);
    if (oldVersion) {
        let oldResPath = addVersionToPath(resFilePath, oldVersion);
        let resEqual = await mergeFileInVersion(oldResPath, resFilePath, releasePath, patchPath, oldVersion, newVersion, oldVersionPath);
        if (!resEqual) {
            let oldResContent = await fsExc.readFile(oldVersionPath + '/' + oldResPath);
            let oldResObj = JSON.parse(oldResContent);

            for (const newResIterator of newResObj.resources) {
                let newPath = 'resource/' + newResIterator.url;

                let oldPath;
                let oldResIteratorUrl;
                for (const oldResIterator of oldResObj.resources) {
                    if (oldResIterator.name == newResIterator.name) {
                        oldPath = 'resource/' + oldResIterator.url;
                        oldResIteratorUrl = oldResIterator.url;
                        break;
                    }
                }

                let resFileEqual = false;
                //处理纹理集配置内索引的图片地址
                if (newResIterator.type == 'sheet') {
                    //是图集,比较图集配置文件中的图片是否相同
                    let newConfigContent = await fsExc.readFile(projNewVersionPath + '/' + newPath);
                    let newConfigObj = JSON.parse(newConfigContent);
                    let newFilePath = 'resource/' + fsExc.getFileFolder(newResIterator.url) + '/' + newConfigObj.file;

                    let oldFilePath = '';
                    if (oldPath) {
                        //存在旧的 给旧路径赋值
                        let oldConfigPath = oldVersionPath + '/' + oldPath;
                        let oldConfigContent = await fsExc.readFile(oldConfigPath);
                        let oldConfigObj = JSON.parse(oldConfigContent);
                        oldFilePath = 'resource/' + fsExc.getFileFolder(newResIterator.url) + oldConfigObj.file;
                    } else {
                        oldFilePath = 'resource/' + fsExc.getFileFolder(newResIterator.url) + newConfigObj.file;
                    }

                    //判断图集是否相同
                    resFileEqual = await mergeFileInVersion(oldFilePath, newFilePath, releasePath, patchPath, oldVersion, newVersion, oldVersionPath);

                    //图集配置处理
                    await sheetConfigHandle(resFileEqual, releasePath, patchPath, oldPath, newPath, oldVersion, newVersion, newResIterator.url, oldVersionPath);
                } else {
                    //不是图集,直接比较
                    resFileEqual = await mergeFileInVersion(oldPath, newPath, releasePath, patchPath, oldVersion, newVersion, oldVersionPath);
                }

                //修改图集配置中的版本号
                if (resFileEqual) {
                    newResIterator.url = oldResIteratorUrl;
                } else {
                    newResIterator.url = addVersionToPath(newResIterator.url, newVersion);
                }
            }
        } else {
            useNew = true;
        }
    } else {
        useNew = true;
    }

    if (useNew) {
        for (const iterator of newResObj.resources) {
            //处理纹理集配置内索引的图片地址
            if (iterator.type == 'sheet') {
                let oldPath;
                if (oldVersion) {
                    oldPath = addVersionToPath('resource/' + iterator.url, oldVersion);
                }
                let newPath = 'resource/' + iterator.url;
                let newConfigContent = await fsExc.readFile(projNewVersionPath + '/' + newPath);
                let newConfigObj = JSON.parse(newConfigContent);
                let filePath = 'resource/' + fsExc.getFileFolder(iterator.url) + newConfigObj.file;
                //拷贝图集中的图片
                if (releasePath) {
                    await copyFileCheckDir(filePath, releasePath, newVersion);
                }
                await copyFileCheckDir(filePath, patchPath, newVersion);

                //图集配置处理,不相等,直接用新的
                await sheetConfigHandle(false, releasePath, patchPath, oldPath, newPath, oldVersion, newVersion, iterator.url, oldVersionPath);
            } else {
                //其他文件只要拷贝配置就好了
                let targetPath = 'resource/' + iterator.url;
                if (releasePath) {
                    await copyFileCheckDir(targetPath, releasePath, newVersion);
                }
                await copyFileCheckDir(targetPath, patchPath, newVersion);
            }

            //修改配置中的版本号
            iterator.url = addVersionToPath(iterator.url, newVersion);
        }
    }

    //修改res配置中的版本号
    newResContent = JSON.stringify(newResObj);
    let resUrl = addVersionToPath(resFilePath, newVersion);
    if (releasePath) {
        await fsExc.writeFile(releasePath + '/' + resUrl, newResContent);
    }
    await fsExc.writeFile(patchPath + '/' + resUrl, newResContent);
}

async function sheetConfigHandle(resFileEqual, releasePath, patchPath, oldPath, newPath, oldVersion, newVersion, sheetUrl, oldVersionPath) {
    if (resFileEqual) {
        //相等
        if (releasePath) {
            await copyFile(oldVersionPath + '/' + oldPath, releasePath + '/' + oldPath);
        }
    } else {
        //不相等
        //release
        if (releasePath) {
            await copyFile(projNewVersionPath + '/' + newPath, releasePath + '/' + newPath, newVersion);
        }

        //patch
        await copyFile(projNewVersionPath + '/' + newPath, patchPath + '/' + newPath, newVersion);

        //修改图集配置文件
        if (releasePath) {
            let releaseFileContent = await fsExc.readFile(projNewVersionPath + '/resource/' + sheetUrl);

            let releaseFileObj = JSON.parse(releaseFileContent);
            releaseFileObj.file = addVersionToPath(releaseFileObj.file, newVersion);
            releaseFileContent = JSON.stringify(releaseFileObj);
            await fsExc.writeFile(releasePath + '/resource/' + addVersionToPath(sheetUrl, newVersion), releaseFileContent);
        }

        let patchFileContent = await fsExc.readFile(projNewVersionPath + '/resource/' + sheetUrl);
        let patchFileObj = JSON.parse(patchFileContent);
        patchFileObj.file = addVersionToPath(patchFileObj.file, newVersion);
        patchFileContent = JSON.stringify(patchFileObj);
        await fsExc.writeFile(patchPath + '/resource/' + addVersionToPath(sheetUrl, newVersion), patchFileContent);
    }
}

/**
 * 清空resource
 */
export async function clearResource(releasePath) {

    let assetsPath = releasePath + assets_suffix_path;
    let asyncPath = releasePath + async_suffix_path;
    let indiePath = releasePath + indie_suffix_path;
    let loaderPath = releasePath + loader_suffix_path;
    try {
        for (const iterator of _checkBoxValues) {
            switch (iterator) {
                case 'assets':
                    await fsExc.delFiles(assetsPath);
                    break;
                case 'async':
                    await fsExc.delFiles(asyncPath);
                    break;
                case 'indie':
                    await fsExc.delFiles(indiePath);
                    break;
                case 'loader':
                    await fsExc.delFiles(loaderPath);
                    break;
            }
        }
    } catch (error) {
        Global.snack('清空resource文件失败', error);
    }
}


export async function copyResource(releasePath) {
    let compressAssetsPath = Global.compressResourcePath + '/' + assetsSfx;
    let compressAsyncPath = Global.compressResourcePath + '/' + asyncSfx;
    let compressIndiePath = Global.compressResourcePath + '/' + indieSfx;
    let compressLoaderPath = Global.compressResourcePath + '/' + loaderSfx;

    let assetsPath = releasePath + assets_suffix_path;
    let asyncPath = releasePath + async_suffix_path;
    let indiePath = releasePath + indie_suffix_path;
    let loaderPath = releasePath + loader_suffix_path;
    try {
        for (const iterator of _checkBoxValues) {
            switch (iterator) {
                case 'assets':
                    await fsExc.makeDir(assetsPath);
                    await fsExc.copyFile(compressAssetsPath, assetsPath, true);
                    break;
                case 'async':
                    await fsExc.makeDir(asyncPath);
                    await fsExc.copyFile(compressAsyncPath, asyncPath, true);
                    break;
                case 'indie':
                    await fsExc.makeDir(indiePath);
                    await fsExc.copyFile(compressIndiePath, indiePath, true);
                    break;
                case 'loader':
                    await fsExc.makeDir(loaderPath);
                    await fsExc.copyFile(compressLoaderPath, loaderPath, true);
                    break;
            }
        }

        Global.toast('拷贝压缩文件成功');
    } catch (error) {
        Global.snack('拷贝压缩文件错误', error);
    }
}

export async function clearNcopyResource() {
    // let projNewVersionPath = Global.projPath + releaseSuffix + 110;
    await clearResource(projNewVersionPath);
    await copyResource(projNewVersionPath);
}