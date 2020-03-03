/**
 * @author 雪糕
 * @desc 渲染进程消息处理文件
 * @date 2020-02-26 15:31:07
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-03 21:42:53
 */
import { Config } from './Config.js';
import { ClientUpdate } from './update/ClientUpdate.js';
import { ServerUpdate } from './update/ServerUpdate.js';
import * as logger from './logger.js';
import * as util from './util.js';
let ipcRenderer = require('electron').ipcRenderer;
let querystring = require('querystring');
let fs = require('fs');

//消息对应方法集合
let msgMap = {
    'SAVE_NATIVE_LOGIN_RESPONSE': onSaveNativeLoginResponse,    //保存native平台登陆信息
    'SAVE_NATIVE_SERVER_IP_PORT': onSaveNativeServerIpPort,     //设置native服务器内网ip和端口
    'START_NATIVE_GAME': onStartNativeGame,  //开始游戏模式
    'START_NATIVE_LESSON': onStartNativeLesson,  //开始单个课程
    'START_NATIVE_PLATFORM': onStartNativePlatform,  //开始平台进入
    'CHECK_UPDATE': onCheckUpdate,  //检查更新 
}

let clientUpdate = new ClientUpdate();
let serverUpdate = new ServerUpdate();


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

/** 检查更新 */
async function onCheckUpdate() {
    // if (confirm("确认开始游戏吗")) {
    //     checkServerUpdate(checkClientUpdate, checkUpdateComplete);
    // }

    /** 服务器包所在目录 */
    let serverPackageDir = `${Config.serverPackagePath}server`;
    let exists = await fs.existsSync(serverPackageDir);
    if (!exists) {
        directDownloadServer(checkClientUpdate, checkUpdateComplete);
        return;
    }

    let dir = await fs.readdirSync(serverPackageDir);
    if (dir.length == 0) {
        directDownloadServer(checkClientUpdate, checkUpdateComplete);
        return;
    }

    let isServerLatestVersion = await serverUpdate.checkLatestVersion();
    let isClientLatestVersion = await clientUpdate.checkLatestVersion();
    //两个版本都一致
    if (isServerLatestVersion && isClientLatestVersion) {
        checkUpdateComplete();
        return;
    }

    //服务端版本一致, 直接检查更新客户端
    if (isServerLatestVersion) {
        checkClientUpdate(checkUpdateComplete);
        return;
    }

    //服务端版本不一致,先提示是否更新
    if (confirm('检测到游戏版本更新,是否更新?')) {
        checkServerUpdate(checkClientUpdate, checkUpdateComplete);
        return
    }

    //不更新
    checkUpdateComplete();
}

/** 直接下载最新服务端包 */
function directDownloadServer(callback, ...args) {
    try {
        util.setGlobalConfigValue("serverPackageVersion", 0);
        serverUpdate.checkUpdate(callback, ...args);
    } catch (error) {
        let content = `native下次服务端出错,点击重试`;
        logger.error(`update`, content, error);
        alert(content);
        directDownloadServer(callback, ...args);
    }
}

/** 检查客户端包更新 */
function checkClientUpdate(callback, ...args) {
    try {
        clientUpdate.checkUpdate(callback, ...args);
    } catch (error) {
        let content = `native更新客户端报错`
        logger.error(`update`, content, error);
        alert(content);

        callback(...args);
    }
}

/** 检查服务端包更新 */
function checkServerUpdate(callback, ...args) {
    try {
        serverUpdate.checkUpdate(callback, ...args);
    } catch (error) {
        let content = `native更新服务端报错`
        logger.error(`update`, content, error);
        alert(content);

        callback(...args);
    }
}

/** 检查更新完毕 */
function checkUpdateComplete() {
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

    sendMsg(`CHECK_UPDATE_COMPLETE`);
}

/** 开始游戏模式 */
async function onStartNativeGame(queryObject) {
    let queryValue = querystring.stringify(queryObject);
    let jumpHref = `${Config.rootPath}/package/client/index.html?${queryValue}`;
    location.href = jumpHref;
}

/** 开始单个课程 */
async function onStartNativeLesson(queryObject) {
    let queryValue = querystring.stringify(queryObject);
    let jumpHref = `${Config.rootPath}/package/client/index.html?${queryValue}`;
    location.href = jumpHref;
}

/** 开始平台进入 */
async function onStartNativePlatform(queryObject) {
    let queryValue = querystring.stringify(queryObject);
    let iframeSrc = `file://${Config.rootPath}/package/client/index.html?${queryValue}`;
    let platformObject = {
        class_id: queryObject["class_id"],
        package_id: queryObject["package_id"],
        lesson_id: queryObject["lesson_id"],
        act_id: queryObject["act_id"],
        webviewToken: queryObject["token"],
        iframeSrc: iframeSrc
    }
    let platformValue = querystring.stringify(platformObject);
    //获取官网链接
    let bellPlatformDomain = await util.getGlobalConfigValue("bellPlatformDomain");

    location.href = `${bellPlatformDomain}?${platformValue}`;
}