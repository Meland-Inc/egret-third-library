import { Global } from "./Global.js";
import * as spawnExc from "./SpawnExecute.js";
import * as fsExc from './FsExecute';
var excProcess;

export async function updateGit() {
    return new Promise(async (resolve, reject) => {
        try {
            let clearCmdStr = `git clean -df`;
            await spawnExc.runCmd(clearCmdStr, Global.projPath, null, '清除文件错误');
            await spawnExc.runCmd(clearCmdStr, Global.clientPath, null, '清除Client代码错误');

            let storeCmdStr = `git checkout -- .`;
            await spawnExc.runCmd(storeCmdStr, Global.projPath, null, '还原文件错误');
            await spawnExc.runCmd(storeCmdStr, Global.clientPath, null, '还原Client代码错误');

            let pullCmdStr = `git pull`;
            await spawnExc.runCmd(pullCmdStr, Global.projPath, null, '拉取分支错误');
            await spawnExc.runCmd(pullCmdStr, Global.clientPath, null, '拉取Client代码错误');

            Global.toast('更新git成功');
            resolve();
        } catch (error) {
            Global.snack('更新git错误', error);
            reject();
        }
    });
}

export async function egretRun() {
    let cmdStr = "egret run";
    excProcess = await spawnExc.runCmd(cmdStr, Global.projPath, null, '运行游戏错误');
}

export async function stopRun() {
    if (excProcess) {
        excProcess.kill();
        excProcess = null;
    }
}

export async function commitGit() {
    try {
        let addCmdStr = `git add ."`;
        await spawnExc.runCmd(addCmdStr, Global.projPath, null, '添加文件错误');

        let commitCmdStr = `git commit -a -m "${Global.author}提交资源"`;
        await spawnExc.runCmd(commitCmdStr, Global.projPath, null, '提交文件错误');
        Global.toast('提交git成功');
    } catch (error) {
        Global.snack('提交git错误', error);
    }
}

export async function pushGit() {
    try {
        let pullCmdStr = `git pull`;
        await spawnExc.runCmd(pullCmdStr, Global.projPath, null, '拉取分支错误');

        let pushCmdStr = `git push`;
        await spawnExc.runCmd(pushCmdStr, Global.projPath, null, '推送分支错误');

        Global.toast('推送git成功');
    } catch (error) {
        Global.snack('推送git错误', error);
    }
}

export async function egretFoolRun() {
    let cmdStr = "start nginx";
    await spawnExc.runCmd(cmdStr, Global.foolClientPath, null, '运行游戏错误');
}

export async function egretFoolStop() {
    let cmdStr = "nginx -s stop";
    await spawnExc.runCmd(cmdStr, Global.foolClientPath, null, '停止游戏错误');
}

export async function updateFoolSVN() {
    return new Promise(async (resolve, reject) => {
        try {
            const clientExists = await fsExc.exists(Global.foolClientPath);
            if (!clientExists) {
                await fsExc.makeDir(Global.foolClientPath);
                await spawnExc.svnCheckout(Global.foolClientSVNUrl, Global.foolClientPath, "", "checkout客户端错误");
                Global.toast('checkout客户端成功');
            } else {
                await spawnExc.svnUpdate(Global.foolClientPath, "", "更新客户端错误");
                Global.toast('更新客户端成功');
            }
            //解压客户端zip
            const foolExists = await fsExc.exists(Global.foolProjectPath);
            if (foolExists) {
                await fsExc.delFolder(Global.foolProjectPath);
            }
            fsExc.unzipFile(Global.foolClientZip, Global.foolProjectPath);
            resolve();
        } catch (error) {
            Global.snack('更新客户端失败', error);
            reject();
        }
    });
}
