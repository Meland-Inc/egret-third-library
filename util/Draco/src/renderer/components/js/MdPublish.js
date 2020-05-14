import * as fs from 'fs';
import * as path from 'path';
import * as fsExc from './FsExecute';
import { Global } from './Global.js';
import { ModelMgr } from './model/ModelMgr';
import * as spawnExc from './SpawnExecute.js';
import * as ExternalUtil from './ExternalUtil.js';
import * as CdnUtil from './CdnUtil.js';
import * as admzip from 'adm-zip';
import * as archiver from "archiver";

const releaseSuffix = '/bin-release/web/';
const thmFileSuffix = 'resource/default.thm.json';
const defaultResSuffix = 'resource/default.res.json';
const mapDataResSuffix = 'resource/mapData.res.json';
const asyncResSuffix = 'resource/async.res.json';
const indieResSuffix = 'resource/indie.res.json';
const externalResSuffix = 'resource/external.json';
const jimmyResSuffix = 'resource/jimmy.res.json';

//resource里的文件
const externalSfx = "external";
const assetsSfx = "assets";
const asyncSfx = "async";
const indieSfx = "indie";

const external_suffix_path = '/resource/external';
const assets_suffix_path = '/resource/assets';
const async_suffix_path = '/resource/async';
const indie_suffix_path = '/resource/indie';

const assetSfxValues = [assetsSfx, asyncSfx, indieSfx, externalSfx];

export async function updateGit() {
    let gitBranch = ModelMgr.versionModel.curEnviron.gitBranch;
    try {
        let clearCmdStr = `git clean -df`;
        await spawnExc.runCmd(clearCmdStr, Global.projPath, null, '清除文件错误');
        await spawnExc.runCmd(clearCmdStr, Global.clientPath, null, '清除Client代码错误');

        let storeCmdStr = `git checkout -- .`;
        await spawnExc.runCmd(storeCmdStr, Global.projPath, null, '还原分支错误');
        await spawnExc.runCmd(storeCmdStr, Global.clientPath, null, '还原Client代码错误');

        let switchCmdStr = `git checkout ${gitBranch}`;
        await spawnExc.runCmd(switchCmdStr, Global.projPath, null, '切换分支错误');

        let pullCmdStr = `git pull`;
        await spawnExc.runCmd(pullCmdStr, Global.projPath, null, '拉取分支错误');
        await spawnExc.runCmd(pullCmdStr, Global.clientPath, null, '拉取Client代码错误');

        Global.toast('更新git成功');
    } catch (error) {
        Global.snack('更新git错误', error);
    }
}

async function uploadSourceMap() {
    let environ = ModelMgr.versionModel.curEnviron.name;
    let version = ModelMgr.versionModel.releaseVersion;
    let prefix = `~/js/`;
    if (environ == ModelMgr.versionModel.eEnviron.beta) {
        prefix = `~/web/beta/js`;
    }
    if (environ == ModelMgr.versionModel.eEnviron.ready) {
        environ == ModelMgr.versionModel.eEnviron.release;
    }
    if (environ == ModelMgr.versionModel.eEnviron.beta || environ == ModelMgr.versionModel.eEnviron.release) {
        console.log("--> a上传sourcemap：", environ, version, prefix);
        let cmdStr = `sentry-cli releases -o bellcode -p bellplanet files bellplanet_${environ}_${version} upload-sourcemaps main.js.map  --url-prefix "${prefix}" --log-level=error`
        await spawnExc.runCmd(cmdStr, Global.projPath, null, 'sourcemap上传sentry错误');
        cmdStr = `sentry-cli releases -o bellcode -p bellplanet files bellplanet_${environ}_${version} upload-sourcemaps --ext js './bin-release/web/${version}/js/'  --url-prefix "${prefix}" --log-level=error`
        await spawnExc.runCmd(cmdStr, Global.projPath, null, ' js上传sentry错误');
    }
}

