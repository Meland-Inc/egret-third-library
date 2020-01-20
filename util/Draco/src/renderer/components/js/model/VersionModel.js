import { Global } from "../Global";
import * as fsExc from "../FsExecute";
import * as ExternalUtil from "../ExternalUtil";
import * as http from 'http';

export class VersionModel {
    eEnviron = {
        alpha: "alpha",
        beta: "beta",
        ready: "ready",
        release: "release"
    }

    environList = [
        {
            name: this.eEnviron.alpha, host: "47.107.73.43", user: "ftpadmin", password: "unclemiao",
            zipPath: "/alpha/zip", scpRootPath: "/web", scpPath: "/web/alpha", localPath: "/alpha/web", localPolicyPath: "/alpha/policy",
            updateGitEnable: false, gitBranch: "", trunkName: "alpha", cdnRoot: "",
            publishEnable: true, mergeVersionEnable: false, compressPicEnable: false, zipFileEnable: true, policyEnable: false, scpEnable: true, cdnEnable: false,
            pushGitEnable: false, publishDescEnable: true, codeVersionEnable: true, gitTagEnable: false, zipUploadGameEnable: false, nativeEnable: false
        },
        {
            name: this.eEnviron.beta, host: "47.107.73.43", user: "ftpadmin", password: "unclemiao",
            zipPath: "/beta/zip", scpRootPath: "/web", scpPath: "/web/beta", localPath: "/beta/web", localPolicyPath: "/beta/policy",
            updateGitEnable: true, gitBranch: "trunk/beta", trunkName: "beta", cdnRoot: "",
            scpWinPatchPath: "/native/win/beta/patch", scpMacPatchPath: "/native/mac/beta/patch",
            publishEnable: true, mergeVersionEnable: true, compressPicEnable: false, zipFileEnable: true, policyEnable: true, scpEnable: true, cdnEnable: false,
            pushGitEnable: true, publishDescEnable: false, codeVersionEnable: true, gitTagEnable: false, zipUploadGameEnable: false, nativeEnable: true
        },
        {
            name: this.eEnviron.ready, host: "47.107.73.43", user: "ftpadmin", password: "unclemiao",
            zipPath: "/ready/zip", scpRootPath: "/web", scpPath: "/web/ready", localPath: "/ready/web", localPolicyPath: "/ready/policy",
            updateGitEnable: true, gitBranch: "trunk/release", trunkName: "release", cdnRoot: "readyTest",
            scpWinPatchPath: "/native/win/release/patch", scpMacPatchPath: "/native/mac/release/patch",
            publishEnable: true, mergeVersionEnable: true, compressPicEnable: false, zipFileEnable: true, policyEnable: true, scpEnable: true, cdnEnable: true,
            pushGitEnable: true, publishDescEnable: false, codeVersionEnable: true, gitTagEnable: true, zipUploadGameEnable: false, nativeEnable: true
        },
        {
            name: this.eEnviron.release, host: "bg-stage.wkcoding.com", user: "ftpadmin", password: "unclemiao",
            zipPath: "/ready/zip", scpRootPath: "", scpPath: "", localPath: "/ready/web", localPolicyPath: "/release/policy",
            updateGitEnable: false, gitBranch: "", trunkName: "", cdnRoot: "",
            cdnWinPatchPath: "/win", cdnMacPatchPath: "/mac",
            publishEnable: false, mergeVersionEnable: true, compressPicEnable: false, zipFileEnable: false, policyEnable: true, scpEnable: false, cdnEnable: true,
            pushGitEnable: false, publishDescEnable: false, codeVersionEnable: false, gitTagEnable: false, zipUploadGameEnable: false, nativeEnable: false
        },
    ];


    channelList = [
        'shangwu',
        // 'bian_lesson',
        'bian_game'
    ];

    releaseSuffix = '/bin-release/web/';

    oldVersionList;
    releaseList;
    patchList;

    whiteList = [];
    policyObj;
    cdnUrl;

    //发布者
    publisher;
    //发布描述 只有alpha才有
    versionDesc;

    /** 当前发布环境 */
    curEnviron;

    //发布时是否要覆盖
    needCover = true;
    setNeedCover(value) {
        needCover = value;
    }

