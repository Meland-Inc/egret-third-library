/**
 * @author 雪糕 
 * @desc renderer用的logger类
 * @date 2020-02-13 14:54:24 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-21 20:48:09
 */
export function log(tag: string, msg: string, ...args: any[]) {
    let content = formateMsg(tag, msg, ...args);
    console.log(content);
}

export function error(tag: string, msg: string, ...args: any[]) {
    let content = formateMsg(tag, msg, ...args);
    console.error(content);
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