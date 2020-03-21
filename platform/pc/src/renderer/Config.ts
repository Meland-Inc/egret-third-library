/**
 * @author 雪糕 
 * @desc renderer用的配置静态类
 * @date 2020-02-13 14:54:50 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-22 01:36:47
 */
import fs from 'fs';
import { remote } from 'electron';

import * as logger from './logger';
import message from './Message';
import { define } from './define';

class Config {
    /** 全局配置 */
    private _globalConfig: any;
    public get globalConfig(): any {
        return this._globalConfig
    }

    public setGlobalConfig(value: any) {
        this._globalConfig = value;
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

    /** 全局配置路径 */
    public globalConfigPath = `${this.rootPath}/dist/GlobalConfig.json`;

    // const macResourcePath = "./Applications/bellplanet.app/Contents/Resources/app/package/client/";
    // const winResourcePath = "./resources/app/package/client/"
    // export const resourcePath = navigator.userAgent.indexOf("Mac") > 0 ? macResourcePath : winResourcePath;
    /** 客户端包路径 */
    public clientPackagePath = `${this.rootPath}/package/client/`;

    /** 服务端包路径 不带server文件夹是因为压缩包包含了一个server文件夹 */
    public serverPackagePath = `${this.rootPath}/package/`;

    public cdnHost = "http://bg-stage.wkcoding.com";

    /** 分支环境  beta|ready|release */
    public environName: define.eEnvironName;

    /** 官网地址 */
    public bellcodeUrl = "https://www.bellcode.com";

    /** demo */
    public demoBellCodeUrl = "https://democm.wkcoding.com/";

    /** beta客户端地址 */
    public betaUrl = "http://wplanet.wkcoding.com/app-beta";

    /** ready客户端地址 */
    public readyUrl = "http://wplanet.wkcoding.com/app-ready";

    /** release客户端地址 */
    public releaseUrl = "http://wplanet.wkcoding.com/app";

    private _nativeLoginResponse: any;
    /** native平台登陆信息 */
    public get nativeLoginResponse(): any {
        return this._nativeLoginResponse;
    }
    public setNativeLoginResponse(value: any) {
        this._nativeLoginResponse = value;
    }

    private _nativeGameServer: string;
    /** 游戏服务器内网ip */
    public get nativeGameServer(): string {
        return this._nativeGameServer;
    }
    public setNativeGameServer(value: string) {
        this._nativeGameServer = value;
    }

    public async init() {
        return new Promise((resolve, reject) => {
            logger.log('renderer', `初始化全局配置`);
            fs.readFile(this.globalConfigPath, "utf-8", (err: NodeJS.ErrnoException, data: string) => {
                if (err) {
                    reject(err.message);
                    return;
                }

                this._globalConfig = JSON.parse(data);
                this.environName = this._globalConfig.environName;
                resolve();
            });
        })
    }

    /** 获取全局配置值 */
    public getGlobalConfigValue(key: string) {
        return this._globalConfig[key];
    }

    /** 设置全局配置值 */
    public setGlobalConfigValue(key: string, value: string | number) {
        this._globalConfig[key] = value;
        fs.writeFileSync(this.globalConfigPath, JSON.stringify(this._globalConfig, null, 4), "utf-8");
        message.sendIpcMsg('UPDATE_GLOBAL_CONFIG', this._globalConfig);
    }
}

let config = new Config();
export default config;