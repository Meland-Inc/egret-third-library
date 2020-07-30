import * as crypto from 'crypto';
import * as http from 'http';
import { Global } from './Global';
import * as fsExc from './FsExecute';
import * as scp2 from 'scp2';
import * as archiver from "archiver";
import * as fs from 'fs';
import { Client } from "ssh2";
import * as url from 'url';
import { ModelMgr } from "./model/ModelMgr";
import * as qiniu from "qiniu";
import * as ExternalUtil from "./ExternalUtil";
import * as spawnExc from "./SpawnExecute.js";
import * as CdnUtil from "./CdnUtil.js";

export const serverList = [
    { name: "long", host: "47.107.73.43", user: "ftpadmin", password: "unclemiao", path: "/web/feature/long" },
    { name: "icecream", host: "47.107.73.43", user: "ftpadmin", password: "unclemiao", path: "/web/feature/icecream" },
    { name: "release", host: "47.107.73.43", user: "ftpadmin", password: "unclemiao", path: "/web/web/release" },
    { name: "develop", host: "47.107.73.43", user: "ftpadmin", password: "unclemiao", path: "/web/web/develop" },
];

// export const versionTypes = ['强制更新', '选择更新', '静态更新'];

// var versionType;
// export function getVersionType() { return versionType; }
// export function setVersionType(value) { versionType = value; }

// var displayVersion;
// export function getDisplayVersion() { return displayVersion; }
// export function setDisplayVersion(value) { displayVersion = value; }

// var needPatch;
// export function setNeedPatch(value) { needPatch = value; }

// var channel;
// export function getChannel() { return channel; }
// export function setChannel(value) { channel = value; }

// var serverInfo;
// export function getServerInfo() { return serverInfo; }
// export function setServerInfo(value) { serverInfo = value; }

// var uploadVersion;
// export function getUploadVersion() { return uploadVersion; }
// export function setUploadVersion(value) { uploadVersion = value; }

// var policyNum;
// export function getPolicyNum() { return policyNum; }
// export function setPolicyNum(value) { policyNum = value; }

// var whiteVersion;
// export function getWhiteVersion() { return whiteVersion; }
// export function setWhiteVersion(value) { whiteVersion = value; }

// var normalVersion;
// export function getNormalVersion() { return normalVersion; }
// export function setNormalVersion(value) { normalVersion = value; }

function getPatchName() {
    return `patch_v${ModelMgr.versionModel.oldVersion}s_v${ModelMgr.versionModel.newVersion}s.zip`;
}

export async function zipVersion() {
    let environ = ModelMgr.versionModel.curEnviron;
    let zipPath = `${Global.svnPublishPath}${environ.zipPath}/`;
    await fsExc.makeDir(zipPath);
    let filePath;
    let zipName;
    if (environ.name === ModelMgr.versionModel.eEnviron.alpha) {
        filePath = `${Global.releasePath}/${ModelMgr.versionModel.releaseVersion}/`;
        zipName = "release.zip";
    } else {
        filePath = `${Global.svnPublishPath}${environ.localPath}/${ModelMgr.versionModel.uploadVersion}/`;
        zipName = ModelMgr.versionModel.needPatch ? getPatchName() : "release.zip";
    }

    try {
        await zipProject(filePath, zipPath, zipName);
    } catch (error) {
        Global.snack(`压缩zip失败`, err);
    }
}

