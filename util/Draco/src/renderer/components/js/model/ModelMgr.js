import { VersionModel } from "./VersionModel";
import { FtpModel } from "./FtpModel";
import { LanguageModel } from "./LanguageModel";
import { JimmyModel } from "./JimmyModel";
export class ModelMgr {
    static versionModel = new VersionModel();
    static ftpModel = new FtpModel();
    static languageModel = new LanguageModel();
    static jimmyModel = new JimmyModel();

    static async init() {
        await this.versionModel.init();
        await this.ftpModel.init();
        this.languageModel.init();
        this.jimmyModel.init();
    }
}