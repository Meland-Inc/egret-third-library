/**
 * @author 雪糕 
 * @desc 游戏客户端包更新类
 * @date 2020-02-13 14:56:09 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-04-30 00:01:19
 */
import fs from 'fs';
import StreamZip from "node-stream-zip";

import { define } from '../define';
import * as loading from '../loading';
import * as logger from '../logger';
import * as util from '../util';
import config from '../Config';
import StreamDownload from './StreamDownload';


export default class ClientUpdate {
    /** 补丁包目录 */
    private _patchUrl: string = "";
    /** 是否一次性下载 */
    private _allInOne: boolean = false;
    /** 本地初始的游戏版本 */
    private _startVersion: number = 0;
    /** 当前下载的游戏版本 */
    private _curVersion: number = 0;
    /** 最新游戏版本 */
    private _gameVersion: number = 0;
    /** 客户端包路径 */
    private _clientPackagePath: string = `${config.clientPackagePath}/`;
    /** 补丁包数量 */
    private _patchCount: number = 0;
    /** 下载器 */
    private _download: StreamDownload = new StreamDownload();

    /** 更新后回调 */
    private _updateCallback: Function;
    /** 更新后回调参数 */
    private _updateCbArgs: any[];

    /** 策略文件host */
    private _policyHost: string = "";

    /** 策略文件相对host路径 */
    private _policyPath: string = "";

    /** 是否是下载整包 */
    private _isDownloadPackage: boolean;
    /** 检查是否最新版本 */
    public async checkLatestVersion() {
        let globalConfig = config.globalConfig;
        let gameVersion = config.getVersionConfigValue(define.eVersionCfgFiled.clientPackageVersion)
        if (!gameVersion) {
            gameVersion = 0;
        }

        this._curVersion = this._startVersion = +gameVersion;
        this._patchUrl = `${config.protocol}//${globalConfig.patchUrl}`;
        let policyUrl = globalConfig.policyUrl;
        let policyArr = policyUrl.split("/");
        this._policyHost = policyArr[0];
        if (!policyArr[1] || policyArr[1] === "") {
            this._policyPath = "";
        } else {
            this._policyPath = policyUrl.replace(`${this._policyHost}`, "");
        }

        let policyNum = await util.getClientPackagePolicyNum(config.environName);
        if (policyNum === null) {
            let content = `获取策略版本号错误!, environName:${config.environName}`;
            logger.error(`renderer`, content);
            alert(content);
            return true;
        }

        try {
            let gameVersion = await util.tryGetClientGameVersion(this._policyHost, this._policyPath, policyNum);
            this._gameVersion = +gameVersion;
            return this._curVersion === this._gameVersion;
        } catch (error) {
            let content = "获取客户端版本号错误!";
            logger.error(`renderer`, content);
            alert(content);
            return true;
        }
    }

    /** 直接下载最新版本 */
    public directDownload(updateCallback: Function, ...updateCbArgs: any[]) {
        try {
            this._updateCallback = updateCallback;
            this._updateCbArgs = updateCbArgs;

            loading.showLoading("正在下载客户端程序包");
            this.downloadPackage();
        } catch (error) {
            throw error;
        }
    }

    /** 检查更新 */
    async checkUpdate(updateCallback: Function, ...updateCbArgs: any[]) {
        try {
            this._updateCallback = updateCallback;
            this._updateCbArgs = updateCbArgs;
            let isLatestVersion: boolean;
            if (this._gameVersion) {
                isLatestVersion = this._curVersion === this._gameVersion;
            } else {
                isLatestVersion = await this.checkLatestVersion();
            }

            if (isLatestVersion) {
                logger.log(`update`, `检测到客户端版本一致,跳过更新`);
                this.executeUpdateCallback();
                return;
            }

            logger.log(`update`, `检测到客户端版本不一致,开始更新`);
            this._patchCount = this._gameVersion - this._startVersion;
            this.installSinglePatch();
        } catch (error) {
            throw error;
        }
    }

    /** 下载文件回调 */
    private downloadFileCallback(arg: string, filename: string, percentage: number) {
        if (arg === "progress") {
            // 显示进度
            if (this._allInOne) {
                loading.setLoadingProgress(percentage);
            } else {
                let each = 100 / this._patchCount;
                loading.setLoadingProgress(percentage / 100 * each + (this._curVersion - this._startVersion) * each);
            }
            return;
        }

        if (arg === "finished") {
            // 通知完成
            if (this._isDownloadPackage) {
                loading.setLoadingProgress(0);
                loading.showLoading("正在解压客户端程序包");
                loading.gradualProgress();
            }
            let content = `开始解压文件:${filename}`;
            logger.log('update', content);
            const streamZip = new StreamZip({
                file: this._clientPackagePath + filename,
                storeEntries: true
            });
            streamZip.on('ready', () => {
                streamZip.extract(null, this._clientPackagePath, (err: Error) => {
                    if (err) {
                        streamZip.close();

                        let content = `解压文件:${filename}错误`
                        logger.error(`update`, content, err);
                        alert(content);
                        this.executeUpdateCallback();
                        return;
                    }
                    let content = `解压文件:${filename}成功`;
                    logger.log('update', content);
                    streamZip.close();

                    fs.unlink(this._clientPackagePath + filename, (err) => {
                        if (err) {
                            let content = `删除文件:${filename}错误`
                            logger.error(`update`, content, err);
                        } else {
                            logger.log(`update`, '文件:' + filename + '删除成功！');
                        }

                        //如果是下载整包状态,直接赋值当前版本为最新游戏版本
                        if (this._isDownloadPackage) {
                            this._isDownloadPackage = false;
                            this._curVersion = this._gameVersion;
                        }

                        if (this._curVersion < this._gameVersion) {
                            this._curVersion = this._curVersion + 1;
                        }
                        if (this._curVersion >= this._gameVersion) {
                            config.setVersionConfigValue(define.eVersionCfgFiled.clientPackageVersion, this._curVersion);
                            this.executeUpdateCallback();
                        } else {
                            this.installSinglePatch()
                        }
                    });
                });
            });
            return;
        }

        if (arg == "404") {
            let content = `下载文件:${filename}错误, 文件不存在!`;
            logger.error(`update`, content);
            alert(content);

            //一次性下载不到，就一个一个来
            if (this._allInOne) {
                this.installSinglePatch();
            } else {
                this.executeUpdateCallback();
            }
            return;
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
    private installSinglePatch() {
        try {
            loading.showLoading("正在更新客户端程序包");
            this._download.downloadFile(this._patchUrl, this._clientPackagePath, `patch_v${this._curVersion}s_v${this._curVersion + 1}s.zip`, this.downloadFileCallback.bind(this));
        } catch (error) {
            throw error;
        }
    }


    /** 下载整包 */
    private async downloadPackage() {
        await this.checkLatestVersion();
        this._patchCount = 1;
        this._isDownloadPackage = true;
        //release环境, 用的ready的包, 去ready下载
        let environName = config.environName;
        if (environName === define.eEnvironName.release) {
            environName = define.eEnvironName.ready;
        }

        let fileDir = `${config.cdnHost}/clientPackages/${environName}`;
        let saveDir = this._clientPackagePath;
        let fileName = `release_v${this._gameVersion}s.zip`;
        //下载文件
        this._download.downloadFile(fileDir, saveDir, fileName, this.downloadFileCallback.bind(this));
    }

    /** 执行更新后回调 */
    private executeUpdateCallback() {
        loading.hideLoading();
        if (this._updateCallback) {
            this._updateCallback(...this._updateCbArgs);
        }
    }
}