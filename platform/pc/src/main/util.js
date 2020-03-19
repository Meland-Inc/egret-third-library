/**
 * @author 雪糕 
 * @desc main用的工具类
 * @date 2020-02-18 11:43:24 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-20 02:59:23
 */
// const spawn = require("child_process").spawn;
const exec = require("child_process").exec;
const logger = require('./logger.js');
const Config = require('./config.js').Config;
const message = require('./message.js');
const http = require('http');
const https = require('https');
const fs = require('fs');
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

let nativeCnf;

/** 全局配置 */
let globalConfig;

/** 运行cmd命令 */
function runCmd(cmd, cwd, successMsg, errorMsg) {
    return new Promise((resolve, reject) => {
        logger.log('cmd', `cmd --> command:${cmd} cwd:${cwd}`);
        let process = exec(cmd, { cwd: cwd }, (error) => {
            if (error) {
                if (errorMsg) {
                    logger.error('cmd', errorMsg, error);
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
            logger.processLog('cmd', 'stdout', data);
        });
        process.stderr.on("data", data => {
            logger.processLog('cmd', 'stderr', data);
        });
    });
}

/** https发送get请求 */
function requestGetHttps(host, port, path, data, headers, successFunc, errorFunc) {
    requestGet(true, host, port, path, data, headers, successFunc, errorFunc);
}

/** http发送get请求 */
function requestGetHttp(host, port, path, data, headers, successFunc, errorFunc) {
    requestGet(false, host, port, path, data, headers, successFunc, errorFunc);
}

/** 发送get请求 */
function requestGet(isHttps, host, port, path, data, headers, successFunc, errorFunc) {
    let content = data ? `${querystring.stringify(data)}` : "";
    path = content ? `${path}?${content}` : path;
    let options = {
        host: host,
        path: path,
        method: 'GET'
    };
    if (port) {
        options['port'] = port;
    }
    if (headers) {
        options.headers = {};
        for (const key in headers) {
            const value = headers[key];
            options.headers[key] = value;
        }
    }

    let transportLib = isHttps ? https : http;
    let request = transportLib.request(options, (response) => {
        response.setEncoding('utf8');

        let body = "";
        response.on('data', (data) => {
            body += data;
        });

        response.on('end', () => {
            if (successFunc) {
                if (!!body) {
                    successFunc(JSON.parse(body));
                } else {
                    successFunc();
                }
            }
        });

        response.on('error', (e) => {
            if (errorFunc) {
                errorFunc();
            }
            logger.error('net', `get方式 http返回错误`, e)
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

/** https发送post请求 */
function requestPostHttps(host, port, path, data, headers, successFunc, errorFunc) {
    requestPost(true, host, port, path, data, headers, successFunc, errorFunc);
}

/** http发送post请求 */
function requestPostHttp(host, port, path, data, headers, successFunc, errorFunc) {
    requestPost(false, host, port, path, data, headers, successFunc, errorFunc);
}

/** 发送post请求 */
function requestPost(isHttps, host, port, path, data, headers, successFunc, errorFunc) {
    let content = data ? querystring.stringify(data) : "";
    logger.log('net', `http post data`, content);

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
    if (headers) {
        for (const key in headers) {
            const value = headers[key];
            options.headers[key] = value;
        }
    }

    let transportLib = isHttps ? https : http;
    let request = transportLib.request(options, (response) => {
        response.setEncoding('utf8');

        let body = "";
        response.on('data', (data) => {
            body += data;
        });

        response.on('end', () => {
            if (successFunc) {
                if (!!body) {
                    successFunc(JSON.parse(body));
                } else {
                    successFunc();
                }
            }
        });

        response.on('error', (e) => {
            if (errorFunc) {
                errorFunc(e);
            }
            logger.error('net', `post方式 http返回错误`, e)
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

/** 初始化native配置 */
async function init() {
    logger.log('net', `初始化native本地服务器配置`);
    let nativeCnfContent = fs.readFileSync(Config.nativeCnfPath, "utf-8");
    nativeCnf = JSON.parse(nativeCnfContent);

    let globalConfigContent = fs.readFileSync(Config.globalConfigPath, "utf-8");
    globalConfig = JSON.parse(globalConfigContent);
}

/** 写入服务端配置文件 */
async function writeServerCnfValue(key, value) {
    nativeCnf[key] = value;
    let content = JSON.stringify(nativeCnf, null, 4);
    fs.writeFileSync(Config.nativeCnfPath, content);
}

/** 获取全局配置值 */
function getGlobalConfigValue(key) {
    return globalConfig[key];
}

/** 设置全局配置值 */
function setGlobalConfigValue(key, value) {
    globalConfig[key] = value;
    logger.log('globalConfig', `content`, globalConfig);
    fs.writeFileSync(Config.globalConfigPath, JSON.stringify(globalConfig, null, 4), "utf-8");
    message.sendIpcMsg('UPDATE_GLOBAL_CONFIG', globalConfig);
}

// exports.runSpawn = runSpawn;
exports.runCmd = runCmd;
exports.requestGetHttp = requestGetHttp;
exports.requestGetHttps = requestGetHttps;
exports.requestPostHttp = requestPostHttp;
exports.requestPostHttps = requestPostHttps;
exports.init = init;
exports.writeServerCnfValue = writeServerCnfValue;
exports.globalConfig = globalConfig;
exports.getGlobalConfigValue = getGlobalConfigValue;
exports.setGlobalConfigValue = setGlobalConfigValue;