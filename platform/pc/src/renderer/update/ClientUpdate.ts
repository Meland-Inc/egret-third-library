/** 
 * @Author 雪糕
 * @Description 游戏客户端包更新类
 * @Date 2020-02-13 14:56:09
 * @FilePath \pc\src\renderer\update\ClientUpdate.ts
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
    private _clientPackagePath: string = `${commonConfig.clientPackagePath}/`;
    /** 补丁包数量 */
    private _patchCount: number = 0;
    /** 下载器 */
    private _download: StreamDownload = new StreamDownload();

    /** 更新后回调 */
    private _updateCallback: (...tParam: unknown[]) => void;
    /** 更新后回调参数 */
    private _updateCbArgs: unknown[];

    /** 是否是下载整包 */
    private _isDownloadPackage: boolean;
    /** 检查是否最新版本 */
    public async checkLatestVersion(): Promise<boolean> {
        let gameVersion = rendererModel.getPackageVersion(CommonDefine.ePackageType.client);
        if (!gameVersion) {
            gameVersion = 0;
        } else {
            const indexFilePath = `${commonConfig.clientPackagePath}/index_v${gameVersion}.html`;
            const indexFileExist = FileUtil.existsSync(indexFilePath);
            //不存在对应游戏版本号的文件,通过文件列表获取最大游戏版本
            if (!indexFileExist) {
                gameVersion = this.getGameVersionByIndexFileList();
            }
            logger.log('update', `indexFile gameVersion: ${gameVersion}`);
        }

        this._curVersion = this._startVersion = +gameVersion;

        this._patchUrl = `${commonConfig.protocol}//${commonConfig.environ.patchUrl}`;

        const curGameVersion = await this.getClientGameVersion(commonConfig.environName, commonConfig.environ.policyUrl);
        if (!curGameVersion) return true;

        this._gameVersion = curGameVersion;
        //发现当前版本比游戏版本大,用最新的游戏版本
        if (this._curVersion > this._gameVersion) {
            this._curVersion = this._gameVersion;
            rendererModel.setPackageVersion(CommonDefine.ePackageType.client, commonConfig.environName, this._curVersion);
        }
        return this._curVersion === this._gameVersion;
    }

    /** 通过游戏index文件列表获取当前最大游戏版本号 */
    private getGameVersionByIndexFileList(): number {
        let gameVersion: number = 0;
        const fileDir = FileUtil.readdirSync(commonConfig.clientPackagePath);
        for (const iterator of fileDir) {
            const index = iterator.search(/index_v[0-9]*.html/);
            if (index >= 0) {
                const version = +iterator.replace(/[a-zA-Z_.]/g, "");
                if (gameVersion < version) {
                    gameVersion = version;
                }
            }
        }

        return gameVersion;
    }

    /** 获取当前环境客户端游戏版本号 */
    public async getCurClientGameVersion(): Promise<number> {
        const environName = commonConfig.environName;
        const policyUrl: string = commonConfig.environ.policyUrl;
        const result = await this.getClientGameVersion(environName, policyUrl);
        return result;
    }

    /** 获取客户端游戏版本号 */
    private async getClientGameVersion(tEnvironName: string, tPolicyUrl: string): Promise<number> {
        const policyNum = await util.getClientPackagePolicyNum(tEnvironName);
        const { policyHost, policyPath } = this.getPolicyInfo(tPolicyUrl);
        if (policyNum === null) {
            const content = `获取策略版本号错误!, environName:${tEnvironName}`;
            logger.error(`renderer`, content);
            // eslint-disable-next-line no-alert
            alert(content);
            return 0;
        }

        try {
            const gameVersion = await util.tryGetClientGameVersion(policyHost, policyPath, policyNum);
            return +gameVersion;
        } catch (error) {
            const content = "获取客户端版本号错误!";
            logger.error(`renderer`, content);
            // eslint-disable-next-line no-alert
            alert(content);
            return 0;
        }
    }

    /** 直接下载最新版本 */
    public directDownload(tUpdateCallback: (...tParam: unknown[]) => void, ...tUpdateCbArgs: unknown[]): void {
        this._updateCallback = tUpdateCallback;
        this._updateCbArgs = tUpdateCbArgs;

        loading.showLoading("正在下载客户端程序包");
        //创建目录
        if (!FileUtil.existsSync(commonConfig.clientPackagePath)) {
            FileUtil.ensureDirSync(commonConfig.clientPackagePath);
        }
        this.downloadPackage();
    }

    /** 检查更新 */
    public async checkUpdate(tUpdateCallback: (...tParam: unknown[]) => void, ...tUpdateCbArgs: unknown[]): Promise<void> {
        this._updateCallback = tUpdateCallback;
        this._updateCbArgs = tUpdateCbArgs;
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
    }

    /** 下载文件回调 */
    private downloadFileCallback(tArg: string, tFilename: string, tPercentage: number): void {
        if (tArg === "progress") {
            // 显示进度
            if (this._allInOne) {
                loading.setLoadingProgress(tPercentage);
            } else {
                const each = 100 / this._patchCount;
                loading.setLoadingProgress(tPercentage / 100 * each + (this._curVersion - this._startVersion) * each);
            }
            return;
        }

        if (tArg === "finished") {
            // 通知完成
            if (this._isDownloadPackage) {
                loading.setLoadingProgress(0);
                loading.showLoading("正在解压客户端程序包");
                loading.gradualProgress();
            }
            const content = `开始解压文件:${tFilename}`;
            logger.log('update', content);
            const streamZip = new StreamZip({
                file: this._clientPackagePath + tFilename,
                storeEntries: true
            });
            streamZip.on('ready', () => {
                streamZip.extract(null, this._clientPackagePath, (tErr: Error) => {
                    if (tErr) {
                        streamZip.close();

                        const errorContent = `解压文件:${tFilename}错误`;
                        logger.error(`update`, errorContent, tErr);
                        // eslint-disable-next-line no-alert
                        alert(errorContent);
                        this.executeUpdateCallback();
                        return;
                    }
                    loading.setLoadingProgress(100);
                    const successContent = `解压文件:${tFilename}成功`;
                    logger.log('update', successContent);
                    streamZip.close();
                    FileUtil.unlinkSync(this._clientPackagePath + tFilename);
                    //如果是下载整包状态,直接赋值当前版本为最新游戏版本
                    if (this._isDownloadPackage) {
                        this._isDownloadPackage = false;
                        this._curVersion = this._gameVersion;
                    }

                    if (this._curVersion < this._gameVersion) {
                        this._curVersion = this._curVersion + 1;
                    }
                    if (this._curVersion >= this._gameVersion) {
                        rendererModel.setPackageVersion(CommonDefine.ePackageType.client, commonConfig.environName, this._curVersion);
                        this.executeUpdateCallback();
                    } else {
                        this.installSinglePatch();
                    }
                });
            });
            return;
        }

        if (tArg == "404") {
            const content = `下载文件:${tFilename}错误, 文件不存在!`;
            logger.error(`update`, content);
            // eslint-disable-next-line no-alert
            alert(content);

            //一次性下载不到，就一个一个来
            if (this._allInOne) {
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
    private installSinglePatch(): void {
        loading.showLoading("正在更新客户端程序包");
        this._download.downloadFile(this._patchUrl, this._clientPackagePath, `patch_v${this._curVersion}s_v${this._curVersion + 1}s.zip`, this.downloadFileCallback.bind(this));
    }


    /** 下载整包 */
    private async downloadPackage(): Promise<void> {
        await this.checkLatestVersion();
        this._patchCount = 1;
        this._isDownloadPackage = true;
        //ready环境, 用的release的包, 去release下载
        let environName = commonConfig.environName;
        let policyUrl: string = commonConfig.environ.policyUrl;
        let packageUrl: string = commonConfig.environ.packageUrl;
        if (environName === CommonDefine.eEnvironName.ready) {
            environName = CommonDefine.eEnvironName.release;
            policyUrl = commonConfig.releasePolicyUrl;
            packageUrl = commonConfig.releasePackageUrl;
        }

        const gameVersion = await this.getClientGameVersion(environName, policyUrl);
        const fileDir = `${commonConfig.protocol}//${packageUrl}`;
        const saveDir = this._clientPackagePath;
        const fileName = `release_v${gameVersion}s.zip`;
        //下载文件
        this._download.downloadFile(fileDir, saveDir, fileName, this.downloadFileCallback.bind(this));
    }

    /** 执行更新后回调 */
    private executeUpdateCallback(): void {
        loading.hideLoadingProgress();
        if (this._updateCallback) {
            this._updateCallback(...this._updateCbArgs);
        }
    }

    /** 获取策略信息 */
    private getPolicyInfo(tPolicyUrl: string): { policyHost: string, policyPath: string } {
        const policyArr = tPolicyUrl.split("/");
        const policyHost: string = policyArr[0];
        let policyPath: string = "";
        if (policyArr[1] && policyArr[1] !== "") {
            policyPath = tPolicyUrl.replace(policyHost, "");
        }

        return { policyHost: policyHost, policyPath: policyPath };
    }
}