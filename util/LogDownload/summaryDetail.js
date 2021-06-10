function addScript(url, tAttributes) {
    var script = document.createElement('script');
    script.setAttribute('src', url);

    if (tAttributes) {
        for (const iterator of tAttributes) {
            script.setAttribute(iterator.key, iterator.value);
        }
    }
    document.getElementsByTagName('head')[0].appendChild(script);
}

addScript('layui/layui.js', [{ "key": "charset", "value": "utf-8" }, { "key": "onload", "value": "init()" }]);

let playerNameInput = document.getElementById('playerNameInput');
let realNameInput = document.getElementById('realNameInput');
let playerIdInput = document.getElementById('playerIdInput');
let playerActIdInput = document.getElementById('playerActIdInput');
let showNameSearch = document.getElementById('showNameSearch');
let timeRange = document.getElementById('timeRange');
let findBtn = document.getElementById('find');
let isAutoBtn = document.getElementById('isAutoBtn');


playerNameInput.onkeydown = enterSearch;
realNameInput.onkeydown = enterSearch;
playerIdInput.onkeydown = enterSearch;
playerActIdInput.onkeydown = enterSearch;
showNameSearch.onkeydown = enterSearch;

findBtn.onclick = refreshFiles;
isAutoBtn.onclick = isAutoBtnClick;

const btnType = {
    'autoLog': {
        'text': '自动上传',
        "class": "layui-btn",
        "value": 1,
    },
    'volunteer': {
        'text': '主动上传',
        "class": "layui-btn layui-btn-warm",
        "value": 0,
    }
}

function init() {
    initLayDate();
    initLayTable();
}

function initLayDate() {
    laydate.render({
        elem: '#timeRange'
        , range: true
    });
}

function isAutoBtnClick() {
    if (+isAutoBtn.value) {
        const changeToVolunteerData = btnType.volunteer;
        isAutoBtn.innerText = changeToVolunteerData.text;
        isAutoBtn.value = changeToVolunteerData.value;
        isAutoBtn.className = changeToVolunteerData.class;
    } else {
        const changeToAutoData = btnType.autoLog;
        isAutoBtn.innerText = changeToAutoData.text;
        isAutoBtn.value = changeToAutoData.value;
        isAutoBtn.className = changeToAutoData.class;
    }
    refreshFiles();
}
let summaryInfoUrl;
function initLayTable() {
    layui.use('table', function () {
        //方法级渲染
        layui.table.render({
            elem: '#layuiTable'
            , url: summaryInfoUrl
            , where: {
                isAuto: +isAutoBtn.value
            }
            , request: {
                limitName: 'num' //每页数据量的参数名，默认：limit
            }
            , parseData: function (tRes) { //res 即为原始返回的数据
                if (tRes && tRes["file_list"]) {
                    const fileList = tRes["file_list"];
                    for (let index = 0; index < fileList.length; index++) {
                        let file = fileList[index];
                        if (file.text) {
                            const textJson = JSON.parse(file.text);
                            if (textJson) {
                                const summaryFile = JSON.parse(textJson.fileContent);
                                file = { ...file, ...summaryFile };
                            }
                        }
                        file.showTime = file.time && new Date(file.time).toLocaleString();
                        fileList[index] = file;
                    }
                    return {
                        "code": 0, //解析接口状态
                        "msg": "", //解析提示文本
                        "count": tRes.all_num, //解析数据长度
                        "data": fileList //解析数据列表
                    };
                } else {
                    return {
                        "msg": "暂无数据"
                    };
                }
            }
            , cols: [[
                { checkbox: true, fixed: true }
                , { field: 'playerName', title: '用户名' }
                , { field: 'realName', title: '真实姓名' }
                , { field: 'playerId', title: 'playerId' }
                , { field: 'actId', title: 'actId' }
                , { field: 'showTime', title: '日期' }
                , { field: 'describe', title: '问题描述' }
            ]]
            , id: 'layuiTable'
            , page: true
            , height: "full-200"
        });
    });
}

function enterSearch() {
    var event = window.event || arguments.callee.caller.arguments[0];
    if (event.keyCode == 13) {
        refreshFiles();
    }
}

function refreshFiles() {
    let timeInfoArr = timeRange.value.split('-');
    let startDate, endDate;
    if (timeInfoArr.length == 6) {
        startDate = new Date();
        startDate.setFullYear(+timeInfoArr[0], +timeInfoArr[1] - 1, +timeInfoArr[2] - 1);
        startDate.setHours(23, 59, 59);
        endDate = new Date();
        endDate.setFullYear(+timeInfoArr[3], +timeInfoArr[4] - 1, +timeInfoArr[5] + 1);
        endDate.setHours(0, 0, 0);
    }

    layui.use('table', function () {
        layui.table.reload('layuiTable', {
            url: summaryInfoUrl
            , where: { //请求参数（注意：这里面的参数可任意定义，并非下面固定的格式）
                match: showNameSearch.value || '',
                isAuto: +isAutoBtn.value,
                startTime: startDate && startDate.getTime() || 0,
                endTime: endDate && endDate.getTime() || 0,
                playerName: playerNameInput.value || '',
                realName: realNameInput.value || '',
                actId: playerActIdInput.value || '',
                playerId: playerIdInput.value || '',
            }
        });
    })
}