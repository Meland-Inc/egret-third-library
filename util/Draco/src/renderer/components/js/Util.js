/*
 * @Author 雪糕
 * @Description 工具
 * @Date 2020-07-10 10:18:24
 * @FilePath \Draco\src\renderer\components\js\Util.js
 */
import * as fsExc from "./FsExecute.js";

/** 检测文件是否重复 */
export async function checkFileRepeat(path, successFunc, failFunc) {
    let fileMap = {};
    await loopCheckFileRepeat(fileMap, path)
        .then(() => {
            successFunc();
        })
        .catch((reason) => {
            failFunc(reason);
        });
}

async function loopCheckFileRepeat(fileMap, path, fileName) {
    const isDir = await fsExc.isDirectory(path);
    if (isDir) {
        let targetDir = await fsExc.readDir(path);
        for (const element of targetDir) {
            const targetPath = `${path}/${element}`;
            const elementSuffixIndex = element.lastIndexOf(".");
            let newElement = element;
            if (elementSuffixIndex >= 0) {
                let suffix = element.slice(elementSuffixIndex + 1, element.length).toLocaleLowerCase();
                newElement = `${element.slice(0, elementSuffixIndex)}.${suffix}`;
            }
            await loopCheckFileRepeat(fileMap, targetPath, newElement);
        }
        return;
    }

    if (!fileName) return;

    if (fileMap[fileName]) {
        throw `文件重复: ${fileName}`;
    }

    fileMap[fileName] = true;
}