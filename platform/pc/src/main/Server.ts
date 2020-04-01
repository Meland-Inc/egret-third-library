/**
 * @author 雪糕 
 * @desc 处理native服务器和游戏服务器的文件
 * @date 2020-02-18 11:42:29 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-31 20:27:22
 */
import fs from 'fs';
import os from 'os';
import treeKill from 'tree-kill';
import http from 'http';
import url from 'url';
import { ChildProcess } from 'child_process';
import { AddressInfo } from 'net';

import { util } from './util';
import { logger } from './logger';
import { define } from './define';
import config from './Config';
import platform from './Platform';
import message from './Message';

class Server {
    private _tryGameServerCount: number;

    public async init() {
        util.writeServerCnfValue('gameArgs', "");
        await this.createNativeServer(define.eGameServerMode.gameMap);
    }

    /** 创建native服务器 */
    public async createNativeServer(gameServerMode: define.eGameServerMode) {
        if (config.nativeServer) {
            logger.log('net', `关闭旧的native服务器`);
            await this.closeNativeServer();
        }

        logger.log('net', '开始创建native服务器');
        let nativeServer = http.createServer();
        config.setNativeServer(nativeServer);
        config.nativeServer.listen(0);
        config.nativeServer.on('listening', async () => {
            config.setNativeServerPort((config.nativeServer.address() as AddressInfo).port);
            logger.log('net', '创建native服务器成功,端口号', config.nativeServerPort);

            util.writeServerCnfValue('channel', config.channel);
            util.writeServerCnfValue("nativePort", config.nativeServerPort + "");

            await this.createGameServer(gameServerMode);
        });

        config.nativeServer.on('request', (req, res) => {
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
                config.setGameServerInited(true);

                logger.log('net', '收到游戏服务器启动完毕消息');
                config.setGameServerLocalIp(args.localIp as string);
                config.setGameServerLocalPort(args.localPort as string);
                config.setGameServerNatUrl(args.natUrl as string);
                config.setGameServerNatPort(args.natPort as string);
                logger.log('net', `gameServer --> localIp:${config.gameServerLocalIp} localPort:${config.gameServerLocalPort} natUrl:${config.gameServerNatUrl} natPort:${config.gameServerNatPort}`);

                if (config.gameServerLocalIp && config.gameServerLocalPort) {
                    let gameServer: string = `${config.gameServerLocalIp}:${config.gameServerLocalPort}`;
                    let hasParam: boolean = false;
                    if (args.canedit && args.canedit === "true") {
                        gameServer += `?canedit=${args.canedit}`;
                        hasParam = true;
                    }

                    if (args.rw && args.rw != "0") {
                        let sign = hasParam ? `&` : `?`;
                        gameServer += `${sign}rw=${args.rw}`;
                    }

                    logger.log('net', 'native上课客户端登录本地游戏服务器', gameServer);

                    //游戏地图
                    if (config.gameServerMode === define.eGameServerMode.gameMap) {
                        message.sendMsgToClient('nativeSignIn', gameServer);
                    }
                    //模板地图
                    else if (config.gameServerMode === define.eGameServerMode.mapTemplate) {
                        message.sendMsgToClient('enterMapTemplate', gameServer);
                    }
                    //模板地图房间
                    else if (config.gameServerMode === define.eGameServerMode.mapTemplateRoom) {
                        message.sendMsgToClient('enterMapTemplateRoom', gameServer);
                    } else {
                        //reserve
                    }
                }

                //上课渠道 并且是老师端,并且不是备课的时候,要上报本地ip
                if (config.channel === config.constChannelLesson
                    && config.userType != define.eUserType.student
                    && config.classId) {
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

            // res.end('hello world !');
            res.end();
        })
    }

    /** 关闭native服务器 */
    public closeNativeServer() {
        return new Promise((resolve, reject) => {
            if (!config.nativeServer) {
                resolve();
                return;
            }

            config.nativeServer.close((err) => {
                if (err) {
                    logger.error('net', `关闭native服务器失败`, err);
                } else {
                    logger.log('net', `关闭native服务器成功`);
                }
                config.setNativeServer(null);
                resolve();
            });
        })
    }

    // 设置游戏运行权限
    private assignGameXPermission(paths: string[]) {
        return new Promise((resolve, reject) => {
            for (let path of paths) {
                //0o100 --> fs.constants.S_IXUSR
                fs.chmod(path, 0o100, (err) => {
                    if (err) {
                        reject(err);
                    }
                });
            }
            resolve();
        })
    }

    /** 创建游戏服务器 */
    private async createGameServer(mode: define.eGameServerMode) {
        if (config.gameServerProcess) {
            logger.log('net', `关闭旧的游戏服务器`);
            try {
                await this.closeGameServer();
            } catch (error) {
                logger.error('net', `关闭游戏服务器错误`, error);
            }
        }

        logger.log('net', '创建游戏服务器');
        config.setGameServerMode(mode);
        let cmd: string;
        if (os.platform() === "win32") {
            cmd = `game`;
        } else {
            cmd = `./game`;
        }
        this.assignGameXPermission([
            `${config.serverPackagePath}/game`,
            `${config.serverPackagePath}/ngrok`
        ]);
        // let gameServerProcess: ChildProcess = await util.runCmd(cmd, `${config.serverPackagePath}/`, "创建游戏服务器成功", "创建游戏服务器失败");
        // config.setGameServerProcess(gameServerProcess);
        this._tryGameServerCount = 0;
        this.tryRunGameServerCmd(cmd);
    }

    /** 尝试创建游戏服务器,创建失败后,重试 */
    private async tryRunGameServerCmd(cmd: string) {
        try {
            let gameServerProcess: ChildProcess = await util.runCmd(cmd, `${config.serverPackagePath}/`, "创建游戏服务器成功", "创建游戏服务器失败");
            config.setGameServerProcess(gameServerProcess);
        } catch (error) {
            //3次重试 3秒后重试
            setTimeout(() => {
                if (this._tryGameServerCount < 3) {
                    logger.error(`server`, `gameServer启动失败, 尝试重启`, error);
                    this.tryRunGameServerCmd(cmd);
                    this._tryGameServerCount++;
                } else {
                    message.sendMsgToClient("gameServerStartupFail");
                }
            }, 3000);
        }
    }

    /** 关闭游戏服务器 */
    public closeGameServer() {
        return new Promise((resolve, reject) => {
            if (!config.gameServerProcess) {
                resolve();
                return;
            }

            if (!config.gameServerInited) {
                // let cmdStr = "taskkill /im game.exe /f";
                // util.runCmd(cmdStr, null, `关闭游戏服务器成功`, "关闭游戏服务器错误");
                logger.log('net', `关闭游戏服务器`);
                // treeKill(config.gameServerProcess.pid, 15, (error) => {
                treeKill(config.gameServerProcess.pid, (error) => {
                    if (error) {
                        logger.error('net', `kill 关闭游戏服务器错误`)
                        reject(error);
                        return;
                    }
                    logger.log('net', `kill 关闭游戏服务器成功`)
                    config.setGameServerProcess(null);
                    resolve();
                });
                return;
            }

            let path = `/native?controlType=closeServer`
            util.requestGetHttp(config.gameServerLocalIp, config.gameServerLocalPort, path, null, null, () => {
                logger.log('net', `关闭游戏服务器成功`)
                config.setGameServerInited(false);
                config.setGameServerProcess(null);
                resolve();
            }, () => {
                logger.error('net', `关闭游戏服务器错误`)
                config.setGameServerInited(false);
                reject();
            });
        });
    }
}

let server = new Server();
export default server;