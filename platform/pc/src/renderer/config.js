/**
 * @author 雪糕 
 * @desc renderer用的配置静态类
 * @date 2020-02-13 14:54:50 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-20 10:02:56
 */
const fs = require('fs');
import * as logger from './logger.js';
import * as message from './message.js';

export class Config {
    /** 全局配置 */
    static globalConfig;

    /** native用请求头 */
    static protocol = "http:";

    /** 程序根路径 */
    static rootPath = `${__dirname}/../..`;

    /** 全局配置路径 */
    static globalConfigPath = `${this.rootPath}/GlobalConfig.json`;

    // const macResourcePath = "./Applications/bellplanet.app/Contents/Resources/app/package/client/";
    // const winResourcePath = "./resources/app/package/client/"
    // export const resourcePath = navigator.userAgent.indexOf("Mac") > 0 ? macResourcePath : winResourcePath;
    /** 客户端包路径 */
    static clientPackagePath = `${this.rootPath}/package/client/`;

    /** 服务端包路径 不带server文件夹是因为压缩包包含了一个server文件夹 */
    static serverPackagePath = `${this.rootPath}/package/`;

    static cdnHost = "http://bg-stage.wkcoding.com";

    /** 分支环境  beta|ready|release */
    static environName = "";

    /** 官网地址 */
    static bellcodeUrl = "https://www.bellcode.com";

    /** demo */
    static demoBellCodeUrl = "https://democm.wkcoding.com/";

    /** beta客户端地址 */
    static betaUrl = "http://wplanet.wkcoding.com/app-beta";

    /** ready客户端地址 */
    static readyUrl = "http://wplanet.wkcoding.com/app-ready";

    /** release客户端地址 */
    static releaseUrl = "http://wplanet.wkcoding.com/app";

    static _nativeLoginResponse;
    /** native平台登陆信息 */
    static get nativeLoginResponse() {
        return this._nativeLoginResponse;
    }
    static setNativeLoginResponse(value) {
        this._nativeLoginResponse = value;
    }

    static _nativeGameServer;
    /** 游戏服务器内网ip */
    static get nativeGameServer() {
        return this._nativeGameServer;
    }
    static setNativeGameServer(value) {
        this._nativeGameServer = value;
    }

    /** 分支环境名称 */
    static environName;

    /** 分支枚举 */
    static eEnvironName = {
        beta: "beta",
        ready: "ready",
        release: "release",
    }

    static async init() {
        return new Promise((resolve, reject) => {
            logger.log('renderer', `初始化全局配置`);
            fs.readFile(this.globalConfigPath, "utf-8", (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }

                this.globalConfig = JSON.parse(data);
                this.environName = this.globalConfig.environName;
                resolve();
            });
        })
    }

    /** 获取全局配置值 */
    static getGlobalConfigValue(key) {
        return this.globalConfig[key];
    }

    /** 设置全局配置值 */
    static setGlobalConfigValue(key, value) {
        this.globalConfig[key] = value;
        fs.writeFileSync(this.globalConfigPath, JSON.stringify(this.globalConfig, null, 4), "utf-8");
        message.sendIpcMsg('UPDATE_GLOBAL_CONFIG', this.globalConfig);
    }
}