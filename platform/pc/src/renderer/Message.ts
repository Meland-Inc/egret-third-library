/** 
 * @Author 雪糕
 * @Description 渲染进程消息处理文件
 * @Date 2020-02-26 15:31:07
 * @FilePath \pc\src\renderer\Message.ts
 */
import { ipcRenderer, IpcRendererEvent } from "electron";
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
import errorReportRenderer from "./ErrorReportRenderer";
import FileUtil from "../common/FileUtil";

class Message {
    //消息对应方法集合
    private _msgMap: Map<string, () => void>;

    private _clientUpdate: ClientUpdate;
    private _serverUpdate: ServerUpdate;

    public constructor() {
        this._clientUpdate = new ClientUpdate();
        this._serverUpdate = new ServerUpdate();

        this._msgMap = new Map<string, () => void>();
        this._msgMap[MsgId.CLEAR_RENDERER_MODEL_DATA] = this.onClearRendererModelData.bind(this);
        this._msgMap[MsgId.SAVE_NATIVE_LOGIN_RESPONSE] = this.onSaveNativeLoginResponse.bind(this);
        this._msgMap[MsgId.SAVE_NATIVE_GAME_SERVER] = this.onSaveNativeGameServer.bind(this);
        this._msgMap[MsgId.SAVE_NATIVE_HEADER_SET_COOKIE] = this.onSaveNativeHeaderSetCookie.bind(this);
        this._msgMap[MsgId.START_NATIVE_CLIENT] = this.onStartNativeClient.bind(this);
        this._msgMap[MsgId.START_NATIVE_WEBSITE] = this.onStartNativeWebsite.bind(this);
        this._msgMap[MsgId.START_NATIVE_PLATFORM] = this.onStartNativePlatform.bind(this);
        this._msgMap[MsgId.START_NATIVE_URL] = this.onStartNativeUrl.bind(this);
        this._msgMap[MsgId.SEND_CLIENT_MSG] = this.onSendClientMsg.bind(this);
        this._msgMap[MsgId.SHOW_LOADING] = this.onShowLoading.bind(this);
        this._msgMap[MsgId.HIDE_LOADING] = this.onHideLoading.bind(this);
        this._msgMap[MsgId.SET_LOADING_PROGRESS] = this.onSetLoadingProgress.bind(this);
        this._msgMap[MsgId.CHECK_PACKAGE_UPDATE] = this.checkPackageUpdate.bind(this);
        this._msgMap[MsgId.GET_NATIVE_POLICY_VERSION] = this.onGetNativePolicyVersion.bind(this);
        this._msgMap[MsgId.ERROR_REPORT] = this.onErrorReport.bind(this);
        this._msgMap[MsgId.sendMainLogToRenderer] = this.onSendMainLogToRenderer.bind(this);
    }

    /** 发送渲染进程消息 */
    public sendIpcMsg(tMsgId: string, ...tArgs: unknown[]): void {
        logger.log('renderer', `发送渲染进程消息:${tMsgId} args`, ...tArgs);
        ipcRenderer.send(IpcChannel.RENDERER_PROCESS_MESSAGE, tMsgId, ...tArgs);
    }

    /** 初始化 */
    public init(): void {
        logger.log('renderer', `初始化渲染进程监听消息`);
        //监听主进程消息
        ipcRenderer.on(IpcChannel.MAIN_PROCESS_MESSAGE, (tEvt: IpcRendererEvent, tMsgId: string, ...tArgs: unknown[]) => {
            logger.log('renderer', `收到主进程消息:${tMsgId} args`, ...tArgs);
            this.applyIpcMsg(tMsgId, ...tArgs);
        });
    }

    /** 应用主进程消息 */
    private applyIpcMsg(tMsgId: string, ...tArgs: unknown[]): void {
        const func = this._msgMap[tMsgId];
        if (func) {
            func(...tArgs);
        }
    }

    /** 清楚渲染进程数据 */
    private onClearRendererModelData(): void {
        rendererModel.clearData();
    }

