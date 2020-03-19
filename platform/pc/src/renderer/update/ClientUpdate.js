/**
 * @author 雪糕 
 * @desc 游戏客户端包更新类
 * @date 2020-02-13 14:56:09 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-20 04:22:07
 */

import * as loading from '../loading.js';
import * as logger from '../logger.js';
import { Config } from '../Config.js';
import * as util from '../util.js';
import { StreamDownload } from './StreamDownload.js';

const fs = require('fs');
const admzip = require("adm-zip");

export class ClientUpdate {
    /** 补丁包目录 */
    patchUrl = "";
    /** 是否一次性下载 */
    allInOne = false;
    /** 本地初始的游戏版本 */
    startVersion = 0;
    /** 当前下载的游戏版本 */
    curVersion = 0;
    /** 最新游戏版本 */
    gameVersion = 0;
    /** 客户端包路径 */
    clientPackagePath = Config.clientPackagePath;
    /** 补丁包数量 */
    patchCount = 0;
    /** 下载器 */
    download = new StreamDownload();

    /** 更新后回调 */
    updateCallback;
    /** 更新后回调参数 */
    updateCbArgs;

    /** 策略文件host */
    policyHost = "";

    /** 策略文件相对host路径 */
    policyPath = "";

    /** 检查是否最新版本 */
    async checkLatestVersion() {
        //从客户端index文件中获取当前游戏版本号
        let globalConfig = Config.globalConfig;
        this.curVersion = this.startVersion = +globalConfig.gameVersion;
        this.patchUrl = `${Config.protocol}//${globalConfig.patchUrl}`;
        let policyUrl = globalConfig.policyUrl;
        this.policyHost = policyUrl.split("/")[0];
        this.policyPath = policyUrl.replace(this.policyHost, "");

        let policyNum = await this.getCurPolicyNum();
        if (policyNum === null) {
            let content = `获取策略版本号错误!, environName:${Config.environName}`;
            logger.error(`renderer`, content);
            alert(content);
            return true;
        }

        try {
            let gameVersion = await util.getGameVersion(this.policyHost, this.policyPath, policyNum);
            this.gameVersion = +gameVersion;
            return this.curVersion === this.gameVersion;
        } catch (error) {
            let content = "获取游戏版本号错误!";
            logger.error(`renderer`, content);
            alert(content);
            return true;
        }
    }

    /** 获取当前策略版本 */
    getCurPolicyNum() {
        return new Promise(async (resolve, reject) => {
            try {
                let responseText = await util.getPolicyInfo(Config.environName);
                let data = JSON.parse(responseText);
                let policyNum = data.Data.Version;
                logger.log(`renderer`, `策略版本号:${policyNum}`);
                resolve(policyNum);
            } catch (error) {
                let content = `获取策略版本号错误!, environName:${Config.environName}`;
                logger.error(`renderer`, content);
                resolve(null);
            }
        });
    }

    /** 直接下载最新版本 */
    async directDownload(updateCallback, ...updateCbArgs) {
        try {
            this.updateCallback = updateCallback;
            this.updateCbArgs = updateCbArgs;

            loading.showLoading();
            this.downloadPackage();
        } catch (error) {
            throw error;
        }
    }

    /** 检查更新 */
    async checkUpdate(updateCallback, ...updateCbArgs) {
        try {
            this.updateCallback = updateCallback;
            this.updateCbArgs = updateCbArgs;
            let isLatestVersion;
            if (this.gameVersion) {
                isLatestVersion = this.curVersion === this.gameVersion;
            } else {
                isLatestVersion = await this.checkLatestVersion();
            }

            if (isLatestVersion) {
                logger.log(`update`, `检测到客户端版本一致,跳过更新`);
                this.executeUpdateCallback();
                return;
            }

            logger.log(`update`, `检测到客户端版本不一致,开始更新`);
            this.patchCount = this.gameVersion - this.startVersion;
            this.installSinglePatch();
        } catch (error) {
            throw error;
        }
    }

    /** 下载文件回调 */
    async downloadFileCallback(arg, filename, percentage) {
        if (arg === "progress") {
            // 显示进度
            if (this.allInOne) {
                loading.setLoadingProgress(percentage);
            } else {
                let each = 100 / this.patchCount;
                loading.setLoadingProgress(percentage / 100 * each + (this.curVersion - this.startVersion) * each);
            }
        }
        else if (arg === "finished") {
            // 通知完成
            let content = `开始解压文件:${filename}`;
            logger.log('update', content);
            try {
                let zip = new admzip(this.clientPackagePath + filename);
                zip.extractAllTo(this.clientPackagePath, true);
                let content = `解压文件:${filename}成功`;
                logger.log('update', content);
                Config.setGlobalConfigValue("gameVersion", this.curVersion);
            } catch (error) {
                let content = `解压文件:${filename}错误`
                logger.error(`update`, content, error);
                alert(content);
                this.executeUpdateCallback();
            }
            fs.unlink(this.clientPackagePath + filename, (err) => {
                if (err) {
                    throw err;
                }
                logger.log(`update`, '文件:' + filename + '删除成功！');

                if (this.curVersion < this.gameVersion) {
                    this.curVersion = this.curVersion + 1;
                }
                if (this.curVersion >= this.gameVersion) {
                    Config.setGlobalConfigValue("gameVersion", this.curVersion);
                    this.executeUpdateCallback();
                } else {
                    this.installSinglePatch()
                }
            });
        } else if (arg == "404") {
            let content = `下载文件:${filename}错误, 文件不存在!`;
            logger.error(`update`, content);
            alert(content);

            //一次性下载不到，就一个一个来
            if (this.allInOne) {
                this.installSinglePatch();
            } else {
                this.executeUpdateCallback();
            }
        }
    }

    // /** 下载所有补丁包 */
    // installAllPatch() {
    //     this.allInOne = true;
    //     loading.showLoading();
    //     this.download.downloadFile(this.patchUrl, this.clientPackagePath, `patch_v${this.startVersion}s_v${this.gameVersion}s.zip`, this.downloadFileCallback.bind(this));
    //     this.curVersion = this.gameVersion;
    // }

    /** 下载单个补丁包 */
    installSinglePatch() {
        try {
            loading.showLoading();
            this.download.downloadFile(this.patchUrl, this.clientPackagePath, `patch_v${this.curVersion}s_v${this.curVersion + 1}s.zip`, this.downloadFileCallback.bind(this));
        } catch (error) {
            throw error;
        }
    }


    /** 下载服务端包 */
    async downloadPackage() {
        await this.checkLatestVersion();
        this.patchCount = 1;
        //release环境, 用的ready的包, 去ready下载
        let environName = Config.environName;
        if (environName === Config.eEnvironName.release) {
            environName = Config.eEnvironName.ready;
        }

        let fileDir = `${Config.cdnHost}/clientPackages/${environName}`;
        let saveDir = this.clientPackagePath;
        let fileName = `release_v${this.gameVersion}s.zip`;
        //下载文件
        this.download.downloadFile(fileDir, saveDir, fileName, this.downloadFileCallback.bind(this));
    }

    /** 执行更新后回调 */
    executeUpdateCallback() {
        loading.hideLoading();
        if (this.updateCallback) {
            this.updateCallback(...this.updateCbArgs);
        }
    }
}