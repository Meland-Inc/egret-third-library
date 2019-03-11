import * as path from "path";
import * as del from 'delete';
import * as fs from 'fs';
import * as cpy from 'cpy';
import * as crypto from 'crypto';

export async function delAndCopyFile(fromPath, toPath, needLoop) {
    if (await exists(toPath)) {
        if (await isDirectory(toPath)) {
            delFolder(toPath);
        } else {
            delFile(toPath);
        }
    }

    await copyFile(fromPath, toPath, needLoop);
}

/**
 * 拷贝指定路径的文件
 * @param {*} fromPath 来源路径 可以是文件路径,也可以是文件夹路径
 * @param {*} toPath 目标文件夹路径
 * @param needLoop 是否循环文件夹拷贝
 */
export async function copyFile(fromPath, toPath, needLoop) {
    let isFolder = await isDirectory(fromPath);
    if (!needLoop || !isFolder) {
        await cpy(fromPath, toPath);
        return;
    }

    let files = await readDir(fromPath);

    for (const file of files) {
        let pathName = path.join(fromPath, file);
        let isFolder = await isDirectory(pathName);
        if (isFolder) {
            await copyFile(pathName, toPath + "/" + file, needLoop);
        } else {
            await copyFile(pathName, toPath);
        }
    }
}

/**
 * 删除指定文件
 * @param {*} path 
 */
export async function delFile(path) {
    await fs.unlinkSync(path);
}


/**
 * 删除指定文件夹下所有文件
 * @param {*} path 
 */
export async function delFiles(path) {
    await del.sync([path + '/*'], { force: true });
}

/**
 * 删除指定文件夹
 * @param {*} path 
 */
export async function delFolder(path) {
    await del.sync([path], { force: true });
}

/**
 * 路径是否是目录
 * @param {*} path 
 */
export async function isDirectory(path) {
    let stat = await fs.statSync(path);
    return stat.isDirectory();
}

/**
 * 创建文件夹 只有不存在的时候才会创建
 * @param {*} path 
 */
export async function makeDir(dirname) {
    if (await fs.existsSync(dirname)) {
        return true;
    } else {
        if (await makeDir(path.dirname(dirname))) {
            await fs.mkdirSync(dirname);
            return true;
        }
    }
}

/**
 * 读取路径
 * @param {*} path 
 */
export async function readDir(path) {
    return await fs.readdirSync(path);
}

/**
 * 读取文件
 * @param {*} path 
 */
export async function readFile(path, encoding = "utf-8") {
    return await fs.readFileSync(path, encoding);

    // return new Promise((resolve, reject) => {
    //     fs.readFile(path, (readError, content) => {
    //         if (readError) {
    //             console.error(readError);
    //             reject();
    //         } else {
    //             resolve(content);
    //         }
    //     });
    // });
}

/**
 * 写文件
 * @param {*} path 
 * @param {*} content 
 */
export function writeFile(path, content) {
    // await fs.writeFileSync(path, content);
    return new Promise((resolve, reject) => {
        fs.writeFile(path, content, writeError => {
            if (writeError) {
                console.error(writeError);
                reject();
            } else {
                resolve();
            }
        });
    })
}

//获取文件所在目录
export function dirname(filePath) {
    return path.dirname(filePath);
}

/**
 * 判断路径是否存在
 * @param {*} path 
 */
export async function exists(path) {
    return await fs.existsSync(path);
}

//比较两个文件的MD5
export async function mergeFileByMd5(oldFilePath, newFilePath) {
    let oldFile = await readFile(oldFilePath);
    let newFile = await readFile(newFilePath);
    const oldFileMd5 = crypto
        .createHash('md5')
        .update(oldFile)
        .digest('hex');
    const newFileMd5 = crypto
        .createHash('md5')
        .update(newFile)
        .digest('hex');

    return oldFileMd5 == newFileMd5;
}