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
                { checkbox: true, fixed: true }
                , { field: 'Sid', title: 'Sid', width: '5%' }
                , { title: '报告', toolbar: '#barDemo', width: 70 }
                , { field: 'Report', title: 'Report' }
                , { field: 'Time', title: 'Time', width: '10%' }
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
        // startDate = new Date();
        // startDate.setFullYear(+timeInfoArr[0], +timeInfoArr[1] - 1, +timeInfoArr[2] - 1);
        // startDate.setHours(23, 59, 59);
        // endDate = new Date();
        // endDate.setFullYear(+timeInfoArr[3], +timeInfoArr[4] - 1, +timeInfoArr[5] + 1);
        // endDate.setHours(0, 0, 0);
    }


    const url = new URL(httpUrl);
    idInput.value && url.searchParams.append('id', idInput.value);
    startDate && url.searchParams.append('time_start', startDate);
    endDate && url.searchParams.append('time_end', endDate);
    $.get(url.toString()
        , (tContent) => {
            let data;
            try {
                data = JSON.parse(tContent)
            } catch (error) {
                data = [];
            }
            for (const iterator of data) {
                const a = document.createElement("a");
                a.href = iterator.AirReport;
                iterator.AirReport = a;
            }
            initLayTable(data);
        }).error(() => {
            console.error('获取数据失败');
        })
}