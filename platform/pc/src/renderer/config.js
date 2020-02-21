/**
 * @author 雪糕 
 * @desc renderer用的配置
 * @date 2020-02-13 14:54:50 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-22 04:29:03
 */
let fs = require('fs');

/** native用请求头 */
export const protocol = "http";
/** 资源路径 */
const macResourcePath = "./Applications/bellplanet.app/Contents/Resources/app/package/client/";
const winResourcePath = "./resources/app/package/client/"
export const resourcePath = navigator.userAgent.indexOf("Mac") > 0 ? macResourcePath : winResourcePath;

/** 程序根路径 */
export const rootPath = `${__dirname}/../..`;

/** native登陆平台回复消息常量 */
export const nativeConfig = 'nativeConfig';

/** 全局配置路径 */
export const globalConfigPath = `${rootPath}/src/GlobalConfig.json`;

/** 全局配置数据 */
export let globalConfigData;