export async function copyVersion() {
    const readyEnviron = ModelMgr.versionModel.environList.find(value => value.name === ModelMgr.versionModel.eEnviron.ready);
    const releaseEnviron = ModelMgr.versionModel.environList.find(value => value.name === ModelMgr.versionModel.eEnviron.release);
    const readyGameVersion = await ModelMgr.versionModel.getEnvironGameVersion(ModelMgr.versionModel.eEnviron.ready);
    const readyFilePath = `${Global.svnPublishPath}${readyEnviron.localPath}/release_v${readyGameVersion}s/`;
    const releaseFilePath = `${Global.svnPublishPath}${releaseEnviron.localPath}/release_v${readyGameVersion}s/`;
    const readyExists = await fsExc.exists(readyFilePath);
    if (!readyExists) {
        Global.snack(`本地不存在ready版本 path:${readyFilePath}`);
        return;
    }

    const exists = await fsExc.exists(releaseFilePath);
    if (exists) {
        await fsExc.delFolder(releaseFilePath);
    }

    await fsExc.copyFile(readyFilePath, releaseFilePath, true);

    let indexPath = `${releaseFilePath}/index_v${readyGameVersion}.html`;
    let indexContent = await fsExc.readFile(indexPath);
    indexContent = indexContent.replace(`window.environName="ready"`, `window.environName="release"`);
    await fsExc.writeFile(indexPath, indexContent);

    await ModelMgr.versionModel.initVersionList();

    Global.toast('拷贝版本成功');
}

export async function uploadVersionFile() {
    let curEnviron = ModelMgr.versionModel.curEnviron;
    if (curEnviron.scpEnable) {
        await uploadScpVersionFile();
        if (curEnviron.scpPatchPath) {
            let zipName = ModelMgr.versionModel.needPatch ? getPatchName() : "release.zip";
            await uploadScpNativeZip(curEnviron.scpPatchPath, zipName);
        }
    }

    if (curEnviron.cdnEnable) {
        await uploadCdnVersionFile();
        if (curEnviron.cdnPatchEnable && curEnviron.cdnWinPatchPath) {
            await uploadCdnPatchZip(curEnviron.cdnWinPatchPath);
        }
        if (curEnviron.cdnPatchEnable && curEnviron.cdnMacPatchPath) {
            await uploadCdnPatchZip(curEnviron.cdnMacPatchPath);
        }
    }
}

export async function uploadMangleMapFile() {
    let curEnviron = ModelMgr.versionModel.curEnviron;
    if (curEnviron.scpEnable) {
        if (curEnviron.mangleMapScpPath) {
            await uploadScpMangleMap();
        }
    }
}

export function uploadCdnVersionFile() {
    return new Promise(async (resolve, reject) => {
        await ModelMgr.ftpModel.initQiniuOption();
        if (ModelMgr.versionModel.curEnviron.scpEnable && ModelMgr.versionModel.curEnviron.cdnEnable) {
            let patchPath = `${Global.svnPublishPath}${ModelMgr.versionModel.curEnviron.localPath}/${ModelMgr.versionModel.uploadVersion}/`;
            await uploadCdnSingleVersionFile(patchPath, ModelMgr.versionModel.curEnviron.cdnRoot);
            resolve();
            return;
        }

        let releaseGameVersion = await ModelMgr.versionModel.getEnvironGameVersion(ModelMgr.versionModel.eEnviron.release);
        let readyGameVersion = await ModelMgr.versionModel.getEnvironGameVersion(ModelMgr.versionModel.eEnviron.ready);
        if (releaseGameVersion === readyGameVersion) {
            resolve();
            return;
        }

        let releaseEnviron = ModelMgr.versionModel.environList.find(value => value.name === ModelMgr.versionModel.eEnviron.release);
        let readyEnviron = ModelMgr.versionModel.environList.find(value => value.name === ModelMgr.versionModel.eEnviron.ready);
        let readyPath = `${Global.svnPublishPath}${readyEnviron.localPath}`;
        let curGameVersion = releaseGameVersion;
        let hasPatch = false;
        for (let i = +releaseGameVersion + 1; i <= readyGameVersion; i++) {
            let patchVersion = `patch_v${curGameVersion}s-v${i}s`;
            let patchPath = `${readyPath}/${patchVersion}/`;
            let patchExist = await fsExc.exists(patchPath);
            if (!patchExist) {
                continue;
            }

            hasPatch = true;
            await uploadCdnSingleVersionFile(patchPath, releaseEnviron.cdnRoot);
            curGameVersion = i;
        }

        //没有patch包,传整包
        if (!hasPatch) {
            let releasePath = `${readyPath}/release_v${readyGameVersion}s`;
            await uploadCdnSingleVersionFile(releasePath, releaseEnviron.cdnRoot);
        }
        resolve();
    });
}

