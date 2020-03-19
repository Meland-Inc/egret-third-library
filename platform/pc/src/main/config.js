/**
 * @author 雪糕 
 * @desc main用的配置
 * @date 2020-02-13 14:54:41 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-20 00:09:30
 */

class Config {
    /** 本机IP */
    static localIp = "127.0.0.1";

    /** native服务器端口 */
    static _nativeServerPort;
    static get nativeServerPort() {
        return this._nativeServerPort;
    }
    static setNativeServerPort(value) {
        this._nativeServerPort = value;
    }

    /** 程序根路径 */
    static rootPath = `${__dirname}/../..`;

    /** 全局配置路径 */
    static globalConfigPath = `${this.rootPath}/GlobalConfig.json`;

    /** 游戏服务器内网ip */
    static _gameServerLocalIp;
    static get gameServerLocalIp() {
        return this._gameServerLocalIp;
    }
    static setGameServerLocalIp(value) {
        this._gameServerLocalIp = value;
    }

    /** 游戏服务器内网端口 */
    static _gameServerLocalPort;
    static get gameServerLocalPort() {
        return this._gameServerLocalPort;
    }
    static setGameServerLocalPort(value) {
        this._gameServerLocalPort = value;
    }

    /** 游戏服务器公网ip */
    static _gameServerNatUrl;
    static get gameServerNatUrl() {
        return this._gameServerNatUrl;
    }
    static setGameServerNatUrl(value) {
        this._gameServerNatUrl = value;
    }

    /** 游戏服务器公网端口 */
    static _gameServerNatPort;
    static get gameServerNatPort() {
        return this._gameServerNatPort;
    }
    static setGameServerNatPort(value) {
        this._gameServerNatPort = value;
    }

    /** native配置路径 */
    static nativeCnfPath = `${this.rootPath}/package/server/config/native_lesson_cnf.json`;

    /** 后台进程日志路径 */
    static processLogPath = `${this.rootPath}/src/main/process.log`;

    /** 前台日志路径 */
    static webContentsLogPath = `${this.rootPath}/src/main/webContents.log`;

    /** 游戏服务器是否初始化 */
    static _gameServerInited;
    static get gameServerInited() {
        return this._gameServerInited;
    }
    static setGameServerInited(value) {
        this._gameServerInited = value;
    }

    /** 渠道号,默认bian_game,从平台那边获取的时候再赋值 */
    static _channel = 'bian_game';
    static get channel() {
        return this._channel;
    }
    static setChannel(value) {
        this._channel = value;
    }

    /** 登陆bell平台用的临时token */
    static _bellTempToken;
    static get bellTempToken() {
        return this._bellTempToken;
    }
    static setBellTempToken(value) {
        this._bellTempToken = value;
    }

    /** bell平台用的正式token */
    static _bellToken;
    static get bellToken() {
        return this._bellToken;
    }
    static setBellToken(value) {
        this._bellToken = value;
    }

    /** bell平台通信地址 */
    static _bellApiOrigin;
    static get bellApiOrigin() {
        return this._bellApiOrigin;
    }
    static setBellApiOrigin(value) {
        return this._bellApiOrigin = value;
    }

    /** bell平台回传给的参数 */
    static _bellPackageId;
    static get bellPackageId() {
        return this._bellPackageId;
    }
    static setBellPackageId(value) {
        this._bellPackageId = value;
    }

    /** bell平台回传给的参数 */
    static _bellLessonId;
    static get bellLessonId() {
        return this._bellLessonId;
    }
    static setBellLessonId(value) {
        this._bellLessonId = value;
    }

    /** bell平台回传给的参数 */
    static _bellActId;
    static get bellActId() {
        return this._bellActId;
    }
    static setBellActId(value) {
        this._bellActId = value;
    }

    /** bell平台回传给的url */
    static _bellBackUrl;
    static get bellBackUrl() {
        return this._bellBackUrl;
    }
    static setBellBackUrl(value) {
        this._bellBackUrl = value;
    }

    /** 班级id */
    static _classId;
    static get classId() {
        return this._classId;
    }
    static setClassId(value) {
        this._classId = value;
    }

    /** 用户类型 */
    static _userType;
    static get userType() {
        return this._userType;
    }
    static setUserType(value) {
        this._userType = value;
    }

    /** 用户名称 */
    static _realName;
    static get realName() {
        return this._realName;
    }
    static setRealName(value) {
        this._realName = value;
    }

