const http = require('http');
const url = require('url');
const fs = require('fs');
const config = require('./config.js');
const util = require('./util.js');
const logger = require('./logger.js');

let nativeCnf;

async function init() {
    await initNativeCnf();
    createHttpServer();
}

/** 初始化native配置 */
async function initNativeCnf() {
    let content = await fs.readFileSync(config.nativeCnfPath, "utf-8");
    nativeCnf = JSON.parse(content);
}

/** 创建本地http服务器 */
function createHttpServer() {
    logger.log('net', '启动native服务器');

    let server = http.createServer();
    server.listen(0);
    server.on('listening', async () => {
        config.nativeServerPort = server.address().port;
        logger.log('net', '启动native服务器完毕,端口号', config.nativeServerPort);

        await writeCnfValue("nativePort", config.nativeServerPort + "");
        await runGameServer();
    });

    server.on('request', (req, res) => {
        let urlObj = url.parse(req.url, true);
        let args = urlObj.query;
        let clientArg = `&fakeGameMode=lessons`
        // let serverArg = `&gameChannel=${args.channel}&gameServer=${args.ip}:${args.port}`;
        let serverArg = `&gameServer=${args.ip}:${args.port}`;
        let pathname = urlObj.pathname;
        if (pathname === "/serverState") {
            if (config.gameServerInited) {
                res.end();
                return;
            }
            config.gameServerInited = true;

            logger.log('net', '收到服务器启动完毕消息');
            logger.log('net', '跳转到游戏渲染地址');

            let rendererPath = `${config.rootPath}/src/renderer/renderer.html?${clientArg}${serverArg}`

            // res.writeHead(302, { 'Location': rendererPath });
            window.location.href = rendererPath;
            //关闭服务器推送
            let path = `/native?controlType=receiveStart`;
            util.requstGameServerHttp(path, () => {
                logger.log('net', `关闭服务器启动推送成功`)
            }, () => {
                logger.error('net', `关闭服务器启动推送错误`)
            });
        }

        // res.end('hello world !');
        res.end();
    })
}

/** 启动游戏服务器 */
async function runGameServer() {
    logger.log('net', '启动游戏服务器');
    let cmd = `game.exe`;
    await util.runCmd(cmd, `${config.rootPath}/package/server/`, "启动游戏服务器成功", "启动游戏服务器失败");
}

async function writeCnfValue(key, value) {
    nativeCnf[key] = value;
    await fs.writeFileSync(config.nativeCnfPath, JSON.stringify(nativeCnf, null, 4));
}

init();