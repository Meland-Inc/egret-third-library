/*
 * @Author: xiangqian 
 * @Date: 2019-11-08 21:11:09 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-26 18:06:00
 */

import Raven from 'raven-js'
import config from './Config';
import { define } from './define';

/**错误上报 */
class ErrorReport {
    private _raven: Raven.RavenStatic;
    private _enable: boolean;

    public init() {
        if (this._enable != undefined) {
            return;
        }

        if (config.environName === define.eEnvironName.release) {
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
            Raven.setEnvironment(config.environName);
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