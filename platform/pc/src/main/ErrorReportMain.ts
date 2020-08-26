/** 
 * @Author 雪糕
 * @Description 主线程错误上报 不负责主动上报的 主动上报的统一走渲染层的主动上报
 * @Date 2019-11-08 21:11:09
 * @FilePath \pc\src\main\ErrorReportMain.ts
 */
import * as Sentry from '@sentry/electron/dist/main';
import commonConfig from '../common/CommonConfig';
import { CommonDefine } from '../common/CommonDefine';

/**错误上报 */
class ErrorReportMain {
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

            // const beforeSend = (event, hint) => {
            //     // if (event['exception'] && event['exception']['values'] && event['exception']['values'][0] && event['exception']['values'][0]['type'] === 'UnhandledRejection') {
            //     //     if (!hint.originalException || hint.originalException === 'undefined') {
            //     //         return null;
            //     //     }
            //     // }
            //     return event;
            // };
            Sentry.init({
                dsn: 'https://e35a5f6e40da455cacd0292a5076831d@o121360.ingest.sentry.io/5398292',
                // release: `bellplanet_${commonConfig.environName}_${codeVersion}`,
                environment: commonConfig.environName,
                // beforeSend: beforeSend,
            });
            Sentry.setTag('progress', 'main');
        }
        else {
            this._enable = false;
        }
    }

    // /**系统意外 */
    // public systemException(info: string) {
    //     if (this._enable) {
    //         window[this._raven].captureException("exception=" + info);
    //     }
    // }
}

const errorReportMain = new ErrorReportMain();
export default errorReportMain;