/**
 * @author 雪糕 
 * @desc main用的logger类
 * @date 2020-02-13 14:54:34 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-19 22:48:12
 */
const fs = require('fs');
const Config = require('./config.js').Config;

let processLogContent;
let webContentsLogContent;

function init() {
    processLogContent = '';
    webContentsLogContent = '';
}

/** 打印log到后台进程日志中 */
function processLog(tag, msg, ...args) {
    let content = formateMsg(tag, msg, ...args);
    content = content.replace(/\\n/g, '\r\n')
    processLogContent += content + '\r\n';
    fs.writeFileSync(Config.processLogPath, processLogContent);
}

/** 打印web端log到本地日志文件中 */
function webContentsLog(tag, msg, ...args) {
    let content = formateMsg(tag, msg, ...args);
    content = content.replace(/\\n/g, '\r\n')
    webContentsLogContent += content + '\r\n';
    fs.writeFileSync(Config.webContentsLogPath, webContentsLogContent);
}

/** 打印日志 */
function log(tag, msg, ...args) {
    let content = formateMsg(tag, msg, ...args);
    if (Config.mainWindow && Config.mainWindow.isEnabled && Config.mainWindow.webContents) {
        Config.mainWindow.webContents.executeJavaScript(`console.log(\'${content}\');`);
        webContentsLog(tag, msg, ...args);
    } else {
        processLog(tag, msg, ...args);
    }
}

/** 打印错误 */
function error(tag, msg, ...args) {
    let content = formateMsg(tag, msg, ...args);
    if (Config.mainWindow && Config.mainWindow.isEnabled && Config.mainWindow.webContents) {
        Config.mainWindow.webContents.executeJavaScript(`console.error(\'${content}\');`);
        webContentsLog(tag, msg, ...args);
    } else {
        processLog(tag, msg, ...args);
    }
}

/** 打印警告 */
function warn(tag, msg, ...args) {
    let content = formateMsg(tag, msg, ...args);
    if (Config.mainWindow && Config.mainWindow.isEnabled && Config.mainWindow.webContents) {
        Config.mainWindow.webContents.executeJavaScript(`console.warn(\'${content}\');`);
        webContentsLog(tag, msg, ...args);
    } else {
        processLog(tag, msg, ...args);
    }
}

/** 打印信息 */
function info(tag, msg, ...args) {
    let content = formateMsg(tag, msg, ...args);
    if (Config.mainWindow && Config.mainWindow.isEnabled && Config.mainWindow.webContents) {
        Config.mainWindow.webContents.executeJavaScript(`console.info(\'${content}\');`);
        webContentsLog(tag, msg, ...args);
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