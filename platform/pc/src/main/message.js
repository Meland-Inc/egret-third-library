/**
 * @author 雪糕
 * @desc 主进程消息处理类
 * @date 2020-02-26 15:31:07
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-16 16:54:36
 */
const config = require('./config.js');
const { ipcMain } = require('electron');
const logger = require('./logger.js');
const platform = require('./platform.js');
const server = require('./server.js');
const util = require('./util.js');

//消息对应方法集合
let msgMap = {
    'CHECK_UPDATE_COMPLETE': onCheckUpdateComplete,  //检查更新
    'CREATE_GAME_SERVER': onCreateGameServer,   //启动游戏服务器
}

/** 发送主进程消息 */
function sendIpcMsg(msgId, ...args) {
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
        applyIpcMsg(msgId, ...args);
    });
}

/** 应用渲染进程消息 */
function applyIpcMsg(msgId, ...args) {
    let func = msgMap[msgId];
    if (func) {
        func(...args);
    }
}

/** 检查更新完毕 */
async function onCheckUpdateComplete() {
    await util.init();

    logger.log('config', `nativeMode:${config.nativeMode}`);

    if (config.nativeMode === config.eNativeMode.game) {
        await startNativeGame();
        return
    }

    if (config.nativeMode === config.eNativeMode.lesson) {
        await startNativeLesson();
        return;
    }

    if (config.nativeMode === config.eNativeMode.platform) {
        await startNativePlatform();
        return;
    }
}

/** 从游戏模式进入 */
async function startNativeGame() {
    logger.log('update', `从游戏模式进入`);

    //初始化参数
    let queryObject = { pcNative: 1, fakeGameMode: "lessons" };

    //本地服务器初始化
    await server.init();
    sendIpcMsg('START_NATIVE_GAME', queryObject);
}

/** 从单个课程进入 */
async function startNativeLesson() {
    // logger.log('update', `从单个课程进入`);

    // //初始化参数
    // let queryObject = { pcNative: 1 };
    // //平台初始化
    // await platform.init(queryObject);

    // queryObject['fakeUserType'] = config.userType;
    // queryObject['token'] = config.bellTempToken;

    // //非学生端 本地服务器初始化
    // if (config.userType != config.eUserType.student) {
    //     server.init();
    // }

    // logger.log('net', 'urlValue', config.urlValue);
    sendIpcMsg('START_NATIVE_LESSON');
    // config.mainWindow.loadURL("http://www.bellcode.com");
}

/** 从平台进入 */
async function startNativePlatform() {
    logger.log('update', `从平台进入`);

    //初始化参数
    let queryObject = { pcNative: 1 };
    //平台初始化
    await platform.init(queryObject);
    queryObject['fakeUserType'] = config.userType;

    logger.log(`test`, `config.userType`, config.userType);

    //非学生端 或者单人单服务器 本地服务器初始化
    if (config.userType != config.eUserType.student || config.standAlone) {
        server.init();
    }

    logger.log(`test`, `queryObject`, queryObject);

    // mainWindow.loadURL("http://www.bellcode.com");
    sendIpcMsg('START_NATIVE_PLATFORM', queryObject);
}

/** 收到创建游戏服务器 */
function onCreateGameServer() {
    server.createGameServer();
}

exports.sendIpcMsg = sendIpcMsg;
exports.init = init;
