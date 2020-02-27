/**
 * @author 雪糕 
 * @desc main用的工具类
 * @date 2020-02-18 11:43:24 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-26 23:11:14
 */
// const spawn = require("child_process").spawn;
const exec = require("child_process").exec;
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

function requestGetHttp(host, port, path, data, headers, successFunc, errorFunc) {
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

    let request = http.request(options, (response) => {
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

function requestPostHttp(host, port, path, data, headers, successFunc, errorFunc) {
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
    if (headers) {
        for (const key in headers) {
            const value = headers[key];
            options.headers[key] = value;
        }
    }

    let request = http.request(options, (response) => {
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
exports.requestGetHttp = requestGetHttp;
exports.requestPostHttp = requestPostHttp;