/** 发布项目 */
export async function publishProject() {
    let releaseVersion = ModelMgr.versionModel.releaseVersion;
    if (!releaseVersion) {
        Global.snack('请先设置发布版本号');
        return;
    }

    // if (ModelMgr.versionModel.needCover) {
    //     await checkClearRelease(releaseVersion);
    // }

    try {
        if (ModelMgr.versionModel.curEnviron.codeVersionEnable) {
            let configPath = `${Global.projPath}/src/config/VersionConfig.ts`;
            let configContent = await fsExc.readFile(configPath);
            let codeVersionName;
            let regCodeVersion;
            if (ModelMgr.versionModel.curEnviron.name === ModelMgr.versionModel.eEnviron.beta) {
                regCodeVersion = /public static betaCodeVersion = ".*?";/;
                codeVersionName = "betaCodeVersion";
            } else if (ModelMgr.versionModel.curEnviron.name === ModelMgr.versionModel.eEnviron.ready) {
                regCodeVersion = /public static releaseCodeVersion = ".*?";/;
                codeVersionName = "releaseCodeVersion";
            } else {
                //reserve
            }
            if (regCodeVersion) {
                configContent = configContent.replace(regCodeVersion, `public static ${codeVersionName} = "${ModelMgr.versionModel.releaseVersion}";`);
            }

            let regTrunkName = /public static trunkName: eTrunkName = .*?;/;
            configContent = configContent.replace(regTrunkName, `public static trunkName: eTrunkName = eTrunkName.${ModelMgr.versionModel.curEnviron.trunkName};`);

            await fsExc.writeFile(configPath, configContent);
        }

        let cmdStr = 'egret publish --version ' + releaseVersion;
        await spawnExc.runCmd(cmdStr, Global.projPath, null, '发布当前项目错误');
        ModelMgr.versionModel.setNewVersion(releaseVersion);
        try {
            await uploadSourceMap();
        } catch (e) {
            console.log("--> a上传sourcemap失败", e);
        }
        let indexPath = `${Global.projPath}/bin-release/web/${releaseVersion}/index.html`;
        let indexContent = await fsExc.readFile(indexPath);
        if (ModelMgr.versionModel.curEnviron.codeVersionEnable) {
            indexContent = indexContent.replace("//window.trunkName", `window.trunkName="${ModelMgr.versionModel.curEnviron.trunkName}"`);
            indexContent = indexContent.replace("//window.environName", `window.environName="${ModelMgr.versionModel.curEnviron.name}"`);
            //alpha以外的分支要添加游戏版本号信息到html
            if (ModelMgr.versionModel.curEnviron.name !== ModelMgr.versionModel.eEnviron.alpha) {
                indexContent = indexContent.replace("window.gameVersion = ''", `window.gameVersion="_v${releaseVersion}"`);
            }
            await fsExc.writeFile(indexPath, indexContent);
        }

        if (ModelMgr.versionModel.versionDesc) {
            indexContent = indexContent.replace("//window.location.href", `window.location.hash='publisher="${ModelMgr.versionModel.publisher}"&versionDesc="${ModelMgr.versionModel.versionDesc}"'`);
            await fsExc.writeFile(indexPath, indexContent);
        }

        //改回原来的分支名称
        if (ModelMgr.versionModel.curEnviron.codeVersionEnable) {
            let configPath = `${Global.projPath}/src/config/VersionConfig.ts`;
            let configContent = await fsExc.readFile(configPath);
            let regTrunkName = /public static trunkName: eTrunkName = .*?;/;
            configContent = configContent.replace(regTrunkName, `public static trunkName: eTrunkName = eTrunkName.${ModelMgr.versionModel.eEnviron.alpha};`);
            await fsExc.writeFile(configPath, configContent);
        }
        Global.toast('发布当前项目成功');
    } catch (error) {
        Global.snack('发布当前项目错误', error);
    }
}

/** 比较版本 */
export async function mergeVersion() {
    let newVersion = ModelMgr.versionModel.newVersion;
    if (!newVersion) {
        Global.snack('请先选择新版本号');
        return;
    }
    let oldVersion = ModelMgr.versionModel.oldVersion;
    if (oldVersion
        && parseInt(oldVersion) >= parseInt(newVersion)) {
        Global.snack('新版本号应该比旧版本号大');
        return;
    }

    if (!Global.svnPublishPath) {
        Global.snack('请在设置选项中设置发布目录');
        return;
    }

    if (ModelMgr.versionModel.needCover) {
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
        if (oldVersion && oldVersion != '0') {
            for (let i = parseInt(oldVersion) + 1; i < parseInt(newVersion); i++) {
                if (await checkExistVersion(i)) {
                    await mergeSingleVersion(newVersion, i + "", false);
                }
            }
            await mergeSingleVersion(newVersion, oldVersion, true);
        } else {
            await mergeSingleVersion(newVersion, null, true);
        }

        await ModelMgr.versionModel.initVersionList();

        Global.toast('比较新旧成功');
    } catch (error) {
        Global.snack('比较新旧错误', error);
    }
}

/**
 * 比较单个版本
 * @param {*} newVersion 新版本
 * @param {*} oldVersion 旧版本
 * @param {*} isRelease 是否同时发布release
 */
