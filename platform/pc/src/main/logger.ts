/** 
 * @Author 雪糕
 * @Description main用的logger类
 * @Date 2020-02-13 14:54:34
 * @FilePath \pc\src\main\logger.ts
 */
import fs from 'fs';

import commonConfig from '../common/CommonConfig';
import MsgId from '../common/MsgId';

import message from './Message';
import { util } from './util';

export namespace logger {
    let processLogContent: string = '';
    let webContentsLogContent: string = '';

    export function clear() {
        fs.writeFileSync(commonConfig.ipcMainLogPath, '');
        fs.writeFileSync(commonConfig.ipcRendererLogPath, '');
    }

    /** 打印log到后台进程日志中 */
    export function processLog(tag: string, msg: string, ...args: any[]) {
        let content = formateMsg(tag, msg, ...args);
        content = content.replace(/\\n/g, '\r\n');

        processLogContent += content + '\r\n';
        fs.writeFileSync(commonConfig.processLogPath, processLogContent);
    }

    /** 打印web端log到本地日志文件中 */
    export function webContentsLog(tag: string, msg: string, ...args: any[]) {
        let content = formateMsg(tag, msg, ...args);
        content = content.replace(/\\n/g, '\r\n');

        webContentsLogContent += content + '\r\n';
        fs.writeFileSync(commonConfig.ipcMainLogPath, webContentsLogContent);
    }

    /** 打印日志 */
    export function log(tag: string, msg: string, ...args: any[]) {
        let content = formateMsg(tag, msg, ...args);
        let code: string = `console.log(\'${content}\');`
        util.executeJavaScript(code, false);
        webContentsLog(tag, msg, ...args);
    }

    /** 打印错误 */
    export function error(tag: string, msg: string, ...args: any[]) {
        let content = formateMsg(tag, msg, ...args);
        let code: string = `console.error(\'${content}\');`
        util.executeJavaScript(code, false);
        if (!commonConfig.isPackaged) {
            message.sendIpcMsg(MsgId.ERROR_REPORT, msg);
        }
        webContentsLog(tag, msg, ...args);
    }

    /** 打印警告 */
    export function warn(tag: string, msg: string, ...args: any[]) {
        let content = formateMsg(tag, msg, ...args);
        let code: string = `console.warn(\'${content}\');`
        util.executeJavaScript(code, false);
        webContentsLog(tag, msg, ...args);
    }

    /** 打印信息 */
    export function info(tag: string, msg: string, ...args: any[]) {
        let content = formateMsg(tag, msg, ...args);
        let code: string = `console.info(\'${content}\');`
        util.executeJavaScript(code, false);
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

    /** 上传日志 */
    export function uploadLog() {
        let logDir = fs.readdirSync(commonConfig.uploadLogDir);
        for (const fileName of logDir) {
            let filePath = `${commonConfig.uploadLogDir}/${fileName}`;
            util.uploadLogFile(`${commonConfig.uploadLogUrl}`, fileName, filePath);
        }
    }
}
