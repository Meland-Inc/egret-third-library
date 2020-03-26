import * as http from 'http';
import * as crypto from 'crypto';
import { Global } from './Global';

export function getPolicyInfo(versionName) {
    return new Promise((resolve, reject) => {
        let time = Math.floor(new Date().getTime() / 1000);
        let due = 1800;
        let token = "*";
        let channel = "bian_game"

        let policyQueryServer = 'policy-server.wkcoding.com';
        let url = new URL('http://' + policyQueryServer + '/getVersion', window.location);
        url.searchParams.append('versionName', versionName);
        url.searchParams.append('channel', channel);
        url.searchParams.append('time', time);
        url.searchParams.append('due', due);
        url.searchParams.append('token', token);
        let request = new XMLHttpRequest();
        request.open("GET", url);
        request.onreadystatechange = () => {
            if (request.readyState !== 4) return;
            if (request.status === 200) {
                console.log(request.responseText);
                resolve(request.responseText);
            } else {
                reject("获取版本号错误!");
            }
        }
        request.send(null);
    });
}

export async function applyPolicyNum(policyNum, versionName, channel) {
    let time = Math.floor(new Date().getTime() / 1000);
    let secret = "LznauW6GzBsq3wP6";
    let due = 1800;
    let tokenStr = versionName + channel + time + secret + due;
    let token = crypto
        .createHash('md5')
        .update(tokenStr)
        .digest('hex');


    await apply47PolicyNum(policyNum, versionName, channel, time, due, token);
    await applyWkPolicyNum(policyNum, versionName, channel, time, due, token);
}

function apply47PolicyNum(policyNum, versionName, channel, time, due, token) {
    return new Promise((resolve, reject) => {
        let policyQueryServerOld = '47.107.73.43:10001';
        let oldUrl = new URL('http://' + policyQueryServerOld + '/setVersion', window.location);
        oldUrl.searchParams.append('versionName', versionName);
        oldUrl.searchParams.append('channel', channel);
        oldUrl.searchParams.append('time', time);
        oldUrl.searchParams.append('due', due);
        oldUrl.searchParams.append('token', token);
        oldUrl.searchParams.append('version', policyNum);
        let oldRequest = new XMLHttpRequest();
        oldRequest.open("GET", oldUrl);
        oldRequest.onreadystatechange = () => {
            if (oldRequest.readyState !== 4) return;
            if (oldRequest.status === 200) {
                console.log(`47: ${oldRequest.responseText}`);
                resolve(oldRequest.responseText);
            } else {
                reject("应用版本号错误!");
            }
        }
        oldRequest.send(null);
    });
}

function applyWkPolicyNum(policyNum, versionName, channel, time, due, token) {
    return new Promise((resolve, reject) => {
        let policyQueryServer = 'policy-server.wkcoding.com';
        let url = new URL('http://' + policyQueryServer + '/setVersion', window.location);
        url.searchParams.append('versionName', versionName);
        url.searchParams.append('channel', channel);
        url.searchParams.append('time', time);
        url.searchParams.append('due', due);
        url.searchParams.append('token', token);
        url.searchParams.append('version', policyNum);
        let request = new XMLHttpRequest();
        request.open("GET", url);
        request.onreadystatechange = () => {
            if (request.readyState !== 4) return;
            if (request.status === 200) {
                console.log(`wkcoding:${request.responseText}`);
                resolve();
            } else {
                reject("应用版本号错误!");
            }
        }
        request.send(null);
    });
}

/** 获取服务器包版本号 */
export async function getServerPackagePolicyNum(environName, fileName) {
    let versionName = `${environName}_serverPackage_${fileName}`;
    let value = await getPolicyInfo(versionName);
    let data = JSON.parse(value);
    let policyNum = 0;
    if (data.Code === 0) {
        policyNum = +data.Data.Version;
    }
    return policyNum;
}

/** 应用服务器包版本号 */
export async function applyServerPackagePolicyNum(policyNum, environName, fileName) {
    let versionName = `${environName}_serverPackage_${fileName}`;
    await applyPolicyNum(policyNum, versionName, 'bian_game');
}

/** 获取native包版本号 */
export async function getNativePolicyNum(environName) {
    let versionName = `${environName}_native`;
    let value = await getPolicyInfo(versionName);
    console.log('nativePolicyData', value);
    let data = JSON.parse(value);
    let policyNum = 0;
    if (data.Code === 0) {
        policyNum = +data.Data.Version;
    }
    return policyNum;
}

export function getNativeVersion(environName, policyNum, platform) {
    return new Promise((resolve, reject) => {
        let options = {
            host: Global.cdnUrl, // 请求地址 域名，google.com等.. 
            path: `/native/${environName}/${policyNum}/${platform}/policyFile.json`, // 具体路径eg:/upload
            method: 'GET', // 请求方式, 这里以post为例
            headers: { // 必选信息,  可以抓包工看一下
                'Content-Type': 'application/json'
            }
        };
        let url = `${Global.cdnUrl}/native/${environName}/${policyNum}/${platform}/policyFile.json`
        console.log("getNativeVersion", url);
        http.get(url, (response) => {
            if (response.statusCode != 200) {
                reject();
                return;
            }

            let resData = "";
            response.on("data", (data) => {
                resData += data;
            });
            response.on("end", async () => {
                console.log("nativeVersion resData:", resData);
                let obj = JSON.parse(resData);
                let nativeVersion;
                if (!obj.nativeVersion) {
                    nativeVersion = 0;
                } else {
                    nativeVersion = obj.nativeVersion;
                }
                resolve(nativeVersion);
            });
        })
    });
}

/** 应用native包版本号 */
export async function applyNativePolicyNum(policyNum, environName) {
    let versionName = `${environName}_native`;
    console.log(`applyNativePolicyNum policyNum:${policyNum} environName:${environName}`);
    await applyPolicyNum(policyNum, versionName, 'bian_game');
}