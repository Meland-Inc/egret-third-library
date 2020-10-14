/**
 * @Author 雪糕
 * @Description 通用配置
 * @Date 2020-06-15 14:28:20
 * @FilePath \pc\src\common\CommonConfig.ts
 */

import { app, remote, App } from 'electron';
import { CommonDefine } from './CommonDefine';
import FileUtil from "./FileUtil";
import { logger } from '../main/logger';

class CommonConfig {
    /** 本机IP */
    public readonly localIp: string = "127.0.0.1";

    /** native用请求头 */
    public readonly protocol: string = "http:";

    /** cdn域名地址 */
    public readonly cdnHost: string = "http://bg-stage.wkcoding.com";

    /** 上传日志地址 */
    public readonly uploadLogUrl: string = `http://clientlog.wkcoding.com/nativeLogs`;

    /** 上课模式渠道常量 */
    public readonly constChannelLesson: string = 'bian_lesson';

    /** 上课伪协议头 */
    public readonly constPseudoProtocol: string = 'bellplanet:';

    /** release环境客户端游戏包的地址 */
    public readonly releasePackageUrl: string = "bg-stage.wkcoding.com/clientPackages/ready";

    /** release环境客户端策略文件的地址 */
    public readonly releasePolicyUrl: string = "bg-stage.wkcoding.com/";

    /** 程序根路径 */
    public _rootPath: string;
    public get rootPath(): string {
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

    /** 环境配置集合 */
    private createEnvironMap(): Map<CommonDefine.eEnvironName, IEnviron> {
        const environConfigMap: Map<CommonDefine.eEnvironName, IEnviron> = new Map();
        environConfigMap.set(CommonDefine.eEnvironName.beta,
            {
                environName: CommonDefine.eEnvironName.beta,
                accountServer: "ready-account.wkcoding.com",
                serverListServer: "server-list-beta.wkcoding.com",
                uploadLogServer: "ready-clientlog.wkcoding.com",
                bellApiOrigin: "demoapi.wkcoding.com",
                bellcodeDomain: "https://democm.wkcoding.com",
                policyUrl: "planet.wkcoding.com/web/beta/",
                patchUrl: "192.168.1.211/native/beta/patch",
                packageUrl: "192.168.1.211/native/beta/release",
            });

        environConfigMap.set(CommonDefine.eEnvironName.ready,
            {
                environName: CommonDefine.eEnvironName.ready,
                accountServer: "ready-account.wkcoding.com",
                serverListServer: "ready-server-list.wkcoding.com",
                uploadLogServer: "ready-clientlog.wkcoding.com",
                bellApiOrigin: "demoapi.wkcoding.com",
                bellcodeDomain: "https://democm.wkcoding.com",
                policyUrl: "bg-stage.wkcoding.com/readyTest",
                patchUrl: "bg-stage.wkcoding.com/readyTest//ready/win",
                packageUrl: "bg-stage.wkcoding.com/clientPackages/ready",
            });

        environConfigMap.set(CommonDefine.eEnvironName.release,
            {
                environName: CommonDefine.eEnvironName.release,
                accountServer: "account.wkcoding.com",
                serverListServer: "server-list.wkcoding.com",
                uploadLogServer: "clientlog.wkcoding.com",
                bellApiOrigin: "api.bellcode.com",
                bellcodeDomain: "https://www.bellcode.com",
                patchUrl: "bg-stage.wkcoding.com//win",
                packageUrl: "bg-stage.wkcoding.com/clientPackages/ready",
                policyUrl: "bg-stage.wkcoding.com/",
            });

        return environConfigMap;
    }

    private _environ: IEnviron;
    /** 环境配置 */
    public get environ(): IEnviron {
        return this._environ;
    }

    public constructor() {
        const commonApp: App = app || remote.app;
        this._rootPath = commonApp.getAppPath();
        this._userDataPath = commonApp.getPath("userData");
        this._isPackaged = commonApp.isPackaged;

        this.initGlobalConfig();
    }

    /** 初始化全局配置 */
    private initGlobalConfig(): void {
        if (!FileUtil.existsSync(this.globalConfigPath)) {
            return;
        }

        const data = FileUtil.readFileSync(this.globalConfigPath, 'utf-8', false);
        if (data) {
            const globalConfig: IEnviron = JSON.parse(data);
            this.initEnviron(globalConfig.environName);
        } else {
            logger.error("file", `读取GlobalConfig全局配置错误`);
        }
    }

    /** 写入环境名称 */
    public writeEnvironName(tEnvironName: string): void {
        const data = FileUtil.readFileSync(commonConfig.globalConfigPath, 'utf-8');
        const globalConfig = JSON.parse(data);
        if (globalConfig.environName === tEnvironName) return;

        globalConfig.environName = tEnvironName;
        FileUtil.writeFileSync(commonConfig.globalConfigPath, JSON.stringify(globalConfig));
        this.initEnviron(globalConfig.environName);
    }

    /** 初始化环境相关配置 */
    private initEnviron(tEnvironName: CommonDefine.eEnvironName): void {
        this._environName = tEnvironName;
        const environMap: Map<CommonDefine.eEnvironName, IEnviron> = this.createEnvironMap();
        this._environ = environMap.get(this._environName);
    }
}

/** 环境配置接口 */
interface IEnviron {
    environName: CommonDefine.eEnvironName;
    accountServer: string,      //账号服务器
    serverListServer: string,   //服务器列表服务器
    uploadLogServer: string,    //上传日志服务器
    bellApiOrigin: string,      //平台接口地址
    bellcodeDomain: string,        //官网地址
    policyUrl: string,          //客户端策略文件地址
    patchUrl: string,           //客户端补丁包地址
    packageUrl: string,         //客户端游戏包地址
}

const commonConfig: CommonConfig = new CommonConfig();
export default commonConfig;