async function uploadCdnSingleVersionFile(patchPath, cdnRoot) {
    return new Promise(async (resolve, reject) => {
        let releaseUploadCount = 0;
        let filePathArr = [];
        await CdnUtil.createUploaderFilePathArr(patchPath, filePathArr);
        CdnUtil.checkUploaderFiles(patchPath, filePathArr, cdnRoot, releaseUploadCount, resolve, reject);
    });
}

async function uploadScpVersionFile() {
    let environ = ModelMgr.versionModel.curEnviron;
    let zipPath = `${Global.svnPublishPath}${environ.zipPath}/`;
    let zipName;
    if (environ.name === ModelMgr.versionModel.eEnviron.alpha) {
        zipName = "release.zip";
    } else {
        zipName = ModelMgr.versionModel.needPatch ? getPatchName() : "release.zip";
    }

    let webZipPath = zipPath + zipName;
    let isExists = await fsExc.exists(webZipPath);

    if (!isExists) {
        Global.snack(`不存在文件${webZipPath}`);
        return;
    }
    await scpFile(webZipPath);
    await unzipProject(environ.scpRootPath + environ.scpPath, zipName);
}

export async function createPolicyFile() {
    if (!ModelMgr.versionModel.channel) {
        Global.snack(`请先选择渠道号`);
        return;
    }

    let indexPath = `${Global.projPath}/rawResource/index.html`;
    let indexContent = await fsExc.readFile(indexPath);
    indexContent = indexContent.replace(`let versionName = "release";`, `let versionName = "${ModelMgr.versionModel.curEnviron.name}";`);
    indexContent = indexContent.replace(`let channel = "bian_game";`, `let channel = "${ModelMgr.versionModel.channel}";`);

    let rawPolicyPath = `${Global.projPath}/rawResource/policyFile.json`;
    let policyContent = await fsExc.readFile(rawPolicyPath);
    let policyObj = JSON.parse(policyContent);
    // if (!ModelMgr.versionModel.curEnviron.cdnEnable) {
    policyObj.cdnUrl = ``;
    // }
    policyContent = JSON.stringify(policyObj);

    let policyPath = `${Global.svnPublishPath}${ModelMgr.versionModel.curEnviron.localPolicyPath}/`;
    await fsExc.makeDir(policyPath);
    let indexFilePath = `${policyPath}/index.html`;
    let policyFilePath = `${policyPath}/policyFile.json`;

    try {
        await fsExc.delFiles(policyPath);
        await fsExc.writeFile(indexFilePath, indexContent);
        await fsExc.writeFile(policyFilePath, policyContent);
        Global.toast('生成策略文件成功');
    } catch (error) {
        Global.snack('生成策略文件错误', error);
    }
}

export async function modifyPolicyFile() {
    if (!ModelMgr.versionModel.policyNum) {
        Global.snack(`请先设置策略版本`);
        return;
    }

    let policyPath = `${Global.svnPublishPath}${ModelMgr.versionModel.curEnviron.localPolicyPath}/policyFile.json`;
    let content = await fsExc.readFile(policyPath);
    await fsExc.delFile(policyPath);

    let policyObj = JSON.parse(content);
    policyObj["whiteVersion"] = ModelMgr.versionModel.whiteVersion;
    policyObj["normalVersion"] = ModelMgr.versionModel.normalVersion;
    policyObj["channel"] = ModelMgr.versionModel.channel;
    policyObj["displayVersion"] = ModelMgr.versionModel.displayVersion;
    policyObj["versionType"] = ModelMgr.versionModel.versionTypes.indexOf(ModelMgr.versionModel.versionType);
    policyObj["environName"] = ModelMgr.versionModel.curEnviron.name;
    content = JSON.stringify(policyObj);

    let newPolicyPath = `${Global.svnPublishPath}${ModelMgr.versionModel.curEnviron.localPolicyPath}/policyFile_v${ModelMgr.versionModel.policyNum}.json`;
    await fsExc.writeFile(newPolicyPath, content);

    Global.toast('修改策略文件成功');
}

