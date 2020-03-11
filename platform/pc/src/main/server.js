/**
 * @author 雪糕 
 * @desc 处理native服务器和游戏服务器的文件
 * @date 2020-02-18 11:42:29 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-11 23:36:32
 */
const http = require('http');
const url = require('url');
const fs = require('fs');
const config = require('./config.js');
const util = require('./util.js');
const logger = require('./logger.js');
const platform = require('./platform.js');

let nativeServer;
let gameServerProcess;

async function init() {
    await util.initNativeCnf();
    await createNativeServer();
}

/** 创建native服务器 */
async function createNativeServer() {
    if (nativeServer) {
        logger.log('net', `关闭旧的native服务器`);
        config.gameServerInited = false;
        await closeNativeServer();
    }

    logger.log('net', '开始创建native服务器');
    nativeServer = http.createServer();
    nativeServer.listen(0);
    nativeServer.on('listening', async () => {
        config.nativeServerPort = nativeServer.address().port;
        logger.log('net', '创建native服务器成功,端口号', config.nativeServerPort);

        await util.writeServerCnfValue('channel', config.channel);
        await util.writeServerCnfValue("nativePort", config.nativeServerPort + "");
        await createGameServer();
    });

    nativeServer.on('request', (req, res) => {
        let urlObj = url.parse(req.url, true);
        let args = urlObj.query;
        let pathname = urlObj.pathname;
        logger.log('net', `收到游戏服务器消息 pathname:${pathname} args`, args);
        if (pathname === "/serverState") {
            if (config.gameServerInited) {
                logger.log('net', '判断游戏服务器已经启动了,不用操作');
                res.end();
                return;
            }
            config.gameServerInited = true;

            logger.log('net', '收到游戏服务器启动完毕消息');
            config.gameServerLocalIp = args.localIp;
            config.gameServerLocalPort = args.localPort;
            config.gameServerNatUrl = args.natUrl;
            config.gameServerNatPort = args.natPort;
            logger.log('net', `gameServer --> localIp:${config.gameServerLocalIp} localPort:${config.gameServerLocalPort} natUrl:${config.gameServerNatUrl} natPort:${config.gameServerNatPort}`);

            if (config.gameServerLocalIp && config.gameServerLocalPort) {
                let gameServer = `${config.gameServerLocalIp}:${config.gameServerLocalPort}`;
                if (config.mainWindow && config.mainWindow.webContents) {
                    logger.log('net', 'native上课客户端登录本地游戏服务器', gameServer);
                    //上课渠道
                    if (config.channel === config.constChannelLesson) {
                        config.mainWindow.webContents.executeJavaScript(`
                            if(window.frames && window.frames.length > 0) {
                                console.log('frames-->postMessage nativeSignIn');
                                window.frames[0].postMessage({'key':'nativeSignIn', 'value':\'${gameServer}\'},'*');
                            } else if(window.nativeSignIn) {
                                console.log('nativeSignIn');
                                window.nativeSignIn(\'${gameServer}\');
                            }
                        `);
                    }
                    //游戏
                    else {
                        logger.log('net', 'native游戏客户端登录本地游戏服务器', gameServer);
                        config.mainWindow.webContents.executeJavaScript(`
                            if(window.nativeSignIn){
                                window.nativeSignIn(\'${gameServer}\');
                            }
                        `);
                    }
                }
            }

            //上课渠道 并且是老师端,要上报本地ip
            if (config.channel === config.constChannelLesson && config.userType != config.eUserType.student) {
                platform.teacherUploadIp();
            }

            //关闭服务器推送
            let path = `/native?controlType=receiveStart`;
            util.requestGetHttp(config.gameServerLocalIp, config.gameServerLocalPort, path, null, null, () => {
                logger.log('net', `关闭游戏服务器启动推送成功`)
            }, () => {
                logger.error('net', `关闭游戏服务器启动推送错误`)
            });
        }

        // if (pathname === "/test") {
        //     let obj = { data: 'lalala', data2: 'hahaha', data3: 333 };
        //     res.end(JSON.stringify(obj));
        //     return;
        // }

        // res.end('hello world !');
        res.end();
    })
}

/** 关闭native服务器 */
function closeNativeServer() {
    return new Promise((resolve, reject) => {
        nativeServer.close((err) => {
            if (err) {
                logger.error('net', `关闭native服务器失败`, err);
            } else {
                logger.log('net', `关闭native服务器成功`);
            }
            nativeServer = null;
            resolve();
        });
    })
}

/** 创建游戏服务器 */
async function createGameServer() {
    logger.log('net', '创建游戏服务器');
    let cmd = `game`;
    gameServerProcess = await util.runCmd(cmd, `${config.rootPath}/package/server/`, "创建游戏服务器成功", "创建游戏服务器失败");
}

/** 关闭游戏服务器 */
async function closeGameServer() {
    return new Promise((resolve, reject) => {
        if (!config.gameServerInited) {
            let cmdStr = "taskkill /im game.exe /f";
            util.runCmd(cmdStr, null, `关闭游戏服务器成功`, "关闭游戏服务器错误");
            return;
        }

        let path = `/native?controlType=closeServer`
        util.requestGetHttp(config.gameServerLocalIp, config.gameServerLocalPort, path, null, null, () => {
            resolve();
            logger.log('net', `关闭游戏服务器成功`)
        }, () => {
            reject();
            logger.error('net', `关闭游戏服务器错误`)
        });
    });
}

exports.init = init;
exports.closeGameServer = closeGameServer;