async function mergeSingleVersion(newVersion, oldVersion, isRelease) {
    let projNewVersionPath = Global.projPath + releaseSuffix + newVersion;
    if (oldVersion) {
        console.log(`--> start merge version v${oldVersion}s-v${newVersion}s`);
    } else {
        console.log(`--> start generate version v${newVersion}s`);
    }
    let svnRlsPath;
    if (isRelease) {
        svnRlsPath = `${Global.svnPublishPath}${ModelMgr.versionModel.curEnviron.localPath}/release_v${newVersion}s`;
    }

    let svnPatchPath;
    let oldSvnRlsPath;
    if (oldVersion) {
        svnPatchPath = `${Global.svnPublishPath}${ModelMgr.versionModel.curEnviron.localPath}/patch_v${oldVersion}s-v${newVersion}s`;
        oldSvnRlsPath = `${Global.svnPublishPath}${ModelMgr.versionModel.curEnviron.localPath}/release_v${oldVersion}s`;
        let rlsExists = await fsExc.exists(oldSvnRlsPath);
        if (!rlsExists) {
            console.error(`--> version ${oldSvnRlsPath} dose not exist`);
            return;
        }
    } else {
        svnPatchPath = `${Global.svnPublishPath}${ModelMgr.versionModel.curEnviron.localPath}/patch_v${newVersion}s`;
    }

    // newVersion = newVersion.replace(new RegExp('[.]', 'g'), '-');
    // if (oldVersion) {
    //     oldVersion = oldVersion.replace(new RegExp('[.]', 'g'), '-');
    // }
    try {
        if (svnRlsPath) {
            await fsExc.makeDir(svnRlsPath);
        }
        await fsExc.makeDir(svnPatchPath);

        //不用比较,直接拷贝的
        if (svnRlsPath) {
            await copyFileCheckDir('index.html', svnRlsPath, newVersion);
            await writeNativeIndexToPath(svnRlsPath);
        }
        await copyFileCheckDir('index.html', svnPatchPath, newVersion);
        await writeNativeIndexToPath(svnPatchPath);

        if (svnRlsPath) {
            await copyFileCheckDir('manifest.json', svnRlsPath, newVersion);
        }
        await copyFileCheckDir('manifest.json', svnPatchPath, newVersion);

        if (svnRlsPath) {
            await folderCopyFile(projNewVersionPath + '/js', svnRlsPath + '/js');
        }
        await folderCopyFile(projNewVersionPath + '/js', svnPatchPath + '/js');

        if (svnRlsPath) {
            await fsExc.makeDir(svnRlsPath + '/resource');
        }
        await fsExc.makeDir(svnPatchPath + '/resource');

        //不存在旧版本,所有的都用最新的版本
        if (!oldVersion) {
            // //default.thm.json
            // if (svnCdnRlsPath) {
            //     await copyFileCheckDir(thmFileSuffix, svnCdnRlsPath, newVersion);
            // }
            // await copyFileCheckDir(thmFileSuffix, svnCdnPatchPath, newVersion);

            //external.json
            await externalHandle(externalResSuffix, newVersion, svnRlsPath, svnPatchPath);

            //default.res.json
            await resFileHandle(defaultResSuffix, newVersion, svnRlsPath, svnPatchPath);

            //mapData.res.json
            await resFileHandle(mapDataResSuffix, newVersion, svnRlsPath, svnPatchPath);

            //async.res.json
            await resFileHandle(asyncResSuffix, newVersion, svnRlsPath, svnPatchPath);

            //indie.res.json
            await resFileHandle(indieResSuffix, newVersion, svnRlsPath, svnPatchPath);

            //jimmy.res.json
            await resFileHandle(jimmyResSuffix, newVersion, svnRlsPath, svnPatchPath);
            console.log(`--> merge success version v0s-v${newVersion}s`);
        } else {
            // //default.thm.json
            // let oldThmPath = 'resource/default.thm' + '_v' + oldVersion + '.json';
            // await mergeFileInVersion(oldThmPath, thmFileSuffix, svnCdnRlsPath, svnCdnPatchPath, oldVersion, newVersion, oldSvnCdnRlsPath);

            //external.json
            await externalHandle(externalResSuffix, newVersion, svnRlsPath, svnPatchPath, oldVersion, oldSvnRlsPath);

            //default.res.json
            await resFileHandle(defaultResSuffix, newVersion, svnRlsPath, svnPatchPath, oldVersion, oldSvnRlsPath);

            //mapData.res.json
            await resFileHandle(mapDataResSuffix, newVersion, svnRlsPath, svnPatchPath, oldVersion, oldSvnRlsPath);

            //async.res.json
            await resFileHandle(asyncResSuffix, newVersion, svnRlsPath, svnPatchPath, oldVersion, oldSvnRlsPath);

            //indie.res.json
            await resFileHandle(indieResSuffix, newVersion, svnRlsPath, svnPatchPath, oldVersion, oldSvnRlsPath);

            //jimmy.res.json
            await resFileHandle(jimmyResSuffix, newVersion, svnRlsPath, svnPatchPath, oldVersion, oldSvnRlsPath);
            console.log(`--> merge success version v${oldVersion}s-v${newVersion}s`);
        }
    } catch (error) {
        Global.snack(`比较版本 v${oldVersion}s-v${newVersion}s 错误`, error);
    }
}