export async function uploadPolicyFile() {
    if (ModelMgr.versionModel.curEnviron.scpEnable) {
        await uploadScpPolicyFile();
    }

    if (ModelMgr.versionModel.curEnviron.cdnEnable) {
        await uploadCdnPolicyFile();
    }
}

export function uploadCdnPolicyFile() {
    return new Promise(async (resolve, reject) => {
        if (!ModelMgr.ftpModel.uploadToken) {
            await ModelMgr.ftpModel.initQiniuOption();
        }

        let uploadCount = 0;
        let policyPath = `${Global.svnPublishPath}${ModelMgr.versionModel.curEnviron.localPolicyPath}/`;
        let policyFilePathArr = [];
        let files = await fsExc.readDir(policyPath);
        for (const iterator of files) {
            if (iterator === "index.html" || iterator.indexOf("policyFile") != -1) {
                let fullPath = `${policyPath}/${iterator}`;
                policyFilePathArr.push(fullPath);
            }
        }

        await CdnUtil.checkUploaderFiles(policyPath, policyFilePathArr, ModelMgr.versionModel.curEnviron.cdnRoot, uploadCount, resolve, reject);
    });
}

async function uploadScpPolicyFile() {
    let policyPath = `${Global.svnPublishPath}${ModelMgr.versionModel.curEnviron.localPolicyPath}/`;

    let files = await fsExc.readDir(policyPath);
    for (const iterator of files) {
        if (iterator === "index.html"
            || iterator.indexOf("policyFile") != -1) {
            await scpFile(`${policyPath}/${iterator}`);
        }
    }

    Global.toast('上传策略文件成功');
}

async function scpFile(path, host, user, password, targetPath) {
    return new Promise((resolve, reject) => {
        let client = new scp2.Client();
        let total;
        let uploaded;
        client.on("transfer", (tBuffer, tUploaded, tTotal) => {
            uploaded = tUploaded;
            total = tTotal;
            console.log(`scp --> ${path} --> ${uploaded}/${total}`);
        });

        let environ = ModelMgr.versionModel.curEnviron;

        scp2.scp(
            path,
            {
                host: host || environ.host,
                user: user || environ.user,
                password: password || environ.password,
                path: targetPath || (environ.scpRootPath + environ.scpPath)
            },
            client
            , (err) => {
                //最终上传完毕后,把已上传的数量+1
                uploaded++;
                if (err || (uploaded !== total)) {
                    reject();
                    Global.snack(`上传错误, uploaded:${uploaded} total:${total}`, err);
                } else {
                    resolve();
                    Global.toast("上传完毕");
                }
            }
        );
    });
}

/** 上传Native用的游戏压缩包 */
async function uploadScpNativeZip(scpNativeZipPath, zipName) {
    let environ = ModelMgr.versionModel.curEnviron;
    let zipPath = `${Global.svnPublishPath}${environ.zipPath}/`;
    let webZipPath = zipPath + zipName;
    let isExists = await fsExc.exists(webZipPath);

    if (!isExists) {
        Global.snack(`不存在文件${webZipPath}`);
        return;
    }
    await scpFile(webZipPath, environ.patchHost, environ.patchUser, environ.patchPassword, scpNativeZipPath);
}

