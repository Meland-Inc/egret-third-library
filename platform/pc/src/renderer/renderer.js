/**
 * @author 雪糕 
 * @desc renderer主程序
 * @date 2020-02-18 11:44:51 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-25 15:53:06
 */
import { ClientUpdate } from './update/ClientUpdate.js';
import * as config from './config.js';
import * as logger from './logger.js';

const fs = require('fs');
const http = require("http");
let evnName = "beta";
let policyHost = "";
let policyPath = "";
let policyUrl = "";
let clientUpdate = new ClientUpdate();
// let tryCount = 0;

function getPolicyVersion() {
    //外部直接指定
    // let policyVersion = "";
    let policyQueryServer = 'policy-server.wkcoding.com';
    //没有指定需要获取
    let request = new XMLHttpRequest();
    let versionName = evnName;
    let channel = "bian_game";
    let time = '' + Math.floor(new Date().getTime() / 1000);
    let secret = "LznauW6GzBsq3wP6";
    let due = '' + 1800;
    let token = "*";

    let url = new URL(`${config.protocol}//${policyQueryServer}/getVersion`, window.location);
    url.searchParams.append('versionName', versionName);
    url.searchParams.append('channel', channel);
    url.searchParams.append('time', time);
    url.searchParams.append('due', due);
    url.searchParams.append('token', token);

    request.open("GET", url.toString());
    request.onreadystatechange = function () {
        if (request.readyState !== 4) return;
        if (request.status === 200) {
            let data = JSON.parse(request.responseText);
            let policyVersion = data.Data.Version;
            logger.log(`renderer`, `策略版本号:${policyVersion}`)
            startLoadPolicy(policyVersion);
        } else {
            logger.error(`renderer`, "获取版本号错误!")
            throw "获取版本号错误!";
        }
    }
    request.send(null);
}

function startLoadPolicy(policyVersion) {
    let options = {
        host: policyHost, // 请求地址 域名，google.com等.. 
        // port: 10001,
        path: `${policyPath}/policyFile_v${policyVersion}.json`, // 具体路径eg:/upload
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
            clientUpdate.gameVersion = obj.normalVersion;
            logger.log(`renderer`, `游戏版本号:${clientUpdate.gameVersion}`)

            clientUpdate.patchCount = clientUpdate.gameVersion - clientUpdate.startVersion;
            if (clientUpdate.patchCount > 0) {
                clientUpdate.installSinglePatch();
            } else {
                startRunGame();
            }
        });
    })
}

async function startRunGame() {
    let content = await fs.readFileSync(config.globalConfigPath, "utf-8");
    let globalConfigData = JSON.parse(content);
    if (globalConfigData) {
        localStorage.setItem(config.nativeConfig, JSON.stringify(globalConfigData));
    }

    let hrefArr = location.href.split(".html");
    if (hrefArr[1] != "") {
        location.href = `${config.rootPath}/package/client/index.html${hrefArr[1]}`;
    } else {
        location.href = `${config.rootPath}/package/client/index.html`;
    }
}

try {
    let resourcePath = config.resourcePath;
    fs.readdir(resourcePath, (err, data) => {
        logger.log('renderer', "当前游戏目录", data);
    });
    //mac : ./Applications/bellplanet.app/Contents/Resources/app/client
    var indexContent = fs.readFileSync(resourcePath + "index.html").toString();
    var matchResult = indexContent.match(new RegExp(`let patchVersion = "([0-9]+)";`));
    let version = +matchResult[1];

    clientUpdate.curVersion = clientUpdate.startVersion = version;

    //同样通过匹配获取当前环境
    matchResult = indexContent.match(new RegExp(`let patchUrl = "([^\";]*)";`));
    let patchUrl = `${config.protocol}//${matchResult[1]}`;
    clientUpdate.patchUrl = patchUrl

    matchResult = indexContent.match(new RegExp(`let evnName = "([^\";]*)";`));
    evnName = matchResult[1];

    matchResult = indexContent.match(new RegExp(`let policyUrl = "([^\";]*)";`));
    policyUrl = matchResult[1];
    policyHost = matchResult[1].split("/")[0];
    policyPath = matchResult[1].replace(policyHost, policyPath)
    logger.log(`renderer`, "native curVersion : ", version, policyHost, policyPath, evnName, policyUrl);
    getPolicyVersion();
} catch (error) {
    logger.error(`renderer`, `native更新客户端报错`, error)
    startRunGame();
}