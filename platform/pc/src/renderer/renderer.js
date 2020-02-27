/**
 * @author 雪糕 
 * @desc 渲染进程逻辑类
 * @date 2020-02-18 11:44:51 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-26 21:59:54
 */
import * as logger from './logger.js';
import * as message from './message.js';

/** 初始化 */
export function init() {
    logger.log('renderer', `初始化渲染进程主逻辑`);

    //初始化消息处理类
    message.init();
}
