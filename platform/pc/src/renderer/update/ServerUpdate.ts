/**
 * @author 雪糕 
 * @desc 游戏服务器端包更新类
 * @date 2020-02-13 14:56:09 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-25 18:43:48
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
    private _packagePath: string = `${config.packagePath}/`;
    /** 下载器 */
    private _download: StreamDownload = new StreamDownload();

    /** 更新后回调 */
    private _updateCallback: Function;
    /** 更新后回调参数 */
    private _updateCbArgs: any;

    /** 分支环境 */
    private _environName: define.eEnvironName;

    /** 本地版本 */
    private _localVersion: number;

    /** 远程版本 */
    private _remoteVersion: number;

    private initVersionInfo() {
        this._environName = config.environName;
    }

    /** 检查是否最新版本 */
    public async checkLatestVersion() {
        this.initVersionInfo();

        //获取本地游戏版本
        this._localVersion = await config.getVersionConfigValue("serverPackageVersion");
        if (!this._localVersion) {
            this._localVersion = 0;
        }

        this._remoteVersion = await util.getServerPackagePolicyNum(this._environName);
        return this._remoteVersion === this._localVersion;
    }

    /** 检查更新 */
    public async checkUpdate(updateCallback: Function, ...updateCbArgs: any[]) {
        this._updateCallback = updateCallback;
        this._updateCbArgs = updateCbArgs;
        let isLatestVersion: boolean;
        if (this._remoteVersion) {
            isLatestVersion = this._localVersion === this._remoteVersion;
        } else {
            isLatestVersion = await this.checkLatestVersion();
        }

        if (isLatestVersion) {
            logger.log(`update`, `检测到服务端版本一致,跳过更新`);
            this.executeUpdateCallback();
            return;
        }

        logger.log(`update`, `检测到服务器版本更新,开始更新版本${this._remoteVersion}`);
        //更新
        loading.showLoading("正在更新服务端游戏包");
        let deleteDir = `${this._packagePath}server`;
        //清除要保存的文件夹
        await util.deleteFolderRecursive(deleteDir);

        this.downloadPackage()
    }

    /** 下载服务端包 */
    private downloadPackage() {
        //release环境, 用的ready的包, 去ready下载
        let fileDir = `${config.cdnHost}/serverPackages/${this._environName}`;
        let saveDir = this._packagePath;
        let fileName = `${util.getServerPackageFileName()}_v${this._remoteVersion}.zip`;
        this._download.downloadFile(fileDir, saveDir, fileName, this.downloadFileCallback.bind(this));
    }

    /** 下载文件回调 */
    private downloadFileCallback(result: string, filename: string, percentage: number, errorMsg: string) {
        if (result === "progress") {
            // 显示进度
            loading.setLoadingProgress(percentage);
            return;
        }

        if (result === "finished") {
            let content = `开始解压文件:${filename}`;
            logger.log(`update`, content);
            // 通知完成
            try {
                let zip = new admzip(this._packagePath + filename);
                zip.extractAllTo(this._packagePath, true);
                let content = `解压文件:${filename}成功`;
                logger.log('update', content);
                config.setVersionConfigValue("serverPackageVersion", this._remoteVersion);
            } catch (error) {
                let content = `解压文件:${filename}错误,开始重新下载`;
                logger.error(`update`, content, error);

                this.downloadPackage();
            }
            fs.unlink(this._packagePath + filename, (err) => {
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
    private executeUpdateCallback() {
        loading.hideLoading();
        if (this._updateCallback) {
            this._updateCallback(...this._updateCbArgs);
        }
    }
}