/** 
 * @Author 雪糕
 * @Description 渲染进程的数据
 * @Date 2020-02-13 14:54:50
 * @FilePath \pc\src\renderer\RendererModel.ts
 */
import * as logger from './logger';
import commonConfig from '../common/CommonConfig';
import { CommonDefine } from '../common/CommonDefine';
import FileUtil from '../common/FileUtil';

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

    private _nativeLoginResponse: unknown;
    /** native平台登陆信息 */
    public get nativeLoginResponse(): unknown {
        return this._nativeLoginResponse;
    }
    public setNativeLoginResponse(tValue: unknown): void {
        this._nativeLoginResponse = tValue;
        localStorage.setItem('nativeLoginResponse', JSON.stringify(this._nativeLoginResponse));
        logger.log('model', `设置nativeLoginResponse`);
    }

    public init(): void {
        logger.log('renderer', `初始化RendererModel`);
        if (FileUtil.existsSync(commonConfig.versionConfigPath)) {
            const data: string = FileUtil.readFileSync(commonConfig.versionConfigPath, 'utf-8');
            if (data) {
                this._versionConfig = JSON.parse(data);
                //新数据格式,return
                if (this._versionConfig.client && this._versionConfig.server) {
                    return;
                }
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
    public getPackageVersion(tPackageType: CommonDefine.ePackageType, tEnviron: CommonDefine.eEnvironName = commonConfig.environName): number {
        return this._versionConfig[tPackageType][tEnviron];
    }

    /** 设置版本配置值 */
    public setPackageVersion(tPackageType: CommonDefine.ePackageType, tEnviron: CommonDefine.eEnvironName, tValue: string | number): void {
        this._versionConfig[tPackageType][tEnviron] = +tValue;
        FileUtil.writeFileSync(commonConfig.versionConfigPath, JSON.stringify(this._versionConfig, null, 4), "utf-8");

        logger.log('renderer', `设置VersionConfigValue packageType:${tPackageType} environ:${tEnviron} value:${tValue}`);
    }

    private _headerSetCookie: string[];
    public get headerSetCookie(): string[] {
        return this._headerSetCookie;
    }
    public setHeaderSetCookie(tValue: string[]): void {
        this._headerSetCookie = tValue;
    }

    public clearData(): void {
        this.setHeaderSetCookie(null);
    }
}

const rendererModel = new RendererModel();
export default rendererModel;