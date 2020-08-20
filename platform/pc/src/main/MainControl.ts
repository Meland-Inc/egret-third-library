/**
 * @Author 雪糕
 * @Description 主进程逻辑控制类
 * @Date 2020-08-19 11:32:58
 * @FilePath \pc\src\main\MainControl.ts
 */
import querystring from 'querystring';
import { app } from 'electron';

import message from "./Message";
import MsgId from "../common/MsgId";
import { util } from "./util";
import { logger } from "./logger";
import mainModel from "./MainModel";
import { CommonDefine } from "../common/CommonDefine";
import platform from './Platform';
import commonConfig from '../common/CommonConfig';
import server from './Server';
import NativeUpdate from './NativeUpdate';
import FileUtil from '../common/FileUtil';
class MainControl {
    private _nativeUpdate: NativeUpdate;

    /** 初始化 */
    public async init(): Promise<void> {
        this._nativeUpdate = new NativeUpdate();

        this.addIpcListener();

        //创建游戏包目录
        this.packageMkDir();

        //只有打包后的要上传日志
        if (commonConfig.isPackaged) {
            util.uploadLogFileList();
        }

        await this.checkUpdate();
    }

    /** 创建游戏包目录 */
    private packageMkDir(): void {
        // 判断创建文件
        if (!FileUtil.existsSync(commonConfig.packagePath)) {
            FileUtil.ensureDirSync(commonConfig.packagePath);
        }

        if (!FileUtil.existsSync(commonConfig.clientPackagePath)) {
            FileUtil.ensureDirSync(commonConfig.clientPackagePath);
        }

        if (!FileUtil.existsSync(commonConfig.serverPackagePath)) {
            FileUtil.ensureDirSync(commonConfig.serverPackagePath);
        }
    }

    /** 检查更新 */
    private async checkUpdate(): Promise<void> {
        await mainModel.mainWindow.loadFile(`${commonConfig.rootPath}/dist/renderer.html`);

        logger.log('net', `config.urlValue`, mainModel.fakeProtoURL);
        logger.log('env', `app.isPackaged:`, commonConfig.isPackaged);

        //打包后的包才要检查更新
        if (commonConfig.isPackaged) {
            message.sendIpcMsg(MsgId.GET_NATIVE_POLICY_VERSION);
        }
        //没打包的直接检查游戏包更新
        else {
            message.sendIpcMsg(MsgId.CHECK_PACKAGE_UPDATE);
        }
    }

    public dispose(): void {
        this.removeIpcListener();
    }

    /** 添加ipc监听消息 */
    private addIpcListener(): void {
        message.addIpcListener(MsgId.CHECK_UPDATE_COMPLETE, this.onCheckUpdateComplete.bind(this));
        message.addIpcListener(MsgId.MAP_TEMPLATE_ENTER, this.onMapTemplateEnter.bind(this));
        message.addIpcListener(MsgId.MAP_TEMPLATE_ROOM_CREATE, this.onMapTemplateRoomCreate.bind(this));
        message.addIpcListener(MsgId.MAP_TEMPLATE_ENTER_ERROR, this.onMapTemplateEnterError.bind(this));
        message.addIpcListener(MsgId.SWITCH_FULL_SCREEN, this.onSwitchFullScreen.bind(this));
        message.addIpcListener(MsgId.QUIT_NATIVE, this.onQuitNative.bind(this));
        message.addIpcListener(MsgId.SEND_PLAYER_ID, this.onSendPlayerId.bind(this));
        message.addIpcListener(MsgId.checkNativeUpdate, this.onCheckNativeUpdate.bind(this));
        message.addIpcListener(MsgId.openFakeProtoInNative, this.onOpenFakeProtoInNative.bind(this));
    }

    /** 移除ipc监听消息 */
    private removeIpcListener(): void {
        message.removeIpcListener(MsgId.CHECK_UPDATE_COMPLETE);
        message.removeIpcListener(MsgId.MAP_TEMPLATE_ENTER);
        message.removeIpcListener(MsgId.MAP_TEMPLATE_ROOM_CREATE);
        message.removeIpcListener(MsgId.MAP_TEMPLATE_ENTER_ERROR);
        message.removeIpcListener(MsgId.SWITCH_FULL_SCREEN);
        message.removeIpcListener(MsgId.QUIT_NATIVE);
        message.removeIpcListener(MsgId.SEND_PLAYER_ID);
        message.removeIpcListener(MsgId.checkNativeUpdate);
        message.removeIpcListener(MsgId.openFakeProtoInNative);
    }

