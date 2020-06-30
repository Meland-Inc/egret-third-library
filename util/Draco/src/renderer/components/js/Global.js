import { ipcRenderer } from 'electron';
import { ModelMgr } from "./model/ModelMgr";

export class Global {
    static currentVersion = "1.9.8 beta10";
    static projPath = localStorage.getItem('client_project_path');
    static protoPath = localStorage.getItem('client_proto_path');
    static svnPath = localStorage.getItem('client_svn_path');
    static clientPath = localStorage.getItem('client_client_path');
    static author = localStorage.getItem("client_author");

    static eMode = {
        develop: "develop",
        product: "product",
        publish: "publish"
    }

    static _mode;
    static setMode(value) {
        this._mode = value;
        localStorage.setItem("mode", this._mode.name);
    }

    static get mode() {
        if (!this._mode) {
            let modeName = localStorage.getItem("mode");
            if (modeName) {
                this._mode = this.modeList.find(value => value.name === modeName);
            }
        }

        if (!this._mode) {
            this._mode = this.modeList.find(value => value.name === "develop")
        }
        return this._mode;
    }

    //工具模式
    static modeList = [
        {
            name: "develop", title: "开发模式", icon: "airplanemode_active",
            protoEnable: true, csvEnable: true, textureEnable: true, mapDataEnable: false, assetEnable: true,
            egretEnable: false, versionEnable: true, lessonEnable: false, appEnable: false, nativeEnable: false,
            textureGitEnable: false,
            environNames: [ModelMgr.versionModel.eEnviron.alpha]
        },
        {
            name: "product", title: "产品模式", icon: "drive_eta",
            protoEnable: false, csvEnable: true, textureEnable: true, mapDataEnable: false, assetEnable: false,
            egretEnable: true, versionEnable: false, lessonEnable: false, appEnable: false, nativeEnable: true,
            textureGitEnable: true,
            environNames: [ModelMgr.versionModel.eEnviron.alpha]

        },
        {
            name: "publish", title: "发布模式", icon: "accessible",
            protoEnable: false, csvEnable: false, textureEnable: false, mapDataEnable: false, assetEnable: false,
            egretEnable: false, versionEnable: true, lessonEnable: true, appEnable: true, nativeEnable: true,
            textureGitEnable: false,
            environNames: [ModelMgr.versionModel.eEnviron.beta, ModelMgr.versionModel.eEnviron.ready, ModelMgr.versionModel.eEnviron.release]
        }
    ]

    static get androidPath() {
        return Global.clientPath + '/platform/android';
    }

    static get svnCsvPath() {
        return Global.svnPath + ModelMgr.languageModel.curLanguage.csvPath;
    }

    static get svnUITextPath() {
        return Global.svnPath + ModelMgr.languageModel.curLanguage.UITextPath;
    }

    static get svnResPath() {
        return Global.svnPath + '/versionRes/trunk/settings/resource';
    }

    static get svnArtPath() {
        return Global.svnPath + '/art';
    }

    static get svnPublishPath() {
        return Global.svnPath + '/client/publish';
    }

    static get pbMessagePath() {
        return Global.protoPath + '/pbmessage';
    }

    static get releasePath() {
        return Global.projPath + '/bin-release/web';
    }

    static get rawResourcePath() {
        return Global.projPath + '/rawResource';
    }

    static get pcProjectPath() {
        return Global.clientPath + '/platform/pc';
    }

    static get nativeConfigPath() {
        return `${Global.clientPath}/platform/pc/dist/GlobalConfig.json`;
    }

    static get nativePackagePath() {
        return `${Global.clientPath}/platform/pc/package.json`;
    }

    // static get compressPath() {
    //     return Global.projPath + '/rawResource/asset/compress';
    // }

    static get originalPicPath() {
        return Global.projPath + '/rawResource/resource/originalPic';
    }

    static get compressResourcePath() {
        return Global.projPath + '/rawResource/resource/compress'
    }

    static get resourcePath() {
        return Global.projPath + '/resource';
    }

    static get cdnUrl() {
        return "http://bg-stage.wkcoding.com";
    }

    static entityCells = [];
    static objectCells = [];
    static variaCells = [];
    static materialCells = [];
    static objectStateCells = [];

    static toast(value) {
        console.log(value);
        ipcRenderer.send('client_show_toast', value);
    }

    static snack(value, e, needThrow = true) {
        if (e) {
            ipcRenderer.send('client_show_snack', `${value} ${e}`);
            console.error(`${value} ${e}`);
            if (needThrow) {
                throw new Error(value);

            }
        } else {
            ipcRenderer.send('client_show_snack', value);
            console.error(value);
            if (needThrow) {
                throw new Error(value);
            }
        }
    }

    static dialog(value) {
        ipcRenderer.send('client_show_dialog', value);
    }

    static showLoading() {
        ipcRenderer.send('client_show_loading');
    }

    static hideLoading() {
        ipcRenderer.send('client_hide_loading');
    }

    static showRegionLoading() {
        ipcRenderer.send('client_show_region_loading');
    }

    static hideRegionLoading() {
        ipcRenderer.send('client_hide_region_loading');
    }

    static showAlert(content) {
        return new Promise((resolve, reject) => {
            //     ipcRenderer.send('client_show_alert', content, cb.bind(this), resolve.bind(this));
            this.alertFunc(content, resolve);
        });
    }

    static alertFunc;

    static initAlertFunc(func) {
        this.alertFunc = func;
    }

    static async waitTime(time) {
        return new Promise((resolve, reject) => {
            let timeIndex = setTimeout(() => {
                resolve(timeIndex);
            }, this, time);
        });
    }

    static async executePromiseList(promiseList) {
        for (const iterator of promiseList) {
            try {
                await iterator();
            } catch (error) {
                Global.snack("", error);
            }
        }
    }
}

ipcRenderer.on('selected_client_project_path', (event, path) => {
    if (path) {
        Global.projPath = path[0];
    }
});

ipcRenderer.on('selected_client_proto_path', (event, path) => {
    if (path) {
        Global.protoPath = path[0];
    }
});

ipcRenderer.on('selected_client_svn_path', (event, path) => {
    if (path) {
        Global.svnPath = path[0];
    }
});

ipcRenderer.on('selected_client_client_path', (event, path) => {
    if (path) {
        Global.clientPath = path[0];
    }
});

