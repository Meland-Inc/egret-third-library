/** 
 * @Author 雪糕
 * @Description 主进程的数据
 * @Date 2020-04-08 22:22:58
 * @FilePath \pc\src\main\MainModel.ts
 */
import { BrowserWindow } from 'electron';
import { Server } from 'net';
import { ChildProcess } from 'child_process';

import { CommonDefine } from '../common/CommonDefine';
import { logger } from './logger';
class MainModel {

    /** native服务器端口 */
    private _nativeServerPort: number;
    public get nativeServerPort(): number {
        return this._nativeServerPort;
    }
    public setNativeServerPort(tValue: number): void {
        this._nativeServerPort = tValue;
    }

    /** 游戏服务器内网ip */
    private _gameServerLocalIp: string;
    public get gameServerLocalIp(): string {
        return this._gameServerLocalIp;
    }
    public setGameServerLocalIp(tValue: string): void {
        this._gameServerLocalIp = tValue;
    }

    /** 游戏服务器内网端口 */
    private _gameServerLocalPort: string;
    public get gameServerLocalPort(): string {
        return this._gameServerLocalPort;
    }
    public setGameServerLocalPort(tValue: string): void {
        this._gameServerLocalPort = tValue;
    }

    /** 游戏服务器公网ip */
    private _gameServerNatUrl: string;
    public get gameServerNatUrl(): string {
        return this._gameServerNatUrl;
    }
    public setGameServerNatUrl(tValue: string): void {
        this._gameServerNatUrl = tValue;
    }

    /** 游戏服务器公网端口 */
    private _gameServerNatPort: string;
    public get gameServerNatPort(): string {
        return this._gameServerNatPort;
    }
    public setGameServerNatPort(tValue: string): void {
        this._gameServerNatPort = tValue;
    }

    /** 游戏服务器是否初始化 */
    private _gameServerInited: boolean;
    public get gameServerInited(): boolean {
        return this._gameServerInited;
    }
    public setGameServerInited(tValue: boolean): void {
        this._gameServerInited = tValue;
    }

    /** 渠道号,默认bian_game,从平台那边获取的时候再赋值 */
    private _channel: string = 'bian_game';
    public get channel(): string {
        return this._channel;
    }
    public setChannel(tValue: string): void {
        this._channel = tValue;
    }

    /** 登陆bell平台用的临时token */
    private _bellTempToken: string;
    public get bellTempToken(): string {
        return this._bellTempToken;
    }
    public setBellTempToken(tValue: string): void {
        this._bellTempToken = tValue;
    }

    /** bell平台用的正式token */
    private _bellToken: string;
    public get bellToken(): string {
        return this._bellToken;
    }
    public setBellToken(tValue: string): void {
        this._bellToken = tValue;
    }

    /** bell平台通信地址 */
    private _bellApiOrigin: string;
    public get bellApiOrigin(): string {
        return this._bellApiOrigin;
    }
    public setBellApiOrigin(tValue: string): void {
        this._bellApiOrigin = tValue;
    }

    /** bell平台回传给的参数 */
    private _bellPackageId: string;
    public get bellPackageId(): string {
        return this._bellPackageId;
    }
    public setBellPackageId(tValue: string): void {
        this._bellPackageId = tValue;
    }

    /** bell平台回传给的参数 */
    private _bellLessonId: string;
    public get bellLessonId(): string {
        return this._bellLessonId;
    }
    public setBellLessonId(tValue: string): void {
        this._bellLessonId = tValue;
    }

    /** bell平台回传给的参数 */
    private _bellActId: string;
    public get bellActId(): string {
        return this._bellActId;
    }
    public setBellActId(tValue: string): void {
        this._bellActId = tValue;
    }

    /** bell平台回传给的url */
    private _bellBackUrl: string;
    public get bellBackUrl(): string {
        return this._bellBackUrl;
    }
    public setBellBackUrl(tValue: string): void {
        this._bellBackUrl = tValue;
    }

    /** 班级id */
    private _classId: number;
    public get classId(): number {
        return this._classId;
    }
    public setClassId(tValue: number): void {
        this._classId = tValue;
    }

