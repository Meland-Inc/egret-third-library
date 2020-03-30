/**
 * @author 雪糕 
 * @desc main用的logger类
 * @date 2020-02-13 14:54:34 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-26 17:59:45
 */
import fs from 'fs';
import config from './Config';
import message from './Message';

export namespace logger {
    let processLogContent: string;
    let webContentsLogContent: string;

    export function init() {
        processLogContent = '';
        webContentsLogContent = '';

        fs.writeFileSync(`${config.rootPath}/dist/log/ipcRenderer.log`, '');
    }

    /** 打印log到后台进程日志中 */
    export function processLog(tag: string, msg: string, ...args: any[]) {
        let content = formateMsg(tag, msg, ...args);
        content = content.replace(/\\n/g, '\r\n')
        processLogContent += content + '\r\n';
        fs.writeFileSync(config.processLogPath, processLogContent);
    }

    /** 打印web端log到本地日志文件中 */
    export function webContentsLog(tag: string, msg: string, ...args: any[]) {
        let content = formateMsg(tag, msg, ...args);
        content = content.replace(/\\n/g, '\r\n')
        webContentsLogContent += content + '\r\n';
        fs.writeFileSync(config.ipcMainLogPath, webContentsLogContent);
    }

    /** 打印日志 */
    export function log(tag: string, msg: string, ...args: any[]) {
        let content = formateMsg(tag, msg, ...args);
        if (config.mainWindow && config.mainWindow.isEnabled && config.mainWindow.webContents) {
            config.mainWindow.webContents.executeJavaScript(`console.log(\'${content}\');`);
        }
        webContentsLog(tag, msg, ...args);
    }

    /** 打印错误 */
    export function error(tag: string, msg: string, ...args: any[]) {
        let content = formateMsg(tag, msg, ...args);
        if (config.mainWindow && config.mainWindow.isEnabled && config.mainWindow.webContents) {
            config.mainWindow.webContents.executeJavaScript(`console.error(\'${content}\');`);
        }
        if (!config.isPackaged) {
            message.sendIpcMsg("ERROR_REPORT", msg);
        }
        webContentsLog(tag, msg, ...args);
    }

    /** 打印警告 */
    export function warn(tag: string, msg: string, ...args: any[]) {
        let content = formateMsg(tag, msg, ...args);
        if (config.mainWindow && config.mainWindow.isEnabled && config.mainWindow.webContents) {
            config.mainWindow.webContents.executeJavaScript(`console.warn(\'${content}\');`);
        }
        webContentsLog(tag, msg, ...args);
    }

    /** 打印信息 */
    export function info(tag: string, msg: string, ...args: any[]) {
        let content = formateMsg(tag, msg, ...args);
        if (config.mainWindow && config.mainWindow.isEnabled && config.mainWindow.webContents) {
            config.mainWindow.webContents.executeJavaScript(`console.info(\'${content}\');`);
        }
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
