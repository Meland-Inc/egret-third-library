/**
 * @author 雪糕
 * @desc 渲染进程消息处理文件
 * @date 2020-02-26 15:31:07
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-26 00:17:33
 */
import { ipcRenderer, IpcRendererEvent } from "electron";
import querystring from "querystring";
import fs from "fs";
import path from "path";

import config from './Config';
import * as util from './util';
import { define } from './define';
import * as logger from './logger';
import * as loading from './loading';
import ClientUpdate from './update/ClientUpdate';
import ServerUpdate from './update/ServerUpdate';

class Message {
    //消息对应方法集合
    private msgMap = {
        'SAVE_NATIVE_LOGIN_RESPONSE': this.onSaveNativeLoginResponse.bind(this),    //保存native平台登陆信息
        'SAVE_NATIVE_GAME_SERVER': this.onSaveNativeGameServer.bind(this),     //设置native服务器内网ip和端口
        'START_NATIVE_CLIENT': this.onStartNativeClient.bind(this),  //从客户端进入
        'START_NATIVE_WEBSITE': this.onStartNativeWebsite.bind(this),  //开始官网地址进入
        'START_NATIVE_PLATFORM': this.onStartNativePlatform.bind(this),  //开始平台进入
        'SEND_MSG_TO_CLIENT': this.onSendMsgToClient.bind(this), //发送消息到客户端
        'SHOW_LOADING': this.onShowLoading.bind(this),//显示loading
        'HIDE_LOADING': this.onHideLoading.bind(this),//隐藏loading
        'SET_LOADING_PROGRESS': this.onSetLoadingProgress.bind(this),//设置loading进度
        'CHECK_PACKAGE_UPDATE': this.checkPackageUpdate.bind(this),//检查游戏包更新
        'GET_NATIVE_POLICY_VERSION': this.onGetNativePolicyVersion.bind(this),//获取native策略版本号
    }

    private _clientUpdate = new ClientUpdate();
    private _serverUpdate = new ServerUpdate();

    /** 发送渲染进程消息 */
    public sendIpcMsg(msgId: string, ...args: any[]) {
        logger.log('renderer', `发送渲染进程消息:${msgId} args`, ...args);
        ipcRenderer.send('RENDERER_PROCESS_MESSAGE', msgId, ...args);
    }

    /** 初始化 */
    public init() {
        logger.log('renderer', `初始化渲染进程监听消息`);
        //监听主进程消息
        ipcRenderer.on('MAIN_PROCESS_MESSAGE', (evt: IpcRendererEvent, msgId: string, ...args: any[]) => {
            logger.log('renderer', `收到主进程消息:${msgId} args`, ...args);
            this.applyIpcMsg(msgId, ...args);
        });
    }

    /** 应用主进程消息 */
    private applyIpcMsg(msgId: string, ...args: any[]) {
        let func = this.msgMap[msgId];
        if (func) {
            func(...args);
        }
    }

    /** 保存native平台登陆信息 */
    private onSaveNativeLoginResponse(body: any) {
        config.setNativeLoginResponse(body);
    }

    private onSaveNativeGameServer(gameServer: string) {
        config.setNativeGameServer(gameServer);
    }

    private async onGetNativePolicyVersion() {
        let versionName = `${config.environName}_native`;
        let nativePolicyVersion: number = await util.getNativePolicyNum(versionName);
        this.sendIpcMsg("SET_NATIVE_POLICY_VERSION", nativePolicyVersion);
    }

    /** 检查游戏包更新 */
    private async checkPackageUpdate() {
        logger.log('update', `开始检查更新`);
        logger.log('config', `全局配置`, config.globalConfig);

        //服务器包所在目录
        let serverPackageDir = `${config.serverPackagePath}`;
        let serverDirect = false;
        let serverExists = fs.existsSync(serverPackageDir);
        if (!serverExists) {
            serverDirect = true;
        } else {
            let dir = fs.readdirSync(serverPackageDir);
            if (dir.length < 2) {
                serverDirect = true;
            }
        }

        //客户端包所在目录
        let clientPackageDir = config.clientPackagePath;
        let clientDirect = false;
        let clientExists = fs.existsSync(clientPackageDir);
        if (!clientExists) {
            clientDirect = true;
        } else {
            let dir = fs.readdirSync(clientPackageDir);
            logger.log(`net`, `dir length:${dir.length}`);
            if (dir.length < 2) {
                clientDirect = true;
            }
        }

        if (serverDirect || clientDirect) {
            let serverUpdateFunc = serverDirect ? this.directDownloadServer.bind(this) : this.checkServerUpdate.bind(this);
            let clientUpdateFunc = clientDirect ? this.directDownloadClient.bind(this) : this.checkClientUpdate.bind(this);
            serverUpdateFunc(clientUpdateFunc, this.checkUpdateComplete.bind(this));
            logger.log(`net`, `直接下载最新包`);
            return;
        }

        let isServerLatestVersion = await this._serverUpdate.checkLatestVersion();
        let isClientLatestVersion = await this._clientUpdate.checkLatestVersion();
        //两个版本都一致
        if (isServerLatestVersion && isClientLatestVersion) {
            logger.log(`net`, `检查更新完毕,客户端,服务端版本都是最新`);
            this.checkUpdateComplete();
            return;
        }

        //服务端版本一致, 检查更新客户端
        if (isServerLatestVersion) {
            this.checkClientUpdate(this.checkUpdateComplete.bind(this));
            return;
        }

        //客户端版本一致, 检查更新服务端
        if (isClientLatestVersion) {
            this.checkServerUpdate(this.checkUpdateComplete.bind(this));
            return;
        }

        //两个版本都不一致,先更新服务端版本,再更新客户端版本
        this.checkServerUpdate(this.checkClientUpdate.bind(this), this.checkUpdateComplete.bind(this));

        ////服务端版本不一致,先提示是否更新
        // if (confirm('检测到游戏版本更新,是否更新?')) {
        //先更新服务端版本,再更新客户端版本
        // this.checkServerUpdate(this.checkClientUpdate.bind(this), this.checkUpdateComplete.bind(this));
        // return
        // }

        // //不更新
        // this.checkUpdateComplete();
    }

