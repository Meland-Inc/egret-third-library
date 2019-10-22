import { VersionModel } from "./VersionModel";
import { FtpModel } from "./FtpModel";
export class ModelMgr {
    static versionModel = new VersionModel();
    static ftpModel = new FtpModel();

    static async init() {
        await this.versionModel.init();
        await this.ftpModel.init();
    }
}