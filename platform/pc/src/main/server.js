/**
 * @author 雪糕 
 * @desc 处理native服务器和游戏服务器的文件
 * @date 2020-02-18 11:42:29 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-19 23:13:28
 */
const http = require('http');
const url = require('url');
const Config = require('./config.js').Config;
const util = require('./util.js');
const logger = require('./logger.js');
const platform = require('./platform.js');
const message = require('./message.js');

let nativeServer;
let gameServerProcess;

async function init() {
    util.writeServerCnfValue('gameArgs', "");
    await createNativeServer(Config.eGameServerMode.gameMap);
}

/** 创建native服务器 */
async function createNativeServer(gameServerMode) {
    if (nativeServer) {
        logger.log('net', `关闭旧的native服务器`);
        Config.setGameServerInited(false);
        await closeNativeServer();
    }

    logger.log('net', '开始创建native服务器');
    nativeServer = http.createServer();
    nativeServer.listen(0);
    nativeServer.on('listening', async () => {
        Config.setNativeServerPort(nativeServer.address().port);
        logger.log('net', '创建native服务器成功,端口号', Config.nativeServerPort);

        await util.writeServerCnfValue('channel', Config.channel);
        await util.writeServerCnfValue("nativePort", Config.nativeServerPort + "");
        await createGameServer(gameServerMode);
    });

    nativeServer.on('request', (req, res) => {
        let urlObj = url.parse(req.url, true);
        let args = urlObj.query;
        let pathname = urlObj.pathname;
        logger.log('net', `收到游戏服务器消息 pathname:${pathname} args`, args);
        if (pathname === "/serverState") {
            if (Config.gameServerInited) {
                logger.log('net', '判断游戏服务器已经启动了,不用操作');
                res.end();
                return;
            }
            Config.setGameServerInited(true);

            logger.log('net', '收到游戏服务器启动完毕消息');
            Config.setGameServerLocalIp(args.localIp);
            Config.setGameServerLocalPort(args.localPort);
            Config.setGameServerNatUrl(args.natUrl);
            Config.setGameServerNatPort(args.natPort);
            logger.log('net', `gameServer --> localIp:${Config.gameServerLocalIp} localPort:${Config.gameServerLocalPort} natUrl:${Config.gameServerNatUrl} natPort:${Config.gameServerNatPort}`);

            if (Config.gameServerLocalIp && Config.gameServerLocalPort) {
                let gameServer = `${Config.gameServerLocalIp}:${Config.gameServerLocalPort}`;
                logger.log('net', 'native上课客户端登录本地游戏服务器', gameServer);

                //游戏地图
                if (Config.gameServerMode === Config.eGameServerMode.gameMap) {
                    message.sendMsgToClient('nativeSignIn', gameServer);
                }
                //模板地图
                else if (Config.gameServerMode === Config.eGameServerMode.mapTemplate) {
                    message.sendMsgToClient('enterMapTemplate', gameServer);
                }
                //模板地图房间
                else if (Config.gameServerMode === Config.eGameServerMode.mapTemplateRoom) {
                    message.sendMsgToClient('enterMapTemplateRoom', gameServer);
                } else {
                    //reserve
                }
            }

            //上课渠道 并且是老师端,要上报本地ip
            if (Config.channel === Config.constChannelLesson && Config.userType != Config.eUserType.student) {
                platform.teacherUploadIp();
            }

            //关闭服务器推送
            let path = `/native?controlType=receiveStart`;
            util.requestGetHttp(Config.gameServerLocalIp, Config.gameServerLocalPort, path, null, null, () => {
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
        if (!nativeServer) {
            resolve();
            return;
        }

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
async function createGameServer(mode) {
    if (gameServerProcess) {
        logger.log('net', `关闭旧的游戏服务器`);
        await closeGameServer();
    }

    logger.log('net', '创建游戏服务器');
    Config.setGameServerMode(mode);
    let cmd = `game`;
    gameServerProcess = await util.runCmd(cmd, `${Config.rootPath}/package/server/`, "创建游戏服务器成功", "创建游戏服务器失败");
}

/** 关闭游戏服务器 */
async function closeGameServer() {
    return new Promise((resolve, reject) => {
        if (!gameServerProcess) {
            resolve();
            return;
        }

        if (!Config.gameServerInited) {
            let cmdStr = "taskkill /im game.exe /f";
            util.runCmd(cmdStr, null, `关闭游戏服务器成功`, "关闭游戏服务器错误");
            gameServerProcess = null;
            return;
        }

        let path = `/native?controlType=closeServer`
        util.requestGetHttp(Config.gameServerLocalIp, Config.gameServerLocalPort, path, null, null, () => {
            logger.log('net', `关闭游戏服务器成功`)
            gameServerProcess = null;
            resolve();
        }, () => {
            logger.error('net', `关闭游戏服务器错误`)
            gameServerProcess = null;
            resolve();
        });
    });
}

exports.init = init;
exports.createNativeServer = createNativeServer;
exports.closeGameServer = closeGameServer;