/** 
 * @Author 雪糕
 * @Description 渲染进程消息处理文件
 * @Date 2020-02-26 15:31:07
 * @FilePath \pc\src\renderer\Message.ts
 */
import { ipcRenderer, IpcRendererEvent } from "electron";
import querystring from "querystring";
import path from "path";
import tough from 'tough-cookie';

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
import FileUtil from "../common/FileUtil";

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
        this.msgMap[MsgId.SAVE_NATIVE_HEADER_SET_COOKIE] = this.onSaveNativeHeaderSetCookie.bind(this);
        this.msgMap[MsgId.START_NATIVE_CLIENT] = this.onStartNativeClient.bind(this);
        this.msgMap[MsgId.START_NATIVE_WEBSITE] = this.onStartNativeWebsite.bind(this);
        this.msgMap[MsgId.START_NATIVE_PLATFORM] = this.onStartNativePlatform.bind(this);
        this.msgMap[MsgId.START_NATIVE_URL] = this.onStartNativeUrl.bind(this);
        this.msgMap[MsgId.SEND_CLIENT_MSG] = this.onSendClientMsg.bind(this);
        this.msgMap[MsgId.SHOW_LOADING] = this.onShowLoading.bind(this);
        this.msgMap[MsgId.HIDE_LOADING] = this.onHideLoading.bind(this);
        this.msgMap[MsgId.SET_LOADING_PROGRESS] = this.onSetLoadingProgress.bind(this);
        this.msgMap[MsgId.CHECK_PACKAGE_UPDATE] = this.checkPackageUpdate.bind(this);
        this.msgMap[MsgId.GET_NATIVE_POLICY_VERSION] = this.onGetNativePolicyVersion.bind(this);
        this.msgMap[MsgId.ERROR_REPORT] = this.onErrorReport.bind(this);
        this.msgMap[MsgId.sendMainLogToRenderer] = this.onSendMainLogToRenderer.bind(this);
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

    /** 保存客户端获取的set-cookie */
    private onSaveNativeHeaderSetCookie(headerSetCookie: string[]): void {
        rendererModel.setHeaderSetCookie(headerSetCookie);
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

    private onSendMainLogToRenderer(logType: CommonDefine.eLogType, tag: string, msg: string, ...args: any[]) {
        switch (logType) {
            case CommonDefine.eLogType.log:
                logger.log(tag, msg, ...args);
                break;
            case CommonDefine.eLogType.error:
                logger.error(tag, msg, ...args);
                break;
            case CommonDefine.eLogType.warn:
                logger.warn(tag, msg, ...args);
                break;
            case CommonDefine.eLogType.info:
                logger.info(tag, msg, ...args);
                break;
            default:
                logger.log(tag, msg, ...args);
                break;
        }
    }

    /** 检查游戏包更新 */
    private async checkPackageUpdate() {
        logger.log('update', `开始检查更新`);

        //服务器包所在目录
        let serverPackageDir = `${commonConfig.serverPackagePath}`;
        let serverDirect = false;
        let serverExists = FileUtil.existsSync(serverPackageDir);
        if (!serverExists) {
            serverDirect = true;
        } else {
            let dir = FileUtil.readdirSync(serverPackageDir);
            let zipIndex: number = dir.findIndex(value => value.search(/.*.zip/) >= 0);
            let serverVersion: number = rendererModel.getPackageVersion(CommonDefine.ePackageType.server);
            //不存在服务端版本号,或者当文件数量小于2,或者有release压缩包(zip包不完整,导致解压失败),要重新下载新的包
            if (!serverVersion || zipIndex >= 0 || dir.length < 2) {
                FileUtil.emptyDirSync(serverPackageDir);
                serverDirect = true;
            }
        }

        //客户端包所在目录
        let clientPackageDir = commonConfig.clientPackagePath;
        let clientDirect = false;
        let clientExists = FileUtil.existsSync(clientPackageDir);
        if (!clientExists) {
            clientDirect = true;
        } else {
            let dir = FileUtil.readdirSync(clientPackageDir);
            logger.log(`net`, `dir length:${dir.length}`);
            let zipIndex: number = dir.findIndex(value => value.search(/release_v.*s.zip/) >= 0);
            let clientVersion: number = rendererModel.getPackageVersion(CommonDefine.ePackageType.client);
            //不存在客户端版本号,或者当文件数量小于2,或者有release压缩包(zip包不完整,导致解压失败),要重新下载新的包
            if (!clientVersion || zipIndex >= 0 || dir.length < 2) {
                FileUtil.emptyDirSync(clientPackageDir);
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
        let url = `file://${commonConfig.clientPackagePath}/index.html?${queryValue}`;
        url = path.join(url);
        this.loadRendererURL(url);
    }

    /** 跳转到指定url */
    private onStartNativeUrl(url: string) {
        this.checkClearLocalStorage();

        const urlObj: URL = new URL(url);
        this.applySetCookie(urlObj.origin);
        this.loadRendererURL(url);
    }

    /** 从指定网址进入 */
    private onStartNativeWebsite() {
        this.checkClearLocalStorage();

        // const url = commonConfig.environName === CommonDefine.eEnvironName.release ? commonConfig.bellcodeUrl : commonConfig.demoBellCodeUrl;
        const url = new URL(`file://${commonConfig.clientPackagePath}/index.html`);
        url.searchParams.set("fakeGameMode", "lessons");

        if (commonConfig.environName === CommonDefine.eEnvironName.release) {
            url.searchParams.set("accountServer", commonConfig.releaseAccountServer);
            url.searchParams.set("serverListServer", commonConfig.releaseServerListServer);
            url.searchParams.set("uploadLogServer", commonConfig.releaseUploadLogServer);
            url.searchParams.set("bellApiOrigin", commonConfig.releaseBellApiOrigin);
        } else {
            url.searchParams.set("accountServer", commonConfig.readyAccountServer);
            url.searchParams.set("serverListServer", commonConfig.readyServerListServer);
            url.searchParams.set("uploadLogServer", commonConfig.readyUploadLogServer);
            url.searchParams.set("bellApiOrigin", commonConfig.readyBellApiOrigin);
        }

        this.loadRendererURL(url);
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
            queryObject["webviewToken"] = webviewToken;
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

        this.applySetCookie(bellPlatformDomain);
        const url = `${bellPlatformDomain}/#/bell-planet?${platformValue}`;
        logger.log('url', url);
        this.loadRendererURL(url);
    }

    /** 加载渲染URL */
    private async loadRendererURL(tUrl: string | URL) {
        this.listenClientMsg();

        let url: string;
        if (tUrl instanceof URL) {
            url = tUrl.toString();
        } else {
            url = tUrl;
        }
        location.href = url;
    }

    /** 监听客户端消息 */
    private listenClientMsg() {
        if (!window) return;

        logger.log("message", `尝试监听客户端消息`);
        window.onload = () => {
            logger.log("message", `window loaded 监听客户端消息`);
            window.addEventListener("message", this.onListenClientMsg);
        }
    }

    /** 应用set-cookie */
    private applySetCookie(url: string) {
        if (rendererModel.headerSetCookie) {
            for (const iterator of rendererModel.headerSetCookie) {
                const cookie = tough.Cookie.parse(iterator);
                logger.log('net', `cookie: `, JSON.stringify(cookie));
                util.setCookie(url, cookie.key, cookie.value, (cookie.expires as Date).getTime(), cookie.domain);
            }
        }
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

    /** 发送消息到客户端 */
    private onSendClientMsg(msgId: string, ...args: any[]) {
        const iframeElement = window.document.getElementById("planet-iframe") as HTMLIFrameElement;
        if (iframeElement) {
            iframeElement.contentWindow.postMessage({ 'key': 'nativeMsg', 'value': JSON.stringify([msgId, args]) }, '*');
            return;
        }

        if (window) {
            window.postMessage({ 'key': 'nativeMsg', 'value': JSON.stringify([msgId, args]) }, '*');
            return;
        }
    }

    private onListenClientMsg(evt: MessageEvent) {
        const { key, value } = evt.data;
        logger.log("message", `收到客户端消息`, key, value);
        ipcRenderer.send(IpcChannel.CLIENT_PROCESS_MESSAGE, key, ...value);
    }

    private onShowLoading(value: string) {
        loading.showLoading(value);
    }

    private onHideLoading() {
        loading.hideLoadingProgress();
    }

    private onSetLoadingProgress(value: number) {
        loading.setLoadingProgress(value);
    }
}

let message = new Message();
export default message;