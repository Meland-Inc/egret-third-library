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

        await this.initNative();
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

    /** native初始化 */
    public async initNative(): Promise<void> {
        mainModel.setBellplanetReady(false);

        logger.log('net', `urlValue: ${mainModel.urlValue}`);
        if (!mainModel.urlValue || mainModel.urlValue.indexOf(commonConfig.constPseudoProtocol) < 0) {
            mainModel.setNativeMode(CommonDefine.eNativeMode.website);
        } else {
            //设置路由
            const urlObj = new URL(mainModel.urlValue);
            const lessonRouter = urlObj.hostname;
            mainModel.setLessonRouter(lessonRouter as CommonDefine.eLessonRouter);

            logger.log('test', `router: ${mainModel.lessonRouter}`);

            //根据路由初始化native模式
            this.initNativeMode(mainModel.lessonRouter);
        }

        await mainModel.mainWindow.loadFile(`${commonConfig.rootPath}/dist/renderer.html`);

        logger.log('net', `config.urlValue`, mainModel.urlValue);
        logger.log('env', `app.isPackaged:`, commonConfig.isPackaged);

        /** 清除渲染层数据 */
        message.sendIpcMsg(MsgId.CLEAR_RENDERER_MODEL_DATA);

        //打包后的包才要检查更新
        if (commonConfig.isPackaged) {
            message.sendIpcMsg(MsgId.GET_NATIVE_POLICY_VERSION);
        }
        //没打包的直接检查游戏包更新
        else {
            message.sendIpcMsg(MsgId.CHECK_PACKAGE_UPDATE);
        }
    }

    /** 根据路由初始化native模式 */
    private initNativeMode(tRouter: CommonDefine.eLessonRouter): void {
        switch (tRouter) {
            //创造地图模式
            case CommonDefine.eLessonRouter.createMap:
                mainModel.setNativeMode(CommonDefine.eNativeMode.createMap);
                break;
            //banner模式
            case CommonDefine.eLessonRouter.banner:
                mainModel.setNativeMode(CommonDefine.eNativeMode.banner);
                break;
            //游戏模式
            case CommonDefine.eLessonRouter.game:
                mainModel.setNativeMode(CommonDefine.eNativeMode.game);
                break;
            //指定url模式
            case CommonDefine.eLessonRouter.url:
                mainModel.setNativeMode(CommonDefine.eNativeMode.url);
                break;
            //进入指定地图模板
            case CommonDefine.eLessonRouter.enterPrestigeMap:
                mainModel.setNativeMode(CommonDefine.eNativeMode.prestigeMap);
                break;
            default:
                mainModel.mainWindow.setFullScreen(false);
                mainModel.setNativeMode(CommonDefine.eNativeMode.platform);
                break;
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
        message.addIpcListener(MsgId.SET_NATIVE_POLICY_VERSION, this.onSetNativePolicyVersion.bind(this));
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
        message.removeIpcListener(MsgId.SET_NATIVE_POLICY_VERSION);
    }

    /** 检查更新完毕 */
    private async onCheckUpdateComplete(): Promise<void> {
        util.initNativeCnf();

        logger.log('config', `nativeMode:${mainModel.nativeMode}`);
        if (mainModel.nativeMode === CommonDefine.eNativeMode.banner) {
            this.startBanner();
            return;
        }

        if (mainModel.nativeMode === CommonDefine.eNativeMode.createMap) {
            await this.startCreateMap();
            return;
        }

        if (mainModel.nativeMode === CommonDefine.eNativeMode.game) {
            this.startNativeGame();
            return;
        }

        if (mainModel.nativeMode === CommonDefine.eNativeMode.url) {
            this.startUrl();
            return;
        }

        if (mainModel.nativeMode === CommonDefine.eNativeMode.website) {
            this.startNativeWebsite();
            return;
        }

        if (mainModel.nativeMode === CommonDefine.eNativeMode.platform) {
            await this.startNativePlatform();
            return;
        }

        if (mainModel.nativeMode === CommonDefine.eNativeMode.prestigeMap) {
            this.enterPrestigeMap();
        }
    }

    /** 从banner模式进入 */
    private startBanner(): void {
        let queryValue: string = mainModel.urlValue.slice(mainModel.urlValue.indexOf("?") + 1);
        queryValue += `&nativeMode=${CommonDefine.eNativeMode.banner}`;
        logger.log('update', `从banner模式进入`);
        message.sendIpcMsg(MsgId.START_NATIVE_CLIENT, queryValue);
    }

    /** 从创造地图模式进入 */
    private async startCreateMap(): Promise<void> {
        const urlValue: string = mainModel.urlValue.slice(mainModel.urlValue.indexOf("?") + 1);
        let queryObject = querystring.parse(urlValue);
        //有banner参数,要从平台初始化
        if (queryObject["banner"]) {
            queryObject = await platform.init();
        }
        queryObject['nativeMode'] = CommonDefine.eNativeMode.createMap.toString();

        const queryValue: string = querystring.stringify(queryObject);
        logger.log('update', `从创造地图模式进入`);
        message.sendIpcMsg(MsgId.START_NATIVE_CLIENT, queryValue);
    }

    /** 从游戏模式进入 */
    private startNativeGame(): void {
        logger.log('update', `从游戏模式进入`);
        const urlValue = mainModel.urlValue;
        //伪协议启动参数
        logger.log('platform', `初始化平台数据`, urlValue);
        const argsValue = urlValue.slice(urlValue.indexOf("?") + 1);
        const argsObj = querystring.parse(argsValue);
        let queryObject: querystring.ParsedUrlQuery = {};
        queryObject = Object.assign(queryObject, argsObj);
        queryObject["nativeMode"] = CommonDefine.eNativeMode.game + "";

        const queryValue: string = querystring.stringify(queryObject);

        message.sendIpcMsg(MsgId.START_NATIVE_CLIENT, queryValue);
    }

    /** 跳转到指定url */
    private async startUrl(): Promise<void> {
        logger.log('update', `从指定url进入`);
        const urlValue: string = mainModel.urlValue.slice(mainModel.urlValue.indexOf("?") + 1);
        const queryObject = querystring.parse(urlValue);
        const targetUrlValue: string = queryObject["url"] as string;
        if (!targetUrlValue) return;
        logger.log('update', `跳转到指定url`, targetUrlValue);
        logger.log('update', `queryObject: `, queryObject);
        const temporaryToken: string = queryObject["temporary_token"] as string;
        const newUrl = new URL(targetUrlValue);
        if (temporaryToken) {
            await platform.init();
            newUrl.searchParams.set("webviewToken", mainModel.bellToken);
        }

        message.sendIpcMsg(MsgId.START_NATIVE_URL, newUrl.toString());
    }

    /** 指定网址进入 */
    private startNativeWebsite(): void {
        logger.log('update', `从指定网址进入`);

        message.sendIpcMsg(MsgId.START_NATIVE_WEBSITE);
    }

    /** 从平台进入 */
    private async startNativePlatform(): Promise<void> {
        logger.log('update', `从平台进入`);

        //平台初始化
        const queryObject: querystring.ParsedUrlQuery = await platform.init();
        //初始化参数
        mainModel.setChannel(commonConfig.constChannelLesson);
        queryObject['gameChannel'] = commonConfig.constChannelLesson;
        queryObject['fakeUserType'] = mainModel.userType.toString();
        queryObject['nativeMode'] = CommonDefine.eNativeMode.platform.toString();

        //非学生端 或者单人单服务器 本地服务器初始化
        if (mainModel.userType != CommonDefine.eUserType.student || mainModel.standAlone) {
            server.init();
        }

        logger.log(`test`, `queryObject`, queryObject);

        message.sendIpcMsg(MsgId.START_NATIVE_PLATFORM, queryObject);
    }

    /** 进入神庙模板地图 */
    private enterPrestigeMap(): void {
        logger.log('update', `从神庙模板地图模式进入`);
        const urlValue = mainModel.urlValue;
        const argsValue = urlValue.slice(urlValue.indexOf("?") + 1);
        const argsObj = querystring.parse(argsValue);
        let queryObject: querystring.ParsedUrlQuery = {};
        queryObject = Object.assign(queryObject, argsObj);
        queryObject["nativeMode"] = CommonDefine.eNativeMode.prestigeMap + "";

        const queryValue: string = querystring.stringify(queryObject);
        message.sendIpcMsg(MsgId.START_NATIVE_CLIENT, queryValue);
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

    private onSetNativePolicyVersion(tNativeVersion: number): void {
        this._nativeUpdate.checkUpdate(tNativeVersion);
    }
}

const mainControl = new MainControl();
export default mainControl;