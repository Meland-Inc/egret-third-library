/**
 * @author 雪糕 
 * @desc 游戏服务器端包更新类
 * @date 2020-02-13 14:56:09 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-22 01:28:35
 */
import fs from 'fs';
import admzip from "adm-zip";

import { define } from '../define';
import * as loading from '../loading';
import * as logger from '../logger';
import * as util from '../util';
import config from '../Config';
import StreamDownload from './StreamDownload';

export default class ServerUpdate {
    /** 服务端包存放目录 */
    serverPackagePath = config.serverPackagePath;
    /** 下载器 */
    download = new StreamDownload();

    /** 更新后回调 */
    updateCallback;
    /** 更新后回调参数 */
    updateCbArgs;

    /** 分支环境 */
    environName;

    /** 本地版本 */
    localVersion;

    /** 远程版本 */
    remoteVersion;

    initVersionInfo() {
        this.environName = config.environName;
    }

    /** 检查是否最新版本 */
    async checkLatestVersion() {
        this.initVersionInfo();

        //获取本地游戏版本
        this.localVersion = await config.getGlobalConfigValue("serverPackageVersion");

        this.remoteVersion = await util.getServerPackagePolicyNum(this.environName);
        return this.remoteVersion === this.localVersion;
    }

    /** 检查更新 */
    async checkUpdate(updateCallback, ...updateCbArgs) {
        this.updateCallback = updateCallback;
        this.updateCbArgs = updateCbArgs;
        let isLatestVersion;
        if (this.remoteVersion) {
            isLatestVersion = this.localVersion === this.remoteVersion;
        } else {
            isLatestVersion = await this.checkLatestVersion();
        }

        if (isLatestVersion) {
            logger.log(`update`, `检测到服务端版本一致,跳过更新`);
            this.executeUpdateCallback();
            return;
        }

        logger.log(`update`, `检测到服务器版本更新,开始更新版本${this.remoteVersion}`);
        //更新
        loading.showLoading();
        let deleteDir = `${this.serverPackagePath}server`;
        //清除要保存的文件夹
        await util.deleteFolderRecursive(deleteDir);

        this.downloadPackage()
    }

    /** 下载服务端包 */
    downloadPackage() {
        //release环境, 用的ready的包, 去ready下载
        let environName: define.eEnvironName;
        if (environName === define.eEnvironName.release) {
            environName = define.eEnvironName.ready;
        }
        let fileDir = `${config.cdnHost}/serverPackages/${environName}`;
        let saveDir = this.serverPackagePath;
        let fileName = `${util.getServerPackageFileName()}_v${this.remoteVersion}.zip`;
        //下载文件
        loading.showLoading();
        this.download.downloadFile(fileDir, saveDir, fileName, async (arg, filename, percentage, errorMsg) => {
            if (arg === "finished") {
                config.setGlobalConfigValue("serverPackageVersion", this.remoteVersion);
            }
            this.downloadFileCallback(fileDir, saveDir, arg, filename, percentage, errorMsg);
        });
    }

    /** 下载文件回调 */
    async downloadFileCallback(fileDir, saveDir, result, filename, percentage, errorMsg) {
        if (result === "progress") {
            // 显示进度
            loading.setLoadingProgress(percentage);
            return;
        }

        if (result === "finished") {
            logger.log(`update`, `下载文件:${filename}完毕`);
            // 通知完成
            try {
                let zip = new admzip(this.serverPackagePath + filename);
                zip.extractAllTo(this.serverPackagePath, true);
            } catch (error) {
                let content = `解压文件:${filename}错误,开始重新下载`;
                logger.error(`update`, content, error);

                this.downloadPackage();
            }
            fs.unlink(this.serverPackagePath + filename, (err) => {
                if (err) {
                    throw err;
                }
                logger.log(`update`, '文件:' + filename + '删除成功！');
            });
            this.executeUpdateCallback();
            return;
        }

        if (result == "404") {
            let content = `下载文件:${filename}错误, 文件不存在!`;
            logger.error(`update`, content);
            alert(content);

            this.executeUpdateCallback();
            return;
        }

        if (result == "error") {
            let content = `下载文件:${filename}出错, ${errorMsg}`;
            logger.error(`update`, content);
            alert(content);
            this.downloadPackage();
            return;
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