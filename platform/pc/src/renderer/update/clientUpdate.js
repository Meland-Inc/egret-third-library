/**
 * @author 雪糕 
 * @desc 处理游戏客户端包更新逻辑
 * @date 2020-02-13 14:56:09 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-25 15:46:03
 */

import * as loading from '../loading.js';
import * as config from '../config.js';
import * as logger from '../logger.js';
import { StreamDownload } from './StreamDownload.js';

const fs = require('fs');
const admzip = require("adm-zip");

export class ClientUpdate {
    patchUrl = "http://planet.wkcoding.com/web/beta/";
    allInOne = false;
    startVersion = 0;
    curVersion = 0;
    gameVersion = 0;
    resourcePath = config.resourcePath;
    patchCount = 0;
    // let resourcePath = "./resources/app/client/";
    // if (navigator.userAgent.indexOf("Mac") > 0) {
    //     resourcePath = "./Applications/bellplanet.app/Contents/Resources/app/client/";
    // }
    download = new StreamDownload();

    async downloadFileCallback(arg, filename, percentage) {
        if (arg === "progress") {
            // 显示进度
            if (this.allInOne) {
                loading.setLoadingProgress(percentage);
            } else {
                let each = 100 / this.patchCount;
                loading.setLoadingProgress(percentage / 100 * each + (this.curVersion - this.startVersion - 1) * each);
            }
        }
        else if (arg === "finished") {
            // 通知完成
            try {
                let zip = new admzip(this.resourcePath + filename);
                zip.extractAllTo(this.resourcePath, true);
            } catch (error) {
                logger.error(`update`, `解压${filename}报错`, error);
                this.startRunGame();
            }
            fs.unlink(this.resourcePath + filename, (err) => {
                if (err) {
                    throw err;
                }
                logger.log(`update`, '文件:' + filename + '删除成功！');
            });
            let indexContent = await fs.readFileSync(resourcePath + "index.html").toString();
            let matchResult = indexContent.match(new RegExp(`let patchVersion = "([0-9]+)";`));
            this.curVersion = +matchResult[1];
            if (this.curVersion >= this.gameVersion) {
                this.startRunGame();
            } else {
                this.installSinglePatch()
            }

        } else if (arg == "404") {
            //一次性下载不到，就一个一个来
            if (this.allInOne) {
                this.installSinglePatch();
            } else {
                this.startRunGame();
            }
        }
    }

    installAllPatch() {
        this.allInOne = true;
        this.download.downloadFile(this.patchUrl, this.resourcePath, `patch_v${this.startVersion}s_v${this.gameVersion}s.zip`, this.downloadFileCallback.bind(this));
        this.curVersion = this.gameVersion;
    }

    installSinglePatch() {
        try {
            this.download.downloadFile(this.patchUrl, this.resourcePath, `patch_v${this.curVersion}s_v${this.curVersion + 1}s.zip`, this.downloadFileCallback.bind(this));
        } catch (error) {
            throw error;
        }
    }

    async  startRunGame() {

    }
}