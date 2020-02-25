/**
 * @author 雪糕 
 * @desc main用的配置
 * @date 2020-02-13 14:54:41 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-25 15:51:32
 */
/** 本机IP */
const localIp = "127.0.0.1";

/** native服务器端口 */
let nativeServerPort;

/** 程序根路径 */
let rootPath = `${__dirname}/../..`;

/** 游戏服务器ip */
let gameServerIp;
/** 游戏服务器端口 */
let gameServerPort;

/** 全局配置路径 */
const globalConfigPath = `${rootPath}/GlobalConfig.json`;

/** 全局配置数据 */
let globalConfigData;

/** native配置路径 */
const nativeCnfPath = `${rootPath}/package/server/config/native_lesson_cnf.json`;

const processLogPath = `${rootPath}/src/main/process.log`;

/** 游戏服务器是否初始化 */
let gameServerInited;

/** 渠道号,默认bian_game,从平台那边获取的时候再赋值 */
let channel = 'bian_game';

/** 登陆bell平台用的临时token */
let bellTempToken;

/** bell平台用的正式token */
let bellToken;

/** bell平台通信地址 */
let bellApiOrigin;

/** 班级id */
let classId;

/** 用户类型 */
let userType;

/** 用户名称 */
let realName;

/** 用户昵称 */
let nickName;

/** 上课模式渠道常量 */
const constChannelLesson = 'bian_lesson';

/** 用户类型枚举，教师端，学生端，机构端 */
const eUserType = {
    student: 1,
    teacher: 2,
    system: 3,
    institution: 4,//机构
    tutor: 5,//导师
    lessonsDevelop: 99,//小贝客户端自定义的 教研用
}

/** 伪协议里url带的参数 */
let urlValue;

/** 主程序窗口 */
let mainWindow;

exports.localIp = localIp;
exports.nativeServerPort = nativeServerPort;
exports.rootPath = rootPath;
exports.gameServerIp = gameServerIp;
exports.gameServerPort = gameServerPort;
exports.globalConfigPath = globalConfigPath;
exports.nativeCnfPath = nativeCnfPath;
exports.processLogPath = processLogPath;
exports.gameServerInited = gameServerInited;
exports.channel = channel;
exports.bellTempToken = bellTempToken;
exports.bellToken = bellToken;
exports.bellApiOrigin = bellApiOrigin;
exports.userType = userType;
exports.classId = classId;
exports.realName = realName;
exports.nickName = nickName;
exports.urlValue = urlValue;
exports.globalConfigData = globalConfigData;
exports.mainWindow = mainWindow;

exports.constChannelLesson = constChannelLesson;
exports.eUserType = eUserType;