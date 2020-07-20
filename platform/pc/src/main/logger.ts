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

    export function clear() {
        FileUtil.writeFileSync(commonConfig.ipcMainLogPath, '', null, false);
        FileUtil.writeFileSync(commonConfig.ipcRendererLogPath, '', null, false);
    }

    /** 打印log到后台进程日志中 */
    export function processLog(tag: string, msg: string, ...args: any[]) {
        let content = formateMsg(tag, msg, ...args);
        content = content.replace(/\\n/g, '\r\n');

        processLogContent += content + '\r\n';
        FileUtil.writeFileSync(commonConfig.processLogPath, processLogContent, null, false);
    }

    /** 打印web端log到本地日志文件中 */
    export function webContentsLog(tag: string, msg: string, ...args: any[]) {
        let content = formateMsg(tag, msg, ...args);
        content = content.replace(/\\n/g, '\r\n');

        webContentsLogContent += content + '\r\n';
        FileUtil.writeFileSync(commonConfig.ipcMainLogPath, webContentsLogContent, null, false);
    }

    /** 打印日志 */
    export function log(tag: string, msg: string, ...args: any[]) {
        message.sendIpcMsgNoLog(MsgId.sendMainLogToRenderer, CommonDefine.eLogType.log, tag, msg, ...args);
        webContentsLog(tag, msg, ...args);
    }

    /** 打印错误 */
    export function error(tag: string, msg: string, ...args: any[]) {
        message.sendIpcMsgNoLog(MsgId.sendMainLogToRenderer, CommonDefine.eLogType.error, tag, msg, ...args);
        if (!commonConfig.isPackaged) {
            message.sendIpcMsg(MsgId.ERROR_REPORT, msg);
        }
        webContentsLog(tag, msg, ...args);
    }

    /** 打印警告 */
    export function warn(tag: string, msg: string, ...args: any[]) {
        message.sendIpcMsgNoLog(MsgId.sendMainLogToRenderer, CommonDefine.eLogType.warn, tag, msg, ...args);
        webContentsLog(tag, msg, ...args);
    }

    /** 打印信息 */
    export function info(tag: string, msg: string, ...args: any[]) {
        message.sendIpcMsgNoLog(MsgId.sendMainLogToRenderer, CommonDefine.eLogType.info, tag, msg, ...args);
        webContentsLog(tag, msg, ...args);
    }

    /** 格式化消息 */
    export function formateMsg(tag: string, msg: string, ...args: any[]) {
        let date = formatDate(new Date());
        let argStr = args && args.length > 0 ? `:${JSON.stringify(args)}` : "";
        let content = `[native][${tag}]${date}\t${msg}${argStr}`;
        return content
    }

    /** 格式化时间 */
    export function formatDate(date: Date) {
        let month = date.getMonth() + 1;
        let format = `${date.getFullYear()}-${month}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
        return format;
    }
}
