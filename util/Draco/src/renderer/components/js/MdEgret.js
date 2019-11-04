import { Global } from "./Global.js";
import * as spawnExc from "./SpawnExecute.js";

var excProcess;

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

export async function pushGit(text) {
    try {
        let addCmdStr = `git add ."`;
        await spawnExc.runCmd(addCmdStr, Global.projPath, null, '添加文件错误');

        let commitCmdStr = `git commit -a -m "${Global.author}提交资源"`;
        await spawnExc.runCmd(commitCmdStr, Global.projPath, null, '提交文件错误');

        let pullCmdStr = `git pull`;
        await spawnExc.runCmd(pullCmdStr, Global.projPath, null, '拉取分支错误');

        let pushCmdStr = `git push`;
        await spawnExc.runCmd(pushCmdStr, Global.projPath, null, '推送分支错误');

        Global.toast('推送git成功');
    } catch (error) {
        Global.snack('推送git错误', error);
    }
}