/**
 * @author 雪糕 
 * @desc main用的logger类
 * @date 2020-02-13 14:54:34 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-13 15:33:25
 */
function log(tag, msg, ...args) {
    let content = formateMsg(tag, msg, ...args);
    console.log(content);
}

function error(tag, msg, ...args) {
    let content = formateMsg(tag, msg, ...args);
    console.error(content);
}

function warn(tag, msg, ...args) {
    let content = formateMsg(tag, msg, ...args);
    console.warn(content);
}

function info(tag, msg, ...args) {
    let content = formateMsg(tag, msg, ...args);
    console.info(content);
}

function formateMsg(tag, msg, ...args) {
    let date = formatDate(new Date());
    let argStr = args ? `:${JSON.stringify(args)}` : "";
    let content = `[native][${tag}]${date}\t${msg}${argStr}`;
    return content
}

function formatDate(date) {
    let month = date.getMonth() + 1;
    let format = `${date.getFullYear()}-${month}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    return format;
}

exports.log = log;
exports.error = error;
exports.warn = warn;
exports.info = info;