    /** 检查更新完毕 */
    private async onCheckUpdateComplete(): Promise<void> {
        await this.initNative();
    }

    /** native初始化 */
    public async initNative(): Promise<void> {
        /** 清除渲染层数据 */
        message.sendIpcMsg(MsgId.CLEAR_RENDERER_MODEL_DATA);
        mainModel.setBellplanetReady(false);

        logger.log('net', `urlValue: ${mainModel.fakeProtoURL}`);

        util.initNativeCnf();
        await this.initNativeMode();
    }

    /** 根据路由初始化native模式 */
    private async initNativeMode(): Promise<void> {
        //不存在伪协议,指定网址模式
        if (!mainModel.fakeProtoURL || mainModel.fakeProtoURL.protocol.indexOf(commonConfig.constPseudoProtocol) < 0) {
            mainModel.setNativeMode(CommonDefine.eNativeMode.website);
            this.startNativeWebsite();
            return;
        }

        //设置路由
        const lessonRouter = mainModel.fakeProtoURL.hostname;
        mainModel.setLessonRouter(lessonRouter as CommonDefine.eLessonRouter);
        logger.log('test', `router: ${mainModel.lessonRouter}`);

        switch (mainModel.lessonRouter) {
            //创造地图模式
            case CommonDefine.eLessonRouter.createMap:
                mainModel.setNativeMode(CommonDefine.eNativeMode.createMap);
                await this.startCreateMap();
                break;
            //banner模式
            case CommonDefine.eLessonRouter.banner:
                mainModel.setNativeMode(CommonDefine.eNativeMode.banner);
                this.startBanner();
                break;
            //游戏模式
            case CommonDefine.eLessonRouter.game:
                mainModel.setNativeMode(CommonDefine.eNativeMode.game);
                this.startNativeGame();
                break;
            //指定url模式
            case CommonDefine.eLessonRouter.url:
                mainModel.setNativeMode(CommonDefine.eNativeMode.url);
                this.startUrl();
                break;
            //神庙模式
            case CommonDefine.eLessonRouter.enterPrestigeMap:
                mainModel.setNativeMode(CommonDefine.eNativeMode.prestigeMap);
                this.enterPrestigeMap();
                break;
            //平台上课模式
            default:
                mainModel.mainWindow.setFullScreen(false);
                mainModel.setNativeMode(CommonDefine.eNativeMode.platform);
                await this.startNativePlatform();
                break;
        }
    }

    /** 从banner模式进入 */
    private startBanner(): void {
        const searchParams: URLSearchParams = mainModel.fakeProtoURL.searchParams;
        searchParams.set("nativeMode", `${CommonDefine.eNativeMode.banner}`);
        logger.log('update', `从banner模式进入 searchParams`, searchParams);
        message.sendIpcMsg(MsgId.START_NATIVE_CLIENT, searchParams.toString());
    }

    /** 从创造地图模式进入 */
    private async startCreateMap(): Promise<void> {
        let searchParams: URLSearchParams = mainModel.fakeProtoURL.searchParams;
        //有banner参数,要从平台初始化
        if (searchParams.has("banner")) {
            searchParams = await platform.init();
        }
        searchParams.set('nativeMode', CommonDefine.eNativeMode.createMap.toString());
        logger.log('update', `从创造地图模式进入 searchParams`, searchParams);
        message.sendIpcMsg(MsgId.START_NATIVE_CLIENT, searchParams.toString());
    }

    /** 从游戏模式进入 */
    private startNativeGame(): void {
        const searchParams: URLSearchParams = mainModel.fakeProtoURL.searchParams;
        searchParams.set('nativeMode', CommonDefine.eNativeMode.game.toString());
        logger.log('update', `从游戏模式进入 searchParams`, searchParams);
        message.sendIpcMsg(MsgId.START_NATIVE_CLIENT, searchParams.toString());
    }

