/** 
 * @Author 雪糕
 * @Description 渲染进程工具类
 * @Date 2020-02-28 19:56:39
 * @FilePath \pc\src\renderer\util.ts
 */
import { remote } from 'electron';
import os from 'os';
import http from "http";
import * as logger from './logger';

/** 尝试获取指定策略信息 失败3秒后重试 */
export async function tryGetPolicyInfo(versionName: string): Promise<string> {
    return new Promise(async resolve => {
        try {
            let policyInfo = await getPolicyInfo(versionName);
            resolve(policyInfo);
        } catch (error) {
            logger.error(`policy`, `尝试获取策略号${versionName}失败,3秒后重试`);
            setTimeout(async () => {
                let policyInfo = await tryGetPolicyInfo(versionName);
                resolve(policyInfo);
            }, 3000);
        }
    });
}

/** 获取指定策略信息 */
function getPolicyInfo(versionName: string): Promise<string> {
    return new Promise((resolve, reject) => {
        let time = Math.floor(new Date().getTime() / 1000);
        let due = 1800;
        let token = "*";
        let channel = "bian_game"

        let policyQueryServer = 'policy-server.wkcoding.com';
        let url = new URL('http://' + policyQueryServer + '/getVersion', window.location.href);
        url.searchParams.append('versionName', versionName);
        url.searchParams.append('channel', channel);
        url.searchParams.append('time', time.toString());
        url.searchParams.append('due', due.toString());
        url.searchParams.append('token', token);

        logger.log("policy", `getPolicyInfo url:${url}`);

        let request = new XMLHttpRequest();
        request.open("GET", url.toString());
        request.onreadystatechange = () => {
            if (request.readyState !== 4) {
                return;
            }
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

/** 尝试获取客户端游戏版本 */
export function tryGetClientGameVersion(policyHost: string, policyPath: string, policyNum: number) {
    return new Promise(async resolve => {
        try {
            let policyInfo = await getClientGameVersion(policyHost, policyPath, policyNum);
            resolve(policyInfo);
        } catch (error) {
            logger.error(`policy`, `尝试获取游戏版本号失败,3秒后重试, policyHost:${policyHost} policyPath:${policyPath} policyNum:${policyNum}`);
            setTimeout(async () => {
                let policyInfo = await tryGetClientGameVersion(policyHost, policyPath, policyNum);
                resolve(policyInfo);
            }, 3000);
        }
    });
}

/** 获取客户端游戏版本 */
function getClientGameVersion(policyHost: string, policyPath: string, policyNum: number) {
    return new Promise((resolve, reject) => {
        let options = {
            host: policyHost, // 请求地址 域名，google.com等.. 
            // port: 10001,
            path: `${policyPath}/policyFile_v${policyNum}.json`, // 具体路径eg:/upload
            method: 'GET', // 请求方式, 这里以post为例
            headers: { // 必选信息,  可以抓包工看一下
                'Content-Type': 'application/json'
            }
        };
        http.get(options, (response) => {
            if (response.statusCode != 200) {
                console.error(`load policy file error policyNum:${policyNum} statusCode:${response.statusCode} option:${options.host}${options.path}`);
                reject();
            }

            let resData = "";
            response.on("data", (data) => {
                resData += data;
            });
            response.on("end", () => {
                let obj = JSON.parse(resData);
                let gameVersion = obj.normalVersion;
                logger.log(`renderer`, `游戏版本号:${gameVersion}`)

                resolve(gameVersion)
            });
            response.on("error", (err) => {
                console.error(`load policy file error policyNum:${policyNum} statusCode:${response.statusCode} option:${options.host}${options.path}`, err);
                reject();
            });
        })
    })
}

/** 获取客户端包策略版本 */
export async function getClientPackagePolicyNum(environName: string): Promise<number> {
    let value = await tryGetPolicyInfo(environName);
    let data = JSON.parse(value);
    let policyNum = 0;
    if (data.Code === 0) {
        policyNum = +data.Data.Version;
    }

    logger.log(`policy`, `client package policy num:${policyNum}`);
    return policyNum;
}

/** 获取服务器包策略版本号 */
export async function getServerPackagePolicyNum(environName: string) {
    let fileName = getServerPackageFileName();
    let versionName = `${environName}_serverPackage_${fileName}`;
    let value = await tryGetPolicyInfo(versionName);
    let data = JSON.parse(value);
    let policyNum = 0;
    if (data.Code === 0) {
        policyNum = +data.Data.Version;
    }
    logger.log(`policy`, `server package policy num:${policyNum}`);
    return policyNum;
}

/** 获取native策略版本号 */
export async function getNativePolicyNum(environName: string) {
    let versionName = `${environName}_native`;
    let value = await tryGetPolicyInfo(versionName);
    let data = JSON.parse(value);
    let policyNum = 0;
    if (data.Code === 0) {
        policyNum = +data.Data.Version;
    }
    logger.log('policy', `nativeVersion:${policyNum}`);
    return policyNum;
}

/** 根据操作系统信息获取服务器包文件名称 */
export function getServerPackageFileName() {
    let platform = "windows";
    if (os.platform() === "win32") {
        platform = "windows"
    } else {
        platform = "mac"
    }

    let arch = "amd64";
    if (os.arch() === "x64") {
        arch = "amd64";
    } else {
        arch = "386";
    }

    return `${platform}_${arch}`;
}

/** 设置cookies */
export async function setCookie(url: string, name: string, value: string, expirationDate: number, domain: string) {
    logger.log("cookie", `开始设置cookie url:${url} name:${name} value:${value}`);
    const cookie = { url: url, name: name, value: value, expirationDate: expirationDate, domain: domain };
    await remote.session.defaultSession.cookies.set(cookie)
        .then(() => {
            logger.log("cookie", `设置cookie成功 url:${url} name:${name} value:${value}`);
        })
        .catch((reason) => {
            logger.error("cookie", "setCookie error", reason);
        })
}