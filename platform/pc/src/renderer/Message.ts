/** 
 * @Author 雪糕
 * @Description 渲染进程消息处理文件
 * @Date 2020-02-26 15:31:07
 * @FilePath \pc\src\renderer\Message.ts
 */
import { ipcRenderer, IpcRendererEvent } from "electron";
import querystring from "querystring";
import fs from "fs";
import fse from "fs-extra";
import path from "path";

import { CommonDefine } from '../common/CommonDefine';
import commonConfig from '../common/CommonConfig';
import MsgId from '../common/MsgId';
import IpcChannel from '../common/IpcChannel';

import rendererModel from './RendererModel';
import * as util from './util';
import * as logger from './logger';
import * as loading from './loading';
import ClientUpdate from './update/ClientUpdate';
import ServerUpdate from './update/ServerUpdate';
import errorReport from "./ErrorReport";

class Message {
    //消息对应方法集合
    private msgMap: Map<string, () => void>;

    private _clientUpdate: ClientUpdate;
    private _serverUpdate: ServerUpdate;

    public constructor() {
        this._clientUpdate = new ClientUpdate();
        this._serverUpdate = new ServerUpdate();

        this.msgMap = new Map<string, () => void>();
        this.msgMap[MsgId.SAVE_NATIVE_LOGIN_RESPONSE] = this.onSaveNativeLoginResponse.bind(this);
        this.msgMap[MsgId.SAVE_NATIVE_GAME_SERVER] = this.onSaveNativeGameServer.bind(this);
        this.msgMap[MsgId.START_NATIVE_CLIENT] = this.onStartNativeClient.bind(this);
        this.msgMap[MsgId.START_NATIVE_WEBSITE] = this.onStartNativeWebsite.bind(this);
        this.msgMap[MsgId.START_NATIVE_PLATFORM] = this.onStartNativePlatform.bind(this);
        this.msgMap[MsgId.START_NATIVE_URL] = this.onStartNativeUrl.bind(this);
        this.msgMap[MsgId.SEND_MSG_TO_CLIENT] = this.onSendMsgToClient.bind(this);
        this.msgMap[MsgId.SHOW_LOADING] = this.onShowLoading.bind(this);
        this.msgMap[MsgId.HIDE_LOADING] = this.onHideLoading.bind(this);
        this.msgMap[MsgId.SET_LOADING_PROGRESS] = this.onSetLoadingProgress.bind(this);
        this.msgMap[MsgId.CHECK_PACKAGE_UPDATE] = this.checkPackageUpdate.bind(this);
        this.msgMap[MsgId.GET_NATIVE_POLICY_VERSION] = this.onGetNativePolicyVersion.bind(this);
        this.msgMap[MsgId.ERROR_REPORT] = this.onErrorReport.bind(this);
    }

    /** 发送渲染进程消息 */
    public sendIpcMsg(msgId: string, ...args: unknown[]) {
        logger.log('renderer', `发送渲染进程消息:${msgId} args`, ...args);
        ipcRenderer.send(IpcChannel.RENDERER_PROCESS_MESSAGE, msgId, ...args);
    }

    /** 初始化 */
    public init() {
        logger.log('renderer', `初始化渲染进程监听消息`);
        //监听主进程消息
        ipcRenderer.on(IpcChannel.MAIN_PROCESS_MESSAGE, (evt: IpcRendererEvent, msgId: string, ...args: unknown[]) => {
            logger.log('renderer', `收到主进程消息:${msgId} args`, ...args);
            this.applyIpcMsg(msgId, ...args);
        });
    }

    /** 应用主进程消息 */
    private applyIpcMsg(msgId: string, ...args: unknown[]) {
        let func = this.msgMap[msgId];
        if (func) {
            func(...args);
        }
    }

    /** 保存native平台登陆信息 */
    private onSaveNativeLoginResponse(body: unknown) {
        rendererModel.setNativeLoginResponse(body);
    }

    /** 保存native游戏服务器 */
    private onSaveNativeGameServer(gameServer: string) {
        rendererModel.setNativeGameServer(gameServer);
    }

    /** 收到获取native策略号消息 */
    private async onGetNativePolicyVersion() {
        let nativePolicyVersion: number = await util.getNativePolicyNum(commonConfig.environName);
        this.sendIpcMsg(MsgId.SET_NATIVE_POLICY_VERSION, nativePolicyVersion);
    }

    /** 收到错误上报 */
    private onErrorReport(content: string) {
        logger.log('errorReport', `收到错误上报:${content}`);
        errorReport.error(content);
    }

