/** 
 * @Author 雪糕
 * @Description renderer用的logger类
 * @Date 2020-02-13 14:54:24
 * @FilePath \pc\src\renderer\logger.ts
 */
import { remote } from 'electron';
import errorReportRenderer from './ErrorReportRenderer';
import FileUtil from '../common/FileUtil';

let rendererLogContent: string;
/** 打印log到后台进程日志中 */
export function rendererLog(tTag: string, tMsg: string, ...tArgs: unknown[]): void {
    let content = formateMsg(tTag, tMsg, ...tArgs);
    content = content.replace(/\\n/g, '\r\n');
    if (rendererLogContent === undefined) {
        rendererLogContent = FileUtil.readFileSync(`${remote.app.getAppPath()}/dist/log/ipcRenderer.log`, 'utf-8', false);
    }
    rendererLogContent += content + '\r\n';
    FileUtil.writeFileSync(`${remote.app.getAppPath()}/dist/log/ipcRenderer.log`, rendererLogContent, null, false);
}

export function log(tTag: string, tMsg: string, ...tArgs: unknown[]): void {
    const content = formateMsg(tTag, tMsg, ...tArgs);
    // eslint-disable-next-line no-console
    console.log(content);
    rendererLog(tTag, tMsg, ...tArgs);
}

export function error(tTag: string, tMsg: string, ...tArgs: unknown[]): void {
    const content = formateMsg(tTag, tMsg, ...tArgs);
    // eslint-disable-next-line no-console
    console.error(content);
    if (remote.app.isPackaged) {
        errorReportRenderer.error(tMsg);
    }
}

export function warn(tTag: string, tMsg: string, ...tArgs: unknown[]): void {
    const content = formateMsg(tTag, tMsg, ...tArgs);
    // eslint-disable-next-line no-console
    console.warn(content);
}

export function info(tTag: string, tMsg: string, ...tArgs: unknown[]): void {
    const content = formateMsg(tTag, tMsg, ...tArgs);
    // eslint-disable-next-line no-console
    console.info(content);
}

function formateMsg(tTag: string, tMsg: string, ...tArgs: unknown[]): string {
    const date = formatDate(new Date());
    const argStr = tArgs && tArgs.length > 0 ? `:${JSON.stringify(tArgs)}` : "";
    const content = `[native][${tTag}]${date}\t${tMsg}${argStr}`;
    return content;
}

function formatDate(tDate: Date): string {
    const month = tDate.getMonth() + 1;
    const format = `${tDate.getFullYear()}-${month}-${tDate.getDate()} ${tDate.getHours()}:${tDate.getMinutes()}:${tDate.getSeconds()}`;
    return format;
}

// export default this;