/**
 * @author 雪糕 
 * @desc native包更新类
 * @date 2020-03-25 17:36:41 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-25 18:43:13
 */
import { autoUpdater } from 'electron-updater';
import { logger } from './logger';
import message from './Message';
import os from 'os';
import config from './Config';
import { util } from './util';

export default class NativeUpdate {
    public checkUpdate() {
        this.setFeedURL();
        // autoUpdater.setFeedURL("http://bg-stage.wkcoding.com/native/beta/v1");


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

    private async setFeedURL() {
        let platform = os.platform();
        if (platform != "win32" && platform != "darwin") {
            return;
        }

        let environName = config.environName;

        let isWin = platform === "win32";
        let pkgPlatform = isWin ? "win" : "mac";
        let suffix = isWin ? "exe" : "dmg";
        let versionName = `${environName}_native_${pkgPlatform}`;
        let nativeVersion = await util.getPolicyNum(versionName);
        let nativeName = `bellplanet_${environName}_${nativeVersion}.${suffix}`;
        let nativeCdnPath = `http://bg-stage.wkcoding.com/native/${nativeName}`;
    }

    private checkUpdateComplete() {
        message.sendIpcMsg("CHECK_PACKAGE_UPDATE");
    }
}