/** 处理外部资源配置 */
async function externalHandle(resFilePath, newVersion, releasePath, patchPath, oldVersion, oldVersionPath) {
    let projNewVersionPath = Global.projPath + releaseSuffix + newVersion;
    let externalCfgPath = projNewVersionPath + '/' + resFilePath;
    let externalCfgContent = await fsExc.readFile(externalCfgPath);
    let externalCfgObj = JSON.parse(externalCfgContent);

    if (releasePath) {
        await fsExc.makeDir(`${releasePath}${external_suffix_path}`);
    }
    await fsExc.makeDir(`${patchPath}${external_suffix_path}`);

    for (const key in externalCfgObj) {
        if (externalCfgObj.hasOwnProperty(key)) {
            let useNew = true;
            let fileName = externalCfgObj[key];
            let fileInfo = fileName.split(".");
            let fileSuffix = fileInfo.pop();
            let filePreName = fileInfo.join(".");
            let oldFilePath = `${oldVersionPath}${external_suffix_path}/${filePreName}_v${oldVersion}.${fileSuffix}`;
            let newFilePath = `${projNewVersionPath}${external_suffix_path}/${fileName}`;
            if (oldVersion) {
                let oldFileExist = await fsExc.exists(oldFilePath);
                if (oldFileExist) {
                    let fileEqual = await fsExc.mergeFileByMd5(`${oldFilePath}`, `${newFilePath}`);
                    if (fileEqual) {
                        useNew = false;
                    }
                }
            }

            if (useNew) {
                if (releasePath) {
                    await copyFile(`${newFilePath}`, `${releasePath}${external_suffix_path}/${fileName}`, newVersion);
                }
                await copyFile(`${newFilePath}`, `${patchPath}${external_suffix_path}/${fileName}`, newVersion);
                externalCfgObj[key] = `${filePreName}_v${newVersion}.${fileSuffix}`;
            } else {
                if (releasePath) {
                    await copyFile(`${newFilePath}`, `${releasePath}${external_suffix_path}/${fileName}`, oldVersion);
                }
                externalCfgObj[key] = `${filePreName}_v${oldVersion}.${fileSuffix}`;
            }
        }
    }


    if (releasePath) {
        let newCfgRlsPath = `${releasePath}/${resFilePath}`;
        newCfgRlsPath = addVersionToPath(newCfgRlsPath, newVersion);
        await fsExc.writeFile(newCfgRlsPath, JSON.stringify(externalCfgObj));
    }
    let newCfgPatchPath = patchPath + '/' + resFilePath;
    newCfgPatchPath = addVersionToPath(newCfgPatchPath, newVersion);
    await fsExc.writeFile(newCfgPatchPath, JSON.stringify(externalCfgObj));

}

/**
 * 拷贝目录中的文件,遍历拷贝,不存在文件夹就创建,如果存在版本号,会文件添加版本号
 * @param {*} fromPath 来源文件夹
 * @param {*} targetPath 目标文件夹
 * @param {*} version 版本号
 */
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

/**
 * 拷贝文件,不存在的目录会自动创建,如果存在版本号,会给拷贝后的文件添加版本号 
 * @param {*} fileName 文件相对路径,包含文件名称
 * @param {*} targetPath 目标路径
 * @param {*} newVersion 版本号
 */
async function copyFileCheckDir(fileName, targetPath, newVersion) {
    let projNewVersionPath = Global.projPath + releaseSuffix + newVersion;
    let fileNameArr = fileName.split('/');
    let checkPath = '';
    for (let i = 0; i < fileNameArr.length; i++) {
        if (i != fileNameArr.length - 1) {
            checkPath += fileNameArr[i] + '/';
            let filePath = projNewVersionPath + '/' + checkPath;
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

    // folder = await fsExc.dirname(filePath)
    // let isExists = await fsExc.exists(folder);
    // if (!isExists) {
    //     await fsExc.makeDir(folder);
    // }

    await copyFile(projNewVersionPath + '/' + fileName, targetPath + '/' + fileName, newVersion);
}

/**
 * 检查版本是否存在
 * @param {*} version 
 */
export async function checkExistVersion(version) {
    let releasePath = `${Global.svnPublishPath}${ModelMgr.versionModel.curEnviron.localPath}/release_v${version}s`;
    let exist = await fsExc.exists(releasePath);
    return exist;
}

/**
 * 检查预发布的版本,如果存在,那么清空
 * @param {*} version 
 */
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
    let exist = await checkExistVersion(version);
    if (!exist) return;

    console.log(`--> old version ${version} exist, start clear.`);
    try {
        let svnPa = await fsExc.readDir(`${Global.svnPublishPath}${ModelMgr.versionModel.curEnviron.localPath}`);
        for (let i = 0; i < svnPa.length; i++) {
            const element = svnPa[i];
            if (element.indexOf(`v${version}s`) != -1) {
                await fsExc.delFolder(`${Global.svnPublishPath}${ModelMgr.versionModel.curEnviron.localPath}/${element}`);
            }
        }

        console.log(`--> clear version ${version} success`);
    } catch (error) {
        Global.snack(`清除旧版本 ${version} 错误`, error);
    }
}

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
async function mergeFileInVersion(oldFileSuffix, newFileSuffix, svnRlsPath, svnPatchPath, oldVersion, newVersion, oldSvnRlsPath) {
    let projNewVersionPath = Global.projPath + releaseSuffix + newVersion;
    let newFileExist = await fsExc.exists(projNewVersionPath + '/' + newFileSuffix);
    let oldFileExist = await fsExc.exists(oldSvnRlsPath + '/' + oldFileSuffix);
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
        fileEqual = await fsExc.mergeFileByMd5(oldSvnRlsPath + '/' + oldFileSuffix, projNewVersionPath + '/' + newFileSuffix);
    }

    if (fileEqual) {
        if (svnRlsPath) {
            //相等,拷贝旧的文件到新目录
            await fsExc.makeDir(svnRlsPath + '/' + fsExc.dirname(oldFileSuffix));
            await copyFile(oldSvnRlsPath + '/' + oldFileSuffix, svnRlsPath + '/' + oldFileSuffix);
        }
    } else {
        if (svnRlsPath) {
            await copyFileCheckDir(newFileSuffix, svnRlsPath, newVersion);
        }
        await copyFileCheckDir(newFileSuffix, svnPatchPath, newVersion);
    }
    return fileEqual;
}

