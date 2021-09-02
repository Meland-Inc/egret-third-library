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

const url = new URL(location.href);
const host = url.searchParams.get('host') || "47.107.73.43:10002";
let idInput = document.getElementById('idInput');
let timeRange = document.getElementById('timeRange');
let findBtn = document.getElementById('btnFind');

idInput.onkeydown = enterSearch;

findBtn.onclick = refreshFiles;

function init() {
    initLayDate();
    const url = new URL(location.href);
    initData(url.searchParams.get('start'), url.searchParams.get('id'), url.searchParams.get('end'));
}

function initLayDate() {
    laydate.render({
        elem: '#timeRange'
        , range: true
    });
}

let httpUrl = `http://${host}/getAirReportByWeb`;

function initLayTable(tData) {
    layui.use('table', function () {
        //方法级渲染
        layui.table.render({
            elem: '#layuiTable'
            , data: tData
            , cols: [[
                , { field: 'Name', title: '课程名称', width: 200 }
                , { title: '报告', toolbar: '#barDemo', width: 70 }
                , {
                    field: 'Report', title: 'Report', templet: function (d) {
                        if (!d.detail) return '';
                        let result = '';
                        for (const iterator of d.detail) {
                            result += `<span onclick=showImg(${JSON.stringify(iterator.img)})>` + iterator.desc + '</span>' + '&nbsp'.repeat(10);
                        }
                        return result;
                    }
                }
                , { field: 'Time', title: '时间', width: '11%' }
            ]]
            , id: 'layuiTable'
            , limit: tData.length
        });

        //监听行工具事件
        layui.table.on('tool(user)', function (obj) {
            var data = obj.data;
            if (obj.event === 'href') {
                window.open(data.AirReport);
            }
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
    let startDate = '';
    let endDate = '';
    if (timeInfoArr.length == 6) {
        for (let index = 0; index < 3; index++) {
            startDate += timeInfoArr[index].trim();
        }
        for (let index = 3; index < 6; index++) {
            endDate += timeInfoArr[index].trim();
        }
    }

    const url = new URL(httpUrl);
    idInput.value && url.searchParams.append('id', idInput.value.trim());
    startDate && url.searchParams.append('time_start', startDate);
    endDate && url.searchParams.append('time_end', endDate);
    refreshDataByUrl(url);
}

function initData(tStartTime, tId, tEndTime) {
    const url = new URL(httpUrl);
    tId && url.searchParams.append('id', tId);

    const startTime = tStartTime || tEndTime;
    const endTime = tEndTime || tStartTime;

    startTime && url.searchParams.append('time_start', startTime);
    endTime && url.searchParams.append('time_end', endTime);
    refreshDataByUrl(url);
}

function refreshDataByUrl(url) {
    $.get(url.toString()
        , (tContent) => {
            let data;
            try {
                data = JSON.parse(tContent)
            } catch (error) {
                data = [];
            }
            for (const iterator of data) {
                const year = iterator.Time.substr(0, 4) + '年/';
                const month = iterator.Time.substr(4, 2) + '月/';
                const day = iterator.Time.substr(6, 2) + '日/';
                const hour = iterator.Time.substr(8, 2) + ':';
                const minute = iterator.Time.substr(10);
                iterator.Time = year + month + day + hour + minute;
            }
            initReport(data);
        }).error(() => {
            console.error('获取数据失败');
        })
}

function initReport(tData) {
    const promiseArr = [];
    for (const iterator of tData) {
        promiseArr.push(setReportPromise(iterator));
    }

    Promise.all(promiseArr).finally(() => {
        initLayTable(tData);
    })
}

function setReportPromise(iterator) {
    return new Promise((resolve, reject) => {
        const url = iterator.AirReport;
        const urlHead = url.match(/(.*)log\.html/)[1];

        $.get(url
            , (tContent) => {
                const data = JSON.parse(tContent.match(/data = (.*);/)[1]);
                const detail = [];
                if (data && data.steps) {

                    let index = 1;
                    for (const step of data.steps) {
                        if (step.traceback) {
                            let imgArr = [];
                            for (const arg of step.code.args) {
                                if (arg.image) {
                                    imgArr.push(urlHead + arg.image);
                                }
                            }
                            step.screen && imgArr.push(urlHead + step.screen.src);
                            detail.push({ desc: `Step ${index}:${step.desc || step.assert}`, img: imgArr });
                        }
                        index++;
                    }
                }
                iterator.detail = detail;
                resolve();
            }).error(() => {
                resolve();
            })
    })
}


function showImg(tData) {
    const imgArr = getImgArr(tData);
    layer.tab({
        area: ['100%', '100%'],
        tab: imgArr,
    });
}

function getImgArr(tData) {
    let result = [];
    for (let index = 0; index < tData.length; index++) {
        const element = tData[index];
        result.push({ content: `<img src="${element}" >`, title: index });
    }
    return result;
}