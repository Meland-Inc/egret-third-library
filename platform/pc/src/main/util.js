// const spawn = require("child_process").spawn;
const exec = require("child_process").exec;
const config = require('./config.js');
const logger = require('./logger.js');
const http = require('http');

// function runSpawn(command, param, cwd, successMsg, errorMsg) {
//     return new Promise((resolve, reject) => {
//         logger.log('spawn', `spawn -->command:${command} para:${param} cwd:${cwd}`);
//         let process = spawn(command, [param], { cwd: cwd });
//         process.stdout.on("data", data => {
//             logger.log('stdout', data);
//         });
//         process.stderr.on("data", data => {
//             logger.log('stderr', data);
//         });
//         process.on("exit", code => {
//             if (code == 0) {
//                 if (successMsg) {
//                     logger.log('spawn', successMsg);
//                 }
//                 resolve(process);
//             } else {
//                 if (errorMsg) {
//                     logger.error('spawn', errorMsg, error);
//                 }
//                 reject();
//             }
//         });
//     });
// }

function runCmd(cmd, cwd, successMsg, errorMsg) {
    return new Promise((resolve, reject) => {
        logger.log('cmd', `cmd --> command:${cmd} cwd:${cwd}`);
        let process = exec(cmd, { cwd: cwd }, (error) => {
            if (error) {
                if (errorMsg) {
                    loger.error('cmd', errorMsg, error);
                }
                reject(process);
            } else {
                if (successMsg) {
                    logger.log('cmd', successMsg);
                }
                resolve(process);
            }
        });

        process.stdout.on("data", data => {
            logger.log('process', 'stdout', data);
        });
        process.stderr.on("data", data => {
            logger.log('process', 'stderr', data);
        });
    });
}

/** 关闭游戏服务器 */
function closeGameServer() {
    if (!config.gameServerInited) {
        let cmdStr = "taskkill /im game.exe /f";
        runCmd(cmdStr, null, `游戏服务器关闭成功`, "游戏服务器关闭错误");
        return;
    }

    let path = `/native?controlType=closeServer`
    requstGameServerHttp(path, null, () => {
        error(`net`, `游戏服务器关闭错误`, response);
    });
}

function requstGameServerHttp(path, successFunc, errorFunc) {
    let options = {
        host: config.localIp, // 请求地址 域名，google.com等.. 
        port: config.gameServerPort,
        path: path, // 具体路径eg:/upload
        method: 'GET', // 请求方式, 这里以post为例
        headers: { // 必选信息,  可以抓包工看一下
            'Content-Type': 'application/json'
        }
    };

    http.get(options, (response) => {
        if (response.statusCode != 200) {
            if (errorFunc) {
                errorFunc();
            }
            return;
        }
        if (successFunc) {
            successFunc();
        }
    })
}

// exports.runSpawn = runSpawn;
exports.runCmd = runCmd;
exports.closeGameServer = closeGameServer;
exports.requstGameServerHttp = requstGameServerHttp;