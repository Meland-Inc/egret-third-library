import { ModelMgr } from "./model/ModelMgr";
import * as fs from 'fs';
import * as qiniu from "qiniu";
import * as fsExc from "./FsExecute.js";

let maxUploadCount = 10;
/** 创建要上传的物件路径数组 */
export async function createUploaderFilePathArr(rootPath, filePathArr) {
    let files = await fsExc.readDir(rootPath);
    for (const iterator of files) {
        let fullPath = `${rootPath}/${iterator}`;
        let isFolder = await fsExc.isDirectory(fullPath);
        if (isFolder) {
            await createUploaderFilePathArr(fullPath, filePathArr);
        } else {
            filePathArr.push(fullPath);
        }
    }
}

/** 检查批量上传文件 */
export function checkUploaderFiles(rootPath, filePathArr, cdnRoot, uploadCount, resolve, reject) {
    if (uploadCount > maxUploadCount) return;
    if (filePathArr.length == 0) return;

    let filePath = filePathArr.shift();
    let fileKey = filePath.split(`${rootPath}/`)[1];
    uploadCount++;
    checkUploaderFile(filePath, fileKey, cdnRoot,
        () => {
            uploadCount--;
            if (filePathArr.length != 0) {
                checkUploaderFiles(rootPath, filePathArr, cdnRoot, uploadCount, resolve, reject);
            } else {
                if (resolve) {
                    resolve();
                    console.log(`上传cdn完成`);
                }
            }
        });
}

/** 检查上传单个文件 */
export function checkUploaderFile(filePath, fileKey, cdnRoot, successFunc) {
    uploaderFile(filePath, fileKey, cdnRoot,
        () => {
            successFunc();
        },
        () => {
            console.log(`cdn --> upload ${fileKey} fail, 3 seconds later retry`);
            setTimeout(() => {
                checkUploaderFile(filePath, fileKey, cdnRoot, successFunc);
            }, 3000);
        });
}

/** 上传单个文件 */
export function uploaderFile(filePath, fileKey, cdnRoot, successFunc, failFunc) {
    let formUploader = new qiniu.form_up.FormUploader(ModelMgr.ftpModel.qiniuConfig);
    let uploadToken = ModelMgr.ftpModel.uploadToken;
    if (cdnRoot) {
        fileKey = `${cdnRoot}/${fileKey}`;
    }
    let readerStream = fs.createReadStream(filePath);
    let putExtra = new qiniu.form_up.PutExtra();

    formUploader.putStream(uploadToken, fileKey, readerStream, putExtra, (rspErr, rspBody, rspInfo) => {
        if (rspErr) {
            //单个文件失败
            console.error(rspErr);
            console.error(`cdn --> upload ${fileKey} error`);
            failFunc();
            return;
        }

        //200:成功 614:文件重复
        if (rspInfo.statusCode != 200 && rspInfo.statusCode != 614) {
            console.log(rspInfo.statusCode);
            console.log(rspBody);
            failFunc();
            return;
        }

        console.log(`cdn --> upload ${fileKey} success`);
        successFunc();
    });
}