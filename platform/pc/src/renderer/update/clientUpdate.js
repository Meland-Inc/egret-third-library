/**
 * @author 雪糕 
 * @desc 游戏客户端包更新类
 * @date 2020-02-13 14:56:09 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-26 21:59:15
 */

import * as loading from '../loading.js';
import * as logger from '../logger.js';
import { Config } from '../Config.js';
import { StreamDownload } from './StreamDownload.js';

const fs = require('fs');
const admzip = require("adm-zip");
const http = require("http");

export class ClientUpdate {
    /** 补丁包目录 */
    patchUrl = "";
    /** 是否一次性下载 */
    allInOne = false;
    /** 本地初始的游戏版本 */
    startVersion = 0;
    /** 当前下载的游戏版本 */
    curVersion = 0;
    /** 最新游戏版本 */
    gameVersion = 0;
    /** 软件安装的资源目录 */
    resourcePath = Config.resourcePath;
    /** 补丁包数量 */
    patchCount = 0;
    /** 下载器 */
    download = new StreamDownload();

    /** 更新后回调 */
    updateCallback;
    /** 更新后回调参数 */
    updateCbArgs;

    /** 分支环境 */
    evnName;

    /** 策略文件host */
    policyHost = "";

    /** 策略文件相对host路径 */
    policyPath = "";

    /** 检查更新 */
    async checkUpdate(updateCallback, ...updateCbArgs) {
        try {
            this.updateCallback = updateCallback;
            this.updateCbArgs = updateCbArgs;
            let indexContent = await fs.readFileSync(`${Config.resourcePath}` + "index.html", "utf-8");
            let versionResult = indexContent.match(new RegExp(`let patchVersion = "([0-9]+)";`));
            this.curVersion = this.startVersion = +versionResult[1];

            //同样通过匹配获取当前环境
            let urlResult = indexContent.match(new RegExp(`let patchUrl = "([^\";]*)";`));
            this.patchUrl = `${Config.protocol}//${urlResult[1]}`;

            let evnResult = indexContent.match(new RegExp(`let evnName = "([^\";]*)";`));
            this.evnName = evnResult[1];

            let policyUrlResult = indexContent.match(new RegExp(`let policyUrl = "([^\";]*)";`));
            let policyUrl = policyUrlResult[1];
            this.policyHost = policyUrlResult[1].split("/")[0];
            this.policyPath = policyUrlResult[1].replace(this.policyHost, this.policyPath);
            logger.log(`renderer`, "native curVersion : ", this.curVersion, this.policyHost, this.policyPath, this.evnName, policyUrl);
            this.getPolicyVersion();
        } catch (error) {
            throw error;
        }
    }

    /** 获取策略版本 */
    getPolicyVersion() {
        //外部直接指定
        let policyQueryServer = 'policy-server.wkcoding.com';
        //没有指定需要获取
        let request = new XMLHttpRequest();
        let versionName = this.evnName;
        let channel = "bian_game";
        let time = '' + Math.floor(new Date().getTime() / 1000);
        let secret = "LznauW6GzBsq3wP6";
        let due = '' + 1800;
        let token = "*";

        let url = new URL(`${Config.protocol}//${policyQueryServer}/getVersion`, window.location);
        url.searchParams.append('versionName', versionName);
        url.searchParams.append('channel', channel);
        url.searchParams.append('time', time);
        url.searchParams.append('due', due);
        url.searchParams.append('token', token);

        request.open("GET", url.toString());
        request.onreadystatechange = () => {
            if (request.readyState !== 4) return;
            if (request.status === 200) {
                let data = JSON.parse(request.responseText);
                let policyVersion = data.Data.Version;
                logger.log(`renderer`, `策略版本号:${policyVersion}`)
                this.startLoadPolicy(policyVersion);
            } else {
                let content = "获取策略版本号错误!";
                logger.error(`renderer`, content);
                alert(content);
                this.executeUpdateCallback();
            }
        }
        request.send();
    }

    /** 加载策略文件 */
    startLoadPolicy(policyVersion) {
        let options = {
            host: this.policyHost, // 请求地址 域名，google.com等.. 
            // port: 10001,
            path: `${this.policyPath}/policyFile_v${policyVersion}.json`, // 具体路径eg:/upload
            method: 'GET', // 请求方式, 这里以post为例
            headers: { // 必选信息,  可以抓包工看一下
                'Content-Type': 'application/json'
            }
        };
        http.get(options, (response) => {
            if (response.statusCode != 200) {
                console.error("[policy] can not load policy, version=" + policyVersion + ", statusCode=" + response.statusCode + ",option =" + options.host + options.path);
                throw "can not load policy!";
            }

            let resData = "";
            response.on("data", (data) => {
                resData += data;
            });
            response.on("end", async () => {
                let obj = JSON.parse(resData);
                this.gameVersion = obj.normalVersion;
                logger.log(`renderer`, `游戏版本号:${this.gameVersion}`)

                this.patchCount = this.gameVersion - this.startVersion;
                if (this.patchCount > 0) {
                    this.installSinglePatch();
                } else {
                    this.executeUpdateCallback();
                }
            });
        })
    }

    /** 下载文件回调 */
    async downloadFileCallback(arg, filename, percentage) {
        if (arg === "progress") {
            // 显示进度
            if (this.allInOne) {
                loading.setLoadingProgress(percentage);
            } else {
                let each = 100 / this.patchCount;
                loading.setLoadingProgress(percentage / 100 * each + (this.curVersion - this.startVersion) * each);
            }
        }
        else if (arg === "finished") {
            // 通知完成
            try {
                let zip = new admzip(this.resourcePath + filename);
                zip.extractAllTo(this.resourcePath, true);
            } catch (error) {
                let content = `解压文件:${filename}错误`
                logger.error(`update`, content, error);
                alert(content);
                this.executeUpdateCallback();
            }
            fs.unlink(this.resourcePath + filename, (err) => {
                if (err) {
                    throw err;
                }
                logger.log(`update`, '文件:' + filename + '删除成功！');
            });
            let indexContent = await fs.readFileSync(this.resourcePath + "index.html").toString();
            let matchResult = indexContent.match(new RegExp(`let patchVersion = "([0-9]+)";`));
            this.curVersion = +matchResult[1];
            if (this.curVersion >= this.gameVersion) {
                this.executeUpdateCallback();
            } else {
                this.installSinglePatch()
            }

        } else if (arg == "404") {
            let content = `下载文件:${filename}错误, 文件不存在!`;
            logger.error(`update`, content);
            alert(content);

            //一次性下载不到，就一个一个来
            if (this.allInOne) {
                this.installSinglePatch();
            } else {
                this.executeUpdateCallback();
            }
        }
    }

    /** 下载所有补丁包 */
    installAllPatch() {
        this.allInOne = true;
        loading.showLoading();
        this.download.downloadFile(this.patchUrl, this.resourcePath, `patch_v${this.startVersion}s_v${this.gameVersion}s.zip`, this.downloadFileCallback.bind(this));
        this.curVersion = this.gameVersion;
    }

    /** 下载单个补丁包 */
    installSinglePatch() {
        try {
            loading.showLoading();
            this.download.downloadFile(this.patchUrl, this.resourcePath, `patch_v${this.curVersion}s_v${this.curVersion + 1}s.zip`, this.downloadFileCallback.bind(this));
        } catch (error) {
            throw error;
        }
    }

    /** 执行更新后回调 */
    executeUpdateCallback() {
        loading.hideLoading();
        if (this.updateCallback) {
            this.updateCallback(...this.updateCbArgs);
        }
    }
}