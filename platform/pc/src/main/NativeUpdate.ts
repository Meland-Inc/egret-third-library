/**
 * @author 雪糕 
 * @desc native包更新类
 * @date 2020-03-25 17:36:41 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-26 00:44:08
 */
import os from 'os';
import { autoUpdater } from 'electron-updater';
import { logger } from './logger';
import message from './Message';
import config from './Config';

export default class NativeUpdate {
    public checkUpdate(nativePolicyVersion: number) {
        this.setFeedURL(nativePolicyVersion);

        // eslint-disable-next-line handle-callback-err
        autoUpdater.on('error', (error) => {
            logger.error('update', `检查更新出错`, error);
            this.checkUpdateComplete();
        });

        autoUpdater.on('checking-for-update', () => {
            logger.log('update', `开始检查更新……`);
        });

        autoUpdater.on('update-available', (info) => {
            logger.log('update', `检测到新版本，开始下载……`, info);
            message.sendIpcMsg("SHOW_LOADING", "正在更新native包");
        });

        autoUpdater.on('update-not-available', (info) => {
            logger.log('update', `现在使用的就是最新版本，不用更新`, info);
            this.checkUpdateComplete();
        });

        // 更新下载进度事件
        autoUpdater.on('download-progress', (progressObj) => {
            message.sendIpcMsg("SET_LOADING_PROGRESS", progressObj.percent);
        });

        autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) => {
            logger.log('update', `下载完成,开始安装更新包`);
            autoUpdater.quitAndInstall();
        });

        autoUpdater.checkForUpdates();
    }

    private async setFeedURL(nativePolicyVersion: number) {
        let environName = config.environName;
        let isWin = os.platform() === "win32";
        let pkgPlatform = isWin ? "win" : "mac";
        let feedURL = `http://bg-stage.wkcoding.com/native/${environName}/${nativePolicyVersion}/${pkgPlatform}`;
        logger.log(`update`, `feedURL:${feedURL}`);
        autoUpdater.setFeedURL(feedURL);
    }

    private checkUpdateComplete() {
        message.sendIpcMsg("CHECK_PACKAGE_UPDATE");
    }
}