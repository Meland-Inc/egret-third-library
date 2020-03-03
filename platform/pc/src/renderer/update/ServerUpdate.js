/**
 * @author 雪糕 
 * @desc 游戏服务器端包更新类
 * @date 2020-02-13 14:56:09 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-03 16:43:35
 */

import * as loading from '../loading.js';
import * as logger from '../logger.js';
import { Config } from '../Config.js';
import * as util from '../util.js';
import { StreamDownload } from './StreamDownload.js';

const fs = require('fs');
const admzip = require("adm-zip");
const http = require("http");

export class ServerUpdate {
    /** 服务端包存放目录 */
    serverPackagePath = Config.serverPackagePath;
    /** 下载器 */
    download = new StreamDownload();

    /** 更新后回调 */
    updateCallback;
    /** 更新后回调参数 */
    updateCbArgs;

    /** 分支环境 */
    evnName;

    /** 本地版本 */
    localVersion;

    /** 远程版本 */
    remoteVersion;


    /** 检查是否最新版本 */
    async checkLatestVersion() {
        //获取分支名称
        let indexContent = await fs.readFileSync(`${Config.clientPackagePath}` + "index.html", "utf-8");
        let evnResult = indexContent.match(new RegExp(`let evnName = "([^\";]*)";`));
        this.evnName = evnResult[1];

        //获取本地游戏版本
        this.localVersion = await util.getGlobalConfigValue("serverPackageVersion");

        this.remoteVersion = await util.getServerPackagePolicyNum(this.evnName);
        return this.remoteVersion === this.localVersion;
    }

    /** 检查更新 */
    async checkUpdate(updateCallback, ...updateCbArgs) {
        try {
            this.updateCallback = updateCallback;
            this.updateCbArgs = updateCbArgs;
            let isLatestVersion;
            if (this.remoteVersion) {
                isLatestVersion = this.localVersion === this.remoteVersion;
            } else {
                isLatestVersion = await this.checkLatestVersion();
            }

            if (isLatestVersion) {
                this.executeUpdateCallback();
                return;
            }

            logger.log(`update`, `检测到服务器版本更新,开始更新版本${this.remoteVersion}`);
            //更新
            loading.showLoading();
            let deleteDir = `${this.serverPackagePath}server`;
            //清除要保存的文件夹
            await util.deleteFolderRecursive(deleteDir);

            let fileDir = `${Config.cdnHost}/serverPackages/${this.evnName}`;
            let saveDir = this.serverPackagePath;
            let fileName = `${util.getServerPackageFileName()}_v${this.remoteVersion}.zip`;

            //下载文件
            this.download.downloadFile(fileDir, saveDir, fileName, async (arg, filename, percentage) => {
                if (arg === "finished") {
                    util.setGlobalConfigValue("serverPackageVersion", this.remoteVersion);
                }
                this.downloadFileCallback(arg, filename, percentage);
            });
        } catch (error) {
            throw error;
        }
    }

    /** 下载文件回调 */
    async downloadFileCallback(arg, filename, percentage) {
        if (arg === "progress") {
            // 显示进度
            loading.setLoadingProgress(percentage);
        }
        else if (arg === "finished") {
            logger.log(`update`, `下载文件:${filename}完毕`);
            // 通知完成
            try {
                let zip = new admzip(this.serverPackagePath + filename);
                zip.extractAllTo(this.serverPackagePath, true);
            } catch (error) {
                let content = `解压文件:${filename}错误`
                logger.error(`update`, content, error);
                alert(content);
                this.executeUpdateCallback();
            }
            fs.unlink(this.serverPackagePath + filename, (err) => {
                if (err) {
                    throw err;
                }
                logger.log(`update`, '文件:' + filename + '删除成功！');
            });
            this.executeUpdateCallback();
        } else if (arg == "404") {
            let content = `下载文件:${filename}错误, 文件不存在!`;
            logger.error(`update`, content);
            alert(content);

            this.executeUpdateCallback();
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