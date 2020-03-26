/**
 * @author 雪糕 
 * @desc 渲染进程逻辑类
 * @date 2020-02-18 11:44:51 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-26 17:46:40
 */
import * as logger from './logger';
import message from './Message';
import config from './Config';
import errorReport from './ErrorReport';

/** 初始化 */
logger.log('renderer', `初始化渲染进程主逻辑`);

init();

function init() {
    //初始化消息处理类
    message.init();

    //初始化配置
    config.init();

    //错误上报初始化
    errorReport.init();

    logger.error('test', 'native renderer raven test');
}