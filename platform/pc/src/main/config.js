/**
 * @author 雪糕 
 * @desc main用的配置
 * @date 2020-02-13 14:54:41 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-14 17:20:19
 */
/** 本机IP */
const localIp = "127.0.0.1";

/** native服务器端口 */
let nativeServerPort;

let rootPath = `${__dirname}/../..`;

/** 游戏服务器端口 */
const gameServerPort = 3211;

/** native配置路径 */
const nativeCnfPath = `${rootPath}/package/server/config/native_lesson_cnf.json`;

const processLogPath = `${rootPath}/src/main/process.log`;

/** 游戏服务器是否初始化 */
let gameServerInited;

/** 渠道号,默认bian_game,从平台那边获取的时候再赋值 */
let channel = 'bian_game';

exports.localIp = localIp;
exports.nativeServerPort = nativeServerPort;
exports.rootPath = rootPath;
exports.gameServerPort = gameServerPort;
exports.nativeCnfPath = nativeCnfPath;
exports.processLogPath = processLogPath;
exports.gameServerInited = gameServerInited;
exports.channel = channel;