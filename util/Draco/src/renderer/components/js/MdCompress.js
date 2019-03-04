//压缩图片
import { Global } from './Global.js';
import * as fsExc from './FsExecute';
import * as path from 'path';
import * as crypto from 'crypto';
// var fs = require('fs');
import * as fs from "fs";
import * as request from "request";
import * as minimatch from "minimatch";
import * as glob from "glob";
import * as uniq from "array-uniq";
import * as chalk from "chalk";
import * as pretty from "prettysize";
import * as argv from "minimist";

var originalPicPath = Global.originalPicPath;
var compressPath = Global.compressPath;

var keyArray = new Array();
keyArray = ["TDhV2CFvsryHrvp8mnvbzFY2hSzlCHjp", "zDnSVhTLX2W0wDbyqTZVgxmxXjh9sMm3", "ySBTFTXPHlrSVPjLn2nBXsbZwnhb2vkq", "M6BXg8Ch5hV8xTmHzkXMkBJqcC8J5MyL", "BgXXMFmFyRyXzbs6Z7fpGxdXr2RJvgCG", "cdRszRYZsSMdm96q4Ty7w7l3ljDgy9TG", "TM9VftrvjWt6hGTZ9Ttm4RzjYBnyWxMH", "3HZS3TJWH44PqjTDlXw7vBXc0yKfDbQt"]
var key = keyArray[0];


var assetsSuffix = Global.projPath + '/resource/assets';
var asyncSuffix = Global.projPath + '/resource/async';
var indieSuffix = Global.projPath + '/resource/indie';
var loaderSuffix = Global.projPath + '/resource/loader';
// export async function copyPic() {
//     await fsExc.makeDir(compressPath);
//     await fsExc.copyFile(originalPicPath, compressPath, true);
// }

async function compressPic(filePath) {
    var file = filePath ? filePath : Global.compressPath;
    if (key.length == 0) {
        Global.toast('当前的压缩key为空');

    } else {
        var images = [];
        if (await fsExc.exists(file)) {
            let stat = await fs.lstatSync(file);
            if (stat.isDirectory()) {
                images = images.concat(glob.sync(file + '/**' + '/*.+(png|jpg|jpeg|PNG|JPG|JPEG)'));
            } else if (minimatch(file, '*.+(png|jpg|jpeg|PNG|JPG|JPEG)', {
                matchBase: true
            })) {
                images.push(file);
            }
        }
        // files.forEach(function (file) {
        //     if (fs.existsSync(file)) {
        //         if (fs.lstatSync(file).isDirectory()) {
        //             images = images.concat(glob.sync(file + '/**' + '/*.+(png|jpg|jpeg|PNG|JPG|JPEG)'));
        //         } else if (minimatch(file, '*.+(png|jpg|jpeg|PNG|JPG|JPEG)', {
        //             matchBase: true
        //         })) {
        //             images.push(file);
        //         }
        //     }
        // });
        var unique = uniq(images);
        if (unique.length === 0) {
            // Global.toast('该文件不需要压缩');
        } else {
            var a = '\u2714 Found ' + unique.length + ' image' + (unique.length === 1 ? '' : 's');
            console.log(a);
            await compress(unique);
        }
    }
}

async function compress(unique) {
    if (!unique) {
        console.log("压缩的图片不能为空");
        return;
    }
    unique.forEach((file) => {
        fs.createReadStream(file).pipe(request.post('https://api.tinify.com/shrink', {
            auth: {
                'user': 'api',
                'pass': key
            }
        }, async (error, response, body) => {
            try {
                body = JSON.parse(body);
            } catch (e) {
                console.log(chalk.red('\u2718 Not a valid JSON response for `' + file + '`'));
                return;
            }
            if (!error && response) {
                if (response.statusCode === 201) {
                    if (body.output.size < body.input.size) {
                        console.log(chalk.green('\u2714 Panda just saved you ' + chalk.bold(pretty(body.input.size - body.output.size) + ' (' + Math.round(100 - 100 / body.input.size * body.output.size) + '%)') + ' for `' + file + '`'));
                        request.get(body.output.url).pipe(fs.createWriteStream(file));
                        request.get(body.output.url).on('end', () => {
                            console.log("压缩已经完成！");
                        });

                    } else {
                        console.log(chalk.yellow('\u2718 Couldn’t compress `' + file + '` any further'));
                    }
                } else {
                    if (body.error === 'TooManyRequests') {
                        console.log(chalk.red('\u2718 Compression failed for `' + file + '` as your monthly limit has been exceeded'));
                        keyArray.shift();
                        key = keyArray[0];
                        await compress(unique);
                    } else if (body.error === 'Unauthorized') {
                        console.log(chalk.red('\u2718 Compression failed for `' + file + '` as your credentials are invalid'));
                    } else {
                        console.log(chalk.red('\u2718 Compression failed for `' + file + '`'));
                    }
                }
            } else {
                console.log(chalk.red('\u2718 Got no response for `' + file + '`'));
            }
        }));
    });
}

//比较两个文件的MD5
async function mergeFileByMd5(oldFilePath, newFilePath) {
    let oldFile = await fsExc.readFile(oldFilePath);
    let newFile = await fsExc.readFile(newFilePath);
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

//获得compress路径名
function changeFileName(fileName, orginalName, targetName) {
    let nameArray = fileName.split(path.sep);
    let fileFolder = '';
    for (let i = 0; i < nameArray.length; i++) {
        const element = nameArray[i];
        if (element == orginalName) {
            nameArray[i] = targetName;
        }
        if (i != nameArray.length) {
            fileFolder += nameArray[i] + '\\';
        }
    }
    return fileFolder;
}

//fromPath：项目的resource文件夹  targetPath:备份origin文件夹，fileCompressPath:压缩文件夹
async function compareRes(fromPath, targetPath) {
    let oldFileExist = await fsExc.exists(fromPath);
    let newFileExist = await fsExc.exists(targetPath);
    let fileTargetName = path.dirname(targetPath);
    let compressTargetName = changeFileName(targetPath, 'originalPic', 'compress');
    let fileCompressPath = path.dirname(compressTargetName);
    if (!newFileExist) {
        // console.log(`--> 文件路径不存在，添加文件，${targetPath}`);
        await fsExc.copyFile(fromPath, fileTargetName);
        await fsExc.copyFile(targetPath, fileCompressPath);
        await compressPic(compressTargetName);
        return;
    }

    if (!oldFileExist) {
        console.log(`--> 文件路径不存在， ${fromPath}`);
    }

    let fileEqual = false;
    if (oldFileExist) {
        fileEqual = await mergeFileByMd5(fromPath, targetPath);
    }

    if (!fileEqual) {
        await fsExc.copyFile(fromPath, fileTargetName);
        await fsExc.copyFile(targetPath, fileCompressPath);
        await compressPic(compressTargetName);
    } else {
        //
    }

}

//比较两个路径文件
export async function compareFile(fromPath, targetPath) {
    try {
        await fsExc.makeDir(targetPath);
        let files = await fsExc.readDir(fromPath);
        for (const file of files) {
            let fromPathName = path.join(fromPath, file);
            let targetPathName = path.join(targetPath, file);
            let isDirectory = await fsExc.isDirectory(fromPathName);
            if (isDirectory) {
                await compareFile(fromPathName, targetPathName);
            } else {
                await compareRes(fromPathName, targetPathName);
            }
        }
    } catch (error) {
        Global.snack(`压缩 ${fromPath} 到 ${targetPath} 错误`, error);
    }
}


