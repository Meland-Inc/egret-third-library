import { Global } from './Global.js';
import * as fsExc from "./FsExecute.js";
import * as spawnExc from './SpawnExecute.js';

import * as cpy from 'cpy';


var checkBoxData = [];
export function getCheckBoxData() { return checkBoxData; }
export function setCheckBoxData(value) { checkBoxData = value; }

export const checkBoxValues = ['安卓', '苹果', '微信'];


export const androidList = [
    { name: "business_webview", path: "android_business_webview" },
    { name: "test_webview", path: "android_test_webview" },
    { name: "business_runtime", path: "android_business_runtime" },
    { name: "test_runtime", path: "android_test_runtime" },
];

export async function getAndroidPaths() {
    let paths = []
    if (await fsExc.exists(Global.androidPath)) {
        paths = await fsExc.readDir(Global.androidPath);
    }

    return paths;
}
export function getIosPaths() {
    return [];
}

export function getWechatPaths() {
    return [];
}

var gameVersion;
export function getGameVersion() { return gameVersion; }
export function setGameVersion(value) {
    gameVersion = value;
}

var appProjs;
export function setAppProjs(value) {
    appProjs = value;
}

export async function exportVersion() {
    if (!gameVersion) {
        Global.snack('请先设置新版本目录');
        return;
    }

    if (checkBoxData.length == 0) {
        Global.snack('请选择要导出的版本');
        return;
    }

    for (const iterator of checkBoxData) {
        switch (checkBoxValues.indexOf(iterator)) {
            case 0:
                await exportAndroid();
                break;
            case 1:
                await exportIOS();
                break;
            case 2:
                await exportWeChat();
                break;
        }
    }
}

async function exportAndroid() {
    if (!Global.androidPath) {
        Global.snack('请先设置client目录');
        return;
    }

    if (!appProjs[0]) {
        Global.snack('请先选择安卓版本');
        return;
    }

    let gamePath = `${Global.androidPath}/${appProjs[0]}/app/src/main/assets/game`;
    let webReleasePath = `${Global.svnPublishPath}/web/${gameVersion}`;
    let cdnReleasePath = `${Global.svnPublishPath}/cdn/${gameVersion}`;

    try {
        await fsExc.delFiles(gamePath);

        await fsExc.copyFile(webReleasePath, gamePath, true);
        await fsExc.copyFile(cdnReleasePath, gamePath, true);

        // //js
        // await fsExc.delAndCopyFile(webReleasePath + "/js", gamePath + "/js", true);

        // //resource
        // await fsExc.delAndCopyFile(cdnReleasePath + "/resource", gamePath + "/resource", true);


        // //index.html
        // await fsExc.copyFile(webReleasePath + "/index.html", gamePath);

        // //manifest.json
        // await fsExc.copyFile(webReleasePath + "/manifest.json", gamePath);

        // //policyFile.json
        // await fsExc.copyFile(webReleasePath + "/policyFile.json", gamePath);
        Global.toast('导出安卓成功');
    } catch (e) {
        Global.snack('导出安卓失败', e);
    }

}
async function exportIOS() {
    if (!Global.iosPath) {
        Global.snack('请先设置IOS发布目录');
        return;
    }

    let gamePath = Global.iosPath + "/assets/game";
    let webReleasePath = `${Global.svnPublishPath}/web/${gameVersion}`;
    let cdnReleasePath = `${Global.svnPublishPath}/cdn/${gameVersion}`;

    try {
        await fsExc.delFiles(gamePath);

        await fsExc.copyFile(webReleasePath, gamePath, true);
        await fsExc.copyFile(cdnReleasePath, gamePath, true);

        Global.toast('导出IOS成功');
    } catch (e) {
        Global.snack('导出IOS失败', e);
    }

    // //js
    // await fsExc.delFolder(gamePath + '/js')
    // await fsExc.copyFile(webReleasePath + "/js", gamePath + "/js");

    // //resource
    // await fsExc.delFolder(gamePath + '/resource')
    // await fsExc.copyFile(cdnReleasePath + "/resource", gamePath + "/resource");

    // //index.html
    // await fsExc.delFile(gamePath + "/index.html");
    // await fsExc.copyFile(webReleasePath + "/index.html", gamePath + "/index.html");

    // //manifest.json
    // await fsExc.delFile(gamePath + "/manifest.json");
    // await fsExc.copyFile(webReleasePath + "/manifest.json", gamePath + "/manifest.json");


    // //policyFile.json
    // await fsExc.delFile(gamePath + "/policyFile.json");
    // await fsExc.copyFile(webReleasePath + "/policyFile.json", gamePath + "/policyFile.json");
}

async function exportWeChat() {
    if (!Global.weChatPath) {
        Global.snack('请先设置微信小游戏发布目录');
        return;
    }

    let cmdStr = "egret publish --target wxgame";
    await spawnExc.runCmd(cmdStr, Global.projPath, null, '发布项目错误');

    //version.js
    let versionContent = await fsExc.readFile(`${mdPublish.svnPublishPath}/web/${gameVersion}/policyFile.json`);
    versionContent = "export default " + versionContent;
    fs.writeFileSync(Global.weChatPath + "/version.js", versionContent);

    //game.js
    let gameContent = await fsExc.readFile(Global.weChatPath + "/game.js");
    if (gameContent.indexOf("version.") == -1) {
        gameContent = `var version = require("./version.js");\nwindow.gameVersion = version.default.version;\n` + gameContent;
        await fsExc.writeFile(Global.weChatPath + "/game.js", gameContent);
    }

    //删除resource
    await fsExc.delFolder(Global.weChatPath + "/resource");
}

export async function exportApk() {
    if (!Global.androidPath) {
        Global.snack("请先设置client目录");
        return;
    }

    if (!appProjs[0]) {
        Global.snack('请先选择安卓版本');
        return;
    }

    // let cmdStr = "gradle build";

    let gamePath = `${Global.androidPath}/${appProjs[0]}`;

    let cmdStr = "gradle assembleRelease";
    await spawnExc.runCmd(cmdStr, gamePath, null, '打包APK错误');
    await fsExc.copyFile(Global.clientPath + "/app/build/outputs/apk/app-release.apk", Global.svnPath + "/client/app/planet.apk");
    Global.toast('打包APK成功');
}

export async function exportIpa() {
    if (!Global.iosPath) {
        Global.snack('请先设置苹果发布目录');
        return;
    }

    let xcodeprojPath = Global.iosPath + "/ios-template.xcodeproj";
    let archivePath = Global.svnPath + "/client/app/planet.xcarchive";
    let appPath = Global.svnPath + "/client/app/";
    let plistPath = Global.iosPath + "/ios-template/Info.plist";

    let cleanCmd = `xcodebuild clean -project ${xcodeprojPath} -scheme planet -configuration Release`;
    let archiveCmd = `xcodebuild archive -project ${xcodeprojPath} -scheme planet -archivePath ${archivePath}`;
    let exportCmd = `xcodebuild -exportArchive -archivePath ${archivePath} -exportPath ${appPath} -exportOptionsPlist ${plistPath}`;
    let cmdStr = cleanCmd + "\n" + archiveCmd + "\n" + exportCmd;

    await spawnExc.runCmd(cmdStr, Global.iosPath, '打包IPA成功', '打包IPA错误');
}