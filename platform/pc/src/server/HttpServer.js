// import * as config from '../config.js';
let http = require('http');
let url = require('url');
let fs = require('fs');

// function getProtocol(req) {
//     if (req.socket.encrypted) return 'https';
//     var proto = "http";
//     if (req.headers['x-client-scheme'] && req.headers['x-client-scheme'] === 'https') {
//         proto = 'https';
//     } else if (req.headers['x-scheme'] && req.headers['x-scheme'] === 'https') {
//         proto = 'https';
//     } else if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] === 'https') {
//         proto = 'https';
//     } else if (req.headers['X-Forwarded-Proto'] && req.headers['X-Forwarded-Proto'] === 'https') {
//         proto = 'https';
//     }
//     return proto.split(/\s*,\s*/)[0];
// }

export function startServer() {
    let server = http.createServer(async (req, res) => {
        args = url.parse(req.url).query;  //方法一arg => aa=001&bb=002
        let href = `./client/index.html`;
        if (args && args != "") {
            href += `?${args}`;
        }

        // protoPrefix = getProtocol(req);


        // var pathname = url.parse(req.url).pathname;;
        //客户端输入的url，例如如果输入localhost:8888/index.html，那么这里的url == /index.html 
        //url.parse()方法将一个URL字符串转换成对象并返回，通过pathname来访问此url的地址。

        //完整的url路径
        fs.readFile(`${href}`, (err, data) => {
            /*
            realPath为文件路径
            第二个参数为回调函数
                回调函数的一参为读取错误返回的信息，返回空就没有错误
                二参为读取成功返回的文本内容
            */
            if (err) {
                //未找到文件
                res.writeHead(404, {
                    'content-type': 'text/plain;charset="utf-8"'
                });
                res.write('404,页面不在');
                res.end();
            } else {
                //成功读取文件
                res.writeHead(200, {
                    'content-type': 'text/html;charset="utf-8"'
                });
                res.write(data);
                res.end();
            }
        });
    })

    // server.listen(config.teleport);
    server.listen(2333);
}