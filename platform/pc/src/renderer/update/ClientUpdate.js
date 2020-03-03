/**
 * @author 雪糕 
 * @desc 游戏客户端包更新类
 * @date 2020-02-13 14:56:09 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-03 16:08:39
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

    /** 分支环境 */
    evnName;

    /** 策略文件host */
    policyHost = "";

    /** 策略文件相对host路径 */
    policyPath = "";

    /** 检查是否最新版本 */
    async checkLatestVersion() {
        let indexContent = await fs.readFileSync(`${Config.clientPackagePath}` + "index.html", "utf-8");
        let versionResult = indexContent.match(new RegExp(`let patchVersion = "([0-9]+)";`));
        this.curVersion = this.startVersion = +versionResult[1];

        //同样通过匹配获取当前环境
        let urlResult = indexContent.match(new RegExp(`let patchUrl = "([^\";]*)";`));
        this.patchUrl = `${Config.protocol}//${urlResult[1]}`;

        let evnResult = indexContent.match(new RegExp(`let evnName = "([^\";]*)";`));
        this.evnName = evnResult[1];

        let policyUrlResult = indexContent.match(new RegExp(`let policyUrl = "([^\";]*)";`));
        let policyUrl = policyUrlResult[1];
        this.policyHost = policyUrlResult[1].split("/")[0];
        this.policyPath = policyUrlResult[1].replace(this.policyHost, this.policyPath);
        logger.log(`renderer`, "native curVersion : ", this.curVersion, this.policyHost, this.policyPath, this.evnName, policyUrl);
        let policyNum = await this.getCurPolicyNum();
        if (policyNum === null) {
            let content = "获取策略版本号错误!";
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
                let responseText = await util.getPolicyInfo(this.evnName);
                let data = JSON.parse(responseText);
                let policyNum = data.Data.Version;
                logger.log(`renderer`, `策略版本号:${policyNum}`);
                resolve(policyNum);
            } catch (error) {
                let content = "获取策略版本号错误!";
                logger.error(`renderer`, content);
                resolve(null);
            }
        });
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
                this.executeUpdateCallback();
                return;
            }

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
            try {
                let zip = new admzip(this.clientPackagePath + filename);
                zip.extractAllTo(this.clientPackagePath, true);
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
            });
            let indexContent = await fs.readFileSync(this.clientPackagePath + "index.html").toString();
            let matchResult = indexContent.match(new RegExp(`let patchVersion = "([0-9]+)";`));
            this.curVersion = +matchResult[1];
            if (this.curVersion >= this.gameVersion) {
                this.executeUpdateCallback();
            } else {
                this.installSinglePatch()
            }

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

    /** 下载所有补丁包 */
    installAllPatch() {
        this.allInOne = true;
        loading.showLoading();
        this.download.downloadFile(this.patchUrl, this.clientPackagePath, `patch_v${this.startVersion}s_v${this.gameVersion}s.zip`, this.downloadFileCallback.bind(this));
        this.curVersion = this.gameVersion;
    }

    /** 下载单个补丁包 */
    installSinglePatch() {
        try {
            loading.showLoading();
            this.download.downloadFile(this.patchUrl, this.clientPackagePath, `patch_v${this.curVersion}s_v${this.curVersion + 1}s.zip`, this.downloadFileCallback.bind(this));
        } catch (error) {
            throw error;
        }
    }

    /** 执行更新后回调 */
    executeUpdateCallback() {
        loading.hideLoading();
        if (this.updateCallback) {
            this.updateCallback(...this.updateCbArgs);
        }
    }
}