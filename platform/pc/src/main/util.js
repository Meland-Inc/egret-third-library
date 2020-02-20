/**
 * @author 雪糕 
 * @desc main用的工具类
 * @date 2020-02-18 11:43:24 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-19 16:49:51
 */
// const spawn = require("child_process").spawn;
const exec = require("child_process").exec;
const config = require('./config.js');
const logger = require('./logger.js');
const http = require('http');
const querystring = require('querystring');

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
    requestGetHttp(config.localIp, config.gameServerPort, path, null, () => {
        logger.log('net', `游戏服务器关闭成功`)
    }, () => {
        logger.error('net', `游戏服务器关闭错误`)
    });
}

function requestGetHttp(host, port, path, data, successFunc, errorFunc) {
    let content = data ? querystring.stringify(data) : "";

    let options = {
        host: host,
        path: `${path}?${content}`,
        method: 'GET'
    };
    if (port) {
        options['port'] = port;
    }


    let request = http.request(options, (response) => {
        response.setEncoding('utf8');

        let body = "";
        response.on('data', (data) => {
            body += data;
        });

        response.on('end', () => {
            if (successFunc) {
                successFunc(body);
            }
        });

        response.on('error', (e) => {
            if (errorFunc) {
                errorFunc();
            }
        });
    });

    request.on('error', (e) => {
        if (errorFunc) {
            errorFunc();
        }
        logger.error('net', `get方式 发送http请求错误`, e.message)
    });

    request.write(content);
    request.end();
}

function requstPostHttp(host, port, path, data, successFunc, errorFunc) {
    let content = data ? querystring.stringify(data) : "";

    let options = {
        host: host,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': content.length
        }
    }
    if (port) {
        options['port'] = port;
    }

    let request = http.request(options, (response) => {
        response.setEncoding('utf8');

        let body = "";
        response.on('data', (data) => {
            body += data;
        });

        response.on('end', () => {
            if (successFunc) {
                successFunc(body);
            }
        });

        response.on('error', (e) => {
            if (errorFunc) {
                errorFunc();
            }
        });
    });

    request.on('error', (e) => {
        if (errorFunc) {
            errorFunc();
        }
        logger.error('net', `post方式 发送http请求错误`, e.message)
    });

    request.write(content);
    request.end();
}

// exports.runSpawn = runSpawn;
exports.runCmd = runCmd;
exports.closeGameServer = closeGameServer;
exports.requestGetHttp = requestGetHttp;
exports.requstPostHttp = requstPostHttp;