/** 
 * @Author 雪糕
 * @Description 渲染进程的数据
 * @Date 2020-02-13 14:54:50
 * @FilePath \pc\src\renderer\RendererModel.ts
 */
import fs from 'fs';

import * as logger from './logger';
import commonConfig from '../common/CommonConfig';
import { CommonDefine } from '../common/CommonDefine';

interface IVersionConfig {
    client: {
        beta: number,
        ready: number,
        release: number
    },
    server: {
        beta: number,
        ready: number,
        release: number
    }
}

class RendererModel {
    /** 版本配置 */
    private _versionConfig: IVersionConfig;

    private _nativeLoginResponse: any;
    /** native平台登陆信息 */
    public get nativeLoginResponse(): any {
        return this._nativeLoginResponse;
    }
    public setNativeLoginResponse(value: any) {
        this._nativeLoginResponse = value;
        localStorage.setItem('nativeLoginResponse', JSON.stringify(this._nativeLoginResponse));
        logger.log('model', `设置nativeLoginResponse`);
    }

    private _nativeGameServer: string;
    /** 游戏服务器内网ip */
    public get nativeGameServer(): string {
        return this._nativeGameServer;
    }
    public setNativeGameServer(value: string) {
        this._nativeGameServer = value;
        localStorage.setItem('nativeGameServer', JSON.stringify(this._nativeGameServer));
        logger.log('model', `设置nativeGameServer`, this._nativeGameServer);
    }

    public init() {
        logger.log('renderer', `初始化RendererModel`);
        if (fs.existsSync(commonConfig.versionConfigPath)) {
            let data: string = fs.readFileSync(commonConfig.versionConfigPath, 'utf-8');
            this._versionConfig = JSON.parse(data);
            //新数据格式,return
            if (this._versionConfig.client && this._versionConfig.server) {
                return;
            }
        }

        this._versionConfig = {
            client: {
                beta: 0,
                ready: 0,
                release: 0
            },
            server: {
                beta: 0,
                ready: 0,
                release: 0
            }
        };
    }

    /** 获取版本配置值 */
    public getPackageVersion(packageType: CommonDefine.ePackageType, environ: CommonDefine.eEnvironName = commonConfig.environName) {
        return this._versionConfig[packageType][environ];
    }

    /** 设置版本配置值 */
    public setPackageVersion(packageType: CommonDefine.ePackageType, environ: CommonDefine.eEnvironName, value: string | number) {
        this._versionConfig[packageType][environ] = +value;
        fs.writeFileSync(commonConfig.versionConfigPath, JSON.stringify(this._versionConfig, null, 4), "utf-8");

        logger.log('renderer', `设置VersionConfigValue packageType:${packageType} environ:${environ} value:${value}`);
    }

    private _headerSetCookie: string[];
    public get headerSetCookie(): string[] {
        return this._headerSetCookie;
    }
    public setHeaderSetCookie(value: string[]): void {
        this._headerSetCookie = value;
    }
}

let rendererModel = new RendererModel();
export default rendererModel;