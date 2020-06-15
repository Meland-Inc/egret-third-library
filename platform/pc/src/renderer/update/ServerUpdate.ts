/** 
 * @Author 雪糕
 * @Description 游戏服务器端包更新类
 * @Date 2020-02-13 14:56:09
 * @FilePath \pc\src\renderer\update\ServerUpdate.ts
 */
import fs from 'fs';
import StreamZip from "node-stream-zip";

import { CommonDefine } from '../../common/CommonDefine';
import commonConfig from '../../common/CommonConfig';


import * as loading from '../loading';
import * as logger from '../logger';
import * as util from '../util';
import rendererModel from '../RendererModel';
import StreamDownload from './StreamDownload';

export default class ServerUpdate {
    /** 服务端包存放目录 */
    private _packagePath: string = `${commonConfig.serverPackagePath}/`;
    /** 下载器 */
    private _download: StreamDownload = new StreamDownload();

    /** 更新后回调 */
    private _updateCallback: Function;
    /** 更新后回调参数 */
    private _updateCbArgs: any;

    /** 分支环境 */
    private _environName: CommonDefine.eEnvironName;

    /** 本地版本 */
    private _localVersion: number;

    /** 远程版本 */
    private _remoteVersion: number;

    private initVersionInfo() {
        this._environName = commonConfig.environName;
    }

    /** 检查是否最新版本 */
    public async checkLatestVersion() {
        this.initVersionInfo();

        //获取本地游戏版本
        this._localVersion = rendererModel.getPackageVersion(CommonDefine.ePackageType.server);
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
        loading.showLoading("正在更新服务端程序包");
        let deleteDir = this._packagePath;
        //清除要保存的文件夹

        await util.deleteFolderRecursive(deleteDir);
        this.downloadPackage()
    }

    /** 下载服务端包 */
    private downloadPackage() {
        //release环境, 用的ready的包, 去ready下载
        let fileDir = `${commonConfig.cdnHost}/serverPackages/${this._environName}`;
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
            // 通知完成
            loading.setLoadingProgress(0);
            loading.showLoading("正在解压游戏端程序包");
            loading.gradualProgress();
            let content = `开始解压文件:${filename}`;
            logger.log('update', content);
            const streamZip = new StreamZip({
                file: this._packagePath + filename,
                storeEntries: true
            });
            streamZip.on('ready', () => {
                streamZip.extract('server/', this._packagePath, (err: Error) => {
                    if (err) {
                        streamZip.close();

                        let content = `解压文件:${filename}错误,开始重新下载`;
                        logger.error(`update`, content, err);

                        this.downloadPackage();
                        return;
                    }
                    let content = `解压文件:${filename}成功`;
                    logger.log('update', content);
                    rendererModel.setPackageVersion(CommonDefine.ePackageType.server, commonConfig.environName, this._remoteVersion);
                    streamZip.close();

                    fs.unlink(this._packagePath + filename, (err) => {
                        if (err) {
                            throw err;
                        }
                        logger.log(`update`, '文件:' + filename + '删除成功！');
                    });
                    this.executeUpdateCallback();
                });
            });
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