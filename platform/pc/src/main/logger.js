/**
 * @author 雪糕 
 * @desc main用的logger类
 * @date 2020-02-13 14:54:34 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-21 16:18:42
 */
const fs = require('fs');
const config = require('./config.js');

let stdLog;

function init() {
    stdLog = '';
}

/** 打印log到后台进程日志中 */
function processLog(tag, msg, ...args) {
    /** 后台进程放到日志文件中 */
    let content = formateMsg(tag, msg, ...args);
    content = content.replace(/\\n/g, '\r\n')
    stdLog += content + '\r\n';
    fs.writeFileSync(config.processLogPath, stdLog);
}

/** 打印日志 */
function log(tag, msg, ...args) {
    let content = formateMsg(tag, msg, ...args);
    if (config.mainWindow && config.mainWindow.isEnabled && config.mainWindow.webContents) {
        config.mainWindow.webContents.executeJavaScript(`console.log(\'${content}\');`);
    } else {
        processLog(tag, msg, ...args);
    }
}

/** 打印错误 */
function error(tag, msg, ...args) {
    let content = formateMsg(tag, msg, ...args);
    if (config.mainWindow && config.mainWindow.isEnabled && config.mainWindow.webContents) {
        config.mainWindow.webContents.executeJavaScript(`console.error(\'${content}\');`);
    } else {
        processLog(tag, msg, ...args);
    }
}

/** 打印警告 */
function warn(tag, msg, ...args) {
    let content = formateMsg(tag, msg, ...args);
    if (config.mainWindow && config.mainWindow.isEnabled && config.mainWindow.webContents) {
        config.mainWindow.webContents.executeJavaScript(`console.warn(\'${content}\');`);
    } else {
        processLog(tag, msg, ...args);
    }
}

/** 打印信息 */
function info(tag, msg, ...args) {
    let content = formateMsg(tag, msg, ...args);
    if (config.mainWindow && config.mainWindow.isEnabled && config.mainWindow.webContents) {
        config.mainWindow.webContents.executeJavaScript(`console.info(\'${content}\');`);
    } else {
        processLog(tag, msg, ...args);
    }
}

/** 格式化消息 */
function formateMsg(tag, msg, ...args) {
    let date = formatDate(new Date());
    let argStr = args && args.length > 0 ? `:${JSON.stringify(args)}` : "";
    let content = `[native][${tag}]${date}\t${msg}${argStr}`;
    return content
}

/** 格式化时间 */
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
exports.processLog = processLog;