    //发布时是否要压缩图片资源    
    needCompress = false;
    setNeedCompress(value) {
        needCompress = value;
    }

    //发布的版本号
    releaseVersion;
    setReleaseVersion(value) {
        this.releaseVersion = value;
    }

    //比较时的旧版本号
    oldVersion;
    setOldVersion(value) {
        this.oldVersion = value;
    }

    //比较时的新版本号
    newVersion;
    setNewVersion(value) {
        this.newVersion = value;
    }

    //要上传的版本
    uploadVersion;
    setUploadVersion(value) {
        this.uploadVersion = value;
    }

    //是否上传的补丁包    
    needPatch = true;
    setNeedPatch(value) {
        this.needPatch = value;
    }

    //更新类型
    versionTypes = ['强制更新', '选择更新', '静态更新'];
    versionType;
    setVersionType(value) {
        this.versionType = value;
    }

    //显示版本号    
    displayVersion;
    setDisplayVersion(value) {
        this.displayVersion = value;
    }

    //策略号
    policyNum;
    setPolicyNum(value) {
        this.policyNum = value;
    }

    //白名单版本号
    whiteVersion;
    setWhiteVersion(value) {
        this.whiteVersion = value;
    }

    //常规游戏版本号
    normalVersion;
    setNormalVersion(value) {
        this.normalVersion = value;
    }

    //渠道号
    channel;
    setChannel(value) {
        this.channel = value;
    }

    //平台策略号
    lessonPolicyNum;
    setLessonPolicyNum(value) {
        this.lessonPolicyNum = value;
    }

    async init() {
        this.versionType = this.versionTypes[0];
        this.initEnviron();
        this.initChannel();
        await this.initVersionList();
        await this.initPolicyObj();
        await this.initReleaseVersion();
        await this.initPolicyNum();
    }

    initEnviron() {
        if (Global.mode.environNames.length > 0) {
            this.curEnviron = this.environList.find(value => value.name === Global.mode.environNames[0]);
        }
    }

    async initVersionList() {
        let localPath = Global.svnPublishPath + this.curEnviron.localPath;
        await fsExc.makeDir(localPath);

        let cdnDir = await fsExc.readDir(localPath);

        this.oldVersionList = [];
        this.releaseList = [];
        this.patchList = [];
        let reg = /[A-Za-z]_*/g;
        for (const iterator of cdnDir) {
            if (iterator.indexOf("release") != -1) {
                this.oldVersionList.push(iterator.replace(reg, ""));
            }

            if (iterator.indexOf("release") != -1) {
                this.releaseList.push(iterator);
            }

            if (iterator.indexOf("patch") != -1) {
                this.patchList.push(iterator);
            }
        }

        this.oldVersionList = this.oldVersionList.sort((a, b) => {
            return parseInt(a) - parseInt(b);
        });

        this.releaseList = this.releaseList.sort((a, b) => {
            return parseInt(a.replace(reg, "")) - parseInt(b.replace(reg, ""));
        });

        this.patchList = this.patchList.sort((a, b) => {
            return parseInt(a.replace(reg, "")) - parseInt(b.replace(reg, ""));
        });

        if (this.releaseList.length > 0) {
            let releaseInfo = this.releaseList[this.releaseList.length - 1];
            let versionInfo = releaseInfo.split("_v");
            this.whiteVersion = this.normalVersion = this.displayVersion = versionInfo[
                versionInfo.length - 1
            ].replace(reg, "");
        }
    }

    async initPolicyObj() {
        let content = await fsExc.readFile(
            Global.rawResourcePath + "/policyFile.json"
        );
        this.policyObj = JSON.parse(content);
        this.cdnUrl = this.policyObj.cdnUrl;
        this.whiteList = this.policyObj.whiteList;
    }

