/**
 * @author 雪糕 
 * @desc 游戏服务器端包更新类
 * @date 2020-02-13 14:56:09 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-28 22:11:13
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

    /** 检查更新 */
    async checkUpdate(updateCallback, ...updateCbArgs) {
        try {
            this.updateCallback = updateCallback;
            this.updateCbArgs = updateCbArgs;

            //获取分支名称
            let indexContent = await fs.readFileSync(`${Config.clientPackagePath}` + "index.html", "utf-8");
            let evnResult = indexContent.match(new RegExp(`let evnName = "([^\";]*)";`));
            this.evnName = evnResult[1];

            //获取本地游戏版本
            let configContent = await fs.readFileSync(Config.globalConfigPath, "utf-8");
            let globalConfig = JSON.parse(configContent);
            let localVersion = globalConfig.serverPackageVersion;

            let newVersion = await util.getServerPackagePolicyNum(this.evnName);
            if (newVersion != localVersion) {
                logger.log(`update`, `检测到服务器版本更新,开始更新版本${newVersion}`)
                //更新
                loading.showLoading();
                let deleteDir = `${this.serverPackagePath}server`;
                //清除要保存的文件夹
                await util.deleteFolderRecursive(deleteDir);

                let fileDir = `${Config.cdnHost}/serverPackages/${this.evnName}`;
                let saveDir = this.serverPackagePath;
                let fileName = `${util.getServerPackageFileName()}_v${newVersion}.zip`;


                //下载文件
                this.download.downloadFile(fileDir, saveDir, fileName, async (arg, filename, percentage) => {
                    if (arg === "finished") {
                        globalConfig.serverPackageVersion = newVersion;
                        await fs.writeFileSync(Config.globalConfigPath, JSON.stringify(globalConfig), "utf-8");
                    }
                    this.downloadFileCallback(arg, filename, percentage);
                });
            } else {
                this.executeUpdateCallback();
            }
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