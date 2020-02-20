/**
 * @author 雪糕 
 * @desc main用的logger类
 * @date 2020-02-13 14:54:34 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-19 16:03:54
 */
const fs = require('fs');
const config = require('./config.js');

let mainWindow;
let stdLog;

function init(value) {
    mainWindow = value;
    stdLog = '';
}

function log(tag, msg, ...args) {
    let content = formateMsg(tag, msg, ...args);
    /** 后台进程放到日志文件中 */
    if (tag === 'process') {
        content = content.replace(/\\n/g, '\r\n')
        stdLog += content + '\r\n';
        fs.writeFileSync(config.processLogPath, stdLog);
        return;
    }
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.executeJavaScript(`console.log(\'${content}\');`);
    }
}

function error(tag, msg, ...args) {
    let content = formateMsg(tag, msg, ...args);
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.executeJavaScript(`console.error(\'${content}\');`);
    }
}

function warn(tag, msg, ...args) {
    let content = formateMsg(tag, msg, ...args);
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.executeJavaScript(`console.warn(\'${content}\');`);
    }
}

function info(tag, msg, ...args) {
    let content = formateMsg(tag, msg, ...args);
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.executeJavaScript(`console.info(\'${content}\');`);
    }
}

function formateMsg(tag, msg, ...args) {
    let date = formatDate(new Date());
    let argStr = args && args.length > 0 ? `:${JSON.stringify(args)}` : "";
    let content = `[native][${tag}]${date}\t${msg}${argStr}`;
    return content
}

function formatDate(date) {
    let month = date.getMonth() + 1;
    let format = `${date.getFullYear()}-${month}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    return format;
}

exports.init = init;
exports.log = log;
exports.error = error;
exports.warn = warn;
exports.info = info;