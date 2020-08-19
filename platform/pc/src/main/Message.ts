/** 
 * @Author 雪糕
 * @Description 主进程消息处理类
 * @Date 2020-02-26 15:31:07
 * @FilePath \pc\src\main\Message.ts
 */
import { ipcMain, IpcMainEvent } from 'electron';

import MsgId from '../common/MsgId';
import IpcChannel from '../common/IpcChannel';
import { logger } from './logger';
import mainModel from './MainModel';

class Message {

    /** 消息对应方法集合 */
    private _msgMap: Map<string, () => void>;

    /** 缓存要发送给客户端的消息 */
    private _cacheClientMsgArr: { msgId: string, args: unknown[] }[];

    public constructor() {
        this._msgMap = new Map<string, () => void>();
        this._cacheClientMsgArr = [];

        this._msgMap[MsgId.BELLPLANET_CLIENT_READY] = this.onBellplanetReady.bind(this);

    }

    /** 添加ipc监听消息 */
    public addIpcListener(tMsgId: string, tCallBack: (...tParam: unknown[]) => void): void {
        this._msgMap[tMsgId] = tCallBack;
    }

    /** 移除ipc监听消息 */
    public removeIpcListener(tMsgId: string): void {
        this._msgMap[tMsgId] = null;
        delete this._msgMap[tMsgId];
    }

    /** 发送ipc消息 */
    public sendIpcMsg(tMsgId: string, ...tArgs: unknown[]): void {
        this.webContentsSendMsg(true, tMsgId, ...tArgs);
    }

    /** 发送ipc消息, 不打印log信息*/
    public sendIpcMsgNoLog(tMsgId: string, ...tArgs: unknown[]): void {
        this.webContentsSendMsg(false, tMsgId, ...tArgs);
    }

    /** 通过webContents发送消息 */
    private webContentsSendMsg(tShowLog: boolean, tMsgId: string, ...tArgs: unknown[]): void {
        if (!mainModel.mainWindow) return;
        if (mainModel.mainWindow.isDestroyed()) return;
        if (!mainModel.mainWindow.webContents) return;
        if (mainModel.mainWindow.webContents.isDestroyed()) return;

        if (tShowLog) {
            logger.log('main', `发送主进程消息:${tMsgId} args`, ...tArgs);
        }

        mainModel.mainWindow.webContents.send(IpcChannel.MAIN_PROCESS_MESSAGE, tMsgId, ...tArgs);
    }

    /** 初始化 */
    public init(): void {
        logger.log('main', `初始化主进程监听消息`);

        //监听渲染进程消息
        ipcMain.on(IpcChannel.RENDERER_PROCESS_MESSAGE, (tEvt: IpcMainEvent, tMsgId: string, ...tArgs: unknown[]) => {
            logger.log('main', `收到渲染进程消息:${tMsgId} args`, ...tArgs);
            this.applyIpcMsg(tMsgId, ...tArgs);
        });

        //监听 客户端消息 应用 或者 转发给渲染进程
        ipcMain.on(IpcChannel.CLIENT_PROCESS_MESSAGE, (tEvt: IpcMainEvent, tMsgId: string, ...tArgs: unknown[]) => {
            logger.log('main', `收到客户端消息:${tMsgId} args`, ...tArgs);
            this.applyIpcMsg(tMsgId, ...tArgs);    //应用
            // sendIpcMsg(msgId, ...args);     //转发
        });
    }

    /** 应用渲染进程消息 */
    private applyIpcMsg(tMsgId: string, ...tArgs: unknown[]): void {
        const func = this._msgMap[tMsgId];
        if (func) {
            func(...tArgs);
        }
    }

    /** 发送消息到客户端 */
    public sendClientMsg(tMsgId: string, ...tArgs: unknown[]): void {
        if (!mainModel.bellplanetReady) {
            this._cacheClientMsgArr.push({ msgId: tMsgId, args: tArgs });
            return;
        }

        this.executeClientMsg(tMsgId, ...tArgs);
    }

    /** 收到小贝星球准备完毕 */
    private onBellplanetReady(): void {
        mainModel.setBellplanetReady(true);
        this.executeCacheClientMsgArr();
    }

    /** 执行缓存的客户端消息 */
    private executeCacheClientMsgArr(): void {
        if (!this._cacheClientMsgArr) return;
        if (this._cacheClientMsgArr.length === 0) return;
        logger.log('message', '执行客户端缓存的消息');
        for (const iterator of this._cacheClientMsgArr) {
            this.executeClientMsg(iterator.msgId, ...iterator.args);
        }

        this._cacheClientMsgArr.length = 0;
    }

    /** 执行发送到客户端消息 */
    private executeClientMsg(tMsgId: string, ...tArgs: unknown[]): void {
        logger.log('message', `发送消息到客户端 key:${tMsgId} value`, ...tArgs);
        this.sendIpcMsg(MsgId.SEND_CLIENT_MSG, tMsgId, ...tArgs);
    }
}

const message = new Message();
export default message;