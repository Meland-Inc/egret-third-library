const spawn = require("child_process").spawn;
const exec = require("child_process").exec;
const { app } = require('electron');
const path = require('path');
const globalConfig = require('./globalConfig');
const http = require('http');

function runSpawn(command, param, cwd, successMsg, errorMsg) {
    return new Promise((resolve, reject) => {
        console.log(`spawn --> command:${command} para:${param} cwd:${cwd}`);
        let process = spawn(command, [param], { cwd: cwd });
        process.stdout.on("data", data => {
            console.log("stdout: " + data);
        });
        process.stderr.on("data", data => {
            console.log("stderr: " + data);
        });
        process.on("exit", code => {
            if (code == 0) {
                if (successMsg) {
                    console.log(successMsg);
                }
                resolve(process);
            } else {
                if (errorMsg) {
                    console.error(errorMsg, false);
                }
                reject();
            }
        });
    });
}

function runCmd(cmd, cwd, successMsg, errorMsg) {
    return new Promise((resolve, reject) => {
        console.log(`cmd --> cmd:${cmd} cwd:${cwd}`);
        let process = exec(cmd, { cwd: cwd }, (error) => {
            if (error) {
                console.error(errorMsg, error, false);
                reject(process);
            } else {
                if (successMsg) {
                    console.log(successMsg);
                }
                resolve(process);
            }
        });

        process.stdout.on("data", data => {
            console.log("stdout: " + data);
        });
        process.stderr.on("data", data => {
            console.log("stderr: " + data);
        });
    });
}

// function getRootPath() {
//     return `${__dirname}/../`;
// }

/** 关闭游戏服务器 */
function closeGameServer() {
    if (!globalConfig.gameServerInited) {
        let cmdStr = "taskkill /im game.exe /f";
        runCmd(cmdStr, null, `游戏服务器关闭成功`, "游戏服务器关闭错误");
        return;
    }
    let options = {
        host: globalConfig.localIp, // 请求地址 域名，google.com等.. 
        port: globalConfig.gameServerPort,
        path: `/native?controlType=closeServer`, // 具体路径eg:/upload
        method: 'GET', // 请求方式, 这里以post为例
        headers: { // 必选信息,  可以抓包工看一下
            'Content-Type': 'application/json'
        }
    };

    http.get(options, (response) => {
        if (response.statusCode != 200) {
            console.error(`游戏服务器关闭错误`, response);
            return;
        }
    })
}

exports.runSpawn = runSpawn;
exports.runCmd = runCmd;
exports.closeGameServer = closeGameServer;