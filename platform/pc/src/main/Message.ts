/**
 * @author 雪糕
 * @desc 主进程消息处理类
 * @date 2020-02-26 15:31:07
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-26 00:44:44
 */
import { ipcMain, IpcMainEvent } from 'electron';
import querystring from 'querystring';

import { logger } from './logger';
import { util } from './util';
import { define } from './define';
import config from './Config';
import platform from './Platform';
import server from './Server';
import NativeUpdate from './NativeUpdate';

class Message {
    private _nativeUpdate = new NativeUpdate();

    //消息对应方法集合
    public msgMap = {
        'CHECK_UPDATE_COMPLETE': this.onCheckUpdateComplete.bind(this),  //检查更新
        'MAP_TEMPLATE_ENTER': this.onMapTemplateEnter.bind(this),   //启动地图模板游戏服务器
        'MAP_TEMPLATE_ROOM_CREATE': this.onMapTemplateRoomCreate.bind(this),   //启动地图模板房间游戏服务器
        'SET_NATIVE_POLICY_VERSION': this.onSetNativePolicyVersion.bind(this),   //设置native版本号
    }

    /** 发送主进程消息 */
    public sendIpcMsg(msgId: string, ...args: any[]) {
        if (!config.mainWindow) {
            logger.error('main', `发送主进程消息失败:${msgId} config.mainWindow不存在 args`, ...args);
            return;
        }

        if (!config.mainWindow.webContents) {
            logger.error('main', `发送主进程消息失败:${msgId} config.mainWindow.webContents不存在 args`, ...args);
            return;
        }

        logger.log('main', `发送主进程消息:${msgId} args`, ...args);
        config.mainWindow.webContents.send('MAIN_PROCESS_MESSAGE', msgId, ...args);
    }

    /** 初始化 */
    public init() {
        logger.log('main', `初始化主进程监听消息`);

        //监听渲染进程消息
        ipcMain.on('RENDERER_PROCESS_MESSAGE', (evt: IpcMainEvent, msgId: string, ...args: any[]) => {
            logger.log('main', `收到渲染进程消息:${msgId} args`, ...args);
            this.applyIpcMsg(msgId, ...args);
        });

        //监听 客户端消息 应用 或者 转发给渲染进程
        ipcMain.on('CLIENT_PROCESS_MESSAGE', (evt: IpcMainEvent, msgId: string, ...args: any[]) => {
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

        logger.log('config', `nativeMode:${config.nativeMode}`);
        if (config.nativeMode === define.eNativeMode.banner) {
            this.startBanner();
            return;
        }

        if (config.nativeMode === define.eNativeMode.createMap) {
            await this.startCreateMap();
            return;
        }

        if (config.nativeMode === define.eNativeMode.game) {
            this.startNativeGame();
            return
        }

        if (config.nativeMode === define.eNativeMode.website) {
            this.startNativeWebsite();
            return;
        }

        if (config.nativeMode === define.eNativeMode.platform) {
            await this.startNativePlatform();
            return;
        }
    }

    /** 从banner模式进入 */
    private startBanner() {
        let queryValue: string = config.urlValue.slice(config.urlValue.indexOf("?") + 1);
        queryValue += `&nativeMode=${define.eNativeMode.banner}`;
        logger.log('update', `从banner模式进入`);
        this.sendIpcMsg('START_NATIVE_CLIENT', queryValue);
    }

    /** 从创造地图模式进入 */
    private async startCreateMap() {
        //平台初始化
        let queryObject = await platform.init();
        //初始化参数
        // Object.assign(queryObject, platform.queryObject);
        // queryObject['fakeUserType'] = config.userType;
        queryObject['nativeMode'] = define.eNativeMode.createMap.toString();
        let queryValue: string = querystring.stringify(queryObject);

        logger.log('update', `从创造地图模式进入`);
        this.sendIpcMsg('START_NATIVE_CLIENT', queryValue);
    }

    /** 从游戏模式进入 */
    private startNativeGame() {
        logger.log('update', `从游戏模式进入`);

        //初始化参数
        let queryObject = { fakeGameMode: "lessons", nativeMode: define.eNativeMode.game };

        //本地服务器初始化
        message.init();

        let queryValue: string = querystring.stringify(queryObject);

        this.sendIpcMsg('START_NATIVE_CLIENT', queryValue);
    }

    /** 官网地址进入 */
    private startNativeWebsite() {
        logger.log('update', `从官网地址进入`);

        this.sendIpcMsg('START_NATIVE_WEBSITE');
    }

    /** 从平台进入 */
    private async startNativePlatform() {
        logger.log('update', `从平台进入`);

        //平台初始化
        let queryObject: querystring.ParsedUrlQuery = await platform.init();
        //初始化参数
        config.setChannel(config.constChannelLesson);
        queryObject['gameChannel'] = config.constChannelLesson;
        queryObject['fakeUserType'] = config.userType.toString();
        queryObject['nativeMode'] = define.eNativeMode.platform.toString();

        //非学生端 或者单人单服务器 本地服务器初始化
        if (config.userType != define.eUserType.student || config.standAlone) {
            server.init();
        }

        logger.log(`test`, `queryObject`, queryObject);

        this.sendIpcMsg('START_NATIVE_PLATFORM', queryObject);
    }

    /** 收到地图模板游戏服务器 */
    private onMapTemplateEnter(gid: string, gameArgs: string) {
        util.writeServerCnfValue('gid', gid);
        config.setGameArgs(gameArgs);

        server.createNativeServer(define.eGameServerMode.mapTemplate);
    }

    /** 收到地图模板房间游戏服务器 */
    private onMapTemplateRoomCreate(gid: string, gameArgs: string) {
        util.writeServerCnfValue('gid', gid);
        config.setGameArgs(gameArgs);

        server.createNativeServer(define.eGameServerMode.mapTemplateRoom);
    }

    private onSetNativePolicyVersion(nativeVersion: number) {
        this._nativeUpdate.checkUpdate(nativeVersion);
    }

    /** 发送消息到客户端 */
    public sendMsgToClient(msgId: string, ...args: any[]) {
        let data = [msgId, args];
        let content = JSON.stringify(data);
        config.mainWindow.webContents.executeJavaScript(`
            if(window.frames && window.frames.length > 0) {
                window.frames[0].postMessage({'key':'nativeMsg', 'value':\'${content}\'},'*');
            } else if(window){
                window.postMessage({'key':'nativeMsg', 'value':\'${content}\'},'*');
            }
        `);
    }
}

let message = new Message();
export default message;