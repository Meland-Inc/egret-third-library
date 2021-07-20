let btnDownLoad = document.getElementById('download');
btnDownLoad.onclick = getClipboard;

let logView = document.getElementById('logView');
function refreshLog(tContent, tDetail = "") {
    logView.innerHTML = `<span style="color:#ed1941;">${tContent}</span>` + `<span style="color:#2468a2;">${tDetail}</span>`;
}

function downloadByBase64(tBase64Str) {
    const realStr = decode(tBase64Str);
    const info = realStr.split("/");
    if (!info || info.length != 2) {
        window.refreshLog(`数据解析错误`);
        return;
    }
    const enviornment = info[0];
    const url = info[1];
    const summaryUrl = getConfigUrl(enviornment, 'summaryHost', 'summaryPath');
    clientUrl = getConfigUrl(enviornment, 'downloadHost', 'clientLogPath');
    nativeLogUrl = getConfigUrl(enviornment, 'downloadHost', 'nativeLogPath');
    if (!summaryUrl) {
        window.refreshLog(`${enviornment}日志上报环境暂不支持`);
    } else {
        window.refreshLog(`正在获取summary信息  `, `环境：${enviornment}, 日志名：${url}`);
        getSummaryInfo(summaryUrl, url)
    }
}

function getClipboard() {
    if (window.navigator["clipboard"]) {

        window.navigator["clipboard"].readText()
            .then((tText) => {
                window.refreshLog(`获取到粘贴板数据`, `数据：${tText}`);
                downloadByBase64(tText);
            })
            .catch(() => {
                window.refreshLog(`获取粘贴板数据失败`);
            });
    }
}

function getSummaryInfo(summaryUrl, fileName) {
    $.get(summaryUrl + `?page=1&num=1&isAuto=1&match=${fileName}`
        , (tContent) => {
            const content = JSON.parse(tContent);
            if (content && content.file_list && content.file_list.length > 0) {
                window.refreshLog(`获取summary数据成功,准备下载`);
                const summaryInfo = content.file_list[content.file_list.length - 1];
                downloadBySummaryInfo(summaryInfo);
                console.error(summaryInfo)
            } else {
                window.refreshLog(`获取summary数据失败 `, `   日志名：${fileName}`);
            }
        }).error(() => {
            window.refreshLog(`获取summary数据失败  `, `   日志名：${fileName}`);
        })
}

function downloadBySummaryInfo(summaryInfo) {
    if (summaryInfo.text) {
        const textJson = JSON.parse(summaryInfo.text);
        if (textJson) {
            const summaryFile = JSON.parse(textJson.fileContent);
            summaryInfo = { ...summaryInfo, ...summaryFile };
        }
    }
    downLoadBySummaryUrlArr([summaryInfo]);
}

function decode(base64) {
    try {
        const target = base64.replace(/[\s+\"\']/g, "");
        // 对base64转编码
        const decode = atob(target);
        // 编码转字符串
        const str = decodeURI(decode);
        return str;
    } catch (error) {
        return "";
    }
}
