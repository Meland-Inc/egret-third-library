import * as clientUpdate from './update/clientUpdate.js';
import * as renderConfig from './renderConfig.js';

const http = require("http");
let evnName = "beta";
let policyHost = "";
let policyPath = "";
let policyUrl = "";
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

    let url = new URL(`${renderConfig.protocol}://${policyQueryServer}/getVersion`, window.location);
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
            console.log("native getPolicyVersion:", policyVersion);
            startLoadPolicy(policyVersion);
        } else {
            console.log("获取版本号错误!");
            throw "获取版本号错误!";
        }
    }
    request.send(null);
}

function startLoadPolicy(policyVersion) {
    // console.log("[policy] start load policy, version=" + policyVersion + ", count=" + tryCount);
    // let versionXhr = new XMLHttpRequest();
    // versionXhr.open('GET', `./policyFile_v` + policyVersion + '.json', true);
    // versionXhr.addEventListener("load", function () {
    //   if (versionXhr.status == 200) {//成功
    //     let policyObj = JSON.parse(versionXhr.response);
    //     gameVersion = policyObj.normalVersion;
    //     console.log("native lastest version :", gameVersion);
    //     patchCount = gameVersion - startVersion;
    //     installSinglePatch();
    //   } else if (versionXhr.status == 404 || versionXhr.status == 478) {//拉取失败 478是会源失败 重试
    //     console.log("[policy] fail load policy, version=" + policyVersion + ", count=" + tryCount + ",status=" + versionXhr.status);
    //     tryCount++;
    //     if (tryCount < 5) {//可以重连
    //       setTimeout(() => {
    //         startLoadPolicy(policyVersion);
    //       }, 2000);
    //     }
    //     else {//失败太多\
    //       console.error("[policy] can not load policy, version=" + policyVersion + ", count=" + tryCount);
    //       alert("游戏策略文件加载失败!，点击重试");
    //       tryCount = 0;//重新计数
    //       startLoadPolicy(policyVersion);
    //     }
    //   }
    //   else {//其他异常 提示刷新联系
    //     console.error("[policy] load policy system error=" + versionXhr.status + ", version=" + policyVersion + ", count=" + tryCount);
    //     alert("游戏策略文件加载异常(E" + versionXhr.status + ")，请刷新重试或者联系开发者");
    //   }
    // });

    // versionXhr.send();
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
            return;
        }

        let resData = "";
        response.on("data", (data) => {
            resData += data;
        });
        response.on("end", async () => {
            // console.log(resData);
            let obj = JSON.parse(resData);
            gameVersion = obj.normalVersion;
            console.log("native lastest version :", gameVersion);
            patchCount = gameVersion - startVersion;
            if (patchCount > 0) {
                clientUpdate.installSinglePatch();
            } else {
                startRunGame();
            }

        });
    })
}

function startRunGame() {
    let hrefArr = location.href.split(".html");
    if (hrefArr[1] != "") {
        location.href = `${__dirname}/../../package/client/index.html${hrefArr[1]}`;
    } else {
        location.href = `${__dirname}/../../package/client/index.html`;
    }
}

try {
    let resourcePath = renderConfig.resourcePath;
    fs.readdir(resourcePath, (err, data) => { console.log("当前目录：", data) });
    //mac : ./Applications/bellplanet.app/Contents/Resources/app/client
    var indexContent = fs.readFileSync(resourcePath + "index.html").toString();
    var matchResult = indexContent.match(new RegExp(`let patchVersion = "([0-9]+)";`));
    startVersion = +matchResult[1];
    curVersion = startVersion;

    //同样通过匹配获取当前环境
    matchResult = indexContent.match(new RegExp(`let patchUrl = "([^\";]*)";`));
    patchUrl = `${renderConfig.protocol}//${matchResult[1]}`;

    matchResult = indexContent.match(new RegExp(`let evnName = "([^\";]*)";`));
    evnName = matchResult[1];

    matchResult = indexContent.match(new RegExp(`let policyUrl = "([^\";]*)";`));
    policyUrl = matchResult[1];
    policyHost = matchResult[1].split("/")[0];
    policyPath = matchResult[1].replace(policyHost, policyPath)
    console.log("native curVersion : ", startVersion, policyHost, policyPath, evnName, policyUrl);
    getPolicyVersion();
} catch (error) {
    console.error("native update error ： ", error);
    startRunGame();
}