/** 
 * @Author 雪糕
 * @Description 渲染进程逻辑类
 * @Date 2020-02-18 11:44:51 
 * @FilePath \pc\src\renderer\renderer.ts
 */
import * as logger from './logger';
import message from './Message';
import rendererModel from './RendererModel';
import errorReportRenderer from './ErrorReportRenderer';

/** 初始化 */
logger.log('renderer', `初始化渲染进程主逻辑`);

init();

function init() {
    //初始化配置
    rendererModel.init();

    //初始化消息处理类
    message.init();

    //错误上报初始化
    errorReportRenderer.init();
}