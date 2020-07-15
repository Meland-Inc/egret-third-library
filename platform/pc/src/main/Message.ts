/** 
 * @Author 雪糕
 * @Description 主进程消息处理类
 * @Date 2020-02-26 15:31:07
 * @FilePath \pc\src\main\Message.ts
 */
import { ipcMain, IpcMainEvent } from 'electron';
import querystring from 'querystring';

import { CommonDefine } from '../common/CommonDefine';
import commonConfig from '../common/CommonConfig';
import MsgId from '../common/MsgId';
import IpcChannel from '../common/IpcChannel';

import { logger } from './logger';
import { util } from './util';
import mainModel from './MainModel';
import platform from './Platform';
import server from './Server';
import NativeUpdate from './NativeUpdate';

class Message {
    private _nativeUpdate: NativeUpdate;

    /** 消息对应方法集合 */
    public msgMap: Map<string, () => void>;

    /** 缓存要发送给客户端的消息 */
    private _cacheClientMsgArr: { msgId: string, args: any[] }[];

    public constructor() {
        this._nativeUpdate = new NativeUpdate();
        this.msgMap = new Map<string, () => void>();
        this._cacheClientMsgArr = [];
        this.msgMap[MsgId.CHECK_UPDATE_COMPLETE] = this.onCheckUpdateComplete.bind(this);
        this.msgMap[MsgId.MAP_TEMPLATE_ENTER] = this.onMapTemplateEnter.bind(this);
        this.msgMap[MsgId.MAP_TEMPLATE_ROOM_CREATE] = this.onMapTemplateRoomCreate.bind(this);
        this.msgMap[MsgId.SEND_PLAYER_ID] = this.onSendPlayerId.bind(this);
        this.msgMap[MsgId.BELLPLANET_CLIENT_READY] = this.onBellplanetReady.bind(this);
        this.msgMap[MsgId.SET_NATIVE_POLICY_VERSION] = this.onSetNativePolicyVersion.bind(this);
    }

    /** 发送主进程消息 */
    public sendIpcMsg(msgId: string, ...args: unknown[]) {
        if (!mainModel.mainWindow) {
            logger.error('main', `发送主进程消息失败:${msgId} config.mainWindow不存在 args`, ...args);
            return;
        }

        if (!mainModel.mainWindow.webContents) {
            logger.error('main', `发送主进程消息失败:${msgId} config.mainWindow.webContents不存在 args`, ...args);
            return;
        }

        logger.log('main', `发送主进程消息:${msgId} args`, ...args);
        mainModel.mainWindow.webContents.send(IpcChannel.MAIN_PROCESS_MESSAGE, msgId, ...args);
    }

    /** 初始化 */
    public init() {
        logger.log('main', `初始化主进程监听消息`);

        //监听渲染进程消息
        ipcMain.on(IpcChannel.RENDERER_PROCESS_MESSAGE, (evt: IpcMainEvent, msgId: string, ...args: unknown[]) => {
            logger.log('main', `收到渲染进程消息:${msgId} args`, ...args);
            this.applyIpcMsg(msgId, ...args);
        });

        //监听 客户端消息 应用 或者 转发给渲染进程
        ipcMain.on(IpcChannel.CLIENT_PROCESS_MESSAGE, (evt: IpcMainEvent, msgId: string, ...args: unknown[]) => {
            logger.log('main', `收到客户端消息:${msgId} args`, ...args);
            this.applyIpcMsg(msgId, ...args);    //应用
            // sendIpcMsg(msgId, ...args);     //转发
        });
    }

    /** 应用渲染进程消息 */
    private applyIpcMsg(msgId: string, ...args: any[]) {
        let func = this.msgMap[msgId];
        if (func) {
            func(...args);
        }
    }

    /** 检查更新完毕 */
    private async onCheckUpdateComplete() {
        util.initNativeCnf();

        logger.log('config', `nativeMode:${mainModel.nativeMode}`);
        if (mainModel.nativeMode === CommonDefine.eNativeMode.banner) {
            this.startBanner();
            return;
        }

        if (mainModel.nativeMode === CommonDefine.eNativeMode.createMap) {
            await this.startCreateMap();
            return;
        }

        if (mainModel.nativeMode === CommonDefine.eNativeMode.game) {
            this.startNativeGame();
            return
        }

        if (mainModel.nativeMode === CommonDefine.eNativeMode.url) {
            this.startUrl();
            return
        }

        if (mainModel.nativeMode === CommonDefine.eNativeMode.website) {
            this.startNativeWebsite();
            return;
        }

        if (mainModel.nativeMode === CommonDefine.eNativeMode.platform) {
            await this.startNativePlatform();
            return;
        }

        if (mainModel.nativeMode === CommonDefine.eNativeMode.prestigeMap) {
            this.enterPrestigeMap();
            return;
        }
    }

    /** 从banner模式进入 */
    private startBanner() {
        let queryValue: string = mainModel.urlValue.slice(mainModel.urlValue.indexOf("?") + 1);
        queryValue += `&nativeMode=${CommonDefine.eNativeMode.banner}`;
        logger.log('update', `从banner模式进入`);
        this.sendIpcMsg(MsgId.START_NATIVE_CLIENT, queryValue);
    }

    /** 从创造地图模式进入 */
    private async startCreateMap() {
        let urlValue: string = mainModel.urlValue.slice(mainModel.urlValue.indexOf("?") + 1);
        let queryObject = querystring.parse(urlValue);
        //有banner参数,要从平台初始化
        if (queryObject["banner"]) {
            queryObject = await platform.init();
        }
        queryObject['nativeMode'] = CommonDefine.eNativeMode.createMap.toString();

        let queryValue: string = querystring.stringify(queryObject);
        logger.log('update', `从创造地图模式进入`);
        this.sendIpcMsg(MsgId.START_NATIVE_CLIENT, queryValue);
    }

