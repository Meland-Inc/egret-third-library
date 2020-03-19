/**
 * @author 雪糕
 * @desc 渲染进程消息处理文件
 * @date 2020-02-26 15:31:07
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-20 05:37:15
 */
import { Config } from './Config.js';
import { ClientUpdate } from './update/ClientUpdate.js';
import { ServerUpdate } from './update/ServerUpdate.js';
import * as logger from './logger.js';
let ipcRenderer = require('electron').ipcRenderer;
let querystring = require('querystring');
let fs = require('fs');

//消息对应方法集合
let msgMap = {
    'UPDATE_GLOBAL_CONFIG': onUpdateGlobalConfig,//更新全局配置
    'SAVE_NATIVE_LOGIN_RESPONSE': onSaveNativeLoginResponse,    //保存native平台登陆信息
    'SAVE_NATIVE_SERVER_IP_PORT': onSaveNativeServerIpPort,     //设置native服务器内网ip和端口
    'START_NATIVE_CLIENT': onStartNativeClient,  //从客户端进入
    'START_NATIVE_WEBSITE': onStartNativeWebsite,  //开始官网地址进入
    'START_NATIVE_PLATFORM': onStartNativePlatform,  //开始平台进入
    'SEND_MSG_TO_CLIENT': onSendMsgToClient, //发送消息到客户端
}

let clientUpdate = new ClientUpdate();
let serverUpdate = new ServerUpdate();

/** 发送渲染进程消息 */
export function sendIpcMsg(msgId, ...args) {
    logger.log('renderer', `发送渲染进程消息:${msgId} args`, ...args);
    ipcRenderer.send('RENDERER_PROCESS_MESSAGE', msgId, ...args);
}

/** 初始化 */
export function init() {
    logger.log('renderer', `初始化渲染进程监听消息`);
    //监听主进程消息
    ipcRenderer.on('MAIN_PROCESS_MESSAGE', (evt, msgId, ...args) => {
        logger.log('renderer', `收到主进程消息:${msgId} args`, ...args);
        applyIpcMsg(msgId, ...args);
    });
}

/** 应用主进程消息 */
function applyIpcMsg(msgId, ...args) {
    let func = msgMap[msgId];
    if (func) {
        func(...args);
    }
}

/** 更新全局配置 */
function onUpdateGlobalConfig(globalConfig) {
    Config.globalConfig = globalConfig;
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
export async function checkUpdate() {
    logger.log('update', `开始检查更新`);

    logger.log('config', `全局配置`, Config.globalConfig);

    //服务器包所在目录
    let serverPackageDir = `${Config.serverPackagePath}server`;
    let serverDirect = false;
    let serverExists = fs.existsSync(serverPackageDir);
    if (!serverExists) {
        serverDirect = true;
    } else {
        let dir = fs.readdirSync(serverPackageDir);
        if (dir.length < 2) {
            serverDirect = true;
        }
    }

    //客户端包所在目录
    let clientPackageDir = Config.clientPackagePath;
    let clientDirect = false;
    let clientExists = fs.existsSync(clientPackageDir);
    if (!clientExists) {
        clientDirect = true;
    } else {
        let dir = fs.readdirSync(clientPackageDir);
        logger.log(`net`, `dir length:${dir.length}`);
        if (dir.length < 2) {
            clientDirect = true;
        }
    }

    if (serverDirect || clientDirect) {
        let serverUpdateFunc = serverDirect ? directDownloadServer : checkServerUpdate;
        let clientUpdateFunc = clientDirect ? directDownloadClient : checkClientUpdate;
        serverUpdateFunc(clientUpdateFunc, checkUpdateComplete);
        logger.log(`net`, `直接下载最新包`);
        return;
    }

    let isServerLatestVersion = await serverUpdate.checkLatestVersion();
    let isClientLatestVersion = await clientUpdate.checkLatestVersion();
    //两个版本都一致
    if (isServerLatestVersion && isClientLatestVersion) {
        logger.log(`net`, `检查更新完毕,客户端,服务端版本都是最新`);
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
        Config.setGlobalConfigValue("serverPackageVersion", 0);
        serverUpdate.checkUpdate(callback, ...args);
    } catch (error) {
        let content = `native下次服务端出错,点击重试`;
        logger.error(`update`, content, error);
        alert(content);
        directDownloadServer(callback, ...args);
    }
}

/** 直接下载最新的客户端包 */
function directDownloadClient(callback, ...args) {
    try {
        clientUpdate.directDownload(callback, ...args);
    } catch (error) {
        let content = `native下次客户端出错,点击重试`;
        logger.error(`update`, content, error);
        alert(content);
        directDownloadClient(callback, ...args);
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
    logger.log('update', `检查更新完毕`);
    sendIpcMsg(`CHECK_UPDATE_COMPLETE`);
}

/** 从客户端进入 */
async function onStartNativeClient(queryValue) {
    setConfigData2LocalStorage();

    location.href = `${Config.rootPath}/package/client/index.html?${queryValue}`;
    registerClientMsg();
}

/** 从官网地址进入 */
async function onStartNativeWebsite() {
    setConfigData2LocalStorage();

    if (Config.environName === Config.eEnvironName.release) {
        location.href = Config.bellcodeUrl;
    } else {
        location.href = Config.demoBellCodeUrl;
    }

    //http://wplanet.wkcoding.com/app-beta?register=1&developMode=1&fakeGameMode=lessons&register=1&banner=1&bellApiOrigin=demoapi.wkcoding.com&serverListServer=ready-server-list.wkcoding.com
    registerClientMsg();
}

/** 从官网平台进入 */
async function onStartNativePlatform(queryObject) {
    setConfigData2LocalStorage();

    let queryValue = querystring.stringify(queryObject);
    let iframeSrc = `file://${Config.rootPath}/package/client/index.html?${queryValue}`;
    let platformObject = {
        class_id: queryObject["class_id"],
        package_id: queryObject["package_id"],
        lesson_id: queryObject["lesson_id"],
        back_url: queryObject["back_url"],
        act_id: queryObject["act_id"],
        webviewToken: queryObject["token"],
        iframeSrc: iframeSrc
    }
    let platformValue = querystring.stringify(platformObject);
    //获取官网链接
    let bellPlatformDomain;
    if (Config.environName === Config.eEnvironName.release) {
        bellPlatformDomain = Config.bellcodeUrl;
    } else {
        bellPlatformDomain = Config.demoBellCodeUrl;
    }

    location.href = `${bellPlatformDomain}/#/bell-planet?${platformValue}`;
    registerClientMsg();
}

function setConfigData2LocalStorage() {
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
}

function registerClientMsg() {

}

/** 收到游戏服务器启动完毕 */
function onSendMsgToClient(msgId, ...args) {
    sendMsgToClient(msgId, ...args);
}

/** 发送消息到客户端 */
export function sendMsgToClient(msgId, ...args) {
    if (window.frames && window.frames.length > 0) {
        window.frames[0].postMessage({ 'key': 'nativeMsg', 'value': `${[msgId, args]}` }, '* ');
        return;
    }

    if (window) {
        window.postMessage({ 'key': 'nativeMsg', 'value': `${[msgId, args]}` }, '* ');
        return;
    }
}