//根据res配置文件,添加版本号到文件和配置中
async function resFileHandle(resFilePath, newVersion, releasePath, patchPath, oldVersion, oldVersionPath) {
    let useNew = false;
    let projNewVersionPath = Global.projPath + releaseSuffix + newVersion;

    let newResContent = await fsExc.readFile(projNewVersionPath + '/' + resFilePath);
    let newResObj = JSON.parse(newResContent);
    if (oldVersion) {
        let oldResPath = addVersionToPath(resFilePath, oldVersion);
        let oldExist = await fsExc.exists(oldVersionPath + '/' + oldResPath);
        //旧的配置不存在的时候,用最新的
        if (!oldExist) {
            useNew = true;
        } else {
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

                    let configEqual = false;
                    let resFileEqual = false;
                    //处理纹理集配置内索引的图片地址
                    if (newResIterator.type == 'sheet') {
                        //是图集,比较图集配置文件中的图片是否相同
                        // let newConfigPath = projNewVersionPath + '/' + newPath;
                        // let newConfigContent = await fsExc.readFile(newConfigPath);

                        let newConfigContent = await fsExc.readFile(projNewVersionPath + '/' + newPath);
                        let newConfigObj = JSON.parse(newConfigContent);
                        let newFilePath = `resource/${fsExc.dirname(newResIterator.url)}/${newConfigObj.file}`;

                        let oldFilePath = '';
                        let oldConfigObj
                        if (oldPath) {
                            //存在旧的 给旧路径赋值
                            let oldConfigPath = oldVersionPath + '/' + oldPath;
                            let oldConfigContent = await fsExc.readFile(oldConfigPath);
                            oldConfigObj = JSON.parse(oldConfigContent);
                            oldFilePath = `resource/${fsExc.dirname(newResIterator.url)}/${oldConfigObj.file}`;
                        } else {
                            oldFilePath = `resource/${fsExc.dirname(newResIterator.url)}/${newConfigObj.file}`;
                        }

                        //判断图集是否相同
                        resFileEqual = await mergeFileInVersion(oldFilePath, newFilePath, releasePath, patchPath, oldVersion, newVersion, oldVersionPath);
                        if (resFileEqual && oldConfigObj) {
                            let oldFrameStr = JSON.stringify(oldConfigObj.frames);
                            oldFrameStr = oldFrameStr.replace(/\s+/g, '');

                            let newFrameStr = JSON.stringify(newConfigObj.frames);
                            newFrameStr = newFrameStr.replace(/\s+/g, '');

                            if (oldFrameStr === newFrameStr) {
                                configEqual = true;
                                console.log(`${newConfigObj.file} frames equal`);
                            } else {
                                //不相等的话,创建对应的文件夹
                                await fsExc.makeDir(patchPath + '/' + fsExc.dirname(oldFilePath));
                                await fsExc.makeDir(releasePath + '/' + fsExc.dirname(oldFilePath));
                                console.log(`${newConfigObj.file} frames not equal`);
                            }

                        }

                        //图集配置处理
                        await sheetConfigHandle(configEqual, resFileEqual, releasePath, patchPath, oldPath, newPath, oldVersion, newVersion, newResIterator.url, oldVersionPath);
                    }
                    //不是图集,直接比较
                    else {
                        configEqual = true;
                        resFileEqual = await mergeFileInVersion(oldPath, newPath, releasePath, patchPath, oldVersion, newVersion, oldVersionPath);
                    }

                    //修改图集配置中的版本号
                    if (configEqual && resFileEqual) {
                        newResIterator.url = oldResIteratorUrl;
                    } else {
                        newResIterator.url = addVersionToPath(newResIterator.url, newVersion);
                    }
                }
            } else {
                useNew = true;
            }
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
                let filePath = `resource/${fsExc.dirname(iterator.url)}/${newConfigObj.file}`;
                //拷贝图集中的图片
                if (releasePath) {
                    await copyFileCheckDir(filePath, releasePath, newVersion);
                }
                await copyFileCheckDir(filePath, patchPath, newVersion);

                //图集配置处理,不相等,直接用新的
                await sheetConfigHandle(false, false, releasePath, patchPath, oldPath, newPath, oldVersion, newVersion, iterator.url, oldVersionPath);
            }
            //其他文件只要拷贝配置就好了
            else {
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

/** 处理图集配置 */
async function sheetConfigHandle(configEqual, resFileEqual, releasePath, patchPath, oldPath, newPath, oldVersion, newVersion, sheetUrl, oldVersionPath) {
    let projNewVersionPath = Global.projPath + releaseSuffix + newVersion;

    //相等
    if (configEqual) {
        if (releasePath) {
            await copyFile(oldVersionPath + '/' + oldPath, releasePath + '/' + oldPath);
        }
    }
    //不相等
    else {
        //release
        if (releasePath) {
            await copyFile(projNewVersionPath + '/' + newPath, releasePath + '/' + newPath, newVersion);
        }

        //patch
        await copyFile(projNewVersionPath + '/' + newPath, patchPath + '/' + newPath, newVersion);

        let fileContentVersion = resFileEqual ? oldVersion : newVersion;
        //修改图集配置文件
        if (releasePath) {
            let releaseFileContent = await fsExc.readFile(projNewVersionPath + '/resource/' + sheetUrl);

            let releaseFileObj = JSON.parse(releaseFileContent);
            releaseFileObj.file = addVersionToPath(releaseFileObj.file, fileContentVersion);
            releaseFileContent = JSON.stringify(releaseFileObj);
            await fsExc.writeFile(releasePath + '/resource/' + addVersionToPath(sheetUrl, newVersion), releaseFileContent);
        }

        let patchFileContent = await fsExc.readFile(projNewVersionPath + '/resource/' + sheetUrl);
        let patchFileObj = JSON.parse(patchFileContent);
        patchFileObj.file = addVersionToPath(patchFileObj.file, fileContentVersion);
        patchFileContent = JSON.stringify(patchFileObj);
        await fsExc.writeFile(patchPath + '/resource/' + addVersionToPath(sheetUrl, newVersion), patchFileContent);
    }
}

/** 拷贝压缩图片 */
export async function copyPictures() {
    let projNewVersionPath = Global.projPath + releaseSuffix + ModelMgr.version.newVersion;
    await clearResource(projNewVersionPath);
    await copyResource(projNewVersionPath);
}

/** 清空resource */
export async function clearResource(releasePath) {
    let assetsPath = releasePath + assets_suffix_path;
    let asyncPath = releasePath + async_suffix_path;
    let indiePath = releasePath + indie_suffix_path;
    let externalPath = releasePath + external_suffix_path;
    try {
        for (const iterator of assetSfxValues) {
            switch (iterator) {
                case assetsSfx:
                    await fsExc.delFiles(assetsPath);
                    break;
                case asyncSfx:
                    await fsExc.delFiles(asyncPath);
                    break;
                case indieSfx:
                    await fsExc.delFiles(indiePath);
                    break;
                case externalSfx:
                    await fsExc.delFiles(externalPath);
                    break;
            }
        }
    } catch (error) {
        Global.snack('清空resource文件失败', error);
    }
}

/** 拷贝resource */
export async function copyResource(releasePath) {
    let compressAssetsPath = Global.compressResourcePath + '/' + assetsSfx;
    let compressAsyncPath = Global.compressResourcePath + '/' + asyncSfx;
    let compressIndiePath = Global.compressResourcePath + '/' + indieSfx;
    let compressExternalPath = Global.compressResourcePath + '/' + externalSfx;

    let assetsPath = releasePath + assets_suffix_path;
    let asyncPath = releasePath + async_suffix_path;
    let indiePath = releasePath + indie_suffix_path;
    let externalPath = releasePath + external_suffix_path;
    try {
        for (const iterator of assetSfxValues) {
            switch (iterator) {
                case assetsSfx:
                    await fsExc.makeDir(assetsPath);
                    await fsExc.copyFile(compressAssetsPath, assetsPath, true);
                    break;
                case asyncSfx:
                    await fsExc.makeDir(asyncPath);
                    await fsExc.copyFile(compressAsyncPath, asyncPath, true);
                    break;
                case indieSfx:
                    await fsExc.makeDir(indiePath);
                    await fsExc.copyFile(compressIndiePath, indiePath, true);
                    break;
                case externalSfx:
                    await fsExc.makeDir(externalPath);
                    await fsExc.copyFile(compressExternalPath, externalPath, true);
                    break;
            }
        }

        Global.toast('拷贝压缩文件成功');
    } catch (error) {
        Global.snack('拷贝压缩文件错误', error);
    }
}

/** 拷贝nativeIndex文件 */
export async function writeNativeIndexToPath(egretIndexPath) {
    let releaseVersion = ModelMgr.versionModel.releaseVersion;
    let indexPath = Global.rawResourcePath + "/nativeIndex.html";
    let environ = ModelMgr.versionModel.curEnviron;
    let indexContent = await fsExc.readFile(indexPath);
    let policyNum = ModelMgr.versionModel.policyNum;
    indexContent = indexContent.replace(`let curPolicyVersion = "";`, `let curPolicyVersion = "${policyNum}";`);
    indexContent = indexContent.replace(`let patchVersion = "";`, `let patchVersion = "${releaseVersion}";`);
    indexContent = indexContent.replace(`let evnName = "";`, `let evnName = "${ModelMgr.versionModel.curEnviron.name}";`);
    if (ModelMgr.versionModel.curEnviron.name == ModelMgr.versionModel.eEnviron.release) {
        indexContent = indexContent.replace(`let patchUrl = "";`, `let patchUrl = "${environ.host}${environ.cdnWinPatchPath}";`);
        indexContent = indexContent.replace(`let policyUrl = "";`, `let policyUrl = "${environ.host}/";`);
    } else {
        indexContent = indexContent.replace(`let patchUrl = "";`, `let patchUrl = "${environ.host}${environ.scpWinPatchPath}";`);
        indexContent = indexContent.replace(`let policyUrl = "";`, `let policyUrl = "${environ.host}${environ.scpPath}";`);
    }
    await fsExc.writeFile(egretIndexPath + "/index.html", indexContent);
}

/** 更新服务器包 */
export async function updateServerPackage() {
    let environ = ModelMgr.versionModel.curEnviron;
    let serverPackage = `${Global.svnPath}/server/native_${environ.name}`;
    await spawnExc.svnUpdate(serverPackage, "", "更新服务器包错误");
}

/** 清理游戏包目录 */
export async function clearPackageDir() {
    console.log(`清空游戏包目录`)
    let clientPackagePath = `${Global.pcProjectPath}/package/client`;
    if (await fsExc.exists(clientPackagePath)) {
        await fsExc.delFiles(clientPackagePath);
    }

    let serverPackagePath = `${Global.pcProjectPath}/package/server`;
    if (await fsExc.exists(serverPackagePath)) {
        await fsExc.delFiles(serverPackagePath);
    }
}

/** 比较服务端包版本 */
export function mergeServerPackage() {
    return new Promise(async (resolve, reject) => {
        let environ = ModelMgr.versionModel.curEnviron;
        let serverPackage = `${Global.svnPath}/server/native_${environ.name}`;

        let packageDir = await fsExc.readDir(serverPackage);
        await checkUploadServerPackages(packageDir, () => {
            console.log(`比较服务器包并上传完毕`);
            resolve();
        })
    });
}

/** 上传客户端包 */
export async function uploadClientPackage() {
    return new Promise(async (resolve, reject) => {
        let policyInfo = await ModelMgr.versionModel.getCurPolicyInfo();
        let data = JSON.parse(policyInfo);
        console.log(`start zip`);
        if (data.Code != 0) {
            console.log(`policy num is null`);
            console.log(data.Message);
            reject();
            return;
        }

        let policyNum = data.Data.Version;
        let environ = ModelMgr.versionModel.curEnviron;
        let gameVersion = await ModelMgr.versionModel.getGameVersion(environ, policyNum);
        let releaseName = `release_v${gameVersion}s`;
        let zipPath = `${Global.svnPublishPath}${environ.zipPath}/${releaseName}.zip`;

        await zipClientPackage(environ, policyNum, releaseName, zipPath);

        let fileKey = `${releaseName}.zip`
        //cdn上传路径写为ready,因为ready和release用的是同一个包
        CdnUtil.checkUploaderFile(zipPath, fileKey, `clientPackages/ready`, () => {
            console.log(`${environ.name}上传${fileKey}完毕,版本号:${gameVersion}`);
            resolve();
        });
    })
}

function zipClientPackage(environ, policyNum, releaseName, zipPath) {
    return new Promise(async (resolve, reject) => {
        let releasePath = `${Global.svnPublishPath}${environ.localPath}/${releaseName}/`;

        //判断policy文件
        let policyPath = `${Global.svnPublishPath}${environ.localPolicyPath}/policyFile_v${policyNum}.json`
        if (!(await fsExc.exists(policyPath))) {
            console.log(`本地不存在最新策略文件:${policyPath}`);
            return;
        }

        let indexPath = Global.rawResourcePath + "/nativeIndex.html";
        let policyData = fs.readFileSync(policyPath);
        let indexData = fs.readFileSync(indexPath);
        let output = fs.createWriteStream(zipPath);
        let archive = archiver("zip");
        archive.pipe(output);
        archive.directory(releasePath, ``);
        archive.append(policyData, {
            name: "policyFile.json"
        });
        archive.append(indexData, {
            name: "index.html"
        });

        archive.on("error", (err) => {
            console.error(`压缩${zipPath}失败`, err);
            reject();
        });
        output.on("close", () => {
            console.log(`压缩${zipPath}成功`);
            resolve();
        });

        archive.finalize();
    });
}

async function checkUploadServerPackages(packageDir, successFunc) {
    if (packageDir.length === 0) {
        successFunc();
        return;
    }

    let iterator = packageDir.pop();
    if (iterator.indexOf(".zip") === -1) {
        await checkUploadServerPackages(packageDir, successFunc);
        return;
    }

    let environ = ModelMgr.versionModel.curEnviron;
    let fileName = iterator.slice(0, iterator.indexOf("."));

    let policyNum = await ExternalUtil.getServerPackagePolicyNum(environ.name, fileName);

    // await ExternalUtil.applyServerPackagePolicyNum(0, environ.name, fileName);
    // await checkUploadServerPackages(packageDir, successFunc);
    // return;

    let newServerPackagePath = `${Global.svnPath}/server/native_${environ.name}/${iterator}`;
    let curServerPackagePath = `${Global.svnPublishPath}${environ.serverPackagePath}/${iterator}`;
    let newPolicyNum;

    //直接拷贝
    if (policyNum === 0) {
        newPolicyNum = 1;
        console.log(`服务器版本不存在,用最新的包`);
    } else {
        //比较版本,不相等
        console.log(`开始检比服务器包${fileName}`);
        let fileExist = await fsExc.exists(curServerPackagePath);
        if (fileExist) {
            let fileEqual = await fsExc.mergeFileByMd5(newServerPackagePath, curServerPackagePath);
            if (fileEqual) {
                console.log(`服务器包${fileName}版本相等,跳过`);
                await checkUploadServerPackages(packageDir, successFunc);
                return;
            }
        }

        console.log(`服务器包版本不相等,用最新的包`);
        newPolicyNum = policyNum + 1;
    }

    await fsExc.copyFile(newServerPackagePath, `${Global.svnPublishPath}${environ.serverPackagePath}`);

    let fileKey = `${fileName}_v${newPolicyNum}.zip`;
    console.log(`${environ.name} 开始上传 ${fileKey}`);
    CdnUtil.checkUploaderFile(curServerPackagePath, fileKey, `serverPackages/${environ.name}`, async () => {
        await ExternalUtil.applyServerPackagePolicyNum(newPolicyNum, environ.name, fileName);
        console.log(`${environ.name}上传${fileKey}完毕,版本号:${newPolicyNum}`);
        await checkUploadServerPackages(packageDir, successFunc);
    });
}

// /** 拷贝服务器包到native文件夹 */
// export async function copyServerPackageToNative() {
//     console.log(`拷贝服务器包到native文件夹`);
//     let pcPackagePath = `${Global.pcProjectPath}/package`;
//     let pcServerPackageFilePath = `${pcPackagePath}/server.zip`;
//     let svnServerPackagePath = `${Global.svnPath}/server/native/server.zip`;

//     //拷贝egret游戏资源包
//     await fsExc.copyFile(svnServerPackagePath, pcPackagePath, true);
//     fsExc.unzipFile(`${pcServerPackageFilePath}`, pcPackagePath);
//     fsExc.delFile(pcServerPackageFilePath);

//     console.log(`拷贝服务器包完毕`);
// }

// /** 拷贝客户端包到native文件夹 */
// export async function copyClientPackageToNative() {
//     return new Promise(async (resolve, reject) => {
//         console.log(`拷贝客户端包到native文件夹`);
//         let pcClientPath = `${Global.pcProjectPath}/package/client`;

//         let policyInfo = await ModelMgr.versionModel.getCurPolicyInfo();
//         let data = JSON.parse(policyInfo);
//         if (data.Code != 0) {
//             console.log(data.Message);
//             return;
//         }

//         let policyNum = data.Data.Version;
//         let environ = ModelMgr.versionModel.curEnviron;
//         let gameVersion = await ModelMgr.versionModel.getGameVersion(environ, policyNum);

//         // let releaseVersion = ModelMgr.versionModel.releaseVersion;
//         let releasePath = `${Global.svnPublishPath}${environ.localPath}/release_v${gameVersion}s`;
//         // let policyNum = ModelMgr.versionModel.policyNum;

//         //删除egret文件夹
//         await fsExc.delFiles(pcClientPath);

//         if (!(await fsExc.exists(releasePath))) {
//             console.log(`本地不存在最新版本:${releasePath}`);
//             reject();
//             return;
//         }

//         //拷贝egret游戏资源包
//         await fsExc.copyFile(releasePath, pcClientPath, true);

//         //写index.html文件
//         await writeNativeIndexToPath(pcClientPath);
//         let policyPath = `${Global.svnPublishPath}${environ.localPolicyPath}/policyFile_v${policyNum}.json`
//         if (!(await fsExc.exists(policyPath))) {
//             console.log(`本地不存在最新策略文件:${policyPath}`);
//             reject();
//             return;
//         }
//         await fsExc.copyFile(policyPath, pcClientPath);
//         await fsExc.rename(pcClientPath + `/policyFile_v${policyNum}.json`, pcClientPath + `/policyFile.json`)
//         console.log(`拷贝客户端包完毕`);
//         resolve();
//     });
// }

/** 写入版本信息 */
export async function writeVersionInfo() {
    //设置globalConfig信息
    let nativeConfigContent = await fsExc.readFile(Global.nativeConfigPath);
    let curEnviron = ModelMgr.versionModel.curEnviron;
    let nativeConfig = JSON.parse(nativeConfigContent);
    nativeConfig.environName = curEnviron.name;
    if (curEnviron.name == ModelMgr.versionModel.eEnviron.release) {
        nativeConfig.patchUrl = `${curEnviron.host}/${curEnviron.cdnWinPatchPath}`;
        nativeConfig.policyUrl = `${curEnviron.host}/`;
    } else {
        nativeConfig.patchUrl = `${curEnviron.host}${curEnviron.scpWinPatchPath}`;
        nativeConfig.policyUrl = `${curEnviron.host}${curEnviron.scpPath}`;
    }

    nativeConfigContent = JSON.stringify(nativeConfig, null, 4);
    await fsExc.writeFile(Global.nativeConfigPath, nativeConfigContent);

    //写入native版本号
    let nativePackageContent = await fsExc.readFile(Global.nativePackagePath);
    let nativePackageObj = JSON.parse(nativePackageContent);
    nativePackageObj.version = ModelMgr.versionModel.nativeVersion;
    nativePackageContent = JSON.stringify(nativePackageObj, null, 4);
    await fsExc.writeFile(Global.nativePackagePath, nativePackageContent);
}

/** 发布window版本 */
export async function publishWin() {
    let cmdStr = "yarn build:win";
    console.log(`开始打包windows包`);
    await spawnExc.runCmd(cmdStr, Global.pcProjectPath, null, "打包window包错误");
    console.log(`打包windows成功`);
}

/** 发布mac版本 */
export async function publishMac() {
    let cmdStr = "yarn build:mac";
    console.log(`开始打包mac包`);
    await spawnExc.runCmd(cmdStr, Global.pcProjectPath, null, "打包mac包错误");
    console.log(`打包mac成功`);
}