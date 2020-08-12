/** 
 * @Author 雪糕
 * @Description 主进程的工具类
 * @Date 2020-02-18 11:43:24
 * @FilePath \pc\src\main\util.ts
 */
import { session } from 'electron';
import { exec, ChildProcess } from 'child_process';
import http from 'http';
import https from 'https';
import querystring from 'querystring';
import FormData from 'form-data';

import commonConfig from '../common/CommonConfig';

import { logger } from './logger';
import mainModel from './MainModel';
import FileUtil from '../common/FileUtil';

export namespace util {
    let nativeCnf: any;

    /** 运行cmd命令 */
    export function runCmd(cmd: string, cwd: string, successMsg: string, errorMsg: string): Promise<ChildProcess> {
        return new Promise((resolve, reject) => {
            logger.log('cmd', `cmd --> command:${cmd} cwd:${cwd}`);
            const process = exec(cmd, { cwd: cwd }, (error) => {
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

            //先暂时改回原来的代码,暂时修复native上课问题
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
        const content = data ? `${querystring.stringify(data)}` : "";
        logger.log('net', `http isHttps:${isHttps} post data`, content);
        path = content ? `${path}?${content}` : path;
        const options = {
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

        const transportLib = isHttps ? https : http;
        const request = transportLib.request(options, (response) => {
            response.setEncoding('utf8');

            let body = "";
            response.on('data', (data) => {
                body += data;
            });

            response.on('end', () => {
                if (successFunc) {
                    if (body) {
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
                logger.error('net', `get方式 http返回错误`, e);
            });
        });

        request.on('error', (e) => {
            if (errorFunc) {
                errorFunc(e);
            }
            logger.error('net', `get方式 发送http请求错误`, e.message);
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
        const content = data ? querystring.stringify(data) : "";
        logger.log('net', `http isHttps:${isHttps} post data`, content);

        const options = {
            host: host,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': content.length
            },
            rejectUnauthorized: false
        };
        if (port) {
            options['port'] = port;
        }
        if (headers) {
            for (const key in headers) {
                const value = headers[key];
                options.headers[key] = value;
            }
        }

        const transportLib = isHttps ? https : http;
        const request = transportLib.request(options, (response) => {
            response.setEncoding('utf8');

            let body = "";
            response.on('data', (data) => {
                body += data;
            });

            response.on('end', () => {
                if (successFunc) {
                    if (body) {
                        try {
                            successFunc(JSON.parse(body), response);
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
                logger.error('net', `post方式 http返回错误`, e);
            });
        });

        request.on('error', (e) => {
            if (errorFunc) {
                errorFunc();
            }
            logger.error('net', `post方式 发送http请求错误`, e.message);
        });

        request.write(content);
        request.end();
    }

    /** 初始化服务端native配置 */
    export function initNativeCnf() {
        logger.log('net', `初始化native本地服务器配置`);
        const nativeCnfContent = FileUtil.readFileSync(commonConfig.nativeCnfPath, "utf-8");
        if (nativeCnfContent) {
            nativeCnf = JSON.parse(nativeCnfContent);
        } else {
            logger.error("file", "初始化native本地服务器配置错误");
        }
    }

    /** 写入服务端配置文件 */
    export function writeServerCnfValue(key: string, value: number | string) {
        nativeCnf[key] = value;
        const content = JSON.stringify(nativeCnf, null, 4);
        FileUtil.writeFileSync(commonConfig.nativeCnfPath, content);
    }

    /** 拷贝日志到上传目录 */
    export async function copyLog2UploadDir() {
        const uploadPath: string = `${commonConfig.rootPath}/dist/uploadLog`;
        logger.log('log', `开始拷贝日志文件`);
        //删除旧的日志文件
        const uploadDir = FileUtil.readdirSync(uploadPath, null, false);
        if (uploadDir) {
            for (const iterator of uploadDir) {
                try {
                    FileUtil.unlinkSync(`${uploadPath}/${iterator}`);
                    logger.log("log", `delete log file ${uploadPath}/${iterator} success`);
                } catch (error) {
                    logger.error('log', `delete log file ${uploadPath}/${iterator} error`, error);
                }
            }
        }

        const logPath: string = `${commonConfig.rootPath}/dist/log`;
        const logDir = FileUtil.readdirSync(logPath, null, false);
        const date: Date = new Date();
        const dateFormat: string = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDay()}_${date.getHours()}-${date.getMinutes()}`;
        const actId: string = await getCookie("userid") || mainModel.bellActId || "";
        const realName: string = mainModel.realName || "";
        const playerId: string = mainModel.playerId || "";
        const playerName: string = mainModel.playerName || "";

        //拷贝新的日志文件到上传目录
        for (const fileName of logDir) {
            let newFileName: string = `${dateFormat}`;
            if (realName) {
                newFileName += `_realName-${realName}`;
            }
            if (playerName) {
                newFileName += `_playerName-${playerName}`;
            }
            if (actId) {
                newFileName += `_actId-${actId}`;
            }
            if (playerId) {
                newFileName += `_playerId-${playerId}`;
            }
            newFileName += `_${fileName}`;
            FileUtil.copyFileSync(`${logPath}/${fileName}`, `${uploadPath}/${newFileName}`);
        }

        logger.clear();
    }

    /** 上传日志文件列表 */
    export function uploadLogFileList() {
        logger.log('log', `开始上传日志文件列表`);
        const logDir = FileUtil.readdirSync(commonConfig.uploadLogDir, null, false);
        for (const fileName of logDir) {
            const filePath = `${commonConfig.uploadLogDir}/${fileName}`;
            uploadLogFile(`${commonConfig.uploadLogUrl}`, fileName, filePath);
        }
    }

    /** 上传日志文件 */
    function uploadLogFile(url: string, fileName: string, filePath: string) {
        const form = new FormData();
        form.append('name', fileName);
        form.append('type', "file");
        const readStream = FileUtil.createReadStream(filePath);
        if (readStream) {
            form.append('myfile', readStream);
        } else {
            logger.error('file', `读取文件失败: ${filePath}`);
        }

        try {
            form.submit(url, (err: Error, res: http.IncomingMessage) => {
                if (err) {
                    logger.error('log', `postFile err`, err);
                }
                if (!res) {
                    logger.error('log', `res err`);
                    return;
                }

                if (res) {
                    logger.log('log', `postFile res`, res.statusCode, res.statusMessage);
                }
                res.resume();
                logger.log('log', `上传日志完毕url:${url} fileName:${fileName} filePath:${filePath}`);
            });
        } catch (error) {
            logger.error('log', `上传日志错误`, error);
        }
    }

    /** 读取指定cookies */
    export async function getCookie(name: string) {
        try {
            const cookies = await session.defaultSession.cookies.get({});
            if (!cookies) return null;
            const cookie = cookies.find(value => value.name === name);
            if (!cookie) return null;

            return cookie.value;
        } catch (error) {
            console.log(error);
            return null;
        }
    }
}