/** 上传mangleMap.json文件 */
async function uploadScpMangleMap() {
    let environ = ModelMgr.versionModel.curEnviron;
    let jsonPath = `${Global.projPath}/bin-release/web/${ModelMgr.versionModel.newVersion}/mangleMap.json`;
    let targetPath = `${environ.scpRootPath}${environ.mangleMapScpPath}/mangleMap_v${ModelMgr.versionModel.newVersion}s.json`;

    let isExists = await fsExc.exists(jsonPath);
    if (!isExists) {
        console.log(`暂无文件:${jsonPath}`);
        return;
    }
    await scpFile(jsonPath, environ.host, environ.user, environ.password, targetPath);
}

async function uploadCdnPatchZip(cdnPatchPath) {
    return new Promise(async (resolve, reject) => {
        if (!cdnPatchPath) {
            reject();
            console.log("没有配置补丁zip cdn上传路径");
        }
        await ModelMgr.ftpModel.initQiniuOption();
        let releaseEnviron = ModelMgr.versionModel.environList.find(value => value.name === ModelMgr.versionModel.eEnviron.release);
        let readyEnviron = ModelMgr.versionModel.environList.find(value => value.name === ModelMgr.versionModel.eEnviron.ready);
        let readyPath = `${Global.svnPublishPath}${readyEnviron.zipPath}`;
        let patchPath = `${readyPath}/${getPatchName()}`;
        let patchExist = await fsExc.exists(patchPath);
        if (patchExist) {
            let fileKey = `${cdnPatchPath}/${getPatchName()}`;
            CdnUtil.checkUploaderFile(patchPath, fileKey, releaseEnviron.cdnRoot, resolve);
            // let formUploader = new qiniu.form_up.FormUploader(ModelMgr.ftpModel.qiniuConfig);
            // let uploadToken = ModelMgr.ftpModel.uploadToken;
            // let readerStream = fs.createReadStream(patchPath);
            // let putExtra = new qiniu.form_up.PutExtra();
            // formUploader.putStream(uploadToken, fileKey, readerStream, putExtra, (rspErr, rspBody, rspInfo) => {
            //     if (rspErr) {
            //         //单个文件失败
            //         console.error(rspErr);
            //         console.error(`cdn --> upload ${fileKey} error`);
            //         reject();
            //         return;
            //     }

            //     //200:成功 614:文件重复
            //     if (rspInfo.statusCode != 200 && rspInfo.statusCode != 614) {
            //         console.log(rspInfo.statusCode);
            //         console.log(rspBody);
            //         reject();
            //         return;
            //     }

            //     console.log(`cdn --> upload ${fileKey} success`);
            //     resolve();
            // });
        }

        resolve();
    });
}

function zipProject(fromPath, toPath, zipName) {
    return new Promise((resolve, reject) => {
        let output = fs.createWriteStream(toPath + zipName);
        let archive = archiver("zip");
        archive.pipe(output);
        archive.directory(fromPath, ``);

        archive.on("error", (err) => {
            // Global.snack(`压缩zip:${zipName}失败`, err);
            console.error(`压缩fromPath:${fromPath} toPath:${toPath} zipName:${zipName}失败`, err);
            reject();
        });
        output.on("close", () => {
            // Global.toast(`压缩zip${zipName}成功`);
            console.log(`压缩fromPath:${fromPath} toPath:${toPath} zipName:${zipName}成功`);
            resolve();
        });

        archive.finalize()
    })
}

function unzipProject(filePath, fileName) {
    return new Promise((resolve, reject) => {
        let client = new Client();
        let environ = ModelMgr.versionModel.curEnviron;

        client
            .on("ready", () => {
                console.log("Client :: ready");
                let unzipWeb =
                    "cd " +
                    filePath +
                    "\n" +
                    "unzip -o " +
                    fileName;

                console.log("cmd --> " + unzipWeb);

                client.exec(
                    unzipWeb,
                    { cwd: filePath },
                    (err, stream) => {
                        if (err) throw err;
                        stream
                            .on("close", (code, signal) => {
                                client.end();
                                if (code != 0) {
                                    reject();
                                    console.log("解压zip失败", code);
                                    return;
                                }

                                console.log("解压zip成功");
                                resolve();
                            })
                            .on("data", (data) => {
                                // console.log("STDOUT: " + data);
                            })
                            .stderr.on("data", (data) => {
                                console.log("STDERR: " + data);
                            });
                    }
                );
            })
            .connect({
                host: environ.host,
                user: environ.user,
                password: environ.password,
                path: environ.scpRootPath + environ.scpPath
            });
    })
}

