/** 
 * @Author 雪糕
 * @Description 游戏服务器端包更新类
 * @Date 2020-02-13 14:56:09
 * @FilePath \pc\src\renderer\update\ServerUpdate.ts
 */
import StreamZip from "node-stream-zip";

import { CommonDefine } from '../../common/CommonDefine';
import commonConfig from '../../common/CommonConfig';


import * as loading from '../loading';
import * as logger from '../logger';
import * as util from '../util';
import rendererModel from '../RendererModel';
import StreamDownload from './StreamDownload';
import FileUtil from '../../common/FileUtil';

export default class ServerUpdate {
    /** 服务端包存放目录 */
    private _packagePath: string = `${commonConfig.serverPackagePath}/`;
    /** 下载器 */
    private _download: StreamDownload = new StreamDownload();

    /** 更新后回调 */
    private _updateCallback: (...tParam: unknown[]) => void;
    /** 更新后回调参数 */
    private _updateCbArgs: unknown[];

    /** 分支环境 */
    private _environName: CommonDefine.eEnvironName;

    /** 本地版本 */
    private _localVersion: number;

    /** 远程版本 */
    private _remoteVersion: number;

    private initVersionInfo(): void {
        this._environName = commonConfig.environName;
    }

    /** 检查是否最新版本 */
    public async checkLatestVersion(): Promise<boolean> {
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
    public async checkUpdate(tUpdateCallback: (...tParam: unknown[]) => void, ...tUpdateCbArgs: unknown[]): Promise<void> {
        this._updateCallback = tUpdateCallback;
        this._updateCbArgs = tUpdateCbArgs;
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
        //创建目录
        if (!FileUtil.existsSync(this._packagePath)) {
            FileUtil.ensureDirSync(this._packagePath);
        }
        //清除要保存的文件夹
        FileUtil.emptyDirSync(this._packagePath);
        this.downloadPackage();
    }

    /** 下载服务端包 */
    private downloadPackage(): void {
        //release环境, 用的ready的包, 去ready下载
        const fileDir = `${commonConfig.cdnHost}/serverPackages/${this._environName}`;
        const saveDir = this._packagePath;
        const fileName = `${util.getServerPackageFileName()}_v${this._remoteVersion}.zip`;
        this._download.downloadFile(fileDir, saveDir, fileName, this.downloadFileCallback.bind(this));
    }

    /** 下载文件回调 */
    private downloadFileCallback(tResult: string, tFilename: string, tPercentage: number, tErrorMsg: string): void {
        if (tResult === "progress") {
            // 显示进度
            loading.setLoadingProgress(tPercentage);
            return;
        }

        if (tResult === "finished") {
            // 通知完成
            loading.setLoadingProgress(0);
            loading.showLoading("正在解压服务端程序包");
            loading.gradualProgress();
            const content = `开始解压文件:${tFilename}`;
            logger.log('update', content);
            const streamZip = new StreamZip({
                file: this._packagePath + tFilename,
                storeEntries: true
            });
            streamZip.on('ready', () => {
                streamZip.extract('server/', this._packagePath, (tErr: Error) => {
                    if (tErr) {
                        streamZip.close();

                        const errorContent = `解压文件:${tFilename}错误,开始重新下载`;
                        logger.error(`update`, errorContent, tErr);

                        this.downloadPackage();
                        return;
                    }
                    loading.setLoadingProgress(100);
                    const successContent = `解压文件:${tFilename}成功`;
                    logger.log('update', successContent);
                    rendererModel.setPackageVersion(CommonDefine.ePackageType.server, commonConfig.environName, this._remoteVersion);
                    streamZip.close();

                    FileUtil.unlinkSync(this._packagePath + tFilename);
                    this.executeUpdateCallback();
                });
            });
            return;
        }

        if (tResult == "404") {
            const content = `下载文件:${tFilename}错误, 文件不存在!`;
            logger.error(`update`, content);
            // eslint-disable-next-line no-alert
            alert(content);

            this.executeUpdateCallback();
            return;
        }

        if (tResult == "error") {
            const content = `下载文件:${tFilename}出错, ${tErrorMsg}`;
            logger.error(`update`, content);
            // eslint-disable-next-line no-alert
            alert(content);
            this.downloadPackage();

        }
    }

    /** 执行更新后回调 */
    private executeUpdateCallback(): void {
        loading.hideLoadingProgress();
        if (this._updateCallback) {
            this._updateCallback(...this._updateCbArgs);
        }
    }
}