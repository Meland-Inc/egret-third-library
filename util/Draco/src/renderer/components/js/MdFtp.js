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
        zipName = ModelMgr.versionModel.needPatch ? "patch.zip" : "release.zip";
    }

    try {
        await zipProject(filePath, zipPath, zipName);
    } catch (error) {
        Global.snack(`压缩zip失败`, err);
    }
}

export async function uploadVersionFile() {
    if (ModelMgr.versionModel.curEnviron.scpEnable) {
        await uploadScpVersionFile();
    }

    if (ModelMgr.versionModel.curEnviron.cdnEnable) {
        await uploadCdnVersionFile();
    }
}

let maxUploadCount = 10;
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
        for (let i = +releaseGameVersion + 1; i <= readyGameVersion; i++) {
            let patchVersion = `patch_v${curGameVersion}s-v${i}s`;
            let patchPath = `${readyPath}/${patchVersion}/`;
            let patchExist = await fsExc.exists(patchPath);
            if (!patchExist) {
                continue;
            }

            await uploadCdnSingleVersionFile(patchPath, releaseEnviron.cdnRoot);
            curGameVersion = i;
        }

        resolve();
    });
}

async function uploadCdnSingleVersionFile(patchPath, cdnRoot) {
    return new Promise(async (resolve, reject) => {
        let releaseUploadCount = 0;
        let filePathArr = [];
        await batchUploaderFiles(patchPath, filePathArr);
        await checkUploaderFiles(patchPath, filePathArr, cdnRoot, releaseUploadCount, resolve, reject);
    });
}

async function batchUploaderFiles(rootPath, filePathArr) {
    let files = await fsExc.readDir(rootPath);
    for (const iterator of files) {
        let fullPath = `${rootPath}/${iterator}`;
        let isFolder = await fsExc.isDirectory(fullPath);
        if (isFolder) {
            await batchUploaderFiles(fullPath, filePathArr);
        } else {
            filePathArr.push(fullPath);
        }
    }
}

function checkUploaderFiles(rootPath, filePathArr, cdnRoot, uploadCount, resolve, reject) {
    if (uploadCount > maxUploadCount) return;
    if (filePathArr.length == 0) return;

    let filePath = filePathArr.shift();
    checkUploaderFile(rootPath, filePath, cdnRoot, uploadCount,
        () => {
            if (filePathArr.length != 0) {
                checkUploaderFiles(rootPath, filePathArr, cdnRoot, uploadCount, resolve, reject);
            } else {
                if (resolve) {
                    resolve();
                    console.log(`上传cdn完成`);
                }
            }
        });
}

function checkUploaderFile(rootPath, filePath, cdnRoot, uploadCount, successFunc) {
    uploadCount++;
    uploaderFile(rootPath, filePath, cdnRoot,
        () => {
            uploadCount--;
            successFunc();
        },
        () => {
            uploadCount--;
            checkUploaderFile(rootPath, filePath, cdnRoot, uploadCount, successFunc);
        });
}

function uploaderFile(rootPath, filePath, cdnRoot, successFunc, failFunc) {
    let formUploader = new qiniu.form_up.FormUploader(ModelMgr.ftpModel.qiniuConfig);
    let uploadToken = ModelMgr.ftpModel.uploadToken;
    let fileKey = filePath.split(`${rootPath}/`)[1];
    if (cdnRoot) {
        fileKey = `${cdnRoot}/${fileKey}`;
    }
    let readerStream = fs.createReadStream(filePath);
    let putExtra = new qiniu.form_up.PutExtra();

    formUploader.putStream(uploadToken, fileKey, readerStream, putExtra, (rspErr, rspBody, rspInfo) => {
        if (rspErr) {
            //单个文件失败
            console.error(rspErr);
            console.error(`cdn --> upload ${fileKey} error`);
            failFunc();
            return;
        }

        //200:成功 614:文件重复
        if (rspInfo.statusCode != 200 && rspInfo.statusCode != 614) {
            console.log(rspInfo.statusCode);
            console.log(rspBody);
            failFunc();
            return;
        }

        console.log(`cdn --> upload ${fileKey} success`);
        successFunc();
    });
}

async function uploadScpVersionFile() {
    let environ = ModelMgr.versionModel.curEnviron;
    let zipPath = `${Global.svnPublishPath}${environ.zipPath}/`;
    let zipName;
    if (environ.name === ModelMgr.versionModel.eEnviron.alpha) {
        zipName = "release.zip";
    } else {
        zipName = ModelMgr.versionModel.needPatch ? "patch.zip" : "release.zip";
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

        await checkUploaderFiles(policyPath, policyFilePathArr, ModelMgr.versionModel.curEnviron.cdnRoot, uploadCount, resolve, reject);
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

async function scpFile(path) {
    return new Promise((resolve, reject) => {
        let client = new scp2.Client();
        client.on("transfer", (buffer, uploaded, total) => {
            console.log(`scp --> ${path} --> ${uploaded + 1}/${total}`);
        });

        let environ = ModelMgr.versionModel.curEnviron;

        scp2.scp(
            path,
            {
                host: environ.host,
                user: environ.user,
                password: environ.password,
                path: environ.scpRootPath + environ.scpPath
            },
            client,
            (err) => {
                if (err) {
                    reject();
                    Global.snack("上传错误", err);
                } else {
                    resolve();
                }
            }
        );
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

export async function pushGit() {
    try {
        if (ModelMgr.versionModel.curEnviron.pushGitEnable) {
            let commitCmdStr = `git commit -a -m "${ModelMgr.versionModel.publisher} 发布${ModelMgr.versionModel.curEnviron.name}版本 ${ModelMgr.versionModel.releaseVersion}"`;
            await spawnExc.runCmd(commitCmdStr, Global.projPath, null, '提交文件错误');
        }

        if (ModelMgr.versionModel.curEnviron.gitTagEnable) {
            let commitCmdStr = `git tag version/release_v${ModelMgr.versionModel.releaseVersion}`;
            await spawnExc.runCmd(commitCmdStr, Global.projPath, `git打tag成功`, 'git打tag错误');
        }

        let pullCmdStr = `git pull`;
        await spawnExc.runCmd(pullCmdStr, Global.projPath, null, '拉取分支错误');

        let pushCmdStr = `git push`;
        await spawnExc.runCmd(pushCmdStr, Global.projPath, null, '推送分支错误');

        Global.toast('推送git成功');
    } catch (error) {
        Global.snack('推送git错误', error);
    }
}

// export async function gitTag() {
//     try {
//         //         git tag <tagName> //创建本地tag
//         // git push origin <tagName> //推送到远程仓库
// let commitCmdStr = `git tag version/release_v${ModelMgr.versionModel.releaseVersion}`;
// await spawnExc.runCmd(commitCmdStr, Global.projPath, null, 'git打tag错误');

//         let pullCmdStr = `git push origin version/release_v${ModelMgr.versionModel.releaseVersion}`;
//         await spawnExc.runCmd(pullCmdStr, Global.projPath, null, 'git推送tag错误');

//         Global.toast('推送git成功');
//     } catch (error) {
//         Global.snack('推送git错误', error);
//     }
// }

export async function zipUploadGame() {
    // let filePath = `${Global.svnPublishPath}${environ.localPath}/${ModelMgr.versionModel.uploadVersion}/`;
    // let zipName = "release.zip";

    // try {
    //     await zipProject(filePath, zipPath, zipName);
    // } catch (error) {
    //     Global.snack('推送git错误', error);
    // }
}