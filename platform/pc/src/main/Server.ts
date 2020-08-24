/** 
 * @Author 雪糕
 * @Description 处理native服务器和游戏服务器的文件
 * @Date 2020-02-18 11:42:29
 * @FilePath \pc\src\main\Server.ts
 */
import os from 'os';
import treeKill from 'tree-kill';
import http from 'http';
import url from 'url';
import { AddressInfo } from 'net';
import { ChildProcess } from 'child_process';

import { CommonDefine } from '../common/CommonDefine';
import commonConfig from '../common/CommonConfig';
import MsgId from '../common/MsgId';

import { util } from './util';
import { logger } from './logger';
import mainModel from './MainModel';
import platform from './Platform';
import message from './Message';
import FileUtil from '../common/FileUtil';

class Server {
    private _tryGameServerCount: number;

    public async init(): Promise<void> {
        mainModel.setGameArgs("");
        await this.createNativeServer(CommonDefine.eGameServerMode.gameMap);
    }

    /** 创建native服务器 */
    public async createNativeServer(tGameServerMode: CommonDefine.eGameServerMode): Promise<void> {
        if (mainModel.nativeServer) {
            logger.log('net', `关闭旧的native服务器`);
            await this.closeNativeServer();
        }

        logger.log('net', '开始创建native服务器');
        const nativeServer = http.createServer();
        mainModel.setNativeServer(nativeServer);
        mainModel.nativeServer.listen(0);

        mainModel.nativeServer.on('request', (tReq: { url: string }, tRes: { end: () => void }) => {
            const urlObj = url.parse(tReq.url, true);
            const args = urlObj.query;
            const pathname = urlObj.pathname;
            logger.log('net', `收到游戏服务器消息 pathname:${pathname} args`, args);
            if (pathname === CommonDefine.eNativeServerPathname.serverState) {
                if (mainModel.gameServerInited) {
                    logger.log('net', '判断游戏服务器已经启动了,不用操作');
                    tRes.end();
                    return;
                }
                mainModel.setGameServerInited(true);

                //初始化游戏服务器参数
                this.initGameServerArgs(args);

                //检查上报老师Ip
                this.checkTeacherUploadIp();

                //关闭服务器推送            
                this.sendReceiveStart();

                tRes.end();
                return;
            }

            if (pathname === CommonDefine.eNativeServerPathname.serverLog) {
                logger.log('net', `收到服务器日志上报 lv:${args.lv}, msg`, args.msg);
                tRes.end();
                return;
            }

            // res.end('hello world !');
            tRes.end();
        });

        mainModel.nativeServer.on('listening', async () => {
            mainModel.setNativeServerPort((mainModel.nativeServer.address() as AddressInfo).port);
            logger.log('net', '创建native服务器成功,端口号', mainModel.nativeServerPort);

            util.writeServerCnfValue('channel', mainModel.channel);
            util.writeServerCnfValue("nativePort", mainModel.nativeServerPort + "");

            await this.createGameServer(tGameServerMode);
        });
    }


    /** 初始化游戏服务器参数 */
    private initGameServerArgs(tArgs: Record<string, unknown>): void {
        logger.log('net', '收到游戏服务器启动完毕消息');
        // config.setGameServerLocalIp(args.localIp as string);
        mainModel.setGameServerLocalIp(commonConfig.localIp as string);      //本地IP暂时先用127.0.0.1 保证本机切换网络不会出现问题, 其他人全用内网穿透后的ip
        mainModel.setGameServerLocalPort(tArgs.localPort as string);
        mainModel.setGameServerNatUrl(tArgs.natUrl as string);
        mainModel.setGameServerNatPort(tArgs.natPort as string);
        logger.log('net', `gameServer --> localIp:${mainModel.gameServerLocalIp} localPort:${mainModel.gameServerLocalPort} natUrl:${mainModel.gameServerNatUrl} natPort:${mainModel.gameServerNatPort}`);

        if (mainModel.gameServerLocalIp && mainModel.gameServerLocalPort) {
            let gameServer: string = `${mainModel.gameServerLocalIp}:${mainModel.gameServerLocalPort}`;
            let hasParam: boolean = false;
            if (tArgs.canedit && tArgs.canedit === "true") {
                gameServer += `?canedit=${tArgs.canedit}`;
                hasParam = true;
            }

            if (tArgs.rw && tArgs.rw != "0") {
                const sign = hasParam ? `&` : `?`;
                gameServer += `${sign}rw=${tArgs.rw}`;
            }

            logger.log('net', `mainModel.gameServerMode:${mainModel.gameServerMode}, 登录本地游戏服务器`, gameServer);

            //游戏地图
            if (mainModel.gameServerMode === CommonDefine.eGameServerMode.gameMap) {
                message.sendClientMsg(MsgId.nativeSignIn, gameServer);
            }
            //模板地图
            else if (mainModel.gameServerMode === CommonDefine.eGameServerMode.mapTemplate) {
                message.sendClientMsg(MsgId.enterMapTemplate, gameServer);
            }
            //模板地图房间
            else if (mainModel.gameServerMode === CommonDefine.eGameServerMode.mapTemplateRoom) {
                message.sendClientMsg(MsgId.enterMapTemplateRoom, gameServer);
            }
            else {
                //reserve
            }
        }
    }

