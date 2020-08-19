/** 
 * @Author 雪糕
 * @Description native包更新类
 * @Date 2020-03-25 17:36:41
 * @FilePath \pc\src\main\NativeUpdate.ts
 */
import os from 'os';
import { autoUpdater } from 'electron-updater';

import commonConfig from '../common/CommonConfig';
import MsgId from '../common/MsgId';

import { logger } from './logger';
import message from './Message';
import mainModel from './MainModel';

export default class NativeUpdate {
    public checkUpdate(tNativePolicyVersion: number): void {
        this.setFeedURL(tNativePolicyVersion);

        // eslint-disable-next-line handle-callback-err
        autoUpdater.on('error', (tError: unknown) => {
            logger.error('update', `检查更新出错`, tError);
            this.checkUpdateComplete();
        });

        autoUpdater.on('checking-for-update', () => {
            logger.log('update', `开始检查更新……`);
        });

        autoUpdater.on('update-available', (tInfo: unknown) => {
            logger.log('update', `检测到新版本，开始下载……`, tInfo);
            message.sendIpcMsg(MsgId.SHOW_LOADING, "正在更新native包");
        });

        autoUpdater.on('update-not-available', (tInfo: unknown) => {
            logger.log('update', `现在使用的就是最新版本，不用更新`, tInfo);
            this.checkUpdateComplete();
        });

        // 更新下载进度事件
        autoUpdater.on('download-progress', (tProgressObj: Record<string, unknown>) => {
            message.sendIpcMsg(MsgId.SET_LOADING_PROGRESS, tProgressObj.percent);
        });

        autoUpdater.on('update-downloaded', (tEvent: unknown, tReleaseNotes: unknown, tReleaseName: unknown, tReleaseDate: unknown, tUpdateUrl: unknown, tQuitAndUpdate: unknown) => {
            logger.log('update', `下载完成,开始安装更新包`);
            mainModel.setIsQuitAndInstall(true);
            autoUpdater.quitAndInstall();
        });

        autoUpdater.checkForUpdates();
    }

    private setFeedURL(tNativePolicyVersion: number): void {
        const environName = commonConfig.environName;
        const isWin = os.platform() === "win32";
        const pkgPlatform = isWin ? "win" : "mac";
        const feedURL = `http://bg-stage.wkcoding.com/native/${environName}/${tNativePolicyVersion}/${pkgPlatform}`;
        logger.log(`update`, `feedURL:${feedURL}`);
        autoUpdater.setFeedURL(feedURL);
    }

    private checkUpdateComplete(): void {
        message.sendIpcMsg(MsgId.CHECK_PACKAGE_UPDATE);
    }
}