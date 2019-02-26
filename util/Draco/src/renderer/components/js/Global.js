import { ipcRenderer } from 'electron';
import { error } from 'util';

// global.getSvnCsvPath() = global.svnPath + '/settings/csv';
// global.getSvnResPath() = global.svnPath + '/settings/resource';
// global.svnArtPath = global.svnPath + '/art';
// global.svnPublishPath = global.svnPath + '/client/publish';

export class Global {
    static currentVersion = "1.9.0 beta6";
    static projPath = localStorage.getItem('client_project_path');
    static projPath = localStorage.getItem('client_project_path');
    static protoPath = localStorage.getItem('client_proto_path');
    static svnPath = localStorage.getItem('client_svn_path');
    static clientPath = localStorage.getItem('client_client_path');

    static get androidPath() {
        return Global.clientPath + '/platform/android';
    }

    static get svnCsvPath() {
        return Global.svnPath + '/settings/csv';
    }

    static get svnResPath() {
        return Global.svnPath + '/settings/resource';
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


    static objectCells = [];
    static variaCells = [];
    static materialCells = [];

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
            let timeIndex = egret.setTimeout(() => {
                resolve(timeIndex);
            }, this, time);
        });
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