export async function applyPolicyNum() {
    if (!ModelMgr.versionModel.policyNum) {
        Global.snack(`请先设置策略版本`);
        return;
    }

    try {
        await ExternalUtil.applyPolicyNum(ModelMgr.versionModel.policyNum, ModelMgr.versionModel.curEnviron.name, ModelMgr.versionModel.channel);
        Global.toast('应用策略版本成功');
    } catch (error) {
        Global.snack('应用策略版本错误', error);
    }
}

export async function applyLessonPolicyNum(isTest) {
    let lessonUrl = "http://api.bellplanet.bellcode.com";
    let parseUrl = url.parse(lessonUrl);
    let is_test = isTest ? "&is_test=1" : "";
    let getLessonData = `?policy_version=${ModelMgr.versionModel.lessonPolicyNum}${is_test}&description="aaa"`;
    let lessonOptions = {
        host: parseUrl.hostname, // 请求地址 域名，google.com等..
        // port: 80,
        path: '/bell-planet.change-policy-version' + getLessonData, // 具体路径eg:/upload
        method: 'GET', // 请求方式
        headers: { // 必选信息,  可以抓包工看一下
            'Authorization': 'Basic YmVsbGNvZGU6ZDNuSDh5ZERESw=='
        }
    };
    console.log(`--> applyLessonPolicy options:${JSON.stringify(lessonOptions)}`);
    http.get(lessonOptions, (response) => {
        let resData = "";
        response.on("data", (data) => {
            resData += data;
        });
        response.on("end", async () => {
            console.log(resData);
        });
        response.on("error", async (err) => {
            Global.snack(`应用平台版本号错误`, err);
        });
    });
}

export function checkPolicyNum() {
    return ExternalUtil.getPolicyInfo(ModelMgr.versionModel.curEnviron.name);
}

export async function commitGit() {
    if (ModelMgr.versionModel.curEnviron.pushGitEnable) {
        let commitCmdStr = `git commit -a -m "${ModelMgr.versionModel.publisher} 发布${ModelMgr.versionModel.curEnviron.name}版本 ${ModelMgr.versionModel.releaseVersion}"`;
        await spawnExc.runCmd(commitCmdStr, Global.projPath, null, '提交文件错误');
        console.log(`提交文件成功`);
    }

    if (ModelMgr.versionModel.curEnviron.gitTagEnable) {
        let commitCmdStr = `git tag version/release_v${ModelMgr.versionModel.releaseVersion}`;
        await spawnExc.runCmd(commitCmdStr, Global.projPath, null, 'git打tag错误');
        console.log(`git打tag成功`);
    }
}

export async function pushGit() {
    try {
        if (ModelMgr.versionModel.curEnviron.gitTagEnable) {
            let pullCmdStr = `git push origin --tags`;
            await spawnExc.runCmd(pullCmdStr, Global.projPath, null, 'git推送tag错误');
            console.log(`git推送tag成功`);
        }

        let pullCmdStr = `git pull`;
        await spawnExc.runCmd(pullCmdStr, Global.projPath, null, '拉取分支错误');
        console.log(`拉取分支成功`);

        let pushCmdStr = `git push`;
        await spawnExc.runCmd(pushCmdStr, Global.projPath, null, '推送分支错误');
        console.log(`推送分支成功`);

        Global.toast('推送git成功');
    } catch (error) {
        Global.snack('推送git错误', error);
    }
}

