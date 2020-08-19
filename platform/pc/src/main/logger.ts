/** 
 * @Author 雪糕
 * @Description main用的logger类
 * @Date 2020-02-13 14:54:34
 * @FilePath \pc\src\main\logger.ts
 */
import commonConfig from '../common/CommonConfig';
import MsgId from '../common/MsgId';

import message from './Message';
import { CommonDefine } from '../common/CommonDefine';
import FileUtil from '../common/FileUtil';

export namespace logger {
    let processLogContent: string = '';
    let webContentsLogContent: string = '';

    export function clear(): void {
        FileUtil.writeFileSync(commonConfig.ipcMainLogPath, '', null, false);
        FileUtil.writeFileSync(commonConfig.ipcRendererLogPath, '', null, false);
    }

    /** 打印log到后台进程日志中 */
    export function processLog(tTag: string, tMsg: string, ...tArgs: unknown[]): void {
        let content = formateMsg(tTag, tMsg, ...tArgs);
        content = content.replace(/\\n/g, '\r\n');

        processLogContent += content + '\r\n';
        FileUtil.writeFileSync(commonConfig.processLogPath, processLogContent, null, false);
    }

    /** 打印web端log到本地日志文件中 */
    export function webContentsLog(tTag: string, tMsg: string, ...tArgs: unknown[]): void {
        let content = formateMsg(tTag, tMsg, ...tArgs);
        content = content.replace(/\\n/g, '\r\n');

        webContentsLogContent += content + '\r\n';
        FileUtil.writeFileSync(commonConfig.ipcMainLogPath, webContentsLogContent, null, false);
    }

    /** 打印日志 */
    export function log(tTag: string, tMsg: string, ...tArgs: unknown[]): void {
        message.sendIpcMsgNoLog(MsgId.sendMainLogToRenderer, CommonDefine.eLogType.log, tTag, tMsg, ...tArgs);
        webContentsLog(tTag, tMsg, ...tArgs);
    }

    /** 打印错误 */
    export function error(tTag: string, tMsg: string, ...tArgs: unknown[]): void {
        message.sendIpcMsgNoLog(MsgId.sendMainLogToRenderer, CommonDefine.eLogType.error, tTag, tMsg, ...tArgs);
        if (!commonConfig.isPackaged) {
            message.sendIpcMsg(MsgId.ERROR_REPORT, tMsg);
        }
        webContentsLog(tTag, tMsg, ...tArgs);
    }

    /** 打印警告 */
    export function warn(tTag: string, tMsg: string, ...tArgs: unknown[]): void {
        message.sendIpcMsgNoLog(MsgId.sendMainLogToRenderer, CommonDefine.eLogType.warn, tTag, tMsg, ...tArgs);
        webContentsLog(tTag, tMsg, ...tArgs);
    }

    /** 打印信息 */
    export function info(tTag: string, tMsg: string, ...tArgs: unknown[]): void {
        message.sendIpcMsgNoLog(MsgId.sendMainLogToRenderer, CommonDefine.eLogType.info, tTag, tMsg, ...tArgs);
        webContentsLog(tTag, tMsg, ...tArgs);
    }

    /** 格式化消息 */
    export function formateMsg(tTag: string, tMsg: string, ...tArgs: unknown[]): string {
        const date = formatDate(new Date());
        const argStr = tArgs && tArgs.length > 0 ? `:${JSON.stringify(tArgs)}` : "";
        const content = `[native][${tTag}]${date}\t${tMsg}${argStr}`;
        return content;
    }

    /** 格式化时间 */
    export function formatDate(tDate: Date): string {
        const month = tDate.getMonth() + 1;
        const format = `${tDate.getFullYear()}-${month}-${tDate.getDate()} ${tDate.getHours()}:${tDate.getMinutes()}:${tDate.getSeconds()}`;
        return format;
    }
}
