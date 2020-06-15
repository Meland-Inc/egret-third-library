/** 
 * @Author 雪糕
 * @Description 处理native服务器和游戏服务器的文件
 * @Date 2020-02-18 11:42:29
 * @FilePath \pc\src\main\Server.ts
 */
import fs from 'fs';
import os from 'os';
import treeKill from 'tree-kill';
import http from 'http';
import url from 'url';
import { ChildProcess } from 'child_process';
import { AddressInfo } from 'net';

import { CommonDefine } from '../common/CommonDefine';
import commonConfig from '../common/CommonConfig';

import { util } from './util';
import { logger } from './logger';
import mainModel from './MainModel';
import platform from './Platform';
import message from './Message';

class Server {
    private _tryGameServerCount: number;

    public async init() {
        mainModel.setGameArgs("");
        await this.createNativeServer(CommonDefine.eGameServerMode.gameMap);
    }

    /** 创建native服务器 */
    public async createNativeServer(gameServerMode: CommonDefine.eGameServerMode) {
        if (mainModel.nativeServer) {
            logger.log('net', `关闭旧的native服务器`);
            await this.closeNativeServer();
        }

        logger.log('net', '开始创建native服务器');
        let nativeServer = http.createServer();
        mainModel.setNativeServer(nativeServer);
        mainModel.nativeServer.listen(0);
        mainModel.nativeServer.on('listening', async () => {
            mainModel.setNativeServerPort((mainModel.nativeServer.address() as AddressInfo).port);
            logger.log('net', '创建native服务器成功,端口号', mainModel.nativeServerPort);

            util.writeServerCnfValue('channel', mainModel.channel);
            util.writeServerCnfValue("nativePort", mainModel.nativeServerPort + "");

            await this.createGameServer(gameServerMode);
        });

        mainModel.nativeServer.on('request', (req, res) => {
            let urlObj = url.parse(req.url, true);
            let args = urlObj.query;
            let pathname = urlObj.pathname;
            logger.log('net', `收到游戏服务器消息 pathname:${pathname} args`, args);
            if (pathname === "/serverState") {
                if (mainModel.gameServerInited) {
                    logger.log('net', '判断游戏服务器已经启动了,不用操作');
                    res.end();
                    return;
                }
                mainModel.setGameServerInited(true);

                logger.log('net', '收到游戏服务器启动完毕消息');
                // config.setGameServerLocalIp(args.localIp as string);
                mainModel.setGameServerLocalIp(commonConfig.localIp as string);      //本地IP暂时先用127.0.0.1 保证本机切换网络不会出现问题, 其他人全用内网穿透后的ip
                mainModel.setGameServerLocalPort(args.localPort as string);
                mainModel.setGameServerNatUrl(args.natUrl as string);
                mainModel.setGameServerNatPort(args.natPort as string);
                logger.log('net', `gameServer --> localIp:${mainModel.gameServerLocalIp} localPort:${mainModel.gameServerLocalPort} natUrl:${mainModel.gameServerNatUrl} natPort:${mainModel.gameServerNatPort}`);

                if (mainModel.gameServerLocalIp && mainModel.gameServerLocalPort) {
                    let gameServer: string = `${mainModel.gameServerLocalIp}:${mainModel.gameServerLocalPort}`;
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

                    message.sendIpcMsg('SAVE_NATIVE_GAME_SERVER', gameServer);

                    //游戏地图
                    if (mainModel.gameServerMode === CommonDefine.eGameServerMode.gameMap) {
                        message.sendMsgToClient('nativeSignIn', gameServer);
                    }
                    //模板地图
                    else if (mainModel.gameServerMode === CommonDefine.eGameServerMode.mapTemplate) {
                        message.sendMsgToClient('enterMapTemplate', gameServer);
                    }
                    //模板地图房间
                    else if (mainModel.gameServerMode === CommonDefine.eGameServerMode.mapTemplateRoom) {
                        message.sendMsgToClient('enterMapTemplateRoom', gameServer);
                    } else {
                        //reserve
                    }
                }

                //上课渠道 并且是老师端,并且不是备课的时候,要上报本地ip
                if (mainModel.channel === commonConfig.constChannelLesson
                    && mainModel.userType != CommonDefine.eUserType.student
                    && mainModel.classId) {
                    platform.teacherUploadIp();
                }

                //关闭服务器推送
                let path = `/native?controlType=receiveStart`;
                util.requestGetHttp(mainModel.gameServerLocalIp, mainModel.gameServerLocalPort, path, null, null, () => {
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
            if (!mainModel.nativeServer) {
                resolve();
                return;
            }

            mainModel.nativeServer.close((err) => {
                if (err) {
                    logger.error('net', `关闭native服务器失败`, err);
                } else {
                    logger.log('net', `关闭native服务器成功`);
                }
                mainModel.setNativeServer(null);
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
    private async createGameServer(mode: CommonDefine.eGameServerMode) {
        if (mainModel.gameServerProcess) {
            logger.log('net', `关闭旧的游戏服务器`);
            try {
                await this.closeGameServer();
            } catch (error) {
                logger.error('net', `关闭游戏服务器错误`, error);
            }
        }

        logger.log('net', '创建游戏服务器');
        mainModel.setGameServerMode(mode);
        let cmd: string;
        if (os.platform() === "win32") {
            cmd = `game`;
        } else {
            cmd = `./game`;
        }

        //添加运行参数
        if (mainModel.gameArgs) {
            cmd += ` ${mainModel.gameArgs}`;
        }
        this.assignGameXPermission([
            `${commonConfig.serverPackagePath}/game`,
            `${commonConfig.serverPackagePath}/ngrok`
        ]);
        // let gameServerProcess: ChildProcess = await util.runCmd(cmd, `${config.serverPackagePath}/`, "创建游戏服务器成功", "创建游戏服务器失败");
        // config.setGameServerProcess(gameServerProcess);
        this._tryGameServerCount = 0;
        this.tryRunGameServerCmd(cmd);
    }

    /** 尝试创建游戏服务器,创建失败后,重试 */
    private async tryRunGameServerCmd(cmd: string) {
        try {
            let gameServerProcess: ChildProcess = await util.runCmd(cmd, `${commonConfig.serverPackagePath}/`, "创建游戏服务器成功", "创建游戏服务器失败");
            mainModel.setGameServerProcess(gameServerProcess);
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
            if (!mainModel.gameServerProcess) {
                resolve();
                return;
            }

            if (!mainModel.gameServerInited) {
                // let cmdStr = "taskkill /im game.exe /f";
                // util.runCmd(cmdStr, null, `关闭游戏服务器成功`, "关闭游戏服务器错误");
                logger.log('net', `关闭游戏服务器`);
                treeKill(mainModel.gameServerProcess.pid, 15, (error) => {
                    // treeKill(config.gameServerProcess.pid, (error) => {
                    if (error) {
                        logger.error('net', `kill 关闭游戏服务器错误`, error)
                        reject(error);
                        return;
                    }
                    logger.log('net', `kill 关闭游戏服务器成功`)
                    mainModel.setGameServerProcess(null);
                    resolve();
                });
                return;
            }

            let path = `/native?controlType=closeServer`
            util.requestGetHttp(mainModel.gameServerLocalIp, mainModel.gameServerLocalPort, path, null, null, () => {
                logger.log('net', `关闭游戏服务器成功`)
                mainModel.setGameServerInited(false);
                mainModel.setGameServerProcess(null);
                resolve();
            }, () => {
                logger.error('net', `关闭游戏服务器错误`)
                mainModel.setGameServerInited(false);
                reject();
            });
        });
    }
}

let server = new Server();
export default server;