export async function zipUploadGame() {
    // let filePath = `${Global.svnPublishPath}${environ.localPath}/${ModelMgr.versionModel.uploadVersion}/`;
    // let zipName = "release.zip";

    // try {
    //     await zipProject(filePath, zipPath, zipName);
    // } catch (error) {
    //     Global.snack('推送git错误', error);
    // }
}

// export async function copyPackageToSvn() {
//     console.log(`拷贝native包到svn文件夹`);
//     let environ = ModelMgr.versionModel.curEnviron;
//     let releaseVersion = ModelMgr.versionModel.releaseVersion;
//     let exeOriginName = "bellplanet Setup 1.0.0.exe"
//     let exePath = `${Global.pcProjectPath}/dist/${exeOriginName}`;
//     let exeTargetPath = `${Global.svnPublishPath}/native`;
//     let exeNewName = `bellplanet_${environ.name}_${releaseVersion}.exe`;
//     await fsExc.copyFile(exePath, exeTargetPath);
//     await fsExc.rename(`${exeTargetPath}/${exeOriginName}`, `${exeTargetPath}/${exeNewName}`);

//     let dmgOriginName = "bellplanet-1.0.0.dmg";
//     let dmgPath = `${Global.pcProjectPath}/dist/${dmgOriginName}`;
//     let dmgTargetPath = `${Global.svnPublishPath}/native/`;
//     let dmgNewName = `bellplanet_${environ.name}_${releaseVersion}.dmg`;
//     await fsExc.copyFile(dmgPath, dmgTargetPath)
//     await fsExc.rename(`${dmgTargetPath}/${dmgOriginName}`, `${dmgTargetPath}/${dmgNewName}`);
//     console.log(`拷贝完毕`);
// }

export async function uploadNativeExe() {
    let environName = ModelMgr.versionModel.curEnviron.name;
    let newNativePolicyNum = getNewNativePolicyNum();
    let nativeVersion = ModelMgr.versionModel.nativeVersion;
    let pkgName = `bellplanet Setup ${nativeVersion}.exe`
    let pkgPath = `${Global.pcProjectPath}/app/${pkgName}`;

    console.log("开始exe包上传");
    let platform = "win";
    let cdnRoot = `native/${environName}/${newNativePolicyNum}/${platform}`;
    await tryUploadNativePkg(pkgPath, pkgName, cdnRoot);

    let ymlName = `latest.yml`;
    let ymlPath = `${Global.pcProjectPath}/app/${ymlName}`;
    await tryUploadNativePkg(ymlPath, ymlName, cdnRoot);

    let policyObj = {
        nativeVersion: nativeVersion,
        nativePolicyNum: newNativePolicyNum,
        trunkName: environName,
        platform: platform
    }
    let policyName = "policyFile.json"
    let policyPath = `${Global.pcProjectPath}/app/${policyName}`;
    await fsExc.writeFile(policyPath, JSON.stringify(policyObj));
    await tryUploadNativePkg(policyPath, policyName, cdnRoot);
    console.log("上传exe包完毕");
}

export async function uploadNativeDmg() {
    let environName = ModelMgr.versionModel.curEnviron.name;
    let newNativePolicyNum = getNewNativePolicyNum();
    let nativeVersion = ModelMgr.versionModel.nativeVersion;
    let pkgName = `bellplanet-${nativeVersion}.dmg`;
    let pkgPath = `${Global.pcProjectPath}/app/${pkgName}`;

    console.log("开始mac包上传");
    let platform = "mac";
    let cdnRoot = `native/${environName}/${newNativePolicyNum}/${platform}`
    await tryUploadNativePkg(pkgPath, pkgName, cdnRoot);

    let pkgZipName = `bellplanet-${nativeVersion}-mac.zip`;
    let pkgZipPath = `${Global.pcProjectPath}/app/${pkgName}`;
    await tryUploadNativePkg(pkgZipPath, pkgZipName, cdnRoot);

    let ymlName = `latest-mac.yml`;
    let ymlPath = `${Global.pcProjectPath}/app/${ymlName}`;
    await tryUploadNativePkg(ymlPath, ymlName, cdnRoot);

    let policyObj = {
        nativeVersion: nativeVersion,
        nativePolicyNum: newNativePolicyNum,
        trunkName: environName,
        platform: platform
    }
    let policyName = "policyFile.json"
    let policyPath = `${Global.pcProjectPath}/app/${policyName}`;
    await fsExc.writeFile(policyPath, JSON.stringify(policyObj));
    await tryUploadNativePkg(policyPath, policyName, cdnRoot);

    console.log("上传mac包完毕");
}