    /** 从游戏模式进入 */
    private startNativeGame() {
        logger.log('update', `从游戏模式进入`);
        let urlValue = mainModel.urlValue;
        //伪协议启动参数
        logger.log('platform', `初始化平台数据`, urlValue);
        let argsValue = urlValue.slice(urlValue.indexOf("?") + 1);
        let argsObj = querystring.parse(argsValue);
        let queryObject: querystring.ParsedUrlQuery = {};
        queryObject = Object.assign(queryObject, argsObj);
        queryObject["nativeMode"] = CommonDefine.eNativeMode.game + "";

        let queryValue: string = querystring.stringify(queryObject);

        this.sendIpcMsg(MsgId.START_NATIVE_CLIENT, queryValue);
    }

    /** 跳转到指定url */
    private async startUrl() {
        logger.log('update', `从指定url进入`);
        let urlValue: string = mainModel.urlValue.slice(mainModel.urlValue.indexOf("?") + 1);
        let queryObject = querystring.parse(urlValue);
        let targetUrlValue: string = queryObject["url"] as string;
        if (!targetUrlValue) return;
        logger.log('update', `跳转到指定url`, targetUrlValue);
        logger.log('update', `queryObject: `, queryObject);
        const temporaryToken: string = queryObject["temporary_token"] as string;
        const newUrl = new URL(targetUrlValue);
        if (temporaryToken) {
            await platform.init();
            newUrl.searchParams.set("webviewToken", mainModel.bellToken);
        }

        this.sendIpcMsg(MsgId.START_NATIVE_URL, newUrl.toString());
    }

    /** 官网地址进入 */
    private startNativeWebsite() {
        logger.log('update', `从官网地址进入`);

        this.sendIpcMsg(MsgId.START_NATIVE_WEBSITE);
    }

    /** 从平台进入 */
    private async startNativePlatform() {
        logger.log('update', `从平台进入`);

        //平台初始化
        let queryObject: querystring.ParsedUrlQuery = await platform.init();
        //初始化参数
        mainModel.setChannel(commonConfig.constChannelLesson);
        queryObject['gameChannel'] = commonConfig.constChannelLesson;
        queryObject['fakeUserType'] = mainModel.userType.toString();
        queryObject['nativeMode'] = CommonDefine.eNativeMode.platform.toString();

        //非学生端 或者单人单服务器 本地服务器初始化
        if (mainModel.userType != CommonDefine.eUserType.student || mainModel.standAlone) {
            server.init();
        }

        logger.log(`test`, `queryObject`, queryObject);

        this.sendIpcMsg(MsgId.START_NATIVE_PLATFORM, queryObject);
    }

    /** 进入神庙模板地图 */
    private enterPrestigeMap() {
        logger.log('update', `从神庙模板地图模式进入`);
        let urlValue = mainModel.urlValue;
        let argsValue = urlValue.slice(urlValue.indexOf("?") + 1);
        let argsObj = querystring.parse(argsValue);
        let queryObject: querystring.ParsedUrlQuery = {};
        queryObject = Object.assign(queryObject, argsObj);
        queryObject["nativeMode"] = CommonDefine.eNativeMode.prestigeMap + "";

        let queryValue: string = querystring.stringify(queryObject);
        this.sendIpcMsg(MsgId.START_NATIVE_CLIENT, queryValue);
    }

    /** 收到地图模板游戏服务器 */
    private onMapTemplateEnter(gid: string, gameArgs: string) {
        util.writeServerCnfValue('gid', gid);
        mainModel.setGameArgs(gameArgs);

        server.createNativeServer(CommonDefine.eGameServerMode.mapTemplate);
    }

    /** 收到地图模板房间游戏服务器 */
    private onMapTemplateRoomCreate(gid: string, gameArgs: string) {
        util.writeServerCnfValue('gid', gid);
        mainModel.setGameArgs(gameArgs);

        server.createNativeServer(CommonDefine.eGameServerMode.mapTemplateRoom);
    }

    /** 收到发送过来的玩家id */
    private onSendPlayerId(playerId: string, playerName: string) {
        mainModel.setPlayerId(playerId);
        mainModel.setPlayerName(playerName);
    }

    /** 收到小贝星球准备完毕 */
    private onBellplanetReady() {
        mainModel.setBellplanetReady(true);
        this.executeCacheClientMsgArr();
    }

    private onSetNativePolicyVersion(nativeVersion: number) {
        this._nativeUpdate.checkUpdate(nativeVersion);
    }

    /** 发送消息到客户端 */
    public sendClientMsg(msgId: string, ...args: any[]) {
        if (!mainModel.bellplanetReady) {
            this._cacheClientMsgArr.push({ msgId: msgId, args: args });
            return;
        }

        this.executeClientMsg(msgId, ...args);
    }

    /** 执行缓存的客户端消息 */
    private executeCacheClientMsgArr() {
        if (!this._cacheClientMsgArr) return;
        if (this._cacheClientMsgArr.length === 0) return;
        logger.log('message', '执行客户端缓存的消息');
        for (const iterator of this._cacheClientMsgArr) {
            this.executeClientMsg(iterator.msgId, ...iterator.args);
        }

        this._cacheClientMsgArr.length = 0;
    }

    /** 执行发送到客户端消息 */
    private executeClientMsg(msgId: string, ...args: any[]) {
        logger.log('message', `发送消息到客户端 key:${msgId} value`, ...args);
        this.sendIpcMsg(MsgId.SEND_CLIENT_MSG, msgId, ...args);
    }
}

let message = new Message();
export default message;