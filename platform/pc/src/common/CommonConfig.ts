/**
 * @Author 雪糕
 * @Description 通用配置
 * @Date 2020-06-15 14:28:20
 * @FilePath \pc\src\common\Config.ts
 */

import fs from 'fs';
import { app, remote, App } from 'electron';
import { CommonDefine } from './CommonDefine';

class CommonConfig {
    /** 本机IP */
    public readonly localIp = "127.0.0.1";

    /** native用请求头 */
    public readonly protocol = "http:";

    /** cdn域名地址 */
    public readonly cdnHost = "http://bg-stage.wkcoding.com";

    /** 官网地址 */
    public readonly bellcodeUrl = "https://www.bellcode.com";

    /** demo */
    public readonly demoBellCodeUrl = "https://democm.wkcoding.com/";

    /** 上传日志地址 */
    public readonly uploadLogUrl = `http://clientlog.wkcoding.com/nativeLogs`;

    /** 正式环境用tokenDomain */
    public readonly releaseTokenDomain = `.bellcode.com`;

    /** ready环境用tokenDomain */
    public readonly readyTokenDomain = `.wkcoding.com`;

    /** 上课模式渠道常量 */
    public constChannelLesson = 'bian_lesson';

    /** 上课伪协议头 */
    public constPseudoProtocol = 'bellplanet://';

    /** release环境客户端游戏包的地址 */
    public releasePackageUrl: string = "bg-stage.wkcoding.com/clientPackages/ready";

    /** release环境客户端策略文件的地址 */
    public releasePolicyUrl: string = "bg-stage.wkcoding.com/";

    /** 程序根路径 */
    public _rootPath: string;
    public get rootPath() {
        return this._rootPath;
    }

    /** 用户数据路径 */
    public _userDataPath: string;
    public get userDataPath(): string {
        return this._userDataPath;
    }

    /** 游戏包路径 */
    public get packagePath(): string {
        return `${this.userDataPath}/package`;
    }

    /** 客户端包路径 */
    public get clientPackagePath(): string {
        return `${this.packagePath}/client/${this._environName}`;
    }

    /** 服务端包路径 */
    public get serverPackagePath(): string {
        return `${this.packagePath}/server/${this._environName}`;
    }

    /** 全局配置路径 */
    public get globalConfigPath(): string {
        return `${this.rootPath}/dist/GlobalConfig.json`;
    }

    /** 版本配置路径 */
    public get versionConfigPath(): string {
        return `${this.packagePath}/VersionConfig.json`;
    }

    private _environName: CommonDefine.eEnvironName;
    /** 分支环境  beta|ready|release */
    public get environName(): CommonDefine.eEnvironName {
        return this._environName;
    }

    /** native配置路径 */
    public get nativeCnfPath(): string {
        return `${this.serverPackagePath}/config/native_lesson_cnf.json`;
    }

    /** 终端运行进程日志路径 */
    public get processLogPath(): string {
        return `${this.rootPath}/dist/log/process.log`;
    }

    /** 前台主进程日志路径 */
    public get ipcMainLogPath(): string {
        return `${this.rootPath}/dist/log/ipcMain.log`;
    }

    /** 前台渲染进程日志路径 */
    public get ipcRendererLogPath(): string {
        return `${this.rootPath}/dist/log/ipcRenderer.log`;
    }

    /** 本地待上传日志地址 */
    public get uploadLogDir(): string {
        return `${this.rootPath}/dist/uploadLog`;
    }

    private _isPackaged: boolean;
    /** 是否打包运行 */
    public get isPackaged(): boolean {
        return this._isPackaged;
    }

    private _patchUrl: string;
    /** 客户端补丁包地址 */
    public get patchUrl(): string {
        return this._patchUrl;
    }

    private _policyUrl: string;
    /** 客户端策略文件地址 */
    public get policyUrl(): string {
        return this._policyUrl;
    }

    private _packageUrl: string;
    /** 客户端游戏包地址 */
    public get packageUrl(): string {
        return this._packageUrl;
    }

    private _isFullScreen: boolean;
    /** 是否全屏 */
    public get isFullScreen(): boolean {
        return this._isFullScreen;
    }

    public constructor() {
        const commonApp: App = app || remote.app;
        this._rootPath = commonApp.getAppPath();
        this._userDataPath = commonApp.getPath("userData");
        this._isPackaged = commonApp.isPackaged;

        this.initGlobalConfig();
    }

    private initGlobalConfig(): void {
        if (!fs.existsSync(this.globalConfigPath)) {
            return;
        }

        let data = fs.readFileSync(this.globalConfigPath, 'utf-8');
        const globalConfig: IGlobalConfig = JSON.parse(data);
        this._environName = globalConfig.environName;
        this._patchUrl = globalConfig.patchUrl;
        this._packageUrl = globalConfig.packageUrl;
        this._policyUrl = globalConfig.policyUrl;
        this._isFullScreen = globalConfig.fullScreen;
    }

    /** 写入全屏信息 */
    public writeFullScreen(isFullScreen: boolean): void {
        let data = fs.readFileSync(commonConfig.globalConfigPath, 'utf-8');
        const globalConfig: IGlobalConfig = JSON.parse(data);
        if (globalConfig.fullScreen === isFullScreen) return;

        this._isFullScreen = isFullScreen;
        globalConfig.fullScreen = isFullScreen;
        fs.writeFileSync(commonConfig.globalConfigPath, JSON.stringify(globalConfig));
    }
}

interface IGlobalConfig {
    environName: CommonDefine.eEnvironName;
    fullScreen: boolean;
    patchUrl: string,
    packageUrl: string,
    policyUrl: string
}

let commonConfig: CommonConfig = new CommonConfig();
export default commonConfig;