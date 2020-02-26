/**
 * @author 雪糕 
 * @desc 下载类
 * @date 2020-02-25 10:50:36 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-25 15:45:51
 */
import * as logger from '../logger.js';
const fs = require('fs');
const request = require('request');
const path = require('path');

export class StreamDownload {
    // 声明下载过程回调函数
    downloadCallback = null;
    patchUrl = null;
    fileStream = null;

    // 下载进度
    showProgress(received, total) {
        const percentage = (received * 100) / total;
        // 用回调显示到界面上
        this.downloadCallback && this.downloadCallback('progress', "", percentage);
    };

    // 下载过程
    downloadFile(patchUrl, baseDir, filename, callback) {
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
}