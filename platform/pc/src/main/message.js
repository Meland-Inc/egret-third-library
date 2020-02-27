/**
 * @author 雪糕
 * @desc 主进程消息处理类
 * @date 2020-02-26 15:31:07
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-26 22:02:16
 */
const config = require('./config.js');
const { ipcMain } = require('electron');
const logger = require('./logger.js');

/** 发送主进程消息 */
function sendMsg(msgId, ...args) {
    if (!config.mainWindow) {
        logger.error('main', `发送主进程消息失败:${msgId} config.mainWindow不存在 args`, ...args);
        return;
    }

    if (!config.mainWindow.webContents) {
        logger.error('main', `发送主进程消息失败:${msgId} config.mainWindow.webContents不存在 args`, ...args);
        return;
    }

    logger.log('main', `发送主进程消息:${msgId} args`, ...args);
    config.mainWindow.webContents.send('MAIN_PROCESS_MESSAGE', msgId, ...args);
}

/** 初始化 */
function init() {
    logger.log('renderer', `初始化主进程监听消息`);

    //监听渲染进程消息
    ipcMain.on('RENDERER_PROCESS_MESSAGE', (evt, msgId, ...args) => {
        logger.log('main', `收到渲染进程消息:${msgId} args`, ...args);
        applyMsg(msgId, ...args);
    });
}

/** 应用渲染进程消息 */
function applyMsg(msgId, ...args) {

}

exports.sendMsg = sendMsg;
exports.init = init;
