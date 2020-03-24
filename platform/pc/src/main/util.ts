/**
 * @author 雪糕 
 * @desc main用的工具类
 * @date 2020-02-18 11:43:24 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-24 15:07:50
 */
// const spawn = require("child_process").spawn;
import { exec, ChildProcess } from 'child_process';
import http from 'http';
import https from 'https';
import fs from 'fs';
import querystring from 'querystring';

import { logger } from './logger';
import config from './Config';
import message from './Message';

export namespace util {
    export let nativeCnf: any;

    /** 全局配置 */
    export let globalConfig: any;

    /** 运行cmd命令 */
    export function runCmd(cmd: string, cwd: string, successMsg: string, errorMsg: string): Promise<ChildProcess> {
        return new Promise((resolve, reject) => {
            logger.log('cmd', `cmd --> command:${cmd} cwd:${cwd}`);
            let process = exec(cmd, { cwd: cwd, windowsHide: false }, (error) => {
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
            headers
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

    /** 初始化native配置 */
    export async function init() {
        logger.log('net', `初始化native本地服务器配置`);

        let nativeCnfContent = fs.readFileSync(config.nativeCnfPath, "utf-8");
        nativeCnf = JSON.parse(nativeCnfContent);

        let globalConfigContent = fs.readFileSync(config.globalConfigPath, "utf-8");
        globalConfig = JSON.parse(globalConfigContent);

        //初始化清空参数
        util.setGlobalConfigValue("token", "");

        config.setEnvironName(globalConfig.environName);
    }

    /** 写入服务端配置文件 */
    export async function writeServerCnfValue(key: string, value: number | string) {
        nativeCnf[key] = value;
        let content = JSON.stringify(nativeCnf, null, 4);
        fs.writeFileSync(config.nativeCnfPath, content);
    }

    /** 获取全局配置值 */
    export function getGlobalConfigValue(key: string) {
        return globalConfig[key];
    }

    /** 设置全局配置值 */
    export function setGlobalConfigValue(key: string, value: number | string) {
        globalConfig[key] = value;
        logger.log('globalConfig', `content`, globalConfig);
        fs.writeFileSync(config.globalConfigPath, JSON.stringify(globalConfig, null, 4), "utf-8");
        message.sendIpcMsg('UPDATE_GLOBAL_CONFIG', globalConfig);
    }
}