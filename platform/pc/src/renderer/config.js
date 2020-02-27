/**
 * @author 雪糕 
 * @desc renderer用的配置静态类
 * @date 2020-02-13 14:54:50 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-26 21:59:20
 */
let fs = require('fs');
export class Config {
    /** native用请求头 */
    static protocol = "http:";
    /** 程序根路径 */
    static rootPath = `${__dirname}/../..`;

    // const macResourcePath = "./Applications/bellplanet.app/Contents/Resources/app/package/client/";
    // const winResourcePath = "./resources/app/package/client/"
    // export const resourcePath = navigator.userAgent.indexOf("Mac") > 0 ? macResourcePath : winResourcePath;
    /** 资源路径 */
    static resourcePath = `${this.rootPath}/package/client/`;

    static _nativeLoginResponse;
    /** native平台登陆信息 */
    static get nativeLoginResponse() {
        return this._nativeLoginResponse;
    }
    static setNativeLoginResponse(value) {
        this._nativeLoginResponse = value;
    }

    static _gameServerLocalIp;
    /** 游戏服务器内网ip */
    static get gameServerLocalIp() {
        return this._gameServerLocalIp;
    }
    static setGameServerLocalIp(value) {
        this._gameServerLocalIp = value;
    }

    static _gameServerLocalPort;
    /** 游戏服务器内网端口 */
    static get gameServerLocalPort() {
        return this._gameServerLocalPort;
    }
    static setGameServerLocalPort(value) {
        this._gameServerLocalPort = value;
    }
}