    /** 用户类型 */
    private _userType: CommonDefine.eUserType;
    public get userType(): CommonDefine.eUserType {
        return this._userType;
    }
    public setUserType(tValue: CommonDefine.eUserType): void {
        this._userType = tValue;
    }

    /** 用户名称 */
    private _realName: string;
    public get realName(): string {
        return this._realName;
    }
    public setRealName(tValue: string): void {
        this._realName = tValue;
    }

    /** 用户昵称 */
    private _nickName: string;
    public get nickName(): string {
        return this._nickName;
    }
    public setNickName(tValue: string): void {
        this._nickName = tValue;
    }

    /** 学生单人开服务器 */
    private _standAlone: boolean;
    public get standAlone(): boolean {
        return this._standAlone;
    }
    public setStandAlone(tValue: boolean): void {
        this._standAlone = tValue;
    }

    /** 上课伪协议 路由*/
    private _lessonRouter: CommonDefine.eLessonRouter;
    public get lessonRouter(): CommonDefine.eLessonRouter {
        return this._lessonRouter;
    }
    public setLessonRouter(tValue: CommonDefine.eLessonRouter): void {
        this._lessonRouter = tValue;
    }

    /** native模式 */
    private _nativeMode: CommonDefine.eNativeMode;
    public get nativeMode(): CommonDefine.eNativeMode {
        return this._nativeMode;
    }
    public setNativeMode(tValue: CommonDefine.eNativeMode): void {
        this._nativeMode = tValue;
        logger.log('config', `nativeMode:${this.nativeMode}`);
    }

    /** 游戏服务器模式 */
    private _gameServerMode: CommonDefine.eGameServerMode;
    public get gameServerMode(): CommonDefine.eGameServerMode {
        return this._gameServerMode;
    }
    public setGameServerMode(tValue: CommonDefine.eGameServerMode): void {
        this._gameServerMode = tValue;
    }

    private _urlValue: string;
    /** 伪协议里url带的参数 */
    public get urlValue(): string {
        return this._urlValue;
    }
    public setUrlValue(tValue: string): void {
        this._urlValue = decodeURIComponent(tValue);
    }

    private _mainWindow: BrowserWindow;
    /** 主程序窗口 */
    public get mainWindow(): BrowserWindow {
        return this._mainWindow;
    }
    public setMainWindow(tValue: BrowserWindow): void {
        this._mainWindow = tValue;
    }

    private _nativeServer: Server;
    public get nativeServer(): Server {
        return this._nativeServer;
    }
    /** native服务器 */
    public setNativeServer(tValue: Server): void {
        this._nativeServer = tValue;
    }

    private _gameServerProcess: ChildProcess;
    /** 游戏服务器进程 */
    public get gameServerProcess(): ChildProcess {
        return this._gameServerProcess;
    }
    public setGameServerProcess(tValue: ChildProcess): void {
        this._gameServerProcess = tValue;
    }

    private _gameArgs: string;
    /** 游戏服务器启动参数 */
    public get gameArgs(): string {
        return this._gameArgs;
    }
    public setGameArgs(tValue: string): void {
        this._gameArgs = tValue;
    }

    private _playerId: string;
    /** 玩家游戏id */
    public get playerId(): string {
        return this._playerId;
    }
    public setPlayerId(tValue: string): void {
        this._playerId = tValue;
    }

    private _playerName: string;
    /** 玩家游戏名称 */
    public get playerName(): string {
        return this._playerName;
    }
    public setPlayerName(tValue: string): void {
        this._playerName = tValue;
    }

    private _bellplanetReady: boolean;
    /** 小贝星球准备完毕 */
    public get bellplanetReady(): boolean {
        return this._bellplanetReady;
    }
    public setBellplanetReady(tValue: boolean): void {
        this._bellplanetReady = tValue;
    }

    private _isQuitAndInstall: boolean;
    /** 是否安装native更新,调用退出native */
    public get isQuitAndInstall(): boolean {
        return this._isQuitAndInstall;
    }
    public setIsQuitAndInstall(tValue: boolean): void {
        this._isQuitAndInstall = tValue;
    }
}

const mainModel = new MainModel();
export default mainModel;