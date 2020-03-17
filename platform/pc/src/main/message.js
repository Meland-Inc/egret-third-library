/**
 * @author 雪糕
 * @desc 主进程消息处理类
 * @date 2020-02-26 15:31:07
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-17 18:43:02
 */
const config = require('./config.js');
const { ipcMain } = require('electron');
const logger = require('./logger.js');
const platform = require('./platform.js');
const server = require('./server.js');
const util = require('./util.js');

//消息对应方法集合
let msgMap = {
    'UPDATE_GLOBAL_CONFIG': onUpdateGlobalConfig,//更新全局配置
    'CHECK_UPDATE_COMPLETE': onCheckUpdateComplete,  //检查更新
    'MAP_TEMPLATE_ENTER': onMapTemplateEnter,   //启动地图模板游戏服务器
    'MAP_TEMPLATE_ROOM_CREATE': onMapTemplateRoomCreate,   //启动地图模板房间游戏服务器
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

    //监听 客户端消息 应用 或者 转发给渲染进程
    ipcMain.on('CLIENT_PROCESS_MESSAGE', (evt, msgId, ...args) => {
        logger.log('main', `收到客户端消息:${msgId} args`, ...args);
        applyIpcMsg(msgId, ...args);    //应用
        // sendIpcMsg(msgId, ...args);     //转发
    });
}

/** 应用渲染进程消息 */
function applyIpcMsg(msgId, ...args) {
    let func = msgMap[msgId];
    if (func) {
        func(...args);
    }
}

/** 更新全局配置 */
function onUpdateGlobalConfig(globalConfig) {
    config.globalConfig = globalConfig;
}

/** 检查更新完毕 */
async function onCheckUpdateComplete() {
    await util.init();

    logger.log('config', `nativeMode:${config.nativeMode}`);

    if (config.nativeMode === config.eNativeMode.createMap) {
        await startCreateMap();
        return;
    }

    if (config.nativeMode === config.eNativeMode.game) {
        await startNativeGame();
        return
    }

    if (config.nativeMode === config.eNativeMode.website) {
        await startNativeWebsite();
        return;
    }

    if (config.nativeMode === config.eNativeMode.platform) {
        await startNativePlatform();
        return;
    }
}

/** 从创造地图模式进入 */
async function startCreateMap() {
    let queryValue = config.urlValue.slice(config.urlValue.indexOf("?") + 1);
    queryValue += `&nativeMode=${config.eNativeMode.createMap}`;
    logger.log('update', `从创造地图模式进入`);
    sendIpcMsg('START_CREATE_MAP', queryValue);
}

/** 从游戏模式进入 */
async function startNativeGame() {
    logger.log('update', `从游戏模式进入`);

    //初始化参数
    let queryObject = { fakeGameMode: "lessons", nativeMode: config.eNativeMode.game };

    //本地服务器初始化
    await server.init();
    sendIpcMsg('START_NATIVE_GAME', queryObject);
}

/** 官网地址进入 */
async function startNativeWebsite() {
    sendIpcMsg('START_NATIVE_WEBSITE');
}

/** 从平台进入 */
async function startNativePlatform() {
    logger.log('update', `从平台进入`);

    //初始化参数
    let queryObject = {};
    //平台初始化
    await platform.init(queryObject);
    queryObject['fakeUserType'] = config.userType;
    queryObject['nativeMode'] = config.eNativeMode.platform;

    logger.log(`test`, `config.userType`, config.userType);

    //非学生端 或者单人单服务器 本地服务器初始化
    if (config.userType != config.eUserType.student || config.standAlone) {
        server.init();
    }

    logger.log(`test`, `queryObject`, queryObject);

    // mainWindow.loadURL("http://www.bellcode.com");
    sendIpcMsg('START_NATIVE_PLATFORM', queryObject);
}

/** 收到地图模板游戏服务器 */
function onMapTemplateEnter(gid, gameArgs) {
    logger.log('msg', `gid gameArgs`, gid, gameArgs);
    logger.log('msg', `globalConfig`, util.globalConfig);
    util.setGlobalConfigValue('gid', gid);
    util.setGlobalConfigValue('gameArgs', gameArgs);

    server.createGameServer(config.eGameServerMode.mapTemplate);
}

/** 收到地图模板房间游戏服务器 */
function onMapTemplateRoomCreate(gid, gameArgs) {
    util.setGlobalConfigValue('gid', gid);
    util.setGlobalConfigValue('gameArgs', gameArgs);

    server.createGameServer(config.eGameServerMode.mapTemplateRoom);
}

/** 发送消息到客户端 */
function sendMsgToClient(msgId, ...args) {
    // sendIpcMsg('SEND_MSG_TO_CLIENT', msgId, ...args)

    let data = [msgId, args];
    let content = JSON.stringify(data);
    config.mainWindow.webContents.executeJavaScript(`
        if(window.frames && window.frames.length > 0) {
            window.frames[0].postMessage({'key':'nativeMsg', 'value':\'${content}\'},'*');
        } else if(window){
            window.postMessage({'key':'nativeMsg', 'value':\'${content}\'},'*');
        }
    `);
}

exports.sendIpcMsg = sendIpcMsg;
exports.sendMsgToClient = sendMsgToClient;
exports.init = init;