    /** 保存native平台登陆信息 */
    private onSaveNativeLoginResponse(tBody: unknown): void {
        rendererModel.setNativeLoginResponse(tBody);
    }

    /** 保存native游戏服务器 */
    private onSaveNativeGameServer(tGameServer: string): void {
        rendererModel.setNativeGameServer(tGameServer);
    }

    /** 保存客户端获取的set-cookie */
    private onSaveNativeHeaderSetCookie(tHeaderSetCookie: string[]): void {
        rendererModel.setHeaderSetCookie(tHeaderSetCookie);
    }

    /** 收到获取native策略号消息 */
    private async onGetNativePolicyVersion(): Promise<void> {
        const nativePolicyVersion: number = await util.getNativePolicyNum(commonConfig.environName);
        this.sendIpcMsg(MsgId.checkNativeUpdate, nativePolicyVersion);
    }

    /** 收到错误上报 */
    private onErrorReport(tContent: string): void {
        logger.log('errorReport', `收到错误上报:${tContent}`);
        errorReportRenderer.error(tContent);
    }

    private onSendMainLogToRenderer(tLogType: CommonDefine.eLogType, tTag: string, tMsg: string, ...tArgs: unknown[]): void {
        switch (tLogType) {
            case CommonDefine.eLogType.log:
                logger.log(tTag, tMsg, ...tArgs);
                break;
            case CommonDefine.eLogType.error:
                logger.error(tTag, tMsg, ...tArgs);
                break;
            case CommonDefine.eLogType.warn:
                logger.warn(tTag, tMsg, ...tArgs);
                break;
            case CommonDefine.eLogType.info:
                logger.info(tTag, tMsg, ...tArgs);
                break;
            default:
                logger.log(tTag, tMsg, ...tArgs);
                break;
        }
    }

