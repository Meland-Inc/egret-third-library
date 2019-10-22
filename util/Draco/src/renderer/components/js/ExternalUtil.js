import * as http from 'http';
import * as crypto from 'crypto';

export function getPolicyInfo(versionName) {
    return new Promise((resolve, reject) => {
        let time = Math.floor(new Date().getTime() / 1000);
        let due = 1800;
        let token = "*";
        let channel = "bian_game"
        // let token = crypto
        //     .createHash('md5')
        //     .update(tokenStr)
        //     .digest('hex');

        let getData = `?versionName=${versionName}&&channel=${channel}&&time=${time}&&due=${due}&&token=${token}`

        let options = {
            host: '47.107.73.43', // 请求地址 域名，google.com等..
            port: 10001,
            path: "/getVersion" + getData, // 具体路径eg:/upload
            method: 'GET', // 请求方式, 这里以post为例
            headers: { // 必选信息,  可以抓包工看一下
                'Content-Type': 'application/json'
            }
        };
        http.get(options, (response) => {
            let resData = "";
            response.on("data", (data) => {
                resData += data;
            });
            response.on("end", () => {
                console.log(resData);
                resolve(resData);
            });
        })
    });
}

export function applyPolicyNum(policyNum, versionName, channel) {
    return new Promise((resolve, reject) => {
        let time = Math.floor(new Date().getTime() / 1000);
        let secret = "LznauW6GzBsq3wP6";
        let due = 1800;
        let tokenStr = versionName + channel + time + secret + due;
        let token = crypto
            .createHash('md5')
            .update(tokenStr)
            .digest('hex');

        let getData = `?versionName=${versionName}&&channel=${channel}&&time=${time}&&due=${due}&&token=${token}&&version=${policyNum}`

        let options = {
            host: '47.107.73.43', // 请求地址 域名，google.com等..
            port: 10001,
            path: "/setVersion" + getData, // 具体路径eg:/upload
            method: 'GET', // 请求方式, 这里以post为例
            headers: { // 必选信息,  可以抓包工看一下
                'Content-Type': 'application/json'
            }
        };
        http.get(options, (response) => {
            let resData = "";
            response.on("data", (data) => {
                resData += data;
            });
            response.on("end", async () => {
                console.log(resData);
                resolve();
            });
        })
    });
}