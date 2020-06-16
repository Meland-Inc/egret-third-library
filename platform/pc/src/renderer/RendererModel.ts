/** 
 * @Author 雪糕
 * @Description 渲染进程的数据
 * @Date 2020-02-13 14:54:50
 * @FilePath \pc\src\renderer\Config.ts
 */
import fs from 'fs';

import * as logger from './logger';
import commonConfig from '../common/CommonConfig';

class RendererModel {
    /** 版本配置 */
    private _versionConfig: any;

    private _nativeLoginResponse: any;
    /** native平台登陆信息 */
    public get nativeLoginResponse(): any {
        return this._nativeLoginResponse;
    }
    public setNativeLoginResponse(value: any) {
        this._nativeLoginResponse = value;
        localStorage.setItem('nativeLoginResponse', JSON.stringify(this._nativeLoginResponse));
    }

    private _nativeGameServer: string;
    /** 游戏服务器内网ip */
    public get nativeGameServer(): string {
        return this._nativeGameServer;
    }
    public setNativeGameServer(value: string) {
        this._nativeGameServer = value;
        localStorage.setItem('nativeGameServer', JSON.stringify(this._nativeGameServer));
    }

    public init() {
        logger.log('renderer', `初始化RendererModel`);
        if (fs.existsSync(commonConfig.versionConfigPath)) {
            let data = fs.readFileSync(commonConfig.versionConfigPath, 'utf-8');
            this._versionConfig = JSON.parse(data);
        } else {
            this._versionConfig = {};
        }
    }

    /** 获取版本配置值 */
    public getVersionConfigValue(key: string) {
        return this._versionConfig[key];
    }

    /** 设置版本配置值 */
    public setVersionConfigValue(key: string, value: string | number) {
        this._versionConfig[key] = value;
        fs.writeFileSync(commonConfig.versionConfigPath, JSON.stringify(this._versionConfig, null, 4), "utf-8");

        logger.log('renderer', `设置VersionConfigValue`, key, value);
    }
}

let rendererModel = new RendererModel();
export default rendererModel;