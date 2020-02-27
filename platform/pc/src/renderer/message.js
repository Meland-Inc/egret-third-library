/**
 * @author 雪糕
 * @desc 渲染进程消息处理文件
 * @date 2020-02-26 15:31:07
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-26 22:03:18
 */
import { Config } from './Config.js';
import { ClientUpdate } from './update/ClientUpdate.js';
import * as logger from './logger.js';
let ipcRenderer = require('electron').ipcRenderer;
let querystring = require('querystring');

//消息对应方法集合
let msgMap = {
    'SAVE_NATIVE_LOGIN_RESPONSE': onSaveNativeLoginResponse,    //保存native平台登陆信息
    'SAVE_NATIVE_SERVER_IP_PORT': onSaveNativeServerIpPort,     //设置native服务器内网ip和端口
    'START_GAME': onStartGame,  //开始游戏
}

/** 发送渲染进程消息 */
export function sendMsg(msgId, ...args) {
    logger.log('renderer', `发送渲染进程消息:${msgId} args`, ...args);
    ipcRenderer.send('RENDERER_PROCESS_MESSAGE', msgId, ...args);
}

/** 初始化 */
export function init() {
    logger.log('renderer', `初始化渲染进程监听消息`);
    //监听主进程消息
    ipcRenderer.on('MAIN_PROCESS_MESSAGE', (evt, msgId, ...args) => {
        logger.log('renderer', `收到主进程消息:${msgId} args`, ...args);
        applyMsg(msgId, ...args);
    });
}

/** 应用主进程消息 */
function applyMsg(msgId, ...args) {
    let func = msgMap[msgId];
    if (func) {
        func(...args);
    }
}

/** 保存native平台登陆信息 */
function onSaveNativeLoginResponse(body) {
    Config.setNativeLoginResponse(body);
}

/** 设置native服务器内网ip和端口 */
function onSaveNativeServerIpPort(ip, port) {
    Config.setGameServerLocalIp(ip);
    Config.setGameServerLocalPort(port);
}

/** 开始游戏 */
function onStartGame(queryObject) {
    try {
        let clientUpdate = new ClientUpdate();
        clientUpdate.checkUpdate(clientUpdateCB, queryObject);
    } catch (error) {
        let content = `native更新客户端报错`
        logger.error(`update`, content, error);
        alert(content);

        clientUpdateCB(queryObject);
    }
}

/** 客户端更新回调 */
function clientUpdateCB(queryObject) {
    if (Config.nativeLoginResponse) {
        localStorage.setItem('nativeLoginResponse', JSON.stringify(Config.nativeLoginResponse));
    } else {
        localStorage.removeItem('nativeLoginResponse');
    }

    if (Config.gameServerLocalIp && Config.gameServerLocalPort) {
        localStorage.setItem('nativeGameServer', `${Config.gameServerLocalIp}:${Config.gameServerLocalPort}`);
    } else {
        localStorage.removeItem('nativeGameServer');
    }

    let queryValue = querystring.stringify(queryObject);
    location.href = `${Config.rootPath}/package/client/index.html?${queryValue}`;
}