    /** 跳转到指定url */
    private async startUrl(): Promise<void> {
        const searchParams: URLSearchParams = mainModel.fakeProtoURL.searchParams;
        logger.log('update', `从指定url进入 searchParams`, searchParams);
        const targetUrlValue: string = searchParams.get('url');
        if (!targetUrlValue) return;
        logger.log('update', `跳转到指定url`, targetUrlValue);
        const temporaryToken: string = searchParams.get('temporary_token');
        const targetUrl = new URL(targetUrlValue);
        if (temporaryToken) {
            await platform.init();
            targetUrl.searchParams.set("webviewToken", mainModel.bellToken);
        }

        message.sendIpcMsg(MsgId.START_NATIVE_URL, targetUrl.toString());
    }

    /** 指定网址进入 */
    private startNativeWebsite(): void {
        logger.log('update', `从指定网址进入`);

        message.sendIpcMsg(MsgId.START_NATIVE_WEBSITE);
    }

    /** 从平台进入 */
    private async startNativePlatform(): Promise<void> {
        //平台初始化
        const searchParams: URLSearchParams = await platform.init();
        //初始化参数
        mainModel.setChannel(commonConfig.constChannelLesson);
        searchParams.set('gameChannel', commonConfig.constChannelLesson);
        searchParams.set('fakeUserType', mainModel.userType.toString());
        searchParams.set('nativeMode', CommonDefine.eNativeMode.platform.toString());

        //非学生端 或者单人单服务器 本地服务器初始化
        if (mainModel.userType != CommonDefine.eUserType.student || mainModel.standAlone) {
            server.init();
        }

        logger.log('update', `从平台进入 searchParams`, searchParams.toString());
        message.sendIpcMsg(MsgId.START_NATIVE_PLATFORM, searchParams.toString());
    }

    /** 进入神庙模板地图 */
    private enterPrestigeMap(): void {
        const searchParams: URLSearchParams = mainModel.fakeProtoURL.searchParams;
        searchParams.set('nativeMode', CommonDefine.eNativeMode.prestigeMap.toString());

        logger.log('update', `从神庙模板地图模式进入 searchParams`, searchParams);
        message.sendIpcMsg(MsgId.START_NATIVE_CLIENT, searchParams.toString());
    }

    /** 收到地图模板游戏服务器 */
    private onMapTemplateEnter(tAid: string, tGameArgs: string): void {
        util.writeServerCnfValue('gid', tAid);
        mainModel.setGameArgs(tGameArgs);

        server.createNativeServer(CommonDefine.eGameServerMode.mapTemplate);
    }

    /** 收到地图模板房间游戏服务器 */
    private onMapTemplateRoomCreate(tGid: string, tGameArgs: string): void {
        util.writeServerCnfValue('gid', tGid);
        mainModel.setGameArgs(tGameArgs);

        server.createNativeServer(CommonDefine.eGameServerMode.mapTemplateRoom);
    }

    /** 收到进入地图模板房间失败 */
    private async onMapTemplateEnterError(): Promise<void> {
        await util.copyLog2UploadDir()
            .then(() => {
                util.uploadLogFileList();
            });
    }

    /** 切换全屏显示 */
    private onSwitchFullScreen(tIsFullScreen: boolean): void {
        mainModel.mainWindow.setFullScreen(tIsFullScreen);
    }

    /** 退出Native */
    private onQuitNative(): void {
        app.quit();
    }

    /** 收到发送过来的玩家id */
    private onSendPlayerId(tPlayerId: string, tPlayerName: string): void {
        mainModel.setPlayerId(tPlayerId);
        mainModel.setPlayerName(tPlayerName);
    }

    /** 检查native更新 */
    private onCheckNativeUpdate(tNativeVersion: number): void {
        this._nativeUpdate.checkUpdate(tNativeVersion);
    }

    /** 在native里面打开伪协议时 */
    private onOpenFakeProtoInNative(tUrl: string): void {
        mainModel.setFakeProtoURL(new URL(tUrl));
        this.initNative();
    }
}

const mainControl = new MainControl();
export default mainControl;