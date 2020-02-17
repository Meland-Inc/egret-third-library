/**
 * @author 雪糕 
 * @desc 处理游戏客户端包更新逻辑
 * @date 2020-02-13 14:56:09 
 * @Last Modified by 雪糕 
 * @Last Modified time 2020-02-13 14:56:09 
 */

import * as loading from '../loading.js';
import * as config from '../config.js';
import * as logger from '../logger.js';

const request = require('request');
const fs = require('fs');
const path = require('path');
const admzip = require("adm-zip");
let patchUrl = "http://planet.wkcoding.com/web/beta/";
let allInOne = false;
let startVersion = 0;
let curVersion = 0;
let gameVersion = 0;
let patchCount = 1;
let resourcePath = config.resourcePath;
// let resourcePath = "./resources/app/client/";
// if (navigator.userAgent.indexOf("Mac") > 0) {
//     resourcePath = "./Applications/bellplanet.app/Contents/Resources/app/client/";
// }
const download = new StreamDownload();

function downloadFileCallback(arg, filename, percentage) {
    if (arg === "progress") {
        // 显示进度
        if (allInOne) {
            loading.setLoadingProgress(percentage);
        } else {
            var each = 100 / patchCount;
            loading.setLoadingProgress(percentage / 100 * each + (curVersion - startVersion - 1) * each);
        }
    }
    else if (arg === "finished") {
        // 通知完成
        try {
            var zip = new admzip(resourcePath + filename);
            zip.extractAllTo(resourcePath, true);
        } catch (error) {
            logger.error(`update`, `解压${filename}报错`, error);
            startRunGame();
        }
        fs.unlink(resourcePath + filename, (err) => {
            if (err) {
                throw err;
            }
            logger.log(`update`, '文件:' + filename + '删除成功！');
        });
        var indexContent = fs.readFileSync(resourcePath + "index.html").toString();
        var matchResult = indexContent.match(new RegExp(`let patchVersion = "([0-9]+)";`));
        curVersion = +matchResult[1];
        if (curVersion >= gameVersion) {
            startRunGame();
        } else {
            installSinglePatch()
        }

    } else if (arg == "404") {
        //一次性下载不到，就一个一个来
        if (allInOne) {
            installSinglePatch();
        } else {
            startRunGame();
        }
    }
}

function installAllPatch() {
    allInOne = true;
    download.downloadFile(patchUrl, resourcePath, `patch_v${startVersion}s_v${gameVersion}s.zip`, downloadFileCallback);
    curVersion = gameVersion;
}

// // ---- 下载类 ---- //
function StreamDownload() {
    // 声明下载过程回调函数
    this.downloadCallback = null;
    this.patchUrl = null;
    this.fileStream = null;
}

// // 下载进度
StreamDownload.prototype.showProgress = function (received, total) {
    const percentage = (received * 100) / total;
    // 用回调显示到界面上
    this.downloadCallback && this.downloadCallback('progress', "", percentage);
};

// // 下载过程
StreamDownload.prototype.downloadFile = function (patchUrl, baseDir, filename, callback) {
    try {
        logger.log(`update`, `开始下载文件`, patchUrl, filename, baseDir)
        this.downloadCallback = callback; // 注册回调函数
        this.patchUrl = patchUrl + "/" + filename;

        let receivedBytes = 0;
        let totalBytes = 1;
        let req = null;
        try {
            req = request({
                method: 'GET',
                uri: this.patchUrl
            });
        } catch (error) {
            throw error;
        }


        req.on('response', (data) => {
            // 更新总文件字节大小
            if (data.statusCode == 404) {
                logger.error(`update`, `下载patch包路径找不到文件`, this.patchUrl);
                this.downloadCallback('404', filename, 100);
                this.downloadCallback = null;
            } else {
                totalBytes = parseInt(data.headers['content-length'], 10);
            }
        });

        req.on('data', (chunk) => {
            // 更新下载的文件块字节大小
            receivedBytes += chunk.length;
            this.showProgress(receivedBytes, totalBytes);
        });

        req.on('end', () => {
            this.fileStream && this.fileStream.end();
            logger.log(`update`, `下载已完成，等待处理`, filename)
            // TODO: 检查文件，部署文件，删除文件
            setTimeout(() => {
                this.downloadCallback && this.downloadCallback('finished', filename, 100);
                this.downloadCallback = null;
            }, 500)
        })
        var filepath = path.join(baseDir, filename);
        this.fileStream = fs.createWriteStream(filepath);
        req.pipe(this.fileStream);

    } catch (error) {
        throw error
    }
}

export function installSinglePatch() {
    try {
        download.downloadFile(patchUrl, resourcePath, `patch_v${curVersion}s_v${curVersion + 1}s.zip`, downloadFileCallback);
    } catch (error) {
        throw error
    }
}

// exports.installSinglePatch = installSinglePatch;