    /** 直接下载最新服务端包 */
    private directDownloadServer(callback: Function, ...args: any[]) {
        try {
            config.setVersionConfigValue("serverPackageVersion", 0);
            this._serverUpdate.checkUpdate(callback, ...args);
        } catch (error) {
            let content = `native下载服务端出错,点击重试`;
            logger.error(`update`, content, error);
            alert(content + error);
            this.directDownloadServer(callback, ...args);
        }
    }

    /** 直接下载最新的客户端包 */
    private directDownloadClient(callback: Function, ...args: any[]) {
        try {
            this._clientUpdate.directDownload(callback, ...args);
        } catch (error) {
            let content = `native下载客户端出错,点击重试`;
            logger.error(`update`, content, error);
            alert(content + error);
            this.directDownloadClient(callback, ...args);
        }
    }

    /** 检查客户端包更新 */
    private checkClientUpdate(callback: Function, ...args: any[]) {
        try {
            this._clientUpdate.checkUpdate(callback, ...args);
        } catch (error) {
            let content = `native更新客户端报错`
            logger.error(`update`, content, error);
            alert(content);

            callback(...args);
        }
    }

    /** 检查服务端包更新 */
    private checkServerUpdate(callback: Function, ...args: any[]) {
        try {
            this._serverUpdate.checkUpdate(callback, ...args);
        } catch (error) {
            let content = `native更新服务端报错`
            logger.error(`update`, content, error);
            alert(content);

            callback(...args);
        }
    }

    /** 检查更新完毕 */
    private checkUpdateComplete() {
        logger.log('update', `检查更新完毕`);
        this.sendIpcMsg(`CHECK_UPDATE_COMPLETE`);
    }

    /** 从客户端进入 */
    private onStartNativeClient(queryValue: string) {
        this.setConfigData2LocalStorage();
        let url = `${config.clientPackagePath}/index.html?${queryValue}`;
        url = path.join(url);
        location.href = url;
    }

    /** 从官网地址进入 */
    private onStartNativeWebsite() {
        this.setConfigData2LocalStorage();

        if (config.environName === define.eEnvironName.release) {
            location.href = config.bellcodeUrl;
        } else {
            location.href = config.demoBellCodeUrl;
        }
    }

    /** 从官网平台进入 */
    private onStartNativePlatform(queryObject: any) {
        this.setConfigData2LocalStorage();

        let webviewToken: string
        if (queryObject['webviewToken']) {
            webviewToken = queryObject["webviewToken"];
            delete queryObject['webviewToken']
        } else {
            webviewToken = queryObject["token"];
        }

        let queryValue = querystring.stringify(queryObject);
        let iframeSrc = `file://${config.clientPackagePath}/index.html?${queryValue}`;
        iframeSrc = path.join(iframeSrc);
        let platformObject = {
            class_id: queryObject["class_id"],
            package_id: queryObject["package_id"],
            lesson_id: queryObject["lesson_id"],
            act_id: queryObject["act_id"],
            webviewToken: webviewToken,
            back_url: queryObject["back_url"],
            iframeSrc: iframeSrc
        }
        logger.log('platform', `platformObject:`, platformObject);
        logger.rendererLog('platform', `platformObject:`, platformObject);
        logger.rendererLog('platform', `iframeSrc:`, iframeSrc);
        let platformValue = querystring.stringify(platformObject);
        //获取官网链接
        let bellPlatformDomain: string;
        if (config.environName === define.eEnvironName.release) {
            bellPlatformDomain = config.bellcodeUrl;
        } else {
            bellPlatformDomain = config.demoBellCodeUrl;
        }

        location.href = `${bellPlatformDomain}/#/bell-planet?${platformValue}`;
    }

    private setConfigData2LocalStorage() {
        if (config.nativeLoginResponse) {
            localStorage.setItem('nativeLoginResponse', JSON.stringify(config.nativeLoginResponse));
        } else {
            localStorage.removeItem('nativeLoginResponse');
        }

        if (config.nativeGameServer) {
            localStorage.setItem('nativeGameServer', JSON.stringify(config.nativeGameServer));
        } else {
            localStorage.removeItem('nativeGameServer');
        }
    }

    /** 收到游戏服务器启动完毕 */
    private onSendMsgToClient(msgId: string, ...args: any[]) {
        this.sendMsgToClient(msgId, ...args);
    }

    private onShowLoading(value: string) {
        loading.showLoading(value);
    }

    private onHideLoading() {
        loading.hideLoading();
    }

    private onSetLoadingProgress(value) {
        loading.setLoadingProgress(value);
    }

    /** 发送消息到客户端 */
    private sendMsgToClient(msgId: string, ...args: any[]) {
        if (window.frames && window.frames.length > 0) {
            window.frames[0].postMessage({ 'key': 'nativeMsg', 'value': `${[msgId, args]} ` }, '* ');
            return;
        }

        if (window) {
            window.postMessage({ 'key': 'nativeMsg', 'value': `${[msgId, args]} ` }, '* ');
            return;
        }
    }
}

let message = new Message();;
export default message;