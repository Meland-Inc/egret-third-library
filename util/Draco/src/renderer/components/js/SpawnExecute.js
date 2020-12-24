import { spawn } from "child_process";
import { exec } from "child_process";

import { Global } from './Global.js';

export function runSpawn(command, para, cwd, successMsg, errorMsg) {
    return new Promise((resolve, reject) => {
        console.log(`spawn --> command:${command} para:${para} cwd:${cwd}`);
        let process = spawn(command, [para], { cwd: cwd });
        process.stdout.on("data", data => {
            console.log("stdout: " + data);
        });
        process.stderr.on("data", data => {
            console.log("stderr: " + data);
        });
        process.on("exit", code => {
            if (code == 0) {
                if (successMsg) {
                    Global.toast(successMsg);
                }
                resolve();
            } else {
                if (errorMsg) {
                    Global.snack(errorMsg, false);
                }
                reject();
            }
        });
    });
}

export function svnUpdate(path, successMsg, errorMsg) {
    return new Promise((resolve, reject) => {
        console.log(`svn update --> ${path}`);
        let process = spawn("svn", ["update"], { cwd: path });
        process.stdout.on("data", data => {
            console.log("stdout: " + data);
        });
        process.stderr.on("data", data => {
            console.log("stderr: " + data);
        });

        process.on("exit", code => {
            if (code == 0) {
                if (successMsg) {
                    Global.toast(successMsg);
                }
                resolve();
            } else {
                if (errorMsg) {
                    Global.snack(errorMsg, code, false);
                }
                reject();
            }
        });
    });
}


/**
 * add svn路径中所有文件
 * @returns {Promise<string>}
  */
 export function svnAdd(path, successMsg, errorMsg) {
    return new Promise((resolve, reject) => {
        console.log(` svn add . --no-ignore --force --> ${path}`);
        let process = spawn("svn", ["add", ".", "--no-ignore", "--force"], { cwd: path });
        process.stdout.on("data", data => {
            console.log("stdout: " + data);
        });
        process.stderr.on("data", data => {
            console.log("stderr: " + data);
        });

        process.on("exit", code => {
            if (code == 0) {
                if (successMsg) {
                    Global.toast(successMsg);
                }
                resolve();
            } else {
                if (errorMsg) {
                    Global.snack(errorMsg, code, false);
                }
                reject();
            }
        });
    });
}

/**
 * Commit svn路径中所有文件
 * @returns {Promise<string>}
  */
 export function svnCommit(path, msg, successMsg, errorMsg) {
    return new Promise((resolve, reject) => {
        console.log(` svn commit -m "" * --> ${path}`);
        let process = spawn("svn", ["commit", "-m", msg, "*"], { cwd: path });
        process.stdout.on("data", data => {
            console.log("stdout: " + data);
        });
        process.stderr.on("data", data => {
            console.log("stderr: " + data);
        });

        process.on("exit", code => {
            if (code == 0) {
                if (successMsg) {
                    Global.toast(successMsg);
                }
                resolve();
            } else {
                if (errorMsg) {
                    Global.snack(errorMsg, code, false);
                }
                reject();
            }
        });
    });
}

export function svnCheckout(svnPath, targetPath, successMsg, errorMsg) {
    return new Promise((resolve, reject) => {
        console.log(`svn checkout  --> ${svnPath} to ${targetPath}`);
        let process = spawn("svn", ["checkout", svnPath, targetPath], { cwd: targetPath });
        process.stdout.on("data", data => {
            console.log("stdout: " + data);
        });
        process.stderr.on("data", data => {
            console.log("stderr: " + data);
        });

        process.on("exit", code => {
            if (code == 0) {
                if (successMsg) {
                    Global.toast(successMsg);
                }
                resolve();
            } else {
                if (errorMsg) {
                    Global.snack(errorMsg, code, false);
                }
                reject();
            }
        });
    });
}

export function gitPull(path, successMsg, errorMsg) {
    return new Promise((resolve, reject) => {
        console.log(`git pull --> ${path}`);
        let process = spawn("git", ["pull"], { cwd: path });
        process.stdout.on("data", data => {
            console.log("stdout: " + data);
        });

        process.stderr.on("data", data => {
            console.log("stderr: " + data);
        });

        process.on("exit", code => {
            if (code == 0) {
                Global.toast(successMsg);
                resolve();
            } else {
                Global.snack(errorMsg, code, false);
                reject();
            }
        });
    });
}

export function runCmd(cmd, cwd, successMsg, errorMsg) {
    return new Promise((resolve, reject) => {
        console.log(`cmd --> cmd:${cmd} cwd:${cwd}`);
        let process = exec(cmd, { cwd: cwd }, (error) => {
            if (error) {
                if (errorMsg) {
                    Global.snack(errorMsg, error, false);
                }
                reject(process);
            } else {
                if (successMsg) {
                    Global.toast(successMsg);
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

/**
 * 执行cmd命令拿到返回信息
 * @returns {Promise<string>}
  */
export function runCmdGetInfo(cmd, cwd) {
    return new Promise((resolve, reject) => {
        console.log(`cmd get info --> cmd:${cmd} cwd:${cwd}`);
        let process = exec(cmd, { cwd: cwd }, (error) => {
            if (error) {
                reject(error);
            }
        });

        process.stdout.on("data", data => {
            console.log("stdout: " + data);
            resolve(data)
        });
        process.stderr.on("data", data => {
            console.log("stderr: " + data);
            resolve(data)
        });
    });
}