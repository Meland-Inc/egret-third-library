/**
 * @author 雪糕 
 * @desc 工具类
 * @date 2020-02-28 19:56:39 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-10 22:29:07
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require("http");
import * as logger from './logger.js';
import { Config } from './Config.js';

/** 获取指定策略信息 */
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

/** 获取游戏版本 */
export function getGameVersion(policyHost, policyPath, policyNum) {
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
                console.error("[policy] can not load policy, version=" + policyNum + ", statusCode=" + response.statusCode + ",option =" + options.host + options.path);
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
        })
    })
}

/** 获取服务器包版本号 */
export async function getServerPackagePolicyNum(environName) {
    let fileName = getServerPackageFileName();
    let versionName = `${environName}_serverPackage_${fileName}`;
    let value = await getPolicyInfo(versionName);
    let data = JSON.parse(value);
    let policyNum = 0;
    if (data.Code === 0) {
        policyNum = +data.Data.Version;
    }
    return policyNum;
}

/** 根据操作系统信息获取服务器包文件名称 */
export function getServerPackageFileName() {
    let platform = "windows";
    if (os.platform() === "win32") {
        platform = "windows"
    }

    let arch = "amd64";
    if (os.arch() === "x64") {
        arch = "amd64";
    } else {
        arch = "386";
    }

    return `${platform}_${arch}`;
}

/** 遍历删除指定文件夹 */
export async function deleteFolderRecursive(folderPath) {
    let files = [];
    //判断给定的路径是否存在
    if (await fs.existsSync(folderPath)) {
        //返回文件和子目录的数组
        files = await fs.readdirSync(folderPath);
        for (const file of files) {
            let curPath = path.join(folderPath, file);
            //fs.statSync同步读取文件夹文件，如果是文件夹，在重复触发函数
            if (await fs.statSync(curPath).isDirectory()) { // recurse
                await deleteFolderRecursive(curPath);
            } else {
                await fs.unlinkSync(curPath);
            }
        }
        //清除文件夹
        await fs.rmdirSync(folderPath);
    } else {
        console.log("给定的路径不存在，请给出正确的路径", folderPath);
    }
}

/** 设置全局配置值 */
export function setGlobalConfigValue(key, value) {
    let configContent = fs.readFileSync(Config.globalConfigPath, "utf-8");
    let globalConfig = JSON.parse(configContent);
    globalConfig[key] = value;
    fs.writeFileSync(Config.globalConfigPath, JSON.stringify(globalConfig), "utf-8");
}

/** 获取全局配置值 */
export function getGlobalConfigValue(key) {
    let globalConfig = getGlobalConfig();
    return globalConfig[key];
}

export function getGlobalConfig() {
    let configContent = fs.readFileSync(Config.globalConfigPath, "utf-8");
    let globalConfig = JSON.parse(configContent);
    return globalConfig;
}