    //上课渠道 并且是老师端,并且不是备课的时候,要上报本地ip
    private checkTeacherUploadIp(): void {
        if (mainModel.channel === commonConfig.constChannelLesson
            && mainModel.userType != CommonDefine.eUserType.student
            && mainModel.classId) {
            platform.teacherUploadIp();
        }
    }

    //关闭服务器推送
    private sendReceiveStart(): void {
        const path = `/native?controlType=receiveStart`;
        util.requestGetHttp(mainModel.gameServerLocalIp, mainModel.gameServerLocalPort, path, null, null, () => {
            logger.log('net', `关闭游戏服务器启动推送成功`);
        }, () => {
            logger.error('net', `关闭游戏服务器启动推送错误`);
        });
    }

    /** 关闭native服务器 */
    public closeNativeServer(): Promise<void> {
        return new Promise((tResolve: () => void, tReject: () => void) => {
            if (!mainModel.nativeServer) {
                tResolve();
                return;
            }

            mainModel.nativeServer.close((tErr: unknown) => {
                if (tErr) {
                    logger.error('net', `关闭native服务器失败`, tErr);
                } else {
                    logger.log('net', `关闭native服务器成功`);
                }
                mainModel.setNativeServer(null);
                tResolve();
            });
        });
    }

    // 设置游戏运行权限
    private assignGameXPermission(tPaths: string[]): Promise<unknown> {
        return new Promise((tResolve: () => void, tReject: (...tParam: unknown[]) => void) => {
            for (const path of tPaths) {
                //0o100 --> fs.constants.S_IXUSR
                FileUtil.chmod(path, 0o100, (tErr: unknown) => {
                    if (tErr) {
                        tReject(tErr);
                    }
                });
            }
            tResolve();
        });
    }

    /** 创建游戏服务器 */
    private async createGameServer(tMode: CommonDefine.eGameServerMode): Promise<void> {
        if (mainModel.gameServerProcess) {
            logger.log('net', `关闭旧的游戏服务器`);
            try {
                await this.closeGameServer();
            } catch (error) {
                logger.error('net', `关闭游戏服务器错误`, error);
            }
        }

        logger.log('net', '创建游戏服务器 mode', tMode);
        mainModel.setGameServerMode(tMode);
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
        this._tryGameServerCount = 0;
        this.tryRunGameServerCmd(cmd);
    }

    /** 尝试创建游戏服务器,创建失败后,重试 */
    private async tryRunGameServerCmd(tCmd: string): Promise<void> {
        await util.runCmd(tCmd, `${commonConfig.serverPackagePath}/`, "创建游戏服务器成功", "创建游戏服务器失败")
            .then((tGameServerProcess: ChildProcess) => {
                mainModel.setGameServerProcess(tGameServerProcess);
            })
            .catch((tReason: string) => {
                //3次重试 3秒后重试
                setTimeout(async () => {
                    if (this._tryGameServerCount < 3) {
                        logger.error(`server`, `gameServer启动失败, 尝试重启`, tReason);
                        this.tryRunGameServerCmd(tCmd);
                        this._tryGameServerCount++;
                    } else {
                        logger.error(`server`, `gameServer启动失败, 超过重试次数`, tReason);
                        message.sendClientMsg("gameServerStartupFail");
                        await util.copyLog2UploadDir()
                            .then(() => {
                                util.uploadLogFileList();
                            });
                    }
                }, 3000);
            });
    }

    /** 关闭游戏服务器 */
    public closeGameServer(): Promise<void> {
        return new Promise((tResolve: () => void, tReject: (...tParam: unknown[]) => void) => {
            if (!mainModel.gameServerProcess) {
                tResolve();
                return;
            }

            if (!mainModel.gameServerInited) {
                // let cmdStr = "taskkill /im game.exe /f";
                // util.runCmd(cmdStr, null, `关闭游戏服务器成功`, "关闭游戏服务器错误");
                logger.log('net', `关闭游戏服务器`);
                treeKill(mainModel.gameServerProcess.pid, 15, (tError: unknown) => {
                    // treeKill(config.gameServerProcess.pid, (error) => {
                    if (tError) {
                        logger.error('net', `kill 关闭游戏服务器错误`, tError);
                        tReject(tError);
                        return;
                    }
                    logger.log('net', `kill 关闭游戏服务器成功`);
                    mainModel.setGameServerProcess(null);
                    tResolve();
                });
                return;
            }

            const path = `/native?controlType=closeServer`;
            util.requestGetHttp(mainModel.gameServerLocalIp, mainModel.gameServerLocalPort, path, null, null, () => {
                logger.log('net', `关闭游戏服务器成功`);
                mainModel.setGameServerInited(false);
                mainModel.setGameServerProcess(null);
                tResolve();
            }, (tError: unknown) => {
                logger.error('net', `关闭游戏服务器错误`);
                mainModel.setGameServerInited(false);
                tReject(tError);
            });
        });
    }
}

const server = new Server();
export default server;