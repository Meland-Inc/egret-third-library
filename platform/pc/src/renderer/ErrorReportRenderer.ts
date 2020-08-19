/** 
 * @Author 雪糕
 * @Description 渲染层错误上报 也是主要错误上报类
 * @Date 2019-11-08 21:11:09
 * @FilePath \pc\src\renderer\ErrorReportRenderer.ts
 */
import * as Sentry from '@sentry/electron/dist/renderer';
import commonConfig from '../common/CommonConfig';
import { CommonDefine } from '../common/CommonDefine';

/**错误上报 */
class ErrorReportRenderer {
    private _enable: boolean;

    public init(): void {
        if (this._enable != undefined) {
            return;
        }

        if (!Sentry) {
            this._enable = false;
            return;
        }

        if (commonConfig.environName === CommonDefine.eEnvironName.release) {
            this._enable = true;

            const beforeSend = (tEvent: Sentry.Event, tHint: unknown): unknown => {
                if (tEvent['exception'] && tEvent['exception']['values'] && tEvent['exception']['values'][0] && tEvent['exception']['values'][0]['stacktrace']) {
                    const frames: unknown[] = tEvent['exception']['values'][0]['stacktrace']['frames'];
                    if (!frames || frames.length <= 0) {
                        return tEvent;
                    }

                    const filename: string = frames[0]['filename'];
                    if (!filename) {
                        return tEvent;
                    }

                    //如果是加载的游戏代码报错 堆栈是从file大头的 通过这个区分是不是游戏js报错 游戏报错这里不上报 让游戏自己上报
                    if (filename.substr(0, 5) == 'file:') {
                        return null;
                    }

                    return tEvent;
                }
            };
            Sentry.init({
                dsn: 'https://680b16f3edf0447da3ff0dc0d67b0604@o121360.ingest.sentry.io/5395564',
                // release: `bellplanet_${commonConfig.environName}_${codeVersion}`,
                environment: commonConfig.environName,
                beforeSend: beforeSend,
            });
            Sentry.setTag('progress', 'renderer');
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
    public error(tInfo: string): void {
        if (this._enable) {
            Sentry.captureException(new Error(tInfo));
        }
    }

    // /**系统意外 */
    // public systemException(info: string) {
    //     if (this._enable) {
    //         window[this._raven].captureException("exception=" + info);
    //     }
    // }
}

const errorReportRenderer = new ErrorReportRenderer();
export default errorReportRenderer;