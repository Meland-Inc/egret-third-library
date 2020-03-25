import * as fs from "fs";
import * as archiver from "archiver";
import * as fsExc from "../FsExecute";
import { Global } from "../Global";
import * as tableExc from "../TableExecute";

/**鲸幂模块 */
export class JimmyModel {
    needTableNames = ['Language.csv', 'GameValue.csv'];//需要的所有配置

    /**处理鲸幂相关csv资源 */
    async processJimmyCSV(params) {
        return new Promise(async (resolve, reject) => {
            let pa = await fsExc.readDir(Global.svnCsvPath);
            let archive = archiver("zip");
            let fileName = "jimmyCsv.bin";
            let filePath = Global.projPath + "/resource/jimmyAssets/csv/";
            let csvZipFile = fs.createWriteStream(filePath + fileName);
            archive.pipe(csvZipFile);

            for (let i = 0; i < pa.length; i++) {
                const element = pa[i];
                if (element.indexOf(".csv") != -1) {
                    let csvContent = await tableExc.readCsvContent(Global.svnCsvPath + "/" + element);
                    if (this.needTableNames.indexOf(element) >= 0) {
                        archive.append(csvContent, {
                            name: element
                        });
                    }
                }
            }

            csvZipFile.on("error", error => {
                Global.snack('压缩鲸幂Zip文件错误', error);
                reject();
            });
            csvZipFile.on("close", () => {
                Global.toast('压缩鲸幂zip文件成功');
                resolve();
            });
            archive.finalize();
        })
    }

    init() {
    }
}
