import * as qiniu from "qiniu";
export class FtpModel {
    useCdn;
    accessKey = "hqe7ccaWIsUh746B9sJN0EQvBa2HIaazEinvQNUN";
    secretKey = "Q1CsrT0O6X2SOiHE1MnowZzWoXoSIVTvPQVebLsu";
    uploadToken;
    qiniuConfig;
    uploaderCount = 10;

    async init() {
        // await this.initQiniuOption();
    }

    async initQiniuOption() {
        let options = {
            scope: "bp-stage",
            expires: 1000 * 60 * 60 * 3
        };
        let putPolicy = new qiniu.rs.PutPolicy(options);
        let mac = new qiniu.auth.digest.Mac(this.accessKey, this.secretKey);
        this.uploadToken = putPolicy.uploadToken(mac);
        console.log(`--> qiniu uploadToken ${this.uploadToken}`);

        this.qiniuConfig = new qiniu.conf.Config();
        // 空间对应的机房
        this.qiniuConfig.zone = qiniu.zone.Zone_z2;
        // 是否使用https域名
        this.qiniuConfig.useHttpsDomain = true;
        // 上传是否使用cdn加速
        this.qiniuConfig.useCdnDomain = true;
    }
}