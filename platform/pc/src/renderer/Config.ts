/**
 * @author 雪糕 
 * @desc renderer用的配置静态类
 * @date 2020-02-13 14:54:50 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-24 17:15:24
 */
import fs from 'fs';
import { remote } from 'electron';

import * as logger from './logger';
import { define } from './define';

class Config {
    /** 版本配置 */
    private _versionConfig: any;

    /** 全局配置 */
    private _globalConfig: any;
    public get globalConfig(): any {
        return this._globalConfig;
    }

    /** native用请求头 */
    public protocol = "http:";

    /** 程序根路径 */
    public _rootPath: string;
    public get rootPath() {
        if (!this._rootPath) {
            this._rootPath = remote.app.getAppPath();
        }

        return this._rootPath;
    }

    /** 用户数据路径 */
    public _userDataPath: string;
    public get userDataPath() {
        if (!this._userDataPath) {
            this._userDataPath = remote.app.getPath("userData");
        }

        return this._userDataPath;
    }


    // const macResourcePath = "./Applications/bellplanet.app/Contents/Resources/app/package/client/";
    // const winResourcePath = "./resources/app/package/client/"
    // export const resourcePath = navigator.userAgent.indexOf("Mac") > 0 ? macResourcePath : winResourcePath;

    /** 游戏包路径 */
    public packagePath = `${this.userDataPath}/package`;

    /** 客户端包路径 */
    public clientPackagePath = `${this.packagePath}/client`;

    /** 服务端包路径 不带server文件夹是因为压缩包包含了一个server文件夹 */
    public serverPackagePath = `${this.packagePath}/server`;

    /** 全局配置路径 */
    public globalConfigPath = `${this.rootPath}/dist/GlobalConfig.json`;


    /** 版本配置路径 */
    public versionConfigPath = `${this.packagePath}/VersionConfig.json`;

    public cdnHost = "http://bg-stage.wkcoding.com";

    /** 分支环境  beta|ready|release */
    public environName: define.eEnvironName;

    /** 官网地址 */
    public bellcodeUrl = "https://www.bellcode.com";

    /** demo */
    public demoBellCodeUrl = "https://democm.wkcoding.com/";

    private _nativeLoginResponse: any;
    /** native平台登陆信息 */
    public get nativeLoginResponse(): any {
        return this._nativeLoginResponse;
    }
    public setNativeLoginResponse(value: any) {
        this._nativeLoginResponse = value;
        localStorage.setItem('nativeLoginResponse', JSON.stringify(this._nativeLoginResponse));
    }

    private _nativeGameServer: string;
    /** 游戏服务器内网ip */
    public get nativeGameServer(): string {
        return this._nativeGameServer;
    }
    public setNativeGameServer(value: string) {
        this._nativeGameServer = value;
        localStorage.setItem('nativeGameServer', JSON.stringify(this._nativeGameServer));
    }

    private _isPackaged: boolean;
    public get isPackaged(): boolean {
        if (this._isPackaged === undefined) {
            this._isPackaged = remote.app.isPackaged;
        }

        return this._isPackaged;
    }

    public init() {
        logger.log('renderer', `初始化全局配置`);
        if (fs.existsSync(this.globalConfigPath)) {
            let data = fs.readFileSync(this.globalConfigPath, 'utf-8');
            this._globalConfig = JSON.parse(data);
            this.environName = this._globalConfig.environName;
        }

        if (fs.existsSync(this.versionConfigPath)) {
            let data = fs.readFileSync(this.versionConfigPath, 'utf-8');
            this._versionConfig = JSON.parse(data);
        } else {
            this._versionConfig = {};
        }
    }

    /** 获取版本配置值 */
    public getVersionConfigValue(key: string) {
        return this._versionConfig[key];
    }

    /** 设置全局配置值 */
    public setVersionConfigValue(key: string, value: string | number) {
        this._versionConfig[key] = value;
        fs.writeFileSync(this.versionConfigPath, JSON.stringify(this._versionConfig, null, 4), "utf-8");

        logger.log('renderer', `设置VersionConfigValue`, key, value);
    }
}

let config = new Config();
export default config;