function addScript(url, tAttributes) {
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', url);

    document.getElementsByTagName('head')[0].appendChild(script);
}
addScript('jszip.js');
addScript('FileSaver.js');
let progressCb;
let clientUrl;
let nativeLogUrl;
let downLoadBtn = document.getElementById('download');
downLoadBtn.onclick = downloadLog;

/**下载*/
function downloadLog() {
    const tableStatus = layui.table.checkStatus('layuiTable');
    const downloadFiles = tableStatus && tableStatus.data && tableStatus.data.length ? tableStatus.data : [];
    downLoadBySummaryUrlArr(downloadFiles);
}

function downLoadBySummaryUrlArr(downloadFiles) {
    if (downloadFiles.length > 0) {
        var zip = new JSZip();

        let checkIsEnd = (tIndex) => {
            if (tIndex == downloadFiles.length - 1) {
                refreshProgress('开始压缩');
                zip.generateAsync({ type: "blob" })
                    .then(function (content) {
                        let downLoadTime = getFileName(downloadFiles[0]);
                        if (tIndex) {
                            const date = new Date();
                            downLoadTime = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}`;
                        }
                        saveAs(content, downLoadTime + ".zip");
                        refreshProgress(`下载   ${downLoadTime + ".zip"}`);
                    })
                    .catch((data) => {
                        console.error(data);
                    })
            } else {
                curGetFile++;
                getNextFile();
            }
        }

        let getFile = (fileInfo, index) => {
            refreshProgress(`写入    ${fileInfo.name}`);
            const deferred = [];
            const folder = zip.folder(`${getFileName(fileInfo)}_${new Date().getTime()}`);

            const webLogDeferred = [];
            const uploadedLogContentArr = [];
            if (fileInfo.uploadedName && fileInfo.uploadedName.length) {
                fileInfo.uploadedName.forEach((tClientUploadedLogName, tNameIndex) => {
                    webLogDeferred.push(getContentPromise(clientUrl + tClientUploadedLogName, uploadedLogContentArr, tNameIndex));
                })
            }

            deferred.push(Promise.all(webLogDeferred)
                .finally(() => {
                    let webLog = '';
                    for (const content of uploadedLogContentArr) {
                        webLog += content;
                    }
                    deferred.push(folder.file(`webLog.log`, webLog))
                })
            )

            fileInfo.describe && deferred.push(folder.file(`describe.txt`, fileInfo.describe));
            if (fileInfo.cloudServerAppIdArr && fileInfo.cloudServerAppIdArr.length) {
                deferred.push(folder.file(`cloudServerAppId.txt`, JSON.stringify(fileInfo.cloudServerAppIdArr)));
            }
            if (fileInfo.image && fileInfo.image.length) {
                fileInfo.image.forEach((tImg, tIndex) => {
                    deferred.push(folder.file(`${tIndex}.png`, tImg.replace(/^data:image[^;]*;base64,/, ""), { base64: true }));
                })
            }
            const nativeLogDeferred = [];
            const logContentArr = [];
            //native的相关日志
            if (fileInfo.nativeLogNameArr && fileInfo.nativeLogNameArr.length) {
                fileInfo.nativeLogNameArr.forEach((tNativeLogName, nativeLogNameArrIndex) => {
                    tNativeLogName.forEach((tFileName, tFileIndex) => {
                        let contentArr = logContentArr[nativeLogNameArrIndex];
                        if (!contentArr) {
                            contentArr = [];
                            logContentArr[nativeLogNameArrIndex] = contentArr;
                        }
                        nativeLogDeferred.push(getContentPromise(nativeLogUrl + tFileName, contentArr, tFileIndex));
                    });
                })

                deferred.push(Promise.all(nativeLogDeferred)
                    .finally(() => {
                        fileInfo.nativeLogNameArr.forEach((tNativeLogName, nativeLogNameArrIndex) => {
                            let log = '';
                            const contentArr = logContentArr[nativeLogNameArrIndex];
                            if (contentArr) {
                                for (const content of contentArr) {
                                    log += content;
                                }
                            }
                            const filename = /.*_(.*)\.log/g.exec(tNativeLogName)[1];
                            deferred.push(folder.file(`${filename}.log`, log))
                        })
                    })
                )
            }

            const webAdditionDeferred = [];
            const webAdditionContentArr = [];
            if (fileInfo.webAddition && fileInfo.webAddition.length) {
                fileInfo.webAddition.forEach((tAdditonLogName, tNameIndex) => {
                    webAdditionDeferred.push(getContentPromise(clientUrl + tAdditonLogName, webAdditionContentArr, tNameIndex));
                })
                deferred.push(Promise.all(webAdditionDeferred)
                    .finally(() => {
                        fileInfo.webAddition.forEach((tFileName, tIndex) => {
                            let log = webAdditionContentArr[tIndex];
                            const filename = /key-(.*)\.log/g.exec(tFileName)[1];
                            deferred.push(folder.file(`webAddition/${filename}.log`, log))
                        })
                    })
                )
            }

            const nativeAdditionDeferred = [];
            const nativeAdditionContentArr = [];
            if (fileInfo.nativeAddition && fileInfo.nativeAddition.length) {
                fileInfo.nativeAddition.forEach((tAdditonLogName, tNameIndex) => {
                    nativeAdditionDeferred.push(getContentPromise(nativeLogUrl + tAdditonLogName, nativeAdditionContentArr, tNameIndex));
                })
                deferred.push(Promise.all(nativeAdditionDeferred)
                    .finally(() => {
                        fileInfo.nativeAddition.forEach((tFileName, tIndex) => {
                            let log = nativeAdditionContentArr[tIndex];
                            const filename = /key-(.*)\.log/g.exec(tFileName)[1];
                            deferred.push(folder.file(`nativeAddition/${filename}.log`, log))
                        })
                    })
                )
            }

            Promise.all(deferred).finally(() => {
                checkIsEnd(index);
            })
        }
        var fieldNum = downloadFiles.length;
        let curGetFile = 0;
        let getNextFile = () => {
            if (curGetFile <= fieldNum) {
                const fileInfo = downloadFiles[curGetFile];
                getFile(fileInfo, curGetFile);
            }
        }
        getNextFile();
    } else {
        refreshProgress('暂无可下载内容');
    }
}

function setDownloadProgressCB(tCb) {
    progressCb = tCb;
}

function refreshProgress(tContent) {
    progressCb && progressCb(tContent);
}

function getFileName(tFileInfo) {
    if (!tFileInfo) return;
    let fileName = '';
    if (tFileInfo.playerName) {
        fileName += tFileInfo.playerName;
    } else if (tFileInfo.realName) {
        fileName += tFileInfo.realName;
    }
    if (tFileInfo.showTime) {
        fileName += tFileInfo.showTime.replace(/\//g, '_');
    }
    if (!fileName) {
        fileName = new Date().toLocaleString().replace(/\//g, '_');
    }
    return fileName;
}

function getContentPromise(tUrl, tContentArr, tIndex) {
    return new Promise((resolve, reject) => {
        $.get(tUrl
            , (tContent) => {
                tContentArr[tIndex] = tContent;
                resolve();
            }).error(() => {
                resolve();
            })
    })
}