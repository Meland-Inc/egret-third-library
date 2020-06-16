/** 
 * @Author 雪糕
 * @Description 错误上报
 * @Date 2019-11-08 21:11:09
 * @FilePath \pc\src\renderer\ErrorReport.ts
 */
import Raven from 'raven-js'
import commonConfig from '../common/CommonConfig';
import { CommonDefine } from '../common/CommonDefine';

/**错误上报 */
class ErrorReport {
    private _raven: Raven.RavenStatic;
    private _enable: boolean;

    public init() {
        if (this._enable != undefined) {
            return;
        }

        if (commonConfig.environName === CommonDefine.eEnvironName.release) {
            this._enable = true;
            this._raven = Raven;
            this._raven.config('https://e9ff496745ec4611842d0b2fe66b167e@sentry.io/1272774').install();
            // let codeVersion: string;
            // if (VersionConfig.trunkName === eTrunkName.beta) {
            //     codeVersion = VersionConfig.betaCodeVersion;
            // } else {
            //     codeVersion = VersionConfig.releaseCodeVersion;
            // }

            // raven.setTagsContext({
            //     version: codeVersion
            // });
            Raven.setEnvironment(commonConfig.environName);
            // raven.setUserContext({
            //     email: 'matt@example.com',
            //     id: '123'
            // });

            //这里上报的不会有堆栈信息 而且会拦截掉上报系统自己捕获的 先屏蔽掉
            // window["onerror".toString()] = function (e) {
            //     ErrorReport.instance.systemException(e.toString());
            // }
        }
        else {
            this._enable = false;
        }
    }

    /**主动报错 */
    public error(info: string) {
        if (this._enable) {
            this._raven.captureException(info);
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