    /** 用户昵称 */
    static _nickName;
    static get nickName() {
        return this._nickName;
    }
    static setNickName(value) {
        this._nickName = value;
    }

    /** 学生单人开服务器 */
    static _standAlone;
    static get standAlone() {
        return this._standAlone;
    }
    static setStandAlone(value) {
        this._standAlone = value;
    }

    /** 上课伪协议 路由*/
    static _lessonRouter;
    static get lessonRouter() {
        return this._lessonRouter;
    }
    static setLessonRouter(value) {
        this._lessonRouter = value;
    }

    /** native模式 */
    static _nativeMode;
    static get nativeMode() {
        return this._nativeMode;
    }
    static setNativeMode(value) {
        this._nativeMode = value;
    }

    /** 游戏服务器模式 */
    static _gameServerMode;
    static get gameServerMode() {
        return this._gameServerMode;
    }
    static setGameServerMode(value) {
        this._gameServerMode = value;
    }

    /** 上课模式渠道常量 */
    static constChannelLesson = 'bian_lesson';

    /** 上课伪协议头 */
    static constPseudoProtocol = 'bellplanet://';

    static constBellcodeUrl = 'www.bellcode.com';

    /** 用户类型枚举，教师端，学生端，机构端 */
    static eUserType = {
        student: 1,
        teacher: 2,
        system: 3,
        institution: 4,//机构
        tutor: 5,//导师
        lessonsDevelop: 99,//小贝客户端自定义的 教研用
    }

    /** 路由枚举 */
    static eLessonRouter = {
        createMap: "createMap",
        banner: "banner",
    }

    /** 游戏服务器模式 */
    static eGameServerMode = {
        gameMap: 1,    //游戏地图
        mapTemplate: 2,  //模板地图
        mapTemplateRoom: 3, //模板地图房间
    }

    /** native模式 */
    static eNativeMode = {
        game: 1,    //c端游戏模式
        website: 2,  //官网进入
        platform: 3, //b端平台上课模式(入口从平台进) 
        createMap: 4, //c端创造地图模式
        mapTemplate: 5, //c端地图模板模式
        mapTemplateRoom: 6, //c端地图模板房间模式
        banner: 7, //banner模式
    }

    /** 伪协议里url带的参数 */
    static _urlValue;
    static get urlValue() {
        return this._urlValue;
    }
    static setUrlValue(value) {
        this._urlValue = decodeURIComponent(value);
    }

    /** 主程序窗口 */
    static _mainWindow;
    static get mainWindow() {
        return this._mainWindow;
    }
    static setMainWindow(value) {
        this._mainWindow = value;
    }
}

exports.Config = Config;

// exports.localIp = localIp;
// exports.nativeServerPort = nativeServerPort;
// exports.rootPath = rootPath;
// exports.gameServerLocalIp = gameServerLocalIp;
// exports.gameServerLocalPort = gameServerLocalPort;
// exports.gameServerNatUrl = gameServerNatUrl;
// exports.gameServerNatPort = gameServerNatPort;
// exports.nativeCnfPath = nativeCnfPath;
// exports.processLogPath = processLogPath;
// exports.webContentsLogPath = webContentsLogPath;
// exports.gameServerInited = gameServerInited;
// exports.channel = channel;
// exports.bellTempToken = bellTempToken;
// exports.bellToken = bellToken;
// exports.bellApiOrigin = bellApiOrigin;
// exports.bellPackageId = bellPackageId;
// exports.bellLessonId = bellLessonId;
// exports.bellActId = bellActId;
// exports.bellBackUrl = bellBackUrl;
// exports.userType = userType;
// exports.classId = classId;
// exports.realName = realName;
// exports.nickName = nickName;
// exports.urlValue = urlValue;
// exports.standAlone = standAlone;
// exports.mainWindow = mainWindow;
// exports.lessonRouter = lessonRouter;
// exports.nativeMode = nativeMode;
// exports.gameServerMode = gameServerMode;
// exports.globalConfigPath = globalConfigPath;

// exports.constChannelLesson = constChannelLesson;
// exports.constPseudoProtocol = constPseudoProtocol;
// exports.constBellcodeUrl = constBellcodeUrl;
// exports.eUserType = eUserType;
// exports.eLessonRouter = eLessonRouter;
// exports.eNativeMode = eNativeMode;
// exports.eGameServerMode = eGameServerMode;