    /** 检查游戏包更新 */
    private async checkPackageUpdate(): Promise<void> {
        logger.log('update', `开始检查更新`);

        //服务器包所在目录
        const serverPackageDir = `${commonConfig.serverPackagePath}`;
        let serverDirect = false;
        const serverExists = FileUtil.existsSync(serverPackageDir);
        if (!serverExists) {
            serverDirect = true;
        } else {
            const dir = FileUtil.readdirSync(serverPackageDir);
            const zipIndex: number = dir.findIndex((tValue: string) => tValue.search(/.*.zip/) >= 0);
            const serverVersion: number = rendererModel.getPackageVersion(CommonDefine.ePackageType.server);
            //不存在服务端版本号,或者当文件数量小于2,或者有release压缩包(zip包不完整,导致解压失败),要重新下载新的包
            if (!serverVersion || zipIndex >= 0 || dir.length < 2) {
                FileUtil.emptyDirSync(serverPackageDir);
                serverDirect = true;
            }
        }

        //客户端包所在目录
        const clientPackageDir = commonConfig.clientPackagePath;
        let clientDirect = false;
        const clientExists = FileUtil.existsSync(clientPackageDir);
        if (!clientExists) {
            clientDirect = true;
        } else {
            const dir = FileUtil.readdirSync(clientPackageDir);
            logger.log(`net`, `dir length:${dir.length}`);
            const zipIndex: number = dir.findIndex((tValue: string) => tValue.search(/release_v.*s.zip/) >= 0);
            const localClientVersion: number = rendererModel.getPackageVersion(CommonDefine.ePackageType.client);   //本地客户端版本号
            const remoteClientVersion: number = await this._clientUpdate.getCurClientGameVersion(); //线上客户端版本号
            //不存在客户端版本号,或者当文件数量小于2,或者有release压缩包(zip包不完整,导致解压失败),要重新下载新的包, 或者版本号大于10
            if (!localClientVersion
                || zipIndex >= 0
                || dir.length < 2
                || (remoteClientVersion && remoteClientVersion - localClientVersion > 10)) {
                FileUtil.emptyDirSync(clientPackageDir);
                clientDirect = true;
            }
        }

        if (serverDirect || clientDirect) {
            const serverUpdateFunc = serverDirect ? this.directDownloadServer.bind(this) : this.checkServerUpdate.bind(this);
            const clientUpdateFunc = clientDirect ? this.directDownloadClient.bind(this) : this.checkClientUpdate.bind(this);
            serverUpdateFunc(clientUpdateFunc, this.checkUpdateComplete.bind(this));
            logger.log(`net`, `直接下载最新包`);
            return;
        }

        const isServerLatestVersion = await this._serverUpdate.checkLatestVersion();
        const isClientLatestVersion = await this._clientUpdate.checkLatestVersion();
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
    private directDownloadServer(tCallback: (...tArgs: unknown[]) => void, ...tArgs: unknown[]): void {
        try {
            rendererModel.setPackageVersion(CommonDefine.ePackageType.server, commonConfig.environName, 0);
            this._serverUpdate.checkUpdate(tCallback, ...tArgs);
        } catch (error) {
            const content = `native下载服务端出错,点击重试`;
            logger.error(`update`, content, error);
            alert(content + error);
            this.directDownloadServer(tCallback, ...tArgs);
        }
    }

    /** 直接下载最新的客户端包 */
    private directDownloadClient(tCallback: (...tArgs: unknown[]) => void, ...tArgs: unknown[]): void {
        try {
            this._clientUpdate.directDownload(tCallback, ...tArgs);
        } catch (error) {
            const content = `native下载客户端出错,点击重试`;
            logger.error(`update`, content, error);
            alert(content + error);
            this.directDownloadClient(tCallback, ...tArgs);
        }
    }

    /** 检查客户端包更新 */
    private checkClientUpdate(tCallback: (...tArgs: unknown[]) => void, ...tArgs: unknown[]): void {
        try {
            this._clientUpdate.checkUpdate(tCallback, ...tArgs);
        } catch (error) {
            const content = `native更新客户端报错`;
            logger.error(`update`, content, error);
            alert(content);

            tCallback(...tArgs);
        }
    }

    /** 检查服务端包更新 */
    private checkServerUpdate(tCallback: (...tArgs: unknown[]) => void, ...tArgs: unknown[]): void {
        try {
            this._serverUpdate.checkUpdate(tCallback, ...tArgs);
        } catch (error) {
            const content = `native更新服务端报错`;
            logger.error(`update`, content, error);
            alert(content);

            tCallback(...tArgs);
        }
    }

    /** 检查更新完毕 */
    private checkUpdateComplete(): void {
        logger.log('update', `检查更新完毕`);
        this.sendIpcMsg(MsgId.CHECK_UPDATE_COMPLETE);
    }

    /** 从客户端进入 */
    private onStartNativeClient(tQueryValue: string): void {
        this.checkClearLocalStorage();
        const url = new URL(`file://${commonConfig.clientPackagePath}/index.html?${tQueryValue}`);
        this.applySetCookie(url.origin);
        this.loadRendererURL(url);
    }

    /** 跳转到指定url */
    private onStartNativeUrl(tUrl: string): void {
        this.checkClearLocalStorage();

        const urlObj: URL = new URL(tUrl);
        this.applySetCookie(urlObj.origin);
        this.loadRendererURL(tUrl);
    }

    /** 从指定网址进入 */
    private onStartNativeWebsite(): void {
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
    private onStartNativePlatform(tSearchParamsValue: string): void {
        const searchParams = new URLSearchParams(tSearchParamsValue);
        this.checkClearLocalStorage();

        logger.log('platform', `onStartNativePlatform searchParams`, searchParams.toString());

        logger.log("platform", `start native platform searchParams`, searchParams);
        const iframeUrl = new URL(`file://${commonConfig.clientPackagePath}/index.html`);
        for (const [key, value] of searchParams) {
            iframeUrl.searchParams.set(key, value);
        }

        logger.rendererLog('platform', `iframeSrc:`, iframeUrl.toString());
        //获取官网链接
        let bellPlatformDomain: string;
        if (commonConfig.environName === CommonDefine.eEnvironName.release) {
            bellPlatformDomain = commonConfig.bellcodeUrl;
        } else {
            bellPlatformDomain = commonConfig.demoBellCodeUrl;
        }

        const webviewToken: string = this.getWebviewToken(searchParams);
        searchParams.set('webviewToken', webviewToken);

        this.applySetCookie(bellPlatformDomain);
        const newSearchParams = new URLSearchParams();
        newSearchParams.set("class_id", searchParams.get("class_id"));
        newSearchParams.set("package_id", searchParams.get("package_id"));
        newSearchParams.set("lesson_id", searchParams.get("lesson_id"));
        newSearchParams.set("act_id", searchParams.get("act_id"));
        newSearchParams.set("webviewToken", webviewToken);
        newSearchParams.set("back_url", searchParams.get("back_url"));
        newSearchParams.set("iframeSrc", iframeUrl.toString());

        const newURL = `${bellPlatformDomain}/#/bell-planet?${newSearchParams.toString()}`;
        logger.log('platform', `newURL`, newURL);

        this.loadRendererURL(newURL);
    }

    private getWebviewToken(tSearchParams: URLSearchParams): string {
        const queryObjectWebviewToken: string = tSearchParams.get('webviewToken');
        const queryObjectToken: string = tSearchParams.get('token');
        if (queryObjectWebviewToken) return queryObjectWebviewToken;
        if (queryObjectToken) return queryObjectToken;

        return null;
    }

    /** 加载渲染URL */
    private loadRendererURL(tUrl: string | URL): void {
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
    private listenClientMsg(): void {
        if (!window) return;

        logger.log("message", `尝试监听客户端消息`);
        window.onload = (): void => {
            logger.log("message", `window loaded 监听客户端消息`);
            window.addEventListener("message", this.onListenClientMsg);
        };
    }

    /** 应用set-cookie */
    private applySetCookie(tUrl: string): void {
        if (rendererModel.headerSetCookie) {
            for (const iterator of rendererModel.headerSetCookie) {
                const cookie = tough.Cookie.parse(iterator);
                logger.log('net', `cookie: `, JSON.stringify(cookie));
                util.setCookie(tUrl, cookie.key, cookie.value, (cookie.expires as Date).getTime(), cookie.domain);
            }
        }
    }

    /** 检查删除本地存储 */
    private checkClearLocalStorage(): void {
        if (!rendererModel.nativeLoginResponse) {
            localStorage.removeItem('nativeLoginResponse');
        }

        if (!rendererModel.nativeGameServer) {
            localStorage.removeItem('nativeGameServer');
        }
    }

    /** 发送消息到客户端 */
    private onSendClientMsg(tMsgId: string, ...tArgs: unknown[]): void {
        const iframeElement = window.document.getElementById("planet-iframe") as HTMLIFrameElement;
        if (iframeElement) {
            iframeElement.contentWindow.postMessage({ 'key': 'nativeMsg', 'value': JSON.stringify([tMsgId, tArgs]) }, '*');
            return;
        }

        if (window) {
            window.postMessage({ 'key': 'nativeMsg', 'value': JSON.stringify([tMsgId, tArgs]) }, '*');

        }
    }

    private onListenClientMsg(tEvt: MessageEvent): void {
        const { key, value } = tEvt.data;
        logger.log("message", `收到客户端消息`, key, value);
        ipcRenderer.send(IpcChannel.CLIENT_PROCESS_MESSAGE, key, ...value);
    }

    private onShowLoading(tValue: string): void {
        loading.showLoading(tValue);
    }

    private onHideLoading(): void {
        loading.hideLoadingProgress();
    }

    private onSetLoadingProgress(tValue: number): void {
        loading.setLoadingProgress(tValue);
    }
}

const message = new Message();
export default message;