    /** 检查游戏包更新 */
    private async checkPackageUpdate() {
        logger.log('update', `开始检查更新`);

        //服务器包所在目录
        let serverPackageDir = `${commonConfig.serverPackagePath}`;
        let serverDirect = false;
        let serverExists = fs.existsSync(serverPackageDir);
        if (!serverExists) {
            serverDirect = true;
        } else {
            let dir = fs.readdirSync(serverPackageDir);
            let zipIndex: number = dir.findIndex(value => value.search(/.*.zip/) >= 0);
            let serverVersion: number = rendererModel.getPackageVersion(CommonDefine.ePackageType.server);
            //不存在服务端版本号,或者当文件数量小于2,或者有release压缩包(zip包不完整,导致解压失败),要重新下载新的包
            if (!serverVersion || zipIndex >= 0 || dir.length < 2) {
                fse.emptyDirSync(serverPackageDir);
                serverDirect = true;
            }
        }

        //客户端包所在目录
        let clientPackageDir = commonConfig.clientPackagePath;
        let clientDirect = false;
        let clientExists = fs.existsSync(clientPackageDir);
        if (!clientExists) {
            clientDirect = true;
        } else {
            let dir = fs.readdirSync(clientPackageDir);
            logger.log(`net`, `dir length:${dir.length}`);
            let zipIndex: number = dir.findIndex(value => value.search(/release_v.*s.zip/) >= 0);
            let clientVersion: number = rendererModel.getPackageVersion(CommonDefine.ePackageType.client);
            //不存在客户端版本号,或者当文件数量小于2,或者有release压缩包(zip包不完整,导致解压失败),要重新下载新的包
            if (!clientVersion || zipIndex >= 0 || dir.length < 2) {
                fse.emptyDirSync(clientPackageDir);
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
    }

    /** 直接下载最新服务端包 */
    private directDownloadServer(callback: Function, ...args: any[]) {
        try {
            rendererModel.setPackageVersion(CommonDefine.ePackageType.server, commonConfig.environName, 0);
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
        this.checkClearLocalStorage();
        let url = `${commonConfig.clientPackagePath}/index.html?${queryValue}`;
        url = path.join(url);
        location.href = url;
    }

    /** 跳转到指定url */
    private onStartNativeUrl(url: string) {
        this.checkClearLocalStorage();
        location.href = url;
    }

    /** 从官网地址进入 */
    private onStartNativeWebsite() {
        this.checkClearLocalStorage();

        if (commonConfig.environName === CommonDefine.eEnvironName.release) {
            location.href = commonConfig.bellcodeUrl;
        } else {
            location.href = commonConfig.demoBellCodeUrl;
        }
    }

    /** 从官网平台进入 */
    private onStartNativePlatform(queryObject: querystring.ParsedUrlQuery) {
        this.checkClearLocalStorage();

        let webviewToken: string
        let queryObjectWebviewToken = queryObject['webviewToken'];
        let queryObjectToken = queryObject['token'];
        if (queryObjectWebviewToken) {
            if (Array.isArray(queryObjectWebviewToken)) {
                webviewToken = queryObjectWebviewToken[0];
            } else {
                webviewToken = queryObjectWebviewToken;
            }
        }
        else if (queryObjectToken) {
            if (Array.isArray(queryObjectToken)) {
                webviewToken = queryObjectToken[0];
            } else {
                webviewToken = queryObjectToken;
            }
            queryObject["webviewToken"] = webviewToken
        } else {
            //reserve
        }

        logger.log("platform", `start native platform queryObject`, queryObject);
        let iframeUrl = new URL(`file://${commonConfig.clientPackagePath}/index.html`);
        for (const key in queryObject) {
            if (queryObject.hasOwnProperty(key)) {
                const value = queryObject[key];
                if (Array.isArray(value)) {
                    iframeUrl.searchParams.set(key, value[0]);
                } else {
                    iframeUrl.searchParams.set(key, value);
                }
            }
        }
        let platformObject = {
            class_id: queryObject["class_id"],
            package_id: queryObject["package_id"],
            lesson_id: queryObject["lesson_id"],
            act_id: queryObject["act_id"],
            webviewToken: webviewToken,
            back_url: queryObject["back_url"],
            iframeSrc: iframeUrl.toString()
        }

        logger.log('platform', `platformObject:`, platformObject);
        logger.rendererLog('platform', `platformObject:`, platformObject);
        logger.rendererLog('platform', `iframeSrc:`, iframeUrl.toString());
        let platformValue = querystring.stringify(platformObject);
        //获取官网链接
        let bellPlatformDomain: string;
        if (commonConfig.environName === CommonDefine.eEnvironName.release) {
            bellPlatformDomain = commonConfig.bellcodeUrl;
        } else {
            bellPlatformDomain = commonConfig.demoBellCodeUrl;
        }

        logger.log('url', `${bellPlatformDomain}/#/bell-planet?${platformValue}`);
        location.href = `${bellPlatformDomain}/#/bell-planet?${platformValue}`;
    }

    /** 检查删除本地存储 */
    private checkClearLocalStorage() {
        if (!rendererModel.nativeLoginResponse) {
            localStorage.removeItem('nativeLoginResponse');
        }

        if (!rendererModel.nativeGameServer) {
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

    private onSetLoadingProgress(value: number) {
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