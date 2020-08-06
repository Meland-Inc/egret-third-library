/** 
 * @Author 雪糕
 * @Description 错误上报
 * @Date 2019-11-08 21:11:09
 * @FilePath \pc\src\renderer\ErrorReport.ts
 */
import * as Sentry from '@sentry/node';
import commonConfig from '../common/CommonConfig';
import { CommonDefine } from '../common/CommonDefine';

/**错误上报 */
class ErrorReport {
    private _enable: boolean;

    public init() {
        if (this._enable != undefined) {
            return;
        }

        if (!Sentry) {
            this._enable = false;
            return;
        }

        if (commonConfig.environName === CommonDefine.eEnvironName.release) {
            this._enable = true;

            // const beforeSend = (event, hint) => {
            //     //如果是报UnhandledRejection 下面情况下堆栈信息什么都没有 对目前解决错误没有任何帮助 先不报 promise reject即使有reason也会走这里
            //     if (event['exception'] && event['exception']['values'] && event['exception']['values'][0] && event['exception']['values'][0]['type'] === 'UnhandledRejection') {
            //         if (!hint.originalException || hint.originalException === 'undefined') {
            //             return null;
            //         }
            //     }
            //     return event;
            // };
            // Sentry.init({
            //     //这个不加的话会弹出‘进程崩溃了’的对话框，一点就关闭整个游戏了，暂时保留原先交互，如果后面需要弹出崩溃提示就把这个注释
            //     onFatalError: (error: Error) => { console.error(error) },//不打印出来 捕获到错误不会显示到控制台
            //     dsn: 'https://f41cf26eae5d445db9b4a775f88b3ff7@o121360.ingest.sentry.io/5377167',
            //     // release: `bellplanet_${commonConfig.environName}_${codeVersion}`,
            //     environment: commonConfig.environName,
            //     // beforeSend: beforeSend,
            // });
            // Sentry.setTag('version', codeVersion);

            //这里上报的不会有堆栈信息 而且会拦截掉上报系统自己捕获的 先屏蔽掉
            // window["onerror".toString()] = function (e) {
            //     ErrorReport.instance.systemException(e.toString());
            // }

            // //sentry新版本这里会捕获未处理catch的promise 但是其实是没有堆栈信息的 没法帮助程序排查 测试发现还会报错另外的Uncaught报错 由那里报即可 这里直接劫持掉
            // //会报错 Non-Error promise rejection
            // if ('onunhandledrejection' in window) {
            //     const oldFun = window['onunhandledrejection'];
            //     window['onunhandledrejection'] = event => {
            //         if (!event['reason'] || event['reason'] == 'undefined'
            //             || event['reason'].message == 'Unable to decode audio data') {
            //             Logger.warn(LOG_TAG.System, `onunhandledrejection =${event.reason}`);
            //         }
            //         else {
            //             oldFun.call(event);
            //         }
            //     };
            // }
        }
        else {
            this._enable = false;
        }
    }

    /**主动报错 */
    public error(info: string) {
        if (this._enable) {
            Sentry.captureException(new Error(info));
        }
    }

    // /**系统意外 */
    // public systemException(info: string) {
    //     if (this._enable) {
    //         window[this._raven].captureException("exception=" + info);
    //     }
    // }
}

let errorReport = new ErrorReport();
export default errorReport;