function tryUploadNativePkg(pkgPath, pkgName, cdnRoot) {
    return new Promise((resolve, reject) => {
        console.log(`尝试上传${pkgName}文件`);
        CdnUtil.uploaderFile(pkgPath, pkgName, cdnRoot, () => {
            console.log(`上传${pkgName}成功`)
            resolve();
        }, (reason) => {
            console.log(`上传${pkgName}失败: ${reason}, 5秒后重试`)
            setTimeout(tryUploadNativePkg, 5000, pkgPath, pkgName, cdnRoot);
        });
    })
}

export async function applyNativePolicyNum() {
    let newNativePolicyNum = getNewNativePolicyNum();
    let environName = ModelMgr.versionModel.curEnviron.name;
    await ExternalUtil.applyNativePolicyNum(newNativePolicyNum, environName);

    let commitCmdStr = `git commit -a -m "${ModelMgr.versionModel.publisher} 发布${ModelMgr.versionModel.curEnviron.name} native包 策略版本号:${newNativePolicyNum}"`;
    await spawnExc.runCmd(commitCmdStr, Global.clientPath, null, '提交文件错误');
    console.log(`提交文件成功`);

    let pushCmdStr = `git push`;
    await spawnExc.runCmd(pushCmdStr, Global.clientPath, null, '推送分支错误');

    ModelMgr.versionModel.originNativeVersion = ModelMgr.versionModel.nativeVersion;
}

function getNewNativePolicyNum() {
    return ModelMgr.versionModel.nativePolicyNum + 1;
}

/** 上传客户端包 */
export async function uploadClientPackage() {
    return new Promise(async (resolve, reject) => {
        // let policyInfo = await ModelMgr.versionModel.getCurPolicyInfo();
        // let data = JSON.parse(policyInfo);
        // console.log(`start zip`);
        // if (data.Code != 0) {
        //     console.log(`policy num is null`);
        //     console.log(data.Message);
        //     reject();
        //     return;
        // }

        let policyNum = ModelMgr.versionModel.policyNum;
        let environ = ModelMgr.versionModel.curEnviron;
        let gameVersion = ModelMgr.versionModel.releaseVersion;
        //当前环境为release时,上传最新的ready版本客户端整包
        if (environ.name === ModelMgr.versionModel.eEnviron.release) {
            gameVersion = await ModelMgr.versionModel.getEnvironGameVersion(ModelMgr.versionModel.eEnviron.ready);
        }
        console.log("上传的gameVersion: ", gameVersion);

        let releaseName = `release_v${gameVersion}s`;
        let zipPath = `${Global.svnPublishPath}${environ.zipPath}/${releaseName}.zip`;

        await zipClientPackage(environ, policyNum, releaseName, zipPath);

        let fileKey = `${releaseName}.zip`;
        if (environ.cdnEnable) {
            //cdn上传路径写为ready,因为ready和release用的是同一个包
            CdnUtil.checkUploaderFile(zipPath, fileKey, ModelMgr.versionModel.clientPackagePath, () => {
                console.log(`${environ.name}上传${fileKey}完毕,版本号:${gameVersion}`);
                resolve();
            });
        }

        if (environ.scpReleasePath) {
            await uploadScpNativeZip(environ.scpReleasePath, fileKey);
            resolve();
        }
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