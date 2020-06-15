/**
 * @author 雪糕 
 * @desc main用的工具类
 * @date 2020-02-18 11:43:24 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-04-29 17:36:11
 */
import { session } from 'electron';
import { exec, ChildProcess } from 'child_process';
import http from 'http';
import https from 'https';
import fs from 'fs';
import querystring from 'querystring';
import FormData from 'form-data';

import { logger } from './logger';
import config from './Config';

export namespace util {
    let nativeCnf: any;

    /** 运行cmd命令 */
    export function runCmd(cmd: string, cwd: string, successMsg: string, errorMsg: string): Promise<ChildProcess> {
        return new Promise((resolve, reject) => {
            logger.log('cmd', `cmd --> command:${cmd} cwd:${cwd}`);
            let process = exec(cmd, { cwd: cwd }, (error) => {
                if (error) {
                    if (errorMsg) {
                        logger.error('cmd', errorMsg, error);
                    }
                    reject(error);
                }
            });

            process.stdout.on("data", data => {
                logger.processLog('cmd', 'stdout', data);
            });
            process.stderr.on("data", data => {
                logger.processLog('cmd', 'stderr', data);
            });

            logger.log('cmd', successMsg);
            resolve(process);
        });
    }

    /** https发送get请求 */
    export function requestGetHttps(host: string, port: string, path: string, data: any, headers: any, successFunc: Function, errorFunc: Function) {
        requestGet(true, host, port, path, data, headers, successFunc, errorFunc);
    }

    /** http发送get请求 */
    export function requestGetHttp(host: string, port: string, path: string, data: any, headers: any, successFunc: Function, errorFunc: Function) {
        requestGet(false, host, port, path, data, headers, successFunc, errorFunc);
    }

    /** 发送get请求 */
    function requestGet(isHttps: boolean, host: string, port: string, path: string, data: any, headers: any, successFunc: Function, errorFunc: Function) {
        let content = data ? `${querystring.stringify(data)}` : "";
        logger.log('net', `http isHttps:${isHttps} post data`, content);
        path = content ? `${path}?${content}` : path;
        let options = {
            host: host,
            path: path,
            method: 'GET',
            headers,
            rejectUnauthorized: false
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
                    errorFunc(e);
                }
                logger.error('net', `get方式 http返回错误`, e)
            });
        });

        request.on('error', (e) => {
            if (errorFunc) {
                errorFunc(e);
            }
            logger.error('net', `get方式 发送http请求错误`, e.message)
        });

        request.write(content);
        request.end();
    }

    /** http发送post请求 */
    export function requestPostHttp(host: string, port: string, path: string, data: any, headers: any, successFunc: Function, errorFunc: Function) {
        requestPost(false, host, port, path, data, headers, successFunc, errorFunc);
    }

    /** https发送post请求 */
    export function requestPostHttps(host: string, port: string, path: string, data: any, headers: any, successFunc: Function, errorFunc: Function) {
        requestPost(true, host, port, path, data, headers, successFunc, errorFunc);
    }

    /** 发送post请求 */
    function requestPost(isHttps: boolean, host: string, port: string, path: string, data: any, headers: any, successFunc: Function, errorFunc: Function) {
        let content = data ? querystring.stringify(data) : "";
        logger.log('net', `http isHttps:${isHttps} post data`, content);

        let options = {
            host: host,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': content.length
            },
            rejectUnauthorized: false
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
                        try {
                            successFunc(JSON.parse(body));
                        } catch (error) {
                            logger.error('net', `http isHttps:${isHttps} error, body`, body);
                        }
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

    /** 初始化服务端native配置 */
    export function initNativeCnf() {
        logger.log('net', `初始化native本地服务器配置`);
        let nativeCnfContent = fs.readFileSync(config.nativeCnfPath, "utf-8");
        nativeCnf = JSON.parse(nativeCnfContent);
    }

    /** 初始化全局配置 */
    export function initGlobalConfig() {
        let globalConfigContent = fs.readFileSync(config.globalConfigPath, "utf-8");
        let globalConfig = JSON.parse(globalConfigContent);

        config.setEnvironName(globalConfig.environName);
    }

    /** 写入服务端配置文件 */
    export function writeServerCnfValue(key: string, value: number | string) {
        nativeCnf[key] = value;
        let content = JSON.stringify(nativeCnf, null, 4);
        fs.writeFileSync(config.nativeCnfPath, content);
    }

    /** 拷贝日志到上传目录 */
    export async function copyLog2UploadDir() {
        const uploadPath: string = `${config.rootPath}/dist/uploadLog`;

        //删除旧的日志文件
        let uploadDir = fs.readdirSync(uploadPath);
        if (uploadDir) {
            for (const iterator of uploadDir) {
                try {
                    fs.unlinkSync(`${uploadPath}/${iterator}`);
                    logger.log("log", `delete log file ${uploadPath}/${iterator} success`);
                } catch (error) {
                    logger.error('log', `delete log file ${uploadPath}/${iterator} error`, error);
                }
            }
        }

        const logPath: string = `${config.rootPath}/dist/log`;
        const logDir = fs.readdirSync(logPath);
        let date: Date = new Date();
        let dateFormat: string = `${date.getFullYear()}-${date.getMonth()}-${date.getDay()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
        let userid: string = await getCookie("userid") || config.bellActId || "";
        let playerId: string = config.playerId || "";

        //拷贝新的日志文件到上传目录
        for (const fileName of logDir) {
            let newFileName: string = `date-${dateFormat}_actId-${userid}_playerId-${playerId}_${fileName}`;
            fs.copyFileSync(`${logPath}/${fileName}`, `${uploadPath}/${newFileName}`);
        }

        logger.clear();
    }

    /** 上传日志文件 */
    export function uploadLogFile(url: string, fileName: string, filePath: string) {
        let form = new FormData();
        form.append('name', fileName);
        form.append('type', "file");
        form.append('myfile', fs.createReadStream(filePath));

        form.submit(url, (err: Error, res: http.IncomingMessage) => {
            if (err) {
                logger.error('log', `postFile err`, err);
            }
            if (res) {
                logger.log('log', `postFile res`, res.statusCode, res.statusMessage);
            }
            res.resume();
        });
    }

    /** 读取指定cookies */
    export async function getCookie(name: string) {
        let cookies = await session.defaultSession.cookies.get({});
        let cookie = cookies.find(value => value.name === name);
        if (cookie) {
            return cookie.value;
        }
        return null;
    };

    /** 执行渲染层js代码 */
    export function executeJavaScript(code: string, showError: boolean = true) {
        try {
            if (config.mainWindow && config.mainWindow.isEnabled && config.mainWindow.webContents) {
                config.mainWindow.webContents.executeJavaScript(code);
            }
        } catch (error) {
            if (showError) {
                logger.error('util', `执行js代码[ ${code} ]错误`, error);
            }
        }
    }
}