/** 
 * @Author 雪糕
 * @Description renderer用的logger类
 * @Date 2020-02-13 14:54:24
 * @FilePath \pc\src\renderer\logger.ts
 */
import fs from 'fs';
import { remote } from 'electron';
import errorReport from './ErrorReport';

let rendererLogContent: string = fs.readFileSync(`${remote.app.getAppPath()}/dist/log/ipcRenderer.log`, 'utf-8');
/** 打印log到后台进程日志中 */
export function rendererLog(tag: string, msg: string, ...args: any[]) {
    let content = formateMsg(tag, msg, ...args);
    content = content.replace(/\\n/g, '\r\n')
    rendererLogContent += content + '\r\n';
    fs.writeFileSync(`${remote.app.getAppPath()}/dist/log/ipcRenderer.log`, rendererLogContent);
}

export function log(tag: string, msg: string, ...args: any[]) {
    let content = formateMsg(tag, msg, ...args);
    console.log(content);
    rendererLog(tag, msg, ...args);
}

export function error(tag: string, msg: string, ...args: any[]) {
    let content = formateMsg(tag, msg, ...args);
    console.error(content);
    if (remote.app.isPackaged) {
        errorReport.error(msg);
    }
}

export function warn(tag: string, msg: string, ...args: any[]) {
    let content = formateMsg(tag, msg, ...args);
    console.warn(content);
}

export function info(tag: string, msg: string, ...args: any[]) {
    let content = formateMsg(tag, msg, ...args);
    console.info(content);
}

function formateMsg(tag: string, msg: string, ...args: any[]) {
    let date = formatDate(new Date());
    let argStr = args && args.length > 0 ? `:${JSON.stringify(args)}` : "";
    let content = `[native][${tag}]${date}\t${msg}${argStr}`;
    return content
}

function formatDate(date: Date) {
    let month = date.getMonth() + 1;
    let format = `${date.getFullYear()}-${month}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    return format;
}

// export default this;