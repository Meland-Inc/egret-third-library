/** 
 * @Author 雪糕
 * @Description 下载类
 * @Date 2020-02-25 10:50:36
 * @FilePath \pc\src\renderer\update\StreamDownload.ts
 */
import request from 'request';
import path from 'path';
import * as fse from 'fs-extra';

import * as logger from '../logger';
import FileUtil from '../../common/FileUtil';

export default class StreamDownload {
    // 声明下载过程回调函数
    private _downloadCallback: (...tParam: unknown[]) => void = null;
    private _fileUrl: string = null;
    private _fileStream: fse.WriteStream = null;

    // 下载进度
    private showProgress(tReceived: number, tTotal: number): void {
        const percentage = (tReceived * 100) / tTotal;
        // 用回调显示到界面上
        this._downloadCallback && this._downloadCallback('progress', "", percentage);
    }

    // 下载过程
    /**
     * 
     * @param tFileDir 下载文件的目录
     * @param tSaveDir 下载后存放的目录
     * @param tFilename 下载文件的名称
     * @param tCallback 下载完成的回调方法
     */
    public downloadFile(tFileDir: string, tSaveDir: string, tFilename: string, tCallback: () => void): void {

        logger.log(`update`, `开始下载文件`, tFileDir, tFilename, tSaveDir);
        this._downloadCallback = tCallback; // 注册回调函数
        this._fileUrl = tFileDir + "/" + tFilename;

        let receivedBytes = 0;
        let totalBytes = 1;
        const req = request({
            method: 'GET',
            uri: this._fileUrl
        });

        req.on('response', (tData: { statusCode: number, headers: Record<string, unknown> }) => {
            // 更新总文件字节大小
            if (tData.statusCode == 404) {
                logger.error(`update`, `下载patch包路径找不到文件`, this._fileUrl);
                this._downloadCallback('404', tFilename, 100);
                this._downloadCallback = null;
            } else {
                totalBytes = parseInt(tData.headers['content-length'] as string, 10);
            }
        });

        req.on('data', (tChunk: { length: number }) => {
            // 更新下载的文件块字节大小
            receivedBytes += tChunk.length;
            this.showProgress(receivedBytes, totalBytes);
        });

        req.on('end', () => {
            this._fileStream && this._fileStream.end();
            logger.log(`update`, `下载已完成，等待处理`, tFilename);
            // TODO: 检查文件，部署文件，删除文件
            setTimeout(() => {
                this._downloadCallback && this._downloadCallback('finished', tFilename, 100);
                this._downloadCallback = null;
            }, 500);
        });

        req.on('error', (tError: { message: string }) => {
            this._downloadCallback && this._downloadCallback('error', tFilename, 100, tError.message);
            this._downloadCallback = null;
        });

        const filePath = path.join(tSaveDir, tFilename);
        this._fileStream = FileUtil.createWriteStream(filePath);
        if (this._fileStream) {
            req.pipe(this._fileStream);
        }

    }
}