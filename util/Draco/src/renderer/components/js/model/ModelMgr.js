import { VersionModel } from "./VersionModel";
import { FtpModel } from "./FtpModel";
import { LanguageModel } from "./LanguageModel";
export class ModelMgr {
    static versionModel = new VersionModel();
    static ftpModel = new FtpModel();
    static languageModel = new LanguageModel();

    static async init() {
        await this.versionModel.init();
        await this.ftpModel.init();
        this.languageModel.init();
    }
}