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
class MainModel {

    /** native服务器端口 */
    private _nativeServerPort: number;
    public get nativeServerPort(): number {
        return this._nativeServerPort;
    }
    public setNativeServerPort(value: number) {
        this._nativeServerPort = value;
    }

    /** 游戏服务器内网ip */
    private _gameServerLocalIp: string;
    public get gameServerLocalIp(): string {
        return this._gameServerLocalIp;
    }
    public setGameServerLocalIp(value: string) {
        this._gameServerLocalIp = value;
    }

    /** 游戏服务器内网端口 */
    private _gameServerLocalPort: string;
    public get gameServerLocalPort(): string {
        return this._gameServerLocalPort;
    }
    public setGameServerLocalPort(value: string) {
        this._gameServerLocalPort = value;
    }

    /** 游戏服务器公网ip */
    private _gameServerNatUrl: string;
    public get gameServerNatUrl(): string {
        return this._gameServerNatUrl;
    }
    public setGameServerNatUrl(value: string) {
        this._gameServerNatUrl = value;
    }

    /** 游戏服务器公网端口 */
    private _gameServerNatPort: string;
    public get gameServerNatPort() {
        return this._gameServerNatPort;
    }
    public setGameServerNatPort(value: string) {
        this._gameServerNatPort = value;
    }

    /** 游戏服务器是否初始化 */
    private _gameServerInited: boolean;
    public get gameServerInited(): boolean {
        return this._gameServerInited;
    }
    public setGameServerInited(value: boolean) {
        this._gameServerInited = value;
    }

    /** 渠道号,默认bian_game,从平台那边获取的时候再赋值 */
    private _channel: string = 'bian_game';
    public get channel(): string {
        return this._channel;
    }
    public setChannel(value: string) {
        this._channel = value;
    }

    /** 登陆bell平台用的临时token */
    private _bellTempToken: string;
    public get bellTempToken(): string {
        return this._bellTempToken;
    }
    public setBellTempToken(value: string) {
        this._bellTempToken = value;
    }

    /** bell平台用的正式token */
    private _bellToken: string;
    public get bellToken(): string {
        return this._bellToken;
    }
    public setBellToken(value: string) {
        this._bellToken = value;
    }

    /** bell平台通信地址 */
    private _bellApiOrigin: string;
    public get bellApiOrigin(): string {
        return this._bellApiOrigin;
    }
    public setBellApiOrigin(value: string) {
        return this._bellApiOrigin = value;
    }

    /** bell平台回传给的参数 */
    private _bellPackageId: string;
    public get bellPackageId(): string {
        return this._bellPackageId;
    }
    public setBellPackageId(value: string) {
        this._bellPackageId = value;
    }

    /** bell平台回传给的参数 */
    private _bellLessonId: string;
    public get bellLessonId(): string {
        return this._bellLessonId;
    }
    public setBellLessonId(value: string) {
        this._bellLessonId = value;
    }

    /** bell平台回传给的参数 */
    private _bellActId: string;
    public get bellActId(): string {
        return this._bellActId;
    }
    public setBellActId(value: string) {
        this._bellActId = value;
    }

    /** bell平台回传给的url */
    private _bellBackUrl: string;
    public get bellBackUrl(): string {
        return this._bellBackUrl;
    }
    public setBellBackUrl(value: string) {
        this._bellBackUrl = value;
    }

    /** 班级id */
    private _classId: number;
    public get classId(): number {
        return this._classId;
    }
    public setClassId(value: number) {
        this._classId = value;
    }

    /** 用户类型 */
    private _userType: CommonDefine.eUserType;
    public get userType(): CommonDefine.eUserType {
        return this._userType;
    }
    public setUserType(value: CommonDefine.eUserType) {
        this._userType = value;
    }

    /** 用户名称 */
    private _realName: string;
    public get realName(): string {
        return this._realName;
    }
    public setRealName(value: string) {
        this._realName = value;
    }

    /** 用户昵称 */
    private _nickName: string;
    public get nickName(): string {
        return this._nickName;
    }
    public setNickName(value: string) {
        this._nickName = value;
    }

    /** 学生单人开服务器 */
    private _standAlone: boolean;
    public get standAlone(): boolean {
        return this._standAlone;
    }
    public setStandAlone(value: boolean) {
        this._standAlone = value;
    }

    /** 上课伪协议 路由*/
    private _lessonRouter: CommonDefine.eLessonRouter;
    public get lessonRouter(): CommonDefine.eLessonRouter {
        return this._lessonRouter;
    }
    public setLessonRouter(value: CommonDefine.eLessonRouter) {
        this._lessonRouter = value;
    }

    /** native模式 */
    private _nativeMode: CommonDefine.eNativeMode;
    public get nativeMode(): CommonDefine.eNativeMode {
        return this._nativeMode;
    }
    public setNativeMode(value: CommonDefine.eNativeMode) {
        this._nativeMode = value;
    }

    /** 游戏服务器模式 */
    private _gameServerMode: CommonDefine.eGameServerMode;
    public get gameServerMode(): CommonDefine.eGameServerMode {
        return this._gameServerMode;
    }
    public setGameServerMode(value: CommonDefine.eGameServerMode) {
        this._gameServerMode = value;
    }

    private _urlValue: string;
    /** 伪协议里url带的参数 */
    public get urlValue(): string {
        return this._urlValue;
    }
    public setUrlValue(value: string) {
        this._urlValue = decodeURIComponent(value);
    }

    private _mainWindow: BrowserWindow;
    /** 主程序窗口 */
    public get mainWindow(): BrowserWindow {
        return this._mainWindow;
    }
    public setMainWindow(value: BrowserWindow) {
        this._mainWindow = value;
    }

    private _nativeServer: Server;
    public get nativeServer(): Server {
        return this._nativeServer;
    }
    /** native服务器 */
    public setNativeServer(value: Server) {
        this._nativeServer = value;
    }

    private _gameServerProcess: ChildProcess;
    /** 游戏服务器进程 */
    public get gameServerProcess(): ChildProcess {
        return this._gameServerProcess;
    }
    public setGameServerProcess(value: ChildProcess) {
        this._gameServerProcess = value;
    }

    private _gameArgs: string;
    /** 游戏服务器启动参数 */
    public get gameArgs(): string {
        return this._gameArgs;
    }
    public setGameArgs(value: string) {
        this._gameArgs = value;
    }

    private _playerId: string;
    /** 玩家游戏id */
    public get playerId(): string {
        return this._playerId;
    }
    public setPlayerId(value: string) {
        this._playerId = value;
    }

    private _playerName: string;
    /** 玩家游戏名称 */
    public get playerName(): string {
        return this._playerName;
    }
    public setPlayerName(value: string) {
        this._playerName = value;
    }

    private _bellplanetReady: boolean;
    /** 小贝星球准备完毕 */
    public get bellplanetReady(): boolean {
        return this._bellplanetReady;
    }
    public setBellplanetReady(value: boolean): void {
        this._bellplanetReady = value;
    }
}

let mainModel = new MainModel();
export default mainModel;