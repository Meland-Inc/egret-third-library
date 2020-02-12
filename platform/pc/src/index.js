let http = require('http');
let url = require('url');
let fs = require('fs');
let util = require('./util.js');
let globalConfig = require('./globalConfig.js');

let nativeCnf;

async function init() {
    await initNativeCnf();
    createHttpServer();
}

/** 初始化native配置 */
async function initNativeCnf() {
    let content = await fs.readFileSync(globalConfig.nativeCnfPath, "utf-8");
    nativeCnf = JSON.parse(content);
}

/** 创建本地http服务器 */
function createHttpServer() {
    console.log(`[log] --> 启动native服务器`);

    let server = http.createServer();
    server.listen(0);
    server.on('listening', async () => {
        globalConfig.nativeServerPort = server.address().port;
        console.log(`[log] --> 启动native服务器完毕,端口:${globalConfig.nativeServerPort}`);

        await writeCnfValue("nativePort", globalConfig.nativeServerPort + "");
        await runGameServer();
    });

    // console.log(`--> 启动native服务器2333端口`);
    // globalConfig.nativeServerPort = 2333;
    // server.listen(globalConfig.nativeServerPort)
    // runGameServer();

    server.on('request', (req, res) => {
        let urlObj = url.parse(req.url, true);
        let args = urlObj.query;  //方法一arg => aa=001&bb=002
        let clientArg = `&fakeGameMode="lessons"`
        let serverArg = `&gameServer=${globalConfig.localIp}:${globalConfig.gameServerPort}`;
        let pathname = urlObj.pathname;
        if (pathname === "/getPort") {
            // res.writeHead(302, { 'Location': "http://www.baidu.com" });
        }

        if (pathname === "/serverState") {
            if (globalConfig.gameServerInited) {
                res.end();
                return;
            }
            globalConfig.gameServerInited = true;

            // args.channel
            // args.ip
            // args.name
            // args.port
            // args.snode
            // args.token

            //snode=服务器Id&channel=lesson&token=%s&name=服务器名&port=%服务器port&ip=服务器ip

            console.log(`[log] --> 收到服务器启动完毕消息`);
            console.log(`[log] --> 跳转到游戏渲染地址`);
            // let id = req.params.id;
            // res.locals.id = id;
            // res.status(500).render(`./renderer/renderer.html?${clientArg}${serverArg}`);

            res.writeHead(200, {
                'Content-Type': 'text/html'
            });

            let rendererPath = `${globalConfig.rootPath}/src/renderer/renderer.html?${clientArg}${serverArg}`
            // fs.readFile(rendererPath, 'utf8', function (err, data) {
            //     if (err) {
            //         throw err;
            //     }
            //     res.end(data);
            // });
            // return;


            // res.writeHead(302, { 'Location': rendererPath });
            window.location.href = rendererPath;
            // res
            // console.log(`res`, res);
        }

        // res.end('hello world !');
        res.end();
    })
}

/** 启动游戏服务器 */
async function runGameServer() {
    console.log(`[log] --> 启动游戏服务器`);
    let cmd = `game.exe`;
    await util.runCmd(cmd, `${globalConfig.rootPath}/package/server/`, "启动游戏服务器成功", "启动游戏服务器失败");
}

async function writeCnfValue(key, value) {
    nativeCnf[key] = value;
    await fs.writeFileSync(globalConfig.nativeCnfPath, JSON.stringify(nativeCnf, null, 4));
}

init();