    async initReleaseVersion() {
        return new Promise(async (resolve, reject) => {
            if (!this.curEnviron.mergeVersionEnable) {
                this.releaseVersion = "alpha";
                resolve();
                return;
            }
            let value = await ExternalUtil.getPolicyInfo(this.curEnviron.name, "bian_game");
            let data = JSON.parse(value);
            if (data.Code != 0) {
                resolve();
                return;
            }
            let policyNum = +data.Data.Version;
            this.getGameVersion(this.curEnviron, policyNum,
                async (gameVersion) => {
                    this.releaseVersion = parseInt(gameVersion) + 1;

                    let oldVersionPath = `${Global.svnPublishPath}${this.curEnviron.localPath}/release_v${gameVersion}s`;
                    let exist = await fsExc.exists(oldVersionPath);
                    if (exist) {
                        this.oldVersion = gameVersion;
                    }
                    resolve();
                },
                () => {
                    resolve();
                })

            // let options = {
            //     host: '47.107.73.43', // 请求地址 域名，google.com等..
            //     // port: 10001,
            //     path: `${this.curEnviron.scpPath}/policyFile_v${policyNum}.json`, // 具体路径eg:/upload
            //     method: 'GET', // 请求方式, 这里以post为例
            //     headers: { // 必选信息,  可以抓包工看一下
            //         'Content-Type': 'application/json'
            //     }
            // };
            // http.get(options, (response) => {
            //     if (response.statusCode != 200) {
            //         resolve();
            //         return;
            //     }

            //     let resData = "";
            //     response.on("data", (data) => {
            //         resData += data;
            //     });
            //     response.on("end", async () => {
            //         // console.log(resData);

            //         let obj = JSON.parse(resData);
            //         this.releaseVersion = parseInt(obj.normalVersion) + 1;

            //         let oldVersionPath = `${Global.svnPublishPath}${this.curEnviron.localPath}/release_v${obj.normalVersion}s`;
            //         let exist = await fsExc.exists(oldVersionPath);
            //         if (exist) {
            //             this.oldVersion = obj.normalVersion;
            //         }
            //         resolve();
            //     });
            // })
        });
    }

    getGameVersion(environ, policyNum, successFunc, errorFunc) {
        let options = {
            host: environ.host, // 请求地址 域名，google.com等.. 
            // port: 10001,
            path: `${environ.scpPath}/policyFile_v${policyNum}.json`, // 具体路径eg:/upload
            method: 'GET', // 请求方式, 这里以post为例
            headers: { // 必选信息,  可以抓包工看一下
                'Content-Type': 'application/json'
            }
        };
        http.get(options, (response) => {
            if (response.statusCode != 200) {
                if (errorFunc) {
                    errorFunc();
                }
                return;
            }

            let resData = "";
            response.on("data", (data) => {
                resData += data;
            });
            response.on("end", async () => {
                // console.log(resData);
                let obj = JSON.parse(resData);

                successFunc(obj.normalVersion);
            });
        })
    }

    async initPolicyNum() {
        let value = await this.getCurPolicyInfo();
        let data = JSON.parse(value);
        if (data.Code == 0) {
            this.policyNum = +data.Data.Version + 1;
        } else {
            this.policyNum = 1;
        }
    }

    initChannel() {
        this.channel = this.channelList[this.channelList.length - 1];
    }

    setCurEnviron(value) {
        this.curEnviron = value;
    }

    async setCdnUrl(value) {
        this.policyObj.cdnUrl = value;
        await this.savePolicyObj();
    }

    async setWhiteList(value) {
        this.policyObj.whiteList = value;
        await this.savePolicyObj();
    }

    async savePolicyObj() {
        await fsExc.writeFile(
            Global.rawResourcePath + "/policyFile.json",
            JSON.stringify(this.policyObj)
        );
    }

    async getCurPolicyInfo() {
        return await ExternalUtil.getPolicyInfo(this.curEnviron.name);
    }

    async getEnvironGameVersion(environName = this.curEnviron.name) {
        return new Promise(async (resolve, reject) => {
            let value = await ExternalUtil.getPolicyInfo(environName);
            let environ = this.environList.find(value => value.name === environName);
            let data = JSON.parse(value);
            if (data.Code == 0) {
                let policyNum = data.Data.Version;
                this.getGameVersion(environ, policyNum, gameVersion => {
                    resolve(gameVersion);
                });
            } else {
                reject();
                Global.snack(`获取游戏版本失败`, null, false);
            }
        })
    }
}