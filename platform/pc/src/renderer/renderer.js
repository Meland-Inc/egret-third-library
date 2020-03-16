/**
 * @author 雪糕 
 * @desc 渲染进程逻辑类
 * @date 2020-02-18 11:44:51 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-16 15:51:44
 */
import * as logger from './logger.js';
import * as message from './message.js';
import { Config } from './Config.js';

/** 初始化 */
logger.log('renderer', `初始化渲染进程主逻辑`);

init();

async function init() {
    //初始化消息处理类
    message.init();

    //初始化配置
    await Config.init();

    //发送检查更新消息
    message.checkUpdate();
}